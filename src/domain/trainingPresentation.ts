import type { TrainingProgram } from "../../data/schemas/generated";
import type { MappingCoverage } from "../../data/schemas/curatedMappings";

const levelLabels: Record<TrainingProgram["level"], string> = {
  basic: "Grado básico",
  intermediate: "Grado medio",
  higher: "Grado superior",
  specialization: "Curso de especialización",
};

export function trainingLevelLabel(level: TrainingProgram["level"]): string {
  return levelLabels[level];
}

export function featuredTrainingCoverage(
  rows: readonly MappingCoverage[],
): Extract<MappingCoverage, { scope: "program" }>[] {
  const families = new Set<string>();
  return rows
    .filter(
      (row): row is Extract<MappingCoverage, { scope: "program" }> =>
        row.scope === "program" && row.coverageStatus === "reviewed",
    )
    .sort(
      (left, right) =>
        left.programTitle.localeCompare(right.programTitle, "es", {
          sensitivity: "base",
        }) || left.programKey.localeCompare(right.programKey),
    )
    .filter((row) => {
      if (families.has(row.familyCode)) return false;
      families.add(row.familyCode);
      return true;
    })
    .slice(0, 3);
}
