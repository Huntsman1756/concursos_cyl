import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EntryCard } from "../../components/EntryCard";
import { Icon } from "../../components/Icon";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
  loadMappingCoverage,
  loadOfficialOccupations,
} from "../../data/generatedDataClient";
import type {
  MappingCoverage,
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import type { TrainingProgram } from "../../../data/schemas/generated";
import { loadApprovedMappings } from "../../domain/occupation";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import { OccupationCombobox } from "../occupation-first/OccupationCombobox";

type FreshnessState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
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
  const [selectedProgram, setSelectedProgram] = useState("");
  const [confirmedOccupation, setConfirmedOccupation] =
    useState<Occupation | null>(null);

  useEffect(() => {
    let isActive = true;

    void loadManifest()
      .then((manifest) => {
        if (!isActive) return;

        const offersSnapshot = manifest.resourceSnapshots.jobOffers;
        const dateTime =
          offersSnapshot.sourceUpdatedAt ?? offersSnapshot.snapshotFetchedAt;
        setFreshness({
          status: "ready",
          date: new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(dateTime)),
          dateTime,
          stale:
            manifest.qualityStatus === "stale" ||
            offersSnapshot.qualityStatus === "stale",
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
    void loadManifest()
      .then(async (manifest) => {
        const [foundation, relationships, officialOccupations] =
          await Promise.all([
            loadFoundationResources(manifest),
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
            SALIDA CyL conecta FP, salidas profesionales y evidencia pública; no
            es un buscador general de empleo ni de cursos.
          </p>
        </div>

        <div className="home-workspace">
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
                aria-label="Actualización de datos"
                aria-busy={freshness.status === "loading"}
              >
                {freshness.status === "loading" ? "Comprobando fecha…" : null}
                {freshness.status === "ready" ? (
                  <>
                    Actualizado:{" "}
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

            {freshness.status === "ready" && freshness.stale ? (
              <p className="data-freshness__warning">
                Mostramos la última copia disponible.
              </p>
            ) : null}
            <Link className="coverage-panel__link" to="/metodologia">
              Ver toda la cobertura <Icon name="arrow-right" size={16} />
            </Link>
          </aside>

          <section
            className="entry-panels"
            aria-label="Elige tu punto de partida"
          >
            <EntryCard
              title="He terminado FP"
              outcome="Indica tu título y descubre tus siguientes pasos."
              accent="burgundy"
              control={
                searchData.status === "ready" ? (
                  <div className="entry-card__field">
                    <label className="sr-only" htmlFor="home-program">
                      Título de Formación Profesional
                    </label>
                    <select
                      id="home-program"
                      value={selectedProgram}
                      onChange={(event) =>
                        setSelectedProgram(event.target.value)
                      }
                    >
                      <option value="">Selecciona tu título de FP</option>
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
                ) : (
                  <p className="form-message">
                    {searchData.status === "loading"
                      ? "Cargando el catálogo oficial de FP…"
                      : "El selector no está disponible ahora mismo."}
                  </p>
                )
              }
              action={
                searchData.status === "ready" ? (
                  <button
                    className="entry-card__cta"
                    type="button"
                    disabled={selectedProgram === ""}
                    onClick={() => navigate(`/desde-fp/${selectedProgram}`)}
                  >
                    Ver mis opciones
                  </button>
                ) : (
                  <Link className="entry-card__cta" to="/desde-fp">
                    Abrir buscador de FP
                  </Link>
                )
              }
            />

            <span
              className="entry-panels__separator"
              role="separator"
              aria-label="Alternativa"
            >
              {" o "}
            </span>

            <EntryCard
              title="Quiero trabajar de…"
              outcome="Busca una ocupación y conoce cómo llegar."
              accent="burgundy"
              control={
                searchData.status === "ready" ? (
                  <OccupationCombobox
                    occupations={searchData.occupations}
                    aliases={searchData.aliases}
                    confirmedOccupation={confirmedOccupation}
                    onConfirm={setConfirmedOccupation}
                    onClear={() => setConfirmedOccupation(null)}
                    label="Ocupación que te interesa"
                    hint="Escribe una ocupación y selecciónala en la lista."
                    showConfirmation={false}
                  />
                ) : (
                  <p className="form-message">
                    {searchData.status === "loading"
                      ? "Cargando el catálogo oficial de ocupaciones…"
                      : "El buscador no está disponible ahora mismo."}
                  </p>
                )
              }
              action={
                searchData.status === "ready" ? (
                  <button
                    className="entry-card__cta"
                    type="button"
                    disabled={confirmedOccupation === null}
                    onClick={() =>
                      confirmedOccupation === null
                        ? undefined
                        : navigate(
                            `/desde-ocupacion/${encodeURIComponent(confirmedOccupation.occupationId)}`,
                          )
                    }
                  >
                    Buscar ocupación
                  </button>
                ) : (
                  <Link className="entry-card__cta" to="/desde-ocupacion">
                    Abrir buscador de ocupaciones
                  </Link>
                )
              }
            />
          </section>
        </div>
      </section>

      <section className="trust-strip" aria-label="Compromisos del proyecto">
        <div>
          <Icon name="database" size={19} />
          <strong>Fuentes públicas</strong>
        </div>
        <div>
          <Icon name="badge-check" size={19} />
          <strong>Relaciones revisadas</strong>
        </div>
        <div>
          <Icon name="user-round-x" size={19} />
          <strong>Sin cuentas ni cookies</strong>
        </div>
      </section>

      <nav className="secondary-access" aria-label="Explora SALIDA CyL">
        <Link to="/desde-fp">
          <Icon name="search" size={34} />
          <span>
            <strong>Buscar por tu título</strong>
            <small>Salidas y oportunidades vinculadas.</small>
          </span>
          <Icon name="arrow-right" size={21} />
        </Link>
        <Link to="/desde-ocupacion">
          <Icon name="briefcase" size={34} />
          <span>
            <strong>Explorar por ocupación</strong>
            <small>Ciclos relacionados con el trabajo que buscas.</small>
          </span>
          <Icon name="arrow-right" size={21} />
        </Link>
        <Link to="/comparar">
          <Icon name="bar-chart" size={34} />
          <span>
            <strong>Comparar referencias de ingresos</strong>
            <small>Datos publicados por ciclo y territorio.</small>
          </span>
          <Icon name="arrow-right" size={21} />
        </Link>
      </nav>

      <section className="methodology-strip" aria-label="Metodología y límites">
        <p>
          <span aria-hidden="true">i</span>
          <strong>Datos públicos y relaciones revisadas.</strong> Los resultados
          no garantizan empleo.
        </p>
        <Link to="/metodologia">
          Ver metodología <Icon name="arrow-right" size={16} />
        </Link>
      </section>
    </div>
  );
}
