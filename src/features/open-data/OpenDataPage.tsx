import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import type {
  DerivedFpOccupationRow,
  OpenDataCatalogRecord,
} from "../../../data/schemas/openData";
import {
  loadDerivedFpOccupationGraph,
  loadManifest,
  loadOpenDataCatalog,
  resolveGeneratedAssetPath,
} from "../../data/generatedDataClient";
import { useRouteReady } from "../../app/RouteReadyContext";
import "./openData.css";

type OpenDataState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "historical" }
  | {
      status: "ready";
      manifest: LoadableGeneratedManifest;
      rows: DerivedFpOccupationRow[];
      catalog: OpenDataCatalogRecord;
    };

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function OpenDataPage() {
  const [state, setState] = useState<OpenDataState>({ status: "loading" });

  useRouteReady(state.status !== "loading" && state.status !== "failed");

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const [rows, catalogs] = await Promise.all([
          loadDerivedFpOccupationGraph(manifest),
          loadOpenDataCatalog(manifest),
        ]);
        if (!active) return;
        const catalog = catalogs[0];
        setState(
          catalog === undefined
            ? { status: "historical" }
            : { status: "ready", manifest, rows, catalog },
        );
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    if (state.status !== "ready") return null;
    return {
      programs: new Set(state.rows.map((row) => row.programKey)).size,
      occupations: new Set(state.rows.map((row) => row.cno11Code)).size,
      families: new Set(state.rows.map((row) => row.familyCode)).size,
    };
  }, [state]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Comprobando la publicación abierta…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        role="alert"
        aria-labelledby="open-data-error-heading"
      >
        <h1 id="open-data-error-heading">
          No hemos podido comprobar los datos abiertos
        </h1>
        <p>La aplicación sigue disponible. Prueba de nuevo más tarde.</p>
      </section>
    );
  }
  if (state.status === "historical") {
    return (
      <section className="status-panel" aria-labelledby="open-data-heading">
        <h1 id="open-data-heading">Datos abiertos de SALIDA CyL</h1>
        <p>Esta copia histórica todavía no contiene el dataset derivado.</p>
        <Link to="/metodologia">Consultar metodología y fuentes</Link>
      </section>
    );
  }

  const graphSnapshot = (
    state.manifest
      .resourceSnapshots as typeof state.manifest.resourceSnapshots &
      Record<
        "derivedFpOccupationGraph",
        { resourcePath: string; sha256: string }
      >
  ).derivedFpOccupationGraph;

  return (
    <article className="open-data-page" aria-labelledby="open-data-heading">
      <header className="open-data-page__intro">
        <p className="open-data-page__eyebrow">Reutilización pública</p>
        <h1 id="open-data-heading">Datos abiertos de SALIDA CyL</h1>
        <p>
          Descarga las relaciones FP↔ocupación que utiliza el producto, con su
          clasificación CNO-11 y la fuente que respalda cada enlace.
        </p>
      </header>

      <section className="open-data-release" aria-labelledby="release-title">
        <div className="open-data-release__heading">
          <div>
            <p>Dataset derivado</p>
            <h2 id="release-title">Grafo FP y ocupaciones</h2>
          </div>
          <p>Actualizado el {formattedDate(state.catalog.generatedAt)}</p>
        </div>

        <dl className="open-data-release__metrics">
          <div>
            <dt>Relaciones</dt>
            <dd>{state.rows.length}</dd>
          </div>
          <div>
            <dt>Ciclos</dt>
            <dd>{summary?.programs}</dd>
          </div>
          <div>
            <dt>Ocupaciones CNO-11</dt>
            <dd>{summary?.occupations}</dd>
          </div>
          <div>
            <dt>Familias profesionales</dt>
            <dd>{summary?.families}</dd>
          </div>
        </dl>

        <div className="open-data-release__downloads">
          <a
            className="primary-button"
            href={resolveGeneratedAssetPath(graphSnapshot.resourcePath)}
            download
          >
            Descargar JSON
          </a>
          <a
            className="secondary-button"
            href={resolveGeneratedAssetPath(state.catalog.csvResourcePath)}
            download
          >
            Descargar CSV
          </a>
        </div>

        <dl className="open-data-release__provenance">
          <div>
            <dt>Licencia</dt>
            <dd>
              <a href={state.catalog.licenseUrl}>{state.catalog.licenseName}</a>
            </dd>
          </div>
          <div>
            <dt>Integridad JSON</dt>
            <dd>
              <code>{graphSnapshot.sha256.slice(0, 16)}…</code>
            </dd>
          </div>
          <div>
            <dt>Integridad CSV</dt>
            <dd>
              <code>{state.catalog.csvSha256.slice(0, 16)}…</code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="open-data-page__scope" aria-labelledby="scope-title">
        <h2 id="scope-title">Qué contiene</h2>
        <p>
          Cada fila une un ciclo oficial con un grupo primario CNO-11 e incluye
          familia profesional, tipo de relación, cita, URL y fecha de revisión.
        </p>
        <p>
          Solo se publican relaciones revisadas. La ausencia de una relación no
          significa que sea imposible: señala que todavía no está validada.
        </p>
        <p>
          <Link to="/metodologia">Ver fuentes, proceso y limitaciones</Link>
          {" · "}
          <a href="https://github.com/Huntsman1756/concursos_cyl">
            Consultar el código y el pipeline
          </a>
        </p>
      </section>
    </article>
  );
}
