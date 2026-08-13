import { z } from "zod";

const ReviewBaseSchema = z.object({
  alias: z.string().trim().min(2),
  occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
  programKeys: z.array(z.string().trim().min(1)).min(1),
  marginalOfferIds: z.array(z.string().trim().min(1)).min(1),
  classificationSourceUrl: z.string().url().startsWith("https://"),
  classificationSourceQuote: z.string().trim().min(2).max(500),
  programSourceUrl: z.string().url().startsWith("https://"),
  programSourceQuote: z.string().trim().min(2).max(500),
  reviewedAt: z.string().date(),
});

export const FpMarginalAliasReviewRowSchema = z.discriminatedUnion(
  "disposition",
  [
    ReviewBaseSchema.extend({
      disposition: z.literal("accepted"),
      reasonCode: z.enum([
        "literal_official_classification",
        "literal_boe_program_output",
        "bounded_official_offer_title",
      ]),
    }).strict(),
    ReviewBaseSchema.extend({
      disposition: z.literal("deferred"),
      reasonCode: z.literal("single_token_audit_required"),
      reviewNote: z.string().trim().min(20).max(500),
    }).strict(),
    ReviewBaseSchema.extend({
      disposition: z.literal("rejected"),
      reasonCode: z.literal("semantic_boundary_mismatch"),
      reviewNote: z.string().trim().min(20).max(500),
    }).strict(),
  ],
);

export const FpMarginalAliasReviewSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    snapshotId: z.string().min(1),
    rows: z.array(FpMarginalAliasReviewRowSchema).min(1),
  })
  .strict()
  .superRefine((artifact, context) => {
    const identities = new Set<string>();
    for (const [index, row] of artifact.rows.entries()) {
      const identity = `${row.alias}\u0000${row.occupationId}`;
      if (identities.has(identity)) {
        context.addIssue({
          code: "custom",
          path: ["rows", index],
          message: "Alias review identities must be unique.",
        });
      }
      identities.add(identity);
    }
  });

export type FpMarginalAliasReview = z.infer<typeof FpMarginalAliasReviewSchema>;
