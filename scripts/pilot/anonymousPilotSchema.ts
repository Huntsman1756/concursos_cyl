import { z } from "zod";

export const ANONYMOUS_PILOT_SCHEMA_VERSION = "2.0.0" as const;
export const ANONYMOUS_PILOT_PROTOCOL_VERSION = "2.0.0" as const;
export const ANONYMOUS_PILOT_TASK_CATALOG_VERSION = "2.0.0" as const;
export const ANONYMOUS_PILOT_NOT_RUN = "HUMAN_PILOT_NOT_RUN" as const;

export const ANONYMOUS_PILOT_RELEASE = {
  rootUrl: "https://huntsman1756.github.io/concursos_cyl/",
  deployedCommitSha: "886bbf433df7db1e99acf78786286ceee8bc1a06",
  snapshotId: "20260830120000000-8c6c79fbd2a1",
} as const;

export const ANONYMOUS_PILOT_TASK_IDS = [
  "T1_fp_to_occupation",
  "T2_occupation_to_fp",
  "T3_offer_to_requirement_action",
  "T4_uncertainty_boundary",
  "T5_sources_limits",
] as const;

export const AnonymousPilotTaskIdSchema = z.enum(ANONYMOUS_PILOT_TASK_IDS);

export const ANONYMOUS_PILOT_ISSUE_CODES = [
  "cannot_find_offer_first_entry",
  "cannot_distinguish_offer_title_requirement",
  "interprets_snapshot_as_currently_open_guarantee",
  "interprets_reviewed_fp_relationship_as_equivalence",
  "interprets_university_boundary_incorrectly",
  "interprets_certificate_alternative_as_fp_equivalence",
  "interprets_accreditation_as_confirmed_eligibility",
  "cannot_identify_next_official_action",
  "cannot_find_original_source",
  "cannot_identify_uncertainty",
] as const;

export const AnonymousPilotIssueCodeSchema = z.enum(
  ANONYMOUS_PILOT_ISSUE_CODES,
);

export const AnonymousPilotSeveritySchema = z.enum([
  "P0",
  "P1",
  "P2",
  "P3",
] as const);

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
      .object({
        P0: CountSchema,
        P1: CountSchema,
        P2: CountSchema,
        P3: CountSchema,
      })
      .strict(),
  })
  .strict();

const IssueSchema = z
  .object({
    taskId: AnonymousPilotTaskIdSchema,
    issueCode: AnonymousPilotIssueCodeSchema,
    severity: AnonymousPilotSeveritySchema,
    count: z.number().int().positive(),
    actionCode: z.enum([
      "none",
      "clarify_copy",
      "adjust_navigation",
      "add_limit_disclosure",
      "run_accessibility_review",
      "investigate_bug",
      "reopen_implementation",
    ]),
  })
  .strict();

export const AnonymousPilotProtocolStateSchema = z.literal(
  ANONYMOUS_PILOT_NOT_RUN,
);

export const AnonymousPilotAggregateSchema = z
  .object({
    schemaVersion: z.literal(ANONYMOUS_PILOT_SCHEMA_VERSION),
    artifactKind: z.literal("anonymous_pilot_aggregate"),
    status: z.enum(["draft", "complete", "blocked"]),
    blockerCodes: z.array(AnonymousPilotBlockerCodeSchema),
    protocol: z
      .object({
        protocolVersion: z.literal(ANONYMOUS_PILOT_PROTOCOL_VERSION),
        taskCatalogVersion: z.literal(ANONYMOUS_PILOT_TASK_CATALOG_VERSION),
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
        rootUrl: z.literal(ANONYMOUS_PILOT_RELEASE.rootUrl),
        deployedCommitSha: z.literal(ANONYMOUS_PILOT_RELEASE.deployedCommitSha),
        snapshotId: z.literal(ANONYMOUS_PILOT_RELEASE.snapshotId),
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
