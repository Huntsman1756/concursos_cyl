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

type SearchFieldTokens = readonly [
  readonly string[],
  readonly string[],
  readonly string[],
];

interface OccupationSearchDocument {
  candidate: OccupationSearchCandidate;
  fields: SearchFieldTokens;
}

const FIELD_PRIORITIES = [4, 3, 2] as const;
const IDF_WEIGHT = 0.1;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function normalizedTokens(value: string): string[] {
  const normalized = normalizeSearchText(value);
  return normalized === "" ? [] : normalized.split(" ");
}

function uniqueTokens(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function fieldMatchesTerm(field: readonly string[], term: string): boolean {
  return field.some((token) => token.startsWith(term));
}

function matchingPriority(
  fields: SearchFieldTokens,
  term: string,
): number | undefined {
  // A term contributes once, using the highest-priority field when it appears
  // in more than one field; this makes duplicate evidence deterministic.
  for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex += 1) {
    if (fieldMatchesTerm(fields[fieldIndex], term)) {
      return FIELD_PRIORITIES[fieldIndex];
    }
  }
  return undefined;
}

function documentFrequency(
  documents: readonly OccupationSearchDocument[],
  term: string,
): number {
  return documents.reduce(
    (frequency, document) =>
      frequency +
      (document.fields.some((field) => fieldMatchesTerm(field, term)) ? 1 : 0),
    0,
  );
}

function idfContribution(documentCount: number, frequency: number): number {
  // A small bounded IDF bonus distinguishes rare terms without overruling
  // evidence priority. Searching is intentionally O(D × Q × T) over the
  // approved occupation documents (D), query terms (Q), and field tokens (T).
  const idf = Math.log1p((documentCount - frequency + 0.5) / (frequency + 0.5));
  return Math.min(0.75, idf * IDF_WEIGHT);
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
  const aliasesByOccupation = new Map<string, string[]>();
  for (const alias of aliases) {
    if (alias.reviewStatus !== "approved") continue;
    const occupationAliases = aliasesByOccupation.get(alias.occupationId);
    if (occupationAliases === undefined) {
      aliasesByOccupation.set(alias.occupationId, [alias.alias]);
    } else {
      occupationAliases.push(alias.alias);
    }
  }

  const documents: OccupationSearchDocument[] = occupations
    .filter((occupation) => occupation.reviewStatus === "approved")
    .map((occupation) => ({
      candidate: {
        occupationId: occupation.occupationId,
        preferredLabel: occupation.preferredLabel,
        confirmationLabel: occupation.confirmationLabel,
      },
      // Field order is an explicit evidence policy: aliases, confirmation,
      // then official preferred label. Alias input order never affects scores.
      fields: [
        uniqueTokens(
          (aliasesByOccupation.get(occupation.occupationId) ?? []).flatMap(
            normalizedTokens,
          ),
        ),
        uniqueTokens(normalizedTokens(occupation.confirmationLabel)),
        uniqueTokens(normalizedTokens(occupation.preferredLabel)),
      ],
    }));

  const labelCollator = new Intl.Collator("es-ES", { sensitivity: "base" });

  return {
    search(query) {
      const normalized = normalizeSearchText(query);
      if (normalized === "") return [];
      const terms = [...new Set(normalized.split(" "))];
      const frequencies = terms.map((term) =>
        documentFrequency(documents, term),
      );
      const scored: Array<{
        document: OccupationSearchDocument;
        score: number;
      }> = [];

      for (const document of documents) {
        let score = 0;
        let matchesEveryTerm = true;
        for (let termIndex = 0; termIndex < terms.length; termIndex += 1) {
          const priority = matchingPriority(document.fields, terms[termIndex]);
          if (priority === undefined) {
            matchesEveryTerm = false;
            break;
          }
          score +=
            priority +
            idfContribution(documents.length, frequencies[termIndex]);
        }
        if (matchesEveryTerm) scored.push({ document, score });
      }

      scored.sort((left, right) => {
        if (left.score !== right.score) return right.score - left.score;
        const labelOrder = labelCollator.compare(
          left.document.candidate.preferredLabel,
          right.document.candidate.preferredLabel,
        );
        if (labelOrder !== 0) return labelOrder;
        const leftId = left.document.candidate.occupationId;
        const rightId = right.document.candidate.occupationId;
        return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
      });

      return scored.slice(0, 30).map(({ document }) => document.candidate);
    },
  };
}
