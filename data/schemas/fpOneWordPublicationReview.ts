import { z } from "zod";

export const FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT = {
  snapshotId: "20260809014318761-5b22c488ce4b",
  resourcePath:
    "public/data/v1/snapshots/20260809014318761-5b22c488ce4b/job-offers.json",
  sha256: "5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba",
  recordCount: 1077,
} as const;

export const FP_ONE_WORD_PUBLICATION_REVIEW_ARTIFACT_PATH =
  "analysis/fp_one_word_publication_reviews.json" as const;

export const APPROVED_SINGLE_TOKEN_AUDIT_TUPLES = [
  {
    alias: "encofradores",
    occupationId: "occupation:cno11:7111",
    programKey: "EOC01M",
    matchPolicy: "approved_single_token",
  },
  {
    alias: "teleoperadores",
    occupationId: "occupation:cno11:4424",
    programKey: "COM01M",
    matchPolicy: "approved_single_token",
  },
] as const;

export const REVIEW_ROW_SCHEMA = z
  .object({
    candidateId: z.enum([
      "cocinero-s",
      "albanil-es",
      "encofradores",
      "teleoperadores",
    ]),
    form: z.enum([
      "cocinero",
      "cocineros",
      "albañil",
      "albañiles",
      "encofradores",
      "teleoperadores",
    ]),
    programKey: z.enum(["HOT01M", "EOC01M", "COM01M"]),
    occupationId: z.enum([
      "occupation:cno11:5110",
      "occupation:cno11:7111",
      "occupation:cno11:7121",
      "occupation:cno11:4424",
    ]),
    offerId: z.string().regex(/^\d+$/u),
    offerTitle: z.string().trim().min(1),
    disposition: z.enum(["accepted", "rejected", "needs_human_review"]),
    reasonCode: z.enum([
      "exact_occupation_title",
      "mixed_role",
      "contradictory_requirement",
      "degree_or_license_led",
      "outside_program_boundary",
      "insufficient_title_evidence",
    ]),
    rationale: z.string().trim().min(20).max(500),
    requirementQuotes: z.array(z.string().trim().min(3)).max(8),
  })
  .strict();

export const PUBLICATION_DECISION_SCHEMA = z
  .object({
    status: z.enum(["accepted", "rejected"]),
    acceptedOfferIds: z.array(z.string().regex(/^\d+$/u)),
    rejectedOfferIds: z.array(z.string().regex(/^\d+$/u)),
    reason: z.string().trim().min(1),
  })
  .strict();

export const FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    snapshotId: z.literal(FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId),
    rows: z.array(REVIEW_ROW_SCHEMA),
    publicationDecision: z
      .object({
        cocinero: PUBLICATION_DECISION_SCHEMA,
        cocineros: PUBLICATION_DECISION_SCHEMA,
        albañil: PUBLICATION_DECISION_SCHEMA,
        albañiles: PUBLICATION_DECISION_SCHEMA,
        encofradores: PUBLICATION_DECISION_SCHEMA,
        teleoperadores: PUBLICATION_DECISION_SCHEMA,
      })
      .strict(),
  })
  .strict();

export type ReviewRow = z.infer<typeof REVIEW_ROW_SCHEMA>;
export type FpOneWordPublicationReview = z.infer<
  typeof FP_ONE_WORD_PUBLICATION_REVIEW_SCHEMA
>;
