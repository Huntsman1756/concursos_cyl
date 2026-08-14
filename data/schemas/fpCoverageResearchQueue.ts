import { z } from "zod";

export const FpCoverageResearchCandidateSchema = z
  .object({
    rank: z.number().int().positive(),
    baseProgramKey: z.string().min(1),
    programKeys: z.array(z.string().min(1)).min(1),
    programTitle: z.string().min(1),
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
    level: z.string().min(1),
    offeringCount: z.number().int().nonnegative(),
    provinceCount: z.number().int().nonnegative(),
    centerCount: z.number().int().nonnegative(),
    priorDraft: z.boolean(),
    priorityOnly: z.literal(true),
  })
  .strict();

export const FpCoverageResearchQueueSchema = z
  .object({
    snapshotGeneratedAt: z.string().datetime(),
    reviewedBaseCount: z.number().int().nonnegative(),
    completedNoMatchBaseCount: z.number().int().nonnegative(),
    pendingBaseCount: z.number().int().nonnegative(),
    contract: z.literal(
      "Training-offer signals prioritize official research only; they are not CNO evidence and never authorize publication.",
    ),
    candidates: z.array(FpCoverageResearchCandidateSchema),
  })
  .strict();

export type FpCoverageResearchCandidate = z.infer<
  typeof FpCoverageResearchCandidateSchema
>;
export type FpCoverageResearchQueue = z.infer<
  typeof FpCoverageResearchQueueSchema
>;
