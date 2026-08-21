import { z } from "zod";

export const ANONYMOUS_PILOT_TASK_IDS = [
  "T1_fp_to_occupation",
  "T2_honest_zero_or_deferred",
  "T3_occupation_to_fp",
  "T4_compare_scopes",
  "T5_sources_and_limits",
] as const;

export const AnonymousPilotTaskIdSchema = z.enum(ANONYMOUS_PILOT_TASK_IDS);

export const AnonymousPilotBlockerCodeSchema = z.enum([
  "no_authorization",
  "missing_consent",
  "minor_participant_review_required",
  "missing_sample",
  "incomplete_observation",
  "pii_detected",
  "privacy_review_pending",
  "release_mismatch",
]);

const CountSchema = z.number().int().nonnegative();
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u);
const TaskResultSchema = z
  .object({
    taskId: AnonymousPilotTaskIdSchema,
    attempted: CountSchema,
    completed: CountSchema,
    blocked: CountSchema,
    abandoned: CountSchema,
    misinterpretations: CountSchema,
    timeBands: z
      .object({
        under_5m: CountSchema,
        "5_to_10m": CountSchema,
        over_10m: CountSchema,
        not_recorded: CountSchema,
      })
      .strict(),
    issueCounts: z
      .object({ minor: CountSchema, major: CountSchema, stop: CountSchema })
      .strict(),
  })
  .strict();

const IssueSchema = z
  .object({
    taskId: AnonymousPilotTaskIdSchema,
    category: z.enum([
      "navigation",
      "label_comprehension",
      "scope_confusion",
      "accessibility",
      "loading_or_error",
      "privacy_concern",
      "other",
    ]),
    severity: z.enum(["minor", "major", "stop"]),
    count: z.number().int().positive(),
    actionCode: z.enum([
      "none",
      "clarify_copy",
      "adjust_navigation",
      "add_limit_disclosure",
      "run_accessibility_review",
      "investigate_bug",
    ]),
  })
  .strict();

export const AnonymousPilotAggregateSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    artifactKind: z.literal("anonymous_pilot_aggregate"),
    status: z.enum(["draft", "complete", "blocked"]),
    blockerCodes: z.array(AnonymousPilotBlockerCodeSchema),
    protocol: z
      .object({
        protocolVersion: z.literal("1.0.0"),
        taskCatalogVersion: z.literal("1.0.0"),
        adultOnly: z.literal(true),
        minorsIncluded: z.literal(false),
        targetSessions: z.literal(5),
        minimumByRole: z
          .object({ learner: z.literal(1), counsellor: z.literal(1) })
          .strict(),
        protocolSha256: Sha256Schema,
        taskScriptSha256: Sha256Schema,
      })
      .strict(),
    release: z
      .object({
        rootUrl: z.literal("https://salida-cyl.157-90-22-40.sslip.io/"),
        deployedCommitSha: z.string().regex(/^[a-f0-9]{40}$/u),
        snapshotId: z.string().regex(/^\d{17}-[a-f0-9]{12}$/u),
      })
      .strict(),
    consentPolicy: z
      .object({
        participation: z.literal("required_before_session"),
        recording: z.literal("none"),
        publicQuotes: z.literal("none"),
        publicMedia: z.literal("none"),
        rawConsentStorage: z.literal("outside_repository"),
      })
      .strict(),
    sample: z
      .object({
        totalSessions: CountSchema,
        consentedSessions: CountSchema,
        withdrawnSessions: CountSchema,
        analyzableSessions: CountSchema,
        byRole: z
          .object({ learner: CountSchema, counsellor: CountSchema })
          .strict(),
      })
      .strict(),
    taskResults: z.array(TaskResultSchema).length(5),
    issues: z.array(IssueSchema),
    privacy: z
      .object({
        aggregateOnly: z.literal(true),
        aggregateContainsPii: z.literal(false),
        rawMaterialsInRepository: z.literal(false),
        retentionDays: z.literal(30),
      })
      .strict(),
    verification: z
      .object({
        humanReview: z.enum(["pending", "approved"]),
        protocolApproved: z.boolean(),
        consentApproved: z.boolean(),
        noPiiReview: z.enum(["pending", "approved"]),
        reviewedAt: z.string().datetime().nullable(),
      })
      .strict(),
  })
  .strict();

export type AnonymousPilotAggregate = z.infer<
  typeof AnonymousPilotAggregateSchema
>;
