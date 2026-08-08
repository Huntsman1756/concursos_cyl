import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

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
  sourceQuote: z
    .string()
    .trim()
    .min(10, "Source quote must contain at least 10 characters.")
    .max(280),
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

const CandidateClassificationEvidenceSchema = z
  .object({
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    ...EvidenceSchema,
  })
  .strict();

const ProfessionalOutputReviewSchema = z
  .object({
    officialOutputLabel: z.string().trim().min(3).max(220),
    disposition: z.enum(["accepted", "rejected"]),
    candidateOccupationIds: z
      .array(z.string().regex(/^occupation:cno11:\d{4}$/u))
      .min(1),
    acceptedOccupationIds: z
      .array(z.string().regex(/^occupation:cno11:\d{4}$/u))
      .min(1)
      .optional(),
    reasonCode: z.enum([
      "official_programme_output",
      "officially_reviewed_relationship",
      "official_evidence_absent",
      "official_evidence_indirect",
      "official_evidence_conflicts",
      "out_of_scope_regulated_role",
      "duplicate_relationship",
    ]),
    groupingExplanation: z.string().trim().min(20).max(500),
    ...EvidenceSchema,
    // TodoFP's exact one-output quote can be the nine-character `Cocinero.`.
    // It is validated against the canonical output label below, rather than the
    // generic evidence threshold used for citations and relationships.
    sourceQuote: z.string().trim().min(3).max(280),
    classificationEvidence: z
      .union([
        z.object(EvidenceSchema).strict(),
        z.array(CandidateClassificationEvidenceSchema).min(1),
      ])
      .optional(),
  })
  .strict()
  .superRefine((review, context) => {
    const acceptedReasonCodes = new Set([
      "official_programme_output",
      "officially_reviewed_relationship",
    ]);
    if (review.disposition === "accepted") {
      if (
        review.acceptedOccupationIds === undefined ||
        review.acceptedOccupationIds.length !==
          review.candidateOccupationIds.length ||
        review.acceptedOccupationIds.some(
          (occupationId, index) =>
            occupationId !== review.candidateOccupationIds[index],
        ) ||
        !acceptedReasonCodes.has(review.reasonCode)
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Accepted professional-output reviews require every candidate to be accepted in order and an accepted reason code.",
        });
      }
      return;
    }
    if (
      review.acceptedOccupationIds !== undefined ||
      acceptedReasonCodes.has(review.reasonCode)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Rejected professional-output reviews cannot accept occupations or use accepted reason codes.",
      });
    }
  });

const ProgrammeProfileEvidenceSchema = z
  .object({
    todoFp: z.object(EvidenceSchema).strict(),
    authoritativeOutputSource: z.object(EvidenceSchema).strict(),
    reconciliationNote: z.string().trim().min(20).max(500),
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

const ReviewedCommitTimingSchema = z
  .object({
    programKey: z.string().min(1),
    reviewedCommit: z.string().regex(/^[a-f0-9]{40}$/u),
    reviewedCommitAt: z.string().datetime(),
    upperCompletionBoundAt: z.string().datetime(),
  })
  .strict();

const PilotAggregationSchema = z
  .object({
    aggregatedAt: z.string().datetime(),
    timingProvenance: z.array(ReviewedCommitTimingSchema),
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
    programmeProfileEvidence: ProgrammeProfileEvidenceSchema.optional(),
    professionalOutputReviews: z
      .array(ProfessionalOutputReviewSchema)
      .optional(),
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
    aggregation: PilotAggregationSchema.optional(),
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

const SSC01M_OFFICIAL_OUTPUT_LABELS = [
  "Cuidador o cuidadora de personas en situación de dependencia en diferentes instituciones y/o domicilios.",
  "Cuidador o cuidadora en centros de atención psiquiátrica.",
  "Gerocultor o gerocultora.",
  "Gobernante y subgobernante de personas en situación de dependencia en instituciones.",
  "Auxiliar responsable de planta de residencias de mayores y personas con discapacidad.",
  "Auxiliar de ayuda a domicilio.",
  "Asistente de atención domiciliaria.",
  "Trabajador o trabajadora familiar.",
  "Auxiliar de educación especial.",
  "Asistente personal.",
  "Teleoperador/a de teleasistencia.",
] as const;

const SAN21_TODOFP_SOURCE_URL =
  "https://todofp.es/dam/jcr%3Aaf5b68fd-e75c-493b-94ff-0565d3886473/san21cuidauxilenfermeria-pdf.pdf";
const SAN21_OFFICIAL_OUTPUT_LABELS = [
  "Auxiliar de Enfermería/Clínica..",
  "Auxiliar de Balnearios.",
  "Auxiliar de Atención primaria.",
  "Cuidados de enfermería a domicilio.",
  "Auxiliar Bucodental.",
  "Auxiliar Geriátrico.",
  "Auxiliar Pediátrico.",
  "Auxiliar de Esterilización.",
  "Auxiliar de Unidades Especiales.",
  "Auxiliar de Salud Mental.",
] as const;
const HOT01M_TODOFP_SOURCE_URL =
  "https://todofp.es/dam/jcr%3A63392ee9-4d38-449b-a196-d0efb714b364/n-tcocinagastronomiaes-pdf.pdf";
const HOT01M_OFFICIAL_OUTPUT_LABELS = [
  "Cocinero.",
  "Jefe de partida.",
  "Empleado de economato de unidades de producción y servicio de alimentos y bebidas.",
] as const;
const INE_CNO_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";
const TODOFP_OUTPUT_AUDITS = {
  SAN21: {
    sourceUrl: SAN21_TODOFP_SOURCE_URL,
    programmeQuote: "TÉCNICO EN CUIDADOS AUXILIARES DE ENFERMERÍA",
    outputHeadingQuote:
      "EMPLEOS QUE PUEDE DESEMPEÑAR LA PERSONA PORTADORA DE ESTE TÍTULO",
    outputLabels: SAN21_OFFICIAL_OUTPUT_LABELS,
    classificationQuotes: {
      "occupation:cno11:5611": "5611 Auxiliares de enfermería hospitalaria",
      "occupation:cno11:5612":
        "5612 Auxiliares de enfermería de atención primaria",
      "occupation:cno11:5629":
        "5629 Trabajadores de los cuidados a las personas en servicios de salud no clasificados bajo otros epígrafes",
      "occupation:cno11:5710":
        "5710 Trabajadores de los cuidados personales a domicilio",
    },
  },
  HOT01M: {
    sourceUrl: HOT01M_TODOFP_SOURCE_URL,
    programmeQuote: "Técnico en Cocina y Gastronomía",
    outputHeadingQuote:
      "Las ocupaciones y puestos de trabajo más relevantes son los siguientes:",
    outputLabels: HOT01M_OFFICIAL_OUTPUT_LABELS,
    classificationQuotes: {
      "occupation:cno11:3734": "3734 Chefs",
      "occupation:cno11:4121":
        "4121 Empleados de control de abastecimientos e inventario",
      "occupation:cno11:5110": "5110 Cocineros asalariados",
      "occupation:cno11:5120": "5120 Camareros asalariados",
      "occupation:cno11:9310": "9310 Ayudantes de cocina",
    },
  },
} as const;

const EOC01M_OFFICIAL_OUTPUT_LABELS = [
  "Jefe de equipo de fábricas de albañilería.",
  "Jefe de equipo de albañiles de urbanización.",
  "Jefe de equipo de encofradores.",
  "Jefe de equipo de ferralla.",
  "Jefe de taller de ferralla.",
  "Jefe de equipo de albañiles de cubiertas.",
  "Jefe de equipo y/o encargado de alicatadores y soladores.",
  "Albañil.",
  "Colocador de ladrillo caravista.",
  "Colocador de bloque prefabricado.",
  "Albañil tabiquero.",
  "Albañil piedra construcción.",
  "Mampostero.",
  "Oficial de miras.",
  "Albañil de urbanización.",
  "Pavimentador con adoquines.",
  "Pavimentador con baldosas y losas.",
  "Pavimentador a base de hormigón.",
  "Pocero en redes de saneamiento.",
  "Encofrador.",
  "Encofrador de edificación.",
  "Encofrador de obra civil.",
  "Ferrallista.",
  "Albañil de cubiertas.",
  "Tejador.",
  "Montador de teja.",
  "Pizarrista.",
  "Colocador de pizarra.",
  "Montador de cubiertas de paneles y chapas.",
  "Aplicador de revestimientos continuos de fachadas.",
  "Alicatador– solador.",
  "Instalador de sistemas de impermeabilización en edificios y obra civil.",
  "Impermeabilizador de terrazas.",
] as const;

const COM01M_OFFICIAL_OUTPUT_LABELS = [
  "Vendedor / vendedora.",
  "Representante comercial.",
  "Promotor / promotora.",
  "Televendedor / televendedora.",
  "Venta a Distancia.",
  "Teleoperador / teleoperadora (Call - Center).",
  "Información/atención al cliente.",
  "Cajera / cajero; reponedor / reponedora.",
  "Operador / operadora de contact-center.",
  "Administrador / administradora de contenidos on-line.",
  "Comerciante de tienda.",
  "Gerente de pequeño comercio.",
  "Técnica / técnico en gestión de stocks y almacén.",
  "Jefa / jefe de almacén.",
  "Responsable de recepción de mercancías.",
  "Responsable de expedición de mercancías.",
  "Técnica / técnico en logística de almacenes.",
  "Técnica / técnico de información/atención al cliente en empresas.",
] as const;
const COM01M_REJECTED_OCCUPATION_IDS = [
  "occupation:cno11:3510",
  "occupation:cno11:3522",
  "occupation:cno11:4121",
  "occupation:cno11:4424",
  "occupation:cno11:5220",
  "occupation:cno11:5420",
  "occupation:cno11:5500",
] as const;
const COM01M_INE_CNO_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";
const COM01M_CLASSIFICATION_QUOTES = {
  "occupation:cno11:3510": "3510 Agentes y representantes comerciales",
  "occupation:cno11:3522": "3522 Agentes de compras",
  "occupation:cno11:4121":
    "4121 Empleados de control de abastecimientos e inventario",
  "occupation:cno11:4424": "4424 Teleoperadores",
  "occupation:cno11:5220": "5220 Vendedores en tiendas y almacenes",
  "occupation:cno11:5420": "5420 Operadores de telemarketing",
  "occupation:cno11:5500": "5500 Cajeros y taquilleros (excepto bancos)",
} as const;

const EOC01M_FAMILY_PILOT_SIGNAL = 42;
const EOC01M_EARLIER_TITLE_SIGNAL = 39;
const TASK_7_AGGREGATION_START = "2026-08-08T20:12:45.4737711Z";

type PilotAttempt = z.infer<typeof PilotAttemptSchema>;
type SnapshotCoverage = z.infer<typeof SnapshotCoverageSchema>;
export type FpCoveragePilotResults = z.infer<typeof PilotResultsSchema>;

export interface FpCoveragePilotSummary {
  terminalCounts: { completed: number; deferred: number; discarded: number };
  modeledActiveWorkMinutes: number;
  marginalOffersReached: number;
  wallClockMinutes: { lower: number; upper: number };
}

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

function gitCommitTimestamp(commit: string): string {
  const output = execFileSync("git", ["show", "-s", "--format=%cI", commit], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
  const instant = new Date(output);
  assert(
    !Number.isNaN(instant.getTime()),
    `Git timestamp for ${commit} is invalid.`,
  );
  return instant.toISOString();
}

function assertAggregation(results: FpCoveragePilotResults): void {
  const aggregation = results.aggregation;
  assert(
    aggregation !== undefined,
    "Terminal pilot results require aggregation timing provenance.",
  );
  assert(
    aggregation.aggregatedAt === TASK_7_AGGREGATION_START,
    "Aggregation start must equal the immutable Task 7 aggregation start.",
  );
  const timingByProgram = new Map(
    aggregation.timingProvenance.map((timing) => [timing.programKey, timing]),
  );
  assert(
    timingByProgram.size === results.attempts.length &&
      results.attempts.every((attempt) =>
        timingByProgram.has(attempt.programKey),
      ),
    "Aggregation timing provenance must contain exactly one row for every pilot attempt.",
  );

  results.attempts.forEach((attempt, index) => {
    const timing = timingByProgram.get(attempt.programKey)!;
    assert(
      attempt.state === "completed" ||
        attempt.state === "deferred" ||
        attempt.state === "discarded",
      `Aggregation requires terminal state for ${attempt.programKey}.`,
    );
    assert(
      attempt.startedAt !== undefined && attempt.phaseMinutes !== undefined,
      `Aggregation requires timing and modeled phase minutes for ${attempt.programKey}.`,
    );
    assert(
      gitCommitTimestamp(timing.reviewedCommit) === timing.reviewedCommitAt,
      `Git timestamp for ${attempt.programKey} does not match reviewed commit provenance.`,
    );
    const startedAt = new Date(attempt.startedAt).getTime();
    const completedAt = new Date(attempt.completedAt!).getTime();
    const reviewedAt = new Date(timing.reviewedCommitAt).getTime();
    const upperBound = new Date(timing.upperCompletionBoundAt).getTime();
    assert(
      startedAt <= completedAt &&
        completedAt <= reviewedAt &&
        reviewedAt <= upperBound,
      `Reviewed commit timing bounds are invalid for ${attempt.programKey}.`,
    );
    const nextAttempt = results.attempts[index + 1];
    const expectedUpperBound =
      nextAttempt?.startedAt ?? aggregation.aggregatedAt;
    assert(
      timing.upperCompletionBoundAt === expectedUpperBound,
      `Upper completion bound for ${attempt.programKey} must be the next attempt start or aggregation start.`,
    );
    const latestFirstParentCommit = execFileSync(
      "git",
      [
        "log",
        "--first-parent",
        "-1",
        "--format=%H",
        `--after=${attempt.startedAt}`,
        `--before=${timing.upperCompletionBoundAt}`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();
    assert(
      latestFirstParentCommit === timing.reviewedCommit,
      `Reviewed commit for ${attempt.programKey} must be the latest first-parent commit in its attempt interval.`,
    );
  });
}

export function summarizeFpCoveragePilotResults(
  results: FpCoveragePilotResults,
): FpCoveragePilotSummary {
  const aggregation = results.aggregation;
  assert(
    aggregation !== undefined,
    "Pilot summary requires aggregation timing provenance.",
  );
  const timingByProgram = new Map(
    aggregation.timingProvenance.map((timing) => [timing.programKey, timing]),
  );
  const terminalCounts = { completed: 0, deferred: 0, discarded: 0 };
  let modeledActiveWorkMinutes = 0;
  let marginalOffersReached = 0;
  let lowerMilliseconds = 0;
  let upperMilliseconds = 0;

  for (const attempt of results.attempts) {
    if (
      attempt.state === "completed" ||
      attempt.state === "deferred" ||
      attempt.state === "discarded"
    ) {
      terminalCounts[attempt.state] += 1;
    }
    modeledActiveWorkMinutes += Object.values(
      attempt.phaseMinutes ?? {},
    ).reduce((total, minutes) => total + minutes, 0);
    if (attempt.snapshotCoverage?.status === "verified") {
      marginalOffersReached += attempt.snapshotCoverage.newlyReachedOfferCount;
    }
    const timing = timingByProgram.get(attempt.programKey)!;
    const startedAt = new Date(attempt.startedAt!).getTime();
    lowerMilliseconds +=
      new Date(timing.reviewedCommitAt).getTime() - startedAt;
    upperMilliseconds +=
      new Date(timing.upperCompletionBoundAt).getTime() - startedAt;
  }

  return {
    terminalCounts,
    modeledActiveWorkMinutes,
    marginalOffersReached,
    wallClockMinutes: {
      lower: lowerMilliseconds / 60_000,
      upper: upperMilliseconds / 60_000,
    },
  };
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

function assertTodoFpProfessionalOutputReviews(attempt: PilotAttempt): void {
  if (
    (attempt.programKey !== "SAN21" && attempt.programKey !== "HOT01M") ||
    attempt.state !== "completed"
  ) {
    return;
  }

  const audit = TODOFP_OUTPUT_AUDITS[attempt.programKey];
  const profileEvidence = attempt.programmeProfileEvidence;
  const reviews = attempt.professionalOutputReviews;
  assert(
    profileEvidence !== undefined && reviews !== undefined,
    `Completed ${attempt.programKey} requires TodoFP programme evidence and an independent review of every official output.`,
  );
  assertAuditableEvidence(profileEvidence.todoFp, attempt.programKey);
  assertAuditableEvidence(
    profileEvidence.authoritativeOutputSource,
    attempt.programKey,
  );
  assert(
    profileEvidence.todoFp.sourceUrl === audit.sourceUrl &&
      profileEvidence.todoFp.sourceQuote === audit.programmeQuote &&
      profileEvidence.authoritativeOutputSource.sourceUrl === audit.sourceUrl &&
      profileEvidence.authoritativeOutputSource.sourceQuote ===
        audit.outputHeadingQuote,
    `${attempt.programKey} programme evidence must preserve the exact TodoFP profile and output heading.`,
  );
  assert(
    reviews.length === audit.outputLabels.length &&
      reviews.every(
        (review, index) =>
          review.officialOutputLabel === audit.outputLabels[index],
      ),
    `${attempt.programKey} must review every official TodoFP output in source order.`,
  );

  const acceptedReviewOccupationIds = new Set<string>();
  const rejectedReviewOccupationIds = new Set<string>();
  for (const review of reviews) {
    assertAuditableEvidence(review, attempt.programKey);
    assert(
      review.sourceUrl === audit.sourceUrl &&
        review.sourceQuote === review.officialOutputLabel,
      `${attempt.programKey} professional-output reviews must preserve one exact contiguous TodoFP output quote.`,
    );
    const classificationEvidence = review.classificationEvidence;
    assert(
      Array.isArray(classificationEvidence) &&
        classificationEvidence.length ===
          review.candidateOccupationIds.length &&
        classificationEvidence.every(
          (evidence, index) =>
            evidence.occupationId === review.candidateOccupationIds[index],
        ),
      `${attempt.programKey} requires aligned classification evidence for every reviewed CNO candidate.`,
    );
    for (const evidence of classificationEvidence) {
      assertAuditableEvidence(evidence, attempt.programKey);
      assert(
        evidence.sourceUrl === INE_CNO_URL &&
          evidence.sourceQuote ===
            audit.classificationQuotes[
              evidence.occupationId as keyof typeof audit.classificationQuotes
            ],
        `${attempt.programKey} classification evidence must cite the exact INE four-digit CNO heading.`,
      );
    }
    if (review.disposition === "accepted") {
      for (const occupationId of review.acceptedOccupationIds ?? []) {
        acceptedReviewOccupationIds.add(occupationId);
      }
    } else {
      for (const occupationId of review.candidateOccupationIds) {
        rejectedReviewOccupationIds.add(occupationId);
      }
    }
  }
  const topLevelAcceptedOccupationIds = new Set(
    attempt.acceptedRelationships.map(
      (relationship) => relationship.occupationId,
    ),
  );
  const expectedRejectedOccupationIds = new Set(
    [...rejectedReviewOccupationIds].filter(
      (occupationId) => !acceptedReviewOccupationIds.has(occupationId),
    ),
  );
  const topLevelRejectedOccupationIds = new Set(
    attempt.rejectedRelationships.map(
      (relationship) => relationship.occupationId,
    ),
  );
  assert(
    topLevelAcceptedOccupationIds.size === acceptedReviewOccupationIds.size &&
      [...topLevelAcceptedOccupationIds].every((occupationId) =>
        acceptedReviewOccupationIds.has(occupationId),
      ),
    `Top-level accepted occupations must exactly equal accepted professional-output review candidates for ${attempt.programKey}.`,
  );
  assert(
    topLevelRejectedOccupationIds.size === expectedRejectedOccupationIds.size &&
      [...topLevelRejectedOccupationIds].every((occupationId) =>
        expectedRejectedOccupationIds.has(occupationId),
      ),
    `Top-level rejected occupations must exactly equal rejected professional-output review candidates excluding accepted candidates for ${attempt.programKey}.`,
  );

  for (const relationship of attempt.acceptedRelationships) {
    assert(
      acceptedReviewOccupationIds.has(relationship.occupationId),
      `Accepted ${attempt.programKey} relationship ${relationship.occupationId} must be accepted by an individual professional-output review.`,
    );
  }
  for (const relationship of attempt.rejectedRelationships) {
    assert(
      rejectedReviewOccupationIds.has(relationship.occupationId),
      `Rejected ${attempt.programKey} relationship ${relationship.occupationId} must be rejected by an individual professional-output review.`,
    );
  }
}

function normalizedWholeLabel(value: string): string {
  return ` ${value
    .normalize("NFKC")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()} `;
}

function assertAcceptedEvidenceExcludesRejectedOutputLabels(
  attempt: PilotAttempt,
): void {
  const rejectedOutputLabels = (attempt.professionalOutputReviews ?? [])
    .filter((review) => review.disposition === "rejected")
    .map((review) => normalizedWholeLabel(review.officialOutputLabel));
  if (rejectedOutputLabels.length === 0) return;

  for (const relationship of attempt.acceptedRelationships) {
    const quote = normalizedWholeLabel(relationship.sourceQuote);
    assert(
      !rejectedOutputLabels.some((label) => quote.includes(label)),
      `Accepted ${attempt.programKey} public evidence must not contain an exact rejected professional output label.`,
    );
  }
}

function assertSsc01mProfessionalOutputReviews(attempt: PilotAttempt): void {
  if (attempt.programKey !== "SSC01M" || attempt.state !== "completed") return;

  const profileEvidence = attempt.programmeProfileEvidence;
  const reviews = attempt.professionalOutputReviews;
  assert(
    profileEvidence !== undefined && reviews !== undefined,
    "Completed SSC01M requires TodoFP programme evidence and an independent review of every official output.",
  );
  assertAuditableEvidence(profileEvidence.todoFp, attempt.programKey);
  assertAuditableEvidence(
    profileEvidence.authoritativeOutputSource,
    attempt.programKey,
  );
  assert(
    new URL(profileEvidence.todoFp.sourceUrl).hostname.endsWith("todofp.es"),
    "SSC01M programme profile evidence must cite TodoFP.",
  );
  assert(
    new URL(
      profileEvidence.authoritativeOutputSource.sourceUrl,
    ).hostname.endsWith("boe.es"),
    "SSC01M complete output evidence must cite BOE.",
  );
  assert(
    reviews.length === SSC01M_OFFICIAL_OUTPUT_LABELS.length &&
      reviews.every(
        (review, index) =>
          review.officialOutputLabel === SSC01M_OFFICIAL_OUTPUT_LABELS[index],
      ),
    "SSC01M must review each of the eleven BOE professional outputs in order.",
  );
  for (const review of reviews) {
    assertAuditableEvidence(review, attempt.programKey);
    assert(
      new URL(review.sourceUrl).hostname.endsWith("boe.es"),
      "SSC01M professional-output reviews must cite the BOE output source.",
    );
  }

  const reviewedCandidates = new Set(
    reviews.flatMap((review) => review.candidateOccupationIds),
  );
  for (const relationship of [
    ...attempt.acceptedRelationships,
    ...attempt.rejectedRelationships,
  ]) {
    assert(
      reviewedCandidates.has(relationship.occupationId),
      `SSC01M disposition ${relationship.occupationId} must be tied to an individual professional-output review.`,
    );
  }
}

function assertEoc01mProfessionalOutputReviews(attempt: PilotAttempt): void {
  if (attempt.programKey !== "EOC01M" || attempt.state !== "completed") return;

  const profileEvidence = attempt.programmeProfileEvidence;
  const reviews = attempt.professionalOutputReviews;
  assert(
    profileEvidence !== undefined && reviews !== undefined,
    "Completed EOC01M requires TodoFP programme evidence and an independent review of every BOE professional output.",
  );
  assertAuditableEvidence(profileEvidence.todoFp, attempt.programKey);
  assertAuditableEvidence(
    profileEvidence.authoritativeOutputSource,
    attempt.programKey,
  );
  assert(
    new URL(profileEvidence.todoFp.sourceUrl).hostname.endsWith("todofp.es"),
    "EOC01M programme profile evidence must cite TodoFP.",
  );
  assert(
    new URL(
      profileEvidence.authoritativeOutputSource.sourceUrl,
    ).hostname.endsWith("boe.es"),
    "EOC01M complete output evidence must cite BOE.",
  );
  assert(
    reviews.length === EOC01M_OFFICIAL_OUTPUT_LABELS.length &&
      reviews.every(
        (review, index) =>
          review.officialOutputLabel === EOC01M_OFFICIAL_OUTPUT_LABELS[index],
      ),
    "EOC01M must review each of the thirty-three BOE professional outputs in order.",
  );
  for (const review of reviews) {
    assertAuditableEvidence(review, attempt.programKey);
    assert(
      new URL(review.sourceUrl).hostname.endsWith("boe.es"),
      "EOC01M professional-output reviews must cite the BOE output source.",
    );
    assert(
      review.sourceQuote === `– ${review.officialOutputLabel}`,
      "EOC01M professional-output reviews must preserve the verbatim BOE output bullet rather than a synthetic or concatenated quote.",
    );
    if (review.disposition === "accepted") {
      const classificationEvidence = review.classificationEvidence;
      assert(
        classificationEvidence !== undefined &&
          !Array.isArray(classificationEvidence),
        "Accepted EOC01M output reviews require independent official classification evidence.",
      );
      assertAuditableEvidence(classificationEvidence, attempt.programKey);
      assert(
        ["ine.es", "sepe.es"].some(
          (domain) =>
            new URL(classificationEvidence.sourceUrl).hostname === domain ||
            new URL(classificationEvidence.sourceUrl).hostname.endsWith(
              `.${domain}`,
            ),
        ),
        "Accepted EOC01M output reviews require INE or SEPE classification evidence.",
      );
    }
  }

  const acceptedReviewOccupationIds = new Set(
    reviews.flatMap((review) =>
      review.disposition === "accepted"
        ? (review.acceptedOccupationIds ?? [])
        : [],
    ),
  );
  const rejectedReviewOccupationIds = new Set(
    reviews.flatMap((review) =>
      review.disposition === "rejected" ? review.candidateOccupationIds : [],
    ),
  );
  for (const relationship of attempt.acceptedRelationships) {
    assert(
      acceptedReviewOccupationIds.has(relationship.occupationId),
      `Accepted EOC01M relationship ${relationship.occupationId} must be accepted by an individual professional-output review.`,
    );
  }
  for (const relationship of attempt.rejectedRelationships) {
    assert(
      rejectedReviewOccupationIds.has(relationship.occupationId) &&
        !acceptedReviewOccupationIds.has(relationship.occupationId),
      `Rejected EOC01M relationship ${relationship.occupationId} must be rejected by an individual professional-output review and must not be accepted elsewhere.`,
    );
  }
}

function assertCom01mProfessionalOutputReviews(attempt: PilotAttempt): void {
  if (
    attempt.programKey !== "COM01M" ||
    attempt.state === "not_started" ||
    attempt.state === "in_progress"
  ) {
    return;
  }

  const profileEvidence = attempt.programmeProfileEvidence;
  const reviews = attempt.professionalOutputReviews;
  assert(
    profileEvidence !== undefined && reviews !== undefined,
    "COM01M requires TodoFP programme evidence and an independent review of every official output.",
  );
  assertAuditableEvidence(profileEvidence.todoFp, attempt.programKey);
  assertAuditableEvidence(
    profileEvidence.authoritativeOutputSource,
    attempt.programKey,
  );
  assert(
    new URL(profileEvidence.todoFp.sourceUrl).hostname.endsWith("todofp.es"),
    "COM01M programme profile evidence must cite TodoFP.",
  );
  assert(
    new URL(
      profileEvidence.authoritativeOutputSource.sourceUrl,
    ).hostname.endsWith("boe.es"),
    "COM01M authoritative output evidence must cite BOE.",
  );
  assert(
    reviews.length === COM01M_OFFICIAL_OUTPUT_LABELS.length &&
      reviews.every(
        (review, index) =>
          review.officialOutputLabel === COM01M_OFFICIAL_OUTPUT_LABELS[index],
      ),
    "COM01M must review each of the eighteen TodoFP professional outputs in order.",
  );
  for (const review of reviews) {
    assertAuditableEvidence(review, attempt.programKey);
    assert(
      new URL(review.sourceUrl).hostname.endsWith("todofp.es"),
      "COM01M professional-output reviews must cite TodoFP.",
    );
    assert(
      review.disposition === "rejected" &&
        review.acceptedOccupationIds === undefined,
      "Deferred COM01M output reviews cannot accept a CNO occupation.",
    );
    assert(
      [
        "official_evidence_absent",
        "official_evidence_indirect",
        "official_evidence_conflicts",
      ].includes(review.reasonCode),
      "Deferred COM01M output reviews must use a rejected-evidence reason code.",
    );
    assert(
      review.sourceQuote === review.officialOutputLabel,
      "COM01M professional-output reviews must quote the exact TodoFP output label.",
    );
    const classificationEvidence = review.classificationEvidence;
    assert(
      Array.isArray(classificationEvidence) &&
        classificationEvidence.length ===
          review.candidateOccupationIds.length &&
        classificationEvidence.every(
          (evidence, index) =>
            evidence.occupationId === review.candidateOccupationIds[index],
        ),
      "COM01M requires exact classification evidence for every output candidate.",
    );
    for (const evidence of classificationEvidence) {
      assertAuditableEvidence(evidence, attempt.programKey);
      assert(
        evidence.sourceUrl === COM01M_INE_CNO_URL &&
          evidence.sourceQuote ===
            COM01M_CLASSIFICATION_QUOTES[
              evidence.occupationId as keyof typeof COM01M_CLASSIFICATION_QUOTES
            ],
        "COM01M classification evidence must cite the exact INE four-digit CNO heading.",
      );
    }
  }
  assert(
    attempt.acceptedRelationships.length === 0,
    "Deferred COM01M cannot retain an accepted relationship.",
  );
  assert(
    attempt.rejectedRelationships.length ===
      COM01M_REJECTED_OCCUPATION_IDS.length &&
      attempt.rejectedRelationships.every(
        (relationship, index) =>
          relationship.occupationId === COM01M_REJECTED_OCCUPATION_IDS[index],
      ),
    "COM01M must retain the exact seven rejected CNO candidates in order.",
  );
  const reviewedCandidates = new Set(
    reviews.flatMap((review) => review.candidateOccupationIds),
  );
  assert(
    reviewedCandidates.size === COM01M_REJECTED_OCCUPATION_IDS.length &&
      COM01M_REJECTED_OCCUPATION_IDS.every((occupationId) =>
        reviewedCandidates.has(occupationId),
      ),
    "COM01M output-review candidates must be exactly the seven rejected CNO candidates.",
  );
  for (const relationship of attempt.rejectedRelationships) {
    assert(
      reviewedCandidates.has(relationship.occupationId),
      `COM01M disposition ${relationship.occupationId} must be tied to an individual professional-output review.`,
    );
    assert(
      reviews.some(
        (review) =>
          review.disposition === "rejected" &&
          Array.isArray(review.classificationEvidence) &&
          review.classificationEvidence.some(
            (evidence) => evidence.occupationId === relationship.occupationId,
          ),
      ),
      `COM01M disposition ${relationship.occupationId} must be backed by rejected output-review classification evidence.`,
    );
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
  if (attempt.completedAt !== undefined) {
    const latestTaskOwnedTransition = Math.max(...transitionTimes);
    assert(
      Date.parse(attempt.completedAt) >= latestTaskOwnedTransition,
      `Attempt ${attempt.programKey} completedAt cannot predate a task-owned state transition.`,
    );
  }
  const reviewedAtValues = [
    ...attempt.acceptedRelationships,
    ...attempt.rejectedRelationships,
    ...(attempt.professionalOutputReviews ?? []),
    ...(attempt.programmeProfileEvidence === undefined
      ? []
      : [
          attempt.programmeProfileEvidence.todoFp,
          attempt.programmeProfileEvidence.authoritativeOutputSource,
        ]),
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
  if (attempt.programKey === "EOC01M") {
    assert(
      coverage.newlyReachedOfferCount <= EOC01M_FAMILY_PILOT_SIGNAL,
      `EOC01M accepted-relationship coverage cannot exceed the ${EOC01M_FAMILY_PILOT_SIGNAL}-offer family pilot signal; the earlier ${EOC01M_EARLIER_TITLE_SIGNAL}-offer title signal is not the coverage cap.`,
    );
  }
}

function assertAttemptState(
  attempt: PilotAttempt,
  context: FpCoveragePilotValidationContext,
  now: Date,
): void {
  assertTodoFpProfessionalOutputReviews(attempt);
  assertRelationshipCatalogIntegrity(attempt, context);
  assertSsc01mProfessionalOutputReviews(attempt);
  assertEoc01mProfessionalOutputReviews(attempt);
  assertCom01mProfessionalOutputReviews(attempt);
  assertAcceptedEvidenceExcludesRejectedOutputLabels(attempt);

  if (attempt.state === "not_started") {
    assertExactTransitions(attempt, []);
    assert(
      attempt.startedAt === undefined &&
        attempt.completedAt === undefined &&
        attempt.phaseMinutes === undefined &&
        attempt.acceptedRelationships.length === 0 &&
        attempt.rejectedRelationships.length === 0 &&
        attempt.programmeProfileEvidence === undefined &&
        attempt.professionalOutputReviews === undefined &&
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
  if (
    results.attempts.every(
      (attempt) =>
        attempt.state === "completed" ||
        attempt.state === "deferred" ||
        attempt.state === "discarded",
    )
  ) {
    assertAggregation(results);
  }
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
