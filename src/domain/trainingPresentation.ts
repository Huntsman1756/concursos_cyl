import type { TrainingProgram } from "../../data/schemas/generated";
import type { MappingCoverage } from "../../data/schemas/curatedMappings";

const levelLabels: Record<TrainingProgram["level"], string> = {
  basic: "Grado básico",
  intermediate: "Grado medio",
  higher: "Grado superior",
  specialization: "Curso de especialización",
};

/**
 * Display corrections for known typos in the published catalog titles. The
 * canonical source value stays untouched for matching and routes; only the
 * presented text is corrected.
 */
const PROGRAM_TITLE_CORRECTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bhibridos\b/giu, "híbridos"],
  [/\bWEB\b/gu, "Web"],
];

export function formatProgramTitle(value: string): string {
  return PROGRAM_TITLE_CORRECTIONS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

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
