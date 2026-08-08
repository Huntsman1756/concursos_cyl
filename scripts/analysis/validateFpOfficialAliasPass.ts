import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

import {
  FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID,
  FpOfficialAliasPassResultsSchema,
  ProgramOfficialAliasReviewSchema,
  TARGET_ALIAS_PROGRAMS,
  TARGET_OCCUPATIONS_BY_PROGRAM,
  type FpOfficialAliasPassResults,
  type ProgramOfficialAliasReview,
} from "../../data/schemas/fpOfficialAliasPass";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  JobOfferSchema,
  TrainingProgramSchema,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  matchOffersForProgram,
  type OfferMatch,
} from "../../src/domain/offerMatching";
import {
  PublishedRequirementsResourceSchema,
  type OfferPublishedRequirements,
} from "../../src/domain/requirements";
import {
  validateFpCoveragePilotResultsFile,
  type FpCoveragePilotResults,
} from "./validateFpCoveragePilot";
import { hashFile } from "../data/hashFile";

const BASELINE_SNAPSHOT_ID = FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID;
const AUDIT_DIRECTORY = ["analysis", "fp_official_alias_pass"] as const;

export const PINNED_BASELINE_RESOURCE_CONTRACT = {
  programs: {
    fileName: "programs.json",
    recordCount: 187,
    sha256: "90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72",
  },
  occupations: {
    fileName: "occupations.json",
    recordCount: 11,
    sha256: "3e92e4fdd4b72c37afbf7d18cd2eb4ea037bd8b0eeb7d37e63f69754acc66d81",
  },
  aliases: {
    fileName: "occupation-aliases.json",
    recordCount: 10,
    sha256: "bd55ce9979ce84d032c39bffa6dc00eac8f10d1afdedc21897d261c23ed2f479",
  },
  links: {
    fileName: "training-occupation-links.json",
    recordCount: 12,
    sha256: "257792082483cbb97143f3cd9561d921d6fccc466c62cb7d65beaf0436e50adc",
  },
  offers: {
    fileName: "job-offers.json",
    recordCount: 1077,
    sha256: "ce7cb800dbf50dbb87da820898afbca43efbb40da32f3e1f1cafa11bb0396767",
  },
  publishedRequirements: {
    fileName: "published-requirements.json",
    recordCount: 337,
    sha256: "0a9061ecea0e25ef0038ec93839941c8584246e280e0453b4be816ce2d9e3a65",
  },
} as const;

type PinnedBaselineResourceKey = keyof typeof PINNED_BASELINE_RESOURCE_CONTRACT;

export interface AliasPassValidationContext {
  baselineSnapshotId: string;
  reviews: readonly ProgramOfficialAliasReview[];
  pilotResults: FpCoveragePilotResults;
  programs: readonly TrainingProgram[];
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
  offers: readonly JobOffer[];
  publishedRequirements: readonly OfferPublishedRequirements[];
}

type AcceptedAliasReview = {
  alias: string;
  occupationId: string;
  disposition: "accepted";
  reasonCode: "literal_ine_classification" | "literal_sepe_classification";
  sourceUrl: string;
  sourceQuote: string;
  acceptedProgramOutputLabel: string;
  acceptedProgramOutputSourceUrl: string;
  acceptedProgramOutputSourceQuote: string;
  acceptedProgramOutputRelevance: {
    relationship: "exact_term" | "singular_plural_variant";
    outputTerm: string;
    aliasTerm: string;
  };
  reviewedAt: string;
};

export interface AcceptedAliasSupport {
  programKey: (typeof TARGET_ALIAS_PROGRAMS)[number];
  review: AcceptedAliasReview;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function validatePinnedBaselineResourceFile(
  resourceKey: PinnedBaselineResourceKey,
  path: string,
): Promise<void> {
  const contract = PINNED_BASELINE_RESOURCE_CONTRACT[resourceKey];
  const [sha256, value] = await Promise.all([hashFile(path), readJson(path)]);
  assert(
    sha256 === contract.sha256,
    `Pinned baseline ${resourceKey} SHA-256 does not match ${BASELINE_SNAPSHOT_ID}.`,
  );
  assert(
    Array.isArray(value) && value.length === contract.recordCount,
    `Pinned baseline ${resourceKey} record count does not match ${BASELINE_SNAPSHOT_ID}.`,
  );
}

async function readPinnedBaselineResource(
  rootDirectory: string,
  resourceKey: PinnedBaselineResourceKey,
): Promise<unknown> {
  const path = publicSnapshotResourcePath(
    rootDirectory,
    PINNED_BASELINE_RESOURCE_CONTRACT[resourceKey].fileName,
  );
  await validatePinnedBaselineResourceFile(resourceKey, path);
  return readJson(path);
}

function publicSnapshotResourcePath(
  rootDirectory: string,
  fileName: string,
): string {
  return resolve(
    rootDirectory,
    "public",
    "data",
    "v1",
    "snapshots",
    BASELINE_SNAPSHOT_ID,
    fileName,
  );
}

function normalizeMatcherAlias(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeEvidencePhrase(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function stableCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isIneOrSepeClassification(value: string): "ine" | "sepe" | undefined {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    return undefined;
  }
  const hostname = url.hostname.toLocaleLowerCase("en-US");
  if (hostname === "ine.es" || hostname.endsWith(".ine.es")) return "ine";
  if (hostname === "sepe.es" || hostname.endsWith(".sepe.es")) return "sepe";
  return undefined;
}

function hasLiteralOfficialPhrase(alias: string, quote: string): boolean {
  const normalizedAlias = normalizeEvidencePhrase(alias);
  const normalizedQuote = normalizeEvidencePhrase(quote);
  return ` ${normalizedQuote} `.includes(` ${normalizedAlias} `);
}

function isSingularPluralVariant(left: string, right: string): boolean {
  const normalizedLeft = normalizeEvidencePhrase(left);
  const normalizedRight = normalizeEvidencePhrase(right);
  if (normalizedLeft === normalizedRight) return false;
  return (
    normalizedLeft === `${normalizedRight}s` ||
    normalizedLeft === `${normalizedRight}es` ||
    normalizedRight === `${normalizedLeft}s` ||
    normalizedRight === `${normalizedLeft}es`
  );
}

function acceptedProgramOutputReviews(
  pilotResults: FpCoveragePilotResults,
  programKey: string,
) {
  const attempt = pilotResults.attempts.find(
    (candidate) => candidate.programKey === programKey,
  );
  assert(
    attempt !== undefined,
    `Missing pilot program-output evidence for ${programKey}.`,
  );
  return (attempt.professionalOutputReviews ?? []).filter(
    (review) => review.disposition === "accepted",
  );
}

function hasAcceptedProgramOutputBoundary(
  review: ProgramOfficialAliasReview["reviews"][number],
  pilotResults: FpCoveragePilotResults,
  programKey: string,
): boolean {
  return acceptedProgramOutputReviews(pilotResults, programKey).some(
    (output) =>
      output.candidateOccupationIds.includes(review.occupationId) &&
      output.acceptedOccupationIds?.includes(review.occupationId) === true &&
      output.officialOutputLabel === review.acceptedProgramOutputLabel &&
      output.sourceUrl === review.acceptedProgramOutputSourceUrl &&
      output.sourceQuote === review.acceptedProgramOutputSourceQuote,
  );
}

function assertAliasBoundary(
  review: AcceptedAliasReview,
  pilotResults: FpCoveragePilotResults,
  programKey: string,
): void {
  assert(
    hasAcceptedProgramOutputBoundary(review, pilotResults, programKey),
    `Alias ${review.alias} is outside the accepted program-output boundary for ${programKey}; semantic broadening is not allowed.`,
  );
  const relevance = review.acceptedProgramOutputRelevance;
  assert(
    hasLiteralOfficialPhrase(relevance.aliasTerm, review.alias) &&
      hasLiteralOfficialPhrase(
        relevance.outputTerm,
        review.acceptedProgramOutputLabel,
      ),
    `Alias ${review.alias} lacks auditable terms inside its accepted program-output boundary.`,
  );
  const relevanceMatches =
    relevance.relationship === "exact_term"
      ? normalizeEvidencePhrase(relevance.aliasTerm) ===
        normalizeEvidencePhrase(relevance.outputTerm)
      : isSingularPluralVariant(relevance.aliasTerm, relevance.outputTerm);
  assert(
    relevanceMatches,
    `Alias ${review.alias} is outside the accepted program-output boundary and would cause semantic broadening.`,
  );
  const explicitlyRejectedElsewhere = pilotResults.attempts.some((attempt) =>
    (attempt.rejectedRelationships ?? []).some(
      (rejected) =>
        rejected.occupationId === review.occupationId &&
        normalizeEvidencePhrase(rejected.sourceQuote) ===
          normalizeEvidencePhrase(review.alias),
    ),
  );
  assert(
    !explicitlyRejectedElsewhere,
    `Alias ${review.alias} is an explicitly rejected program-output boundary and would cause semantic broadening.`,
  );
}

export function canonicalAliasIdentity(alias: {
  alias: string;
  occupationId: string;
}): string {
  return `${normalizeMatcherAlias(alias.alias)}\u0000${alias.occupationId}`;
}

function literalAliasEvidenceIdentity(review: AcceptedAliasReview): string {
  return [review.sourceUrl, review.sourceQuote, review.reasonCode].join(
    "\u0000",
  );
}

/** Coalesces identical multi-program support into one global curated alias. */
export function coalesceAcceptedAliasSupports(
  supports: readonly AcceptedAliasSupport[],
): AcceptedAliasReview[] {
  const grouped = new Map<string, AcceptedAliasSupport[]>();
  for (const support of supports) {
    const normalizedAlias = normalizeMatcherAlias(support.review.alias);
    const group = grouped.get(normalizedAlias) ?? [];
    group.push(support);
    grouped.set(normalizedAlias, group);
  }
  return [...grouped.entries()]
    .sort(([left], [right]) => stableCompare(left, right))
    .map(([normalizedAlias, group]) => {
      const ordered = [...group].sort(
        (left, right) =>
          stableCompare(left.programKey, right.programKey) ||
          stableCompare(left.review.alias, right.review.alias),
      );
      const first = ordered[0]!;
      for (const support of ordered.slice(1)) {
        assert(
          support.review.occupationId === first.review.occupationId,
          `Accepted alias ${normalizedAlias} has a normalized collision across occupations.`,
        );
        assert(
          literalAliasEvidenceIdentity(support.review) ===
            literalAliasEvidenceIdentity(first.review),
          `Accepted alias ${normalizedAlias} has conflicting literal evidence across program audits.`,
        );
      }
      return first.review;
    });
}

export function validateProgramOfficialAliasReview(
  value: unknown,
  context: AliasPassValidationContext,
): ProgramOfficialAliasReview {
  const programReview = ProgramOfficialAliasReviewSchema.parse(value);
  assert(
    context.baselineSnapshotId === BASELINE_SNAPSHOT_ID,
    `Alias pass requires retained baseline snapshot ${BASELINE_SNAPSHOT_ID}.`,
  );
  assert(
    context.programs.some(
      (program) => program.programKey === programReview.programKey,
    ),
    `Alias review references an unknown program: ${programReview.programKey}.`,
  );
  const targetOccupations =
    TARGET_OCCUPATIONS_BY_PROGRAM[programReview.programKey];
  const knownOccupationIds = new Set(
    context.occupations.map((occupation) => occupation.occupationId),
  );
  const seenReviewIdentities = new Set<string>();

  for (const review of programReview.reviews) {
    assert(
      (targetOccupations as readonly string[]).includes(review.occupationId) &&
        knownOccupationIds.has(review.occupationId),
      `Alias review references an unknown or out-of-scope occupation: ${review.occupationId}.`,
    );
    const identity = canonicalAliasIdentity(review);
    assert(
      !seenReviewIdentities.has(identity),
      `Duplicate normalized alias review: ${review.alias}.`,
    );
    seenReviewIdentities.add(identity);

    const source = isIneOrSepeClassification(review.sourceUrl);
    assert(
      source !== undefined,
      `Alias review ${review.alias} requires an HTTPS INE or SEPE classification URL.`,
    );
    if (review.disposition === "rejected") {
      const isLiteral = hasLiteralOfficialPhrase(
        review.alias,
        review.sourceQuote,
      );
      if (review.reasonCode === "official_evidence_absent") {
        assert(
          !isLiteral,
          `Rejected alias ${review.alias} cannot use official_evidence_absent when the source quote contains it.`,
        );
      }
      if (
        review.reasonCode === "normalized_collision" ||
        review.reasonCode === "cross_occupation_conflict" ||
        review.reasonCode === "matcher_policy_one_word" ||
        review.reasonCode === "semantic_broadening"
      ) {
        assert(
          isLiteral,
          `Rejected alias ${review.alias} requires a literal official phrase for reason ${review.reasonCode}.`,
        );
      }
      if (review.reasonCode === "matcher_policy_one_word") {
        assert(
          normalizeMatcherAlias(review.alias).split(" ").length < 2,
          `Rejected alias ${review.alias} must be one word for matcher_policy_one_word.`,
        );
      }
      continue;
    }

    assert(
      (review.reasonCode === "literal_ine_classification" &&
        source === "ine") ||
        (review.reasonCode === "literal_sepe_classification" &&
          source === "sepe"),
      `Accepted alias ${review.alias} source host and reason code must agree.`,
    );
    assert(
      hasLiteralOfficialPhrase(review.alias, review.sourceQuote),
      `Accepted alias ${review.alias} must be a literal contiguous phrase in its official source quote.`,
    );
    assertAliasBoundary(
      review as AcceptedAliasReview,
      context.pilotResults,
      programReview.programKey,
    );
  }

  return programReview;
}

function sortedMatches(matches: readonly OfferMatch[]): OfferMatch[] {
  return [...matches].sort((left, right) =>
    stableCompare(left.offerId, right.offerId),
  );
}

function matchProgram(
  programKey: string,
  context: AliasPassValidationContext,
  aliases: readonly OccupationAlias[],
): OfferMatch[] {
  return sortedMatches(
    matchOffersForProgram(programKey, {
      programs: context.programs,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      occupations: context.occupations,
      aliases,
      links: context.links,
      offers: context.offers,
      publishedRequirements: context.publishedRequirements,
      humanOverrides: [],
    }),
  );
}

function allApprovedProgramKeys(context: AliasPassValidationContext): string[] {
  return [
    ...new Set(
      context.links
        .filter((link) => link.reviewStatus === "approved")
        .map((link) => link.trainingProgramKey),
    ),
  ].sort(stableCompare);
}

function assertGlobalAliasSafety(
  acceptedReviews: readonly {
    programKey: string;
    review: ProgramOfficialAliasReview["reviews"][number];
  }[],
  reviewsByProgram: ReadonlyMap<string, ProgramOfficialAliasReview>,
  context: AliasPassValidationContext,
): void {
  for (const { review } of acceptedReviews) {
    const linkedProgramKeys = [
      ...new Set(
        context.links
          .filter(
            (link) =>
              link.reviewStatus === "approved" &&
              link.occupationId === review.occupationId,
          )
          .map((link) => link.trainingProgramKey),
      ),
    ].sort(stableCompare);
    for (const linkedProgramKey of linkedProgramKeys) {
      const linkedAudit = reviewsByProgram.get(linkedProgramKey);
      const supportsAlias = linkedAudit?.reviews.some(
        (candidate) =>
          candidate.disposition === "accepted" &&
          canonicalAliasIdentity(candidate) ===
            canonicalAliasIdentity(review) &&
          hasAcceptedProgramOutputBoundary(
            candidate,
            context.pilotResults,
            linkedProgramKey,
          ),
      );
      assert(
        supportsAlias === true,
        `Accepted alias ${review.alias} fails cross-program leakage: every approved program link to ${review.occupationId} requires an accepted program-output boundary.`,
      );
    }
  }
}

function assertUniqueNormalizedAliases(
  acceptedReviews: readonly AcceptedAliasReview[],
  context: AliasPassValidationContext,
): void {
  const seen = new Map<string, string>();
  for (const alias of context.aliases) {
    seen.set(normalizeMatcherAlias(alias.alias), alias.occupationId);
  }
  for (const review of acceptedReviews) {
    const normalized = normalizeMatcherAlias(review.alias);
    assert(
      normalized.split(" ").length >= 2,
      `Accepted alias ${review.alias} violates the unchanged multiword matcher policy.`,
    );
    const previousOccupation = seen.get(normalized);
    assert(
      previousOccupation === undefined,
      `Accepted alias ${review.alias} has a normalized collision with ${previousOccupation}.`,
    );
    seen.set(normalized, review.occupationId);
  }
}

function assertUniqueAuditAliasIdentities(
  allReviews: readonly {
    programKey: string;
    review: ProgramOfficialAliasReview["reviews"][number];
  }[],
  context: AliasPassValidationContext,
): void {
  const grouped = new Map<string, Array<(typeof allReviews)[number]>>();
  for (const item of allReviews) {
    const normalized = normalizeMatcherAlias(item.review.alias);
    const group = grouped.get(normalized) ?? [];
    group.push(item);
    grouped.set(normalized, group);
  }
  for (const group of grouped.values()) {
    const normalizedAlias = normalizeMatcherAlias(group[0]!.review.alias);
    assert(
      !context.aliases.some(
        (alias) => normalizeMatcherAlias(alias.alias) === normalizedAlias,
      ),
      `Duplicate normalized alias review: ${group[0]!.review.alias}.`,
    );
    if (group.length === 1) continue;
    assert(
      group.every(({ review }) => review.disposition === "accepted"),
      `Duplicate normalized alias review: ${group[0]!.review.alias}.`,
    );
    coalesceAcceptedAliasSupports(group as readonly AcceptedAliasSupport[]);
  }
}

function overlayAcceptedAliases(
  context: AliasPassValidationContext,
  acceptedReviews: readonly AcceptedAliasReview[],
): OccupationAlias[] {
  const additions = acceptedReviews.map((review) => ({
    alias: review.alias,
    occupationId: review.occupationId,
    reviewStatus: "approved" as const,
    reviewedAt: review.reviewedAt,
    mappingVersion: "1.0.0",
  }));
  return [...context.aliases, ...additions].sort((left, right) =>
    stableCompare(canonicalAliasIdentity(left), canonicalAliasIdentity(right)),
  );
}

export function computeFpOfficialAliasPass(
  context: AliasPassValidationContext,
): FpOfficialAliasPassResults {
  assert(
    context.baselineSnapshotId === BASELINE_SNAPSHOT_ID,
    `Alias pass requires retained baseline snapshot ${BASELINE_SNAPSHOT_ID}.`,
  );
  const validatedReviews = context.reviews
    .map((review) => validateProgramOfficialAliasReview(review, context))
    .sort((left, right) => stableCompare(left.programKey, right.programKey));
  const reviewsByProgram = new Map(
    validatedReviews.map((review) => [review.programKey, review]),
  );
  assert(
    reviewsByProgram.size === TARGET_ALIAS_PROGRAMS.length &&
      TARGET_ALIAS_PROGRAMS.every((programKey) =>
        reviewsByProgram.has(programKey),
      ),
    "Alias pass requires exactly one audit for every target program.",
  );

  const allReviews = validatedReviews.flatMap((programReview) =>
    programReview.reviews.map((review) => ({
      programKey: programReview.programKey,
      review,
    })),
  );
  const acceptedSupports = allReviews.filter(
    (item): item is AcceptedAliasSupport =>
      item.review.disposition === "accepted",
  );
  const rejectedReviews = allReviews.filter(
    ({ review }) => review.disposition === "rejected",
  );
  assertUniqueAuditAliasIdentities(allReviews, context);
  const acceptedReviews = coalesceAcceptedAliasSupports(acceptedSupports);
  assertUniqueNormalizedAliases(acceptedReviews, context);
  assertGlobalAliasSafety(acceptedSupports, reviewsByProgram, context);

  const afterAliases = overlayAcceptedAliases(context, acceptedReviews);
  const programMatches = new Map(
    allApprovedProgramKeys(context).map((programKey) => [
      programKey,
      {
        before: matchProgram(programKey, context, context.aliases),
        after: matchProgram(programKey, context, afterAliases),
      },
    ]),
  );
  const programs = TARGET_ALIAS_PROGRAMS.map((programKey) => {
    const matches = programMatches.get(programKey);
    assert(
      matches !== undefined,
      `Target program ${programKey} has no approved link.`,
    );
    assert(
      matches.before.length === 0,
      `Baseline offer count for ${programKey} must remain exactly zero.`,
    );
    const newlyReachedOfferIds = matches.after
      .map((match) => match.offerId)
      .filter(
        (offerId) => !matches.before.some((match) => match.offerId === offerId),
      )
      .sort(stableCompare);
    return {
      programKey,
      beforeOfferCount: 0 as const,
      afterOfferCount: matches.after.length,
      newlyReachedOfferIds,
    };
  });
  for (const [programKey, matches] of programMatches) {
    if (
      TARGET_ALIAS_PROGRAMS.includes(
        programKey as (typeof TARGET_ALIAS_PROGRAMS)[number],
      )
    ) {
      continue;
    }
    assert(
      JSON.stringify(matches.before) === JSON.stringify(matches.after),
      `Accepted aliases create cross-program leakage for ${programKey}.`,
    );
  }
  const newlyReachedOfferUnionIds = [
    ...new Set(programs.flatMap((program) => program.newlyReachedOfferIds)),
  ].sort(stableCompare);
  return FpOfficialAliasPassResultsSchema.parse({
    schemaVersion: "1.0.0",
    baselineSnapshotId: BASELINE_SNAPSHOT_ID,
    acceptedAliasCount: acceptedReviews.length,
    rejectedAliasCount: rejectedReviews.length,
    programs,
    newlyReachedOfferUnionCount: newlyReachedOfferUnionIds.length,
    newlyReachedOfferUnionIds,
    nonTargetProgramDeltas: [],
  });
}

export async function loadAliasPassValidationContext(
  rootDirectory = process.cwd(),
): Promise<AliasPassValidationContext> {
  const [
    pilotResults,
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    ...reviews
  ] = await Promise.all([
    validateFpCoveragePilotResultsFile(rootDirectory),
    readPinnedBaselineResource(rootDirectory, "programs"),
    readPinnedBaselineResource(rootDirectory, "occupations"),
    readPinnedBaselineResource(rootDirectory, "aliases"),
    readPinnedBaselineResource(rootDirectory, "links"),
    readPinnedBaselineResource(rootDirectory, "offers"),
    readPinnedBaselineResource(rootDirectory, "publishedRequirements"),
    ...TARGET_ALIAS_PROGRAMS.map((programKey) =>
      readJson(
        resolve(rootDirectory, ...AUDIT_DIRECTORY, `${programKey}.json`),
      ),
    ),
  ]);
  return {
    baselineSnapshotId: BASELINE_SNAPSHOT_ID,
    reviews: reviews.map((review) =>
      ProgramOfficialAliasReviewSchema.parse(review),
    ),
    pilotResults,
    programs: z.array(TrainingProgramSchema).parse(programs),
    occupations: OccupationsSchema.parse(occupations),
    aliases: OccupationAliasesSchema.parse(aliases),
    links: TrainingOccupationLinksSchema.parse(links),
    offers: z.array(JobOfferSchema).parse(offers),
    publishedRequirements: PublishedRequirementsResourceSchema.parse(
      publishedRequirements,
    ),
  };
}

export function serializeFpOfficialAliasPassResults(
  value: FpOfficialAliasPassResults,
): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function parseAliasPassCliArguments(arguments_: readonly string[]): {
  writeResults: boolean;
} {
  assert(
    arguments_.length === 0 ||
      (arguments_.length === 1 && arguments_[0] === "--write-results"),
    "Usage: tsx scripts/analysis/validateFpOfficialAliasPass.ts [--write-results]",
  );
  return { writeResults: arguments_[0] === "--write-results" };
}

export async function writeFpOfficialAliasPassResults(
  outputPath: string,
  results: FpOfficialAliasPassResults,
): Promise<void> {
  await writeFile(
    outputPath,
    serializeFpOfficialAliasPassResults(results),
    "utf8",
  );
}

export async function validateFpOfficialAliasPassFromDisk(
  rootDirectory = process.cwd(),
): Promise<FpOfficialAliasPassResults> {
  return computeFpOfficialAliasPass(
    await loadAliasPassValidationContext(rootDirectory),
  );
}

async function runCli(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const { writeResults } = parseAliasPassCliArguments(arguments_);
  const results = await validateFpOfficialAliasPassFromDisk();
  if (writeResults) {
    await writeFpOfficialAliasPassResults(
      resolve(process.cwd(), "analysis", "fp_official_alias_pass_results.json"),
      results,
    );
  }
  console.info("FP official alias pass satisfies the validation contract.");
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    await runCli();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
