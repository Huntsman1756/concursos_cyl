import { describe, expect, it } from "vitest";
import { normalizeCell } from "./normalizeOutcomeIndicators";

const context = {
  indicatorId: "indicator:1",
  trainingProgramKey: "ADG01M",
  officialProgramGroupLabel: "Gestión Administrativa",
  trainingLevel: "intermediate" as const,
  scope: "spain_program_group" as const,
  cohort: "2021-2022",
  postGraduationYear: 4 as const,
  measure: "mean" as const,
  unit: "eur_annualized_contribution_base" as const,
  sourceId: "educabase-test",
};

describe("normalizeCell", () => {
  it("preserves suppressed official values instead of coercing them to zero", () => {
    expect(normalizeCell("..", context)).toEqual({
      ...context,
      value: null,
      suppressionState: "not_published",
    });
  });

  it("normalizes decimal text and official not-applicable markers", () => {
    expect(normalizeCell("18.450,50", context).value).toBe(18450.5);
    expect(normalizeCell(":", context).suppressionState).toBe("not_applicable");
  });
});
