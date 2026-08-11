import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EntryCard } from "../../components/EntryCard";
import {
  loadManifest,
  loadMappingCoverage,
} from "../../data/generatedDataClient";
import type { MappingCoverage } from "../../../data/schemas/curatedMappings";

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

export function HomePage() {
  const [freshness, setFreshness] = useState<FreshnessState>({
    status: "loading",
  });
  const [coverage, setCoverage] = useState<CoverageState>({
    status: "loading",
  });

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
            outcome="Consulta relaciones ocupacionales revisadas y, cuando existan, ofertas relacionadas."
            prompt="¿Qué has estudiado?"
            example="Desarrollo de Aplicaciones Web"
            details={[
              "Ocupaciones con relación revisada",
              "Requisitos y competencias",
              "Ofertas relacionadas, cuando existen",
            ]}
            to="/desde-fp"
            cta="Explorar salidas laborales"
          />
          <EntryCard
            title="Quiero trabajar de…"
            outcome="Consulta qué ciclos tienen una relación revisada con esa ocupación."
            prompt="¿Qué ocupación te interesa?"
            example="Programación web"
            details={[
              "Ciclos con relación revisada",
              "Dónde se imparten y cómo acceder",
              "Relaciones formativas revisadas",
            ]}
            to="/desde-ocupacion"
            cta="Buscar ciclos que te preparan"
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
            Las relaciones formativas se incorporan de forma progresiva. No
            todos los ciclos ni ocupaciones están cubiertos.
          </p>
        </div>
        <Link to="/metodologia">Saber más sobre los datos</Link>
      </section>
    </>
  );
}
