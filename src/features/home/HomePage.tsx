import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EntryCard } from "../../components/EntryCard";
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
      totalPrograms: number;
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
        if (!isActive) {
          return;
        }

        const offersSnapshot = manifest.resourceSnapshots.jobOffers;
        const dateTime =
          offersSnapshot.sourceUpdatedAt ?? offersSnapshot.snapshotFetchedAt;
        setFreshness({
          status: "ready",
          date: new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "long",
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
              totalPrograms: manifest.resourceSnapshots.programs.recordCount,
            });
          })
          .catch(() => {
            if (isActive) setCoverage({ status: "unavailable" });
          });
      })
      .catch(() => {
        if (isActive) {
          setFreshness({ status: "unavailable" });
          setCoverage({ status: "unavailable" });
        }
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

  return (
    <>
      <section className="home-intro" aria-labelledby="home-heading">
        <p className="home-intro__eyebrow">
          Formación Profesional y empleo en Castilla y León
        </p>
        <h1 id="home-heading">
          Elige tu camino y actúa con información oficial
        </h1>
      </section>

      <div className="home-workspace">
        <section
          className="entry-panels"
          aria-label="Elige tu punto de partida"
        >
          <EntryCard
            title="He terminado FP"
            outcome="Selecciona cualquiera de los ciclos oficiales y consulta sus salidas profesionales."
            prompt="¿Qué has estudiado?"
            details={[
              "Salidas oficiales para los 187 ciclos",
              "Ocupaciones CNO cuando la relación está revisada",
              "Ofertas relacionadas, cuando existen",
            ]}
            control={
              searchData.status === "ready" ? (
                <div className="entry-card__field">
                  <label htmlFor="home-program">¿Qué has estudiado?</label>
                  <select
                    id="home-program"
                    value={selectedProgram}
                    onChange={(event) => setSelectedProgram(event.target.value)}
                  >
                    <option value="">Selecciona un ciclo FP</option>
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
                  Explorar salidas laborales
                </button>
              ) : (
                <Link className="entry-card__cta" to="/desde-fp">
                  Abrir buscador de FP
                </Link>
              )
            }
          />
          <EntryCard
            title="Quiero trabajar de…"
            outcome={
              searchData.status === "ready"
                ? `Filtra ${searchData.occupations.length} grupos de ocupación oficiales y consulta qué FP tienen una relación revisada.`
                : "Filtra el catálogo oficial CNO-11 y consulta qué FP tienen una relación revisada."
            }
            prompt="¿Qué ocupación te interesa?"
            details={[
              "Catálogo completo de ocupaciones CNO-11",
              "Ciclos con relación revisada",
              "Dónde se imparten y cómo acceder",
            ]}
            control={
              searchData.status === "ready" ? (
                <OccupationCombobox
                  occupations={searchData.occupations}
                  aliases={searchData.aliases}
                  confirmedOccupation={confirmedOccupation}
                  onConfirm={setConfirmedOccupation}
                  onClear={() => setConfirmedOccupation(null)}
                  label="¿Qué ocupación te interesa?"
                  hint="Escribe, por ejemplo, programación web, cocina o enfermería."
                  showConfirmation={false}
                />
              ) : (
                <p className="form-message">
                  {searchData.status === "loading"
                    ? "Cargando el catálogo oficial CNO-11…"
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
                  Buscar ciclos que te preparan
                </button>
              ) : (
                <Link className="entry-card__cta" to="/desde-ocupacion">
                  Abrir buscador de ocupaciones
                </Link>
              )
            }
          />
        </section>

        <aside
          className="coverage-panel"
          aria-label="Disponible ahora"
          role="region"
          aria-live="polite"
          aria-busy={coverage.status === "loading"}
        >
          <div className="coverage-panel__heading">
            <h2>Disponible ahora</h2>
            <span>Cobertura parcial</span>
          </div>
          {coverage.status === "loading" ? (
            <p className="coverage-panel__occupation">
              Comprobando la cobertura revisada…
            </p>
          ) : null}
          {coverage.status === "unavailable" ? (
            <p className="coverage-panel__occupation">
              No se ha podido comprobar la cobertura revisada.
            </p>
          ) : null}
          {coverage.status === "ready" ? (
            <>
              <p className="coverage-panel__scope">
                El catálogo completo contiene {coverage.totalPrograms} ciclo
                {coverage.totalPrograms === 1 ? " oficial" : "s oficiales"}.
                Esta lista destaca solo ciclos con cobertura ocupacional
                revisada.
              </p>
              <ul
                className="coverage-panel__programs"
                aria-label="Ciclos revisados"
              >
                {coverage.programs.map((program) => (
                  <li
                    className="coverage-panel__program"
                    key={program.programKey}
                  >
                    <strong>{program.programTitle}</strong>
                    <span>
                      {program.programKey} · {program.approvedMappings}{" "}
                      {program.approvedMappings === 1
                        ? "ocupación CNO revisada"
                        : "ocupaciones CNO revisadas"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <div className="coverage-panel__includes">
            <h3>Qué incluye</h3>
            <ul>
              <li>Relaciones formativas con revisión humana</li>
              <li>Ofertas vinculadas cuando existen</li>
              <li>Datos públicos de Castilla y León</li>
            </ul>
          </div>
          <Link className="coverage-panel__link" to="/metodologia">
            Ver cobertura
          </Link>
          <section
            className="data-freshness"
            aria-label="Actualización de datos"
            aria-busy={freshness.status === "loading"}
            aria-live="polite"
          >
            {freshness.status === "loading" ? (
              <p>Comprobando la fecha de los datos…</p>
            ) : null}
            {freshness.status === "ready" ? (
              <>
                <p>
                  Datos actualizados:{" "}
                  <time dateTime={freshness.dateTime}>{freshness.date}</time>
                </p>
                {freshness.stale ? (
                  <p className="data-freshness__warning">
                    No se han podido actualizar los datos. Mostramos la última
                    copia disponible.
                  </p>
                ) : null}
              </>
            ) : null}
            {freshness.status === "unavailable" ? (
              <p>No se pudo comprobar la fecha de los datos.</p>
            ) : null}
          </section>
        </aside>
      </div>

      <section className="information-strip" aria-label="Sobre la cobertura">
        <div>
          <h2>Información pública y con revisión humana</h2>
          <p>
            El catálogo de FP y ocupaciones es completo. Las relaciones entre
            ambos se incorporan de forma progresiva y siempre con evidencia.
          </p>
        </div>
        <Link to="/metodologia">Saber más sobre los datos</Link>
      </section>
    </>
  );
}
