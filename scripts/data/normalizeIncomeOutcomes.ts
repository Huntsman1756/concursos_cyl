import { createHash } from "node:crypto";

import {
  OutcomeIndicatorsResourceSchema,
  type OutcomeCohortWindow,
  type OutcomeGroup,
  type OutcomeIndicatorRecord,
  type OutcomeIndicatorsResource,
  type OutcomeMeasure,
  type OutcomeObservation,
  type OutcomeTrainingLevel,
} from "../../data/schemas/outcomes";
import {
  EDUCABASE_INCOME_SOURCES,
  EDUCABASE_INCOME_TABLE_IDS,
  type EducabaseIncomeTableId,
} from "./educabaseIncomeSources";
import type { VerifiedIncomeTable } from "./loadEducabaseIncome";
import type {
  ParsedIncomeCell,
  ParsedIncomeTable,
} from "./parseEducabaseIncomeCsv";

export const SOURCE_MEASURE_MAP = {
  Media: "mean",
  "Límite inferior segundo quintil": "quintile_20_lower_boundary",
  "Límite inferior tercer quintil": "quintile_40_lower_boundary",
  "Límite inferior cuarto quintil": "quintile_60_lower_boundary",
  "Límite inferior quinto quintil": "quintile_80_lower_boundary",
} as const satisfies Readonly<Record<string, OutcomeMeasure>>;

const POST_GRADUATION_YEAR_BY_PERIOD = {
  "Primer año": 1,
  "Segundo año": 2,
  "Tercer año": 3,
  "Cuarto año": 4,
} as const;

const MAX_SAFE_DISPLAYED_EUROS = BigInt(Number.MAX_SAFE_INTEGER);

interface CohortFacts {
  cohort: string;
  provisional: boolean;
  maxObservedPostGraduationYear: 2 | 3 | 4;
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function hashIdentifier(prefix: string, input: string): string {
  return `${prefix}${createHash("sha256").update(input).digest("hex").slice(0, 16)}`;
}

function normalizeCohort(rawCohort: string): CohortFacts {
  if (rawCohort.endsWith(" (p)")) {
    const cohort = rawCohort.slice(0, -4);
    if (cohort === "2021-2022") {
      return { cohort, provisional: true, maxObservedPostGraduationYear: 3 };
    }
    if (cohort === "2022-2023") {
      return { cohort, provisional: true, maxObservedPostGraduationYear: 2 };
    }
    throw new Error(`Unexpected provisional income cohort: ${rawCohort}`);
  }
  if (!/^20(?:1[1-9]|2[0])-(?:20(?:1[2-9]|2[0-1]))$/u.test(rawCohort)) {
    throw new Error(`Unexpected non-provisional income cohort: ${rawCohort}`);
  }
  return {
    cohort: rawCohort,
    provisional: false,
    maxObservedPostGraduationYear: 4,
  };
}

function assertObservationNote(table: ParsedIncomeTable): void {
  if (
    !table.note.includes("Datos provisionales") ||
    !table.note.includes("3 años") ||
    !table.note.includes("cohorte 2021-2022") ||
    !table.note.includes("2 años") ||
    !table.note.includes("cohorte 2022-2023")
  ) {
    throw new Error(
      `${table.tableId} does not establish the approved provisional observation windows`,
    );
  }
}

function normalizeSourceMeasure(rawMeasure: string): OutcomeMeasure {
  const measure =
    SOURCE_MEASURE_MAP[rawMeasure as keyof typeof SOURCE_MEASURE_MAP];
  if (!measure)
    throw new Error(`Unsupported official income measure: ${rawMeasure}`);
  return measure;
}

function parseDisplayedEur(rawValue: string): number | null {
  if (rawValue === "..") return null;
  if (!/^[0-9]+(?:\.[0-9]{3})*$/u.test(rawValue)) {
    throw new Error(
      `Income value is not an official displayed whole euro: ${rawValue}`,
    );
  }
  const value = BigInt(rawValue.replaceAll(".", ""));
  if (value > MAX_SAFE_DISPLAYED_EUROS) {
    throw new Error("Income value exceeds the safe displayed-euro range");
  }
  return Number(value);
}

function canonicalCellCoordinate(
  table: ParsedIncomeTable,
  cell: ParsedIncomeCell,
): string {
  return [
    table.tableId,
    ...table.dimensions.flatMap((dimension) => [
      dimension.name,
      cell.dimensions[dimension.name] ?? "",
    ]),
  ].join("\0");
}

function assertVerifiedTables(
  tables: readonly VerifiedIncomeTable[],
): ReadonlyMap<EducabaseIncomeTableId, VerifiedIncomeTable> {
  if (tables.length !== EDUCABASE_INCOME_TABLE_IDS.length) {
    throw new Error(
      "Income normalization requires exactly four verified tables",
    );
  }
  const tableById = new Map<EducabaseIncomeTableId, VerifiedIncomeTable>();
  for (const verified of tables) {
    const tableId = verified.table.tableId;
    if (
      !EDUCABASE_INCOME_TABLE_IDS.includes(tableId) ||
      tableById.has(tableId)
    ) {
      throw new Error(
        `Income normalization has a duplicate or unknown table: ${tableId}`,
      );
    }
    tableById.set(tableId, verified);
  }
  for (const tableId of EDUCABASE_INCOME_TABLE_IDS) {
    if (!tableById.has(tableId)) {
      throw new Error(`Income normalization is missing ${tableId}`);
    }
  }
  return tableById;
}

function recordsForNationalTable(
  verified: VerifiedIncomeTable,
  knownGroupKeys: Map<string, string>,
  knownObservationIds: Map<string, string>,
): { groups: OutcomeGroup[]; observations: OutcomeObservation[] } {
  const { table } = verified;
  const source = EDUCABASE_INCOME_SOURCES[table.tableId];
  if (source.scope !== "spain_cycle_group") {
    throw new Error(`${table.tableId} is not a national cycle-group table`);
  }
  assertObservationNote(table);
  const groupDimension = table.dimensions.at(-1);
  if (!groupDimension)
    throw new Error(`${table.tableId} has no group dimension`);
  const trainingLevel = source.trainingLevel;
  const groupKeyByLabel = new Map<string, string>();
  const groups = groupDimension.values.map((officialLabel) => {
    const coordinate = `${table.tableId}\0${officialLabel}`;
    const groupKey = hashIdentifier("income-group-", coordinate);
    const existing = knownGroupKeys.get(groupKey);
    if (existing !== undefined && existing !== coordinate) {
      throw new Error(`Income group key collision for ${groupKey}`);
    }
    knownGroupKeys.set(groupKey, coordinate);
    groupKeyByLabel.set(officialLabel, groupKey);
    return {
      kind: "group" as const,
      groupKey,
      trainingLevel,
      officialLabel,
      sourceTableId: table.tableId as "famprof_2_08" | "famprof_3_08",
    };
  });
  if (groups.length !== source.expectedGroupCount) {
    throw new Error(
      `${table.tableId} has an unexpected normalized group count`,
    );
  }

  const observations: OutcomeObservation[] = [];
  for (const cell of table.cells) {
    const facts = normalizeCohort(cell.dimensions.Cohorte ?? "");
    const postGraduationYear =
      POST_GRADUATION_YEAR_BY_PERIOD[
        cell.dimensions[
          "Periodo de análisis"
        ] as keyof typeof POST_GRADUATION_YEAR_BY_PERIOD
      ];
    const measure = normalizeSourceMeasure(cell.dimensions["Medida (2)"] ?? "");
    const officialGroupLabel = cell.dimensions[groupDimension.name];
    const groupKey =
      officialGroupLabel === undefined
        ? undefined
        : groupKeyByLabel.get(officialGroupLabel);
    if (!postGraduationYear || !officialGroupLabel || !groupKey) {
      throw new Error(
        `${table.tableId} has an unsupported national coordinate`,
      );
    }
    if (postGraduationYear > facts.maxObservedPostGraduationYear) continue;
    const coordinate = canonicalCellCoordinate(table, cell);
    const observationId = hashIdentifier("income-observation-", coordinate);
    const existing = knownObservationIds.get(observationId);
    if (existing !== undefined && existing !== coordinate) {
      throw new Error(`Income observation ID collision for ${observationId}`);
    }
    knownObservationIds.set(observationId, coordinate);
    const valueEur = parseDisplayedEur(cell.rawValue);
    observations.push({
      kind: "observation",
      observationId,
      sourceTableId: table.tableId,
      scope: "spain_cycle_group",
      trainingLevel,
      groupKey,
      officialGroupLabel,
      cohort: facts.cohort,
      postGraduationYear,
      measure,
      valueEur,
      availability:
        valueEur === null ? "unavailable_or_unrepresentative" : "published",
      provisional: facts.provisional,
    });
  }
  const expectedObservationCount = groups.length * 5 * 45;
  if (observations.length !== expectedObservationCount) {
    throw new Error(
      `${table.tableId} has an unexpected normalized observation count`,
    );
  }
  return { groups, observations };
}

function recordsForRegionalTable(
  verified: VerifiedIncomeTable,
  knownObservationIds: Map<string, string>,
): OutcomeObservation[] {
  const { table } = verified;
  const source = EDUCABASE_INCOME_SOURCES[table.tableId];
  if (source.scope !== "autonomous_community_training_level") {
    throw new Error(`${table.tableId} is not a regional training-level table`);
  }
  assertObservationNote(table);
  const observations: OutcomeObservation[] = [];
  let selectedRawCellCount = 0;
  for (const cell of table.cells) {
    if (
      cell.dimensions["Comunidad autónoma"] !== "Castilla y León" ||
      cell.dimensions.Sexo !== "AMBOS SEXOS"
    ) {
      continue;
    }
    selectedRawCellCount += 1;
    const facts = normalizeCohort(cell.dimensions.Cohorte ?? "");
    const postGraduationYear =
      POST_GRADUATION_YEAR_BY_PERIOD[
        cell.dimensions[
          "Periodo de análisis"
        ] as keyof typeof POST_GRADUATION_YEAR_BY_PERIOD
      ];
    const measure = normalizeSourceMeasure(cell.dimensions["Medida (2)"] ?? "");
    if (!postGraduationYear) {
      throw new Error(
        `${table.tableId} has an unsupported regional coordinate`,
      );
    }
    if (postGraduationYear > facts.maxObservedPostGraduationYear) continue;
    const coordinate = canonicalCellCoordinate(table, cell);
    const observationId = hashIdentifier("income-observation-", coordinate);
    const existing = knownObservationIds.get(observationId);
    if (existing !== undefined && existing !== coordinate) {
      throw new Error(`Income observation ID collision for ${observationId}`);
    }
    knownObservationIds.set(observationId, coordinate);
    const valueEur = parseDisplayedEur(cell.rawValue);
    observations.push({
      kind: "observation",
      observationId,
      sourceTableId: table.tableId,
      scope: "castilla_leon_training_level",
      trainingLevel: source.trainingLevel,
      groupKey: null,
      officialGroupLabel: null,
      cohort: facts.cohort,
      postGraduationYear,
      measure,
      valueEur,
      availability:
        valueEur === null ? "unavailable_or_unrepresentative" : "published",
      provisional: facts.provisional,
    });
  }
  if (selectedRawCellCount !== 12 * 4 * 5 || observations.length !== 45 * 5) {
    throw new Error(
      `${table.tableId} does not provide the exact CyL both-sexes reference`,
    );
  }
  return observations;
}

function cohortWindowsForNationalTable(
  verified: VerifiedIncomeTable,
): OutcomeCohortWindow[] {
  const { table } = verified;
  const source = EDUCABASE_INCOME_SOURCES[table.tableId];
  if (source.scope !== "spain_cycle_group") {
    throw new Error(`${table.tableId} cannot define national cohort windows`);
  }
  assertObservationNote(table);
  const cohorts = table.dimensions.find(
    (dimension) => dimension.name === "Cohorte",
  )?.values;
  if (!cohorts || cohorts.length !== 12) {
    throw new Error(
      `${table.tableId} does not define the exact income cohorts`,
    );
  }
  return cohorts.map((rawCohort) => {
    const facts = normalizeCohort(rawCohort);
    return {
      kind: "cohort_window",
      trainingLevel: source.trainingLevel,
      cohort: facts.cohort,
      provisional: facts.provisional,
      maxObservedPostGraduationYear: facts.maxObservedPostGraduationYear,
    };
  });
}

function sortRecords(
  records: readonly OutcomeIndicatorRecord[],
): OutcomeIndicatorRecord[] {
  const levelOrder: Readonly<Record<OutcomeTrainingLevel, number>> = {
    intermediate: 0,
    higher: 1,
  };
  const measureOrder: Readonly<Record<OutcomeMeasure, number>> = {
    mean: 0,
    quintile_20_lower_boundary: 1,
    quintile_40_lower_boundary: 2,
    quintile_60_lower_boundary: 3,
    quintile_80_lower_boundary: 4,
  };
  const scopeOrder = {
    spain_cycle_group: 0,
    castilla_leon_training_level: 1,
  } as const;
  return [...records].sort((left, right) => {
    const kindOrder = { group: 0, cohort_window: 1, observation: 2 } as const;
    if (kindOrder[left.kind] !== kindOrder[right.kind]) {
      return kindOrder[left.kind] - kindOrder[right.kind];
    }
    if (left.kind === "group" && right.kind === "group") {
      return (
        levelOrder[left.trainingLevel] - levelOrder[right.trainingLevel] ||
        compareStrings(left.officialLabel, right.officialLabel)
      );
    }
    if (left.kind === "cohort_window" && right.kind === "cohort_window") {
      return (
        levelOrder[left.trainingLevel] - levelOrder[right.trainingLevel] ||
        compareStrings(left.cohort, right.cohort)
      );
    }
    if (left.kind === "observation" && right.kind === "observation") {
      return (
        scopeOrder[left.scope] - scopeOrder[right.scope] ||
        levelOrder[left.trainingLevel] - levelOrder[right.trainingLevel] ||
        compareStrings(left.groupKey ?? "", right.groupKey ?? "") ||
        compareStrings(left.cohort, right.cohort) ||
        left.postGraduationYear - right.postGraduationYear ||
        measureOrder[left.measure] - measureOrder[right.measure]
      );
    }
    return 0;
  });
}

/** Converts verified official tables into one deterministic, scoped public resource. */
export function normalizeIncomeOutcomes(
  verifiedTables: readonly VerifiedIncomeTable[],
): OutcomeIndicatorsResource {
  const tableById = assertVerifiedTables(verifiedTables);
  const knownGroupKeys = new Map<string, string>();
  const knownObservationIds = new Map<string, string>();
  const intermediateNational = recordsForNationalTable(
    tableById.get("famprof_2_08") as VerifiedIncomeTable,
    knownGroupKeys,
    knownObservationIds,
  );
  const higherNational = recordsForNationalTable(
    tableById.get("famprof_3_08") as VerifiedIncomeTable,
    knownGroupKeys,
    knownObservationIds,
  );
  const regionalIntermediate = recordsForRegionalTable(
    tableById.get("ccaa_2_07") as VerifiedIncomeTable,
    knownObservationIds,
  );
  const regionalHigher = recordsForRegionalTable(
    tableById.get("ccaa_3_07") as VerifiedIncomeTable,
    knownObservationIds,
  );
  return OutcomeIndicatorsResourceSchema.parse(
    sortRecords([
      ...intermediateNational.groups,
      ...higherNational.groups,
      ...cohortWindowsForNationalTable(
        tableById.get("famprof_2_08") as VerifiedIncomeTable,
      ),
      ...cohortWindowsForNationalTable(
        tableById.get("famprof_3_08") as VerifiedIncomeTable,
      ),
      ...intermediateNational.observations,
      ...higherNational.observations,
      ...regionalIntermediate,
      ...regionalHigher,
    ]),
  );
}
