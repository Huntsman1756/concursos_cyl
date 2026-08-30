import { z } from "zod";

const NonBlankStringSchema = z
  .string()
  .trim()
  .min(1, "Value must contain non-whitespace characters.");

const IsoDateTimeSchema = z.string().datetime();
const ReviewDateSchema = z.string().date();
const SemanticVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/u);

export const OFFER_EVIDENCE_SNAPSHOT_ID = "20260830120000000-8c6c79fbd2a1";
export const OFFER_EVIDENCE_RESOURCE_FILE_NAME = "offer-evidence.json";

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

export const OfferEvidenceUniversityClassSchema = z.enum(["U1", "U2", "U3"]);

export const OfferEvidenceUniversitySignalSchema = z.enum([
  "none",
  "title_only_unverified",
  "literal_offer_requirement",
  "regulated_profession_official_source",
  "other_reviewed_official_evidence",
]);

export const OfferEvidenceCertificateRouteTypeSchema = z.enum([
  "offer_explicitly_accepts",
  "occupation_related_alternative",
]);

export const OfferEvidenceCertificateEvidenceSchema = z
  .object({
    certificateCode: NonBlankStringSchema,
    certificateTitle: NonBlankStringSchema,
    authoritativeSourceUrl: z.string().url(),
    sourceQuote: NonBlankStringSchema,
    relevance: NonBlankStringSchema,
  })
  .strict();

export const OfferEvidenceUniversityEvidenceSchema = z
  .object({
    evidenceClass: OfferEvidenceUniversityClassSchema,
    basis: z.enum([
      "literal_offer_requirement",
      "regulated_profession_official_source",
      "other_reviewed_official_evidence",
    ]),
    sourceUrl: z.string().url(),
    sourceQuote: NonBlankStringSchema,
  })
  .strict();

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
    eligibilityStatus: z.literal("not_calculated").optional(),
    certificateRouteType: OfferEvidenceCertificateRouteTypeSchema.optional(),
    certificateEvidence: z
      .array(OfferEvidenceCertificateEvidenceSchema)
      .min(1)
      .optional(),
    universityEvidenceClass: OfferEvidenceUniversityClassSchema.optional(),
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
    if (action.actionType === "accreditation_route") {
      if (action.eligibilityStatus !== "not_calculated") {
        context.addIssue({
          code: "custom",
          path: ["eligibilityStatus"],
          message:
            "Accreditation actions must state that eligibility is not calculated.",
        });
      }
    } else if (action.eligibilityStatus !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["eligibilityStatus"],
        message: "Eligibility status is only valid for accreditation actions.",
      });
    }
    if (action.actionType === "professional_alternative") {
      if (action.certificateRouteType === undefined) {
        context.addIssue({
          code: "custom",
          path: ["certificateRouteType"],
          message: "Certificate actions must distinguish their route type.",
        });
      }
      if (action.certificateEvidence === undefined) {
        context.addIssue({
          code: "custom",
          path: ["certificateEvidence"],
          message:
            "Certificate actions must identify an exact official certificate and its relevance.",
        });
      }
    } else if (
      action.certificateRouteType !== undefined ||
      action.certificateEvidence !== undefined
    ) {
      context.addIssue({
        code: "custom",
        path: [
          action.certificateRouteType !== undefined
            ? "certificateRouteType"
            : "certificateEvidence",
        ],
        message: "Certificate evidence is only valid for certificate actions.",
      });
    }
    if (action.actionType === "university_route") {
      if (action.universityEvidenceClass === undefined) {
        context.addIssue({
          code: "custom",
          path: ["universityEvidenceClass"],
          message: "University actions must identify U1, U2 or U3 evidence.",
        });
      }
    } else if (action.universityEvidenceClass !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["universityEvidenceClass"],
        message:
          "University evidence class is only valid for university actions.",
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
    universitySignal: OfferEvidenceUniversitySignalSchema,
    universityEvidenceClass: OfferEvidenceUniversityClassSchema.nullable(),
    universityEvidence: OfferEvidenceUniversityEvidenceSchema.nullable(),
    certificateRouteType: OfferEvidenceCertificateRouteTypeSchema.nullable(),
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
    const hasUniversityRequirement = record.requirements.some(
      ({ normalizedCategory }) =>
        normalizedCategory === "university" || normalizedCategory === "licence",
    );
    if (
      record.universitySignal === "literal_offer_requirement" &&
      !hasUniversityRequirement
    ) {
      context.addIssue({
        code: "custom",
        path: ["universitySignal"],
        message:
          "A literal university signal requires a university or licence requirement.",
      });
    }
    if (
      record.universityEvidenceClass === null &&
      record.universityEvidence !== null
    ) {
      context.addIssue({
        code: "custom",
        path: ["universityEvidence"],
        message: "University evidence details require an evidence class.",
      });
    }
    if (
      record.universityEvidenceClass !== null &&
      record.universityEvidence?.evidenceClass !==
        record.universityEvidenceClass
    ) {
      context.addIssue({
        code: "custom",
        path: ["universityEvidence"],
        message: "University evidence class must agree with its details.",
      });
    }
    if (
      record.universityEvidenceClass !== null &&
      record.universitySignal !==
        (
          {
            U1: "literal_offer_requirement",
            U2: "regulated_profession_official_source",
            U3: "other_reviewed_official_evidence",
          } as const
        )[record.universityEvidenceClass]
    ) {
      context.addIssue({
        code: "custom",
        path: ["universityEvidenceClass"],
        message:
          "Accepted university evidence must be grounded in a reviewed signal.",
      });
    }
    if (
      record.universityEvidenceClass === null &&
      [
        "regulated_profession_official_source",
        "other_reviewed_official_evidence",
      ].includes(record.universitySignal)
    ) {
      context.addIssue({
        code: "custom",
        path: ["universityEvidenceClass"],
        message: "Official university signals must carry an evidence class.",
      });
    }
    const hasCertificateRequirement = record.requirements.some(
      ({ normalizedCategory }) => normalizedCategory === "certificate",
    );
    if ((record.certificateRouteType !== null) !== hasCertificateRequirement) {
      context.addIssue({
        code: "custom",
        path: ["certificateRouteType"],
        message: "Certificate route type must match certificate requirements.",
      });
    }
  });

export const OfferEvidenceSourceSnapshotSchema = z
  .object({
    resourceKey: NonBlankStringSchema,
    snapshotId: NonBlankStringSchema,
    sourceId: NonBlankStringSchema,
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
    universitySignalCount: z.number().int().nonnegative(),
    universityAcceptedRecordCount: z.number().int().nonnegative(),
    titleOnlyUniversitySignalCount: z.number().int().nonnegative(),
    universityEvidenceClassCounts: z
      .object({
        U1: z.number().int().nonnegative(),
        U2: z.number().int().nonnegative(),
        U3: z.number().int().nonnegative(),
      })
      .strict(),
    accreditationActionCount: z.number().int().nonnegative(),
    certificateOfferAcceptanceCount: z.number().int().nonnegative(),
    certificateAlternativeRouteCount: z.number().int().nonnegative(),
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
export type OfferEvidenceUniversityClass = z.infer<
  typeof OfferEvidenceUniversityClassSchema
>;
export type OfferEvidenceUniversitySignal = z.infer<
  typeof OfferEvidenceUniversitySignalSchema
>;
export type OfferEvidenceCertificateRouteType = z.infer<
  typeof OfferEvidenceCertificateRouteTypeSchema
>;
export type OfferEvidenceCertificateEvidence = z.infer<
  typeof OfferEvidenceCertificateEvidenceSchema
>;
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
