import {
  APPROVED_OUTCOME_COHORTS,
  OutcomeIndicatorsResourceSchema,
  type OutcomeCohortWindow,
  type OutcomeGroup,
  type OutcomeIndicatorsResource,
  type OutcomeMeasure,
  type OutcomeObservation,
  type OutcomeTrainingLevel,
} from "../../data/schemas/outcomes";

const OUTCOME_MEASURES: readonly OutcomeMeasure[] = [
  "mean",
  "quintile_20_lower_boundary",
  "quintile_40_lower_boundary",
  "quintile_60_lower_boundary",
  "quintile_80_lower_boundary",
];

export interface IncomeComparisonSelection {
  trainingLevel: OutcomeTrainingLevel;
  groupKeys: readonly [string, ...string[]];
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
}

export interface IncomeComparison {
  selection: IncomeComparisonSelection;
  groups: readonly OutcomeGroup[];
  cohortWindow: OutcomeCohortWindow;
  national: readonly OutcomeObservation[];
  regional: readonly OutcomeObservation[];
}

type ObservationMeasureMap = ReadonlyMap<OutcomeMeasure, OutcomeObservation>;

export interface IncomeOutcomeIndex {
  readonly groupsByKey: ReadonlyMap<string, OutcomeGroup>;
  readonly windowsByLevelAndCohort: ReadonlyMap<string, OutcomeCohortWindow>;
  readonly observationsByCoordinate: ReadonlyMap<string, ObservationMeasureMap>;
}

function levelCohortKey(
  trainingLevel: OutcomeTrainingLevel,
  cohort: string,
): string {
  return `${trainingLevel}\0${cohort}`;
}

function observationCoordinateKey(observation: OutcomeObservation): string {
  return [
    observation.scope,
    observation.trainingLevel,
    observation.groupKey ?? "",
    observation.cohort,
    observation.postGraduationYear,
  ].join("\0");
}

function completeMeasures(
  measures: ReadonlyMap<OutcomeMeasure, OutcomeObservation>,
  coordinate: string,
): readonly OutcomeObservation[] {
  const records = OUTCOME_MEASURES.map((measure) => measures.get(measure));
  if (records.some((record) => record === undefined)) {
    throw new Error(
      `Income observation coordinate has incomplete measures: ${coordinate}`,
    );
  }
  return records as readonly OutcomeObservation[];
}

function requireWindow(
  windows: ReadonlyMap<string, OutcomeCohortWindow>,
  trainingLevel: OutcomeTrainingLevel,
  cohort: string,
): OutcomeCohortWindow {
  const window = windows.get(levelCohortKey(trainingLevel, cohort));
  if (!window) {
    throw new Error(`Unknown income cohort for ${trainingLevel}: ${cohort}`);
  }
  return window;
}

function assertCompleteReferenceCoverage(
  groups: ReadonlyMap<string, OutcomeGroup>,
  windows: ReadonlyMap<string, OutcomeCohortWindow>,
  observations: ReadonlyMap<string, ObservationMeasureMap>,
): void {
  for (const window of windows.values()) {
    for (
      let year = 1;
      year <= window.maxObservedPostGraduationYear;
      year += 1
    ) {
      const regionalCoordinate = [
        "castilla_leon_training_level",
        window.trainingLevel,
        "",
        window.cohort,
        year,
      ].join("\0");
      const regionalMeasures = observations.get(regionalCoordinate);
      if (!regionalMeasures) {
        throw new Error(
          `Missing regional income reference for ${window.trainingLevel}, ${window.cohort}, year ${year}`,
        );
      }
      completeMeasures(regionalMeasures, regionalCoordinate);
      for (const group of groups.values()) {
        if (group.trainingLevel !== window.trainingLevel) continue;
        const nationalCoordinate = [
          "spain_cycle_group",
          group.trainingLevel,
          group.groupKey,
          window.cohort,
          year,
        ].join("\0");
        const nationalMeasures = observations.get(nationalCoordinate);
        if (!nationalMeasures) {
          throw new Error(
            `Missing national income evidence for ${group.groupKey}, ${window.cohort}, year ${year}`,
          );
        }
        completeMeasures(nationalMeasures, nationalCoordinate);
      }
    }
  }
}

function assertCompleteOutcomeUniverse(
  groups: ReadonlyMap<string, OutcomeGroup>,
  windows: ReadonlyMap<string, OutcomeCohortWindow>,
): void {
  const intermediateGroupCount = [...groups.values()].filter(
    (group) => group.trainingLevel === "intermediate",
  ).length;
  const higherGroupCount = [...groups.values()].filter(
    (group) => group.trainingLevel === "higher",
  ).length;
  if (
    groups.size !== 96 ||
    intermediateGroupCount !== 34 ||
    higherGroupCount !== 62
  ) {
    throw new Error(
      "Income outcome universe must contain exactly 34 intermediate and 62 higher groups",
    );
  }
  if (windows.size !== 24) {
    throw new Error(
      "Income outcome universe must contain exactly 24 cohort windows",
    );
  }
  for (const trainingLevel of ["intermediate", "higher"] as const) {
    for (const cohort of APPROVED_OUTCOME_COHORTS) {
      if (!windows.has(levelCohortKey(trainingLevel, cohort))) {
        throw new Error(
          `Income outcome universe is missing ${trainingLevel} cohort ${cohort}`,
        );
      }
    }
  }
}

/** Indexes only complete, scope-preserving income observations. */
export function indexIncomeOutcomes(
  records: OutcomeIndicatorsResource,
): IncomeOutcomeIndex {
  const validated: OutcomeIndicatorsResource =
    OutcomeIndicatorsResourceSchema.parse(records);
  const groupsByKey = new Map<string, OutcomeGroup>();
  const windowsByLevelAndCohort = new Map<string, OutcomeCohortWindow>();
  const observationsByCoordinate = new Map<
    string,
    Map<OutcomeMeasure, OutcomeObservation>
  >();
  const observationIds = new Set<string>();

  for (const record of validated.filter(
    (value): value is OutcomeGroup => value.kind === "group",
  )) {
    if (groupsByKey.has(record.groupKey)) {
      throw new Error(`Duplicate income group identity: ${record.groupKey}`);
    }
    groupsByKey.set(record.groupKey, record);
  }
  for (const record of validated.filter(
    (value): value is OutcomeCohortWindow => value.kind === "cohort_window",
  )) {
    const key = levelCohortKey(record.trainingLevel, record.cohort);
    if (windowsByLevelAndCohort.has(key)) {
      throw new Error(`Duplicate income cohort window: ${key}`);
    }
    windowsByLevelAndCohort.set(key, record);
  }
  for (const record of validated.filter(
    (value): value is OutcomeObservation => value.kind === "observation",
  )) {
    if (observationIds.has(record.observationId)) {
      throw new Error(
        `Duplicate income observation ID: ${record.observationId}`,
      );
    }
    observationIds.add(record.observationId);
    const window = requireWindow(
      windowsByLevelAndCohort,
      record.trainingLevel,
      record.cohort,
    );
    if (
      record.provisional !== window.provisional ||
      record.postGraduationYear > window.maxObservedPostGraduationYear
    ) {
      throw new Error(
        `Income observation conflicts with its cohort window: ${record.observationId}`,
      );
    }
    if (record.scope === "spain_cycle_group") {
      const group = record.groupKey
        ? groupsByKey.get(record.groupKey)
        : undefined;
      if (
        !group ||
        group.officialLabel !== record.officialGroupLabel ||
        group.trainingLevel !== record.trainingLevel ||
        group.sourceTableId !== record.sourceTableId
      ) {
        throw new Error(
          `Income observation has no matching group identity: ${record.observationId}`,
        );
      }
    }
    const coordinate = observationCoordinateKey(record);
    const measures = observationsByCoordinate.get(coordinate) ?? new Map();
    if (measures.has(record.measure)) {
      throw new Error(`Duplicate income observation measure at ${coordinate}`);
    }
    measures.set(record.measure, record);
    observationsByCoordinate.set(coordinate, measures);
  }

  for (const [coordinate, measures] of observationsByCoordinate) {
    completeMeasures(measures, coordinate);
  }
  assertCompleteOutcomeUniverse(groupsByKey, windowsByLevelAndCohort);
  assertCompleteReferenceCoverage(
    groupsByKey,
    windowsByLevelAndCohort,
    observationsByCoordinate,
  );
  return {
    groupsByKey,
    windowsByLevelAndCohort,
    observationsByCoordinate,
  };
}

/** Selects one shared cohort/year without aggregating or territorializing evidence. */
export function getIncomeComparison(
  index: IncomeOutcomeIndex,
  selection: IncomeComparisonSelection,
): IncomeComparison {
  if (selection.groupKeys.length < 1 || selection.groupKeys.length > 3) {
    throw new Error("Choose between one and three official income groups");
  }
  if (new Set(selection.groupKeys).size !== selection.groupKeys.length) {
    throw new Error("Income comparison groups must be unique");
  }
  const groups = selection.groupKeys.map((groupKey) => {
    const group = index.groupsByKey.get(groupKey);
    if (!group) throw new Error(`Unknown income group: ${groupKey}`);
    if (group.trainingLevel !== selection.trainingLevel) {
      throw new Error(
        "All selected income groups must have the same training level",
      );
    }
    return group;
  });
  const cohortWindow = requireWindow(
    index.windowsByLevelAndCohort,
    selection.trainingLevel,
    selection.cohort,
  );
  if (
    selection.postGraduationYear > cohortWindow.maxObservedPostGraduationYear
  ) {
    throw new Error("The selected post-graduation year is not yet observed");
  }
  const national = groups.flatMap((group) => {
    const coordinate = [
      "spain_cycle_group",
      selection.trainingLevel,
      group.groupKey,
      selection.cohort,
      selection.postGraduationYear,
    ].join("\0");
    const measures = index.observationsByCoordinate.get(coordinate);
    if (!measures) {
      throw new Error(`Missing national income evidence for ${group.groupKey}`);
    }
    return completeMeasures(measures, coordinate);
  });
  const regionalCoordinate = [
    "castilla_leon_training_level",
    selection.trainingLevel,
    "",
    selection.cohort,
    selection.postGraduationYear,
  ].join("\0");
  const regionalMeasures =
    index.observationsByCoordinate.get(regionalCoordinate);
  if (!regionalMeasures) {
    throw new Error(
      "Missing regional income reference for the selected coordinate",
    );
  }
  return {
    selection,
    groups,
    cohortWindow,
    national,
    regional: completeMeasures(regionalMeasures, regionalCoordinate),
  };
}
