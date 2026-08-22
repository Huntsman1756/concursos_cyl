import type { TrainingProgram } from "../../data/schemas/generated";
import type {
  OutcomeGroup,
  OutcomeTrainingLevel,
} from "../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "./outcomes";

export interface TrainingOutcomeGroupMatch {
  group: OutcomeGroup;
  matchType: "cycle" | "family";
}

/** Maps the public training catalogue levels to the outcome publication scope. */
export function outcomeTrainingLevel(
  level: TrainingProgram["level"],
): OutcomeTrainingLevel | null {
  if (level === "intermediate" || level === "higher") return level;
  return null;
}

/** Normalizes official labels without broadening the identity match. */
export function normalizedMatchValue(value: string): string {
  const withoutDiacritics = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return withoutDiacritics
    .toLocaleLowerCase("es-ES")
    .replace(/\s*\((?:a\s+)?distancia\)\s*$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Finds the exact published cycle, falling back only to its family reference. */
export function findTrainingOutcomeGroup(
  program: Pick<TrainingProgram, "programTitle" | "familyName" | "level">,
  index: Pick<IncomeOutcomeIndex, "groupsByKey">,
): TrainingOutcomeGroupMatch | null {
  const trainingLevel = outcomeTrainingLevel(program.level);
  if (trainingLevel === null) return null;

  const groups = [...index.groupsByKey.values()].filter(
    (group) => group.trainingLevel === trainingLevel,
  );
  const programTitle = normalizedMatchValue(program.programTitle);
  const titleGroup = groups.find(
    (group) => normalizedMatchValue(group.officialLabel) === programTitle,
  );
  if (titleGroup !== undefined) {
    return { group: titleGroup, matchType: "cycle" };
  }

  const familyName = normalizedMatchValue(program.familyName);
  const familyGroup = groups.find(
    (group) => normalizedMatchValue(group.officialLabel) === familyName,
  );
  return familyGroup === undefined
    ? null
    : { group: familyGroup, matchType: "family" };
}
