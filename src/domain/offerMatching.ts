import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { z } from "zod";

import {
  ProgramQualificationLinkSchema,
  ProgramQualificationLinksSchema,
  REVIEWED_PROGRAM_QUALIFICATION_LINKS,
  programQualificationLinkIdentity,
  type ProgramQualificationLink,
} from "../../data/catalogs/reviewedProgramQualifications";
import {
  REVIEWED_QUALIFICATIONS,
  ReviewedQualificationSchema,
  ReviewedQualificationsCatalogSchema,
  type ReviewedQualification,
} from "../../data/catalogs/reviewedQualifications";
import {
  OccupationAliasSchema,
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinkSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type RelationshipType,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  JobOfferSchema,
  TrainingProgramSchema,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import {
  PublishedRequirementSchema,
  PublishedRequirementsResourceSchema,
  publishedRequirementId,
  type OfferPublishedRequirements,
  type PublishedRequirement,
} from "./requirements";

export const MatchRuleSchema = z.enum([
  "title_alias_exact",
  "title_alias_phrase",
  "published_qualification_exact",
  "human_override",
]);

export type MatchRule = z.infer<typeof MatchRuleSchema>;

function auditIdentity(prefix: string, fields: readonly string[]): string {
  return `${prefix}:${bytesToHex(sha256(utf8ToBytes(fields.join("\u0000"))))}`;
}

function optionalField(value: string | undefined): string {
  return value ?? "";
}

export function trainingLinkEvidenceIdentity(
  link: TrainingOccupationLink,
): string {
  return auditIdentity("training-link", [
    link.trainingProgramKey,
    link.occupationId,
    link.relationshipType,
    link.reviewStatus,
    link.sourceUrl,
    link.sourceQuote,
    link.reviewedAt,
    link.mappingVersion,
    optionalField(link.reviewNote),
  ]);
}

export function aliasEvidenceIdentity(alias: OccupationAlias): string {
  return auditIdentity("occupation-alias", [
    alias.alias,
    alias.occupationId,
    alias.reviewStatus,
    alias.reviewedAt,
    alias.mappingVersion,
    optionalField(alias.reviewNote),
  ]);
}

const HumanConfirmationCoreSchema = z
  .object({
    offerId: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    confirmed: z.literal(true),
    confirmationSource: z.literal("user_in_memory"),
    schemaVersion: z.literal("1.0.0"),
  })
  .strict();

type HumanConfirmationCore = z.infer<typeof HumanConfirmationCoreSchema>;

export function humanConfirmationIdentity(
  confirmation: HumanConfirmationCore,
): string {
  const parsed = HumanConfirmationCoreSchema.parse({
    offerId: confirmation.offerId,
    occupationId: confirmation.occupationId,
    confirmed: confirmation.confirmed,
    confirmationSource: confirmation.confirmationSource,
    schemaVersion: confirmation.schemaVersion,
  });
  return auditIdentity("confirmation", [
    parsed.offerId,
    parsed.occupationId,
    String(parsed.confirmed),
    parsed.confirmationSource,
    parsed.schemaVersion,
  ]);
}

export const HumanConfirmationSchema = HumanConfirmationCoreSchema.safeExtend({
  identity: z.string().regex(/^confirmation:[a-f0-9]{64}$/u),
}).superRefine((confirmation, context) => {
  if (confirmation.identity !== humanConfirmationIdentity(confirmation)) {
    context.addIssue({
      code: "custom",
      path: ["identity"],
      message: "Human confirmation identity must match its payload.",
    });
  }
});

export type HumanConfirmation = z.infer<typeof HumanConfirmationSchema>;

export function createHumanConfirmation(input: {
  offerId: string;
  occupationId: string;
  confirmationSource: "user_in_memory";
}): HumanConfirmation {
  const core = HumanConfirmationCoreSchema.parse({
    ...input,
    confirmed: true,
    schemaVersion: "1.0.0",
  });
  return HumanConfirmationSchema.parse({
    ...core,
    identity: humanConfirmationIdentity(core),
  });
}

const TrainingLinkEvidenceSchema = z
  .object({
    identity: z.string().regex(/^training-link:[a-f0-9]{64}$/u),
    payload: TrainingOccupationLinkSchema,
  })
  .strict()
  .superRefine((evidence, context) => {
    if (evidence.payload.reviewStatus !== "approved") {
      context.addIssue({
        code: "custom",
        path: ["payload", "reviewStatus"],
        message: "Training link evidence must be approved.",
      });
    }
    if (evidence.identity !== trainingLinkEvidenceIdentity(evidence.payload)) {
      context.addIssue({
        code: "custom",
        path: ["identity"],
        message: "Training link evidence identity must match its full payload.",
      });
    }
  });

const AliasEvidenceSchema = z
  .object({
    identity: z.string().regex(/^occupation-alias:[a-f0-9]{64}$/u),
    payload: OccupationAliasSchema,
  })
  .strict()
  .superRefine((evidence, context) => {
    if (evidence.payload.reviewStatus !== "approved") {
      context.addIssue({
        code: "custom",
        path: ["payload", "reviewStatus"],
        message: "Alias evidence must be approved.",
      });
    }
    if (evidence.identity !== aliasEvidenceIdentity(evidence.payload)) {
      context.addIssue({
        code: "custom",
        path: ["identity"],
        message: "Alias evidence identity must match its full payload.",
      });
    }
  });

const ProgramQualificationEvidenceSchema = z
  .object({
    identity: z.string().regex(/^program-qualification-link:[a-f0-9]{64}$/u),
    payload: ProgramQualificationLinkSchema,
  })
  .strict()
  .superRefine((evidence, context) => {
    if (evidence.payload.reviewStatus !== "approved") {
      context.addIssue({
        code: "custom",
        path: ["payload", "reviewStatus"],
        message: "Program qualification evidence must be approved.",
      });
    }
    if (
      evidence.identity !== evidence.payload.identity ||
      evidence.identity !== programQualificationLinkIdentity(evidence.payload)
    ) {
      context.addIssue({
        code: "custom",
        path: ["identity"],
        message:
          "Program qualification evidence identity must match its full payload.",
      });
    }
  });

const QualificationEvidenceSchema = z
  .object({
    offerId: z.string().min(1),
    requirementId: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
    sourceQuote: z.string().min(1),
    normalizedValue: z.string().min(1),
    qualificationIdentity: z.string().regex(/^qualification:[a-z0-9-]+$/u),
    qualification: ReviewedQualificationSchema,
    programQualificationLink: ProgramQualificationEvidenceSchema,
  })
  .strict();

const offerMatchBase = {
  offerId: z.string().min(1),
  occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
  programKey: z.string().min(1),
  publishedAt: z.string().datetime(),
  relationshipType: z.enum(["official_output", "reviewed_relationship"]),
  linkEvidence: TrainingLinkEvidenceSchema,
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
    qualificationEvidence: QualificationEvidenceSchema,
  })
  .strict();

const HumanOverrideMatchSchema = z
  .object({
    ...offerMatchBase,
    matchRule: z.literal("human_override"),
    confirmationEvidence: HumanConfirmationSchema,
  })
  .strict();

export const OfferMatchSchema = z
  .discriminatedUnion("matchRule", [
    AliasMatchSchema,
    QualificationMatchSchema,
    HumanOverrideMatchSchema,
  ])
  .superRefine((match, context) => {
    const trainingLink = match.linkEvidence.payload;
    if (
      trainingLink.trainingProgramKey !== match.programKey ||
      trainingLink.occupationId !== match.occupationId ||
      trainingLink.relationshipType !== match.relationshipType
    ) {
      context.addIssue({
        code: "custom",
        path: ["linkEvidence"],
        message:
          "Training link evidence must identify the matched relationship.",
      });
    }

    for (const [index, requirement] of match.requirements.entries()) {
      if (
        requirement.id !==
        publishedRequirementId(
          match.offerId,
          requirement.category,
          requirement.sourceQuote,
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["requirements", index, "id"],
          message: "Requirement identity must be tied to the matched offer.",
        });
      }
    }

    if (
      "aliasEvidence" in match &&
      match.aliasEvidence.payload.occupationId !== match.occupationId
    ) {
      context.addIssue({
        code: "custom",
        path: ["aliasEvidence", "payload", "occupationId"],
        message: "Alias evidence must identify the matched occupation.",
      });
    }

    if (match.matchRule === "published_qualification_exact") {
      const evidence = match.qualificationEvidence;
      const closedQualification = REVIEWED_QUALIFICATIONS.find(
        ({ catalogId }) => catalogId === evidence.qualification.catalogId,
      );
      const requirement = match.requirements.find(
        ({ id }) => id === evidence.requirementId,
      );
      if (
        evidence.offerId !== match.offerId ||
        requirement?.category !== "qualification_or_specialization" ||
        requirement.sourceQuote !== evidence.sourceQuote ||
        requirement.normalizedValue !== evidence.normalizedValue
      ) {
        context.addIssue({
          code: "custom",
          path: ["qualificationEvidence"],
          message:
            "Qualification evidence must identify an exact requirement on the matched offer.",
        });
      }
      const programLink = evidence.programQualificationLink.payload;
      if (
        evidence.qualificationIdentity !== evidence.qualification.catalogId ||
        evidence.normalizedValue !== evidence.qualification.canonicalLabel ||
        programLink.programKey !== match.programKey ||
        programLink.qualificationCatalogId !== evidence.qualification.catalogId
      ) {
        context.addIssue({
          code: "custom",
          path: ["qualificationEvidence"],
          message:
            "Qualification evidence must follow the reviewed program and qualification identity.",
        });
      }
      if (
        closedQualification === undefined ||
        closedQualification.canonicalLabel !==
          evidence.qualification.canonicalLabel ||
        closedQualification.reviewedAt !== evidence.qualification.reviewedAt ||
        closedQualification.reviewBasis !==
          evidence.qualification.reviewBasis ||
        closedQualification.acceptedLabels.length !==
          evidence.qualification.acceptedLabels.length ||
        closedQualification.acceptedLabels.some(
          (label, index) =>
            label !== evidence.qualification.acceptedLabels[index],
        )
      ) {
        context.addIssue({
          code: "custom",
          path: ["qualificationEvidence", "qualification"],
          message:
            "Qualification evidence must use the closed reviewed catalog.",
        });
      }
    }

    if (
      match.matchRule === "human_override" &&
      (match.confirmationEvidence.offerId !== match.offerId ||
        match.confirmationEvidence.occupationId !== match.occupationId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["confirmationEvidence"],
        message:
          "Human confirmation must identify the matched offer and occupation.",
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

export type OfferMatch = z.infer<typeof OfferMatchSchema>;

const OfferMatchingDataSchema = z
  .object({
    programs: z.array(TrainingProgramSchema),
    qualifications: ReviewedQualificationsCatalogSchema,
    programQualificationLinks: ProgramQualificationLinksSchema,
    occupations: OccupationsSchema,
    aliases: OccupationAliasesSchema,
    links: TrainingOccupationLinksSchema,
    offers: z.array(JobOfferSchema),
    publishedRequirements: PublishedRequirementsResourceSchema,
    humanOverrides: z.array(HumanConfirmationSchema),
  })
  .strict();

export interface OfferMatchingData {
  programs: readonly TrainingProgram[];
  qualifications: readonly ReviewedQualification[];
  programQualificationLinks: readonly ProgramQualificationLink[];
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
  offers: readonly JobOffer[];
  publishedRequirements: readonly OfferPublishedRequirements[];
  humanOverrides: readonly HumanConfirmation[];
}

function parseData(input: OfferMatchingData) {
  return OfferMatchingDataSchema.parse({
    programs: [...input.programs],
    qualifications: [...input.qualifications],
    programQualificationLinks: [...input.programQualificationLinks],
    occupations: [...input.occupations],
    aliases: [...input.aliases],
    links: [...input.links],
    offers: [...input.offers],
    publishedRequirements: input.publishedRequirements.map((entry) => ({
      offerId: entry.offerId,
      requirements: [...entry.requirements],
    })),
    humanOverrides: [...input.humanOverrides],
  });
}

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

function validateRelationships(data: ReturnType<typeof parseData>): void {
  assertUnique(data.programs, ({ programKey }) => programKey, "Program");
  assertUnique(
    data.occupations,
    ({ occupationId }) => occupationId,
    "Occupation",
  );
  assertUnique(data.offers, ({ id }) => id, "Offer");
  assertUnique(data.aliases, aliasEvidenceIdentity, "Alias");
  assertUnique(data.links, trainingLinkEvidenceIdentity, "Training link");

  const programKeys = new Set(
    data.programs.map(({ programKey }) => programKey),
  );
  const qualificationIds = new Set(
    data.qualifications.map(({ catalogId }) => catalogId),
  );
  for (const link of data.programQualificationLinks) {
    if (!programKeys.has(link.programKey)) {
      throw new Error(
        `Program qualification link has a dangling program: ${link.programKey}.`,
      );
    }
    if (!qualificationIds.has(link.qualificationCatalogId)) {
      throw new Error(
        `Program qualification link has a dangling qualification: ${link.qualificationCatalogId}.`,
      );
    }
  }

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

  const semanticTrainingLinks = new Set<string>();
  for (const link of data.links.filter(
    ({ reviewStatus }) => reviewStatus === "approved",
  )) {
    if (!approvedOccupationIds.has(link.occupationId)) {
      throw new Error(
        `Approved training link has a dangling occupation: ${link.occupationId}.`,
      );
    }
    if (!programKeys.has(link.trainingProgramKey)) {
      throw new Error(
        `Approved training link has a dangling program: ${link.trainingProgramKey}.`,
      );
    }
    const semanticIdentity = [
      link.trainingProgramKey,
      link.occupationId,
      link.relationshipType,
    ].join("\u0000");
    if (semanticTrainingLinks.has(semanticIdentity)) {
      throw new Error(
        `Ambiguous approved training link relationship: ${semanticIdentity}.`,
      );
    }
    semanticTrainingLinks.add(semanticIdentity);
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
  for (const confirmation of data.humanOverrides) {
    const previous = overridesByOffer.get(confirmation.offerId);
    if (previous !== undefined && previous !== confirmation.occupationId) {
      throw new Error(
        `Human confirmation has conflicting occupations: ${confirmation.offerId}.`,
      );
    }
    if (previous === confirmation.occupationId) {
      throw new Error(
        `Human confirmation identities must be unique: ${confirmation.identity}.`,
      );
    }
    overridesByOffer.set(confirmation.offerId, confirmation.occupationId);
  }
  for (const confirmation of data.humanOverrides) {
    if (!offerIds.has(confirmation.offerId)) {
      throw new Error(
        `Human confirmation has a dangling offer: ${confirmation.offerId}.`,
      );
    }
    if (!approvedOccupationIds.has(confirmation.occupationId)) {
      throw new Error(
        `Human confirmation has a dangling occupation: ${confirmation.occupationId}.`,
      );
    }
  }
}

interface Candidate {
  occupationId: string;
  matchRule: MatchRule;
  relationshipType: RelationshipType;
  link: TrainingOccupationLink;
  alias?: OccupationAlias;
  requirement?: PublishedRequirement;
  qualification?: ReviewedQualification;
  programQualificationLink?: ProgramQualificationLink;
  confirmation?: HumanConfirmation;
}

const MATCH_RULE_PRIORITY: Record<MatchRule, number> = {
  human_override: 0,
  published_qualification_exact: 1,
  title_alias_exact: 2,
  title_alias_phrase: 3,
};

function candidateEvidenceIdentity(candidate: Candidate): string {
  if (candidate.confirmation !== undefined)
    return candidate.confirmation.identity;
  if (candidate.requirement !== undefined) return candidate.requirement.id;
  if (candidate.alias !== undefined)
    return aliasEvidenceIdentity(candidate.alias);
  return trainingLinkEvidenceIdentity(candidate.link);
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return (
    MATCH_RULE_PRIORITY[left.matchRule] -
      MATCH_RULE_PRIORITY[right.matchRule] ||
    compareStable(left.occupationId, right.occupationId) ||
    compareStable(
      trainingLinkEvidenceIdentity(left.link),
      trainingLinkEvidenceIdentity(right.link),
    ) ||
    compareStable(
      candidateEvidenceIdentity(left),
      candidateEvidenceIdentity(right),
    )
  );
}

function bestAlias(
  title: string,
  aliases: readonly OccupationAlias[],
):
  | { alias: OccupationAlias; rule: "title_alias_exact" | "title_alias_phrase" }
  | undefined {
  const candidates = aliases
    .map((alias) => ({
      alias,
      normalized: normalizedText(alias.alias),
    }))
    .filter(({ normalized }) => isBoundedPhrase(title, normalized))
    .map(({ alias, normalized }) => ({
      alias,
      normalized,
      rule:
        normalized === title
          ? ("title_alias_exact" as const)
          : ("title_alias_phrase" as const),
    }))
    .sort(
      (left, right) =>
        MATCH_RULE_PRIORITY[left.rule] - MATCH_RULE_PRIORITY[right.rule] ||
        right.normalized.length - left.normalized.length ||
        compareStable(
          aliasEvidenceIdentity(left.alias),
          aliasEvidenceIdentity(right.alias),
        ),
    );
  return candidates[0];
}

function candidatesForOffer(
  offer: JobOffer,
  links: readonly TrainingOccupationLink[],
  aliases: readonly OccupationAlias[],
  requirements: readonly PublishedRequirement[],
  qualifications: readonly ReviewedQualification[],
  programQualificationLinks: readonly ProgramQualificationLink[],
  confirmations: readonly HumanConfirmation[],
): Candidate[] {
  const results: Candidate[] = [];
  const sortedRequirements = [...requirements].sort((left, right) =>
    compareStable(left.id, right.id),
  );
  for (const link of links) {
    const confirmation = confirmations.find(
      (item) =>
        item.offerId === offer.id && item.occupationId === link.occupationId,
    );
    if (confirmation !== undefined) {
      results.push({
        occupationId: link.occupationId,
        matchRule: "human_override",
        relationshipType: link.relationshipType,
        link,
        confirmation,
      });
    }

    for (const programQualificationLink of programQualificationLinks) {
      const qualification = qualifications.find(
        ({ catalogId }) =>
          catalogId === programQualificationLink.qualificationCatalogId,
      );
      if (qualification === undefined) continue;
      const requirement = sortedRequirements.find(
        (item) =>
          item.category === "qualification_or_specialization" &&
          item.normalizedValue === qualification.canonicalLabel,
      );
      if (requirement !== undefined) {
        results.push({
          occupationId: link.occupationId,
          matchRule: "published_qualification_exact",
          relationshipType: link.relationshipType,
          link,
          requirement,
          qualification,
          programQualificationLink,
        });
      }
    }

    const alias = bestAlias(
      normalizedText(offer.title),
      aliases.filter(({ occupationId }) => occupationId === link.occupationId),
    );
    if (alias !== undefined) {
      results.push({
        occupationId: link.occupationId,
        matchRule: alias.rule,
        relationshipType: link.relationshipType,
        link,
        alias: alias.alias,
      });
    }
  }
  return results.sort(compareCandidates);
}

function offerMatch(
  programKey: string,
  offer: JobOffer,
  requirements: readonly PublishedRequirement[],
  candidate: Candidate,
): OfferMatch {
  const sortedRequirements = [...requirements].sort((left, right) =>
    compareStable(left.id, right.id),
  );
  const base = {
    offerId: offer.id,
    occupationId: candidate.occupationId,
    programKey,
    publishedAt: offer.publishedAt,
    relationshipType: candidate.relationshipType,
    linkEvidence: {
      identity: trainingLinkEvidenceIdentity(candidate.link),
      payload: candidate.link,
    },
    requirements: sortedRequirements,
  };

  if (candidate.matchRule === "human_override") {
    if (candidate.confirmation === undefined) {
      throw new Error(
        "A human override requires explicit confirmation evidence.",
      );
    }
    return OfferMatchSchema.parse({
      ...base,
      matchRule: candidate.matchRule,
      confirmationEvidence: candidate.confirmation,
    });
  }
  if (candidate.matchRule === "published_qualification_exact") {
    if (
      candidate.requirement === undefined ||
      candidate.qualification === undefined ||
      candidate.programQualificationLink === undefined
    ) {
      throw new Error("A qualification match requires reviewed evidence.");
    }
    return OfferMatchSchema.parse({
      ...base,
      matchRule: candidate.matchRule,
      qualificationEvidence: {
        offerId: offer.id,
        requirementId: candidate.requirement.id,
        sourceQuote: candidate.requirement.sourceQuote,
        normalizedValue: candidate.requirement.normalizedValue,
        qualificationIdentity: candidate.qualification.catalogId,
        qualification: candidate.qualification,
        programQualificationLink: {
          identity: candidate.programQualificationLink.identity,
          payload: candidate.programQualificationLink,
        },
      },
    });
  }
  if (candidate.alias === undefined) {
    throw new Error("An alias match requires reviewed alias evidence.");
  }
  return OfferMatchSchema.parse({
    ...base,
    matchRule: candidate.matchRule,
    aliasEvidence: {
      identity: aliasEvidenceIdentity(candidate.alias),
      payload: candidate.alias,
    },
  });
}

/** Creates scoreless matches from closed, approved and recomputable evidence. */
export function matchOffersForProgram(
  programKey: string,
  input: OfferMatchingData,
): OfferMatch[] {
  const data = parseData(input);
  validateRelationships(data);
  if (!data.programs.some((program) => program.programKey === programKey))
    return [];

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
  const programQualificationLinks = data.programQualificationLinks.filter(
    (link) =>
      link.reviewStatus === "approved" &&
      link.programKey === programKey &&
      REVIEWED_PROGRAM_QUALIFICATION_LINKS.some(
        ({ identity }) => identity === link.identity,
      ),
  );
  const requirementsByOffer = new Map(
    data.publishedRequirements.map((entry) => [
      entry.offerId,
      entry.requirements,
    ]),
  );

  const matches = data.offers.flatMap((offer): OfferMatch[] => {
    const requirements = requirementsByOffer.get(offer.id) ?? [];
    const candidates = candidatesForOffer(
      offer,
      links,
      aliases,
      requirements,
      data.qualifications,
      programQualificationLinks,
      data.humanOverrides,
    );
    const occupations = new Set(
      candidates.map(({ occupationId }) => occupationId),
    );
    if (occupations.size > 1) {
      throw new Error(`Offer matches conflicting occupations: ${offer.id}.`);
    }
    const candidate = candidates[0];
    return candidate === undefined
      ? []
      : [offerMatch(programKey, offer, requirements, candidate)];
  });
  matches.sort((left, right) => compareStable(left.offerId, right.offerId));
  return OfferMatchesSchema.parse(matches);
}
