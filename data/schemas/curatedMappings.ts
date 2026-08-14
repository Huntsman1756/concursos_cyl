import { z } from "zod";

const HttpUrlSchema = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "HTTP(S) URL required");

export const RelationshipTypeSchema = z.enum([
  "official_output",
  "reviewed_relationship",
]);
export const ReviewStatusSchema = z.enum(["draft", "approved", "rejected"]);

export const OccupationSchema = z.object({
  occupationId: z.string().regex(/^occupation:[a-z0-9-]+$/),
  preferredLabel: z.string().trim().min(3),
  description: z.string().trim().min(12),
});

export const OccupationAliasSchema = z.object({
  occupationId: z.string().regex(/^occupation:[a-z0-9-]+$/),
  alias: z.string().trim().min(3),
  reviewStatus: ReviewStatusSchema,
  sourceUrl: HttpUrlSchema,
  reviewedAt: z.string().date(),
  mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export const TrainingOccupationLinkSchema = z.object({
  trainingProgramKey: z.string().trim().min(1),
  occupationId: z.string().regex(/^occupation:[a-z0-9-]+$/),
  relationshipType: RelationshipTypeSchema,
  reviewStatus: ReviewStatusSchema,
  sourceUrl: HttpUrlSchema,
  sourceQuote: z.string().trim().min(12),
  reviewedAt: z.string().date(),
  mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});

export type Occupation = z.infer<typeof OccupationSchema>;
export type OccupationAlias = z.infer<typeof OccupationAliasSchema>;
export type TrainingOccupationLink = z.infer<
  typeof TrainingOccupationLinkSchema
>;
