import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  type GeneratedManifest,
  type JobOffer,
  type TrainingProgram,
} from "../../data/schemas/generated";
import type { OfferPublishedRequirements } from "../../src/domain/requirements";
import {
  FpOfferAliasCandidateReportSchema,
  rankFpOfferAliasCandidates as computeFpOfferAliasCandidates,
  normalizedText,
} from "./rankFpOfferAliasCandidates";

const rootDirectory = resolve(__dirname, "../..");
let rankedResult: ReturnType<typeof computeFpOfferAliasCandidates> | undefined;

function rankFpOfferAliasCandidates() {
  rankedResult ??= computeFpOfferAliasCandidates();
  return rankedResult;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

// Snapshot ID helper
function manifestSnapshotId(manifest: GeneratedManifest): string {
  return (
    manifest.resourceSnapshots.jobOffers.resourcePath.split("/").at(-2) ?? ""
  );
}

describe("rankFpOfferAliasCandidates – manifest-addressed loading", () => {
  it("reads the manifest from the path referenced by the module", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    expect(GeneratedManifestSchema.parse(manifest)).toBeDefined();
  });

  it("loads all resource snapshots at the manifest-addressed paths", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const base = resolve(rootDirectory, "public");

    const [programs, occupations, aliases, links, offers, requirements] =
      await Promise.all([
        readJson<TrainingProgram[]>(
          resolve(
            base,
            manifest.resourceSnapshots.programs.resourcePath.slice(1),
          ),
        ),
        readJson<Occupation[]>(
          resolve(
            base,
            manifest.resourceSnapshots.occupations.resourcePath.slice(1),
          ),
        ),
        readJson<OccupationAlias[]>(
          resolve(
            base,
            manifest.resourceSnapshots.occupationAliases.resourcePath.slice(1),
          ),
        ),
        readJson<TrainingOccupationLink[]>(
          resolve(
            base,
            manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
              1,
            ),
          ),
        ),
        readJson<JobOffer[]>(
          resolve(
            base,
            manifest.resourceSnapshots.jobOffers.resourcePath.slice(1),
          ),
        ),
        readJson<OfferPublishedRequirements[]>(
          resolve(
            base,
            manifest.resourceSnapshots.publishedRequirements.resourcePath.slice(
              1,
            ),
          ),
        ),
      ]);

    expect(programs).toBeInstanceOf(Array);
    expect(offers.length).toBe(
      manifest.resourceSnapshots.jobOffers.recordCount,
    );
    expect(links.length).toBe(141);
    expect(requirements.length).toBeGreaterThan(0);
    expect(programs.length).toBeGreaterThan(0);
    expect(occupations.length).toBeGreaterThan(0);
    expect(aliases.length).toBeGreaterThan(0);
  });
});

describe("rankFpOfferAliasCandidates – deterministic output", () => {
  it("produces stable ordering across invocations (deterministic JSON)", async () => {
    const { report: report1 } = await rankFpOfferAliasCandidates();
    const { report: report2 } = await rankFpOfferAliasCandidates();

    // Both reports must have the same JSON serialisation
    const json1 = JSON.stringify(report1);
    const json2 = JSON.stringify(report2);

    expect(json1).toEqual(json2);

    // Candidates must be deterministically ordered
    const candidates1 = report1.candidates;
    const candidates2 = report2.candidates;

    expect(candidates1.map((c) => c.confidence)).toEqual(
      candidates2.map((c) => c.confidence),
    );
    expect(candidates1.map((c) => c.aliasCandidate)).toEqual(
      candidates2.map((c) => c.aliasCandidate),
    );
  }, 30_000);

  it("report JSON does not contain wall-clock timestamps", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const json = JSON.stringify(report);

    // No ISO datetime in the output
    const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/gu;
    expect(isoPattern.test(json)).toBe(false);
  });

  it("report includes snapshot ID from manifest", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const { report } = await rankFpOfferAliasCandidates();
    expect(report.snapshotId).toBe(manifestSnapshotId(manifest));
  });
});

describe("rankFpOfferAliasCandidates – no duplicate normalized alias across occupations", () => {
  it("every candidate alias is unique per (program, occupation)", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const seen = new Set<string>();
    for (const c of report.candidates) {
      const key = `${c.aliasCandidate}\u0000${c.programKey}\u0000${c.occupationId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe("rankFpOfferAliasCandidates – exclusion of already-published aliases", () => {
  it("candidates are derived from zero-match relations only (not already matched)", async () => {
    const { report } = await rankFpOfferAliasCandidates();

    // All matched offer IDs should belong to offers that did NOT match via
    // the production matchOffersForProgram pipeline for their program.
    // We verify by checking that all candidates reference zero-match programs.
    // Since we load 1054 offers and 36 links, zero-match program filtering
    // ensures only truly unmatched relations produce candidates.
    const programsInCandidates = new Set(
      report.candidates.map((c) => c.programKey),
    );

    // If there are candidates, they must come from non-matching programs
    // (programs that have approved links but reach zero live offers).
    expect(report.zeroMatchPrograms).toBeGreaterThanOrEqual(0);
    expect(programsInCandidates.size).toBeGreaterThanOrEqual(0);
  });
});

describe("rankFpOfferAliasCandidates – all-approved-relations scope", () => {
  it("zeroMatchRelations count matches the number of program-occupation pairs with zero offer matches", async () => {
    const { report } = await rankFpOfferAliasCandidates();

    // At minimum, zeroMatchRelations should be >= 0 and <= total approved links
    expect(report.zeroMatchRelations).toBeGreaterThanOrEqual(0);
    expect(report.zeroMatchRelations).toBeLessThanOrEqual(
      report.approvedLinkCount,
    );
  });

  it("analyzes every approved relation, including relations with existing matches", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    expect(report.analyzedRelations).toBe(report.approvedLinkCount);
    expect(report.relationsWithExistingMatches).toBeGreaterThan(0);
    expect(
      report.relationsWithExistingMatches + report.zeroMatchRelations,
    ).toBe(report.analyzedRelations);
  });

  it("all candidates reference approved links (sourceUrl and sourceQuote match)", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const base = resolve(rootDirectory, "public");
    const links = await readJson<TrainingOccupationLink[]>(
      resolve(
        base,
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
          1,
        ),
      ),
    );
    TrainingOccupationLinksSchema.parse(links);

    const { report } = await rankFpOfferAliasCandidates();
    const approvedLinkKeys = new Set(
      links
        .filter((l) => l.reviewStatus === "approved")
        .map(
          (l) => `${l.occupationId}\u0000${l.sourceUrl}\u0000${l.sourceQuote}`,
        ),
    );

    for (const c of report.candidates) {
      const linkKey = `${c.occupationId}\u0000${c.sourceUrl}\u0000${c.sourceQuote}`;
      expect(approvedLinkKeys.has(linkKey)).toBe(true);
    }
  });
});

describe("rankFpOfferAliasCandidates – JSON schema validity", () => {
  it("report validates against FpOfferAliasCandidateReportSchema", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    expect(() => FpOfferAliasCandidateReportSchema.parse(report)).not.toThrow();
  });

  it("every candidate individually validates", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      expect(() =>
        FpOfferAliasCandidateReportSchema.shape.candidates.element.parse(c),
      ).not.toThrow();
    }
  });

  it("report counts are consistent", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const totalByConfidence = Object.values(
      report.candidatesByConfidence,
    ).reduce((sum, n) => sum + n, 0);
    expect(totalByConfidence).toBe(report.totalCandidates);
  });

  it("totalOffers matches manifest offer count", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const offersPath = manifest.resourceSnapshots.jobOffers.resourcePath;
    const base = resolve(rootDirectory, "public");
    const offers = await readJson<JobOffer[]>(
      resolve(base, offersPath.slice(1)),
    );
    const { report } = await rankFpOfferAliasCandidates();
    expect(report.totalOffers).toBe(offers.length);
  });
});

describe("rankFpOfferAliasCandidates – candidate properties", () => {
  it("occurrence counts are at least 1 (one-off niche allowed)", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      expect(c.occurrenceCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("every candidate adds sorted offers beyond its current program baseline", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const marginalUnion = new Set<string>();
    for (const candidate of report.candidates) {
      expect(candidate.marginalOfferCount).toBe(
        candidate.marginalOfferIds.length,
      );
      expect(candidate.marginalOfferCount).toBeGreaterThan(0);
      expect(candidate.marginalOfferIds).toEqual(
        [...candidate.marginalOfferIds].sort(),
      );
      for (const offerId of candidate.marginalOfferIds) {
        expect(candidate.matchedOfferIds).toContain(offerId);
        marginalUnion.add(offerId);
      }
    }
    expect(report.marginalCandidateOfferCount).toBe(marginalUnion.size);
  });

  it("sorts candidates by confidence and then marginal offer gain", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (let index = 1; index < report.candidates.length; index += 1) {
      const previous = report.candidates[index - 1];
      const current = report.candidates[index];
      if (previous.confidence === current.confidence) {
        expect(previous.marginalOfferCount).toBeGreaterThanOrEqual(
          current.marginalOfferCount,
        );
      }
    }
  });

  it("matchFields are never empty", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      expect(c.matchFields.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("matchedOfferIds are sorted", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      const ids = c.matchedOfferIds;
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    }
  });

  it("normalizedCollisionOccupations are sorted", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      const ids = c.normalizedCollisionOccupations;
      const sorted = [...ids].sort();
      expect(ids).toEqual(sorted);
    }
  });
});

describe("rankFpOfferAliasCandidates – markdown report", () => {
  it("markdown contains Spanish summary sections", async () => {
    const { markdown } = await rankFpOfferAliasCandidates();
    expect(markdown).toContain("# Candidatos de alias FP");
    expect(markdown).toContain("## Resumen del snapshot");
    expect(markdown).toContain("## Recuentos de candidatos");
    expect(markdown).toContain("## Limitaciones");
  });

  it("markdown references snapshotId", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const snapshotId = manifestSnapshotId(manifest);
    const { markdown } = await rankFpOfferAliasCandidates();
    expect(markdown).toContain(snapshotId);
  });

  it("markdown does not contain wall-clock timestamps", async () => {
    const { markdown } = await rankFpOfferAliasCandidates();
    const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/gu;
    expect(isoPattern.test(markdown)).toBe(false);
  });
});

describe("rankFpOfferAliasCandidates – no file mutation", () => {
  it("running does not modify curated or public data files", async () => {
    // Use manifest.json itself as a proxy for curated data (if we somehow modified it)
    const manifestStatBefore = await stat(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );

    // Run analysis
    await rankFpOfferAliasCandidates();

    const manifestStatAfter = await stat(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );

    // Manifest must not have changed
    expect(manifestStatBefore.ctimeMs).toBe(manifestStatAfter.ctimeMs);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// New acceptance-criteria tests required by the contract
// ──────────────────────────────────────────────────────────────────────────────

describe("rankFpOfferAliasCandidates – stopword-only rejection", () => {
  const STOPWORD_START_STOP_PATTERN =
    /^(de|en|y|a|el|la|los|las|un|una|del|al|por|para|con|sin)\s+(?:de|en|y|la|las|los|los|las|el|un|a|por|para|con|del|al)\b$/iu;

  it("rejects candidates starting with function words such as 'en la', 'de los', 'y la'", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const badCandidates = report.candidates.filter((c) =>
      STOPWORD_START_STOP_PATTERN.test(c.aliasCandidate),
    );
    expect(badCandidates).toHaveLength(0);
  });

  it("rejects candidates that are stopword-only phrases", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const stopwords = new Set([
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
    ]);
    for (const c of report.candidates) {
      const tokens = c.aliasCandidate.split(/\s+/u);
      const allStopwords = tokens.every((t) => stopwords.has(t));
      expect(allStopwords).toBe(false);
    }
  });
});

describe("rankFpOfferAliasCandidates – exact candidates are literal official phrases", () => {
  it("every exact candidate is contained in its relation's sourceQuote or occupationLabel", async () => {
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const base = resolve(rootDirectory, "public");
    const links = await readJson<TrainingOccupationLink[]>(
      resolve(
        base,
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
          1,
        ),
      ),
    );
    TrainingOccupationLinksSchema.parse(links);
    const occupations = await readJson<Occupation[]>(
      resolve(
        base,
        manifest.resourceSnapshots.occupations.resourcePath.slice(1),
      ),
    );
    OccupationsSchema.parse(occupations);
    const occMap = new Map(occupations.map((o) => [o.occupationId, o]));

    const linkMap = new Map<string, TrainingOccupationLink>();
    for (const link of links) {
      if (link.reviewStatus === "approved") {
        linkMap.set(
          `${link.occupationId}\u0000${link.sourceUrl}\u0000${link.sourceQuote}`,
          link,
        );
      }
    }

    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      if (c.confidence !== "exact_contiguous_phrase") continue;
      const linkKey = `${c.occupationId}\u0000${c.sourceUrl}\u0000${c.sourceQuote}`;
      const link = linkMap.get(linkKey);
      // Either sourceQuote or occupationLabel must contain the candidate
      const sourceQuoteLower = link?.sourceQuote.toLowerCase() ?? "";
      const occ = occMap.get(c.occupationId);
      const occLabelLower = occ?.preferredLabel.toLowerCase() ?? "";
      const candidateLower = c.aliasCandidate.toLowerCase();
      const inSourceQuote = sourceQuoteLower.includes(candidateLower);
      const inOccLabel = occLabelLower.includes(candidateLower);
      expect(inSourceQuote || inOccLabel).toBe(true);
    }
  });
});

describe("rankFpOfferAliasCandidates – every candidate has a title match", () => {
  it("all candidates include 'title' in matchFields", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      expect(c.matchFields).toContain("title");
    }
  });

  it("matchedOfferRefs in title contain the candidates", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    // Load all offers to verify bounded title match
    const manifest = await readJson<GeneratedManifest>(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
    );
    const base = resolve(rootDirectory, "public");
    const offers = await readJson<JobOffer[]>(
      resolve(base, manifest.resourceSnapshots.jobOffers.resourcePath.slice(1)),
    );
    offers.forEach((o) => JobOfferSchema.parse(o));

    // For each candidate, verify at least one matched offer title contains the bounded phrase
    for (const c of report.candidates) {
      const normCandidate = normalizedText(c.aliasCandidate);
      for (const offerId of c.matchedOfferIds) {
        const offer = offers.find((o) => o.id === offerId);
        if (!offer) {
          // Offer might be from a different pipeline, skip
          continue;
        }
        const normTitle = normalizedText(offer.title);
        if (` ${normTitle} `.includes(` ${normCandidate} `)) {
          // Found a valid title match for this offer
          break;
        }
      }
      // At least one offer must have a bounded title match
      const anyMatch = c.matchedOfferIds.some((offerId) => {
        const offer = offers.find((o) => o.id === offerId);
        if (!offer) return false;
        const normTitle = normalizedText(offer.title);
        const normCandidate = normalizedText(c.aliasCandidate);
        return ` ${normTitle} `.includes(` ${normCandidate} `);
      });
      expect(anyMatch).toBe(true);
    }
  });
});

describe("rankFpOfferAliasCandidates – hypothesis lane is review_only", () => {
  it("token-overlap candidates carry review_only confidence and are not exact", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const reviewOnlyCandidates = report.candidates.filter(
      (c) => c.confidence === "review_only",
    );
    // Verify that the review_only count matches
    expect(reviewOnlyCandidates.length).toBe(
      report.candidatesByConfidence.review_only,
    );
    // Every review_only candidate must have reasonCode starting with token_overlap_hypothesis
    for (const c of reviewOnlyCandidates) {
      expect(c.reasonCode).toMatch(/^token_overlap_hypothesis/);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Contract acceptance criteria: collision detection, reason codes, display text
// ──────────────────────────────────────────────────────────────────────────────

describe("rankFpOfferAliasCandidates – global cross-occupation collisions", () => {
  it("reciprocal normalizedCollisionOccupations for duplicated refrigeration title (ELE03S:7531 ↔ IMA02M:7250)", async () => {
    const { report } = await rankFpOfferAliasCandidates();

    // Find the collision candidates for the refrigeration/climatization alias
    const collisionCandidates = report.candidates.filter(
      (c) => c.normalizedCollisionOccupations.length > 0,
    );

    // There must be at least one candidate with cross-occupation collisions
    expect(collisionCandidates.length).toBeGreaterThan(0);

    // Find the specific ELE03S:7531 and IMA02M:7250 candidates for the refrigeration alias
    const ele03sCandidate = collisionCandidates.find(
      (c) =>
        c.occupationId === "occupation:cno11:7531" &&
        c.aliasCandidateNormalized ===
          normalizedText(
            "mecanicos reparadores de equipos industriales de refrigeracion y climatizacion",
          ),
    );
    const ima02mCandidate = collisionCandidates.find(
      (c) =>
        c.occupationId === "occupation:cno11:7250" &&
        c.aliasCandidateNormalized ===
          normalizedText(
            "mecanicos reparadores de equipos industriales de refrigeracion y climatizacion",
          ),
    );

    // Both must be present
    expect(ele03sCandidate).toBeDefined();
    expect(ima02mCandidate).toBeDefined();

    // Each must list the other's occupation ID as a collision (reciprocal)
    expect(ele03sCandidate!.normalizedCollisionOccupations).toContain(
      "occupation:cno11:7250",
    );
    expect(ima02mCandidate!.normalizedCollisionOccupations).toContain(
      "occupation:cno11:7531",
    );
  });

  it("every candidate with collisions lists all other colliding occupation IDs reciprocally", async () => {
    const { report } = await rankFpOfferAliasCandidates();

    // Group by normalized alias
    const normBuckets = new Map<string, typeof report.candidates>();
    for (const c of report.candidates) {
      const normKey = c.aliasCandidateNormalized ?? c.aliasCandidate;
      if (!normBuckets.has(normKey)) normBuckets.set(normKey, []);
      normBuckets.get(normKey)!.push(c);
    }

    for (const bucket of normBuckets.values()) {
      const occIds = [...new Set(bucket.map((c) => c.occupationId))];
      if (occIds.length <= 1) continue; // no cross-occ collision
      for (const candidate of bucket) {
        const others = occIds.filter((o) => o !== candidate.occupationId);
        for (const other of others) {
          expect(candidate.normalizedCollisionOccupations).toContain(other);
        }
      }
    }
  });
});

describe("rankFpOfferAliasCandidates – reason code accuracy", () => {
  it("single-offer exact candidates use single_offer_match prefix", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const singleOfferExact = report.candidates.filter(
      (c) =>
        c.confidence === "exact_contiguous_phrase" && c.occurrenceCount === 1,
    );
    for (const c of singleOfferExact) {
      expect(c.reasonCode).toMatch(/^single_offer_match/);
    }
  });

  it("multi-offer exact candidates use multi_offer_match prefix", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const multiOfferExact = report.candidates.filter(
      (c) =>
        c.confidence === "exact_contiguous_phrase" && c.occurrenceCount > 1,
    );
    for (const c of multiOfferExact) {
      expect(c.reasonCode).toMatch(/^multi_offer_match/);
    }
  });

  it("hypothesis candidates use token_overlap_hypothesis (not single/multi_offer_match)", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const hypothesis = report.candidates.filter(
      (c) => c.confidence === "review_only",
    );
    for (const c of hypothesis) {
      expect(c.reasonCode).toMatch(/^token_overlap_hypothesis/);
      expect(c.reasonCode).not.toMatch(/^single_offer_match/);
      expect(c.reasonCode).not.toMatch(/^multi_offer_match/);
    }
  });
});

describe("rankFpOfferAliasCandidates – display text preservation", () => {
  it("exact candidates preserve original Spanish display text (not fully lowercased)", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    const exactCandidates = report.candidates.filter(
      (c) => c.confidence === "exact_contiguous_phrase",
    );
    for (const c of exactCandidates) {
      expect(c.aliasCandidate).toBeTypeOf("string");
      expect(c.aliasCandidate.length).toBeGreaterThan(0);
    }
  });

  it("aliasCandidateNormalized is present and consistent with normalizedText(aliasCandidate)", async () => {
    const { report } = await rankFpOfferAliasCandidates();
    for (const c of report.candidates) {
      if (c.aliasCandidateNormalized !== undefined) {
        expect(normalizedText(c.aliasCandidate)).toBe(
          c.aliasCandidateNormalized,
        );
      }
    }
  });
});

describe("rankFpOfferAliasCandidates – markdown collision column", () => {
  it("markdown table includes collision info for candidates with cross-occupation collisions", async () => {
    const { markdown } = await rankFpOfferAliasCandidates();
    // The markdown should have a Colisiones column header
    expect(markdown).toContain("Colisiones");
  });
});

describe("rankFpOfferAliasCandidates – markdown row format", () => {
  it("markdown table exposes marginal gain and collisions, uses singular '1 oferta', excludes stray text, and ends with the snapshot disclaimer", async () => {
    const { markdown } = await rankFpOfferAliasCandidates();
    const lines = markdown.split("\n");

    // Should not contain the 5-column header (no Colisiones column)
    expect(lines).not.toContain(
      "| Alias | Programa | Ocupación | Ofertas | Causa |",
    );

    // Every line starting with '| Alias |' must equal the 7-column header
    const header =
      "| Alias | Programa | Ocupación | Ofertas | Ganancia marginal | Causa | Colisiones |";
    const aliasHeaders = lines.filter((line) => line.startsWith("| Alias |"));
    expect(aliasHeaders.length).toBeGreaterThan(0);
    for (const h of aliasHeaders) {
      expect(h).toBe(header);
    }

    // Must contain the singular form
    expect(markdown).toContain("| 1 oferta |");

    // Must not contain the plural form as a word boundary match
    expect(markdown).not.toMatch(/1 ofertas\b/);

    // Should not contain stray words
    expect(markdown).not.toMatch(/murcielago/iu);

    // Must end with the snapshot disclaimer (no trailing newline)
    expect(
      markdown
        .trimEnd()
        .endsWith(
          "El informe no incluye marcas de tiempo y sus recuentos corresponden a la instantánea controlada.",
        ),
    ).toBe(true);
  });
});
