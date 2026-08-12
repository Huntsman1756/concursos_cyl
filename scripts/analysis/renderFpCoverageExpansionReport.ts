import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { format as formatPrettier } from "prettier";
import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  FpExpansionCandidateSchema,
  FpExpansionRankingSchema,
  canonicalizeFpQualificationIdentity,
} from "../../data/schemas/fpCoverageExpansion";
import {
  JobOfferSchema,
  TrainingProgramSchema,
  GeneratedManifestSchema,
} from "../../data/schemas/generated";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";
import {
  matchOffersForProgram,
  type OfferMatchingData,
} from "../../src/domain/offerMatching";
import {
  FpExpansionAttemptSchema,
  validateExpansionAttemptData,
  type FpExpansionAttempt,
} from "./validateFpCoverageExpansion";

const terminalStates = ["completed", "deferred", "discarded"] as const;
const baselineReviewedQualifications = [
  "qualification:EOC01M",
  "qualification:HOT01M",
  "qualification:IFC03S",
  "qualification:SAN21",
  "qualification:SSC01M",
] as const;

const SourceDriftSchema = z
  .object({
    frozenCandidateUrl: z.string().url().startsWith("https://"),
    authoritativeUrl: z.string().url().startsWith("https://"),
    reason: z.string().trim().min(20).max(500),
  })
  .strict();

const CandidateReportSchema = z
  .object({
    programKey: z.string().min(1),
    baseQualificationIdentity: z.string().min(1),
    programTitle: z.string().min(1),
    lane: z.enum(["primary", "reserve"]),
    rank: z.number().int().positive(),
    attempted: z.boolean(),
    state: z.enum(["not_attempted", "completed", "deferred", "discarded"]),
    phaseMinutes: z
      .object({
        research: z.number().int().nonnegative(),
        implementation: z.number().int().nonnegative(),
        test: z.number().int().nonnegative(),
        review: z.number().int().nonnegative(),
      })
      .strict(),
    modeledActiveMinutes: z.number().int().nonnegative(),
    wallClockMinutes: z.number().nonnegative().nullable(),
    reviewerMinutes: z.number().int().nonnegative(),
    reviewerTimeExcluded: z.literal(true),
    offerDeltaIds: z.array(z.string()),
    acceptedRelationKeys: z.array(z.string()),
    rejectedRelationKeys: z.array(z.string()),
    publicParity: z
      .object({
        publishedRelationKeys: z.array(z.string()),
        rejectedRelationKeys: z.array(z.string()),
      })
      .strict(),
    limitation: z.string().optional(),
    sourceDrift: SourceDriftSchema.optional(),
  })
  .strict();

const ReportCountsSchema = z
  .object({
    completed: z.number().int().nonnegative(),
    deferred: z.number().int().nonnegative(),
    discarded: z.number().int().nonnegative(),
    terminal: z.number().int().nonnegative(),
    primaryAttempted: z.number().int().nonnegative(),
    reserveAttempted: z.number().int().nonnegative(),
    totalAttempted: z.number().int().nonnegative(),
    primaryUnattempted: z.number().int().nonnegative(),
    reserveUnattempted: z.number().int().nonnegative(),
  })
  .strict();

export const FpCoverageExpansionReportSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    generatedAt: z.string().datetime(),
    sourceCutoffAt: z.string().datetime(),
    counts: ReportCountsSchema,
    coverage: z
      .object({
        baselineReviewedQualifications: z.array(z.string()),
        newlyCompletedCanonicalBases: z.array(z.string()),
        terminalDistinctQualificationTotal: z.number().int().nonnegative(),
        targetDistinctQualifications: z.literal(12),
        remainingGap: z.number().int().nonnegative(),
        modalityDoubleCount: z.literal(false),
        belowTargetReason: z.string().min(20),
        publicationStatus: z.enum([
          "pending_task_a2_12",
          "published_task_a2_12",
        ]),
      })
      .strict(),
    offerDeltas: z
      .object({
        byProgram: z.record(z.string(), z.array(z.string())),
        union: z.array(z.string()),
      })
      .strict(),
    time: z
      .object({
        totalModeledActiveMinutes: z.number().int().nonnegative(),
        totalWallClockMinutes: z.number().nonnegative(),
        totalReviewerMinutes: z.number().int().nonnegative(),
        reviewerMinutesExcluded: z.literal(true),
      })
      .strict(),
    candidates: z.array(CandidateReportSchema),
  })
  .strict()
  .superRefine((report, context) => {
    const candidates = report.candidates;
    const canonicalBases = candidates.map((candidate) =>
      canonicalizeFpQualificationIdentity(candidate.baseQualificationIdentity),
    );
    if (new Set(canonicalBases).size !== canonicalBases.length)
      context.addIssue({
        code: "custom",
        path: ["candidates"],
        message: "Duplicate canonical bases are not allowed.",
      });
    const attempted = candidates.filter((candidate) => candidate.attempted);
    if (
      attempted.some(
        (candidate) =>
          !terminalStates.includes(
            candidate.state as (typeof terminalStates)[number],
          ),
      )
    )
      context.addIssue({
        code: "custom",
        path: ["candidates"],
        message: "Attempted candidates must have terminal states.",
      });
    if (
      candidates.some(
        (candidate) =>
          !candidate.attempted && candidate.state !== "not_attempted",
      )
    )
      context.addIssue({
        code: "custom",
        path: ["candidates"],
        message: "Unattempted candidates must remain not_attempted.",
      });
    const count = (state: string) =>
      attempted.filter((candidate) => candidate.state === state).length;
    const expected = {
      completed: count("completed"),
      deferred: count("deferred"),
      discarded: count("discarded"),
      terminal: attempted.length,
      primaryAttempted: attempted.filter(
        (candidate) => candidate.lane === "primary",
      ).length,
      reserveAttempted: attempted.filter(
        (candidate) => candidate.lane === "reserve",
      ).length,
      totalAttempted: attempted.length,
      primaryUnattempted: candidates.filter(
        (candidate) => candidate.lane === "primary" && !candidate.attempted,
      ).length,
      reserveUnattempted: candidates.filter(
        (candidate) => candidate.lane === "reserve" && !candidate.attempted,
      ).length,
    };
    for (const key of Object.keys(expected) as Array<keyof typeof expected>)
      if (report.counts[key] !== expected[key])
        context.addIssue({
          code: "custom",
          path: ["counts", key],
          message: `Report count ${key} is not recomputed from candidates.`,
        });
    const completedBases = attempted
      .filter((candidate) => candidate.state === "completed")
      .map((candidate) =>
        canonicalizeFpQualificationIdentity(
          candidate.baseQualificationIdentity,
        ),
      );
    const distinctTotal =
      baselineReviewedQualifications.length + new Set(completedBases).size;
    if (report.coverage.terminalDistinctQualificationTotal !== distinctTotal)
      context.addIssue({
        code: "custom",
        path: ["coverage", "terminalDistinctQualificationTotal"],
        message: "Terminal distinct qualification count is not recomputed.",
      });
    if (report.coverage.remainingGap !== Math.max(0, 12 - distinctTotal))
      context.addIssue({
        code: "custom",
        path: ["coverage", "remainingGap"],
        message: "Remaining target gap is not recomputed.",
      });
    if (
      JSON.stringify(report.coverage.newlyCompletedCanonicalBases) !==
      JSON.stringify([...new Set(completedBases)].toSorted())
    )
      context.addIssue({
        code: "custom",
        path: ["coverage", "newlyCompletedCanonicalBases"],
        message: "Completed bases are not canonical and sorted.",
      });
    if (
      JSON.stringify(report.coverage.baselineReviewedQualifications) !==
      JSON.stringify(baselineReviewedQualifications)
    )
      context.addIssue({
        code: "custom",
        path: ["coverage", "baselineReviewedQualifications"],
        message:
          "Baseline qualifications must match the frozen five-item baseline.",
      });
    const expectedOfferDeltas = Object.fromEntries(
      attempted.map((candidate) => [
        candidate.programKey,
        candidate.offerDeltaIds,
      ]),
    );
    if (
      JSON.stringify(report.offerDeltas.byProgram) !==
      JSON.stringify(expectedOfferDeltas)
    )
      context.addIssue({
        code: "custom",
        path: ["offerDeltas", "byProgram"],
        message: "Offer deltas must be recomputed from attempted candidates.",
      });
    const expectedOfferUnion = [
      ...new Set(Object.values(expectedOfferDeltas).flat()),
    ].toSorted();
    if (
      JSON.stringify(report.offerDeltas.union) !==
      JSON.stringify(expectedOfferUnion)
    )
      context.addIssue({
        code: "custom",
        path: ["offerDeltas", "union"],
        message: "Offer union must be recomputed from per-program deltas.",
      });
    const expectedActiveMinutes = attempted.reduce(
      (sum, candidate) => sum + candidate.modeledActiveMinutes,
      0,
    );
    const expectedWallClockMinutes = roundMinutes(
      attempted.reduce(
        (sum, candidate) => sum + (candidate.wallClockMinutes ?? 0),
        0,
      ),
    );
    const expectedReviewerMinutes = attempted.reduce(
      (sum, candidate) => sum + candidate.reviewerMinutes,
      0,
    );
    if (
      report.time.totalModeledActiveMinutes !== expectedActiveMinutes ||
      report.time.totalWallClockMinutes !== expectedWallClockMinutes ||
      report.time.totalReviewerMinutes !== expectedReviewerMinutes
    )
      context.addIssue({
        code: "custom",
        path: ["time"],
        message: "Time totals must be recomputed from attempted candidates.",
      });
  });

export type FpCoverageExpansionReport = z.infer<
  typeof FpCoverageExpansionReportSchema
>;

function expansionSnapshotHash(input: {
  snapshotId: string;
  programKey: string;
  baselineMatchIds: string[];
  currentMatchIds: string[];
  acceptedRelationKeys: string[];
}): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].toSorted();
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export type EffectiveExpansionResources = {
  snapshotId: string;
  matchingData: OfferMatchingData;
  curatedOccupations: Occupation[];
  curatedLinks: TrainingOccupationLink[];
  publicRelationKeys: ReadonlySet<string>;
};

export type IndependentlyComputedAttempt = {
  relationKeys: {
    accepted: string[];
    rejected: string[];
  };
  computed: {
    baselineMatchIds: string[];
    currentMatchIds: string[];
    newlyReachedOfferIdsByProgram: Record<string, string[]>;
    newlyReachedOfferUnionIds: string[];
    snapshotId: string;
    snapshotHash: string;
  };
  publicRelationSet: {
    manifestAddressed: true;
    relationKeys: string[];
    resourcePaths: ["/data/v1/manifest.json"];
  };
};

export async function loadEffectiveExpansionResources(
  rootDirectory: string,
): Promise<EffectiveExpansionResources> {
  const manifest = GeneratedManifestSchema.parse(
    await readJson(resolve(rootDirectory, "public/data/v1/manifest.json")),
  );
  const resourcePath = <K extends keyof typeof manifest.resourceSnapshots>(
    key: K,
  ): string =>
    resolve(
      rootDirectory,
      "public",
      manifest.resourceSnapshots[key].resourcePath.slice(1),
    );
  const [programs, occupations, aliases, links, offers, publishedRequirements] =
    await Promise.all([
      readJson(resourcePath("programs")).then((value) =>
        z.array(TrainingProgramSchema).parse(value),
      ),
      readJson(resourcePath("occupations")).then((value) =>
        OccupationsSchema.parse(value),
      ),
      readJson(resourcePath("occupationAliases")).then((value) =>
        OccupationAliasesSchema.parse(value),
      ),
      readJson(resourcePath("trainingOccupationLinks")).then((value) =>
        TrainingOccupationLinksSchema.parse(value),
      ),
      readJson(resourcePath("jobOffers")).then((value) =>
        z.array(JobOfferSchema).parse(value),
      ),
      readJson(resourcePath("publishedRequirements")).then((value) =>
        PublishedRequirementsResourceSchema.parse(value),
      ),
    ]);
  const curatedOccupations = OccupationsSchema.parse(
    await readJson(resolve(rootDirectory, "data/curated/occupations.json")),
  );
  const curatedLinks = TrainingOccupationLinksSchema.parse(
    await readJson(
      resolve(rootDirectory, "data/curated/training-occupation-links.json"),
    ),
  );
  const matchingData: OfferMatchingData = {
    programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    humanOverrides: [],
  };
  return {
    snapshotId: manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!,
    matchingData,
    curatedOccupations,
    curatedLinks,
    publicRelationKeys: new Set(
      links
        .filter((link) => link.reviewStatus === "approved")
        .map((link) => `${link.trainingProgramKey}|${link.occupationId}`),
    ),
  };
}

function currentMatchIds(
  programKey: string,
  matchingData: OfferMatchingData,
): string[] {
  return matchOffersForProgram(programKey, matchingData)
    .map((match) => match.offerId)
    .toSorted();
}

function relationKeysFromOfficialOutputReviews(
  attempt: FpExpansionAttempt,
): IndependentlyComputedAttempt["relationKeys"] {
  const acceptedRelations = attempt.acceptedRelations!;
  const rejectedRelations = attempt.rejectedRelations!;
  if (
    [...acceptedRelations, ...rejectedRelations].some(
      (relation) =>
        relation.kind !== "link" ||
        relation.alias !== undefined ||
        relation.matchPolicy !== undefined,
    )
  )
    throw new Error(
      `Aggregate report requires output-derived link relations; ${attempt.programKey} contains an alias relation.`,
    );
  const reviews = attempt.officialOutputReviews!;
  return {
    accepted: sortedUnique(
      reviews
        .filter((review) => review.disposition === "accepted")
        .flatMap((review) => review.acceptedOccupationIds ?? [])
        .map((occupationId) => `${attempt.programKey}|${occupationId}`),
    ),
    rejected: sortedUnique(
      reviews
        .filter((review) => review.disposition === "rejected")
        .flatMap((review) => review.candidateOccupationIds)
        .map((occupationId) => `${attempt.programKey}|${occupationId}`),
    ),
  };
}

export function computeIndependentAttempt(
  attempt: FpExpansionAttempt,
  resources: EffectiveExpansionResources,
): IndependentlyComputedAttempt {
  const acceptedRelations = attempt.acceptedRelations!;
  const relationKeys = relationKeysFromOfficialOutputReviews(attempt);
  const acceptedRelationKeys = relationKeys.accepted;
  const baselineMatchIds = currentMatchIds(
    attempt.programKey,
    resources.matchingData,
  );
  let currentData = resources.matchingData;
  if (attempt.state === "completed") {
    if (acceptedRelations.some((relation) => relation.alias !== undefined))
      throw new Error(
        `Completed link attempt ${attempt.programKey} cannot contain aliases.`,
      );
    const acceptedOccupationIds = new Set(
      acceptedRelations.map((relation) => relation.occupationId),
    );
    const overlayOccupations = resources.curatedOccupations.filter(
      (occupation) =>
        occupation.reviewStatus === "approved" &&
        acceptedOccupationIds.has(occupation.occupationId),
    );
    if (
      new Set(overlayOccupations.map((occupation) => occupation.occupationId))
        .size !== acceptedOccupationIds.size
    )
      throw new Error(
        `Completed attempt ${attempt.programKey} lacks curated occupation evidence for every accepted relation.`,
      );
    const overlayLinks = resources.curatedLinks.filter(
      (link) =>
        link.reviewStatus === "approved" &&
        link.trainingProgramKey === attempt.programKey &&
        acceptedOccupationIds.has(link.occupationId),
    );
    const overlayLinkKeys = overlayLinks.map(
      (link) => `${link.trainingProgramKey}|${link.occupationId}`,
    );
    if (
      JSON.stringify(sortedUnique(overlayLinkKeys)) !==
      JSON.stringify(sortedUnique(acceptedRelationKeys))
    )
      throw new Error(
        `Completed attempt ${attempt.programKey} lacks one-to-one curated link evidence.`,
      );
    const overlayLinkKeySet = new Set(overlayLinkKeys);
    currentData = {
      ...resources.matchingData,
      occupations: [
        ...resources.matchingData.occupations.filter(
          (occupation) => !acceptedOccupationIds.has(occupation.occupationId),
        ),
        ...overlayOccupations,
      ],
      links: [
        ...resources.matchingData.links.filter(
          (link) =>
            !overlayLinkKeySet.has(
              `${link.trainingProgramKey}|${link.occupationId}`,
            ),
        ),
        ...overlayLinks,
      ],
    };
  }
  const currentIds = currentMatchIds(attempt.programKey, currentData);
  const baselineSet = new Set(baselineMatchIds);
  const newlyReachedOfferIds = currentIds.filter(
    (offerId) => !baselineSet.has(offerId),
  );
  const snapshotHash = expansionSnapshotHash({
    snapshotId: resources.snapshotId,
    programKey: attempt.programKey,
    baselineMatchIds,
    currentMatchIds: currentIds,
    acceptedRelationKeys,
  });
  const expectedAccepted = new Set(relationKeys.accepted);
  const expectedRejected = new Set(relationKeys.rejected);
  const actualProgramRelationKeys = sortedUnique(
    [...resources.publicRelationKeys].filter((key) =>
      key.startsWith(`${attempt.programKey}|`),
    ),
  );
  const actualAccepted = [...expectedAccepted].filter((key) =>
    resources.publicRelationKeys.has(key),
  );
  if (attempt.state === "completed") {
    if (
      JSON.stringify(actualProgramRelationKeys) !==
      JSON.stringify(acceptedRelationKeys)
    )
      throw new Error(
        `Completed ${attempt.programKey} public relations must equal the accepted output-derived relations exactly.`,
      );
  } else if (actualAccepted.length > 0) {
    throw new Error(
      `Deferred ${attempt.programKey} accepted audit relation leaked into public resources.`,
    );
  }
  if (
    [...expectedRejected].some((key) => resources.publicRelationKeys.has(key))
  )
    throw new Error(
      `Rejected ${attempt.programKey} relation leaked into public resources.`,
    );
  return {
    relationKeys,
    computed: {
      baselineMatchIds,
      currentMatchIds: currentIds,
      newlyReachedOfferIdsByProgram: {
        [attempt.programKey]: sortedUnique(newlyReachedOfferIds),
      },
      newlyReachedOfferUnionIds: sortedUnique(newlyReachedOfferIds),
      snapshotId: resources.snapshotId,
      snapshotHash,
    },
    publicRelationSet: {
      manifestAddressed: true,
      relationKeys: actualProgramRelationKeys,
      resourcePaths: ["/data/v1/manifest.json"],
    },
  };
}

function durationMinutes(
  startedAt: string | null,
  completedAt: string | null,
): number | null {
  if (startedAt === null || completedAt === null) return null;
  return (
    Math.round(
      ((Date.parse(completedAt) - Date.parse(startedAt)) / 60000) * 100,
    ) / 100
  );
}

function roundMinutes(value: number): number {
  return Math.round(value * 100) / 100;
}

export function reportCandidate(
  candidate: z.infer<typeof FpExpansionCandidateSchema>,
  attempt: FpExpansionAttempt | undefined,
  lane: "primary" | "reserve",
  independentlyComputed: IndependentlyComputedAttempt | undefined,
) {
  const relationKeys = independentlyComputed?.relationKeys ?? {
    accepted: [],
    rejected: [],
  };
  const publishedRelationKeys =
    independentlyComputed?.publicRelationSet.relationKeys ?? [];
  const phaseMinutes = attempt?.phaseMinutes ?? {
    research: 0,
    implementation: 0,
    test: 0,
    review: 0,
  };
  return {
    programKey: candidate.programKey,
    baseQualificationIdentity: candidate.baseQualificationIdentity,
    programTitle: candidate.programTitle,
    lane,
    rank: candidate.rank,
    attempted: attempt !== undefined,
    state: attempt?.state ?? ("not_attempted" as const),
    phaseMinutes,
    modeledActiveMinutes:
      phaseMinutes.research + phaseMinutes.implementation + phaseMinutes.test,
    wallClockMinutes: durationMinutes(
      attempt?.startedAt ?? null,
      attempt?.completedAt ?? null,
    ),
    reviewerMinutes: phaseMinutes.review,
    reviewerTimeExcluded: true as const,
    offerDeltaIds:
      independentlyComputed?.computed.newlyReachedOfferIdsByProgram[
        candidate.programKey
      ] ?? [],
    acceptedRelationKeys: relationKeys.accepted,
    rejectedRelationKeys: relationKeys.rejected,
    publicParity: {
      publishedRelationKeys,
      rejectedRelationKeys: relationKeys.rejected,
    },
    ...(attempt?.limitation === undefined
      ? {}
      : { limitation: attempt.limitation }),
    ...(attempt?.sourceDrift === undefined
      ? {}
      : { sourceDrift: attempt.sourceDrift }),
  };
}

export async function loadFpCoverageExpansionInputs(rootDirectory: string) {
  const ranking = FpExpansionRankingSchema.parse(
    JSON.parse(
      await readFile(
        resolve(
          rootDirectory,
          "analysis/fp_coverage_expansion_candidates.json",
        ),
        "utf8",
      ),
    ),
  );
  const paths = (
    await readdir(resolve(rootDirectory, "analysis/fp_coverage_expansion"))
  )
    .filter((path) => path.endsWith(".json"))
    .toSorted();
  const attempts = new Map<string, FpExpansionAttempt>();
  for (const path of paths) {
    const attempt = FpExpansionAttemptSchema.parse(
      JSON.parse(
        await readFile(
          resolve(rootDirectory, "analysis/fp_coverage_expansion", path),
          "utf8",
        ),
      ),
    );
    if (attempts.has(attempt.programKey))
      throw new Error(`Duplicate attempt for ${attempt.programKey}.`);
    attempts.set(attempt.programKey, attempt);
  }
  const candidates = [
    ...ranking.primaryCandidates,
    ...ranking.reserveCandidates,
  ];
  const resources = await loadEffectiveExpansionResources(rootDirectory);
  const independentlyComputed = new Map<string, IndependentlyComputedAttempt>();
  for (const attempt of attempts.values()) {
    const candidate = candidates.find(
      (entry) => entry.programKey === attempt.programKey,
    );
    if (candidate === undefined)
      throw new Error(
        `Attempt ${attempt.programKey} is not in the frozen ranking.`,
      );
    const terminal = terminalStates.includes(
      attempt.state as (typeof terminalStates)[number],
    );
    if (!terminal)
      throw new Error(`Attempt ${attempt.programKey} is not terminal.`);
    const recomputed = computeIndependentAttempt(attempt, resources);
    validateExpansionAttemptData({
      attempt,
      candidate,
      computed: recomputed.computed,
      publicRelationSet: recomputed.publicRelationSet,
      publicationPending:
        attempt.state === "completed" &&
        recomputed.publicRelationSet.relationKeys.length === 0,
      reviewedCommitAt: attempt.reviewedCommitAt,
    });
    independentlyComputed.set(attempt.programKey, recomputed);
  }
  return { ranking, attempts, independentlyComputed };
}

export async function buildFpCoverageExpansionReport(
  rootDirectory: string,
): Promise<FpCoverageExpansionReport> {
  const { ranking, attempts, independentlyComputed } =
    await loadFpCoverageExpansionInputs(rootDirectory);
  const candidates = [
    ...ranking.primaryCandidates.map((candidate) =>
      reportCandidate(
        candidate,
        attempts.get(candidate.programKey),
        "primary",
        independentlyComputed.get(candidate.programKey),
      ),
    ),
    ...ranking.reserveCandidates.map((candidate) =>
      reportCandidate(
        candidate,
        attempts.get(candidate.programKey),
        "reserve",
        independentlyComputed.get(candidate.programKey),
      ),
    ),
  ];
  const attempted = candidates.filter((candidate) => candidate.attempted);
  const completedBases = attempted
    .filter((candidate) => candidate.state === "completed")
    .map((candidate) =>
      canonicalizeFpQualificationIdentity(candidate.baseQualificationIdentity),
    );
  const completedProgramKeys = attempted
    .filter((candidate) => candidate.state === "completed")
    .map((candidate) => candidate.programKey)
    .toSorted();
  const deferredCount = attempted.filter(
    (candidate) => candidate.state === "deferred",
  ).length;
  const reserveUnattemptedCount = candidates.filter(
    (candidate) => candidate.lane === "reserve" && !candidate.attempted,
  ).length;
  const cutoff = attempted
    .map((candidate) => attempts.get(candidate.programKey)!.completedAt!)
    .toSorted()
    .at(-1)!;
  const byProgram: Record<string, string[]> = {};
  for (const candidate of attempted)
    byProgram[candidate.programKey] = candidate.offerDeltaIds;
  const report = {
    schemaVersion: "1.0.0" as const,
    generatedAt: cutoff,
    sourceCutoffAt: cutoff,
    counts: {
      completed: attempted.filter(
        (candidate) => candidate.state === "completed",
      ).length,
      deferred: attempted.filter((candidate) => candidate.state === "deferred")
        .length,
      discarded: attempted.filter(
        (candidate) => candidate.state === "discarded",
      ).length,
      terminal: attempted.length,
      primaryAttempted: attempted.filter(
        (candidate) => candidate.lane === "primary",
      ).length,
      reserveAttempted: attempted.filter(
        (candidate) => candidate.lane === "reserve",
      ).length,
      totalAttempted: attempted.length,
      primaryUnattempted: candidates.filter(
        (candidate) => candidate.lane === "primary" && !candidate.attempted,
      ).length,
      reserveUnattempted: candidates.filter(
        (candidate) => candidate.lane === "reserve" && !candidate.attempted,
      ).length,
    },
    coverage: {
      baselineReviewedQualifications: [...baselineReviewedQualifications],
      newlyCompletedCanonicalBases: [...new Set(completedBases)].toSorted(),
      terminalDistinctQualificationTotal:
        baselineReviewedQualifications.length + new Set(completedBases).size,
      targetDistinctQualifications: 12 as const,
      remainingGap: Math.max(
        0,
        12 -
          baselineReviewedQualifications.length -
          new Set(completedBases).size,
      ),
      modalityDoubleCount: false as const,
      belowTargetReason: `Evidence-backed completion covers ${completedProgramKeys.join(
        " and ",
      )}; ${deferredCount} terminal attempts were deferred, ${reserveUnattemptedCount} reserves remain unattempted, and no additional programme met the evidence threshold needed for 12 distinct qualifications.`,
      publicationStatus: candidates.some(
        (candidate) =>
          candidate.state === "completed" &&
          candidate.publicParity.publishedRelationKeys.length > 0,
      )
        ? ("published_task_a2_12" as const)
        : ("pending_task_a2_12" as const),
    },
    offerDeltas: {
      byProgram,
      union: [...new Set(Object.values(byProgram).flat())].toSorted(),
    },
    time: {
      totalModeledActiveMinutes: attempted.reduce(
        (sum, candidate) => sum + candidate.modeledActiveMinutes,
        0,
      ),
      totalWallClockMinutes: roundMinutes(
        attempted.reduce(
          (sum, candidate) => sum + (candidate.wallClockMinutes ?? 0),
          0,
        ),
      ),
      totalReviewerMinutes: attempted.reduce(
        (sum, candidate) => sum + candidate.reviewerMinutes,
        0,
      ),
      reviewerMinutesExcluded: true as const,
    },
    candidates,
  };
  return FpCoverageExpansionReportSchema.parse(report);
}

export function renderFpCoverageExpansionReport(
  report: FpCoverageExpansionReport,
): string {
  const parsed = FpCoverageExpansionReportSchema.parse(report);
  const publishedCompletedPrograms = parsed.candidates
    .filter(
      (candidate) =>
        candidate.state === "completed" &&
        candidate.publicParity.publishedRelationKeys.length > 0,
    )
    .map((candidate) => candidate.programKey)
    .toSorted();
  const tableRows = parsed.candidates.map((candidate) => [
    candidate.lane,
    String(candidate.rank),
    candidate.programKey,
    candidate.programTitle,
    candidate.attempted ? "attempted" : "unattempted",
    candidate.state,
    String(candidate.modeledActiveMinutes),
    String(candidate.wallClockMinutes ?? "—"),
  ]);
  const headers = [
    "Lane",
    "Rank",
    "Program",
    "Title",
    "Attempt",
    "State",
    "Active min",
    "Wall min",
  ];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...tableRows.map((row) => row[index]!.length)),
  );
  const tableLine = (row: string[], alignNumeric = false) =>
    `| ${row
      .map((value, index) =>
        alignNumeric && [1, 6, 7].includes(index)
          ? value.padStart(widths[index]!)
          : value.padEnd(widths[index]!),
      )
      .join(" | ")} |`;
  const rows = [
    `| ${widths.map((width, index) => (index === 1 || index > 5 ? `${"-".repeat(width - 1)}:` : "-".repeat(width))).join(" | ")} |`,
    ...tableRows.map((row) => tableLine(row, true)),
  ].join("\n");
  return `# FP coverage expansion reconciliation

Generated at: \`${parsed.generatedAt}\`
Source cutoff: \`${parsed.sourceCutoffAt}\`

## Coverage result

- Terminal attempts: ${parsed.counts.terminal} (${parsed.counts.completed} completed, ${parsed.counts.deferred} deferred, ${parsed.counts.discarded} discarded).
- Truthful terminal distinct total: ${parsed.coverage.terminalDistinctQualificationTotal} (baseline 5 + ${parsed.coverage.newlyCompletedCanonicalBases.length} newly completed canonical bases).
- Target: ${parsed.coverage.targetDistinctQualifications}; remaining gap: ${parsed.coverage.remainingGap}.
- Publication status: ${
    parsed.coverage.publicationStatus === "published_task_a2_12"
      ? `${publishedCompletedPrograms.join(" and ")} are published in the current immutable snapshot; deferred attempts remain unpublished.`
      : "terminal evidence is supported for completed attempts; public snapshot publication remains pending Task A2.12."
  }
- Below-target reason: ${parsed.coverage.belowTargetReason}

## Attempt lanes

${tableLine(headers)}
${rows}

## Offers and time

- Exact offer deltas by attempted program: \`${JSON.stringify(parsed.offerDeltas.byProgram)}\`.
- Sorted offer union: ${parsed.offerDeltas.union.join(", ") || "none"}.
- Total modeled active minutes (research + implementation + test): ${parsed.time.totalModeledActiveMinutes}.
- Total wall-clock minutes across attempt windows: ${parsed.time.totalWallClockMinutes}.
- Recorded reviewer minutes: ${parsed.time.totalReviewerMinutes}; these are excluded from active-work denominators.
- Reviewer time is explicitly excluded from modeled active minutes and remains excluded from all denominators.
- Attempt denominator: ${parsed.counts.primaryAttempted} primary + ${parsed.counts.reserveAttempted} reserve = ${parsed.counts.totalAttempted} total attempted; ${parsed.counts.reserveUnattempted} reserve candidates remain unattempted.

Deferred accepted audit relations are not counted as completed or public coverage. Checked attempts were validated against their stored terminal evidence, while matches, offer deltas, snapshot identity, output-derived relation keys, and the current manifest-addressed public relation set were independently recomputed; only relations matching the completed evidence are public.
`;
}

export function assertRenderedFpCoverageExpansionReport(
  actual: string,
  expected: string,
): void {
  if (actual !== expected)
    throw new Error(
      "FP coverage expansion report is not the validated rendered output.",
    );
}

export async function loadFpCoverageExpansionReport(
  path: string,
): Promise<FpCoverageExpansionReport> {
  return FpCoverageExpansionReportSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
}

export async function checkFpCoverageExpansionReport(
  rootDirectory: string,
): Promise<void> {
  const expected = await buildFpCoverageExpansionReport(rootDirectory);
  const jsonPath = resolve(
    rootDirectory,
    "analysis/fp_coverage_expansion_results.json",
  );
  const mdPath = resolve(
    rootDirectory,
    "analysis/fp_coverage_expansion_results.md",
  );
  const actualJson = await readFile(jsonPath, "utf8");
  const expectedJson = await formatPrettier(JSON.stringify(expected), {
    parser: "json",
  });
  if (actualJson !== expectedJson)
    throw new Error(
      "Checked FP expansion JSON does not match the validated report.",
    );
  assertRenderedFpCoverageExpansionReport(
    await readFile(mdPath, "utf8"),
    renderFpCoverageExpansionReport(expected),
  );
}

async function main(): Promise<void> {
  const root = process.cwd();
  if (process.argv.includes("--write")) {
    const report = await buildFpCoverageExpansionReport(root);
    await writeFile(
      resolve(root, "analysis/fp_coverage_expansion_results.json"),
      await formatPrettier(JSON.stringify(report), { parser: "json" }),
    );
    await writeFile(
      resolve(root, "analysis/fp_coverage_expansion_results.md"),
      renderFpCoverageExpansionReport(report),
    );
    return;
  }
  await checkFpCoverageExpansionReport(root);
  console.info("FP coverage expansion report matches validated inputs.");
}

if (pathToFileURL(resolve(process.argv[1] ?? "")).href === import.meta.url)
  await main();
