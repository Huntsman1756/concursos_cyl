import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingProgramSchema,
  type GeneratedManifest,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import {
  PublishedRequirementsResourceSchema,
  type OfferPublishedRequirements,
} from "../../src/domain/requirements";

const PilotStateSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "deferred",
  "discarded",
]);

const PhaseMinutesSchema = z
  .object({
    research: z.number().int().min(0, "Phase minutes must be non-negative."),
    implementation: z
      .number()
      .int()
      .min(0, "Phase minutes must be non-negative."),
    test: z.number().int().min(0, "Phase minutes must be non-negative."),
    review: z.number().int().min(0, "Phase minutes must be non-negative."),
  })
  .strict();

const EvidenceSchema = {
  sourceUrl: z.string().url(),
  sourceQuote: z.string().trim().min(12).max(280),
  reviewedAt: z.string().date(),
} as const;

const OfficialRelationshipSchema = z
  .object({
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    relationshipType: z.enum(["official_output", "reviewed_relationship"]),
    reasonCode: z.enum([
      "official_programme_output",
      "officially_reviewed_relationship",
    ]),
    ...EvidenceSchema,
  })
  .strict()
  .superRefine((relationship, context) => {
    const expectedReasonCode =
      relationship.relationshipType === "official_output"
        ? "official_programme_output"
        : "officially_reviewed_relationship";
    if (relationship.reasonCode !== expectedReasonCode) {
      context.addIssue({
        code: "custom",
        path: ["reasonCode"],
        message: "Accepted relationship type and reason code must agree.",
      });
    }
  });

const RejectedRelationshipSchema = z
  .object({
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    reasonCode: z.enum([
      "official_evidence_absent",
      "official_evidence_indirect",
      "official_evidence_conflicts",
      "out_of_scope_regulated_role",
      "duplicate_relationship",
    ]),
    ...EvidenceSchema,
  })
  .strict();

const StateTransitionSchema = z
  .object({
    from: PilotStateSchema,
    to: PilotStateSchema,
    at: z.string().datetime(),
  })
  .strict();

const SnapshotCoverageSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("verified"),
      snapshotId: z.string().trim().min(1),
      countingMethod: z.literal("accepted_relationship_union"),
      newlyReachedOfferCount: z.number().int().min(0),
    })
    .strict(),
  z
    .object({
      status: z.literal("unavailable"),
      snapshotId: z.string().trim().min(1),
      limitationCode: z.literal("accepted_relationships_not_in_snapshot"),
    })
    .strict(),
]);

const PilotAttemptSchema = z
  .object({
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    familyName: z.string().min(1),
    plannedStratum: z.enum(["easy", "medium", "ambiguous"]),
    state: PilotStateSchema,
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    stateTransitions: z.array(StateTransitionSchema),
    phaseMinutes: PhaseMinutesSchema.optional(),
    acceptedRelationships: z.array(OfficialRelationshipSchema),
    rejectedRelationships: z.array(RejectedRelationshipSchema),
    ambiguityReasonCodes: z
      .array(
        z.enum([
          "official_evidence_absent",
          "official_evidence_indirect",
          "official_evidence_conflicts",
          "multiple_official_interpretations",
          "regulated_role_boundary",
        ]),
      )
      .optional(),
    ambiguityNotes: z.string().trim().min(1).optional(),
    snapshotCoverage: SnapshotCoverageSchema.optional(),
  })
  .strict();

const PilotResultsSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    attempts: z.array(PilotAttemptSchema),
  })
  .strict();

const expectedPrograms = [
  {
    programKey: "SAN21",
    programTitle: "Cuidados Auxiliares de Enfermería",
    familyName: "Sanidad",
    plannedStratum: "easy",
  },
  {
    programKey: "HOT01M",
    programTitle: "Cocina y Gastronomía",
    familyName: "Hostelería y Turismo",
    plannedStratum: "easy",
  },
  {
    programKey: "SSC01M",
    programTitle: "Atención a Personas en Situación de Dependencia",
    familyName: "Servicios Socioculturales y a la Comunidad",
    plannedStratum: "medium",
  },
  {
    programKey: "EOC01M",
    programTitle: "Construcción",
    familyName: "Edificación y Obra Civil",
    plannedStratum: "medium",
  },
  {
    programKey: "COM01M",
    programTitle: "Actividades Comerciales",
    familyName: "Comercio y Marketing",
    plannedStratum: "ambiguous",
  },
] as const;

type PilotAttempt = z.infer<typeof PilotAttemptSchema>;
type SnapshotCoverage = z.infer<typeof SnapshotCoverageSchema>;
export type FpCoveragePilotResults = z.infer<typeof PilotResultsSchema>;

export interface FpCoveragePilotValidationContext {
  snapshotId: string;
  programs: readonly TrainingProgram[];
  canonicalOccupations: readonly Occupation[];
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
  offers: readonly JobOffer[];
  publishedRequirements: readonly OfferPublishedRequirements[];
  snapshotsById: ReadonlyMap<string, SnapshotValidationContext>;
}

interface SnapshotValidationContext {
  snapshotId: string;
  programs: readonly TrainingProgram[];
  canonicalOccupations: readonly Occupation[];
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
  offers: readonly JobOffer[];
  publishedRequirements: readonly OfferPublishedRequirements[];
}

export interface FpCoveragePilotValidationOptions {
  now?: () => Date;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isPrimaryOfficialSource(value: string): boolean {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    /(?:^|[/._-])(example|placeholder|todo)(?:$|[/._-])/iu.test(url.pathname)
  ) {
    return false;
  }
  const hostname = url.hostname.toLocaleLowerCase("en-US");
  return ["boe.es", "todofp.es", "ine.es", "sepe.es", "jcyl.es"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function assertAuditableEvidence(
  evidence: Pick<
    PilotAttempt["acceptedRelationships"][number],
    "sourceUrl" | "sourceQuote"
  >,
  programKey: string,
): void {
  assert(
    isPrimaryOfficialSource(evidence.sourceUrl) &&
      !/\b(example|placeholder|todo)\b/iu.test(evidence.sourceQuote),
    `Relationship evidence for ${programKey} must be an HTTPS official document with an exact auditable quote.`,
  );
}

function assertExactProgramSet(attempts: readonly PilotAttempt[]): void {
  const attemptsByKey = new Map(
    attempts.map((attempt) => [attempt.programKey, attempt]),
  );
  assert(
    attemptsByKey.size === expectedPrograms.length &&
      attempts.length === expectedPrograms.length &&
      expectedPrograms.every((program) =>
        attemptsByKey.has(program.programKey),
      ),
    "Pilot results must contain exactly one attempt for each required program key.",
  );

  for (const expected of expectedPrograms) {
    const actual = attemptsByKey.get(expected.programKey)!;
    assert(
      actual.programTitle === expected.programTitle &&
        actual.familyName === expected.familyName &&
        actual.plannedStratum === expected.plannedStratum,
      `Pilot metadata does not match the fixed definition for ${expected.programKey}.`,
    );
  }
}

function assertExactTransitions(
  attempt: PilotAttempt,
  expected: readonly [string, string][],
): void {
  assert(
    attempt.stateTransitions.length === expected.length &&
      attempt.stateTransitions.every(
        (transition, index) =>
          transition.from === expected[index]![0] &&
          transition.to === expected[index]![1],
      ),
    `Illegal state transition history for ${attempt.programKey}.`,
  );
}

function assertRelationshipCatalogIntegrity(
  attempt: PilotAttempt,
  context: FpCoveragePilotValidationContext,
): void {
  const occupationsById = new Map(
    context.canonicalOccupations.map((occupation) => [
      occupation.occupationId,
      occupation,
    ]),
  );
  const dispositions = new Set<string>();

  for (const relationship of attempt.acceptedRelationships) {
    const occupation = occupationsById.get(relationship.occupationId);
    assert(
      occupation?.reviewStatus === "approved",
      `Accepted relationship for ${attempt.programKey} must reference an approved canonical occupation.`,
    );
    assert(
      !dispositions.has(relationship.occupationId),
      `Each occupation may have only one disposition for ${attempt.programKey}.`,
    );
    dispositions.add(relationship.occupationId);
    assertAuditableEvidence(relationship, attempt.programKey);
  }

  for (const relationship of attempt.rejectedRelationships) {
    assert(
      occupationsById.has(relationship.occupationId),
      `Rejected relationship for ${attempt.programKey} must reference a canonical occupation.`,
    );
    assert(
      !dispositions.has(relationship.occupationId),
      `Each occupation may have only one disposition for ${attempt.programKey}.`,
    );
    dispositions.add(relationship.occupationId);
    assertAuditableEvidence(relationship, attempt.programKey);
  }
}

function phaseTotalMinutes(
  phaseMinutes: NonNullable<PilotAttempt["phaseMinutes"]>,
): number {
  return (
    phaseMinutes.research +
    phaseMinutes.implementation +
    phaseMinutes.test +
    phaseMinutes.review
  );
}

function assertTiming(attempt: PilotAttempt, now: Date): void {
  const transitionTimes = attempt.stateTransitions.map(({ at }) =>
    Date.parse(at),
  );
  assert(
    transitionTimes.every((at) => at <= now.getTime()),
    `Attempt ${attempt.programKey} contains a future transition.`,
  );
  assert(
    transitionTimes.every(
      (at, index) => index === 0 || at >= transitionTimes[index - 1]!,
    ),
    `Attempt ${attempt.programKey} has non-chronological state transitions.`,
  );

  if (attempt.state === "not_started") return;
  const startedAt = attempt.startedAt!;
  const endAt = attempt.completedAt ?? now.toISOString();
  const reviewedAtValues = [
    ...attempt.acceptedRelationships,
    ...attempt.rejectedRelationships,
  ].map((relationship) => relationship.reviewedAt);
  assert(
    reviewedAtValues.every(
      (reviewedAt) =>
        reviewedAt >= startedAt.slice(0, 10) &&
        reviewedAt <= endAt.slice(0, 10),
    ),
    `Relationship review dates for ${attempt.programKey} must fall within the attempt window.`,
  );

  if (attempt.phaseMinutes !== undefined) {
    const elapsedMinutes = (Date.parse(endAt) - Date.parse(startedAt)) / 60_000;
    assert(
      phaseTotalMinutes(attempt.phaseMinutes) <= elapsedMinutes,
      `Phase minutes for ${attempt.programKey} exceed the elapsed attempt interval.`,
    );
  }
}

function sameSnapshotRelationship(
  attempt: PilotAttempt,
  relationship: PilotAttempt["acceptedRelationships"][number],
  link: TrainingOccupationLink,
): boolean {
  return (
    link.reviewStatus === "approved" &&
    link.trainingProgramKey === attempt.programKey &&
    link.occupationId === relationship.occupationId &&
    link.relationshipType === relationship.relationshipType &&
    link.sourceUrl === relationship.sourceUrl &&
    link.sourceQuote === relationship.sourceQuote &&
    link.reviewedAt === relationship.reviewedAt
  );
}

function assertSnapshotCoverage(
  attempt: PilotAttempt,
  coverage: SnapshotCoverage,
  context: FpCoveragePilotValidationContext,
): void {
  const snapshotContext = context.snapshotsById.get(coverage.snapshotId);
  assert(
    snapshotContext !== undefined,
    `Snapshot provenance for ${attempt.programKey} must resolve to a retained immutable snapshot.`,
  );
  const acceptedLinks = attempt.acceptedRelationships.map((relationship) =>
    snapshotContext.links.find((link) =>
      sameSnapshotRelationship(attempt, relationship, link),
    ),
  );
  const hasEveryAcceptedLink = acceptedLinks.every(
    (link) => link !== undefined,
  );

  if (coverage.status === "unavailable") {
    assert(
      !hasEveryAcceptedLink,
      `Snapshot coverage for ${attempt.programKey} is available and must be deterministically counted.`,
    );
    return;
  }

  assert(
    hasEveryAcceptedLink,
    `Claimed snapshot coverage for ${attempt.programKey} has relationships absent from the named snapshot.`,
  );
  const acceptedSnapshotLinks = new Set(acceptedLinks);
  const matches = matchOffersForProgram(attempt.programKey, {
    programs: snapshotContext.programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations: snapshotContext.occupations,
    aliases: snapshotContext.aliases,
    links: snapshotContext.links.filter(
      (link) =>
        link.trainingProgramKey !== attempt.programKey ||
        acceptedSnapshotLinks.has(link),
    ),
    offers: snapshotContext.offers,
    publishedRequirements: snapshotContext.publishedRequirements,
    humanOverrides: [],
  });
  assert(
    coverage.newlyReachedOfferCount === matches.length,
    `Claimed snapshot coverage for ${attempt.programKey} does not match the accepted-relationship union.`,
  );
}

function assertAttemptState(
  attempt: PilotAttempt,
  context: FpCoveragePilotValidationContext,
  now: Date,
): void {
  assertRelationshipCatalogIntegrity(attempt, context);

  if (attempt.state === "not_started") {
    assertExactTransitions(attempt, []);
    assert(
      attempt.startedAt === undefined &&
        attempt.completedAt === undefined &&
        attempt.phaseMinutes === undefined &&
        attempt.acceptedRelationships.length === 0 &&
        attempt.rejectedRelationships.length === 0 &&
        attempt.ambiguityReasonCodes === undefined &&
        attempt.ambiguityNotes === undefined &&
        attempt.snapshotCoverage === undefined,
      `not_started attempt ${attempt.programKey} must not contain timing, outcomes, or evidence.`,
    );
    return;
  }

  assert(
    attempt.startedAt !== undefined &&
      attempt.stateTransitions[0]?.at === attempt.startedAt,
    `Attempt ${attempt.programKey} must record startedAt with its in-progress transition.`,
  );
  assertTiming(attempt, now);

  if (attempt.state === "in_progress") {
    assertExactTransitions(attempt, [["not_started", "in_progress"]]);
    assert(
      attempt.completedAt === undefined &&
        attempt.snapshotCoverage === undefined,
      `in_progress attempt ${attempt.programKey} must not contain terminal completion evidence.`,
    );
    return;
  }

  assertExactTransitions(attempt, [
    ["not_started", "in_progress"],
    ["in_progress", attempt.state],
  ]);
  assert(
    attempt.completedAt !== undefined &&
      attempt.phaseMinutes !== undefined &&
      attempt.stateTransitions[1]?.at === attempt.completedAt &&
      Date.parse(attempt.completedAt) >= Date.parse(attempt.startedAt),
    `Terminal attempt ${attempt.programKey} must record completed timing and non-negative phase minutes.`,
  );

  if (attempt.state === "completed") {
    assert(
      attempt.acceptedRelationships.length > 0 &&
        attempt.snapshotCoverage !== undefined,
      `Completed attempt ${attempt.programKey} requires accepted official evidence and snapshot coverage provenance.`,
    );
    assertSnapshotCoverage(attempt, attempt.snapshotCoverage, context);
    return;
  }

  assert(
    attempt.acceptedRelationships.length === 0 &&
      attempt.snapshotCoverage === undefined &&
      (attempt.ambiguityReasonCodes?.length ?? 0) > 0,
    `${attempt.state} attempt ${attempt.programKey} requires coded ambiguity reasons and no published coverage.`,
  );
}

function snapshotIdFromManifest(manifest: GeneratedManifest): string {
  const snapshotIds = Object.values(manifest.resourceSnapshots).map(
    ({ resourcePath }) => {
      const match = /^\/data\/v1\/snapshots\/([a-z\d]+(?:-[a-z\d]+)*)\//u.exec(
        resourcePath,
      );
      assert(
        match !== null,
        "Manifest resource path must identify a snapshot.",
      );
      return match[1]!;
    },
  );
  assert(
    new Set(snapshotIds).size === 1,
    "Current manifest must address one consistent immutable snapshot.",
  );
  return snapshotIds[0]!;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function pilotReferencedCompletedSnapshotIds(candidate: unknown): string[] {
  const results = PilotResultsSchema.parse(candidate);
  return [
    ...new Set(
      results.attempts.flatMap((attempt) =>
        attempt.state === "completed" &&
        attempt.snapshotCoverage?.status === "verified"
          ? [attempt.snapshotCoverage.snapshotId]
          : [],
      ),
    ),
  ];
}

function publicResourcePath(
  rootDirectory: string,
  resourcePath: string,
): string {
  return resolve(
    rootDirectory,
    "public",
    ...resourcePath.split("/").filter(Boolean),
  );
}

function historicalSnapshotResourcePath(
  snapshotId: string,
  fileName: string,
): string {
  assert(
    /^\d{17}-[a-f0-9]{12}$/u.test(snapshotId),
    "Historical snapshot ID is malformed.",
  );
  return `/data/v1/snapshots/${snapshotId}/${fileName}`;
}

async function loadSnapshotValidationContext(
  rootDirectory: string,
  snapshotId: string,
  resourcePaths: {
    programs: string;
    occupations: string;
    occupationAliases: string;
    trainingOccupationLinks: string;
    jobOffers: string;
    publishedRequirements: string;
  },
): Promise<SnapshotValidationContext> {
  const [
    canonicalOccupations,
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
  ] = await Promise.all([
    readJson(resolve(rootDirectory, "data", "curated", "occupations.json")),
    readJson(publicResourcePath(rootDirectory, resourcePaths.programs)),
    readJson(publicResourcePath(rootDirectory, resourcePaths.occupations)),
    readJson(
      publicResourcePath(rootDirectory, resourcePaths.occupationAliases),
    ),
    readJson(
      publicResourcePath(rootDirectory, resourcePaths.trainingOccupationLinks),
    ),
    readJson(publicResourcePath(rootDirectory, resourcePaths.jobOffers)),
    readJson(
      publicResourcePath(rootDirectory, resourcePaths.publishedRequirements),
    ),
  ]);
  return {
    snapshotId,
    canonicalOccupations: OccupationsSchema.parse(canonicalOccupations),
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

export async function loadFpCoveragePilotValidationContext(
  rootDirectory = process.cwd(),
): Promise<FpCoveragePilotValidationContext> {
  const manifest = GeneratedManifestSchema.parse(
    await readJson(
      resolve(rootDirectory, "public", "data", "v1", "manifest.json"),
    ),
  );
  const snapshots = manifest.resourceSnapshots;
  const snapshotId = snapshotIdFromManifest(manifest);
  const candidate = await readJson(
    resolve(rootDirectory, "analysis", "fp_coverage_pilot_results.json"),
  );
  const historicalSnapshotIds = pilotReferencedCompletedSnapshotIds(candidate);
  const current = await loadSnapshotValidationContext(
    rootDirectory,
    snapshotId,
    {
      programs: snapshots.programs.resourcePath,
      occupations: snapshots.occupations.resourcePath,
      occupationAliases: snapshots.occupationAliases.resourcePath,
      trainingOccupationLinks: snapshots.trainingOccupationLinks.resourcePath,
      jobOffers: snapshots.jobOffers.resourcePath,
      publishedRequirements: snapshots.publishedRequirements.resourcePath,
    },
  );
  const historical = await Promise.all(
    historicalSnapshotIds
      .filter((historicalSnapshotId) => historicalSnapshotId !== snapshotId)
      .map((historicalSnapshotId) =>
        loadSnapshotValidationContext(rootDirectory, historicalSnapshotId, {
          programs: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "programs.json",
          ),
          occupations: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "occupations.json",
          ),
          occupationAliases: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "occupation-aliases.json",
          ),
          trainingOccupationLinks: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "training-occupation-links.json",
          ),
          jobOffers: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "job-offers.json",
          ),
          publishedRequirements: historicalSnapshotResourcePath(
            historicalSnapshotId,
            "published-requirements.json",
          ),
        }),
      ),
  );
  return {
    ...current,
    snapshotsById: new Map(
      [current, ...historical].map((snapshot) => [
        snapshot.snapshotId,
        snapshot,
      ]),
    ),
  };
}

export function validateFpCoveragePilotResults(
  candidate: unknown,
  context: FpCoveragePilotValidationContext,
  options: FpCoveragePilotValidationOptions = {},
): FpCoveragePilotResults {
  const results = PilotResultsSchema.parse(candidate);
  const now = options.now?.() ?? new Date();
  assert(
    !Number.isNaN(now.getTime()),
    "Validation clock must return a valid date.",
  );
  assertExactProgramSet(results.attempts);
  results.attempts.forEach((attempt) =>
    assertAttemptState(attempt, context, now),
  );
  return results;
}

export async function validateFpCoveragePilotResultsFile(
  rootDirectory = process.cwd(),
  options: FpCoveragePilotValidationOptions = {},
): Promise<FpCoveragePilotResults> {
  const [candidate, context] = await Promise.all([
    readJson(
      resolve(rootDirectory, "analysis", "fp_coverage_pilot_results.json"),
    ),
    loadFpCoveragePilotValidationContext(rootDirectory),
  ]);
  return validateFpCoveragePilotResults(candidate, context, options);
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  try {
    await validateFpCoveragePilotResultsFile();
    console.info("FP coverage pilot results satisfy the measurement contract.");
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
