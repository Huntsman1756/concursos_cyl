import { z } from "zod";

const SemanticVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/u);
const ReviewDateSchema = z.string().date();
const ReviewNoteSchema = z.string().trim().min(20).max(500).optional();

export const ReviewStatusSchema = z.enum(["draft", "approved", "rejected"]);
export const RelationshipTypeSchema = z.enum([
  "official_output",
  "reviewed_relationship",
]);

function requireDraftReviewNote(
  record: {
    reviewStatus: z.infer<typeof ReviewStatusSchema>;
    reviewNote?: string;
  },
  context: z.RefinementCtx,
): void {
  if (record.reviewStatus === "draft" && record.reviewNote === undefined) {
    context.addIssue({
      code: "custom",
      path: ["reviewNote"],
      message: "Draft curated records require an explicit review note.",
    });
  }
}

export const OccupationSchema = z
  .object({
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    preferredLabel: z.string().trim().min(3),
    confirmationLabel: z.string().trim().min(3),
    classificationSystem: z.literal("CNO-11"),
    classificationCode: z.string().regex(/^\d{4}$/u),
    reviewStatus: ReviewStatusSchema,
    sourceUrl: z.string().url(),
    reviewedAt: ReviewDateSchema,
    catalogVersion: SemanticVersionSchema,
    reviewNote: ReviewNoteSchema,
  })
  .strict()
  .superRefine((occupation, context) => {
    requireDraftReviewNote(occupation, context);
    if (
      !occupation.occupationId.endsWith(`:${occupation.classificationCode}`)
    ) {
      context.addIssue({
        code: "custom",
        path: ["occupationId"],
        message: "Occupation ID must contain its CNO-11 classification code.",
      });
    }
  });

export const OccupationAliasSchema = z
  .object({
    alias: z.string().trim().min(2),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    reviewStatus: ReviewStatusSchema,
    reviewedAt: ReviewDateSchema,
    mappingVersion: SemanticVersionSchema,
    reviewNote: ReviewNoteSchema,
  })
  .strict()
  .superRefine(requireDraftReviewNote);

export const TrainingOccupationLinkSchema = z
  .object({
    trainingProgramKey: z.string().trim().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    relationshipType: RelationshipTypeSchema,
    reviewStatus: ReviewStatusSchema,
    sourceUrl: z.string().url(),
    sourceQuote: z.string().trim().min(3).max(280),
    reviewedAt: ReviewDateSchema,
    mappingVersion: SemanticVersionSchema,
    reviewNote: ReviewNoteSchema,
  })
  .strict()
  .superRefine(requireDraftReviewNote);

const CoverageCountsShape = {
  approvedMappings: z.number().int().nonnegative(),
  draftMappings: z.number().int().nonnegative(),
  rejectedMappings: z.number().int().nonnegative(),
  uncoveredPrograms: z.number().int().nonnegative(),
};

export const ProgramMappingCoverageSchema = z
  .object({
    scope: z.literal("program"),
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
    ...CoverageCountsShape,
    coverageStatus: z.enum(["reviewed", "draft", "uncovered"]),
    coverageNote: z.string().min(1),
  })
  .strict();

export const FamilyMappingCoverageSchema = z
  .object({
    scope: z.literal("family"),
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
    programCount: z.number().int().nonnegative(),
    ...CoverageCountsShape,
    coverageNote: z.string().min(1),
  })
  .strict();

export const MappingCoverageSchema = z.discriminatedUnion("scope", [
  ProgramMappingCoverageSchema,
  FamilyMappingCoverageSchema,
]);

export const OccupationsSchema = z.array(OccupationSchema);
export const OccupationAliasesSchema = z.array(OccupationAliasSchema);
export const TrainingOccupationLinksSchema = z.array(
  TrainingOccupationLinkSchema,
);
export const MappingCoverageResourceSchema = z.array(MappingCoverageSchema);

export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;
export type Occupation = z.infer<typeof OccupationSchema>;
export type OccupationAlias = z.infer<typeof OccupationAliasSchema>;
export type TrainingOccupationLink = z.infer<
  typeof TrainingOccupationLinkSchema
>;
export type MappingCoverage = z.infer<typeof MappingCoverageSchema>;
