import { z } from "zod";

export const FpCoverageResearchOutcomeEntrySchema = z
  .object({
    baseProgramKey: z.string().regex(/^[A-Z]{2,4}\d{2}[A-Z]{0,2}$/u),
    status: z.literal("reviewed-no-publishable-match"),
    reviewedAt: z.string().date(),
    occupationCatalogSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    sourcePath: z.string().min(1),
    proposalPath: z.string().min(1),
    frontierReviewPath: z.string().min(1),
    note: z.string().min(1),
  })
  .strict();

export const FpCoverageResearchOutcomesSchema = z
  .object({
    schemaVersion: z.literal(1),
    outcomes: z.array(FpCoverageResearchOutcomeEntrySchema).min(1),
  })
  .strict()
  .superRefine((document, context) => {
    const keys = new Set<string>();
    for (const [index, entry] of document.outcomes.entries()) {
      if (keys.has(entry.baseProgramKey)) {
        context.addIssue({
          code: "custom",
          path: ["outcomes", index, "baseProgramKey"],
          message: "baseProgramKey values must be unique across all outcomes.",
        });
      }
      keys.add(entry.baseProgramKey);
    }
  });

export type FpCoverageResearchOutcomeEntry = z.infer<
  typeof FpCoverageResearchOutcomeEntrySchema
>;
export type FpCoverageResearchOutcomes = z.infer<
  typeof FpCoverageResearchOutcomesSchema
>;
