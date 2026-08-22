import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icon";
import {
  loadAuditedRelationships,
  loadFoundationResourceSubset,
  loadManifest,
  loadMappingCoverage,
  loadOfficialOccupations,
} from "../../data/generatedDataClient";
import type {
  MappingCoverage,
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import type {
  SourceSnapshot,
  TrainingProgram,
} from "../../../data/schemas/generated";
import { loadApprovedMappings } from "../../domain/occupation";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import { OccupationCombobox } from "../occupation-first/OccupationCombobox";

type FreshnessState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      sourceLabel: string;
      date: string;
      dateTime: string;
      stale: boolean;
    };

type CoverageState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      programs: Extract<MappingCoverage, { scope: "program" }>[];
    };

type SearchDataState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      aliases: OccupationAlias[];
      occupations: Occupation[];
      programs: TrainingProgram[];
    };

type SearchMode = "fp" | "occupation";

const SEARCH_MODE_STORAGE_KEY = "salida-cyl:home-search-mode";

function initialSearchMode(): SearchMode {
  try {
    const savedMode = window.localStorage.getItem(SEARCH_MODE_STORAGE_KEY);
    return savedMode === "fp" || savedMode === "occupation" ? savedMode : "fp";
  } catch {
    return "fp";
  }
}

function featuredCoverage(
  programs: Extract<MappingCoverage, { scope: "program" }>[],
) {
  const families = new Set<string>();
  return [...programs]
    .sort(
      (left, right) =>
        left.programTitle.localeCompare(right.programTitle, "es") ||
        left.programKey.localeCompare(right.programKey),
    )
    .filter((program) => {
      if (families.has(program.familyCode)) return false;
      families.add(program.familyCode);
      return true;
    })
    .slice(0, 3);
}

export function HomePage() {
  const navigate = useNavigate();
  const [freshness, setFreshness] = useState<FreshnessState>({
    status: "loading",
  });
  const [coverage, setCoverage] = useState<CoverageState>({
    status: "loading",
  });
  const [searchData, setSearchData] = useState<SearchDataState>({
    status: "loading",
  });
  const [searchMode, setSearchMode] = useState<SearchMode>(initialSearchMode);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [confirmedOccupation, setConfirmedOccupation] =
    useState<Occupation | null>(null);
  const manifestPromiseRef = useRef<ReturnType<typeof loadManifest> | null>(
    null,
  );
  const getManifest = () => {
    if (manifestPromiseRef.current === null) {
      manifestPromiseRef.current = loadManifest();
    }
    return manifestPromiseRef.current;
  };

  useEffect(() => {
    let isActive = true;

    void getManifest()
      .then((manifest) => {
        if (!isActive) return;

        const snapshots =
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Partial<Record<"mappingCoverage", SourceSnapshot>>;
        const mappingSnapshot =
          snapshots.mappingCoverage ?? manifest.resourceSnapshots.jobOffers;
        const dateTime =
          mappingSnapshot.sourceUpdatedAt ?? mappingSnapshot.snapshotFetchedAt;
        setFreshness({
          status: "ready",
          sourceLabel: "Relaciones revisadas",
          date: new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(dateTime)),
          dateTime,
          stale:
            manifest.qualityStatus === "stale" ||
            mappingSnapshot.qualityStatus === "stale",
        });

        void loadMappingCoverage(manifest)
          .then((rows) => {
            if (!isActive) return;
            setCoverage({
              status: "ready",
              programs: rows.filter(
                (row): row is Extract<MappingCoverage, { scope: "program" }> =>
                  row.scope === "program" && row.coverageStatus === "reviewed",
              ),
            });
          })
          .catch(() => {
            if (isActive) setCoverage({ status: "unavailable" });
          });
      })
      .catch(() => {
        if (!isActive) return;
        setFreshness({ status: "unavailable" });
        setCoverage({ status: "unavailable" });
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    void getManifest()
      .then(async (manifest) => {
        const [foundation, relationships, officialOccupations] =
          await Promise.all([
            loadFoundationResourceSubset(manifest, ["programs"]),
            loadAuditedRelationships(manifest),
            loadOfficialOccupations(manifest),
          ]);
        const approved = loadApprovedMappings(relationships);
        const reviewedById = new Map(
          approved.occupations.map((occupation) => [
            occupation.occupationId,
            occupation,
          ]),
        );
        return {
          aliases: approved.aliases,
          occupations: officialOccupations.map((occupation) => ({
            ...occupation,
            confirmationLabel:
              reviewedById.get(occupation.occupationId)?.confirmationLabel ??
              occupation.confirmationLabel,
          })),
          programs: [...foundation.programs].sort(
            (left, right) =>
              left.programTitle.localeCompare(right.programTitle, "es") ||
              left.programKey.localeCompare(right.programKey),
          ),
        };
      })
      .then((resources) => {
        if (isActive) setSearchData({ status: "ready", ...resources });
      })
      .catch(() => {
        if (isActive) setSearchData({ status: "unavailable" });
      });
    return () => {
      isActive = false;
    };
  }, []);

  const featuredPrograms = useMemo(
    () =>
      coverage.status === "ready" ? featuredCoverage(coverage.programs) : [],
    [coverage],
  );
  const programsByKey = useMemo(
    () =>
      new Map(
        searchData.status === "ready"
          ? searchData.programs.map((program) => [program.programKey, program])
          : [],
      ),
    [searchData],
  );

  const selectSearchMode = (mode: SearchMode) => {
    setSearchMode(mode);
    try {
      window.localStorage.setItem(SEARCH_MODE_STORAGE_KEY, mode);
    } catch {
      // The choice still works for this visit when storage is unavailable.
    }
  };

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-heading">
        <div className="home-hero__art" aria-hidden="true" />
        <div className="home-hero__copy">
          <h1 id="home-heading">
            De tu <span>FP</span> a tu
            <br />
            <span>siguiente paso</span>
          </h1>
          <p>
            Conecta tu FP con ocupaciones y datos públicos, sin promesas de
            empleo.
          </p>
        </div>

        <div className="home-workspace">
          <section
            className="search-entry"
            aria-labelledby="search-entry-title"
          >
            <fieldset
              className="search-entry__modes"
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    event.key,
                  )
                ) {
                  return;
                }
                event.preventDefault();
                const nextMode =
                  event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? "fp"
                    : "occupation";
                selectSearchMode(nextMode);
                event.currentTarget
                  .querySelector<HTMLInputElement>(`input[value="${nextMode}"]`)
                  ?.focus();
              }}
            >
              <legend id="search-entry-title">
                ¿Cuál es tu punto de partida?
              </legend>
              <div className="search-entry__mode-options">
                <label
                  className="search-entry__mode"
                  data-selected={searchMode === "fp"}
                >
                  <input
                    type="radio"
                    name="home-search-mode"
                    value="fp"
                    checked={searchMode === "fp"}
                    onChange={() => selectSearchMode("fp")}
                  />
                  <span>
                    <strong>Tengo un título de FP</strong>
                    <small>
                      Dime en qué puedo trabajar con lo que ya he estudiado.
                    </small>
                  </span>
                </label>
                <label
                  className="search-entry__mode"
                  data-selected={searchMode === "occupation"}
                >
                  <input
                    type="radio"
                    name="home-search-mode"
                    value="occupation"
                    checked={searchMode === "occupation"}
                    onChange={() => selectSearchMode("occupation")}
                  />
                  <span>
                    <strong>Tengo un empleo en mente</strong>
                    <small>Dime qué FP me lleva hasta esa ocupación.</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {searchMode === "fp" ? (
              <form
                className="search-entry__panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (selectedProgram !== "") {
                    navigate(`/desde-fp/${selectedProgram}`);
                  }
                }}
              >
                <p className="search-entry__direction">
                  <span>Tu título de FP</span>
                  <Icon name="arrow-right" size={18} />
                  <strong>Ocupaciones con evidencia</strong>
                </p>
                {searchData.status === "ready" ? (
                  <>
                    <div className="search-entry__field">
                      <label htmlFor="home-program">
                        Título de Formación Profesional
                      </label>
                      <select
                        id="home-program"
                        value={selectedProgram}
                        onChange={(event) =>
                          setSelectedProgram(event.target.value)
                        }
                      >
                        <option value="">Elige un título</option>
                        {searchData.programs.map((program) => (
                          <option
                            key={program.programKey}
                            value={program.programKey}
                          >
                            {program.programTitle} ({program.programKey})
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedProgram === "" ? (
                      <p className="search-entry__hint" id="program-required">
                        Elige un título.
                      </p>
                    ) : null}
                    <button
                      className="search-entry__cta"
                      type="submit"
                      disabled={selectedProgram === ""}
                      aria-describedby={
                        selectedProgram === "" ? "program-required" : undefined
                      }
                    >
                      Ver las salidas de este título
                    </button>
                  </>
                ) : (
                  <>
                    <p className="form-message" role="status">
                      {searchData.status === "loading"
                        ? "Cargando el catálogo oficial de FP…"
                        : "El selector no está disponible ahora mismo."}
                    </p>
                    {searchData.status === "unavailable" ? (
                      <Link className="search-entry__fallback" to="/desde-fp">
                        Abrir buscador de FP
                      </Link>
                    ) : null}
                  </>
                )}
              </form>
            ) : (
              <form
                className="search-entry__panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (confirmedOccupation !== null) {
                    navigate(
                      `/desde-ocupacion/${encodeURIComponent(confirmedOccupation.occupationId)}`,
                    );
                  }
                }}
              >
                <p className="search-entry__direction">
                  <span>Ocupación que quieres</span>
                  <Icon name="arrow-right" size={18} />
                  <strong>FP que te lleva a ella</strong>
                </p>
                {searchData.status === "ready" ? (
                  <>
                    <OccupationCombobox
                      occupations={searchData.occupations}
                      aliases={searchData.aliases}
                      confirmedOccupation={confirmedOccupation}
                      onConfirm={setConfirmedOccupation}
                      onClear={() => setConfirmedOccupation(null)}
                      label="Ocupación que te interesa"
                      hint="Escribe y elige una ocupación."
                      showConfirmation={false}
                    />
                    {confirmedOccupation === null ? (
                      <p
                        className="search-entry__hint"
                        id="occupation-required"
                      >
                        Elige una ocupación de la lista.
                      </p>
                    ) : null}
                    <button
                      className="search-entry__cta"
                      type="submit"
                      disabled={confirmedOccupation === null}
                      aria-describedby={
                        confirmedOccupation === null
                          ? "occupation-required"
                          : undefined
                      }
                    >
                      Ver cómo llegar a esta ocupación
                    </button>
                  </>
                ) : (
                  <>
                    <p className="form-message" role="status">
                      {searchData.status === "loading"
                        ? "Cargando el catálogo oficial de ocupaciones…"
                        : "El buscador no está disponible ahora mismo."}
                    </p>
                    {searchData.status === "unavailable" ? (
                      <Link
                        className="search-entry__fallback"
                        to="/desde-ocupacion"
                      >
                        Abrir buscador de ocupaciones
                      </Link>
                    ) : null}
                  </>
                )}
              </form>
            )}
          </section>

          <aside
            className="coverage-panel"
            aria-label="Cobertura revisada"
            role="region"
            aria-live="polite"
            aria-busy={coverage.status === "loading"}
          >
            <div className="coverage-panel__heading">
              <h2>
                <Icon name="clock" size={19} />
                Cobertura revisada
              </h2>
              <span
                className="data-freshness"
                role="region"
                aria-label="Fecha de relaciones revisadas"
                aria-busy={freshness.status === "loading"}
              >
                {freshness.status === "loading" ? "Comprobando fecha…" : null}
                {freshness.status === "ready" ? (
                  <>
                    {freshness.sourceLabel}: copia del{" "}
                    <time dateTime={freshness.dateTime}>{freshness.date}</time>
                  </>
                ) : null}
                {freshness.status === "unavailable"
                  ? "Fecha no disponible"
                  : null}
              </span>
            </div>

            {coverage.status === "loading" ? (
              <p className="coverage-panel__message">
                Comprobando la cobertura revisada…
              </p>
            ) : null}
            {coverage.status === "unavailable" ? (
              <p className="coverage-panel__message">
                No se ha podido comprobar la cobertura revisada.
              </p>
            ) : null}
            {coverage.status === "ready" ? (
              <ul
                className="coverage-panel__programs"
                aria-label="Ciclos revisados destacados"
              >
                {featuredPrograms.map((program) => {
                  const catalogProgram = programsByKey.get(program.programKey);
                  return (
                    <li key={program.programKey}>
                      <Link to={`/desde-fp/${program.programKey}`}>
                        <span>
                          <strong>{program.programTitle}</strong>
                          <small>
                            {catalogProgram === undefined
                              ? program.programKey
                              : trainingLevelLabel(catalogProgram.level)}
                          </small>
                        </span>
                        <Icon name="arrow-right" size={17} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {coverage.status === "ready" ? (
              <p className="coverage-panel__scope">
                Ejemplos de ciclos con relaciones revisadas; no es el catálogo
                completo.
              </p>
            ) : null}

            {freshness.status === "ready" && freshness.stale ? (
              <p className="data-freshness__warning">
                Mostramos la última copia disponible.
              </p>
            ) : null}
            <Link className="coverage-panel__link" to="/metodologia">
              Ver toda la cobertura <Icon name="arrow-right" size={16} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="trust-strip" aria-label="Compromisos del proyecto">
        <div>
          <strong>Fuentes públicas</strong>
        </div>
        <div>
          <strong>Relaciones revisadas</strong>
        </div>
        <div>
          <strong>Sin cuentas ni cookies</strong>
        </div>
        <Link to="/metodologia">
          <strong>Método y límites</strong>
        </Link>
      </section>

      <nav className="compare-access" aria-label="Otras herramientas">
        <Link to="/comparar">
          <span>
            <strong>Comparar ingresos</strong>
            <small>Por ciclo y territorio.</small>
          </span>
          <Icon name="arrow-right" size={18} />
        </Link>
      </nav>
    </div>
  );
}
