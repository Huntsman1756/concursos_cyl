import type {
  JobOffer,
  PublishedRequirement,
} from "../../data/schemas/generated";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export type MatchRule =
  | "title_alias_exact"
  | "title_alias_phrase"
  | "published_qualification_exact"
  | "human_override";

export interface MatchingData {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
  offers: JobOffer[];
}

export interface OfferMatch {
  offerId: string;
  occupationId: string;
  relationshipType: TrainingOccupationLink["relationshipType"];
  matchRule: MatchRule;
  matchEvidence: string;
  sourceUrl: string;
  offer: JobOffer;
  publishedRequirements: PublishedRequirement[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function containsWholePhrase(title: string, phrase: string): boolean {
  return ` ${title} `.includes(` ${phrase} `);
}

function publicationTime(offer: JobOffer): number {
  return offer.publishedAt ? Date.parse(offer.publishedAt) : 0;
}

export function matchOffersForProgram(
  programKey: string,
  data: MatchingData,
): OfferMatch[] {
  const occupationIds = new Map(
    data.occupations.map((occupation) => [occupation.occupationId, occupation]),
  );
  const aliasesByOccupation = new Map<string, OccupationAlias[]>();
  for (const alias of data.aliases) {
    if (alias.reviewStatus !== "approved") continue;
    const aliases = aliasesByOccupation.get(alias.occupationId) ?? [];
    aliases.push(alias);
    aliasesByOccupation.set(alias.occupationId, aliases);
  }
  const matches: OfferMatch[] = [];

  for (const link of data.links) {
    if (
      link.reviewStatus !== "approved" ||
      link.trainingProgramKey !== programKey
    ) {
      continue;
    }
    if (!occupationIds.has(link.occupationId)) continue;
    const aliases = aliasesByOccupation.get(link.occupationId) ?? [];

    for (const offer of data.offers) {
      const title = normalize(offer.title);
      const aliasMatches = aliases
        .map((alias) => ({ alias, value: normalize(alias.alias) }))
        .filter(({ value }) => value && containsWholePhrase(title, value));
      const exactAlias = aliasMatches.find(({ value }) => value === title);
      const phraseAlias = aliasMatches[0];
      let matchRule: MatchRule | null = null;
      let matchEvidence = "";

      if (exactAlias) {
        matchRule = "title_alias_exact";
        matchEvidence = exactAlias.alias.alias;
      } else if (phraseAlias) {
        matchRule = "title_alias_phrase";
        matchEvidence = phraseAlias.alias.alias;
      } else {
        const qualification = offer.publishedRequirements.find(
          (requirement) =>
            requirement.category === "qualification_or_specialization" &&
            containsWholePhrase(
              normalize(requirement.sourceQuote),
              normalize(link.trainingProgramKey),
            ),
        );
        if (qualification) {
          matchRule = "published_qualification_exact";
          matchEvidence = qualification.sourceQuote;
        }
      }

      if (!matchRule) continue;
      matches.push({
        offerId: offer.id,
        occupationId: link.occupationId,
        relationshipType: link.relationshipType,
        matchRule,
        matchEvidence,
        sourceUrl: link.sourceUrl,
        offer,
        publishedRequirements: offer.publishedRequirements,
      });
    }
  }

  return matches.sort(
    (left, right) =>
      publicationTime(right.offer) - publicationTime(left.offer) ||
      left.offerId.localeCompare(right.offerId),
  );
}
