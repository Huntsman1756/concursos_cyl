import { z } from "zod";

export const TARGET_ALIAS_PROGRAMS = ["HOT01M", "SSC01M", "EOC01M"] as const;

export const TARGET_OCCUPATIONS_BY_PROGRAM = {
  HOT01M: ["occupation:cno11:5110"],
  SSC01M: ["occupation:cno11:5629", "occupation:cno11:5710"],
  EOC01M: [
    "occupation:cno11:7111",
    "occupation:cno11:7121",
    "occupation:cno11:7193",
    "occupation:cno11:7240",
    "occupation:cno11:7291",
  ],
} as const;

export const AliasReasonCodeSchema = z.enum([
  "literal_ine_classification",
  "literal_sepe_classification",
  "official_evidence_absent",
  "official_evidence_indirect",
  "normalized_collision",
  "cross_occupation_conflict",
  "matcher_policy_one_word",
  "semantic_broadening",
]);

const OfficialAliasReviewBaseSchema = z.object({
  alias: z.string().trim().min(2),
  occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
  sourceUrl: z.string().url().startsWith("https://"),
  sourceQuote: z.string().trim().min(2).max(500),
  acceptedProgramOutputLabel: z.string().trim().min(2).max(280),
  acceptedProgramOutputSourceUrl: z.string().url().startsWith("https://"),
  acceptedProgramOutputSourceQuote: z.string().trim().min(2).max(280),
  reviewedAt: z.string().date(),
});

export const OfficialAliasReviewSchema = z.discriminatedUnion("disposition", [
  OfficialAliasReviewBaseSchema.extend({
    disposition: z.literal("accepted"),
    reasonCode: z.enum([
      "literal_ine_classification",
      "literal_sepe_classification",
    ]),
  }).strict(),
  OfficialAliasReviewBaseSchema.extend({
    disposition: z.literal("rejected"),
    reasonCode: z.enum([
      "official_evidence_absent",
      "official_evidence_indirect",
      "normalized_collision",
      "cross_occupation_conflict",
      "matcher_policy_one_word",
      "semantic_broadening",
    ]),
    reviewNote: z.string().trim().min(20).max(500),
  }).strict(),
]);

export const ProgramOfficialAliasReviewSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    programKey: z.enum(TARGET_ALIAS_PROGRAMS),
    baselineSnapshotId: z.literal("20260808215403108-add4c517860c"),
    reviews: z.array(OfficialAliasReviewSchema).min(1),
  })
  .strict();

export const ProgramAliasPassResultSchema = z
  .object({
    programKey: z.enum(TARGET_ALIAS_PROGRAMS),
    beforeOfferCount: z.literal(0),
    afterOfferCount: z.number().int().nonnegative(),
    newlyReachedOfferIds: z.array(z.string().min(1)),
  })
  .strict();

export const FpOfficialAliasPassResultsSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    baselineSnapshotId: z.literal("20260808215403108-add4c517860c"),
    acceptedAliasCount: z.number().int().nonnegative(),
    rejectedAliasCount: z.number().int().nonnegative(),
    programs: z.array(ProgramAliasPassResultSchema).length(3),
    newlyReachedOfferUnionCount: z.number().int().nonnegative(),
    newlyReachedOfferUnionIds: z.array(z.string().min(1)),
    nonTargetProgramDeltas: z.tuple([]),
  })
  .strict();

export type ProgramOfficialAliasReview = z.infer<
  typeof ProgramOfficialAliasReviewSchema
>;
export type FpOfficialAliasPassResults = z.infer<
  typeof FpOfficialAliasPassResultsSchema
>;
