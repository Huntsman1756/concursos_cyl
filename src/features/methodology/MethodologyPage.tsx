import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import { SOURCE_CONFIG } from "../../../scripts/data/sourceConfig";
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

type TrainingCatalogSnapshot = {
  snapshotFetchedAt: string;
  sha256: string;
  qualityStatus: "passed" | "stale";
  programs: number;
  centers: number;
  offerings: number;
  officialOccupations: number | null;
};

type EvidenceState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "historical" }
  | { status: "ready"; snapshot: IncomeSnapshot; manifestStale: boolean };

type TrainingCatalogState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; snapshot: TrainingCatalogSnapshot };

type ManifestState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; manifest: LoadableGeneratedManifest };

type SnapshotMetadata = {
  recordCount: number;
  snapshotFetchedAt: string;
  sourceUpdatedAt: string | null;
};

const JCYL_DATASETS = [
  {
    key: "trainingOfferings",
    title: "Oferta de estudios de FP",
    use: "Selector de ciclos, centros y modalidades",
    sourceUrl: SOURCE_CONFIG.training.recordsUrl,
  },
  {
    key: "jobOffers",
    title: "Ofertas de empleo",
    use: "Ofertas relacionadas y requisitos publicados",
    sourceUrl: SOURCE_CONFIG.offers.recordsUrl,
  },
  {
    key: "ecylCourses",
    title: "Formación del ECYL",
    use: "Alternativas de formación complementaria",
    sourceUrl: SOURCE_CONFIG.ecylCourses.recordsUrl,
  },
  {
    key: "professionalCertificates",
    title: "Certificados de profesionalidad",
    use: "Rutas formativas complementarias",
    sourceUrl: SOURCE_CONFIG.professionalCertificates.recordsUrl,
  },
  {
    key: "publicEmploymentCalls",
    title: "Convocatorias de Empleo Público",
    use: "Procesos con plazo abierto en la página de recursos",
    sourceUrl: SOURCE_CONFIG.publicEmploymentCalls.recordsUrl,
  },
  {
    key: "provincialContracts",
    title: "Contratos por provincia",
    use: "Contexto laboral territorial en resultados",
    sourceUrl: SOURCE_CONFIG.regionalContracts.recordsUrl,
  },
  {
    key: "municipalities",
    title: "Registro de municipios",
    use: "Población del municipio donde se estudia",
    sourceUrl: SOURCE_CONFIG.municipalities.recordsUrl,
  },
  {
    key: "educationCenterDirectory",
    title: "Directorio de Centros Docentes",
    use: "Coordenadas oficiales para la distribución territorial",
    sourceUrl: SOURCE_CONFIG.educationCenterDirectory.recordsUrl,
  },
] as const;

function incomeSnapshotFrom(
  manifest: LoadableGeneratedManifest,
): IncomeSnapshot | null {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, IncomeSnapshot | undefined>;
  return resourceSnapshots.outcomeIndicators ?? null;
}

function trainingCatalogSnapshotFrom(
  manifest: LoadableGeneratedManifest,
): TrainingCatalogSnapshot {
  const { programs, centers, trainingOfferings } = manifest.resourceSnapshots;
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"officialOccupations", { recordCount: number }>>;
  return {
    snapshotFetchedAt: programs.snapshotFetchedAt,
    sha256: programs.sha256,
    qualityStatus:
      programs.qualityStatus === "stale" ||
      centers.qualityStatus === "stale" ||
      trainingOfferings.qualityStatus === "stale"
        ? "stale"
        : "passed",
    programs: programs.recordCount,
    centers: centers.recordCount,
    offerings: trainingOfferings.recordCount,
    officialOccupations: snapshots.officialOccupations?.recordCount ?? null,
  };
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

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function RegionalDatasetInventory({ state }: { state: ManifestState }) {
  return (
    <section
      className="regional-dataset-inventory"
      aria-labelledby="regional-datasets-heading"
    >
      <div className="regional-dataset-inventory__heading">
        <div>
          <p className="methodology-page__eyebrow">Datos regionales en uso</p>
          <h2 id="regional-datasets-heading">
            {JCYL_DATASETS.length} datasets de la Junta
          </h2>
        </div>
        <p>Cada fuente tiene un uso visible en el producto.</p>
      </div>
      <div className="regional-dataset-inventory__table-wrap">
        <table className="regional-dataset-inventory__table">
          <caption className="sr-only">
            Dataset, uso en SALIDA CyL, registros, fecha usada y licencia
          </caption>
          <thead>
            <tr>
              <th scope="col">Dataset</th>
              <th scope="col">Dónde se usa</th>
              <th scope="col">Registros</th>
              <th scope="col">Fecha usada</th>
              <th scope="col">Licencia</th>
            </tr>
          </thead>
          <tbody>
            {JCYL_DATASETS.map((dataset) => {
              const snapshots =
                state.status === "ready"
                  ? (state.manifest
                      .resourceSnapshots as typeof state.manifest.resourceSnapshots &
                      Record<string, SnapshotMetadata | undefined>)
                  : null;
              const snapshot = snapshots?.[dataset.key];
              const date = snapshot
                ? formattedDate(
                    snapshot.sourceUpdatedAt ?? snapshot.snapshotFetchedAt,
                  )
                : null;
              return (
                <tr key={dataset.key}>
                  <th scope="row" data-label="Dataset">
                    <a href={dataset.sourceUrl}>{dataset.title}</a>
                  </th>
                  <td data-label="Dónde se usa">{dataset.use}</td>
                  <td data-label="Registros">
                    {snapshot?.recordCount.toLocaleString("es-ES") ?? "—"}
                  </td>
                  <td data-label="Fecha usada">
                    {state.status === "loading"
                      ? "Comprobando…"
                      : date
                        ? `${snapshot?.sourceUpdatedAt ? "Fuente" : "Copia"}: ${date}`
                        : "No disponible"}
                  </td>
                  <td data-label="Licencia">
                    <a href="https://creativecommons.org/licenses/by/4.0/deed.es">
                      CC BY 4.0 ES
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Provenance({ state }: { state: EvidenceState }) {
  if (state.status === "loading") {
    return <p>Comprobando la publicación utilizada…</p>;
  }
  if (state.status === "unavailable") {
    return <p>No se ha podido comprobar la copia de datos publicada.</p>;
  }
  if (state.status === "historical") {
    return (
      <p>Esta versión no contiene la evidencia de ingresos normalizada.</p>
    );
  }

  return (
    <>
      <p>
        Copia descargada el {formattedDate(state.snapshot.snapshotFetchedAt)}.
        Identificador técnico (SHA-256):{" "}
        <code>{state.snapshot.sha256.slice(0, 12)}…</code>
      </p>
      <p>
        <a href={resolveGeneratedAssetPath(state.snapshot.resourcePath)}>
          Descargar los datos utilizados
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

function TrainingCatalogProvenance({ state }: { state: TrainingCatalogState }) {
  if (state.status === "loading") {
    return <p>Comprobando la copia del catálogo oficial…</p>;
  }
  if (state.status === "unavailable") {
    return <p>No se ha podido comprobar la copia del catálogo.</p>;
  }

  return (
    <>
      <p>
        Copia descargada el {formattedDate(state.snapshot.snapshotFetchedAt)}.
        Incluye: {countLabel(state.snapshot.programs, "ciclo", "ciclos")},{" "}
        {countLabel(state.snapshot.centers, "centro", "centros")} y{" "}
        {countLabel(
          state.snapshot.offerings,
          "opción de centro y modalidad",
          "opciones de centro y modalidad",
        )}
        .
      </p>
      <p>
        Identificador técnico del catálogo (SHA-256):{" "}
        <code>{state.snapshot.sha256.slice(0, 12)}…</code>
      </p>
      {state.snapshot.qualityStatus === "stale" ? (
        <p className="source-method-card__warning">
          La copia más reciente no pasó la actualización; se conserva la última
          copia válida.
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
  const [trainingCatalog, setTrainingCatalog] = useState<TrainingCatalogState>({
    status: "loading",
  });
  const [manifestState, setManifestState] = useState<ManifestState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then((manifest) => {
        if (!active) return;
        setManifestState({ status: "ready", manifest });
        const snapshot = incomeSnapshotFrom(manifest);
        setTrainingCatalog({
          status: "ready",
          snapshot: trainingCatalogSnapshotFrom(manifest),
        });
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
        if (active) {
          setEvidence({ status: "unavailable" });
          setTrainingCatalog({ status: "unavailable" });
          setManifestState({ status: "unavailable" });
        }
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
          Explicamos qué aporta cada fuente, cuándo la consultamos y qué no
          permite concluir.
        </p>
      </header>

      <RegionalDatasetInventory state={manifestState} />

      <div className="source-method-grid">
        <SourceMethodCard
          title="Referencia por ciclo o grupo en España"
          contributes={
            <p>
              Base de cotización anualizada de personas asalariadas con jornada
              completa, publicada para ciclos o grupos de FP en España. Incluye
              la media y los cortes del 20 %, 40 %, 60 % y 80 %.
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
          title="Referencia por nivel en Castilla y León"
          contributes={
            <p>
              La misma base de cotización, agrupada para todo Grado Medio o todo
              Grado Superior en Castilla y León. La comunidad corresponde al
              centro donde se obtuvo la titulación.
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
        <article className="source-method-card">
          <h2>Formación complementaria de Castilla y León</h2>
          <section>
            <h3>Qué aporta</h3>
            <p>
              Cursos publicados por el ECYL y el catálogo de certificados de
              profesionalidad, con sus fechas, localidades, niveles, duración y
              enlaces oficiales cuando la fuente los publica.
            </p>
          </section>
          <section>
            <h3>Qué no permite afirmar</h3>
            <p>
              Compartir una familia profesional no convierte un curso o
              certificado en equivalente a un título de FP. No generamos esa
              equivalencia ni garantizamos plazas disponibles.
            </p>
          </section>
          <section>
            <h3>Fuentes originales</h3>
            <p>
              <a href={SOURCE_CONFIG.ecylCourses.recordsUrl}>
                Formación del ECYL
              </a>
              {" · "}
              <a href={SOURCE_CONFIG.professionalCertificates.recordsUrl}>
                Certificados de profesionalidad
              </a>
            </p>
          </section>
        </article>
        <article
          id="fp-catalogo"
          className="source-method-card methodology-catalog-card"
          aria-labelledby="training-catalog-heading"
        >
          <h2 id="training-catalog-heading">Qué estudiar y dónde se imparte</h2>
          <section>
            <h3>Qué aporta</h3>
            <p>
              La copia publicada contiene{" "}
              {trainingCatalog.status === "ready"
                ? countLabel(
                    trainingCatalog.snapshot.programs,
                    "ciclo oficial",
                    "ciclos oficiales",
                  )
                : "todos los ciclos oficiales"}
              {
                ", junto con los centros y modalidades publicados por la Junta de Castilla y León. "
              }
              El selector permite consultar todo el catálogo y la ruta «Dónde
              estudiar» muestra los centros y modalidades de cada ciclo.
            </p>
            <p>
              El buscador de ocupaciones consulta los{" "}
              {trainingCatalog.status === "ready" &&
              trainingCatalog.snapshot.officialOccupations !== null
                ? countLabel(
                    trainingCatalog.snapshot.officialOccupations,
                    "grupo primario oficial CNO-11",
                    "grupos primarios oficiales CNO-11",
                  )
                : "grupos primarios oficiales de la CNO-11"}
              . Que una ocupación aparezca no significa que ya tenga una
              relación revisada con un ciclo de FP.
            </p>
          </section>
          <section>
            <h3>Qué no permite afirmar</h3>
            <p>
              TodoFP aporta salidas profesionales literales para los 187 ciclos
              del catálogo. Las mostramos como perfiles formativos oficiales,
              separadas de las relaciones revisadas con ocupaciones y de las
              ofertas actuales. Solo buscamos ofertas cuando esa relación está
              revisada. Si falta, significa «relación no revisada», no «sin
              salidas profesionales».
            </p>
          </section>
          <section>
            <h3>Actualización de la copia</h3>
            <TrainingCatalogProvenance state={trainingCatalog} />
          </section>
          <section>
            <h3>Fuente original</h3>
            <p>
              <a href={SOURCE_CONFIG.training.recordsUrl}>
                Dataset oficial de oferta de Formación Profesional
              </a>
            </p>
            <p>
              Conservamos una copia fechada de los ciclos, centros y modalidades
              antes de generar la interfaz.
            </p>
          </section>
        </article>
        <article className="source-method-card">
          <h2>Dataset derivado abierto</h2>
          <section>
            <h3>Qué aporta</h3>
            <p>
              Publicamos el grafo FP↔CNO-11 que utiliza la aplicación en JSON y
              CSV, con la fuente, cita y fecha de revisión de cada relación.
            </p>
          </section>
          <section>
            <h3>Qué no permite afirmar</h3>
            <p>
              Solo contiene relaciones revisadas. Una ausencia expresa cobertura
              pendiente, no incompatibilidad entre un ciclo y una ocupación.
            </p>
          </section>
          <section>
            <h3>Descarga y licencia</h3>
            <p>
              <Link to="/datos-abiertos">
                Consultar el dataset, su licencia y sus hashes
              </Link>
            </p>
          </section>
        </article>
      </div>

      <details className="methodology-scope">
        <summary>Población y alcance de la estadística</summary>
        <div>
          <p>
            El cruce administrativo enlaza registros educativos con datos de la
            Seguridad Social. Cohorte significa el curso académico en el que se
            obtuvo la titulación; periodo indica los años posteriores a la
            graduación.
          </p>
          <p>
            Solo se muestran ciclos o grupos con información representativa. Las
            personas por cuenta propia y con jornada parcial quedan fuera de la
            población cubierta por estas tablas.
          </p>
          <p>
            Algunos ciclos se publican juntos como grupos oficiales dentro de
            una familia profesional. Conservamos esa etiqueta agregada y no la
            atribuimos a un ciclo individual.
          </p>
        </div>
      </details>

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
          Si una actualización falla, el sistema conserva la última copia válida
          y la interfaz la identifica como no actualizada. Nunca se publica una
          actualización parcial como correcta.
        </p>
        <p>
          Solo relacionamos una oferta cuando su título contiene una
          coincidencia literal revisada para esta copia de datos.
        </p>
        <details className="methodology-technical">
          <summary>Controles técnicos de publicación</summary>
          <p>
            La revisión de títulos usa una lista controlada de coincidencias
            literales de una sola palabra, sin stemming ni inferencia difusa. Se
            revisa cada posible colisión y cada título que combina varios roles.
          </p>
          <p>
            La compilación compara las descargas CSV y PC-Axis, valida sus
            dimensiones y redondeo oficial, y rechaza formatos, etiquetas o
            celdas inesperadas. El navegador recibe solo el JSON normalizado que
            identifica la copia publicada.
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
