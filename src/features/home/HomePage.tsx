import { useEffect, useState } from "react";
import {
  GeneratedManifestSchema,
  type GeneratedManifest,
} from "../../../data/schemas/generated";
import { EntryCard } from "../../components/EntryCard";
import {
  loadGeneratedResource,
  type GeneratedDataError,
} from "../../data/generatedDataClient";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function HomePage() {
  const [manifest, setManifest] = useState<GeneratedManifest | null>(null);
  const [manifestError, setManifestError] = useState<GeneratedDataError | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    void loadGeneratedResource(
      "/data/v1/manifest.json",
      GeneratedManifestSchema,
    ).then(
      (value) => {
        if (active) setManifest(value);
      },
      (error: unknown) => {
        if (active && error instanceof Error) {
          setManifestError(error as GeneratedDataError);
        }
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-page">
      <section className="home-page__intro" aria-labelledby="home-title">
        <p className="eyebrow">Tu siguiente paso, con fuentes oficiales</p>
        <h1 id="home-title">De tu FP a tu siguiente paso</h1>
        <p>
          Explora ofertas, requisitos y rutas formativas de Castilla y León sin
          notas opacas ni recomendaciones imposibles de comprobar.
        </p>
      </section>

      <section aria-labelledby="entry-title">
        <h2 id="entry-title" className="visually-hidden">
          Elige cómo empezar
        </h2>
        <div className="entry-grid">
          <EntryCard
            icon="graduation-cap"
            title="He terminado FP"
            outcome="Título → ofertas → requisitos → acciones"
            to="/desde-fp"
          />
          <EntryCard
            icon="briefcase"
            title="Quiero trabajar de…"
            outcome="Ocupación → ciclos y centros de CyL"
            to="/desde-ocupacion"
          />
        </div>
      </section>

      <ul className="proof-list" aria-label="Principios de SALIDA CyL">
        <li>Fuentes visibles</li>
        <li>Sin nota opaca</li>
        <li>Datos con fecha</li>
      </ul>

      <section
        className="freshness"
        aria-live="polite"
        aria-label="Estado de los datos"
      >
        {manifest ? (
          <>
            <p>Datos actualizados: {formatDate(manifest.generatedAt)}</p>
            {manifest.qualityStatus === "stale" ? (
              <p role="status">
                Estos datos necesitan revisión antes de usarse.
              </p>
            ) : null}
          </>
        ) : manifestError ? (
          <p role="status">
            No se pudo verificar la fecha de los datos. Revisa la metodología.
          </p>
        ) : (
          <p>Comprobando la fecha de los datos…</p>
        )}
      </section>
    </div>
  );
}
