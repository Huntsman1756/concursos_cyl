import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { OutcomeObservation } from "../../../data/schemas/outcomes";
import { IncomeEvidenceCard } from "./IncomeEvidenceCard";
import { OUTCOME_MEASURE_ORDER } from "./outcomePresentation";

function observation(
  measure: OutcomeObservation["measure"],
  valueEur: number | null,
): OutcomeObservation {
  return {
    kind: "observation",
    observationId: `obs-${measure}`,
    sourceTableId: "famprof_3_08",
    scope: "spain_cycle_group",
    trainingLevel: "higher",
    groupKey: "higher:radioterapia",
    officialGroupLabel: "Radioterapia y dosimetría",
    cohort: "2019-2020",
    postGraduationYear: 4,
    measure,
    valueEur,
    availability:
      valueEur === null ? "unavailable_or_unrepresentative" : "published",
    provisional: false,
  };
}

function monotoneObservations(): OutcomeObservation[] {
  return OUTCOME_MEASURE_ORDER.map((measure, index) =>
    observation(measure, 12000 + index * 1000),
  );
}

afterEach(cleanup);

describe("IncomeEvidenceCard", () => {
  it("presents the annual average exactly once per series", () => {
    render(
      <IncomeEvidenceCard
        heading="Ingresos observados del ciclo o grupo en España"
        scopeLabel="España"
        observations={monotoneObservations()}
      />,
    );

    // Header shows the mean; the distribution shows only the percentile cuts.
    const header = screen.getByText("Media anual");
    expect(header).toBeVisible();
    expect(screen.getAllByText("Media anual")).toHaveLength(1);
    expect(screen.getByText("Corte del 20 %")).toBeVisible();
    expect(screen.getByText("Corte del 80 %")).toBeVisible();
  });

  it("hides the distribution and explains why when the cuts fail the coherence check", () => {
    const nonMonotone = monotoneObservations().map((item, index) =>
      index === 3 ? observation(item.measure, 9000) : item,
    );
    render(
      <IncomeEvidenceCard
        heading="Ingresos observados del ciclo o grupo en España"
        scopeLabel="España"
        observations={nonMonotone}
      />,
    );

    expect(screen.getByText("Media anual")).toBeVisible();
    expect(screen.queryByText("Corte del 20 %")).not.toBeInTheDocument();
    expect(screen.getByText(/no superan nuestra/u)).toBeVisible();
  });
});
