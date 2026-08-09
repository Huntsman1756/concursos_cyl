import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { z } from "zod";

import {
  FpExpansionCandidateSchema,
  FpExpansionRankingSchema,
  canonicalizeFpQualificationIdentity,
} from "../../data/schemas/fpCoverageExpansion";
import { isPermittedGeneratedAssetPath } from "../../data/schemas/generatedResourceCatalog";
import {
  approvedSingleTokenAuditIdentities,
  validateFpOneWordPublicationReview,
} from "./validateFpOneWordPublicationReview";

const execFileAsync = promisify(execFile);

export const FpExpansionStateSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "deferred",
  "discarded",
]);

const EvidenceSchema = z
  .object({
    sourceUrl: z.string().url().startsWith("https://"),
    sourceQuote: z.string().trim().min(3).max(500),
    reviewedAt: z.string().date(),
  })
  .strict();

const RelationSchema = z
  .object({
    kind: z.enum(["link", "alias"]),
    programKey: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    alias: z.string().trim().min(2).optional(),
    matchPolicy: z.literal("approved_single_token").optional(),
    ...EvidenceSchema.shape,
  })
  .strict();

export const ManifestAddressedRelationSetSchema = z
  .object({
    manifestAddressed: z.literal(true),
    relationKeys: z.array(z.string().trim().min(1)),
    resourcePaths: z
      .array(
        z.string().refine(isPermittedGeneratedAssetPath, {
          message: "Resource path must be an addressable generated asset.",
        }),
      )
      .min(1),
  })
  .strict()
  .superRefine((set, context) => {
    if (!isSortedUnique(set.relationKeys))
      context.addIssue({
        code: "custom",
        path: ["relationKeys"],
        message: "Manifest-addressed relation keys must be sorted and unique.",
      });
    if (!isSortedUnique(set.resourcePaths))
      context.addIssue({
        code: "custom",
        path: ["resourcePaths"],
        message: "Manifest-addressed resource paths must be sorted and unique.",
      });
  });
export type ManifestAddressedRelationSet = z.infer<
  typeof ManifestAddressedRelationSetSchema
>;

const OutputReviewSchema = z
  .object({
    order: z.number().int().positive(),
    officialOutputLabel: z.string().trim().min(3).max(220),
    disposition: z.enum(["accepted", "rejected"]),
    candidateOccupationIds: z
      .array(z.string().regex(/^occupation:cno11:\d{4}$/u))
      .min(1),
    acceptedOccupationIds: z
      .array(z.string().regex(/^occupation:cno11:\d{4}$/u))
      .optional(),
    sourceUrl: z.string().url().startsWith("https://"),
    sourceQuote: z.string().trim().min(3).max(280),
    classificationEvidence: z
      .array(
        EvidenceSchema.extend({
          occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
        }),
      )
      .optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

const OfficialOutputInventorySchema = z
  .object({
    sourceUrl: z.string().url().startsWith("https://"),
    labels: z.array(z.string().trim().min(3).max(220)).min(1),
  })
  .strict();

const PhaseMinutesSchema = z
  .object({
    research: z.number().int().nonnegative(),
    implementation: z.number().int().nonnegative(),
    test: z.number().int().nonnegative(),
    review: z.number().int().nonnegative(),
  })
  .strict();

const TransitionSchema = z
  .object({
    from: FpExpansionStateSchema,
    to: FpExpansionStateSchema,
    at: z.string().datetime(),
  })
  .strict();

export const FpExpansionAttemptSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    programKey: z.string().min(1),
    baseQualificationIdentity: z.string().trim().min(1),
    state: FpExpansionStateSchema,
    transitions: z.array(TransitionSchema),
    startedAt: z.string().datetime().nullable(),
    completedAt: z.string().datetime().nullable(),
    phaseMinutes: PhaseMinutesSchema,
    reviewerTimeExcluded: z.literal(true),
    programmeProfileEvidence: z
      .object({
        todoFp: EvidenceSchema,
        authoritativeOutputSource: EvidenceSchema,
        reconciliationNote: z.string().trim().min(20).max(500),
      })
      .strict()
      .optional(),
    officialOutputReviews: z.array(OutputReviewSchema).optional(),
    officialOutputInventory: OfficialOutputInventorySchema.optional(),
    acceptedRelations: z.array(RelationSchema).optional(),
    rejectedRelations: z.array(RelationSchema).optional(),
    baselineMatchIds: z.array(z.string().min(1)).optional(),
    currentMatchIds: z.array(z.string().min(1)).optional(),
    newlyReachedOfferIdsByProgram: z
      .record(z.string(), z.array(z.string().min(1)))
      .optional(),
    newlyReachedOfferUnionIds: z.array(z.string().min(1)).optional(),
    limitation: z.string().trim().min(1).optional(),
    reviewedCommit: z
      .string()
      .regex(/^[a-f0-9]{40}$/u)
      .optional(),
    reviewedCommitAt: z.string().datetime().optional(),
    snapshotId: z.string().min(1).optional(),
    snapshotHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/u)
      .optional(),
    publicParity: z
      .object({
        publishedRelationKeys: z.array(z.string()),
        rejectedRelationKeys: z.array(z.string()),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((attempt, context) => {
    const terminal = new Set(["completed", "deferred", "discarded"]);
    if (terminal.has(attempt.state)) {
      const required = [
        [attempt.programmeProfileEvidence, "programmeProfileEvidence"],
        [attempt.officialOutputReviews, "officialOutputReviews"],
        [attempt.officialOutputInventory, "officialOutputInventory"],
        [attempt.acceptedRelations, "acceptedRelations"],
        [attempt.rejectedRelations, "rejectedRelations"],
        [attempt.baselineMatchIds, "baselineMatchIds"],
        [attempt.currentMatchIds, "currentMatchIds"],
        [
          attempt.newlyReachedOfferIdsByProgram,
          "newlyReachedOfferIdsByProgram",
        ],
        [attempt.newlyReachedOfferUnionIds, "newlyReachedOfferUnionIds"],
        [attempt.limitation, "limitation"],
        [attempt.reviewedCommit, "reviewedCommit"],
        [attempt.reviewedCommitAt, "reviewedCommitAt"],
        [attempt.completedAt, "completedAt"],
        [attempt.snapshotId, "snapshotId"],
        [attempt.snapshotHash, "snapshotHash"],
        [attempt.publicParity, "publicParity"],
      ] as const;
      for (const [value, path] of required)
        if (value === undefined)
          context.addIssue({
            code: "custom",
            path: [path],
            message: `Terminal attempts require ${path}.`,
          });
    }
    const expectedTransitions = ["not_started", "in_progress", attempt.state];
    const expectedLength =
      attempt.state === "not_started"
        ? 0
        : attempt.state === "in_progress"
          ? 1
          : 2;
    if (
      attempt.transitions.length !== expectedLength ||
      attempt.transitions.some(
        (transition, index) =>
          transition.from !== expectedTransitions[index] ||
          transition.to !== expectedTransitions[index + 1],
      )
    ) {
      context.addIssue({
        code: "custom",
        message:
          "State transition must be not_started -> in_progress -> one terminal state.",
      });
    }
    if (
      attempt.state === "not_started" &&
      (attempt.startedAt !== null || attempt.completedAt !== null)
    )
      context.addIssue({
        code: "custom",
        message: "Not-started attempts cannot have timing.",
      });
    if (
      attempt.state === "in_progress" &&
      (attempt.startedAt === null || attempt.completedAt !== null)
    )
      context.addIssue({
        code: "custom",
        message: "In-progress attempts require startedAt and no completedAt.",
      });
    if (terminal.has(attempt.state) && attempt.startedAt === null)
      context.addIssue({
        code: "custom",
        path: ["startedAt"],
        message: "Started attempts require startedAt timing.",
      });
    if (
      attempt.completedAt !== null &&
      attempt.startedAt !== null &&
      attempt.completedAt < attempt.startedAt
    ) {
      context.addIssue({
        code: "custom",
        path: ["completedAt"],
        message: "completedAt must follow startedAt.",
      });
    }
    const phaseTotal = Object.values(attempt.phaseMinutes).reduce(
      (total, minutes) => total + minutes,
      0,
    );
    if (phaseTotal > 60)
      context.addIssue({
        code: "custom",
        path: ["phaseMinutes"],
        message: "Modeled phase minutes cannot exceed 60 total minutes.",
      });
    const transitionTimes = attempt.transitions.map((transition) =>
      new Date(transition.at).getTime(),
    );
    if (
      transitionTimes.some(
        (at, index) => index > 0 && at < transitionTimes[index - 1]!,
      )
    )
      context.addIssue({
        code: "custom",
        path: ["transitions"],
        message: "Transition timestamps must be chronological.",
      });
    if (
      attempt.startedAt !== null &&
      new Date(attempt.transitions[0]?.at ?? "").getTime() !==
        new Date(attempt.startedAt).getTime()
    )
      context.addIssue({
        code: "custom",
        path: ["transitions", 0, "at"],
        message: "The first transition must align with startedAt.",
      });
    const terminalTransition = attempt.transitions.at(-1);
    if (
      terminal.has(attempt.state) &&
      (attempt.completedAt === null ||
        new Date(terminalTransition?.at ?? "").getTime() !==
          new Date(attempt.completedAt).getTime())
    )
      context.addIssue({
        code: "custom",
        path: ["transitions"],
        message: "The terminal transition must align with completedAt.",
      });
    if (
      terminal.has(attempt.state) &&
      attempt.completedAt !== null &&
      new Date(attempt.completedAt).getTime() >
        new Date(attempt.reviewedCommitAt ?? "").getTime()
    )
      context.addIssue({
        code: "custom",
        path: ["completedAt"],
        message: "completedAt must not follow reviewedCommitAt.",
      });
    if (
      terminal.has(attempt.state) &&
      terminalTransition !== undefined &&
      new Date(attempt.reviewedCommitAt ?? "").getTime() <
        new Date(terminalTransition.at).getTime()
    )
      context.addIssue({
        code: "custom",
        path: ["reviewedCommitAt"],
        message: "reviewedCommitAt must not precede the terminal transition.",
      });
    const accepted = new Set(
      (attempt.acceptedRelations ?? []).map(
        (relation) =>
          `${relation.kind}|${relation.programKey}|${relation.occupationId}|${relation.alias ?? ""}`,
      ),
    );
    const rejected = new Set(
      (attempt.rejectedRelations ?? []).map(
        (relation) =>
          `${relation.kind}|${relation.programKey}|${relation.occupationId}|${relation.alias ?? ""}`,
      ),
    );
    for (const key of accepted)
      if (rejected.has(key))
        context.addIssue({
          code: "custom",
          message: "Accepted and rejected relations contradict each other.",
        });
    for (const relation of [
      ...(attempt.acceptedRelations ?? []),
      ...(attempt.rejectedRelations ?? []),
    ]) {
      if (relation.kind === "alias" && relation.alias === undefined)
        context.addIssue({
          code: "custom",
          message: "Accepted aliases require an alias value.",
        });
      if (relation.kind === "alias" && relation.alias !== undefined) {
        if (
          /^(?:técnic[oa]s?|tecnic[oa]s?|auxiliar(?:es)?|profesional(?:es)?|operari[oa]s?|trabajador(?:es)?|emplead[oa]s?|personal|oficial(?:es)?|ayudante(?:s)?)$/iu.test(
            relation.alias,
          )
        ) {
          context.addIssue({
            code: "custom",
            message: "Alias would broaden the occupation boundary.",
          });
        }
        if (
          relation.alias.trim().split(/\s+/u).length === 1 &&
          relation.matchPolicy !== "approved_single_token"
        )
          context.addIssue({
            code: "custom",
            message: "One-word aliases require the approved matcher policy.",
          });
        if (
          relation.alias.trim().split(/\s+/u).length > 1 &&
          relation.matchPolicy !== undefined
        )
          context.addIssue({
            code: "custom",
            message:
              "Multi-word aliases use the existing strict policy without a one-word policy.",
          });
      }
    }
  });

export type FpExpansionAttempt = z.infer<typeof FpExpansionAttemptSchema>;
export type FpExpansionRelation = NonNullable<
  FpExpansionAttempt["acceptedRelations"]
>[number];
export type ExpansionComputedDeltas = {
  baselineMatchIds: string[];
  currentMatchIds: string[];
  newlyReachedOfferIdsByProgram: Record<string, string[]>;
  newlyReachedOfferUnionIds: string[];
  snapshotId?: string;
  snapshotHash?: string;
};

export type ExpansionAttemptInput = {
  attempt: unknown;
  candidate: unknown;
  computed: ExpansionComputedDeltas;
  publicRelationSet: unknown;
  reviewedBaseQualificationIdentities?: readonly string[];
  approvedSingleTokenAuditKeys?: readonly string[];
  matchedAliasKeys?: readonly string[];
  reviewedCommitAt?: string;
};

function sorted(values: readonly string[]): string[] {
  return [...values].toSorted();
}

function isSortedUnique(values: readonly string[]): boolean {
  return (
    JSON.stringify(values) === JSON.stringify(sorted(values)) &&
    values.every((value, index) => index === 0 || value !== values[index - 1])
  );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return (
    isSortedUnique(left) &&
    isSortedUnique(right) &&
    JSON.stringify(left) === JSON.stringify(right)
  );
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

function relationKey(relation: {
  kind: string;
  programKey: string;
  occupationId: string;
  alias?: string;
}): string {
  return `${relation.programKey}|${relation.occupationId}${relation.alias ? `|${relation.alias}` : ""}`;
}

function fail(message: string): never {
  throw new Error(message);
}

function normalizeEvidenceText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function normalizeOutputSeed(value: string): string {
  const genderVariantBase = (left: string, right: string): string | null => {
    if (right === "a" || right === "o") return left;
    if (left.endsWith("o") && right === `${left.slice(0, -1)}a`) return left;
    if (left.endsWith("or") && right === `${left}a`) return left;
    if (right.endsWith("o") && left === `${right.slice(0, -1)}a`) return right;
    if (right.endsWith("o") && left === `${right}a`) return right;
    if (right.endsWith("or") && left === `${right}a`) return right;
    return null;
  };
  const gendered = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(
      /\b([\p{Letter}]+)\s*\/\s*([\p{Letter}]+)\b/gu,
      (_match, left: string, right: string) =>
        genderVariantBase(left, right) ?? `${left} ${right}`,
    );
  return normalizeEvidenceText(gendered);
}

function isBoundedPhrase(sourceQuote: string, phrase: string): boolean {
  const normalizedQuote = normalizeEvidenceText(sourceQuote);
  const normalizedPhrase = normalizeEvidenceText(phrase);
  return (
    normalizedPhrase.length > 0 &&
    ` ${normalizedQuote} `.includes(` ${normalizedPhrase} `)
  );
}

const DEFAULT_REVIEWED_BASES = [
  "qualification:EOC01M",
  "qualification:HOT01M",
  "qualification:IFC03S",
  "qualification:SAN21",
  "qualification:SSC01M",
] as const;

const APPROVED_SINGLE_TOKEN_TUPLE = {
  alias: "encofradores",
  occupationId: "occupation:cno11:7111",
  programKey: "EOC01M",
  matchPolicy: "approved_single_token",
} as const;

function authoritativeHost(url: string, domains: readonly string[]): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return domains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function auditTupleKey(input: {
  alias: string;
  occupationId: string;
  programKey: string;
  matchPolicy: string;
}): string {
  return [
    input.alias,
    input.occupationId,
    input.programKey,
    input.matchPolicy,
  ].join("\u0000");
}

export function validateExpansionAttemptData(
  input: ExpansionAttemptInput,
): FpExpansionAttempt {
  const attempt = FpExpansionAttemptSchema.parse(input.attempt);
  const publicRelationSet = ManifestAddressedRelationSetSchema.parse(
    input.publicRelationSet,
  );
  const candidate = FpExpansionCandidateSchema.parse(input.candidate);
  if (attempt.programKey !== candidate.programKey)
    fail("Attempt program key does not match the frozen candidate.");
  if (
    canonicalizeFpQualificationIdentity(attempt.baseQualificationIdentity) !==
    canonicalizeFpQualificationIdentity(candidate.baseQualificationIdentity)
  )
    fail(
      "Attempt base qualification identity does not match the frozen candidate.",
    );
  const terminal = new Set(["completed", "deferred", "discarded"]);
  const reviewedBases = [
    ...DEFAULT_REVIEWED_BASES,
    ...(input.reviewedBaseQualificationIdentities ?? []),
  ];
  const canonicalReviewedBases = new Set(
    reviewedBases.map(canonicalizeFpQualificationIdentity),
  );
  if (
    canonicalReviewedBases.has(
      canonicalizeFpQualificationIdentity(attempt.baseQualificationIdentity),
    )
  )
    fail("Expansion candidate base qualification has already been reviewed.");
  if (!terminal.has(attempt.state)) {
    if (
      (attempt.publicParity?.publishedRelationKeys.length ?? 0) > 0 ||
      (attempt.publicParity?.rejectedRelationKeys.length ?? 0) > 0 ||
      publicRelationSet.relationKeys.length > 0 ||
      Object.values(attempt.newlyReachedOfferIdsByProgram ?? {}).some(
        (ids) => ids.length > 0,
      ) ||
      (attempt.newlyReachedOfferUnionIds?.length ?? 0) > 0
    )
      fail("Non-terminal attempts expose public relations or deltas.");
    return attempt;
  }
  if (attempt.completedAt === null || attempt.completedAt === undefined)
    fail("Terminal attempts require completedAt timing.");
  const programmeProfileEvidence = attempt.programmeProfileEvidence!;
  const officialOutputInventory = attempt.officialOutputInventory!;
  const officialOutputReviews = attempt.officialOutputReviews!;
  const acceptedRelations = attempt.acceptedRelations!;
  const rejectedRelations = attempt.rejectedRelations!;
  const baselineMatchIds = attempt.baselineMatchIds!;
  const currentMatchIds = attempt.currentMatchIds!;
  const newlyReachedOfferIdsByProgram = attempt.newlyReachedOfferIdsByProgram!;
  const newlyReachedOfferUnionIds = attempt.newlyReachedOfferUnionIds!;
  const publicParity = attempt.publicParity!;
  if (
    input.reviewedCommitAt !== undefined &&
    input.reviewedCommitAt !== attempt.reviewedCommitAt
  )
    fail(
      "Attempt reviewedCommitAt does not match the actual reviewed commit timestamp.",
    );
  const authoritativeDomains = ["todofp.es", "boe.es", "jcyl.es"] as const;
  const classificationDomains = ["ine.es", "sepe.es"] as const;
  const evidenceUrls = [
    programmeProfileEvidence.todoFp.sourceUrl,
    programmeProfileEvidence.authoritativeOutputSource.sourceUrl,
    officialOutputInventory.sourceUrl,
    ...officialOutputReviews.map((review) => review.sourceUrl),
  ];
  if (evidenceUrls.some((url) => !authoritativeHost(url, authoritativeDomains)))
    fail("Evidence URL is not authoritative.");
  if (evidenceUrls.some((url) => !candidate.sourceUrls.includes(url)))
    fail(
      "Profile and official output evidence URLs must match candidate sourceUrls exactly.",
    );
  const labels = officialOutputReviews.map(
    (review) => review.officialOutputLabel,
  );
  if (labels.length === 0)
    fail("Every candidate requires at least one official output review.");
  if (JSON.stringify(labels) !== JSON.stringify(officialOutputInventory.labels))
    fail(
      "Official output reviews must exactly match the authoritative output inventory in source order.",
    );
  const normalizedLabels = labels.map(normalizeOutputSeed);
  if (attempt.state === "completed") {
    let lastSeedIndex = -1;
    for (const seed of candidate.officialOutputLabels) {
      const normalizedSeed = normalizeOutputSeed(seed);
      const seedIndex = normalizedLabels.findIndex(
        (label, index) => index > lastSeedIndex && label === normalizedSeed,
      );
      if (seedIndex === -1)
        fail(
          "Official output reviews must contain every frozen ranking output seed in order.",
        );
      lastSeedIndex = seedIndex;
    }
  }
  if (
    new Set(labels).size !== labels.length ||
    officialOutputReviews.some((review, index) => review.order !== index + 1)
  )
    fail(
      "Official output reviews must be exhaustive and contiguous in source order.",
    );
  for (const review of officialOutputReviews) {
    if (review.sourceQuote !== review.officialOutputLabel)
      fail("Official output quote must be the exact contiguous output label.");
    if (
      review.disposition === "accepted" &&
      (review.acceptedOccupationIds === undefined ||
        JSON.stringify(review.acceptedOccupationIds) !==
          JSON.stringify(review.candidateOccupationIds) ||
        review.classificationEvidence === undefined ||
        review.classificationEvidence.length < 1)
    )
      fail(
        "Accepted output requires matching IDs and classification evidence.",
      );
    if (
      review.disposition === "rejected" &&
      review.acceptedOccupationIds !== undefined
    )
      fail("Rejected output cannot contain accepted IDs.");
    if (!isSortedUnique(review.candidateOccupationIds))
      fail("Candidate occupation IDs must be sorted and unique.");
    if (
      review.acceptedOccupationIds !== undefined &&
      !isSortedUnique(review.acceptedOccupationIds)
    )
      fail("Accepted occupation IDs must be sorted and unique.");
    if (review.classificationEvidence !== undefined) {
      const classificationIds = review.classificationEvidence.map(
        (evidence) => evidence.occupationId,
      );
      if (!isSortedUnique(classificationIds))
        fail("Classification evidence IDs must be sorted and unique.");
      if (
        review.disposition === "accepted" &&
        JSON.stringify(classificationIds) !==
          JSON.stringify(review.acceptedOccupationIds)
      )
        fail(
          "Classification evidence must match accepted occupation IDs exactly.",
        );
      if (
        review.classificationEvidence.some(
          (evidence) =>
            !authoritativeHost(evidence.sourceUrl, classificationDomains),
        )
      )
        fail("Classification evidence URL is not an INE or SEPE authority.");
    }
  }
  const acceptedOutputOccupations = new Set(
    officialOutputReviews
      .filter((review) => review.disposition === "accepted")
      .flatMap((review) => review.acceptedOccupationIds ?? []),
  );
  const acceptedEvidenceOccupations = new Set(
    officialOutputReviews
      .filter((review) => review.disposition === "accepted")
      .flatMap((review) =>
        (review.classificationEvidence ?? []).map(
          (evidence) => evidence.occupationId,
        ),
      ),
  );
  const acceptedOutputIds = new Set(acceptedOutputOccupations);
  const rejectedCandidateIds = new Set(
    officialOutputReviews
      .filter((review) => review.disposition === "rejected")
      .flatMap((review) => review.candidateOccupationIds),
  );
  if ([...acceptedOutputIds].some((id) => rejectedCandidateIds.has(id)))
    fail(
      "An occupation cannot be accepted in one output and rejected in another.",
    );
  const rejectedOutputIds = new Set(rejectedCandidateIds);
  if (
    !sameSet(
      acceptedRelations.map((relation) => relation.occupationId),
      [...acceptedOutputIds],
    ) ||
    !sameSet(
      rejectedRelations.map((relation) => relation.occupationId),
      [...rejectedOutputIds],
    )
  )
    fail(
      "Accepted/rejected relations must correspond exactly to output dispositions.",
    );
  const matchedAliasKeys = new Set(input.matchedAliasKeys ?? []);
  for (const relation of [...acceptedRelations, ...rejectedRelations]) {
    if (relation.programKey !== attempt.programKey)
      fail("Every relation must use the attempt program key.");
    if (relation.kind === "alias" && relation.alias !== undefined) {
      const tokenCount = relation.alias.trim().split(/\s+/u).length;
      if (!isBoundedPhrase(relation.sourceQuote, relation.alias))
        fail(
          "Alias text must be a bounded phrase in its exact evidence quote.",
        );
      if (tokenCount === 1) {
        if (
          relation.alias !== APPROVED_SINGLE_TOKEN_TUPLE.alias ||
          relation.occupationId !== APPROVED_SINGLE_TOKEN_TUPLE.occupationId ||
          relation.programKey !== APPROVED_SINGLE_TOKEN_TUPLE.programKey ||
          relation.matchPolicy !== APPROVED_SINGLE_TOKEN_TUPLE.matchPolicy
        )
          fail("Single-token aliases require the approved bounded tuple.");
      }
      if (
        tokenCount > 1 &&
        acceptedRelations.some(
          (acceptedRelation) => acceptedRelation === relation,
        ) &&
        !matchedAliasKeys.has(relationKey(relation))
      )
        fail(
          "Multi-word accepted aliases require a successful deterministic matcher.",
        );
    }
  }
  for (const relation of acceptedRelations) {
    if (
      !acceptedOutputOccupations.has(relation.occupationId) ||
      !acceptedEvidenceOccupations.has(relation.occupationId)
    )
      fail(
        "Accepted relation occupation lacks an accepted output and classification evidence.",
      );
  }
  for (const relation of [...acceptedRelations, ...rejectedRelations]) {
    if (relation.programKey !== attempt.programKey)
      fail("Every relation must use the attempt program key.");
    const isDiscoveredClassificationSource = officialOutputReviews.some(
      (review) =>
        (review.classificationEvidence ?? []).some(
          (evidence) => evidence.sourceUrl === relation.sourceUrl,
        ),
    );
    if (
      !candidate.sourceUrls.includes(relation.sourceUrl) &&
      !isDiscoveredClassificationSource
    )
      fail(
        "Relation evidence URL must be a frozen programme source or a discovered classification source.",
      );
    if (
      !authoritativeHost(relation.sourceUrl, [
        ...authoritativeDomains,
        ...classificationDomains,
      ]) ||
      relation.sourceUrl.includes("example.invalid") ||
      relation.sourceUrl.includes("placeholder")
    )
      fail("Relation evidence URL is not an authoritative official source.");
  }
  const outputEvidencePairs = new Map<string, Set<string>>();
  for (const review of officialOutputReviews) {
    for (const occupationId of review.candidateOccupationIds) {
      const pairs = outputEvidencePairs.get(occupationId) ?? new Set<string>();
      pairs.add(`${review.sourceUrl}\u0000${review.sourceQuote}`);
      outputEvidencePairs.set(occupationId, pairs);
    }
  }
  const classificationEvidencePairs = new Map<string, Set<string>>();
  for (const review of officialOutputReviews) {
    for (const evidence of review.classificationEvidence ?? []) {
      const pairs =
        classificationEvidencePairs.get(evidence.occupationId) ??
        new Set<string>();
      pairs.add(`${evidence.sourceUrl}\u0000${evidence.sourceQuote}`);
      classificationEvidencePairs.set(evidence.occupationId, pairs);
    }
  }
  for (const relation of [...acceptedRelations, ...rejectedRelations]) {
    const pair = `${relation.sourceUrl}\u0000${relation.sourceQuote}`;
    if (
      !outputEvidencePairs.get(relation.occupationId)?.has(pair) &&
      !classificationEvidencePairs.get(relation.occupationId)?.has(pair)
    )
      fail(
        "Relation evidence must exactly match official output or classification evidence for its occupation.",
      );
  }
  const acceptedKeys = acceptedRelations.map(relationKey);
  const rejectedKeys = rejectedRelations.map(relationKey);
  if (!isSortedUnique(acceptedKeys) || !isSortedUnique(rejectedKeys))
    fail("Relation IDs must be sorted and unique.");
  const acceptedOccupations = new Set(
    acceptedRelations.map((relation) => relation.occupationId),
  );
  if (
    rejectedRelations.some((relation) =>
      acceptedOccupations.has(relation.occupationId),
    )
  )
    fail("Accepted and rejected occupation IDs contradict each other.");
  if (
    !sameIds(acceptedKeys, publicParity.publishedRelationKeys) &&
    attempt.state === "completed"
  )
    fail("Public parity must equal completed accepted relations.");
  if (!sameIds(rejectedKeys, publicParity.rejectedRelationKeys))
    fail("Public parity must equal rejected relations exactly.");
  if (
    attempt.state === "completed" &&
    !sameIds(publicRelationSet.relationKeys, acceptedKeys)
  )
    fail("Completed accepted relation is missing from public parity.");
  if (
    attempt.state !== "completed" &&
    (publicRelationSet.relationKeys.length > 0 ||
      publicParity.publishedRelationKeys.length > 0 ||
      Object.values(newlyReachedOfferIdsByProgram).some(
        (ids) => ids.length > 0,
      ) ||
      newlyReachedOfferUnionIds.length > 0)
  )
    fail("Deferred or discarded attempts publish no relations or deltas.");
  if (rejectedKeys.some((key) => publicRelationSet.relationKeys.includes(key)))
    fail("Rejected relation leaked into a public resource.");
  if (
    !isSortedUnique(baselineMatchIds) ||
    !isSortedUnique(currentMatchIds) ||
    !isSortedUnique(newlyReachedOfferUnionIds) ||
    !isSortedUnique(Object.keys(newlyReachedOfferIdsByProgram)) ||
    Object.values(newlyReachedOfferIdsByProgram).some(
      (ids) => !isSortedUnique(ids),
    )
  )
    fail("Stored match IDs and delta map IDs must be sorted and unique.");
  if (
    !sameIds(baselineMatchIds, input.computed.baselineMatchIds) ||
    !sameIds(currentMatchIds, input.computed.currentMatchIds) ||
    !isSortedUnique(
      Object.keys(input.computed.newlyReachedOfferIdsByProgram),
    ) ||
    Object.values(input.computed.newlyReachedOfferIdsByProgram).some(
      (ids) => !isSortedUnique(ids),
    ) ||
    JSON.stringify(newlyReachedOfferIdsByProgram) !==
      JSON.stringify(input.computed.newlyReachedOfferIdsByProgram) ||
    !sameIds(
      newlyReachedOfferUnionIds,
      input.computed.newlyReachedOfferUnionIds,
    )
  )
    fail(
      "Stored match IDs or deterministic deltas do not match recomputation.",
    );
  const nonTarget = Object.keys(
    input.computed.newlyReachedOfferIdsByProgram,
  ).filter(
    (key) =>
      key !== attempt.programKey &&
      input.computed.newlyReachedOfferIdsByProgram[key]!.length > 0,
  );
  if (nonTarget.length > 0)
    fail("Expansion introduced a non-target program delta.");
  const mapUnion = sorted(Object.values(newlyReachedOfferIdsByProgram).flat());
  const expectedUnion = sorted(
    currentMatchIds.filter((id) => !baselineMatchIds.includes(id)),
  );
  if (
    !sameSet(mapUnion, newlyReachedOfferUnionIds) ||
    !sameSet(expectedUnion, newlyReachedOfferUnionIds)
  )
    fail(
      "Delta union must equal the canonical delta map and current-minus-baseline.",
    );
  if (
    attempt.snapshotId === undefined ||
    input.computed.snapshotId === undefined
  )
    fail("Terminal attempts require snapshot identity provenance.");
  if (attempt.snapshotId !== input.computed.snapshotId)
    fail("Snapshot identity is stale.");
  if (
    attempt.snapshotHash === undefined ||
    input.computed.snapshotHash === undefined
  )
    fail("Terminal attempts require snapshot hash provenance.");
  if (attempt.snapshotHash !== input.computed.snapshotHash)
    fail("Snapshot hash is stale.");
  const approvedSingleTokenAuditKeys = new Set(
    input.approvedSingleTokenAuditKeys ?? [],
  );
  for (const relation of [...acceptedRelations, ...rejectedRelations]) {
    if (relation.kind === "alias" && relation.alias !== undefined) {
      const tokenCount = relation.alias.trim().split(/\s+/u).length;
      if (tokenCount === 1) {
        const key = auditTupleKey({
          alias: relation.alias,
          occupationId: relation.occupationId,
          programKey: relation.programKey,
          matchPolicy: relation.matchPolicy!,
        });
        if (!approvedSingleTokenAuditKeys.has(key))
          fail(
            "Single-token alias is not present in the A1 approved review artifact.",
          );
      }
    }
  }
  return attempt;
}

export type ExpansionValidationDependencies = {
  loadRanking?: (rootDirectory: string) => Promise<unknown>;
  loadAttempt?: (rootDirectory: string, programKey: string) => Promise<unknown>;
  compute?: (
    rootDirectory: string,
    attempt: unknown,
    programKey: string,
  ) => Promise<ExpansionComputedDeltas>;
  publicRelationSet?: (
    rootDirectory: string,
    programKey: string,
  ) => Promise<ManifestAddressedRelationSet>;
  reviewedBaseQualificationIdentities?: readonly string[];
  loadApprovedSingleTokenAuditKeys?: (
    rootDirectory: string,
  ) => Promise<readonly string[]>;
  matchAlias?: (
    rootDirectory: string,
    relation: FpExpansionRelation,
  ) => Promise<boolean>;
  loadReviewedCommitAt?: (
    rootDirectory: string,
    reviewedCommit: string,
  ) => Promise<string>;
};

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

export async function validateExpansionAttempt(
  rootDirectory: string,
  programKey: string,
  dependencies: ExpansionValidationDependencies = {},
): Promise<FpExpansionAttempt> {
  const loadRanking =
    dependencies.loadRanking ??
    ((root) =>
      readJson(
        resolve(root, "analysis/fp_coverage_expansion_candidates.json"),
      ));
  const loadAttempt =
    dependencies.loadAttempt ??
    ((root, key) =>
      readJson(resolve(root, "analysis/fp_coverage_expansion", `${key}.json`)));
  const ranking = FpExpansionRankingSchema.parse(
    await loadRanking(rootDirectory),
  );
  const candidates = [
    ...ranking.primaryCandidates,
    ...ranking.reserveCandidates,
  ];
  const candidate = candidates.find((entry) => entry.programKey === programKey);
  if (candidate === undefined)
    fail(`Unknown candidate program key: ${programKey}.`);
  const attempt = await loadAttempt(rootDirectory, programKey);
  const parsedAttempt = FpExpansionAttemptSchema.parse(attempt);
  const terminal = new Set(["completed", "deferred", "discarded"]);
  if (!terminal.has(parsedAttempt.state))
    return validateExpansionAttemptData({
      attempt: parsedAttempt,
      candidate,
      computed: {
        baselineMatchIds: [],
        currentMatchIds: [],
        newlyReachedOfferIdsByProgram: {},
        newlyReachedOfferUnionIds: [],
      },
      publicRelationSet: {
        manifestAddressed: true,
        relationKeys: [],
        resourcePaths: ["/data/v1/manifest.json"],
      },
      reviewedBaseQualificationIdentities:
        dependencies.reviewedBaseQualificationIdentities,
    });
  const compute =
    dependencies.compute ??
    (async () => fail("A deterministic match calculator must be injected."));
  const computed = await compute(rootDirectory, attempt, programKey);
  const publicRelationSet = await (dependencies.publicRelationSet?.(
    rootDirectory,
    programKey,
  ) ??
    Promise.resolve({
      manifestAddressed: true as const,
      relationKeys: [],
      resourcePaths: ["/data/v1/manifest.json"],
    }));
  const matchedAliasKeys: string[] = [];
  for (const relation of parsedAttempt.acceptedRelations ?? []) {
    if (
      relation.kind === "alias" &&
      relation.alias !== undefined &&
      relation.alias.trim().split(/\s+/u).length > 1 &&
      (await dependencies.matchAlias?.(rootDirectory, relation)) === true
    )
      matchedAliasKeys.push(relationKey(relation));
  }
  const reviewedCommit = (attempt as { reviewedCommit: string }).reviewedCommit;
  const hasSingleTokenAlias = (
    (attempt as { acceptedRelations?: Array<{ alias?: string }> })
      .acceptedRelations ?? []
  ).some(
    (relation) =>
      relation.alias !== undefined &&
      relation.alias.trim().split(/\s+/u).length === 1,
  );
  const approvedSingleTokenAuditKeys = hasSingleTokenAlias
    ? await (dependencies.loadApprovedSingleTokenAuditKeys?.(rootDirectory) ??
        Promise.resolve([
          ...approvedSingleTokenAuditIdentities(
            validateFpOneWordPublicationReview(rootDirectory),
          ),
        ]))
    : undefined;
  const reviewedCommitAt = await (dependencies.loadReviewedCommitAt?.(
    rootDirectory,
    reviewedCommit,
  ) ??
    execFileAsync("git", ["show", "-s", "--format=%cI", reviewedCommit], {
      cwd: rootDirectory,
    }).then(({ stdout }) => {
      const instant = new Date(stdout.trim());
      if (Number.isNaN(instant.getTime()))
        fail("Reviewed commit timestamp is not a valid ISO instant.");
      return instant.toISOString();
    }));
  return validateExpansionAttemptData({
    attempt,
    candidate,
    computed,
    publicRelationSet,
    reviewedBaseQualificationIdentities:
      dependencies.reviewedBaseQualificationIdentities,
    approvedSingleTokenAuditKeys,
    matchedAliasKeys,
    reviewedCommitAt,
  });
}

export function countTerminalExpansionAttempts(attempts: readonly unknown[]) {
  const states = attempts.map(
    (attempt) => FpExpansionAttemptSchema.parse(attempt).state,
  );
  return {
    completed: states.filter((state) => state === "completed").length,
    deferred: states.filter((state) => state === "deferred").length,
    discarded: states.filter((state) => state === "discarded").length,
    terminal: states.filter(
      (state) =>
        state === "completed" || state === "deferred" || state === "discarded",
    ).length,
  };
}

export const FpExpansionAggregateSchema = z
  .object({
    attempts: z.array(FpExpansionAttemptSchema),
  })
  .strict()
  .superRefine(({ attempts }, context) => {
    if (
      attempts.some(
        (attempt) =>
          !["completed", "deferred", "discarded"].includes(attempt.state),
      )
    )
      context.addIssue({
        code: "custom",
        path: ["attempts"],
        message: "Expansion aggregates require terminal attempts only.",
      });
    const bases = attempts.map((attempt) =>
      canonicalizeFpQualificationIdentity(attempt.baseQualificationIdentity),
    );
    if (new Set(bases).size !== bases.length)
      context.addIssue({
        code: "custom",
        path: ["attempts"],
        message: "Modality variants cannot be counted twice.",
      });
  });

export function validateExpansionAggregate(attempts: readonly unknown[]) {
  const parsed = FpExpansionAggregateSchema.parse({ attempts }).attempts;
  return {
    ...countTerminalExpansionAttempts(parsed),
    distinctCompletedQualifications: new Set(
      parsed
        .filter((attempt) => attempt.state === "completed")
        .map((attempt) =>
          canonicalizeFpQualificationIdentity(
            attempt.baseQualificationIdentity,
          ),
        ),
    ).size,
  };
}
