import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { format as formatWithPrettier } from "prettier";
import { z } from "zod";

import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingProgramSchema,
  type GeneratedManifest,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import {
  PublishedRequirementsResourceSchema,
  type OfferPublishedRequirements,
} from "../../src/domain/requirements";

// ──────────────────────────────────────────────────────────────────────────────
// Schema definitions
// ──────────────────────────────────────────────────────────────────────────────

// Zod enums – value exports (for import { X } from ...) + type exports
const candidateConfidenceValues = [
  "review_only",
  "exact_contiguous_phrase",
  "exact_alias_match",
  "phrase_match",
  "token_overlap",
] as const;
export const CandidateConfidenceSchema = z.enum(candidateConfidenceValues);
export const CandidateConfidence = CandidateConfidenceSchema.enum;
export type CandidateConfidence = z.infer<typeof CandidateConfidenceSchema>;

const candidateMatchFieldValues = [
  "title",
  "description",
  "requirements",
] as const;
export const CandidateMatchFieldSchema = z.enum(candidateMatchFieldValues);
export const CandidateMatchField = CandidateMatchFieldSchema.enum;
export type CandidateMatchField = z.infer<typeof CandidateMatchFieldSchema>;

export const FpOfferAliasCandidateSchema = z
  .object({
    aliasCandidate: z.string().min(2),
    aliasCandidateNormalized: z.string().min(2).optional(),
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    occupationLabel: z.string().min(1),
    confidence: CandidateConfidenceSchema,
    sourceUrl: z.string().url(),
    sourceQuote: z.string().min(10).max(280),
    matchFields: z.array(CandidateMatchFieldSchema).min(1),
    matchedOfferIds: z.array(z.string().min(1)).min(1),
    matchedOfferTitles: z.array(z.string().min(1)).min(1),
    occurrenceCount: z.number().int().min(1),
    marginalOfferIds: z.array(z.string().min(1)).min(1),
    marginalOfferCount: z.number().int().min(1),
    currentRelationMatchCount: z.number().int().min(0),
    currentProgramMatchCount: z.number().int().min(0),
    normalizedCollisionOccupations: z
      .array(z.string().regex(/^occupation:cno11:\d{4}$/u))
      .min(0),
    reasonCode: z.string().min(3).max(80),
  })
  .strict();
export type FpOfferAliasCandidate = z.infer<typeof FpOfferAliasCandidateSchema>;

export const FpOfferAliasCandidateReportSchema = z
  .object({
    schemaVersion: z.literal("1.1.0"),
    snapshotId: z.string().min(1),
    snapshotHash: z
      .string()
      .regex(/^[a-f0-9]{64}$/u)
      .optional(),
    totalOffers: z.number().int().min(1),
    approvedLinkCount: z.number().int().min(0),
    analyzedRelations: z.number().int().min(0),
    relationsWithExistingMatches: z.number().int().min(0),
    zeroMatchRelations: z.number().int().min(0),
    zeroMatchPrograms: z.number().int().min(0),
    marginalCandidateOfferCount: z.number().int().min(0),
    totalCandidates: z.number().int().min(0),
    candidatesByConfidence: z.object({
      review_only: z.number().int().min(0),
      exact_contiguous_phrase: z.number().int().min(0),
      exact_alias_match: z.number().int().min(0),
      phrase_match: z.number().int().min(0),
      token_overlap: z.number().int().min(0),
    }),
    candidates: z.array(FpOfferAliasCandidateSchema),
    limitations: z.array(z.string().min(5)).min(0),
  })
  .strict();
export type FpOfferAliasCandidateReport = z.infer<
  typeof FpOfferAliasCandidateReportSchema
>;

// ──────────────────────────────────────────────────────────────────────────────
// Normalization helpers (must match offerMatching.ts semantics)
// ──────────────────────────────────────────────────────────────────────────────

export function normalizedText(value: string): string {
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

// ──────────────────────────────────────────────────────────────────────────────
// Stopword list (Spanish function words) – blocks n-gram false positives
// ──────────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "a",
  "al",
  "con",
  "de",
  "del",
  "dos",
  "en",
  "entre",
  "era",
  "es",
  "este",
  "esta",
  "estos",
  "estas",
  "fue",
  "para",
  "por",
  "se",
  "su",
  "tal",
  "tambien",
  "tan",
  "te",
  "tiene",
  "tu",
  "y",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "uno",
  "unos",
  "unas",
  "me",
  "mi",
  "muy",
  "sin",
  "so",
  "sobre",
  "tras",
  "no",
  "nada",
  "algo",
  "todo",
  "todos",
  "todas",
  "ningún",
  "ninguna",
  "otro",
  "otra",
  "otros",
  "otras",
  "mismo",
  "misma",
  "nosotros",
  "vosotros",
]);

function isStopword(token: string): boolean {
  return STOPWORDS.has(token);
}

function isValidPhraseSegment(tokens: string[]): boolean {
  if (tokens.length < 2) return false;
  if (isStopword(tokens[0])) return false;
  if (isStopword(tokens[tokens.length - 1])) return false;
  // At least one non-stopword token must exist
  return tokens.some((t) => !isStopword(t));
}

// ──────────────────────────────────────────────────────────────────────────────
// Data loading
// ──────────────────────────────────────────────────────────────────────────────

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function loadResources(manifest: GeneratedManifest): Promise<{
  programs: TrainingProgram[];
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
  offers: JobOffer[];
  publishedRequirements: OfferPublishedRequirements[];
  snapshotId: string;
}> {
  const snapshotIdPath = manifest.resourceSnapshots.jobOffers.resourcePath;
  const snapshotId = snapshotIdPath.split("/").at(-2) ?? "";

  const [programs, occupations, aliases, links, offers, publishedRequirements] =
    await Promise.all([
      readJson<TrainingProgram[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.programs.resourcePath.slice(1),
        ),
      ),
      readJson<Occupation[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.occupations.resourcePath.slice(1),
        ),
      ),
      readJson<OccupationAlias[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.occupationAliases.resourcePath.slice(1),
        ),
      ),
      readJson<TrainingOccupationLink[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
            1,
          ),
        ),
      ),
      readJson<JobOffer[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.jobOffers.resourcePath.slice(1),
        ),
      ),
      readJson<OfferPublishedRequirements[]>(
        resolve(
          process.cwd(),
          "public",
          manifest.resourceSnapshots.publishedRequirements.resourcePath.slice(
            1,
          ),
        ),
      ),
    ]);

  // Validate
  GeneratedManifestSchema.parse(manifest);
  OccupationsSchema.parse(occupations);
  OccupationAliasesSchema.parse(aliases);
  TrainingOccupationLinksSchema.parse(links);
  offers.forEach((o) => JobOfferSchema.parse(o));
  PublishedRequirementsResourceSchema.parse(publishedRequirements);
  programs.forEach((p) => TrainingProgramSchema.parse(p));

  return {
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    snapshotId,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Zero-match detection
// ──────────────────────────────────────────────────────────────────────────────

interface ProgramOccupationRelation {
  programKey: string;
  programTitle: string;
  occupationId: string;
  occupationLabel: string;
  link: TrainingOccupationLink;
  existingAliases: OccupationAlias[];
  currentRelationMatchedOfferIds: ReadonlySet<string>;
  currentProgramMatchedOfferIds: ReadonlySet<string>;
}

function buildApprovedRelations(
  programs: TrainingProgram[],
  occupations: Occupation[],
  aliases: OccupationAlias[],
  links: TrainingOccupationLink[],
  offers: JobOffer[],
  publishedRequirements: OfferPublishedRequirements[],
  occupationMap: Map<string, Occupation>,
  approvedAliasesByOccId: Map<string, OccupationAlias[]>,
): ProgramOccupationRelation[] {
  // Build lookup maps
  const approvedOccIds = new Set(
    occupations
      .filter((o) => o.reviewStatus === "approved")
      .map((o) => o.occupationId),
  );

  // Approved links grouped by program
  const linksByProgram = new Map<string, TrainingOccupationLink[]>();
  for (const link of links) {
    if (
      link.reviewStatus !== "approved" ||
      !approvedOccIds.has(link.occupationId)
    ) {
      continue;
    }
    const arr = linksByProgram.get(link.trainingProgramKey) ?? [];
    arr.push(link);
    linksByProgram.set(link.trainingProgramKey, arr);
  }

  const relations: ProgramOccupationRelation[] = [];

  for (const [programKey, programLinks] of linksByProgram) {
    const program = programs.find((p) => p.programKey === programKey);
    const programTitle = program?.programTitle ?? programKey;

    try {
      const matches = matchOffersForProgram(programKey, {
        programs,
        qualifications: REVIEWED_QUALIFICATIONS,
        programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
        occupations,
        aliases,
        links,
        offers,
        publishedRequirements,
        humanOverrides: [],
      });
      const currentProgramMatchedOfferIds = new Set(
        matches.map((match) => match.offerId),
      );
      // Preserve one baseline per approved program-occupation relation.
      for (const link of programLinks) {
        const occ = occupationMap.get(link.occupationId);
        if (!occ) continue;
        const existing = approvedAliasesByOccId.get(link.occupationId) ?? [];
        relations.push({
          programKey,
          programTitle,
          occupationId: link.occupationId,
          occupationLabel: occ.preferredLabel,
          link,
          existingAliases: existing,
          currentRelationMatchedOfferIds: new Set(
            matches
              .filter((match) => match.occupationId === link.occupationId)
              .map((match) => match.offerId),
          ),
          currentProgramMatchedOfferIds,
        });
      }
    } catch (error) {
      throw new Error(
        `No se pudieron calcular coincidencias para ${programKey}.`,
        { cause: error },
      );
    }
  }

  return relations;
}

// ──────────────────────────────────────────────────────────────────────────────
// Candidate generation – exact phrases only (no sliding n-grams)
// ──────────────────────────────────────────────────────────────────────────────

type RawCandidate = {
  normalized: string;
  original: string;
  source: "sourceQuote" | "occupationLabel" | "segment";
};

/**
 * Extract exact candidates from a relation.
 * Per contract: only the complete normalized sourceQuote (after stripping
 * a leading CNO code), the complete occupation label, or a complete
 * comma/semicolon-separated occupational segment with ≥ 2 meaningful
 * non-stopword tokens that does not start or end with a stopword.
 */
function extractExactCandidates(
  rel: ProgramOccupationRelation,
): RawCandidate[] {
  const result: RawCandidate[] = [];
  const rawQuote = rel.link.sourceQuote;

  // 1. Full normalized sourceQuote after stripping leading CNO code
  const normalizedFull = normalizedText(rawQuote);
  const strippedQuote = normalizedFull.replace(/^\d+\s+/u, "");
  if (strippedQuote) {
    result.push({
      normalized: strippedQuote,
      original: rawQuote,
      source: "sourceQuote",
    });
  }

  // 2. Full occupation label
  const normLabel = normalizedText(rel.occupationLabel);
  if (normLabel) {
    result.push({
      normalized: normLabel,
      original: rel.occupationLabel,
      source: "occupationLabel",
    });
  }

  // 3. Comma/semicolon-separated segments from the stripped sourceQuote
  const segments = strippedQuote
    .split(/[,;]/u)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const segment of segments) {
    if (segment === strippedQuote) continue; // already added above
    const normSegment = normalizedText(segment);
    const segTokens = normSegment.split(" ").filter((t) => t.length > 0);
    if (isValidPhraseSegment(segTokens)) {
      result.push({
        normalized: normSegment,
        original: segment,
        source: "segment",
      });
    }
  }

  return result;
}

/**
 * Build a lookup of all approved alias strings (normalized) → occupation ids
 * for collision detection across all occupations.
 */
function buildApprovedAliasSet(
  approvedAliasesByOccId: Map<string, OccupationAlias[]>,
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>(); // normalized → Set of occIds
  for (const [occId, aliases] of approvedAliasesByOccId.entries()) {
    for (const alias of aliases) {
      const normAlias = normalizedText(alias.alias);
      if (!result.has(normAlias)) {
        result.set(normAlias, new Set());
      }
      result.get(normAlias)?.add(occId);
    }
  }
  return result;
}

function generateCandidates(
  relations: ProgramOccupationRelation[],
  offers: JobOffer[],
  occupationMap: Map<string, Occupation>,
  approvedAliasesByOccId: Map<string, OccupationAlias[]>,
): FpOfferAliasCandidate[] {
  const seen = new Map<string, FpOfferAliasCandidate>();

  // Pre-build the approved alias lookup for collision detection
  const approvedAliasLookup = buildApprovedAliasSet(approvedAliasesByOccId);

  for (const rel of relations) {
    // ────────────────────────────────────────────────────────────────────
    // Phase 1 – Exact candidates from official sources (no sliding n-grams)
    // ────────────────────────────────────────────────────────────────────
    const rawCandidates = extractExactCandidates(rel);

    for (const raw of rawCandidates) {
      const { normalized, source } = raw;

      // Check collision with existing approved aliases (any occupation)
      if (approvedAliasLookup.has(normalized)) {
        continue;
      }

      // ── Title discovery: must find a bounded match in at least one offer title ──
      const titleMatchIds: string[] = [];
      const supportingFields = new Set<CandidateMatchField>();

      for (const offer of offers) {
        const normTitle = normalizedText(offer.title);
        if (isBoundedPhrase(normTitle, normalized)) {
          titleMatchIds.push(offer.id);
          const normReqs = offer.descriptionSections.requirements
            .map(normalizedText)
            .join(" ");
          const normDesc = normalizedText(offer.descriptionText);
          if (isBoundedPhrase(normReqs, normalized)) {
            supportingFields.add("requirements");
          }
          if (isBoundedPhrase(normDesc, normalized)) {
            supportingFields.add("description");
          }
        }
      }

      // Discovery requires at least one title match
      if (titleMatchIds.length === 0) continue;

      // Determine which other fields are present (supporting)
      const matchFieldSet = new Set<CandidateMatchField>(["title"]);
      for (const field of supportingFields) {
        matchFieldSet.add(field);
      }

      // ── Cross-occupation alias collision ──
      const collisionOccupations: string[] = [];
      for (const occ of occupationMap.values()) {
        if (occ.occupationId === rel.occupationId) continue;
        if (occ.reviewStatus !== "approved") continue;
        const occAliases = approvedAliasesByOccId.get(occ.occupationId) ?? [];
        for (const alias of occAliases) {
          if (normalizedText(alias.alias) === normalized) {
            collisionOccupations.push(occ.occupationId);
            break;
          }
        }
      }

      // Deduplicate matched offer IDs
      const matchedOfferIds = [...new Set(titleMatchIds)].sort();
      const marginalOfferIds = matchedOfferIds.filter(
        (offerId) => !rel.currentProgramMatchedOfferIds.has(offerId),
      );

      // Candidates without incremental coverage are not actionable.
      if (marginalOfferIds.length === 0) continue;

      const fields = [...matchFieldSet].toSorted();

      const offerPrefix =
        matchedOfferIds.length === 1
          ? "single_offer_match"
          : "multi_offer_match";
      const reasonCode =
        source === "segment"
          ? `${offerPrefix};valid_occupational_segment`
          : source === "occupationLabel"
            ? `${offerPrefix};occupation_label`
            : `${offerPrefix};exact_source_phrase`;

      // Preserve Spanish display text in aliasCandidate; use aliasCandidateNormalized
      // exclusively for identity/comparison (collision detection).
      const rawDisplay = raw.source === "segment" ? raw.original : raw.original;
      const normalizedDisplay = normalizedText(rawDisplay);

      seen.set(
        `${normalizedDisplay}\u0000${rel.programKey}\u0000${rel.occupationId}`,
        {
          aliasCandidate: rawDisplay,
          aliasCandidateNormalized: normalizedDisplay,
          programKey: rel.programKey,
          programTitle: rel.programTitle,
          occupationId: rel.occupationId,
          occupationLabel: rel.occupationLabel,
          confidence: "exact_contiguous_phrase",
          sourceUrl: rel.link.sourceUrl,
          sourceQuote: rel.link.sourceQuote,
          matchFields: fields,
          matchedOfferIds,
          matchedOfferTitles: matchedOfferIds.map(
            (id) => offers.find((o) => o.id === id)?.title ?? "Unknown",
          ),
          occurrenceCount: matchedOfferIds.length,
          marginalOfferIds,
          marginalOfferCount: marginalOfferIds.length,
          currentRelationMatchCount: rel.currentRelationMatchedOfferIds.size,
          currentProgramMatchCount: rel.currentProgramMatchedOfferIds.size,
          normalizedCollisionOccupations: [
            ...new Set(collisionOccupations),
          ].toSorted(),
          reasonCode,
        },
      );
    }

    // ────────────────────────────────────────────────────────────────────
    // Phase 2 – Token-overlap hypothesis lane (review_only, never exact)
    // ────────────────────────────────────────────────────────────────────
    const hypothesisLaneCandidates: FpOfferAliasCandidate[] = [];

    // Collect the official phrase tokens (sourceQuote or occupation label)
    const officialPhrases: RawCandidate[] = [
      {
        normalized: normalizedText(rel.link.sourceQuote).replace(
          /^\d+\s+/u,
          "",
        ),
        original: rel.link.sourceQuote,
        source: "sourceQuote",
      },
      {
        normalized: normalizedText(rel.occupationLabel),
        original: rel.occupationLabel,
        source: "occupationLabel",
      },
    ];

    // For each offer title, compute token overlap with the official phrases
    for (const offer of offers) {
      if (rel.currentProgramMatchedOfferIds.has(offer.id)) continue;
      const normTitle = normalizedText(offer.title);
      if (!normTitle) continue;

      const titleStems = normTitle
        .split(" ")
        .filter((t) => t.length > 2 && !isStopword(t));

      if (titleStems.length < 2) continue;

      // Check overlap against each official phrase
      for (const phrase of officialPhrases) {
        if (!phrase.normalized || phrase.normalized === normTitle) continue;

        const phraseStems = phrase.normalized
          .split(" ")
          .filter((t) => t.length > 2 && !isStopword(t));

        if (phraseStems.length < 2) continue;

        // Compute shared stems
        const phraseStemSet = new Set(phraseStems);
        const sharedStems = titleStems.filter((t) => phraseStemSet.has(t));

        if (sharedStems.length < 2) continue;

        // Compute overlap: shared / total phrase meaningful stems
        const overlap = sharedStems.length / phraseStems.length;
        if (overlap < 0.5) continue;

        // Check that this normalized title isn't already an exact candidate
        // or an existing approved alias
        if (approvedAliasLookup.has(normTitle)) continue;

        // Check cross-occupation title collision
        for (const occ of occupationMap.values()) {
          if (occ.occupationId === rel.occupationId) continue;
          if (occ.reviewStatus !== "approved") continue;
          const occAliases = approvedAliasesByOccId.get(occ.occupationId) ?? [];
          for (const oa of occAliases) {
            if (normalizedText(oa.alias) === normTitle) {
              // Collides with another occupation's alias – skip
              continue;
            }
          }
        }

        hypothesisLaneCandidates.push({
          aliasCandidate: offer.title,
          aliasCandidateNormalized: normTitle,
          programKey: rel.programKey,
          programTitle: rel.programTitle,
          occupationId: rel.occupationId,
          occupationLabel: rel.occupationLabel,
          confidence: "review_only",
          sourceUrl: rel.link.sourceUrl,
          sourceQuote: rel.link.sourceQuote,
          matchFields: ["title"],
          matchedOfferIds: [offer.id],
          matchedOfferTitles: [offer.title],
          occurrenceCount: 1,
          marginalOfferIds: [offer.id],
          marginalOfferCount: 1,
          currentRelationMatchCount: rel.currentRelationMatchedOfferIds.size,
          currentProgramMatchCount: rel.currentProgramMatchedOfferIds.size,
          normalizedCollisionOccupations: [],
          reasonCode: `token_overlap_hypothesis;share_stems=${sharedStems.length};overlap=${overlap.toFixed(2)}`,
        });

        break; // One match per offer title is enough
      }
    }

    // Deduplicate by normalized title within the hypothesis lane, then cap at 5
    const seenTitles = new Map<string, (typeof hypothesisLaneCandidates)[0]>();
    for (const h of hypothesisLaneCandidates) {
      const normH = h.aliasCandidateNormalized ?? h.aliasCandidate;
      if (seenTitles.has(normH)) {
        // Accumulate counts for repeated titles
        const existing = seenTitles.get(normH)!;
        existing.matchedOfferIds.push(...h.matchedOfferIds);
        existing.matchedOfferTitles.push(...h.matchedOfferTitles);
        existing.occurrenceCount += h.occurrenceCount;
        existing.marginalOfferIds.push(...h.marginalOfferIds);
        existing.matchedOfferIds = [
          ...new Set(existing.matchedOfferIds),
        ].sort();
        existing.matchedOfferTitles = [
          ...new Set(existing.matchedOfferTitles),
        ].sort();
        existing.marginalOfferIds = [
          ...new Set(existing.marginalOfferIds),
        ].sort();
        existing.marginalOfferCount = existing.marginalOfferIds.length;
        continue;
      }
      seenTitles.set(normH, h);
    }
    const cappedHypotheses = [...seenTitles.values()].sort((a, b) => {
      if (a.marginalOfferCount !== b.marginalOfferCount)
        return b.marginalOfferCount - a.marginalOfferCount;
      if (a.occurrenceCount !== b.occurrenceCount)
        return b.occurrenceCount - a.occurrenceCount;
      return a.aliasCandidate.localeCompare(b.aliasCandidate);
    });

    // Add capped hypotheses (max 5 per relation)
    for (const hyp of cappedHypotheses.slice(0, 5)) {
      const normCandidate = hyp.aliasCandidateNormalized ?? hyp.aliasCandidate;
      const key = `${normCandidate}\u0000${rel.programKey}\u0000${rel.occupationId}\u0000review_only`;
      if (!seen.has(key)) {
        seen.set(key, hyp);
      }
    }
  }

  const allCandidates = [...seen.values()];

  // ── Global cross-occupation normalized collision detection ──
  // Group candidates by normalized alias (aliasCandidateNormalized or aliasCandidate)
  // and populate normalizedCollisionOccupations on every occurrence so the collision
  // is reciprocal.  Exact-contiguous-phrase candidates that collide are retained as
  // review-only evidence (the lane is already non-publishable).
  const normBuckets = new Map<string, typeof allCandidates>();
  for (const c of allCandidates) {
    const normKey = c.aliasCandidateNormalized ?? c.aliasCandidate;
    if (!normBuckets.has(normKey)) normBuckets.set(normKey, []);
    normBuckets.get(normKey)!.push(c);
  }

  for (const bucket of normBuckets.values()) {
    const occIds = [...new Set(bucket.map((c) => c.occupationId))].toSorted();
    if (occIds.length <= 1) continue; // no cross-occupation collision
    for (const candidate of bucket) {
      const others = occIds.filter((o) => o !== candidate.occupationId);
      // Merge with any existing normalizedCollisionOccupations (approved aliases)
      const merged = new Set([
        ...(candidate.normalizedCollisionOccupations ?? []),
        ...others,
      ]);
      candidate.normalizedCollisionOccupations = [...merged].toSorted();
    }
  }

  // Global sort: confidence priority → occurrence desc → alias asc → programKey → occupationId
  const confidenceOrder: Record<string, number> = {
    review_only: 4,
    exact_contiguous_phrase: 0,
    exact_alias_match: 1,
    phrase_match: 2,
    token_overlap: 3,
  };

  return allCandidates.sort((a, b) => {
    const aConf = confidenceOrder[a.confidence] ?? 5;
    const bConf = confidenceOrder[b.confidence] ?? 5;
    if (aConf !== bConf) return aConf - bConf;
    if (a.marginalOfferCount !== b.marginalOfferCount)
      return b.marginalOfferCount - a.marginalOfferCount;
    if (a.occurrenceCount !== b.occurrenceCount)
      return b.occurrenceCount - a.occurrenceCount;
    return (
      a.aliasCandidate.localeCompare(b.aliasCandidate) ||
      a.programKey.localeCompare(b.programKey) ||
      a.occupationId.localeCompare(b.occupationId)
    );
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Report generation
// ──────────────────────────────────────────────────────────────────────────────

function generateMarkdownReport(
  report: z.infer<typeof FpOfferAliasCandidateReportSchema>,
): string {
  const lines: string[] = [];
  lines.push("# Candidatos de alias FP – Análisis de ofertas");
  lines.push("");
  lines.push("## Resumen del snapshot");
  lines.push("");
  lines.push(`- Identificador del snapshot: \`${report.snapshotId}\``);
  lines.push(`- Total de ofertas analizadas: ${report.totalOffers}`);
  lines.push(`- Relaciones aprobadas (enlaces): ${report.approvedLinkCount}`);
  lines.push(`- Relaciones analizadas: ${report.analyzedRelations}`);
  lines.push(
    `- Relaciones con coincidencias actuales: ${report.relationsWithExistingMatches}`,
  );
  lines.push(
    `- Relaciones con cero coincidencias: ${report.zeroMatchRelations}`,
  );
  lines.push(`- Programas con cero coincidencias: ${report.zeroMatchPrograms}`);
  lines.push(
    `- Ofertas marginales únicas entre candidatos: ${report.marginalCandidateOfferCount}`,
  );
  lines.push("");
  lines.push("## Recuentos de candidatos");
  lines.push("");
  lines.push(`- Candidatos totales: ${report.totalCandidates}`);
  lines.push(
    `- Hipótesis revisión (solapamiento): ${report.candidatesByConfidence.review_only}`,
  );
  lines.push(
    `- Frases exactas contiguas (fuente oficial): ${report.candidatesByConfidence.exact_contiguous_phrase}`,
  );
  lines.push(
    `- Coincidencias de alias aprobadas: ${report.candidatesByConfidence.exact_alias_match}`,
  );
  lines.push(
    `- Coincidencias por frase: ${report.candidatesByConfidence.phrase_match}`,
  );
  lines.push(
    `- Coincidencias por solapamiento de tokens: ${report.candidatesByConfidence.token_overlap}`,
  );
  lines.push("");

  // Group candidates by confidence
  const confidenceNames: Record<string, string> = {
    review_only: "Hipótesis revisión (solapamiento)",
    exact_contiguous_phrase: "Frases exactas contiguas (fuente oficial)",
    exact_alias_match: "Coincidencias de alias aprobadas",
    phrase_match: "Coincidencias por frase",
    token_overlap: "Solapamiento de tokens",
  };

  for (const [confidence, label] of Object.entries(confidenceNames)) {
    const group = report.candidates.filter((c) => c.confidence === confidence);
    if (group.length === 0) continue;
    lines.push(`### ${label}`);
    lines.push("");
    lines.push(
      "| Alias | Programa | Ocupación | Ofertas | Ganancia marginal | Causa | Colisiones |",
    );
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const c of group) {
      const collisionText =
        c.normalizedCollisionOccupations.length > 0
          ? c.normalizedCollisionOccupations.join(", ")
          : "—";
      lines.push(
        `| \`${c.aliasCandidate}\` | ${c.programKey} (${c.programTitle}) | ${c.occupationLabel} (${c.occupationId}) | ${c.occurrenceCount === 1 ? "1 oferta" : `${c.occurrenceCount} ofertas`} | ${c.marginalOfferCount} | ${c.reasonCode} | ${collisionText} |`,
      );
    }
    lines.push("");
  }

  // Limitations
  lines.push("## Limitaciones");
  lines.push("");
  for (const lim of report.limitations) {
    lines.push(`- ${lim}`);
  }
  lines.push("");
  lines.push("## Decisión");
  lines.push("");
  if (report.totalCandidates === 0) {
    lines.push(
      "No se identificaron candidatos de alias con ganancia marginal para las relaciones aprobadas. No se amplían alias ni se auto-aprueban relaciones.",
    );
  } else {
    lines.push(
      `Se identificaron ${report.totalCandidates} candidatos de alias con ganancia marginal para relaciones aprobadas. Ningún candidato se aprueba automáticamente; estos resultados son evidencia para revisión por Sol y Gemma.`,
    );
  }
  lines.push("");
  lines.push(
    "El informe no incluye marcas de tiempo y sus recuentos corresponden a la instantánea controlada.",
  );

  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export async function rankFpOfferAliasCandidates(
  manifestPath?: string,
): Promise<{
  report: z.infer<typeof FpOfferAliasCandidateReportSchema>;
  markdown: string;
}> {
  const root = process.cwd();
  const manifestFile =
    manifestPath ?? resolve(root, "public/data/v1/manifest.json");
  const manifest = await readJson<GeneratedManifest>(manifestFile);
  GeneratedManifestSchema.parse(manifest);

  const resources = await loadResources(manifest);
  const {
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    snapshotId,
  } = resources;

  const occupationMap = new Map(occupations.map((o) => [o.occupationId, o]));

  // Build alias lookup by occupation (global, used for collision detection)
  const approvedAliasesByOccId = new Map<string, OccupationAlias[]>();
  for (const alias of aliases) {
    if (alias.reviewStatus !== "approved") continue;
    const occId = alias.occupationId;
    const arr = approvedAliasesByOccId.get(occId) ?? [];
    arr.push(alias);
    approvedAliasesByOccId.set(occId, arr);
  }

  // Analyze every approved relation and retain its current match baseline.
  const approvedRelations = buildApprovedRelations(
    programs,
    occupations,
    aliases,
    links,
    offers,
    publishedRequirements,
    occupationMap,
    approvedAliasesByOccId,
  );

  // Count zero-match unique programs
  const zeroMatchRelations = approvedRelations.filter(
    (relation) => relation.currentRelationMatchedOfferIds.size === 0,
  );
  const zeroMatchProgramKeys = new Set(
    approvedRelations
      .filter((relation) => relation.currentProgramMatchedOfferIds.size === 0)
      .map((relation) => relation.programKey),
  );

  // Total approved links
  const approvedLinkCount = links.filter(
    (l) => l.reviewStatus === "approved",
  ).length;

  // Generate candidates
  const candidates = generateCandidates(
    approvedRelations,
    offers,
    occupationMap,
    approvedAliasesByOccId,
  );

  // Count by confidence
  const counts = {
    review_only: 0,
    exact_contiguous_phrase: 0,
    exact_alias_match: 0,
    phrase_match: 0,
    token_overlap: 0,
  };
  for (const c of candidates) {
    counts[c.confidence]++;
  }

  // Limitations
  const limitations = [
    "Análisis determinístico basado en la instantánea v1; no estima el empleo total del mercado.",
    "Se examinan todas las relaciones aprobadas y se descartan candidatos sin ganancia marginal para su programa.",
    "Las frases exactas contiguas de la cita oficial se priorizan sobre hipótesis de solapamiento.",
    "No se modifica la colección de alias aprobados ni se aprueba ningún candidato automáticamente.",
    "Solo se utilizan campos normalizados (título, descripción, requisitos); no se analiza el texto de la oferta original completo.",
    "Los alias ya publicados en occupationAliases no se re-incluyen como candidatos nuevos.",
    "No se consideran ofertas no publicadas ni requisitos fuera del recurso published-requirements.",
  ];

  const report: z.infer<typeof FpOfferAliasCandidateReportSchema> = {
    schemaVersion: "1.1.0",
    snapshotId,
    snapshotHash: undefined,
    totalOffers: offers.length,
    approvedLinkCount,
    analyzedRelations: approvedRelations.length,
    relationsWithExistingMatches: approvedRelations.filter(
      (relation) => relation.currentRelationMatchedOfferIds.size > 0,
    ).length,
    zeroMatchRelations: zeroMatchRelations.length,
    zeroMatchPrograms: zeroMatchProgramKeys.size,
    marginalCandidateOfferCount: new Set(
      candidates.flatMap((candidate) => candidate.marginalOfferIds),
    ).size,
    totalCandidates: candidates.length,
    candidatesByConfidence: counts,
    candidates,
    limitations,
  };

  const markdown = generateMarkdownReport(report);

  return { report, markdown };
}

// ──────────────────────────────────────────────────────────────────────────────
// CLI entry point
// ──────────────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const rootDirectory = process.cwd();
  const { report, markdown } = await rankFpOfferAliasCandidates();

  // Write JSON
  const jsonPath = resolve(
    rootDirectory,
    "analysis/fp_offer_alias_candidates.json",
  );
  await writeFile(
    jsonPath,
    await formatWithPrettier(JSON.stringify(report), { parser: "json" }),
    "utf8",
  );

  // Write Markdown
  const mdPath = resolve(
    rootDirectory,
    "analysis/fp_offer_alias_candidates.md",
  );
  await writeFile(
    mdPath,
    await formatWithPrettier(markdown, { parser: "markdown" }),
    "utf8",
  );
}

if (
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  await run();
}
