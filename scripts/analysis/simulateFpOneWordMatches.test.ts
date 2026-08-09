import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  APPROVED_ONE_WORD_CANDIDATES,
  FP_ONE_WORD_SNAPSHOT_CONTRACT,
  OneWordCandidateResultSchema,
  OneWordOfferSchema,
  type OneWordCandidate,
  type OneWordOffer,
} from "./fpOneWordMatchExperimentContract";
import {
  EXPECTED_MATCH_COUNTS,
  EXPECTED_MATCHES_BY_CANDIDATE,
  EXPECTED_UNION_OFFER_IDS,
} from "./fpOneWordMatchExperimentExpected";
import { simulateApprovedOneWordCandidates } from "./simulateFpOneWordMatches";

const ROOT = resolve(import.meta.dirname, "../..");

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function compareCodePoints(left: string, right: string) {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

function result(candidateId: string, offers: readonly OneWordOffer[]) {
  const candidate = APPROVED_ONE_WORD_CANDIDATES.find(
    (entry) => entry.candidateId === candidateId,
  );
  if (!candidate) throw new Error(`Unknown candidate fixture: ${candidateId}`);
  return {
    candidateId,
    programKey: candidate.programKey,
    occupationId: candidate.occupationId,
    matchedOfferIds: offers.map(({ id }) => id).sort(compareCodePoints),
    matchedTitles: offers.map(({ title }) => title).sort(compareCodePoints),
  };
}

function invalidCandidates(value: unknown) {
  return value as readonly OneWordCandidate[];
}

describe("simulateApprovedOneWordCandidates", () => {
  it("matches only explicit normalized whole-token forms and deduplicates offers", () => {
    const offers = [
      { id: "4", title: "Cocinero cocineros" },
      { id: "3", title: "precocinero" },
      { id: "2", title: "cocineras" },
      { id: "1", title: "ALBAÑIL para reformas" },
    ];

    const results = simulateApprovedOneWordCandidates(
      offers,
      APPROVED_ONE_WORD_CANDIDATES,
    );

    expect(results).toEqual([
      result("albanil-es", [offers[3]]),
      result("cocinero-s", [offers[0]]),
      result("encofradores", []),
    ]);
  });

  it("rejects anything other than the exact closed candidate inventory", () => {
    const approved = structuredClone(APPROVED_ONE_WORD_CANDIDATES);
    const mutations = [
      approved.map((entry, index) =>
        index === 0 ? { ...entry, candidateId: "inventado" } : entry,
      ),
      approved.map((entry, index) =>
        index === 0 ? { ...entry, programKey: "SAN21" } : entry,
      ),
      approved.map((entry, index) =>
        index === 0
          ? { ...entry, occupationId: "occupation:cno11:9999" }
          : entry,
      ),
      approved.map((entry, index) =>
        index === 0 ? { ...entry, forms: ["jefe de cocina"] } : entry,
      ),
      approved.map((entry, index) =>
        index === 0 ? { ...entry, forms: [""] } : entry,
      ),
      approved.slice(1),
      [],
    ];

    for (const mutation of mutations) {
      expect(() =>
        simulateApprovedOneWordCandidates([], invalidCandidates(mutation)),
      ).toThrow();
    }
  });

  it("sorts deterministically by normalized code points without locale APIs", () => {
    const localeCompare = vi
      .spyOn(String.prototype, "localeCompare")
      .mockImplementation(() => {
        throw new Error("localeCompare is forbidden");
      });
    const originalCollator = Intl.Collator;
    Object.defineProperty(Intl, "Collator", {
      configurable: true,
      value: function ForbiddenCollator() {
        throw new Error("Intl.Collator is forbidden");
      },
    });

    try {
      const offers = [
        { id: "ñ", title: "ñ cocinero" },
        { id: "n", title: "n cocinero" },
        { id: "á", title: "á cocinero" },
      ];
      const forward = simulateApprovedOneWordCandidates(
        offers,
        APPROVED_ONE_WORD_CANDIDATES,
      );
      const reversed = simulateApprovedOneWordCandidates(
        [...offers].reverse(),
        APPROVED_ONE_WORD_CANDIDATES,
      );

      expect(forward).toEqual(reversed);
      expect(
        forward.find(({ candidateId }) => candidateId === "cocinero-s"),
      ).toEqual(result("cocinero-s", offers));
    } finally {
      localeCompare.mockRestore();
      Object.defineProperty(Intl, "Collator", {
        configurable: true,
        value: originalCollator,
      });
    }
  });

  it("matches the exact pinned snapshot offer IDs and titles", () => {
    const snapshotPath = resolve(
      ROOT,
      FP_ONE_WORD_SNAPSHOT_CONTRACT.resourcePath,
    );
    const bytes = readFileSync(snapshotPath);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      FP_ONE_WORD_SNAPSHOT_CONTRACT.sha256,
    );

    const raw = JSON.parse(bytes.toString("utf8")) as unknown;
    expect(Array.isArray(raw)).toBe(true);
    expect(raw).toHaveLength(FP_ONE_WORD_SNAPSHOT_CONTRACT.recordCount);
    const offers = (raw as unknown[]).map((entry) => {
      if (!entry || typeof entry !== "object") throw new Error("Invalid offer");
      const { id, title } = entry as { id?: unknown; title?: unknown };
      return OneWordOfferSchema.parse({ id, title });
    });

    const results = simulateApprovedOneWordCandidates(
      offers,
      APPROVED_ONE_WORD_CANDIDATES,
    ).map((entry) => OneWordCandidateResultSchema.parse(entry));

    for (const candidate of APPROVED_ONE_WORD_CANDIDATES) {
      const matches = EXPECTED_MATCHES_BY_CANDIDATE[candidate.candidateId];
      expect(
        results.find(
          ({ candidateId }) => candidateId === candidate.candidateId,
        ),
      ).toEqual(result(candidate.candidateId, matches));
      expect(matches).toHaveLength(
        EXPECTED_MATCH_COUNTS[candidate.candidateId],
      );
    }

    const union = [
      ...new Set(results.flatMap(({ matchedOfferIds }) => matchedOfferIds)),
    ].sort(compareCodePoints);
    expect(union).toEqual(EXPECTED_UNION_OFFER_IDS);
    expect(union).toHaveLength(EXPECTED_MATCH_COUNTS.union);
    expect(
      EXPECTED_MATCHES_BY_CANDIDATE["albanil-es"].map(({ title }) => title),
    ).toContain(
      "3 Oficial/a Segunda Oficios (Especialidad Albañil-Conductor/a) para Ayto. de Palencia",
    );
  });
});
