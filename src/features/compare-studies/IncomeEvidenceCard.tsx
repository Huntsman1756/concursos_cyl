import { useId } from "react";

import type {
  OutcomeMeasure,
  OutcomeObservation,
} from "../../../data/schemas/outcomes";

export interface IncomeEvidenceCardProps {
  heading: string;
  scopeLabel: string;
  detail?: string;
  observations: readonly OutcomeObservation[];
  groupLabels?: ReadonlyMap<string, string>;
}

const MEASURE_LABELS: Readonly<Record<OutcomeMeasure, string>> = {
  mean: "Media",
  quintile_20_lower_boundary: "Límite inferior del segundo quintil",
  quintile_40_lower_boundary: "Límite inferior del tercer quintil",
  quintile_60_lower_boundary: "Límite inferior del cuarto quintil",
  quintile_80_lower_boundary: "Límite inferior del quinto quintil",
};

function formatValue(value: number | null): string {
  if (value === null) return "No disponible o sin representatividad suficiente";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Presents one source scope as a semantic table without deriving a new indicator. */
export function IncomeEvidenceCard({
  heading,
  scopeLabel,
  detail,
  observations,
  groupLabels,
}: IncomeEvidenceCardProps) {
  const headingId = useId();
  const showGroup = groupLabels !== undefined;
  return (
    <section className="income-evidence-card" aria-labelledby={headingId}>
      <header className="income-evidence-card__header">
        <p className="income-evidence-card__scope">{scopeLabel}</p>
        <h2 id={headingId}>{heading}</h2>
        {detail ? <p>{detail}</p> : null}
      </header>
      <div
        className="income-table-scroll"
        role="region"
        aria-label={`Tabla desplazable: ${heading}`}
        tabIndex={0}
      >
        <table>
          <caption className="visually-hidden">{heading}</caption>
          <thead>
            <tr>
              {showGroup ? <th scope="col">Ciclo o grupo oficial</th> : null}
              <th scope="col">Medida</th>
              <th scope="col">Base anualizada</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((observation) => (
              <tr key={observation.observationId}>
                {showGroup ? (
                  <th scope="row">
                    {groupLabels.get(observation.groupKey ?? "") ??
                      observation.officialGroupLabel}
                  </th>
                ) : null}
                <td>{MEASURE_LABELS[observation.measure]}</td>
                <td
                  className={
                    observation.valueEur === null
                      ? "income-value income-value--unavailable"
                      : "income-value"
                  }
                >
                  {formatValue(observation.valueEur)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
