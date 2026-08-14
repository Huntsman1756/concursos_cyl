import type { TrainingLevel } from "../../../data/schemas/generated";
import type { CompatibleComparison } from "../../domain/outcomes";
import {
  AccessibleIndicatorChart,
  type IndicatorChartItem,
} from "../../components/AccessibleIndicatorChart";

const levelLabels: Record<TrainingLevel, string> = {
  basic: "Grado Básico",
  intermediate: "Grado Medio",
  higher: "Grado Superior",
  specialization: "Especialización",
};

function itemsFromIndicators(
  indicators: CompatibleComparison["national"],
): IndicatorChartItem[] {
  return indicators.map((indicator) => ({
    label: indicator.officialProgramGroupLabel ?? indicator.trainingLevel,
    indicator,
  }));
}

export function IncomeIndicators({
  comparison,
  trainingLevel,
}: {
  comparison: CompatibleComparison;
  trainingLevel: TrainingLevel;
}) {
  const national = comparison.national.filter(
    (indicator) =>
      ["mean", "quintile_1", "quintile_2", "quintile_3", "quintile_4"].includes(
        indicator.measure,
      ) && indicator.unit === "eur_annualized_contribution_base",
  );
  const regional = comparison.regional.filter(
    (indicator) =>
      indicator.measure === "mean" &&
      indicator.unit === "eur_annualized_contribution_base",
  );
  return (
    <section className="comparison-section" aria-labelledby="income-title">
      <h2 id="income-title">Ingresos observados</h2>
      <div className="indicator-grid">
        <article className="indicator-card">
          <h3>
            Ingresos observados de titulados de este ciclo o grupo en España
          </h3>
          <p>Base de cotización anualizada · jornada completa · España</p>
          <AccessibleIndicatorChart
            title="ingresos nacionales"
            items={itemsFromIndicators(national)}
            unitLabel="Base anualizada"
          />
        </article>
        <article className="indicator-card">
          <h3>
            Referencia de titulados de {levelLabels[trainingLevel]} en Castilla
            y León
          </h3>
          <p>
            Mostramos ambas referencias por separado porque no existe una
            estadística oficial de ingresos por ciclo formativo en Castilla y
            León.
          </p>
          <AccessibleIndicatorChart
            title="referencia regional"
            items={itemsFromIndicators(regional)}
            unitLabel="Base anualizada"
          />
        </article>
      </div>
    </section>
  );
}
