import type { OutcomeTrainingLevel } from "../../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "../../domain/outcomes";

export interface CompareSelection {
  trainingLevel: OutcomeTrainingLevel;
  groupKeys: readonly [string, ...string[]];
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
}

export type CompareSearchResult =
  | { kind: "empty" }
  | { kind: "program"; programKey: string }
  | { kind: "selection"; selection: CompareSelection }
  | { kind: "invalid"; message: string };

export const INVALID_COMPARE_LINK_MESSAGE =
  "Este enlace de comparación no es válido. Elige de nuevo los datos para continuar.";

const SUPPORTED_PARAMETERS = new Set(["level", "group", "cohort", "year"]);
const TRAINING_LEVELS = new Set<OutcomeTrainingLevel>([
  "intermediate",
  "higher",
]);
const POST_GRADUATION_YEARS = new Set(["1", "2", "3", "4"]);

function invalid(): CompareSearchResult {
  return { kind: "invalid", message: INVALID_COMPARE_LINK_MESSAGE };
}

function levelCohortKey(
  trainingLevel: OutcomeTrainingLevel,
  cohort: string,
): string {
  return `${trainingLevel}\0${cohort}`;
}

/** Parses only complete, official comparison intents from a URL. */
export function parseCompareSearch(
  params: URLSearchParams,
  index: IncomeOutcomeIndex,
): CompareSearchResult {
  const parameterNames = [...new Set(params.keys())];
  if (parameterNames.length === 0) return { kind: "empty" };

  const programValues = params.getAll("program");
  if (programValues.length > 0) {
    if (
      parameterNames.length !== 1 ||
      parameterNames[0] !== "program" ||
      programValues.length !== 1 ||
      programValues[0]?.trim() === ""
    ) {
      return invalid();
    }
    return { kind: "program", programKey: programValues[0] };
  }

  // Read each supported field with getAll so duplicate single-value fields
  // cannot be collapsed by URLSearchParams.get().
  const levelValues = params.getAll("level");
  const groupValues = params.getAll("group");
  const cohortValues = params.getAll("cohort");
  const yearValues = params.getAll("year");
  if (parameterNames.some((name) => !SUPPORTED_PARAMETERS.has(name))) {
    return invalid();
  }
  if (
    levelValues.length !== 1 ||
    cohortValues.length !== 1 ||
    yearValues.length !== 1 ||
    groupValues.length < 1 ||
    groupValues.length > 3
  ) {
    return invalid();
  }

  const trainingLevel = levelValues[0];
  const cohort = cohortValues[0];
  const yearValue = yearValues[0];
  if (
    !TRAINING_LEVELS.has(trainingLevel as OutcomeTrainingLevel) ||
    cohort.trim() === "" ||
    !POST_GRADUATION_YEARS.has(yearValue)
  ) {
    return invalid();
  }
  const postGraduationYear = Number(
    yearValue,
  ) as CompareSelection["postGraduationYear"];
  if (![1, 2, 3, 4].includes(postGraduationYear)) return invalid();
  if (new Set(groupValues).size !== groupValues.length) return invalid();

  const selectedLevel = trainingLevel as OutcomeTrainingLevel;
  const groups = groupValues.map((groupKey) => index.groupsByKey.get(groupKey));
  if (
    groups.some(
      (group) => group === undefined || group.trainingLevel !== selectedLevel,
    )
  ) {
    return invalid();
  }

  const cohortWindow = index.windowsByLevelAndCohort.get(
    levelCohortKey(selectedLevel, cohort),
  );
  if (
    cohortWindow === undefined ||
    cohortWindow.trainingLevel !== selectedLevel ||
    postGraduationYear > cohortWindow.maxObservedPostGraduationYear
  ) {
    return invalid();
  }

  return {
    kind: "selection",
    selection: {
      trainingLevel: selectedLevel,
      groupKeys: groupValues as [string, ...string[]],
      cohort,
      postGraduationYear,
    },
  };
}

/** Serializes only a complete local selection in its visible group order. */
export function serializeCompareSelection(
  selection: CompareSelection,
): URLSearchParams {
  const groupKeys = selection?.groupKeys;
  if (
    !selection ||
    !TRAINING_LEVELS.has(selection.trainingLevel) ||
    !Array.isArray(groupKeys) ||
    groupKeys.length < 1 ||
    groupKeys.length > 3 ||
    groupKeys.some(
      (groupKey) => typeof groupKey !== "string" || groupKey.trim() === "",
    ) ||
    new Set(groupKeys).size !== groupKeys.length ||
    typeof selection.cohort !== "string" ||
    selection.cohort.trim() === "" ||
    ![1, 2, 3, 4].includes(selection.postGraduationYear)
  ) {
    return new URLSearchParams();
  }

  const params = new URLSearchParams();
  params.set("level", selection.trainingLevel);
  for (const groupKey of groupKeys) params.append("group", groupKey);
  params.set("cohort", selection.cohort);
  params.set("year", String(selection.postGraduationYear));
  return params;
}
