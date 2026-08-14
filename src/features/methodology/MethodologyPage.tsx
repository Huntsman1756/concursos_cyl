import { Link } from "react-router-dom";
import type { GeneratedManifest } from "../../../data/schemas/generated";
import { SourceMethodCard } from "./SourceMethodCard";

const EDUCABASE_URL =
  "https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/estadisticas/laborales/insercion.html";
const CYL_STUDY_URL = "https://estadistica.jcyl.es/";

export function MethodologyPage({ manifest }: { manifest: GeneratedManifest }) {
  const outcomeSource = manifest.sources.outcomes;
  return (
    <div className="journey-page methodology-page">
      <Link to="/">Volver al inicio</Link>
      <p className="eyebrow">Fuentes, límites y método</p>
      <h1>Metodología</h1>
      <p>
        SALIDA CyL presenta datos oficiales con su alcance real. No calcula una
        nota de empleabilidad ni convierte una referencia territorial en un
        resultado por ciclo.
      </p>
      <p>
        <a href="/data/v1/manifest.json" download>
          Descargar manifiesto de datos
        </a>
      </p>
      <section className="source-method-list" aria-labelledby="sources-title">
        <h2 id="sources-title">Fuentes públicas</h2>
        <SourceMethodCard
          title="Oferta de formación profesional"
          sourceUrl={manifest.sources.training.sourceUrl}
          updatedAt={
            manifest.sources.training.sourceUpdatedAt ??
            manifest.sources.training.snapshotFetchedAt
          }
          contributes="programas, familias profesionales, centros, localidades, provincias y modalidades publicadas en Castilla y León."
          cannotAssert="plazas disponibles, admisión, nota de corte o probabilidad de contratación."
        >
          Cada registro se valida con Zod, se normaliza al contrato de
          programas, centros y ofertas formativas y se guarda con hash SHA-256
          en el manifiesto.
        </SourceMethodCard>
        <SourceMethodCard
          title="Ofertas de empleo"
          sourceUrl={manifest.sources.offers.sourceUrl}
          updatedAt={
            manifest.sources.offers.sourceUpdatedAt ??
            manifest.sources.offers.snapshotFetchedAt
          }
          contributes="ofertas publicadas, ubicación, fechas, descripción y enlace oficial de origen."
          cannotAssert="que una oferta siga abierta, que admita una titulación no publicada o que el encaje sea una probabilidad."
        >
          El texto se limpia sin HTML ejecutable. Los requisitos solo se
          muestran como publicados cuando conservamos la cita exacta y la regla
          de extracción.
        </SourceMethodCard>
        <SourceMethodCard
          title="EDUCAbase: inserción laboral de FP"
          sourceUrl={outcomeSource?.sourceUrl ?? EDUCABASE_URL}
          updatedAt={
            outcomeSource?.sourceUpdatedAt ??
            outcomeSource?.snapshotFetchedAt ??
            null
          }
          contributes="indicadores nacionales por ciclo o grupo y referencias regionales por nivel formativo, incluida la base de cotización anualizada cuando la tabla la publica."
          cannotAssert="un salario esperado, una cifra individual, ni ingresos por ciclo formativo en Castilla y León."
        >
          Es un enlace administrativo entre educación y afiliación a la
          Seguridad Social. Las cohortes, el año desde la graduación, la unidad
          y las supresiones permanecen en cada indicador.
        </SourceMethodCard>
        <SourceMethodCard
          title="Estudio de inserción de Castilla y León"
          sourceUrl={CYL_STUDY_URL}
          updatedAt={null}
          contributes="una encuesta autonómica de inserción CAWI/CATI con n=2.024, cuando su alcance declarado ayuda a interpretar el fenómeno."
          cannotAssert="que sus resultados sean el mismo registro administrativo de EDUCAbase ni que describan una oferta individual."
        >
          Se mantiene separada de la vinculación administrativa de EDUCAbase y
          no alimenta automáticamente las comparaciones.
        </SourceMethodCard>
      </section>
      <section className="methodology-notes" aria-labelledby="rules-title">
        <h2 id="rules-title">Reglas de lectura</h2>
        <ul>
          <li>
            Una cifra suprimida se muestra como «No publicado», nunca como cero.
          </li>
          <li>
            Solo se comparan cohortes, años posteriores, medidas y unidades
            compatibles.
          </li>
          <li>
            Las referencias nacionales y regionales permanecen en tarjetas
            separadas.
          </li>
          <li>
            Las relaciones formación–ocupación y sus alias tienen revisión
            humana y versión.
          </li>
        </ul>
        <p>
          El contrato completo está documentado en{" "}
          <a href="/docs/methodology/source-contracts.md">
            source-contracts.md
          </a>{" "}
          y <a href="/docs/methodology/evidence-rules.md">evidence-rules.md</a>.
        </p>
      </section>
    </div>
  );
}
