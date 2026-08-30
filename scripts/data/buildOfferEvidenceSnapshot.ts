import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  ProfessionalCertificatesResourceSchema,
  type ProfessionalCertificate,
} from "../../data/schemas/ecylResources";
import {
  JobOfferSchema,
  LoadableGeneratedManifestSchema,
  TrainingProgramSchema,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { immutableGeneratedResourcePath } from "../../data/schemas/generatedResourceCatalog";
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
  type OfferEvidenceCertificateEvidence,
  type OfferEvidenceCertificateRouteType,
  type OfferEvidenceNextAction,
  type OfferEvidenceRecord,
  type OfferEvidenceRelation,
  type OfferEvidenceRequirement,
  type OfferEvidenceReview,
  type OfferEvidenceStatus,
  type OfferEvidenceUniversityClass,
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
const OUTPUT_PATH = resolve(
  "public",
  immutableGeneratedResourcePath(
    "offerEvidence",
    OFFER_EVIDENCE_SNAPSHOT_ID,
  ).slice(1),
);
const GENERATED_AT = "2026-08-30T12:00:00.000Z";
const FP_ADMISSION_URL = "https://www.educa.jcyl.es/fp/es/admision-alumnado";
const ACCREDITATION_URL =
  "https://www.tramitacastillayleon.jcyl.es/web/jcyl/AdministracionElectronica/es/Plantilla100Detalle/1251181050732/Tramite/1285133303625/Tramite";
const ECYL_OFFICE_URL =
  "https://www.empleo.jcyl.es/web/es/localiza-oficina.html";
const UNIVERSITY_ROUTE_URL = "https://www.universidades.gob.es/";

const IsoManifestSchema = z.object({
  activationProvenance: z
    .object({ sourceSnapshotId: z.string().min(1) })
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

function resourcePath(manifest: Manifest, key: string): string {
  const snapshot = manifest.resourceSnapshots[key];
  if (snapshot === undefined)
    throw new Error(`Missing manifest resource: ${key}.`);
  return resolve("public", snapshot.resourcePath.slice(1));
}

async function readResource<T>(
  manifest: Manifest,
  key: string,
  schema: z.ZodType<T>,
): Promise<T> {
  return schema.parse(await readJson(resourcePath(manifest, key)));
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

const REVIEWED_CERTIFICATE_ALTERNATIVE_OCCUPATION = normalizedText(
  "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
);

type CertificateRoute = {
  routeType: OfferEvidenceCertificateRouteType;
  evidence: OfferEvidenceCertificateEvidence[];
};

function certificateEvidence(
  certificate: ProfessionalCertificate,
  sourceQuote: string,
  routeType: OfferEvidenceCertificateRouteType,
): OfferEvidenceCertificateEvidence {
  return {
    certificateCode: certificate.code,
    certificateTitle: certificate.title,
    authoritativeSourceUrl: certificate.programUrl,
    sourceQuote,
    relevance:
      routeType === "offer_explicitly_accepts"
        ? "El literal de la oferta identifica esta credencial por su denominación; la ficha oficial del SEPE permite comprobar su programa."
        : "La oferta no identifica un certificado concreto; la etiqueta ocupacional publicada permite mostrar esta credencial oficial solo como alternativa relacionada, no como requisito satisfecho.",
  };
}

function certificateRouteForOffer(
  offer: JobOffer,
  requirements: readonly OfferEvidenceRequirement[],
  certificates: readonly ProfessionalCertificate[],
): CertificateRoute | null {
  const certificateRequirements = requirements.filter(
    ({ normalizedCategory }) => normalizedCategory === "certificate",
  );
  if (certificateRequirements.length === 0) return null;

  const byTitle = [...certificates].sort(
    (left, right) => right.title.length - left.title.length,
  );
  const exactEvidence = certificateRequirements.flatMap((requirement) => {
    const normalizedRequirement = normalizedText(
      requirement.literalRequirement,
    );
    const certificate = byTitle.find((candidate) =>
      normalizedRequirement.includes(normalizedText(candidate.title)),
    );
    return certificate === undefined
      ? []
      : [
          certificateEvidence(
            certificate,
            requirement.literalRequirement,
            "offer_explicitly_accepts",
          ),
        ];
  });
  const uniqueExactEvidence = [
    ...new Map(
      exactEvidence.map((evidence) => [evidence.certificateCode, evidence]),
    ).values(),
  ];
  if (uniqueExactEvidence.length > 0) {
    return {
      routeType: "offer_explicitly_accepts",
      evidence: uniqueExactEvidence,
    };
  }

  if (
    normalizedText(offer.title) === REVIEWED_CERTIFICATE_ALTERNATIVE_OCCUPATION
  ) {
    const certificate = certificates.find(({ code }) => code === "SSCS0208");
    const requirement = certificateRequirements[0];
    if (certificate === undefined || requirement === undefined) {
      throw new Error(
        `The reviewed certificate alternative is not present in the official catalog: ${offer.id}.`,
      );
    }
    return {
      routeType: "occupation_related_alternative",
      evidence: [
        certificateEvidence(
          certificate,
          requirement.literalRequirement,
          "occupation_related_alternative",
        ),
      ],
    };
  }

  throw new Error(
    `Certificate requirement has no exact or reviewed alternative evidence: ${offer.id}.`,
  );
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
    resourceKey: key,
    snapshotId: baseSnapshotId(manifest),
    sourceId: snapshot.sourceId,
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

function universitySignal(
  relations: readonly OfferEvidenceRelation[],
  requirements: readonly OfferEvidenceRequirement[],
  title: string,
): OfferEvidenceRecord["universitySignal"] {
  if (
    relations.length > 0 ||
    requirements.some(({ normalizedCategory }) => normalizedCategory === "fp")
  ) {
    return "none";
  }
  if (
    requirements.some(({ normalizedCategory }) =>
      ["university", "licence"].includes(normalizedCategory),
    )
  ) {
    return "literal_offer_requirement";
  }
  return isUniversityOrRegulatedTitle(title) ? "title_only_unverified" : "none";
}

function universityEvidence(
  requirements: readonly OfferEvidenceRequirement[],
): OfferEvidenceRecord["universityEvidence"] {
  const requirement = requirements.find(({ normalizedCategory }) =>
    ["university", "licence"].includes(normalizedCategory),
  );
  if (requirement === undefined) return null;
  return {
    evidenceClass: "U1",
    basis: "literal_offer_requirement",
    sourceUrl: requirement.sourceUrl,
    sourceQuote: requirement.literalRequirement,
  };
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
  universityEvidenceClass: OfferEvidenceUniversityClass | null,
): OfferEvidenceStatus {
  if (relations.length > 0) return "reviewed_fp_relationship";
  if (
    requirements.some(({ normalizedCategory }) => normalizedCategory === "fp")
  ) {
    return "explicit_training_requirement";
  }
  if (universityEvidenceClass !== null) {
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
  universityEvidenceClass: OfferEvidenceUniversityClass | null,
  certificateRoute: CertificateRoute | null,
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
  if (hasCertificate && certificateRoute !== null) {
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
        certificateRouteType: certificateRoute.routeType,
        certificateEvidence: certificateRoute.evidence,
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
          "No calculamos tu elegibilidad: la administración debe comprobar si tu experiencia y documentación cumplen la convocatoria.",
        eligibilityStatus: "not_calculated",
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
          universityEvidenceClass === "U1"
            ? "La oferta publica literalmente un requisito universitario o regulado."
            : "La profesión está regulada y requiere comprobar la fuente oficial.",
        caveat:
          "No inferimos equivalencias, acceso, colegiación ni empleabilidad desde esta oferta.",
        ...(universityEvidenceClass === null
          ? {}
          : { universityEvidenceClass }),
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
  professionalCertificates: readonly ProfessionalCertificate[],
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
  const universitySignalValue = universitySignal(
    relations,
    requirements,
    offer.title,
  );
  const universityEvidenceValue = universityEvidence(requirements);
  const universityEvidenceClassValue =
    universityEvidenceValue?.evidenceClass ?? null;
  const certificateRoute = certificateRouteForOffer(
    offer,
    requirements,
    professionalCertificates,
  );
  const certificateRouteTypeValue = certificateRoute?.routeType ?? null;
  const evidenceStatus = deriveStatus(
    relations,
    requirements,
    universityEvidenceClassValue,
  );
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
    universitySignal: universitySignalValue,
    universityEvidenceClass: universityEvidenceClassValue,
    universityEvidence: universityEvidenceValue,
    certificateRouteType: certificateRouteTypeValue,
    requirements,
    relations,
    nextActions: deriveActions(
      offer,
      relations,
      requirements,
      evidenceStatus,
      universityEvidenceClassValue,
      certificateRoute,
    ),
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

export async function buildOfferEvidenceResource(): Promise<
  z.infer<typeof OfferEvidenceResourceSchema>
> {
  const rawManifest = await readJson(MANIFEST_PATH);
  const manifest = IsoManifestSchema.parse(
    LoadableGeneratedManifestSchema.parse(rawManifest),
  );
  const baseId = baseSnapshotId(manifest);
  const rawReviewCatalog = await readJson(REVIEW_CATALOG_PATH);
  const reviewCatalog =
    OfferEvidenceReviewCatalogSchema.parse(rawReviewCatalog);
  if (reviewCatalog.baseSnapshotId !== baseId) {
    throw new Error(
      `Review catalog targets ${reviewCatalog.baseSnapshotId}, active offers are ${baseId}.`,
    );
  }

  const [
    offers,
    publishedRequirements,
    programs,
    occupations,
    aliases,
    links,
    professionalCertificates,
  ] = await Promise.all([
    readResource(manifest, "jobOffers", z.array(JobOfferSchema)),
    readResource(
      manifest,
      "publishedRequirements",
      PublishedRequirementsResourceSchema,
    ),
    readResource(manifest, "programs", z.array(TrainingProgramSchema)),
    readResource(manifest, "occupations", OccupationsSchema),
    readResource(manifest, "occupationAliases", OccupationAliasesSchema),
    readResource(
      manifest,
      "trainingOccupationLinks",
      TrainingOccupationLinksSchema,
    ),
    readResource(
      manifest,
      "professionalCertificates",
      ProfessionalCertificatesResourceSchema,
    ),
  ]);
  const professionalProfiles = await readResource(
    manifest,
    "professionalProfiles",
    ProfessionalProfilesResourceSchema,
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
      professionalCertificates,
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
    "professionalCertificates",
  ].map((key) => sourceSnapshot(manifest, key));
  const resource = {
    schemaVersion: "1.0.0" as const,
    snapshotId: OFFER_EVIDENCE_SNAPSHOT_ID,
    baseSnapshotId: baseId,
    generatedAt: GENERATED_AT,
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
      universitySignalCount: records.filter(
        ({ universitySignal }) => universitySignal !== "none",
      ).length,
      universityAcceptedRecordCount: records.filter(
        ({ universityEvidenceClass }) => universityEvidenceClass !== null,
      ).length,
      titleOnlyUniversitySignalCount: records.filter(
        ({ universitySignal }) => universitySignal === "title_only_unverified",
      ).length,
      universityEvidenceClassCounts: {
        U1: records.filter(
          ({ universityEvidenceClass }) => universityEvidenceClass === "U1",
        ).length,
        U2: records.filter(
          ({ universityEvidenceClass }) => universityEvidenceClass === "U2",
        ).length,
        U3: records.filter(
          ({ universityEvidenceClass }) => universityEvidenceClass === "U3",
        ).length,
      },
      accreditationActionCount: records.reduce(
        (count, record) =>
          count +
          record.nextActions.filter(
            ({ actionType }) => actionType === "accreditation_route",
          ).length,
        0,
      ),
      certificateOfferAcceptanceCount: records.filter(
        ({ certificateRouteType }) =>
          certificateRouteType === "offer_explicitly_accepts",
      ).length,
      certificateAlternativeRouteCount: records.filter(
        ({ certificateRouteType }) =>
          certificateRouteType === "occupation_related_alternative",
      ).length,
    },
    notes: [
      "La etiqueta ocupacional conserva el título publicado; esta copia no publica el empleador y no lo completa por inferencia.",
      "status significa publicada en la instantánea base, no que la oferta siga abierta.",
      "Las relaciones FP y los requisitos revisados conservan cita, URL y fecha; la ausencia de relación no prueba imposibilidad.",
      "Las señales universitarias por título no se convierten en rutas: solo U1 (requisito literal) entra en la evidencia aceptada; U2 y U3 requieren una fuente oficial revisada.",
      "La acreditación se ofrece como consulta de procedimiento y no calcula elegibilidad; los certificados se muestran como aceptación literal de la oferta o como alternativa relacionada, nunca como equivalencia FP.",
      "No se recomiendan cursos ECYL como siguiente acción cuando la ficha no conserva fechas y condiciones suficientes para comprobar vigencia.",
      `El catálogo derivado se apoya en ${sha256Json(reviewCatalog)} como revisión local reproducible; las fuentes oficiales están en cada relación.`,
    ],
    records,
  };
  return OfferEvidenceResourceSchema.parse(resource);
}

async function main(): Promise<void> {
  const resource = await buildOfferEvidenceResource();
  await mkdir(resolve("public/data/v1/snapshots", OFFER_EVIDENCE_SNAPSHOT_ID), {
    recursive: true,
  });
  await writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(resource, null, 2)}\n`,
    "utf8",
  );
  console.log(
    JSON.stringify(
      {
        output: OUTPUT_PATH,
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
