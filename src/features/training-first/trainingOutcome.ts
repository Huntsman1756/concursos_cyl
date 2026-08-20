import type { TrainingProgram } from "../../../data/schemas/generated";
import type {
  OutcomeGroup,
  OutcomeMeasure,
  OutcomeObservation,
  OutcomeTrainingLevel,
} from "../../../data/schemas/outcomes";
import type { IncomeOutcomeIndex } from "../../domain/outcomes";
import {
  formatOutcomeLabel,
  OUTCOME_MEASURE_PRESENTATION,
} from "../compare-studies/outcomePresentation";

export const TRAINING_OUTCOME_COHORT = "2019-2020";
export const TRAINING_OUTCOME_YEAR = 4 as const;

export interface TrainingOutcomeSnapshot {
  sourceUrl: string;
  snapshotFetchedAt: string;
  stale: boolean;
}

export type TrainingOutcomeState =
  | {
      status: "available";
      index: IncomeOutcomeIndex;
      snapshot: TrainingOutcomeSnapshot;
    }
  | { status: "unavailable" }
  | { status: "invalid" };

export interface TrainingOutcomeGroupMatch {
  group: OutcomeGroup;
  matchType: "cycle" | "family";
}

export interface TrainingOutcomeObservationSet {
  mean: OutcomeObservation | undefined;
  lower: OutcomeObservation | undefined;
  upper: OutcomeObservation | undefined;
}

export interface TrainingOutcomeView {
  trainingLevel: OutcomeTrainingLevel;
  regional: TrainingOutcomeObservationSet;
  national: TrainingOutcomeObservationSet | null;
  groupMatch: TrainingOutcomeGroupMatch | null;
}

const OBSERVATION_MEASURES = {
  mean: "mean",
  lower: "quintile_20_lower_boundary",
  upper: "quintile_80_lower_boundary",
} as const satisfies Record<string, OutcomeMeasure>;

function outcomeTrainingLevel(
  level: TrainingProgram["level"],
): OutcomeTrainingLevel | null {
  if (level === "intermediate" || level === "higher") return level;
  return null;
}

function normalizedMatchValue(value: string): string {
  const withoutDiacritics = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return withoutDiacritics
    .toLocaleLowerCase("es-ES")
    .replace(/\s*\((?:a\s+)?distancia\)\s*$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

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

function observationSet(
  index: IncomeOutcomeIndex,
  scope: "castilla_leon_training_level" | "spain_cycle_group",
  trainingLevel: OutcomeTrainingLevel,
  groupKey: string | null,
): TrainingOutcomeObservationSet | null {
  const coordinate = [
    scope,
    trainingLevel,
    groupKey ?? "",
    TRAINING_OUTCOME_COHORT,
    TRAINING_OUTCOME_YEAR,
  ].join("\0");
  const measures = index.observationsByCoordinate.get(coordinate);
  if (measures === undefined) return null;
  return {
    mean: measures.get(OBSERVATION_MEASURES.mean),
    lower: measures.get(OBSERVATION_MEASURES.lower),
    upper: measures.get(OBSERVATION_MEASURES.upper),
  };
}

export function selectTrainingOutcomeView(
  program: Pick<TrainingProgram, "programTitle" | "familyName" | "level">,
  index: IncomeOutcomeIndex,
): TrainingOutcomeView | null {
  const trainingLevel = outcomeTrainingLevel(program.level);
  if (trainingLevel === null) return null;

  const regional = observationSet(
    index,
    "castilla_leon_training_level",
    trainingLevel,
    null,
  );
  if (regional === null) return null;

  const groupMatch = findTrainingOutcomeGroup(program, index);
  const national =
    groupMatch === null
      ? null
      : observationSet(
          index,
          "spain_cycle_group",
          trainingLevel,
          groupMatch.group.groupKey,
        );

  return { trainingLevel, regional, national, groupMatch };
}

export function formatOutcomeValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "No disponible";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatOutcomeSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function outcomeMetricLabel(
  groupMatch: TrainingOutcomeGroupMatch | null,
): string | null {
  if (groupMatch === null) return null;
  return groupMatch.matchType === "cycle"
    ? "España · grupo del ciclo"
    : "España · familia profesional";
}

export function outcomeObservationLabel(
  observation: OutcomeObservation | undefined,
): string {
  if (observation?.valueEur !== null && observation?.valueEur !== undefined) {
    return formatOutcomeValue(observation.valueEur);
  }
  return OUTCOME_MEASURE_PRESENTATION[
    observation?.measure ?? OBSERVATION_MEASURES.mean
  ].plainLabel === "Media anual"
    ? "No disponible"
    : "No disponible o sin representatividad suficiente";
}

export { formatOutcomeLabel };
