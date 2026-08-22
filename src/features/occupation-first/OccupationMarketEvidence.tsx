import { useEffect, useState } from "react";
import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import type {
  SepeOccupationMarket,
  SepeOccupationMetric,
  SepeOccupationMarketResource,
} from "../../../data/schemas/sepeOccupationMarket";
import { loadSepeOccupationMarketResource } from "../../data/generatedDataClient";
import "./occupationMarketEvidence.css";

export interface OccupationMarketEvidenceProps {
  manifest: LoadableGeneratedManifest;
  cnoCode: string;
}

type EvidenceState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "not-found"; resource: SepeOccupationMarketResource }
  | { status: "error" }
  | {
      status: "ready";
      record: SepeOccupationMarket;
      resource: SepeOccupationMarketResource;
    };

const numberFormatter = new Intl.NumberFormat("es-ES");
const decimalFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
});
const periodFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatNumber(value: number | undefined): string {
  return value === undefined ? "No publicado" : numberFormatter.format(value);
}

function formatPercent(value: number | undefined): string {
  if (value === undefined) return "No publicado";
  if (value === 0) return "0 %";
  const sign = value > 0 ? "+" : "−";
  return sign + decimalFormatter.format(Math.abs(value)) + " %";
}

function formatPeriod(period: string): string {
  return periodFormatter.format(new Date(period + "-01T00:00:00Z"));
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function snapshotForSepe(manifest: LoadableGeneratedManifest) {
  return (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"sepeOccupationMarket", { qualityStatus: string }>>
  ).sepeOccupationMarket;
}

function MetricValue({ metric }: { metric: SepeOccupationMetric | undefined }) {
  return <>{formatNumber(metric?.total)}</>;
}

function MetricTrend({ metric }: { metric: SepeOccupationMetric }) {
  return (
    <>
      <span>{formatPercent(metric.monthlyVariationPercent)}</span>
      <span className="occupation-market-evidence__trend-label">mensual</span>
      <span>{formatPercent(metric.annualVariationPercent)}</span>
      <span className="occupation-market-evidence__trend-label">anual</span>
    </>
  );
}

function EvidenceSummary({ record }: { record: SepeOccupationMarket }) {
  const contracts = record.national.registeredContracts;
  const unemployment = record.national.registeredUnemployment;
  return (
    <dl
      className="occupation-market-evidence__summary"
      aria-label="Resumen del mercado laboral"
    >
      <div>
        <dt>Periodo</dt>
        <dd>
          <time dateTime={record.period + "-01"}>
            {formatPeriod(record.period)}
          </time>
        </dd>
      </div>
      <div>
        <dt>Contratos registrados</dt>
        <dd>
          <strong>{formatNumber(contracts.total)}</strong>
          <span className="occupation-market-evidence__definition">
            Comunicaciones administrativas de contratos al SEPE.
          </span>
        </dd>
      </div>
      <div>
        <dt>Variación de contratos</dt>
        <dd className="occupation-market-evidence__trend">
          <MetricTrend metric={contracts} />
        </dd>
      </div>
      <div>
        <dt>Personas contratadas</dt>
        <dd>{formatNumber(contracts.people)}</dd>
      </div>
      <div>
        <dt>Paro registrado</dt>
        <dd>
          <strong>{formatNumber(unemployment.total)}</strong>
          <span className="occupation-market-evidence__definition">
            Personas inscritas como demandantes en paro registrado.
          </span>
        </dd>
      </div>
      <div>
        <dt>Variación del paro</dt>
        <dd className="occupation-market-evidence__trend">
          <MetricTrend metric={unemployment} />
        </dd>
      </div>
    </dl>
  );
}

function EvidenceCoverage({
  resource,
}: {
  resource: SepeOccupationMarketResource;
}) {
  const { coverage } = resource;
  return (
    <div className="occupation-market-evidence__coverage">
      <p>
        Periodo consultado: <strong>{formatPeriod(resource.period)}</strong>.
      </p>
      <p>
        Datos SEPE disponibles para {coverage.publishedCnoCodes.length} de{" "}
        {coverage.requestedCnoCodes.length} grupos CNO consultados.
      </p>
    </div>
  );
}

function ProvinceTable({ record }: { record: SepeOccupationMarket }) {
  return (
    <div className="occupation-market-evidence__table-wrap">
      <table>
        <caption>Contratos y paro registrado por provincia</caption>
        <thead>
          <tr>
            <th scope="col">Provincia</th>
            <th scope="col">Contratos registrados</th>
            <th scope="col">Paro registrado</th>
          </tr>
        </thead>
        <tbody>
          {record.provinces.map((province) => (
            <tr key={province.province}>
              <th scope="row">{province.province}</th>
              <td>
                <MetricValue metric={province.registeredContracts} />
              </td>
              <td>
                <MetricValue metric={province.registeredUnemployment} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OccupationMarketEvidence({
  manifest,
  cnoCode,
}: OccupationMarketEvidenceProps) {
  const [state, setState] = useState<EvidenceState>({ status: "loading" });
  const sepeSnapshot = snapshotForSepe(manifest);
  const isStale =
    manifest.qualityStatus === "stale" ||
    sepeSnapshot?.qualityStatus === "stale";

  useEffect(() => {
    let active = true;
    void loadSepeOccupationMarketResource(manifest)
      .then((resource) => {
        if (!active) return;
        if (resource === null) {
          setState({ status: "unavailable" });
          return;
        }
        const record = resource.records.find(
          (candidate) => candidate.cno.code === cnoCode,
        );
        setState(
          record === undefined
            ? { status: "not-found", resource }
            : { status: "ready", record, resource },
        );
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [cnoCode, manifest]);

  return (
    <section
      className="occupation-market-evidence"
      aria-labelledby="occupation-market-evidence-title"
      aria-busy={state.status === "loading"}
    >
      <header className="occupation-market-evidence__header">
        <p className="occupation-market-evidence__eyebrow">Evidencia oficial</p>
        <h2 id="occupation-market-evidence-title">
          Mercado laboral de esta ocupación
        </h2>
      </header>
      <p className="occupation-market-evidence__intro">
        Registros oficiales del SEPE para CNO-11 {cnoCode}. Incluyen contratos
        registrados y paro registrado; no son vacantes, personas contratadas ni
        una predicción individual.
      </p>
      {state.status === "loading" && (
        <p role="status" aria-live="polite">
          Cargando datos del mercado laboral…
        </p>
      )}
      {state.status === "unavailable" && (
        <p role="status" aria-live="polite">
          El recurso de mercado laboral del SEPE no está disponible para esta
          copia de datos.
        </p>
      )}
      {state.status === "not-found" && (
        <>
          <EvidenceCoverage resource={state.resource} />
          <p role="status" aria-live="polite">
            Sin evidencia SEPE publicada para este CNO en el periodo consultado;
            no equivale a cero.
          </p>
          <p className="occupation-market-evidence__provenance">
            <a
              href={state.resource.coverage.resolverEndpoint}
              target="_blank"
              rel="noreferrer"
            >
              Fuente oficial SEPE
              <span className="sr-only"> (abre en una pestaña nueva)</span>
            </a>
          </p>
        </>
      )}
      {state.status === "error" && (
        <p role="alert">
          No hemos podido cargar los datos del mercado laboral del SEPE.
        </p>
      )}
      {isStale && (
        <p className="occupation-market-evidence__stale" role="status">
          La copia del mercado laboral del SEPE puede estar desactualizada.
        </p>
      )}
      {state.status === "ready" && (
        <>
          <EvidenceCoverage resource={state.resource} />
          <EvidenceSummary record={state.record} />
          <p className="occupation-market-evidence__section-label">
            Distribución provincial
          </p>
          <ProvinceTable record={state.record} />
          <div className="occupation-market-evidence__provenance">
            <p>
              <a
                href={state.record.source.url}
                target="_blank"
                rel="noreferrer"
              >
                Fuente oficial SEPE
                <span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            </p>
            <p>{state.record.source.attribution}</p>
            <p>
              Fecha de captura:{" "}
              <time dateTime={state.record.source.retrievedAt}>
                {formatDate(state.record.source.retrievedAt)}
              </time>
            </p>
          </div>
        </>
      )}
      <p className="occupation-market-evidence__limitation">
        Describe registros administrativos del periodo indicado. No mide
        vacantes, salarios ni la probabilidad de encontrar empleo. La ausencia
        de un dato publicado no equivale a cero.
      </p>
    </section>
  );
}
