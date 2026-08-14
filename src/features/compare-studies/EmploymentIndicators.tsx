import type { CompatibleComparison } from "../../domain/outcomes";
import {
  AccessibleIndicatorChart,
  type IndicatorChartItem,
} from "../../components/AccessibleIndicatorChart";

function itemsFromIndicators(
  indicators: CompatibleComparison["national"],
): IndicatorChartItem[] {
  return indicators.map((indicator) => ({
    label: indicator.officialProgramGroupLabel ?? indicator.trainingLevel,
    indicator,
  }));
}

export function EmploymentIndicators({
  comparison,
}: {
  comparison: CompatibleComparison;
}) {
  const national = comparison.national.filter(
    (indicator) =>
      indicator.measure === "affiliation_rate" && indicator.unit === "percent",
  );
  const regional = comparison.regional.filter(
    (indicator) =>
      indicator.measure === "affiliation_rate" && indicator.unit === "percent",
  );
  return (
    <section className="comparison-section" aria-labelledby="employment-title">
      <h2 id="employment-title">Empleo</h2>
      <p>
        Mostramos ambos indicadores por separado porque combinarlos daría una
        cifra que no existe en ningún informe oficial.
      </p>
      <div className="indicator-grid">
        <article className="indicator-card">
          <h3>Tu familia profesional en Castilla y León</h3>
          <AccessibleIndicatorChart
            title="afiliación regional"
            items={itemsFromIndicators(regional)}
            unitLabel="Afiliación (%)"
          />
        </article>
        <article className="indicator-card">
          <h3>Tu ciclo o grupo oficial en España</h3>
          <AccessibleIndicatorChart
            title="afiliación nacional"
            items={itemsFromIndicators(national)}
            unitLabel="Afiliación (%)"
          />
        </article>
      </div>
    </section>
  );
}
