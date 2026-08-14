import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";
import type { OutcomeIndicator } from "../../data/schemas/generated";

export interface IndicatorChartItem {
  label: string;
  indicator: OutcomeIndicator;
}

function formatValue(indicator: OutcomeIndicator): string {
  if (indicator.value === null || indicator.suppressionState !== "published") {
    return "No publicado";
  }
  return indicator.unit === "percent"
    ? `${indicator.value.toLocaleString("es-ES")} %`
    : indicator.value.toLocaleString("es-ES", {
        maximumFractionDigits: 2,
      });
}

export function AccessibleIndicatorChart({
  title,
  items,
  unitLabel,
}: {
  title: string;
  items: IndicatorChartItem[];
  unitLabel: string;
}) {
  const plotContainer = useRef<HTMLDivElement>(null);
  const publishedItems = items.filter(
    ({ indicator }) =>
      indicator.value !== null && indicator.suppressionState === "published",
  );

  useEffect(() => {
    if (!plotContainer.current) return;
    plotContainer.current.replaceChildren();
    if (publishedItems.length === 0) return;
    const plot = Plot.plot({
      width: Math.max(1, plotContainer.current.clientWidth),
      height: 190,
      marginLeft: 48,
      marginBottom: 50,
      y: { grid: true, label: unitLabel },
      x: { label: null, tickRotate: -25 },
      marks: [
        Plot.barY(
          publishedItems.map(({ label, indicator }) => ({
            label,
            value: indicator.value,
          })),
          { x: "label", y: "value", fill: "#1d5f4b" },
        ),
        Plot.ruleY([0]),
      ],
    });
    plotContainer.current.append(plot);
    return () => plot.remove();
  }, [publishedItems, unitLabel]);

  return (
    <div className="indicator-chart">
      <div ref={plotContainer} aria-hidden="true" />
      <p className="indicator-chart__summary">
        {publishedItems.length > 0
          ? `${publishedItems.length} valores publicados para ${title.toLocaleLowerCase()}.`
          : "No hay valores publicados para esta selección."}
      </p>
      <table>
        <caption className="visually-hidden">{title}</caption>
        <thead>
          <tr>
            <th scope="col">Referencia</th>
            <th scope="col">{unitLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ label, indicator }) => (
            <tr key={indicator.indicatorId}>
              <th scope="row">{label}</th>
              <td>{formatValue(indicator)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
