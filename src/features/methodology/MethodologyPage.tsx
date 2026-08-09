import { useEffect, useState } from "react";

import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import {
  EDUCABASE_INCOME_SOURCES,
  type EducabaseIncomeTableId,
} from "../../../scripts/data/educabaseIncomeSources";
import {
  loadManifest,
  resolveGeneratedAssetPath,
} from "../../data/generatedDataClient";
import { SourceMethodCard } from "./SourceMethodCard";
import "./methodology.css";

const TERMS_URL = "https://www.educacionyfp.gob.es/comunes/aviso-legal.html";

const NATIONAL_TABLES = ["famprof_2_08", "famprof_3_08"] as const;
const REGIONAL_TABLES = ["ccaa_2_07", "ccaa_3_07"] as const;

type IncomeSnapshot = {
  resourcePath: string;
  snapshotFetchedAt: string;
  sha256: string;
  qualityStatus: "passed" | "stale";
};

type EvidenceState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "historical" }
  | { status: "ready"; snapshot: IncomeSnapshot; manifestStale: boolean };

function incomeSnapshotFrom(
  manifest: LoadableGeneratedManifest,
): IncomeSnapshot | null {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, IncomeSnapshot | undefined>;
  return resourceSnapshots.outcomeIndicators ?? null;
}

function tableLinks(tableIds: readonly EducabaseIncomeTableId[]) {
  return tableIds.map((tableId) => {
    const source = EDUCABASE_INCOME_SOURCES[tableId];
    return {
      tableId,
      label:
        source.trainingLevel === "intermediate"
          ? "Grado Medio"
          : "Grado Superior",
      catalogUrl: source.catalogUrl,
      csvUrl: source.csvUrl,
      pxUrl: source.pxUrl,
    };
  });
}

function formattedDate(timestamp: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function Provenance({ state }: { state: EvidenceState }) {
  if (state.status === "loading") {
    return <p>Comprobando la publicación utilizada…</p>;
  }
  if (state.status === "unavailable") {
    return <p>No se ha podido comprobar el manifiesto de datos.</p>;
  }
  if (state.status === "historical") {
    return (
      <p>Esta versión no contiene la evidencia de ingresos normalizada.</p>
    );
  }

  return (
    <>
      <p>
        Captura verificada el {formattedDate(state.snapshot.snapshotFetchedAt)}.
        Huella SHA-256: <code>{state.snapshot.sha256.slice(0, 12)}…</code>
      </p>
      <p>
        <a href={resolveGeneratedAssetPath(state.snapshot.resourcePath)}>
          Descargar evidencia normalizada
        </a>
      </p>
      {state.manifestStale || state.snapshot.qualityStatus === "stale" ? (
        <p className="source-method-card__warning">
          La actualización más reciente falló; esta es la última copia válida.
        </p>
      ) : null}
    </>
  );
}

/** Explains the approved data contract without extending its claims. */
export function MethodologyPage() {
  const [evidence, setEvidence] = useState<EvidenceState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then((manifest) => {
        if (!active) return;
        const snapshot = incomeSnapshotFrom(manifest);
        setEvidence(
          snapshot
            ? {
                status: "ready",
                snapshot,
                manifestStale: manifest.qualityStatus === "stale",
              }
            : { status: "historical" },
        );
      })
      .catch(() => {
        if (active) setEvidence({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, []);

  const provenance = <Provenance state={evidence} />;
  return (
    <section className="methodology-page" aria-labelledby="methodology-heading">
      <header className="methodology-page__intro">
        <p className="methodology-page__eyebrow">Transparencia de los datos</p>
        <h1 id="methodology-heading">Metodología y fuentes</h1>
        <p>
          Separamos las referencias oficiales por su alcance y publicamos la
          huella de la copia exacta utilizada.
        </p>
      </header>

      <div className="source-method-grid">
        <SourceMethodCard
          title="Ciclos y grupos en España"
          contributes={
            <p>
              Base de cotización por contingencias comunes anualizada de
              personas afiliadas por cuenta ajena con jornada completa,
              publicada para cada ciclo o grupo oficial en España. Incluye la
              media y los límites inferiores de los quintiles 2, 3, 4 y 5.
            </p>
          }
          limitations={
            <p>
              No ofrece una cifra por ciclo en Castilla y León ni predice el
              ingreso de una persona. Un grupo agregado se mantiene como grupo y
              no se presenta como un ciclo individual.
            </p>
          }
          provenance={provenance}
          tables={tableLinks(NATIONAL_TABLES)}
        />
        <SourceMethodCard
          title="Nivel formativo en Castilla y León"
          contributes={
            <p>
              La misma medida para Grado Medio o Grado Superior en Castilla y
              León. La comunidad identifica el centro donde se obtuvo la
              titulación.
            </p>
          }
          limitations={
            <p>
              No identifica un ciclo concreto, ni la residencia, ni el lugar de
              trabajo o la ubicación de un empleo posterior.
            </p>
          }
          provenance={provenance}
          tables={tableLinks(REGIONAL_TABLES)}
        />
      </div>

      <section className="methodology-notes" aria-labelledby="reading-heading">
        <h2 id="reading-heading">Cómo leer los resultados</h2>
        <p>
          El valor «..» de la fuente significa «no disponible o no
          representativo». La estadística no permite distinguir entre ambas
          causas, por lo que no lo sustituimos por cero.
        </p>
        <p>
          Las ventanas observadas son de cuatro años hasta la cohorte 2020-2021,
          tres para 2021-2022 y dos para 2022-2023. Las dos últimas cohortes son
          provisionales; los años futuros no son datos ausentes.
        </p>
        <p>
          Si una actualización falla, el manifiesto conserva la última copia
          válida y la interfaz la identifica como no actualizada. Nunca se
          publica una actualización parcial como correcta.
        </p>
        <details className="methodology-technical">
          <summary>Controles técnicos de publicación</summary>
          <p>
            La compilación compara las descargas CSV y PC-Axis, valida sus
            dimensiones y redondeo oficial, y rechaza formatos, etiquetas o
            celdas inesperadas. El navegador recibe solo el JSON normalizado que
            identifica el manifiesto.
          </p>
        </details>
        <p>
          Consulta las condiciones declaradas por el catálogo en el{" "}
          <a href={TERMS_URL}>Aviso legal del Ministerio</a>.
        </p>
      </section>
    </section>
  );
}
