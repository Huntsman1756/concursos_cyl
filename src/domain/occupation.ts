import MiniSearch from "minisearch";

import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export type { Occupation, OccupationAlias, TrainingOccupationLink };

export interface CuratedMappings {
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
}

export interface ApprovedMappings {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
}

export interface OccupationSearchCandidate {
  occupationId: string;
  preferredLabel: string;
  confirmationLabel: string;
}

interface OccupationSearchDocument extends OccupationSearchCandidate {
  searchText: string;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function compareCandidates(
  left: OccupationSearchCandidate,
  right: OccupationSearchCandidate,
): number {
  return (
    left.preferredLabel.localeCompare(right.preferredLabel, "es") ||
    left.occupationId.localeCompare(right.occupationId)
  );
}

export function loadApprovedMappings(
  mappings: CuratedMappings,
): ApprovedMappings {
  const occupations = mappings.occupations.filter(
    (occupation) => occupation.reviewStatus === "approved",
  );
  const approvedIds = new Set(
    occupations.map((occupation) => occupation.occupationId),
  );
  return {
    occupations: [...occupations],
    aliases: mappings.aliases.filter(
      (alias) =>
        alias.reviewStatus === "approved" &&
        approvedIds.has(alias.occupationId),
    ),
    links: mappings.links.filter(
      (link) =>
        link.reviewStatus === "approved" && approvedIds.has(link.occupationId),
    ),
  };
}

export function buildOccupationIndex(
  occupations: readonly Occupation[],
  aliases: readonly OccupationAlias[],
): { search: (query: string) => OccupationSearchCandidate[] } {
  const approvedOccupations = occupations.filter(
    (occupation) => occupation.reviewStatus === "approved",
  );
  const aliasesByOccupation = new Map<string, string[]>();
  for (const alias of aliases) {
    if (alias.reviewStatus !== "approved") continue;
    aliasesByOccupation.set(alias.occupationId, [
      ...(aliasesByOccupation.get(alias.occupationId) ?? []),
      alias.alias,
    ]);
  }

  const documents: OccupationSearchDocument[] = approvedOccupations.map(
    (occupation) => ({
      occupationId: occupation.occupationId,
      preferredLabel: occupation.preferredLabel,
      confirmationLabel: occupation.confirmationLabel,
      searchText: [
        occupation.preferredLabel,
        ...(aliasesByOccupation.get(occupation.occupationId) ?? []),
      ]
        .map(normalizeSearchText)
        .join(" "),
    }),
  );
  const index = new MiniSearch<OccupationSearchDocument>({
    idField: "occupationId",
    fields: ["searchText"],
    storeFields: ["occupationId", "preferredLabel", "confirmationLabel"],
    processTerm: normalizeSearchText,
  });
  index.addAll(documents);

  return {
    search(query) {
      const normalized = normalizeSearchText(query);
      if (normalized.length === 0) return [];
      return index
        .search(normalized, { combineWith: "AND", prefix: true })
        .map((result) => ({
          occupationId: String(result.occupationId),
          preferredLabel: String(result.preferredLabel),
          confirmationLabel: String(result.confirmationLabel),
        }))
        .sort(compareCandidates);
    },
  };
}
