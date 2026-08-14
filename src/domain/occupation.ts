import {
  OccupationAliasSchema,
  OccupationSchema,
  TrainingOccupationLinkSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export {
  OccupationAliasSchema,
  OccupationSchema,
  TrainingOccupationLinkSchema,
};
export type { Occupation, OccupationAlias, TrainingOccupationLink };

export interface OccupationSearchResult {
  occupationId: string;
  preferredLabel: string;
  matchedAlias: string;
}

export interface OccupationIndex {
  search(query: string): OccupationSearchResult[];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

export function buildOccupationIndex(
  occupations: Occupation[],
  aliases: OccupationAlias[],
): OccupationIndex {
  const labels = new Map(occupations.map((item) => [item.occupationId, item]));
  const entries = occupations.flatMap((occupation) => [
    {
      occupationId: occupation.occupationId,
      preferredLabel: occupation.preferredLabel,
      matchedAlias: occupation.preferredLabel,
      normalized: normalize(occupation.preferredLabel),
    },
    ...aliases
      .filter((alias) => alias.occupationId === occupation.occupationId)
      .filter((alias) => alias.reviewStatus === "approved")
      .map((alias) => ({
        occupationId: occupation.occupationId,
        preferredLabel: occupation.preferredLabel,
        matchedAlias: alias.alias,
        normalized: normalize(alias.alias),
      })),
  ]);

  return {
    search(query) {
      const normalizedQuery = normalize(query);
      if (!normalizedQuery) return [];
      return entries
        .filter(
          (entry) =>
            entry.normalized === normalizedQuery ||
            entry.normalized.includes(normalizedQuery) ||
            normalizedQuery.includes(entry.normalized),
        )
        .filter((entry) => labels.has(entry.occupationId))
        .sort((left, right) => {
          const leftExact = left.normalized === normalizedQuery ? 0 : 1;
          const rightExact = right.normalized === normalizedQuery ? 0 : 1;
          return (
            leftExact - rightExact ||
            left.preferredLabel.localeCompare(right.preferredLabel, "es")
          );
        })
        .map((result) => ({
          occupationId: result.occupationId,
          preferredLabel: result.preferredLabel,
          matchedAlias: result.matchedAlias,
        }))
        .filter(
          (result, index, all) =>
            all.findIndex(
              (candidate) => candidate.occupationId === result.occupationId,
            ) === index,
        );
    },
  };
}
