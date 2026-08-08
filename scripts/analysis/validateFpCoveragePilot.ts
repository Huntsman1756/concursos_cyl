import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

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

const OfficialRelationshipSchema = z
  .object({
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    relationshipType: z.enum(["official_output", "reviewed_relationship"]),
    reasonCode: z.enum([
      "official_programme_output",
      "officially_reviewed_relationship",
    ]),
    sourceUrl: z.string().url(),
    reviewedAt: z.string().date(),
  })
  .strict();

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
    sourceUrl: z.string().url(),
    reviewedAt: z.string().date(),
  })
  .strict();

const StateTransitionSchema = z
  .object({
    from: PilotStateSchema,
    to: PilotStateSchema,
    at: z.string().datetime(),
  })
  .strict();

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
    snapshotCoverage: z
      .object({
        snapshotId: z.string().trim().min(1),
        countingMethod: z.literal("accepted_relationship_union"),
        newlyReachedOfferCount: z.number().int().min(0),
      })
      .strict()
      .optional(),
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
export type FpCoveragePilotResults = z.infer<typeof PilotResultsSchema>;

function isPrimaryOfficialSource(value: string): boolean {
  const hostname = new URL(value).hostname.toLocaleLowerCase("en-US");
  return ["boe.es", "todofp.es", "ine.es", "sepe.es", "jcyl.es"].some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
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

function assertOfficialRelationships(attempt: PilotAttempt): void {
  for (const relationship of [
    ...attempt.acceptedRelationships,
    ...attempt.rejectedRelationships,
  ]) {
    assert(
      isPrimaryOfficialSource(relationship.sourceUrl),
      `Relationship evidence for ${attempt.programKey} must use an official source.`,
    );
  }

  const identities = [
    ...attempt.acceptedRelationships.map(
      (relationship) =>
        `${relationship.occupationId}:${relationship.relationshipType}`,
    ),
    ...attempt.rejectedRelationships.map(
      (relationship) => `${relationship.occupationId}:rejected`,
    ),
  ];
  assert(
    new Set(identities).size === identities.length,
    `Duplicate relationship evidence for ${attempt.programKey}.`,
  );
}

function assertAttemptState(attempt: PilotAttempt): void {
  assertOfficialRelationships(attempt);

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
    return;
  }

  assert(
    attempt.acceptedRelationships.length === 0 &&
      attempt.snapshotCoverage === undefined &&
      (attempt.ambiguityReasonCodes?.length ?? 0) > 0,
    `${attempt.state} attempt ${attempt.programKey} requires coded ambiguity reasons and no published coverage.`,
  );
}

export function validateFpCoveragePilotResults(
  candidate: unknown,
): FpCoveragePilotResults {
  const results = PilotResultsSchema.parse(candidate);
  assertExactProgramSet(results.attempts);
  results.attempts.forEach(assertAttemptState);
  return results;
}

export async function validateFpCoveragePilotResultsFile(
  rootDirectory = process.cwd(),
): Promise<FpCoveragePilotResults> {
  const path = resolve(
    rootDirectory,
    "analysis",
    "fp_coverage_pilot_results.json",
  );
  return validateFpCoveragePilotResults(
    JSON.parse(await readFile(path, "utf8")),
  );
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
