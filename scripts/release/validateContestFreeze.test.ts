import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  loadAndValidateContestFreeze,
  validateContestFreeze,
} from "./validateContestFreeze";

const ROOT = process.cwd();

async function readFreeze(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile("docs/contest/coverage-freeze.json", "utf8"),
  ) as Record<string, unknown>;
}

describe("contest coverage freeze validator", () => {
  it("accepts the synchronized Track A freeze and recomputes its figures", () => {
    const freeze = loadAndValidateContestFreeze(ROOT);

    expect(freeze.freezeStatus).toBe("frozen");
    expect(freeze.sourceCommitSha).toBe(
      "f14c3bfe23eae25b922abccaba39e137d006c28b",
    );
    expect(freeze.coverage.distinctQualificationCount).toBe(6);
    expect(freeze.coverage.modalityKeyCount).toBe(7);
    expect(freeze.offers.matchedOfferCount).toBe(39);
    expect(freeze.offers.marginalOfferDeltas.unionOfferCount).toBe(0);
  }, 30_000);

  it("rejects a changed manifest hash instead of trusting copied figures", async () => {
    const freeze = await readFreeze();
    const manifest = freeze.manifest as Record<string, unknown>;

    expect(() =>
      validateContestFreeze(
        {
          ...freeze,
          manifest: { ...manifest, sha256: "0".repeat(64) },
        },
        { rootDir: ROOT },
      ),
    ).toThrow(/manifest|sha256|recomput/i);
  }, 30_000);

  it("rejects a source commit that cannot prove the no-mutation boundary", async () => {
    const freeze = await readFreeze();

    expect(() =>
      validateContestFreeze(
        { ...freeze, sourceCommitSha: "0".repeat(40) },
        { rootDir: ROOT },
      ),
    ).toThrow(/sourceCommitSha|commit|mutation/i);
  }, 30_000);

  it("rejects inconsistent coverage counts and marginal deltas", async () => {
    const freeze = await readFreeze();
    const coverage = freeze.coverage as Record<string, unknown>;
    const offers = freeze.offers as Record<string, unknown>;
    const marginalOfferDeltas = offers.marginalOfferDeltas as Record<
      string,
      unknown
    >;

    expect(() =>
      validateContestFreeze(
        {
          ...freeze,
          coverage: {
            ...coverage,
            distinctQualificationCount: 12,
          },
          offers: {
            ...offers,
            marginalOfferDeltas: {
              ...marginalOfferDeltas,
              unionOfferCount: 1,
            },
          },
        },
        { rootDir: ROOT },
      ),
    ).toThrow(/coverage|offer|recomput|marginal/i);
  }, 30_000);
});
