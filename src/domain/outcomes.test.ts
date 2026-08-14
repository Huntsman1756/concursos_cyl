import { describe, expect, it } from "vitest";
import type { OutcomeIndicator } from "../../data/schemas/generated";
import { getCompatibleComparison } from "./outcomes";

const indicator = (
  programKey: string,
  cohort: string,
  scope: OutcomeIndicator["scope"],
): OutcomeIndicator => ({
  indicatorId: `${programKey}-${scope}`,
  trainingProgramKey: programKey,
  officialProgramGroupLabel: programKey,
  trainingLevel: "intermediate",
  scope,
  cohort,
  postGraduationYear: 4,
  measure: "mean",
  value: 18000,
  unit: "eur_annualized_contribution_base",
  suppressionState: "published",
  sourceId: "educabase-test",
});

describe("getCompatibleComparison", () => {
  it("rejects comparison across different cohorts", () => {
    expect(() =>
      getCompatibleComparison(
        [indicator("ADG01M", "2020-2021", "spain_program_group")],
        {
          programKeys: ["ADG01M", "IFC03S"],
          cohortByProgram: { ADG01M: "2020-2021", IFC03S: "2021-2022" },
          postGraduationYear: 4,
        },
      ),
    ).toThrow(/same cohort/i);
  });

  it("keeps national and regional scopes separate", () => {
    const result = getCompatibleComparison(
      [
        indicator("ADG01M", "2020-2021", "spain_program_group"),
        indicator("ADG01M", "2020-2021", "castilla_leon_training_level"),
      ],
      {
        programKeys: ["ADG01M"],
        cohortByProgram: { ADG01M: "2020-2021" },
        postGraduationYear: 4,
      },
    );
    expect(result.national).toHaveLength(1);
    expect(result.regional).toHaveLength(1);
  });
});
