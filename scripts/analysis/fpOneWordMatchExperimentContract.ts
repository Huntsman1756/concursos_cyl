import { z } from "zod";

export const FP_ONE_WORD_SNAPSHOT_CONTRACT = {
  snapshotId: "20260809014318761-5b22c488ce4b",
  resourcePath:
    "public/data/v1/snapshots/20260809014318761-5b22c488ce4b/job-offers.json",
  sha256: "5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba",
  recordCount: 1077,
} as const;

export const APPROVED_ONE_WORD_CANDIDATES = [
  {
    candidateId: "cocinero-s",
    programKey: "HOT01M",
    occupationId: "occupation:cno11:5110",
    forms: ["cocinero", "cocineros"],
  },
  {
    candidateId: "albanil-es",
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7121",
    forms: ["albañil", "albañiles"],
  },
  {
    candidateId: "encofradores",
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7111",
    forms: ["encofradores"],
  },
] as const;

export const OneWordOfferSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

export const OneWordCandidateSchema = z
  .object({
    candidateId: z.enum(["cocinero-s", "albanil-es", "encofradores"]),
    programKey: z.enum(["HOT01M", "EOC01M"]),
    occupationId: z.enum([
      "occupation:cno11:5110",
      "occupation:cno11:7111",
      "occupation:cno11:7121",
    ]),
    forms: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const OneWordCandidateResultSchema = z
  .object({
    candidateId: OneWordCandidateSchema.shape.candidateId,
    programKey: OneWordCandidateSchema.shape.programKey,
    occupationId: OneWordCandidateSchema.shape.occupationId,
    matchedOfferIds: z.array(z.string().min(1)),
    matchedTitles: z.array(z.string().min(1)),
  })
  .strict();

export const OneWordUnionResultSchema = z
  .object({
    matchedOfferIds: z.array(z.string().min(1)),
    matchCount: z.number().int().nonnegative(),
  })
  .strict();

export type OneWordOffer = z.infer<typeof OneWordOfferSchema>;
export type OneWordCandidate = z.infer<typeof OneWordCandidateSchema>;
export type OneWordCandidateResult = z.infer<
  typeof OneWordCandidateResultSchema
>;
export type OneWordUnionResult = z.infer<typeof OneWordUnionResultSchema>;
