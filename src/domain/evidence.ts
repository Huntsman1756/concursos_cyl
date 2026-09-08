import { z } from "zod";

import {
  OfferDisplayMatchSchema,
  type OfferDisplayMatch,
} from "./offerMatching";

export const SessionAnswerValueSchema = z.enum(["has", "lacks", "unsure"]);
export const SessionAnswersSchema = z.record(
  z.string().regex(/^requirement:[a-f0-9]{64}$/u),
  SessionAnswerValueSchema,
);

export const EvidenceStateSchema = z.enum([
  "explicit_fit",
  "occupational_relationship_incomplete",
  "declared_explicit_gap",
]);

export type SessionAnswerValue = z.infer<typeof SessionAnswerValueSchema>;
export type SessionAnswers = z.infer<typeof SessionAnswersSchema>;
export type EvidenceState = z.infer<typeof EvidenceStateSchema>;

/** Derives the evidence state from only the match's real requirement IDs. */
export function deriveEvidenceState(
  input: OfferDisplayMatch,
  answers: Readonly<Record<string, SessionAnswerValue>>,
): EvidenceState {
  const match = OfferDisplayMatchSchema.parse(input);
  const validatedAnswers = SessionAnswersSchema.parse(answers);
  if (
    match.requirements.some(
      (requirement) => validatedAnswers[requirement.id] === "lacks",
    )
  ) {
    return "declared_explicit_gap";
  }
  if (
    match.matchRule === "title_alias_exact" ||
    match.matchRule === "published_qualification_exact" ||
    match.matchRule === "human_override" ||
    match.matchRule === "reviewed_title_alias_exact" ||
    match.matchRule === "reviewed_title_alias_phrase" ||
    match.matchRule === "reviewed_published_qualification_exact" ||
    match.matchRule === "reviewed_exact_program_title"
  ) {
    return "explicit_fit";
  }
  return "occupational_relationship_incomplete";
}

const evidenceOrder: Record<EvidenceState, number> = {
  explicit_fit: 0,
  occupational_relationship_incomplete: 1,
  declared_explicit_gap: 2,
};

/** Applies the public evidence grouping without a relevance or compatibility score. */
export function orderOfferMatches(
  input: readonly OfferDisplayMatch[],
  answers: Readonly<Record<string, SessionAnswerValue>>,
): OfferDisplayMatch[] {
  const matches = input.map((match) => OfferDisplayMatchSchema.parse(match));
  const offerIds = new Set<string>();
  for (const match of matches) {
    if (offerIds.has(match.offerId)) {
      throw new Error(`Offer match IDs must be unique: ${match.offerId}.`);
    }
    offerIds.add(match.offerId);
  }
  return [...matches].sort((left, right) => {
    const stateDifference =
      evidenceOrder[deriveEvidenceState(left, answers)] -
      evidenceOrder[deriveEvidenceState(right, answers)];
    if (stateDifference !== 0) return stateDifference;
    if (left.publishedAt !== right.publishedAt) {
      return left.publishedAt < right.publishedAt ? 1 : -1;
    }
    return left.offerId < right.offerId
      ? -1
      : left.offerId > right.offerId
        ? 1
        : 0;
  });
}
