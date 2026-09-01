import { z } from "zod";

const NonBlankStringSchema = z
  .string()
  .trim()
  .min(1, "Value must contain non-whitespace characters.");

const IsoDateTimeSchema = z.string().datetime();
const ReviewDateSchema = z.string().date();
const SemanticVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/u);

export const OFFER_EVIDENCE_SNAPSHOT_ID = "20260830120000000-8c6c79fbd2a1";
export const OFFER_EVIDENCE_RESOURCE_PATH = `/data/v1/snapshots/${OFFER_EVIDENCE_SNAPSHOT_ID}/offer-evidence.json`;

export const OfferEvidenceRequirementCategorySchema = z.enum([
  "fp",
  "university",
  "certificate",
  "licence",
  "experience",
  "driving",
  "language",
  "skill",
  "schedule",
  "location",
  "other",
  "unknown",
]);

export const OfferEvidenceStatusSchema = z.enum([
  "reviewed_fp_relationship",
  "explicit_training_requirement",
  "university_or_regulatory_route",
  "alternative_vocational_route",
  "ambiguous_requirement",
  "no_reviewed_relationship",
]);

export const OfferEvidenceRequirementClassificationSchema = z.enum([
  "parsed",
  "reviewed",
  "ambiguous",
  "unclassified",
]);

export const OfferEvidenceRequirementSchema = z
  .object({
    requirementId: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
    literalRequirement: NonBlankStringSchema,
    normalizedCategory: OfferEvidenceRequirementCategorySchema,
    normalizedValue: z.union([
      z.string(),
      z.number().int().positive(),
      z.null(),
    ]),
    classificationStatus: OfferEvidenceRequirementClassificationSchema,
    parserRule: NonBlankStringSchema,
    sourceUrl: z.string().url(),
    sourceDate: IsoDateTimeSchema,
  })
  .strict();

export const OfferEvidenceRelationSchema = z
  .object({
    programKey: NonBlankStringSchema,
    programTitle: NonBlankStringSchema,
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    occupationLabel: NonBlankStringSchema,
    relationshipType: z.enum(["official_output", "reviewed_relationship"]),
    matchRule: z.enum([
      "reviewed_title_alias_exact",
      "reviewed_title_alias_phrase",
      "reviewed_published_qualification_exact",
      "reviewed_exact_program_title",
    ]),
    sourceUrl: z.string().url(),
    sourceQuote: NonBlankStringSchema,
    reviewedAt: ReviewDateSchema,
    mappingVersion: SemanticVersionSchema,
    reviewNote: NonBlankStringSchema.optional(),
  })
  .strict();

export const OfferEvidenceNextActionSchema = z
  .object({
    actionType: z.enum([
      "open_original_offer",
      "view_fp_route",
      "fp_admission",
      "professional_alternative",
      "accreditation_route",
      "university_route",
      "ecyl_office",
    ]),
    targetKind: z.enum(["internal", "external"]),
    label: NonBlankStringSchema,
    href: NonBlankStringSchema.refine(
      (value) =>
        value.startsWith("/") ||
        (() => {
          try {
            const url = new URL(value);
            return url.protocol === "https:";
          } catch {
            return false;
          }
        })(),
      "Actions must use an internal path or an HTTPS URL.",
    ),
    reason: NonBlankStringSchema,
    caveat: NonBlankStringSchema.optional(),
    programKey: NonBlankStringSchema.optional(),
  })
  .strict()
  .superRefine((action, context) => {
    const isInternal = action.href.startsWith("/");
    if ((action.targetKind === "internal") !== isInternal) {
      context.addIssue({
        code: "custom",
        path: ["targetKind"],
        message: "Action target kind must agree with its href.",
      });
    }
    if (
      action.actionType === "view_fp_route" &&
      action.programKey === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["programKey"],
        message: "FP route actions must identify their program.",
      });
    }
  });

export const OfferEvidenceRecordSchema = z
  .object({
    offerId: NonBlankStringSchema,
    title: NonBlankStringSchema,
    occupationLabel: NonBlankStringSchema,
    province: NonBlankStringSchema.nullable(),
    locality: NonBlankStringSchema.nullable(),
    sourceName: NonBlankStringSchema,
    employer: z.null(),
    status: z.literal("published_in_snapshot"),
    publishedAt: IsoDateTimeSchema,
    sourceDate: IsoDateTimeSchema,
    freshnessDate: IsoDateTimeSchema,
    sourceUrl: z.string().url(),
    originalUrl: z.string().url(),
    evidenceStatus: OfferEvidenceStatusSchema,
    hasAmbiguousRequirements: z.boolean(),
    requirements: z.array(OfferEvidenceRequirementSchema),
    relations: z.array(OfferEvidenceRelationSchema),
    nextActions: z.array(OfferEvidenceNextActionSchema).min(1),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.sourceDate !== record.publishedAt) {
      context.addIssue({
        code: "custom",
        path: ["sourceDate"],
        message: "Offer source date must preserve the published date.",
      });
    }
    const hasAmbiguousRequirements = record.requirements.some(
      ({ classificationStatus, normalizedCategory }) =>
        classificationStatus === "ambiguous" ||
        classificationStatus === "unclassified" ||
        normalizedCategory === "unknown",
    );
    if (record.hasAmbiguousRequirements !== hasAmbiguousRequirements) {
      context.addIssue({
        code: "custom",
        path: ["hasAmbiguousRequirements"],
        message: "Ambiguity flag must be derived from requirement evidence.",
      });
    }
  });

export const OfferEvidenceSourceSnapshotSchema = z
  .object({
    snapshotId: NonBlankStringSchema,
    sourceUrl: z.string().url(),
    recordCount: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

export const OfferEvidenceCountsSchema = z
  .object({
    offerCount: z.number().int().nonnegative(),
    offersWithPublishedRequirements: z.number().int().nonnegative(),
    requirementCount: z.number().int().nonnegative(),
    classifiedRequirementCount: z.number().int().nonnegative(),
    unclassifiedRequirementCount: z.number().int().nonnegative(),
    offersWithReviewedFpRelationship: z.number().int().nonnegative(),
    reviewedRelationCount: z.number().int().nonnegative(),
    offersWithAlternativePathway: z.number().int().nonnegative(),
    offersWithAmbiguity: z.number().int().nonnegative(),
  })
  .strict();

export const OfferEvidenceResourceSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    snapshotId: z.literal(OFFER_EVIDENCE_SNAPSHOT_ID),
    baseSnapshotId: NonBlankStringSchema,
    generatedAt: IsoDateTimeSchema,
    reviewVersion: SemanticVersionSchema,
    sourceSnapshots: z.array(OfferEvidenceSourceSnapshotSchema).min(1),
    counts: OfferEvidenceCountsSchema,
    notes: z.array(NonBlankStringSchema),
    records: z.array(OfferEvidenceRecordSchema),
  })
  .strict()
  .superRefine((resource, context) => {
    if (resource.counts.offerCount !== resource.records.length) {
      context.addIssue({
        code: "custom",
        path: ["counts", "offerCount"],
        message: "Offer count must equal the number of records.",
      });
    }
    const offerIds = new Set<string>();
    for (const [index, record] of resource.records.entries()) {
      if (offerIds.has(record.offerId)) {
        context.addIssue({
          code: "custom",
          path: ["records", index, "offerId"],
          message: "Offer evidence IDs must be unique.",
        });
      }
      offerIds.add(record.offerId);
    }
  });

export const OfferEvidenceTitleReviewSchema = z
  .object({
    kind: z.literal("title_to_occupation"),
    offerTitle: NonBlankStringSchema,
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    programKey: NonBlankStringSchema,
    relationshipType: z.enum(["official_output", "reviewed_relationship"]),
    sourceUrl: z.string().url(),
    sourceQuote: NonBlankStringSchema,
    reviewedAt: ReviewDateSchema,
    mappingVersion: SemanticVersionSchema,
    reviewNote: NonBlankStringSchema,
  })
  .strict();

export const OfferEvidenceRequirementReviewSchema = z
  .object({
    kind: z.literal("exact_requirement_to_program"),
    offerIds: z.array(NonBlankStringSchema).min(1),
    literalRequirement: NonBlankStringSchema,
    normalizedValue: NonBlankStringSchema,
    programKey: NonBlankStringSchema,
    sourceUrl: z.string().url(),
    sourceQuote: NonBlankStringSchema,
    reviewedAt: ReviewDateSchema,
    mappingVersion: SemanticVersionSchema,
    reviewNote: NonBlankStringSchema,
  })
  .strict();

export const OfferEvidenceReviewSchema = z.discriminatedUnion("kind", [
  OfferEvidenceTitleReviewSchema,
  OfferEvidenceRequirementReviewSchema,
]);

export const OfferEvidenceReviewCatalogSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    reviewVersion: SemanticVersionSchema,
    baseSnapshotId: NonBlankStringSchema,
    reviews: z.array(OfferEvidenceReviewSchema).min(1),
  })
  .strict();

export type OfferEvidenceRequirementCategory = z.infer<
  typeof OfferEvidenceRequirementCategorySchema
>;
export type OfferEvidenceStatus = z.infer<typeof OfferEvidenceStatusSchema>;
export type OfferEvidenceRequirement = z.infer<
  typeof OfferEvidenceRequirementSchema
>;
export type OfferEvidenceRelation = z.infer<typeof OfferEvidenceRelationSchema>;
export type OfferEvidenceNextAction = z.infer<
  typeof OfferEvidenceNextActionSchema
>;
export type OfferEvidenceRecord = z.infer<typeof OfferEvidenceRecordSchema>;
export type OfferEvidenceResource = z.infer<typeof OfferEvidenceResourceSchema>;
export type OfferEvidenceReview = z.infer<typeof OfferEvidenceReviewSchema>;
export type OfferEvidenceReviewCatalog = z.infer<
  typeof OfferEvidenceReviewCatalogSchema
>;
