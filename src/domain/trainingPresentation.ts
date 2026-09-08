import type { TrainingProgram } from "../../data/schemas/generated";
import type { MappingCoverage } from "../../data/schemas/curatedMappings";
import { formatEducationalLevel } from "./displayFormat";

/**
 * Display corrections for known typos in the published catalog titles. The
 * canonical source value stays untouched for matching and routes; only the
 * presented text is corrected.
 */
const PROGRAM_TITLE_CORRECTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bhibridos\b/giu, "híbridos"],
  [/\bWEB\b/gu, "Web"],
  [/\bGuia\b/gu, "Guía"],
  [/\bfloristeria\b/giu, "floristería"],
];

export function formatProgramTitle(value: string): string {
  return PROGRAM_TITLE_CORRECTIONS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

/** Citizen-facing educational level in sentence-style casing. */
export function trainingLevelLabel(level: TrainingProgram["level"]): string {
  return formatEducationalLevel(level);
}

export function featuredTrainingCoverage(
  rows: readonly MappingCoverage[],
): Extract<MappingCoverage, { scope: "program" }>[] {
  const families = new Set<string>();
  // Demonstrations of different pathways, not a ranking of employability.
  // A preferred example is eligible only while its published relations exist.
  const examples = ["ADG02S", "SSC01M", "IFC03S"];
  const exampleRank = (key: string) => {
    const index = examples.indexOf(key);
    return index === -1 ? examples.length : index;
  };
  return rows
    .filter(
      (row): row is Extract<MappingCoverage, { scope: "program" }> =>
        row.scope === "program" &&
        row.coverageStatus === "reviewed" &&
        row.approvedMappings > 0,
    )
    .sort(
      (left, right) =>
        exampleRank(left.programKey) - exampleRank(right.programKey) ||
        right.approvedMappings - left.approvedMappings ||
        left.programTitle.localeCompare(right.programTitle, "es", {
          sensitivity: "base",
        }) ||
        left.programKey.localeCompare(right.programKey),
    )
    .filter((row) => {
      if (families.has(row.familyCode)) return false;
      families.add(row.familyCode);
      return true;
    })
    .slice(0, 3);
}
