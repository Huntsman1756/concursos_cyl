import type {
  OfferEvidenceRecord,
  OfferEvidenceRelation,
  OfferEvidenceRequirementCategory,
  OfferEvidenceStatus,
} from "../../data/schemas/offerEvidence";
import {
  OfferDisplayMatchSchema,
  type OfferDisplayMatch,
} from "./offerMatching";
import type { OfferPublishedRequirements } from "./requirements";

export const OFFER_EVIDENCE_STATUS_LABELS: Readonly<
  Record<OfferEvidenceStatus, string>
> = {
  reviewed_fp_relationship: "Relación FP revisada",
  explicit_training_requirement: "Requisito formativo explícito",
  university_or_regulatory_route: "Vía universitaria o regulada",
  alternative_vocational_route: "Alternativa de cualificación",
  ambiguous_requirement: "Requisito ambiguo o sin clasificar",
  no_reviewed_relationship: "Sin relación revisada",
};

export const OFFER_EVIDENCE_CATEGORY_LABELS: Readonly<
  Record<OfferEvidenceRequirementCategory, string>
> = {
  fp: "FP",
  university: "Universidad",
  certificate: "Certificado",
  licence: "Licencia o habilitación",
  experience: "Experiencia",
  driving: "Conducción o vehículo",
  language: "Idioma",
  skill: "Competencia",
  schedule: "Horario",
  location: "Ubicación o movilidad",
  other: "Otro requisito",
  unknown: "Sin clasificar",
};

export const OFFER_EVIDENCE_CLASSIFICATION_LABELS = {
  parsed: "Clasificado por regla",
  reviewed: "Clasificado en revisión",
  ambiguous: "Ambiguo",
  unclassified: "Sin clasificar",
} as const;

export interface OfferEvidenceFilters {
  query?: string;
  status?: OfferEvidenceStatus | "all";
  province?: string | "all";
}

/** Adapts one manifest-backed sidecar relation for the shared offer card. */
export function createOfferEvidenceMatch(
  record: Pick<OfferEvidenceRecord, "offerId" | "publishedAt">,
  relation: OfferEvidenceRelation,
  publishedRequirements: readonly OfferPublishedRequirements[],
): OfferDisplayMatch {
  const requirements = publishedRequirements.find(
    ({ offerId }) => offerId === record.offerId,
  )?.requirements;
  return OfferDisplayMatchSchema.parse({
    offerId: record.offerId,
    occupationId: relation.occupationId,
    programKey: relation.programKey,
    publishedAt: record.publishedAt,
    relationshipType: relation.relationshipType,
    requirements: requirements ?? [],
    matchRule: relation.matchRule,
    sidecarEvidence: relation,
  });
}

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function searchableRecordText(record: OfferEvidenceRecord): string {
  return normalized(
    [
      record.title,
      record.occupationLabel,
      record.province ?? "",
      record.locality ?? "",
      record.sourceName,
      ...record.requirements.flatMap(
        ({ literalRequirement, normalizedCategory, normalizedValue }) => [
          literalRequirement,
          normalizedCategory,
          normalizedValue === null ? "" : String(normalizedValue),
        ],
      ),
      ...record.relations.flatMap(
        ({ programTitle, occupationLabel, occupationId }) => [
          programTitle,
          occupationLabel,
          occupationId,
        ],
      ),
    ].join(" "),
  );
}

export function filterOfferEvidenceRecords(
  records: readonly OfferEvidenceRecord[],
  filters: OfferEvidenceFilters = {},
): OfferEvidenceRecord[] {
  const query = normalized(filters.query ?? "");
  return records.filter((record) => {
    if (
      filters.status !== undefined &&
      filters.status !== "all" &&
      record.evidenceStatus !== filters.status
    ) {
      return false;
    }
    if (
      filters.province !== undefined &&
      filters.province !== "all" &&
      record.province !== filters.province
    ) {
      return false;
    }
    return query.length === 0 || searchableRecordText(record).includes(query);
  });
}

export function sortOfferEvidenceRecords(
  records: readonly OfferEvidenceRecord[],
): OfferEvidenceRecord[] {
  return [...records].sort(
    (left, right) =>
      Number(right.relations.length > 0) - Number(left.relations.length > 0) ||
      right.publishedAt.localeCompare(left.publishedAt) ||
      left.title.localeCompare(right.title, "es") ||
      left.offerId.localeCompare(right.offerId),
  );
}

export function offerEvidenceStatusLabel(status: OfferEvidenceStatus): string {
  return OFFER_EVIDENCE_STATUS_LABELS[status];
}

export function offerEvidenceCategoryLabel(
  category: OfferEvidenceRequirementCategory,
): string {
  return OFFER_EVIDENCE_CATEGORY_LABELS[category];
}
