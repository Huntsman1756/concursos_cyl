import { z } from "zod";

import {
  OfferMatchSchema,
  OfferMatchesSchema,
  type OfferMatch,
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
  input: OfferMatch,
  answers: Readonly<Record<string, SessionAnswerValue>>,
): EvidenceState {
  const match = OfferMatchSchema.parse(input);
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
    match.matchRule === "human_override"
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
  input: readonly OfferMatch[],
  answers: Readonly<Record<string, SessionAnswerValue>>,
): OfferMatch[] {
  const matches = OfferMatchesSchema.parse(input);
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
