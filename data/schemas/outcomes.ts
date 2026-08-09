import { z } from "zod";

export const OutcomeTrainingLevelSchema = z.enum(["intermediate", "higher"]);
export const OutcomeSourceTableIdSchema = z.enum([
  "famprof_2_08",
  "famprof_3_08",
  "ccaa_2_07",
  "ccaa_3_07",
]);
export const OutcomeScopeSchema = z.enum([
  "spain_cycle_group",
  "castilla_leon_training_level",
]);
export const OutcomeMeasureSchema = z.enum([
  "mean",
  "quintile_20_lower_boundary",
  "quintile_40_lower_boundary",
  "quintile_60_lower_boundary",
  "quintile_80_lower_boundary",
]);
export const OutcomeAvailabilitySchema = z.enum([
  "published",
  "unavailable_or_unrepresentative",
]);

export type OutcomeTrainingLevel = z.infer<typeof OutcomeTrainingLevelSchema>;
export type OutcomeSourceTableId = z.infer<typeof OutcomeSourceTableIdSchema>;
export type OutcomeScope = z.infer<typeof OutcomeScopeSchema>;
export type OutcomeMeasure = z.infer<typeof OutcomeMeasureSchema>;
export type OutcomeAvailability = z.infer<typeof OutcomeAvailabilitySchema>;

export interface OutcomeGroup {
  kind: "group";
  groupKey: string;
  trainingLevel: OutcomeTrainingLevel;
  officialLabel: string;
  sourceTableId: "famprof_2_08" | "famprof_3_08";
}

export interface OutcomeCohortWindow {
  kind: "cohort_window";
  trainingLevel: OutcomeTrainingLevel;
  cohort: string;
  provisional: boolean;
  maxObservedPostGraduationYear: 1 | 2 | 3 | 4;
}

export interface OutcomeObservation {
  kind: "observation";
  observationId: string;
  sourceTableId: OutcomeSourceTableId;
  scope: OutcomeScope;
  trainingLevel: OutcomeTrainingLevel;
  groupKey: string | null;
  officialGroupLabel: string | null;
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
  measure: OutcomeMeasure;
  valueEur: number | null;
  availability: OutcomeAvailability;
  provisional: boolean;
}

export type OutcomeIndicatorRecord =
  OutcomeGroup | OutcomeCohortWindow | OutcomeObservation;
export type OutcomeIndicatorsResource = readonly OutcomeIndicatorRecord[];

const GROUP_KEY = /^income-group-[a-f0-9]{16}$/u;
const OBSERVATION_ID = /^income-observation-[a-f0-9]{16}$/u;
export const APPROVED_OUTCOME_COHORTS = [
  "2011-2012",
  "2012-2013",
  "2013-2014",
  "2014-2015",
  "2015-2016",
  "2016-2017",
  "2017-2018",
  "2018-2019",
  "2019-2020",
  "2020-2021",
  "2021-2022",
  "2022-2023",
] as const;

type ApprovedOutcomeCohort = (typeof APPROVED_OUTCOME_COHORTS)[number];

const APPROVED_OUTCOME_COHORT_FACTS: Readonly<
  Record<
    ApprovedOutcomeCohort,
    {
      readonly provisional: boolean;
      readonly maxObservedPostGraduationYear: 2 | 3 | 4;
    }
  >
> = {
  "2011-2012": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2012-2013": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2013-2014": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2014-2015": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2015-2016": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2016-2017": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2017-2018": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2018-2019": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2019-2020": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2020-2021": { provisional: false, maxObservedPostGraduationYear: 4 },
  "2021-2022": { provisional: true, maxObservedPostGraduationYear: 3 },
  "2022-2023": { provisional: true, maxObservedPostGraduationYear: 2 },
};

function expectedCohortFacts(cohort: string): {
  provisional: boolean;
  maxObservedPostGraduationYear: 2 | 3 | 4;
} {
  const facts = APPROVED_OUTCOME_COHORT_FACTS[cohort as ApprovedOutcomeCohort];
  if (!facts) throw new Error(`Unexpected income cohort: ${cohort}`);
  return facts;
}

function addIssue(
  context: z.RefinementCtx,
  path: readonly (string | number)[],
  message: string,
): void {
  context.addIssue({ code: "custom", path: [...path], message });
}

function assertCohortConsistency(
  value: {
    cohort: string;
    provisional: boolean;
    postGraduationYear?: number;
    maxObservedPostGraduationYear?: number;
  },
  context: z.RefinementCtx,
): void {
  const expected = expectedCohortFacts(value.cohort);
  if (value.provisional !== expected.provisional) {
    addIssue(
      context,
      ["provisional"],
      "Provisional status must match the approved cohort window.",
    );
  }
  if (
    value.maxObservedPostGraduationYear !== undefined &&
    value.maxObservedPostGraduationYear !==
      expected.maxObservedPostGraduationYear
  ) {
    addIssue(
      context,
      ["maxObservedPostGraduationYear"],
      "Maximum observed year must match the approved cohort window.",
    );
  }
  if (
    value.postGraduationYear !== undefined &&
    value.postGraduationYear > expected.maxObservedPostGraduationYear
  ) {
    addIssue(
      context,
      ["postGraduationYear"],
      "Observations outside the approved cohort window must not be emitted.",
    );
  }
}

export const OutcomeGroupSchema = z
  .object({
    kind: z.literal("group"),
    groupKey: z.string().regex(GROUP_KEY),
    trainingLevel: OutcomeTrainingLevelSchema,
    officialLabel: z.string().min(1),
    sourceTableId: z.enum(["famprof_2_08", "famprof_3_08"]),
  })
  .strict()
  .superRefine((value, context) => {
    const expectedLevel =
      value.sourceTableId === "famprof_2_08" ? "intermediate" : "higher";
    if (value.trainingLevel !== expectedLevel) {
      addIssue(
        context,
        ["trainingLevel"],
        "National source table must match the training level.",
      );
    }
  });

export const OutcomeCohortWindowSchema = z
  .object({
    kind: z.literal("cohort_window"),
    trainingLevel: OutcomeTrainingLevelSchema,
    cohort: z.enum(APPROVED_OUTCOME_COHORTS),
    provisional: z.boolean(),
    maxObservedPostGraduationYear: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
  })
  .strict()
  .superRefine(assertCohortConsistency);

export const OutcomeObservationSchema = z
  .object({
    kind: z.literal("observation"),
    observationId: z.string().regex(OBSERVATION_ID),
    sourceTableId: OutcomeSourceTableIdSchema,
    scope: OutcomeScopeSchema,
    trainingLevel: OutcomeTrainingLevelSchema,
    groupKey: z.string().regex(GROUP_KEY).nullable(),
    officialGroupLabel: z.string().min(1).nullable(),
    cohort: z.enum(APPROVED_OUTCOME_COHORTS),
    postGraduationYear: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
    measure: OutcomeMeasureSchema,
    valueEur: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable(),
    availability: OutcomeAvailabilitySchema,
    provisional: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    const sourceIsNational = value.sourceTableId.startsWith("famprof_");
    const expectedLevel =
      value.sourceTableId.endsWith("2_08") ||
      value.sourceTableId.endsWith("2_07")
        ? "intermediate"
        : "higher";
    if (value.trainingLevel !== expectedLevel) {
      addIssue(
        context,
        ["trainingLevel"],
        "Source table must match the training level.",
      );
    }
    if (
      (sourceIsNational && value.scope !== "spain_cycle_group") ||
      (!sourceIsNational && value.scope !== "castilla_leon_training_level")
    ) {
      addIssue(
        context,
        ["scope"],
        "Source table must match the evidence scope.",
      );
    }
    const requiresGroup = value.scope === "spain_cycle_group";
    if (
      (requiresGroup &&
        (value.groupKey === null || value.officialGroupLabel === null)) ||
      (!requiresGroup &&
        (value.groupKey !== null || value.officialGroupLabel !== null))
    ) {
      addIssue(
        context,
        ["groupKey"],
        "Only national cycle-group observations can identify an official group.",
      );
    }
    if (
      (value.availability === "published" && value.valueEur === null) ||
      (value.availability === "unavailable_or_unrepresentative" &&
        value.valueEur !== null)
    ) {
      addIssue(context, ["valueEur"], "Availability and value must agree.");
    }
    assertCohortConsistency(value, context);
  });

export const OutcomeIndicatorRecordSchema = z.discriminatedUnion("kind", [
  OutcomeGroupSchema,
  OutcomeCohortWindowSchema,
  OutcomeObservationSchema,
]);

export const OutcomeIndicatorsResourceSchema = z.array(
  OutcomeIndicatorRecordSchema,
);
