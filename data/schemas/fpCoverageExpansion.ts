import { z } from "zod";

export const FpExpansionLevelSchema = z.enum([
  "basic",
  "intermediate",
  "higher",
  "specialization",
]);

export const FpExpansionSourceReadinessSchema = z.enum([
  "exact_program_to_cno",
  "exact_output_plus_cno",
  "output_only",
]);

export const FP_EXPANSION_RANKING_CONTRACT =
  "Primary and reserve positions indicate research priority order only; they do not indicate completion or publication readiness. Every output_only candidate is non-completable and non-publishable until classification evidence exists.";

export function canonicalizeFpQualificationIdentity(identity: string): string {
  return identity === "qualification:IFC03SD"
    ? "qualification:IFC03S"
    : identity;
}

export const FpExpansionCandidateEvidenceSchema = z
  .object({
    programKey: z.string().regex(/^[A-Z]{2,4}\d{2}[A-Z]{0,2}$/u),
    baseQualificationIdentity: z.string().trim().min(1),
    programTitle: z.string().trim().min(1),
    familyCode: z.string().trim().min(1),
    family: z.string().trim().min(1),
    level: FpExpansionLevelSchema,
    familySignalCount: z.number().int().nonnegative(),
    exactTitleSignalCount: z.number().int().nonnegative(),
    officialOutputLabels: z.array(z.string().trim().min(1)).min(1),
    sourceUrls: z.array(z.string().url()).min(2),
    classificationCandidates: z.array(z.string().trim().min(1)).min(1),
    collisionCount: z.number().int().nonnegative(),
    sourceReadiness: FpExpansionSourceReadinessSchema,
    selectionReason: z.string().trim().min(1),
  })
  .strict();

export const FpExpansionScoreTupleSchema = z.tuple([
  z.union([z.literal(0), z.literal(1)]),
  z.number().int().nonnegative(),
  z.number().int(),
  z.number().int(),
  z.string(),
]);

export const FpExpansionCandidateSchema =
  FpExpansionCandidateEvidenceSchema.extend({
    rank: z.number().int().positive(),
    scoreTuple: FpExpansionScoreTupleSchema,
  }).strict();

export const FpExpansionRankingSchema = z
  .object({
    primaryCandidates: z.array(FpExpansionCandidateSchema).length(7),
    reserveCandidates: z.array(FpExpansionCandidateSchema).min(7),
  })
  .strict()
  .superRefine((ranking, context) => {
    const candidates = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ];
    const bases = new Set<string>();
    for (const [index, candidate] of candidates.entries()) {
      const canonicalBase = canonicalizeFpQualificationIdentity(
        candidate.baseQualificationIdentity,
      );
      if (bases.has(canonicalBase)) {
        context.addIssue({
          code: "custom",
          path: [
            index < 7 ? "primaryCandidates" : "reserveCandidates",
            index < 7 ? index : index - 7,
          ],
          message: "Candidate base qualification identities must be unique.",
        });
      }
      bases.add(canonicalBase);
    }
    if (candidates.some((candidate, index) => candidate.rank !== index + 1)) {
      context.addIssue({
        code: "custom",
        message: "Candidate ranks must be contiguous and ordered.",
      });
    }
  });

export type FpExpansionCandidateEvidence = z.infer<
  typeof FpExpansionCandidateEvidenceSchema
>;
export type FpExpansionCandidate = z.infer<typeof FpExpansionCandidateSchema>;
export type FpExpansionRanking = z.infer<typeof FpExpansionRankingSchema>;
