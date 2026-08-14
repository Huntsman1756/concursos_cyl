import type { PublishedRequirement } from "../../data/schemas/generated";
import type { OfferMatch } from "./offerMatching";

export type SessionAnswer = "has" | "lacks" | "unsure";
export type SessionAnswers = Record<string, SessionAnswer>;

export type EvidenceState =
  | "explicit_fit"
  | "occupational_relationship_incomplete"
  | "declared_explicit_gap";

function hasDeclaredGap(
  requirements: PublishedRequirement[],
  answers: SessionAnswers,
): boolean {
  return requirements.some(
    (requirement) =>
      answers[requirement.id] === "lacks" && Boolean(requirement.id),
  );
}

export function deriveEvidenceState(
  match: OfferMatch,
  answers: SessionAnswers,
): EvidenceState {
  if (hasDeclaredGap(match.publishedRequirements, answers)) {
    return "declared_explicit_gap";
  }
  if (
    match.matchRule === "title_alias_exact" ||
    match.publishedRequirements.some(
      (requirement) =>
        requirement.category === "qualification_or_specialization",
    )
  ) {
    return "explicit_fit";
  }
  return "occupational_relationship_incomplete";
}
