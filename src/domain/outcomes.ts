import type { OutcomeIndicator } from "../../data/schemas/generated";

export interface ComparisonSelection {
  programKeys: string[];
  cohortByProgram: Record<string, string>;
  postGraduationYear: 1 | 2 | 3 | 4;
  measure?: OutcomeIndicator["measure"];
  unit?: OutcomeIndicator["unit"];
}

export interface CompatibleComparison {
  national: OutcomeIndicator[];
  regional: OutcomeIndicator[];
}

export function getCompatibleComparison(
  indicators: OutcomeIndicator[],
  selection: ComparisonSelection,
): CompatibleComparison {
  const selected = indicators.filter(
    (indicator) =>
      indicator.trainingProgramKey !== null &&
      selection.programKeys.includes(indicator.trainingProgramKey) &&
      indicator.postGraduationYear === selection.postGraduationYear,
  );
  const cohorts = new Set(
    selection.programKeys.map((key) => selection.cohortByProgram[key]),
  );
  if (cohorts.size > 1) throw new Error("Programs must use the same cohort");

  const cohort = [...cohorts][0];
  const filtered = selected.filter(
    (indicator) =>
      indicator.cohort === cohort &&
      (selection.measure ? indicator.measure === selection.measure : true) &&
      (selection.unit ? indicator.unit === selection.unit : true),
  );
  const national = filtered.filter(
    (indicator) => indicator.scope === "spain_program_group",
  );
  const regional = filtered.filter(
    (indicator) => indicator.scope !== "spain_program_group",
  );
  return { national, regional };
}
