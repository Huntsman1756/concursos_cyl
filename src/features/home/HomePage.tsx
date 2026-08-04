import { useEffect, useState } from "react";
import { EntryCard } from "../../components/EntryCard";
import { Icon, type IconName } from "../../components/Icon";
import { loadManifest } from "../../data/generatedDataClient";

const proofPoints: Array<{ label: string; iconName: IconName }> = [
  { label: "Fuentes visibles", iconName: "eye" },
  { label: "Sin nota opaca", iconName: "file-check" },
  { label: "Datos con fecha", iconName: "calendar" },
];

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
      <section className="home-hero" aria-labelledby="home-heading">
        <p className="home-hero__eyebrow">Decide con información clara</p>
        <h1 id="home-heading">Dos caminos para encontrar tu siguiente paso</h1>
        <p className="home-hero__intro">
          Empieza por lo que ya has estudiado o por el trabajo al que quieres
          llegar.
        </p>
      </section>

      <section className="entry-grid" aria-label="Elige tu punto de partida">
        <EntryCard
          title="He terminado FP"
          outcome="Título → ofertas → requisitos → acciones"
          to="/desde-fp"
          cta="Explorar: He terminado FP"
          iconName="graduation-cap"
        />
        <EntryCard
          title="Quiero trabajar de…"
          outcome="Ocupación → ciclos y centros de CyL"
          to="/desde-ocupacion"
          cta="Explorar: Quiero trabajar de…"
          iconName="briefcase"
        />
      </section>

      <ul className="proof-points" aria-label="Compromisos de transparencia">
        {proofPoints.map(({ label, iconName }) => (
          <li key={label}>
            <Icon name={iconName} />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <section
        className="data-freshness"
        aria-label="Actualización de datos"
        aria-live="polite"
      >
        {freshness.status === "ready" && (
          <>
            <p>
              Datos actualizados:{" "}
              <time dateTime={freshness.dateTime}>{freshness.date}</time>
            </p>
            {freshness.stale && (
              <p className="data-freshness__warning">
                No se han podido actualizar los datos. Mostramos la última copia
                disponible.
              </p>
            )}
          </>
        )}
        {freshness.status === "unavailable" && (
          <p>No se pudo comprobar la fecha de los datos.</p>
        )}
      </section>
    </>
  );
}
