import { z } from "zod";

import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type RelationshipType,
} from "../../data/schemas/curatedMappings";
import {
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import {
  PublishedRequirementSchema,
  PublishedRequirementsResourceSchema,
} from "./requirements";

export const MatchRuleSchema = z.enum([
  "title_alias_exact",
  "title_alias_phrase",
  "published_qualification_exact",
  "human_override",
]);

const LinkEvidenceSchema = z
  .object({
    identity: z.string().min(1),
    trainingProgramKey: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
    sourceUrl: z.string().url(),
    sourceQuote: z.string().min(1),
  })
  .strict();

const AliasEvidenceSchema = z
  .object({
    identity: z.string().min(1),
    alias: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();

const RequirementEvidenceSchema = z
  .object({
    id: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
    sourceQuote: z.string().min(1),
  })
  .strict();

const offerMatchBase = {
  offerId: z.string().min(1),
  occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
  programKey: z.string().min(1),
  publishedAt: z.string().datetime(),
  relationshipType: z.enum(["official_output", "reviewed_relationship"]),
  linkEvidence: LinkEvidenceSchema,
  requirements: z.array(PublishedRequirementSchema),
} as const;

const AliasMatchSchema = z
  .object({
    ...offerMatchBase,
    matchRule: z.enum(["title_alias_exact", "title_alias_phrase"]),
    aliasEvidence: AliasEvidenceSchema,
  })
  .strict();

const QualificationMatchSchema = z
  .object({
    ...offerMatchBase,
    matchRule: z.literal("published_qualification_exact"),
    requirementEvidence: RequirementEvidenceSchema,
  })
  .strict();

const HumanOverrideMatchSchema = z
  .object({
    ...offerMatchBase,
    matchRule: z.literal("human_override"),
  })
  .strict();

export const OfferMatchSchema = z
  .discriminatedUnion("matchRule", [
    AliasMatchSchema,
    QualificationMatchSchema,
    HumanOverrideMatchSchema,
  ])
  .superRefine((match, context) => {
    if (
      match.linkEvidence.trainingProgramKey !== match.programKey ||
      match.linkEvidence.occupationId !== match.occupationId
    ) {
      context.addIssue({
        code: "custom",
        path: ["linkEvidence"],
        message:
          "Link evidence must identify the matched program and occupation.",
      });
    }
    if (
      "aliasEvidence" in match &&
      match.aliasEvidence.occupationId !== match.occupationId
    ) {
      context.addIssue({
        code: "custom",
        path: ["aliasEvidence", "occupationId"],
        message: "Alias evidence must identify the matched occupation.",
      });
    }
    if (
      "requirementEvidence" in match &&
      !match.requirements.some(
        (requirement) =>
          requirement.id === match.requirementEvidence.id &&
          requirement.sourceQuote === match.requirementEvidence.sourceQuote &&
          requirement.category === "qualification_or_specialization",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["requirementEvidence"],
        message:
          "Qualification evidence must reference a published requirement on the offer.",
      });
    }
  });

export const OfferMatchesSchema = z
  .array(OfferMatchSchema)
  .superRefine((matches, context) => {
    const offerIds = new Set<string>();
    matches.forEach((match, index) => {
      if (offerIds.has(match.offerId)) {
        context.addIssue({
          code: "custom",
          path: [index, "offerId"],
          message: "Offer match IDs must be unique.",
        });
      }
      offerIds.add(match.offerId);
    });
  });

const HumanOverrideSchema = z
  .object({
    offerId: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    confirmed: z.literal(true),
  })
  .strict();

const OfferMatchingDataSchema = z
  .object({
    programs: z.array(TrainingProgramSchema),
    occupations: OccupationsSchema,
    aliases: OccupationAliasesSchema,
    links: TrainingOccupationLinksSchema,
    offers: z.array(JobOfferSchema),
    publishedRequirements: PublishedRequirementsResourceSchema,
    humanOverrides: z.array(HumanOverrideSchema),
  })
  .strict();

export type OfferMatch = z.infer<typeof OfferMatchSchema>;
export type MatchRule = z.infer<typeof MatchRuleSchema>;
export type HumanOverride = z.infer<typeof HumanOverrideSchema>;
export type OfferMatchingData = z.input<typeof OfferMatchingDataSchema>;

function normalizedText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function isBoundedPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

function linkIdentity(link: {
  trainingProgramKey: string;
  occupationId: string;
  mappingVersion: string;
  sourceUrl: string;
}): string {
  return `link:${link.trainingProgramKey}:${link.occupationId}:${link.mappingVersion}:${encodeURIComponent(link.sourceUrl)}`;
}

function aliasIdentity(alias: {
  occupationId: string;
  alias: string;
  mappingVersion: string;
}): string {
  return `alias:${alias.occupationId}:${alias.mappingVersion}:${encodeURIComponent(normalizedText(alias.alias))}`;
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertUnique<T>(
  records: readonly T[],
  identity: (record: T) => string,
  label: string,
): void {
  const seen = new Set<string>();
  for (const record of records) {
    const id = identity(record);
    if (seen.has(id))
      throw new Error(`${label} identities must be unique: ${id}.`);
    seen.add(id);
  }
}

function validateRelationships(
  data: z.output<typeof OfferMatchingDataSchema>,
): void {
  assertUnique(data.programs, ({ programKey }) => programKey, "Program");
  assertUnique(
    data.occupations,
    ({ occupationId }) => occupationId,
    "Occupation",
  );
  assertUnique(data.offers, ({ id }) => id, "Offer");
  assertUnique(data.aliases, aliasIdentity, "Alias");
  assertUnique(data.links, linkIdentity, "Training link");

  const approvedOccupationIds = new Set(
    data.occupations
      .filter(({ reviewStatus }) => reviewStatus === "approved")
      .map(({ occupationId }) => occupationId),
  );
  for (const alias of data.aliases.filter(
    ({ reviewStatus }) => reviewStatus === "approved",
  )) {
    if (!approvedOccupationIds.has(alias.occupationId)) {
      throw new Error(
        `Approved alias has a dangling occupation: ${alias.alias}.`,
      );
    }
    if (normalizedText(alias.alias).split(" ").length < 2) {
      throw new Error(
        `Approved alias must contain more than one word: ${alias.alias}.`,
      );
    }
  }
  for (const link of data.links.filter(
    ({ reviewStatus }) => reviewStatus === "approved",
  )) {
    if (!approvedOccupationIds.has(link.occupationId)) {
      throw new Error(
        `Approved training link has a dangling occupation: ${link.occupationId}.`,
      );
    }
    if (
      !data.programs.some(
        ({ programKey }) => programKey === link.trainingProgramKey,
      )
    ) {
      throw new Error(
        `Approved training link has a dangling program: ${link.trainingProgramKey}.`,
      );
    }
  }

  const offerIds = new Set(data.offers.map(({ id }) => id));
  for (const entry of data.publishedRequirements) {
    if (!offerIds.has(entry.offerId)) {
      throw new Error(
        `Published requirements have a dangling offer: ${entry.offerId}.`,
      );
    }
  }

  const overridesByOffer = new Map<string, string>();
  for (const override of data.humanOverrides) {
    if (!offerIds.has(override.offerId)) {
      throw new Error(
        `Human override has a dangling offer: ${override.offerId}.`,
      );
    }
    const previous = overridesByOffer.get(override.offerId);
    if (previous !== undefined && previous !== override.occupationId) {
      throw new Error(
        `Human override has conflicting occupations: ${override.offerId}.`,
      );
    }
    if (previous === override.occupationId) {
      throw new Error(
        `Human override identities must be unique: ${override.offerId}.`,
      );
    }
    overridesByOffer.set(override.offerId, override.occupationId);
  }
}

interface Candidate {
  occupationId: string;
  matchRule: MatchRule;
  relationshipType: RelationshipType;
  link: z.output<typeof TrainingOccupationLinksSchema>[number];
  alias?: z.output<typeof OccupationAliasesSchema>[number];
  requirement?: z.output<typeof PublishedRequirementSchema>;
}

function candidateForOffer(
  programTitle: string,
  offer: z.output<typeof JobOfferSchema>,
  links: z.output<typeof TrainingOccupationLinksSchema>,
  aliases: z.output<typeof OccupationAliasesSchema>,
  requirements: z.output<typeof PublishedRequirementSchema>[],
  overrides: z.output<typeof HumanOverrideSchema>[],
): Candidate | undefined {
  const candidates: Candidate[] = [];
  for (const link of links) {
    const override = overrides.find(
      (item) =>
        item.offerId === offer.id && item.occupationId === link.occupationId,
    );
    if (override !== undefined) {
      candidates.push({
        occupationId: link.occupationId,
        matchRule: "human_override",
        relationshipType: link.relationshipType,
        link,
      });
      continue;
    }

    const qualification = requirements.find(
      (requirement) =>
        requirement.category === "qualification_or_specialization" &&
        normalizedText(requirement.normalizedValue) ===
          normalizedText(programTitle),
    );
    if (qualification !== undefined) {
      candidates.push({
        occupationId: link.occupationId,
        matchRule: "published_qualification_exact",
        relationshipType: link.relationshipType,
        link,
        requirement: qualification,
      });
      continue;
    }

    const title = normalizedText(offer.title);
    const matchingAliases = aliases
      .filter(({ occupationId }) => occupationId === link.occupationId)
      .map((alias) => ({ alias, normalized: normalizedText(alias.alias) }))
      .filter(({ normalized }) => isBoundedPhrase(title, normalized))
      .sort(
        (left, right) =>
          compareStable(left.normalized, right.normalized) ||
          compareStable(left.alias.mappingVersion, right.alias.mappingVersion),
      );
    const alias = matchingAliases[0];
    if (alias !== undefined) {
      candidates.push({
        occupationId: link.occupationId,
        matchRule:
          alias.normalized === title
            ? "title_alias_exact"
            : "title_alias_phrase",
        relationshipType: link.relationshipType,
        link,
        alias: alias.alias,
      });
    }
  }

  const occupationIds = new Set(
    candidates.map(({ occupationId }) => occupationId),
  );
  if (occupationIds.size > 1) {
    throw new Error(`Offer matches conflicting occupations: ${offer.id}.`);
  }
  return candidates[0];
}

/** Creates scoreless, quote-backed matches from approved curated relationships only. */
export function matchOffersForProgram(
  programKey: string,
  input: OfferMatchingData,
): OfferMatch[] {
  const data = OfferMatchingDataSchema.parse(input);
  validateRelationships(data);
  const program = data.programs.find((item) => item.programKey === programKey);
  if (program === undefined) return [];

  const approvedOccupationIds = new Set(
    data.occupations
      .filter(({ reviewStatus }) => reviewStatus === "approved")
      .map(({ occupationId }) => occupationId),
  );
  const links = data.links.filter(
    (link) =>
      link.reviewStatus === "approved" &&
      link.trainingProgramKey === programKey &&
      approvedOccupationIds.has(link.occupationId),
  );
  const aliases = data.aliases.filter(
    (alias) =>
      alias.reviewStatus === "approved" &&
      approvedOccupationIds.has(alias.occupationId),
  );
  const requirementsByOffer = new Map(
    data.publishedRequirements.map((entry) => [
      entry.offerId,
      entry.requirements,
    ]),
  );

  const matches = data.offers.flatMap((offer): OfferMatch[] => {
    const requirements = requirementsByOffer.get(offer.id) ?? [];
    const candidate = candidateForOffer(
      program.programTitle,
      offer,
      links,
      aliases,
      requirements,
      data.humanOverrides,
    );
    if (candidate === undefined) return [];

    const base = {
      offerId: offer.id,
      occupationId: candidate.occupationId,
      programKey,
      publishedAt: offer.publishedAt,
      relationshipType: candidate.relationshipType,
      linkEvidence: {
        identity: linkIdentity(candidate.link),
        trainingProgramKey: candidate.link.trainingProgramKey,
        occupationId: candidate.link.occupationId,
        mappingVersion: candidate.link.mappingVersion,
        sourceUrl: candidate.link.sourceUrl,
        sourceQuote: candidate.link.sourceQuote,
      },
      requirements,
    };
    if (candidate.matchRule === "human_override") {
      return [{ ...base, matchRule: candidate.matchRule }];
    }
    if (candidate.matchRule === "published_qualification_exact") {
      const requirement = candidate.requirement;
      if (requirement === undefined)
        throw new Error("Qualification evidence is required.");
      return [
        {
          ...base,
          matchRule: candidate.matchRule,
          requirementEvidence: {
            id: requirement.id,
            sourceQuote: requirement.sourceQuote,
          },
        },
      ];
    }
    const alias = candidate.alias;
    if (alias === undefined) throw new Error("Alias evidence is required.");
    return [
      {
        ...base,
        matchRule: candidate.matchRule,
        aliasEvidence: {
          identity: aliasIdentity(alias),
          alias: alias.alias,
          occupationId: alias.occupationId,
          mappingVersion: alias.mappingVersion,
        },
      },
    ];
  });

  return OfferMatchesSchema.parse(matches);
}
