import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  JobOfferSchema,
  LoadableGeneratedManifestSchema,
  TrainingProgramSchema,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import {
  OccupationsSchema,
  OccupationAliasesSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import { ProfessionalProfilesResourceSchema } from "../../data/schemas/professionalProfiles";
import {
  OFFER_EVIDENCE_SNAPSHOT_ID,
  OfferEvidenceReviewCatalogSchema,
  OfferEvidenceResourceSchema,
  type OfferEvidenceNextAction,
  type OfferEvidenceRecord,
  type OfferEvidenceRelation,
  type OfferEvidenceRequirement,
  type OfferEvidenceReview,
  type OfferEvidenceStatus,
} from "../../data/schemas/offerEvidence";
import {
  PublishedRequirementsResourceSchema,
  type OfferPublishedRequirements,
  type PublishedRequirement,
} from "../../src/domain/requirements";
import {
  matchOffersForProgram,
  type OfferMatch,
} from "../../src/domain/offerMatching";

const REVIEW_CATALOG_PATH = resolve("data/curated/offer-evidence-reviews.json");
const MANIFEST_PATH = resolve("public/data/v1/manifest.json");
const GENERATED_AT = "2026-08-30T12:00:00.000Z";
const FP_ADMISSION_URL = "https://www.educa.jcyl.es/fp/es/admision-alumnado";
const ACCREDITATION_URL =
  "https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Tramite/1285133303625/Tramite";
const ECYL_OFFICE_URL =
  "https://www.empleo.jcyl.es/web/es/localiza-oficina.html";
const UNIVERSITY_ROUTE_URL = "https://www.universidades.gob.es/";

const IsoManifestSchema = z.object({
  activationProvenance: z
    .object({
      sourceSnapshotId: z.string().min(1),
    })
    .optional(),
  resourceSnapshots: z.record(
    z.string(),
    z.object({
      sourceId: z.string(),
      sourceUrl: z.string().url(),
      recordCount: z.number().int().nonnegative(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/u),
      resourcePath: z.string(),
    }),
  ),
});

type Manifest = z.infer<typeof IsoManifestSchema>;

function readJson(path: string): Promise<unknown> {
  return readFile(path, "utf8").then((value) => JSON.parse(value) as unknown);
}

function resourcePath(
  manifest: Manifest,
  key: string,
  rootDirectory = ".",
): string {
  const snapshot = manifest.resourceSnapshots[key];
  if (snapshot === undefined)
    throw new Error(`Missing manifest resource: ${key}.`);
  return resolve(rootDirectory, "public", snapshot.resourcePath.slice(1));
}

async function readResource<T>(
  manifest: Manifest,
  key: string,
  schema: z.ZodType<T>,
  rootDirectory = ".",
): Promise<T> {
  return schema.parse(
    await readJson(resourcePath(manifest, key, rootDirectory)),
  );
}

function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizedText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function baseSnapshotId(manifest: Manifest): string {
  if (manifest.activationProvenance !== undefined) {
    return manifest.activationProvenance.sourceSnapshotId;
  }
  const path = manifest.resourceSnapshots.jobOffers?.resourcePath;
  if (path === undefined) throw new Error("Job offer snapshot is missing.");
  const match = /^\/data\/v1\/snapshots\/([^/]+)\//u.exec(path);
  if (match === null)
    throw new Error(`Unexpected job offer resource path: ${path}.`);
  return match[1];
}

function sourceSnapshot(manifest: Manifest, key: string) {
  const snapshot = manifest.resourceSnapshots[key];
  if (snapshot === undefined)
    throw new Error(`Missing source snapshot: ${key}.`);
  return {
    snapshotId: snapshot.sourceId,
    sourceUrl: snapshot.sourceUrl,
    recordCount: snapshot.recordCount,
    sha256: snapshot.sha256,
  };
}

function offerSourceDate(offer: JobOffer): string {
  return offer.publishedAt;
}

function requirementCategory(
  requirement: PublishedRequirement,
): OfferEvidenceRequirement["normalizedCategory"] {
  if (requirement.category === "qualification_or_specialization") {
    const value = normalizedText(requirement.normalizedValue);
    if (
      /^(?:grado|diplomad|licenciad|ingenier|arquitect|m[aá]ster|doctorad)\b/u.test(
        value,
      )
    ) {
      return "university";
    }
    if (/^(?:tecnico|fp|formacion profesional)\b/u.test(value)) return "fp";
    return "other";
  }
  switch (requirement.category) {
    case "experience":
      return "experience";
    case "driving_license_or_vehicle":
      return "driving";
    case "certificate_or_regulated_license":
      return requirement.normalizedValue === "food_handler" ||
        requirement.parserRule === "certificate.professional_certificate"
        ? "certificate"
        : "licence";
    case "language":
      return "language";
    case "schedule_availability":
      return "schedule";
    case "mobility_or_work_mode":
      return "location";
    case "unclassified":
      return "unknown";
  }
}

function requirementClassification(
  requirement: PublishedRequirement,
  reviewed: boolean,
): OfferEvidenceRequirement["classificationStatus"] {
  if (reviewed) return "reviewed";
  if (requirement.category !== "unclassified") return "parsed";
  return requirement.parserRule === "unclassified.ambiguous_or_negated"
    ? "ambiguous"
    : "unclassified";
}

function mapRequirement(
  offer: JobOffer,
  requirement: PublishedRequirement,
  reviewedRequirementIds: ReadonlySet<string>,
  reviewedRequirementValues: ReadonlyMap<string, string>,
): OfferEvidenceRequirement {
  const reviewedValue = reviewedRequirementValues.get(requirement.id);
  return {
    requirementId: requirement.id,
    literalRequirement: requirement.sourceQuote,
    normalizedCategory:
      reviewedValue === undefined ? requirementCategory(requirement) : "fp",
    normalizedValue: reviewedValue ?? requirement.normalizedValue,
    classificationStatus: requirementClassification(
      requirement,
      reviewedRequirementIds.has(requirement.id),
    ),
    parserRule: requirement.parserRule,
    sourceUrl: offer.originalUrl,
    sourceDate: offerSourceDate(offer),
  };
}

function relationRule(match: OfferMatch): OfferEvidenceRelation["matchRule"] {
  switch (match.matchRule) {
    case "title_alias_exact":
      return "reviewed_title_alias_exact";
    case "title_alias_phrase":
      return "reviewed_title_alias_phrase";
    case "published_qualification_exact":
      return "reviewed_published_qualification_exact";
    case "human_override":
      throw new Error(
        "In-memory human overrides cannot enter an open dataset.",
      );
  }
}

function relationFromMatch(
  match: OfferMatch,
  programsByKey: ReadonlyMap<string, TrainingProgram>,
  occupationsById: ReadonlyMap<string, Occupation>,
): OfferEvidenceRelation {
  const program = programsByKey.get(match.programKey);
  const occupation = occupationsById.get(match.occupationId);
  if (program === undefined || occupation === undefined) {
    throw new Error(`Offer match has dangling metadata: ${match.offerId}.`);
  }
  const link = match.linkEvidence.payload;
  return {
    programKey: program.programKey,
    programTitle: program.programTitle,
    occupationId: occupation.occupationId,
    occupationLabel: occupation.preferredLabel,
    relationshipType: link.relationshipType,
    matchRule: relationRule(match),
    sourceUrl: link.sourceUrl,
    sourceQuote: link.sourceQuote,
    reviewedAt: link.reviewedAt,
    mappingVersion: link.mappingVersion,
    ...(link.reviewNote === undefined ? {} : { reviewNote: link.reviewNote }),
  };
}

function relationFromTitleReview(
  review: Extract<OfferEvidenceReview, { kind: "title_to_occupation" }>,
  programsByKey: ReadonlyMap<string, TrainingProgram>,
  occupationsById: ReadonlyMap<string, Occupation>,
): OfferEvidenceRelation {
  const program = programsByKey.get(review.programKey);
  const occupation = occupationsById.get(review.occupationId);
  if (program === undefined || occupation === undefined) {
    throw new Error(
      `Title review has dangling metadata: ${review.offerTitle}.`,
    );
  }
  return {
    programKey: program.programKey,
    programTitle: program.programTitle,
    occupationId: occupation.occupationId,
    occupationLabel: occupation.preferredLabel,
    relationshipType: review.relationshipType,
    matchRule: "reviewed_title_alias_exact",
    sourceUrl: review.sourceUrl,
    sourceQuote: review.sourceQuote,
    reviewedAt: review.reviewedAt,
    mappingVersion: review.mappingVersion,
    reviewNote: review.reviewNote,
  };
}

function relationFromRequirementReview(
  review: Extract<
    OfferEvidenceReview,
    { kind: "exact_requirement_to_program" }
  >,
  programsByKey: ReadonlyMap<string, TrainingProgram>,
  occupationsById: ReadonlyMap<string, Occupation>,
  links: readonly TrainingOccupationLink[],
): OfferEvidenceRelation {
  const program = programsByKey.get(review.programKey);
  const link = links.find(
    (candidate) =>
      candidate.trainingProgramKey === review.programKey &&
      candidate.reviewStatus === "approved",
  );
  if (program === undefined || link === undefined) {
    throw new Error(
      `Requirement review has no approved FP link: ${review.programKey}.`,
    );
  }
  const occupation = occupationsById.get(link.occupationId);
  if (occupation === undefined) {
    throw new Error(
      `Requirement review has dangling occupation: ${link.occupationId}.`,
    );
  }
  return {
    programKey: program.programKey,
    programTitle: program.programTitle,
    occupationId: occupation.occupationId,
    occupationLabel: occupation.preferredLabel,
    relationshipType: link.relationshipType,
    matchRule: "reviewed_exact_program_title",
    sourceUrl: review.sourceUrl,
    sourceQuote: review.sourceQuote,
    reviewedAt: review.reviewedAt,
    mappingVersion: review.mappingVersion,
    reviewNote: review.reviewNote,
  };
}

function isUniversityOrRegulatedTitle(title: string): boolean {
  return /\b(?:fisioterapeut\w*|enfermer\w*|m[eé]dic\w*|terapeuta\s+ocupacional\w*|logoped\w*|odont[oó]log\w*|pod[oó]log\w*|farmac[eé]ut\w*|veterinar\w*|colegiac\w*|habilitaci[oó]n\s+profesional\w*)\b/iu.test(
    title,
  );
}

function uniqueActions(
  actions: readonly OfferEvidenceNextAction[],
): OfferEvidenceNextAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.actionType}\u0000${action.href}\u0000${action.programKey ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function action(value: OfferEvidenceNextAction): OfferEvidenceNextAction {
  return value;
}

function deriveStatus(
  relations: readonly OfferEvidenceRelation[],
  requirements: readonly OfferEvidenceRequirement[],
  offerTitle: string,
): OfferEvidenceStatus {
  if (relations.length > 0) return "reviewed_fp_relationship";
  if (
    requirements.some(({ normalizedCategory }) => normalizedCategory === "fp")
  ) {
    return "explicit_training_requirement";
  }
  if (
    requirements.some(({ normalizedCategory }) =>
      ["university", "licence"].includes(normalizedCategory),
    ) ||
    isUniversityOrRegulatedTitle(offerTitle)
  ) {
    return "university_or_regulatory_route";
  }
  if (
    requirements.some(({ normalizedCategory }) =>
      ["certificate", "experience"].includes(normalizedCategory),
    )
  ) {
    return "alternative_vocational_route";
  }
  if (
    requirements.some(
      ({ classificationStatus, normalizedCategory }) =>
        classificationStatus === "ambiguous" ||
        classificationStatus === "unclassified" ||
        normalizedCategory === "unknown",
    )
  ) {
    return "ambiguous_requirement";
  }
  return "no_reviewed_relationship";
}

function deriveActions(
  offer: JobOffer,
  relations: readonly OfferEvidenceRelation[],
  requirements: readonly OfferEvidenceRequirement[],
  evidenceStatus: OfferEvidenceStatus,
): OfferEvidenceNextAction[] {
  const actions: OfferEvidenceNextAction[] = [
    action({
      actionType: "open_original_offer",
      targetKind: "external",
      label: "Abrir la oferta original",
      href: offer.originalUrl,
      reason:
        "Comprueba siempre el texto y el estado en la publicación de origen.",
    }),
  ];

  for (const relation of relations) {
    actions.push(
      action({
        actionType: "view_fp_route",
        targetKind: "internal",
        label: `Ver dónde estudiar ${relation.programTitle}`,
        href: `/formacion/${encodeURIComponent(relation.programKey)}`,
        reason:
          "La relación con este ciclo está respaldada por una revisión explícita.",
        caveat:
          "La relación orienta la búsqueda; no promete contratación ni equivalencia profesional.",
        programKey: relation.programKey,
      }),
    );
  }
  if (relations.length > 0) {
    actions.push(
      action({
        actionType: "fp_admission",
        targetKind: "external",
        label: "Consultar admisión oficial de FP",
        href: FP_ADMISSION_URL,
        reason:
          "La admisión, las modalidades y los plazos se comprueban en la web educativa de Castilla y León.",
        caveat: "La convocatoria y la oferta disponible pueden cambiar.",
      }),
    );
  }

  const hasCertificate = requirements.some(
    ({ normalizedCategory }) => normalizedCategory === "certificate",
  );
  const hasExperience = requirements.some(
    ({ normalizedCategory }) => normalizedCategory === "experience",
  );
  const isBoundary = evidenceStatus === "university_or_regulatory_route";
  if (hasCertificate) {
    actions.push(
      action({
        actionType: "professional_alternative",
        targetKind: "internal",
        label: "Explorar certificados profesionales",
        href: "/recursos",
        reason:
          "La oferta menciona una credencial que puede orientar una alternativa de cualificación.",
        caveat:
          "Es una alternativa para investigar; no equivale automáticamente a un título de FP.",
      }),
    );
  }
  if (hasExperience) {
    actions.push(
      action({
        actionType: "accreditation_route",
        targetKind: "external",
        label: "Consultar acreditación de competencias",
        href: ACCREDITATION_URL,
        reason:
          "La experiencia puede ser relevante para la vía oficial de acreditación.",
        caveat:
          "La administración debe comprobar si tu experiencia y documentación cumplen la convocatoria.",
      }),
    );
  }
  if (isBoundary) {
    actions.push(
      action({
        actionType: "university_route",
        targetKind: "external",
        label: "Consultar la vía universitaria oficial",
        href: UNIVERSITY_ROUTE_URL,
        reason:
          "La etiqueta apunta a una profesión o requisito con límite universitario/regulado.",
        caveat:
          "No inferimos equivalencias, acceso, colegiación ni empleabilidad desde esta oferta.",
      }),
    );
  }
  if (relations.length === 0 || evidenceStatus === "ambiguous_requirement") {
    actions.push(
      action({
        actionType: "ecyl_office",
        targetKind: "external",
        label: "Localizar una oficina ECYL",
        href: ECYL_OFFICE_URL,
        reason:
          "Una oficina puede ayudarte a contrastar requisitos o la vía de acceso aplicable.",
      }),
    );
  }
  return uniqueActions(actions);
}

function createRecord(
  offer: JobOffer,
  published: OfferPublishedRequirements | undefined,
  reviewedRequirementIds: ReadonlySet<string>,
  reviewedRequirementValues: ReadonlyMap<string, string>,
  reviewedRelationsByOfferId: ReadonlyMap<
    string,
    readonly OfferEvidenceRelation[]
  >,
): OfferEvidenceRecord {
  const requirements = (published?.requirements ?? []).map((requirement) =>
    mapRequirement(
      offer,
      requirement,
      reviewedRequirementIds,
      reviewedRequirementValues,
    ),
  );
  const relations = [...(reviewedRelationsByOfferId.get(offer.id) ?? [])].sort(
    (left, right) =>
      left.programKey.localeCompare(right.programKey) ||
      left.occupationId.localeCompare(right.occupationId) ||
      left.matchRule.localeCompare(right.matchRule),
  );
  const evidenceStatus = deriveStatus(relations, requirements, offer.title);
  return {
    offerId: offer.id,
    title: offer.title,
    occupationLabel: offer.title,
    province: offer.province,
    locality: offer.locality,
    sourceName: offer.sourceName,
    employer: null,
    status: "published_in_snapshot",
    publishedAt: offer.publishedAt,
    sourceDate: offerSourceDate(offer),
    freshnessDate: offer.sourceSnapshot.sourceUpdatedAt,
    sourceUrl: offer.sourceSnapshot.sourceUrl,
    originalUrl: offer.originalUrl,
    evidenceStatus,
    hasAmbiguousRequirements: requirements.some(
      ({ classificationStatus, normalizedCategory }) =>
        classificationStatus === "ambiguous" ||
        classificationStatus === "unclassified" ||
        normalizedCategory === "unknown",
    ),
    requirements,
    relations,
    nextActions: deriveActions(offer, relations, requirements, evidenceStatus),
  };
}

function buildRelations(
  programs: readonly TrainingProgram[],
  offers: readonly JobOffer[],
  occupations: readonly Occupation[],
  aliases: readonly OccupationAlias[],
  links: readonly TrainingOccupationLink[],
  publishedRequirements: readonly OfferPublishedRequirements[],
  reviews: readonly OfferEvidenceReview[],
): Map<string, OfferEvidenceRelation[]> {
  const byOffer = new Map<string, OfferEvidenceRelation[]>();
  const programsByKey = new Map(
    programs.map((program) => [program.programKey, program]),
  );
  const occupationsById = new Map(
    occupations.map((occupation) => [occupation.occupationId, occupation]),
  );
  const input = {
    programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    humanOverrides: [],
  } as const;

  for (const program of programs) {
    for (const match of matchOffersForProgram(program.programKey, input)) {
      const relation = relationFromMatch(match, programsByKey, occupationsById);
      const relations = byOffer.get(match.offerId) ?? [];
      relations.push(relation);
      byOffer.set(match.offerId, relations);
    }
  }

  for (const review of reviews) {
    if (review.kind === "title_to_occupation") {
      const relation = relationFromTitleReview(
        review,
        programsByKey,
        occupationsById,
      );
      for (const offer of offers) {
        if (normalizedText(offer.title) !== normalizedText(review.offerTitle))
          continue;
        const relations = byOffer.get(offer.id) ?? [];
        relations.push(relation);
        byOffer.set(offer.id, relations);
      }
      continue;
    }
    const relation = relationFromRequirementReview(
      review,
      programsByKey,
      occupationsById,
      links,
    );
    for (const offerId of review.offerIds) {
      if (!offers.some(({ id }) => id === offerId)) {
        throw new Error(
          `Requirement review references unknown offer: ${offerId}.`,
        );
      }
      const relations = byOffer.get(offerId) ?? [];
      relations.push(relation);
      byOffer.set(offerId, relations);
    }
  }

  for (const [offerId, relations] of byOffer) {
    const seen = new Set<string>();
    const unique = relations.filter((relation) => {
      const key = [
        relation.programKey,
        relation.occupationId,
        relation.matchRule,
        relation.sourceUrl,
        relation.sourceQuote,
      ].join("\u0000");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    byOffer.set(offerId, unique);
  }
  return byOffer;
}

export async function buildOfferEvidenceResource(
  options: {
    rootDirectory?: string;
    snapshotId?: string;
    generatedAt?: string;
    reviewCatalogPath?: string;
    manifestPath?: string;
  } = {},
): Promise<z.infer<typeof OfferEvidenceResourceSchema>> {
  const rootDirectory = options.rootDirectory ?? ".";
  const rawManifest = await readJson(
    options.manifestPath ??
      (options.rootDirectory === undefined
        ? MANIFEST_PATH
        : resolve(rootDirectory, "public/data/v1/manifest.json")),
  );
  const manifest = IsoManifestSchema.parse(
    LoadableGeneratedManifestSchema.parse(rawManifest),
  );
  const baseId = baseSnapshotId(manifest);
  const rawReviewCatalog = await readJson(
    options.reviewCatalogPath ?? REVIEW_CATALOG_PATH,
  );
  const reviewCatalog =
    OfferEvidenceReviewCatalogSchema.parse(rawReviewCatalog);
  if (reviewCatalog.baseSnapshotId !== baseId) {
    throw new Error(
      `Review catalog targets ${reviewCatalog.baseSnapshotId}, active offers are ${baseId}.`,
    );
  }

  const [offers, publishedRequirements, programs, occupations, aliases, links] =
    await Promise.all([
      readResource(
        manifest,
        "jobOffers",
        z.array(JobOfferSchema),
        rootDirectory,
      ),
      readResource(
        manifest,
        "publishedRequirements",
        PublishedRequirementsResourceSchema,
        rootDirectory,
      ),
      readResource(
        manifest,
        "programs",
        z.array(TrainingProgramSchema),
        rootDirectory,
      ),
      readResource(manifest, "occupations", OccupationsSchema, rootDirectory),
      readResource(
        manifest,
        "occupationAliases",
        OccupationAliasesSchema,
        rootDirectory,
      ),
      readResource(
        manifest,
        "trainingOccupationLinks",
        TrainingOccupationLinksSchema,
        rootDirectory,
      ),
    ]);
  const professionalProfiles = await readResource(
    manifest,
    "professionalProfiles",
    ProfessionalProfilesResourceSchema,
    rootDirectory,
  );
  if (professionalProfiles.length === 0)
    throw new Error("TodoFP profiles are missing.");

  const cookingReview = reviewCatalog.reviews.find(
    (
      review,
    ): review is Extract<
      OfferEvidenceReview,
      { kind: "exact_requirement_to_program" }
    > => review.kind === "exact_requirement_to_program",
  );
  const reviewedRequirementIds = new Set<string>();
  const reviewedRequirementValues = new Map<string, string>();
  if (cookingReview !== undefined) {
    for (const offerId of cookingReview.offerIds) {
      const entry = publishedRequirements.find(
        ({ offerId: id }) => id === offerId,
      );
      const matched = entry?.requirements.find((requirement) =>
        normalizedText(requirement.sourceQuote).includes(
          normalizedText(cookingReview.normalizedValue),
        ),
      );
      if (matched === undefined) {
        throw new Error(
          `Cooking review has no exact published requirement: ${offerId}.`,
        );
      }
      reviewedRequirementIds.add(matched.id);
      reviewedRequirementValues.set(matched.id, cookingReview.normalizedValue);
    }
  }

  const relationsByOfferId = buildRelations(
    programs,
    offers,
    occupations,
    aliases,
    links,
    publishedRequirements,
    reviewCatalog.reviews,
  );
  const requirementsByOfferId = new Map(
    publishedRequirements.map((entry) => [entry.offerId, entry]),
  );
  const records = offers.map((offer) =>
    createRecord(
      offer,
      requirementsByOfferId.get(offer.id),
      reviewedRequirementIds,
      reviewedRequirementValues,
      relationsByOfferId,
    ),
  );
  const requirementRecords = records.flatMap(
    ({ requirements }) => requirements,
  );
  const relationRecords = records.flatMap(({ relations }) => relations);
  const sourceSnapshots = [
    "jobOffers",
    "publishedRequirements",
    "programs",
    "occupations",
    "occupationAliases",
    "trainingOccupationLinks",
    "professionalProfiles",
  ].map((key) => sourceSnapshot(manifest, key));
  const resource = {
    schemaVersion: "1.0.0" as const,
    snapshotId:
      options.snapshotId ??
      (rawManifest as { snapshotId?: string }).snapshotId ??
      OFFER_EVIDENCE_SNAPSHOT_ID,
    baseSnapshotId: baseId,
    generatedAt:
      options.generatedAt ??
      (rawManifest as { generatedAt?: string }).generatedAt ??
      GENERATED_AT,
    reviewVersion: reviewCatalog.reviewVersion,
    sourceSnapshots,
    counts: {
      offerCount: records.length,
      offersWithPublishedRequirements: records.filter(
        ({ requirements }) => requirements.length > 0,
      ).length,
      requirementCount: requirementRecords.length,
      classifiedRequirementCount: requirementRecords.filter(
        ({ normalizedCategory }) => normalizedCategory !== "unknown",
      ).length,
      unclassifiedRequirementCount: requirementRecords.filter(
        ({ normalizedCategory }) => normalizedCategory === "unknown",
      ).length,
      offersWithReviewedFpRelationship: records.filter(
        ({ relations }) => relations.length > 0,
      ).length,
      reviewedRelationCount: relationRecords.length,
      offersWithAlternativePathway: records.filter(({ nextActions }) =>
        nextActions.some(({ actionType }) =>
          ["professional_alternative", "accreditation_route"].includes(
            actionType,
          ),
        ),
      ).length,
      offersWithAmbiguity: records.filter(
        ({ hasAmbiguousRequirements }) => hasAmbiguousRequirements,
      ).length,
    },
    notes: [
      "La etiqueta ocupacional conserva el título publicado; esta copia no publica el empleador y no lo completa por inferencia.",
      "status significa publicada en la instantánea base, no que la oferta siga abierta.",
      "Las relaciones FP y los requisitos revisados conservan cita, URL y fecha; la ausencia de relación no prueba imposibilidad.",
      "No se recomiendan cursos ECYL como siguiente acción cuando la ficha no conserva fechas y condiciones suficientes para comprobar vigencia.",
      `El catálogo derivado se apoya en ${sha256Json(reviewCatalog)} como revisión local reproducible; las fuentes oficiales están en cada relación.`,
    ],
    records,
  };
  return OfferEvidenceResourceSchema.parse(resource);
}

async function main(): Promise<void> {
  const resource = await buildOfferEvidenceResource();
  const outputPath = resolve(
    "public/data/v1/snapshots",
    resource.snapshotId,
    "offer-evidence.json",
  );
  const content = `${JSON.stringify(resource, null, 2)}\n`;
  let existing: string | undefined;
  try {
    existing = await readFile(outputPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (existing !== undefined && existing !== content) {
    throw new Error(
      "Refusing to overwrite immutable offer evidence; create a new candidate snapshot.",
    );
  }
  await mkdir(resolve("public/data/v1/snapshots", resource.snapshotId), {
    recursive: true,
  });
  if (existing === undefined)
    await writeFile(outputPath, content, { encoding: "utf8", flag: "wx" });
  console.log(
    JSON.stringify(
      {
        output: outputPath,
        counts: resource.counts,
      },
      null,
      2,
    ),
  );
}

if (
  process.argv[1]
    ?.replaceAll("\\", "/")
    .endsWith("buildOfferEvidenceSnapshot.ts")
) {
  await main();
}
