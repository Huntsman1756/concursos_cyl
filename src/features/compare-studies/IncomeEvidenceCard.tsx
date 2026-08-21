import { useId } from "react";

import type {
  OutcomeMeasure,
  OutcomeObservation,
} from "../../../data/schemas/outcomes";
import {
  formatOutcomeLabel,
  OUTCOME_MEASURE_ORDER,
  OUTCOME_MEASURE_PRESENTATION,
} from "./outcomePresentation";

export interface IncomeEvidenceCardProps {
  heading: string;
  scopeLabel: string;
  detail?: string;
  observations: readonly OutcomeObservation[];
  groupLabels?: ReadonlyMap<string, string>;
}

interface IncomeSeries {
  key: string;
  label: string;
  observations: readonly OutcomeObservation[];
}

function formatValue(value: number | null): string {
  if (value === null) return "No disponible";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function observationsByMeasure(
  observations: readonly OutcomeObservation[],
): ReadonlyMap<OutcomeMeasure, OutcomeObservation> {
  return new Map(
    observations.map((observation) => [observation.measure, observation]),
  );
}

/** Whether the full P20-P40-P60-P80 sequence is strictly non-decreasing. */
function isMonotoneCuts(
  observations: ReadonlyMap<OutcomeMeasure, OutcomeObservation>,
): boolean {
  const values = OUTCOME_MEASURE_ORDER.slice(1)
    .map((measure) => observations.get(measure)?.valueEur ?? null)
    .filter((value): value is number => value !== null);
  return values.every(
    (value, index) => index === 0 || value >= values[index - 1],
  );
}

function buildSeries(
  observations: readonly OutcomeObservation[],
  groupLabels?: ReadonlyMap<string, string>,
): readonly IncomeSeries[] {
  if (groupLabels === undefined) {
    return [
      {
        key: "regional-reference",
        label: "Distribución de la referencia",
        observations,
      },
    ];
  }

  return [...groupLabels.entries()]
    .map(([groupKey, label]) => ({
      key: groupKey,
      label: formatOutcomeLabel(label),
      observations: observations.filter(
        (observation) => observation.groupKey === groupKey,
      ),
    }))
    .sort((left, right) =>
      left.label.localeCompare(right.label, "es", { sensitivity: "base" }),
    );
}

/** Presents one source scope as plain-language charts with exact technical tables. */
export function IncomeEvidenceCard({
  heading,
  scopeLabel,
  detail,
  observations,
  groupLabels,
}: IncomeEvidenceCardProps) {
  const headingId = useId();
  const series = buildSeries(observations, groupLabels);
  const maximumValue = Math.max(
    1,
    ...observations.map((observation) => observation.valueEur ?? 0),
  );

  return (
    <section className="income-evidence-card" aria-labelledby={headingId}>
      <header className="income-evidence-card__header">
        <p className="income-evidence-card__scope">{scopeLabel}</p>
        <h2 id={headingId}>{heading}</h2>
        {detail ? <p>{detail}</p> : null}
      </header>

      <div className="income-series-list">
        {series.map((item) => {
          const indexed = observationsByMeasure(item.observations);
          const monotone = isMonotoneCuts(indexed);
          return (
            <article className="income-series" key={item.key}>
              <header className="income-series__header">
                <h3>{item.label}</h3>
                <p>
                  Media anual
                  <strong>
                    {formatValue(indexed.get("mean")?.valueEur ?? null)}
                  </strong>
                </p>
              </header>

              <ul
                className="income-bars"
                aria-label={`Distribución: ${item.label}`}
              >
                {OUTCOME_MEASURE_ORDER.map((measure) => {
                  if (!monotone && measure !== "mean") return null;
                  const observation = indexed.get(measure);
                  const value = observation?.valueEur ?? null;
                  const presentation = OUTCOME_MEASURE_PRESENTATION[measure];
                  const width =
                    value === null
                      ? 0
                      : Math.max(1.5, (value / maximumValue) * 100);
                  return (
                    <li key={measure}>
                      <div className="income-bar__label">
                        <span>{presentation.plainLabel}</span>
                        <strong>{formatValue(value)}</strong>
                      </div>
                      <div className="income-bar__track" aria-hidden="true">
                        <span
                          className={
                            measure === "mean"
                              ? "income-bar income-bar--mean"
                              : "income-bar"
                          }
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <small>{presentation.explanation}</small>
                    </li>
                  );
                })}
              </ul>

              {!monotone && (
                <p className="income-data-warning" role="note">
                  Los cortes publicados para este grupo no superan nuestra
                  comprobación de coherencia. Mostramos únicamente la media
                  publicada y ocultamos esos cortes.
                </p>
              )}

              <details className="income-technical-detail">
                <summary>Ver términos técnicos y tabla de datos</summary>
                <div
                  className="income-table-scroll"
                  role="region"
                  aria-label={`Tabla técnica: ${item.label}`}
                  tabIndex={0}
                >
                  <table>
                    <caption className="visually-hidden">
                      Datos técnicos: {item.label}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Medida publicada</th>
                        <th scope="col">Base anualizada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OUTCOME_MEASURE_ORDER.filter(
                        (measure) => monotone || measure === "mean",
                      ).map((measure) => {
                        const observation = indexed.get(measure);
                        return (
                          <tr key={measure}>
                            <th scope="row">
                              {
                                OUTCOME_MEASURE_PRESENTATION[measure]
                                  .technicalLabel
                              }
                            </th>
                            <td
                              className={
                                observation?.valueEur === null ||
                                observation === undefined
                                  ? "income-value income-value--unavailable"
                                  : "income-value"
                              }
                            >
                              {observation?.valueEur === null ||
                              observation === undefined
                                ? "No disponible o sin representatividad suficiente"
                                : formatValue(observation.valueEur)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
