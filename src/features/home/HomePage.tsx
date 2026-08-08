import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EntryCard } from "../../components/EntryCard";
import { loadManifest } from "../../data/generatedDataClient";

type FreshnessState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      date: string;
      dateTime: string;
      stale: boolean;
    };

export function HomePage() {
  const [freshness, setFreshness] = useState<FreshnessState>({
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
      })
      .catch(() => {
        if (isActive) {
          setFreshness({ status: "unavailable" });
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
            outcome="Encuentra salidas laborales de tu ciclo."
            prompt="¿Qué has estudiado?"
            example="Desarrollo de Aplicaciones Web"
            details={[
              "Qué ocupaciones encajan",
              "Requisitos y competencias",
              "Ofertas relacionadas, cuando existen",
            ]}
            to="/desde-fp"
            cta="Explorar salidas laborales"
          />
          <EntryCard
            title="Quiero trabajar de…"
            outcome="Descubre qué FP te acerca a ese trabajo."
            prompt="¿Qué ocupación te interesa?"
            example="Programación web"
            details={[
              "Qué ciclos te preparan",
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
        >
          <div className="coverage-panel__heading">
            <h2>Disponible ahora</h2>
            <span>Cobertura parcial</span>
          </div>
          <p className="coverage-panel__program">
            <strong>Desarrollo de Aplicaciones Web</strong>
            <span>presencial y distancia</span>
          </p>
          <p className="coverage-panel__occupation">1 ocupación CNO revisada</p>
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
