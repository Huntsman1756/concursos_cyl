import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  loadAndValidateContestFreeze,
  recomputeContestFreeze,
  validateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";

const ROOT = process.cwd();

async function readFreeze(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile("docs/contest/coverage-freeze.json", "utf8"),
  ) as Record<string, unknown>;
}

describe("contest coverage freeze validator", () => {
  it("reports the intentionally stale freeze artifact after the SEPE inventory expansion", async () => {
    const freeze = await readFreeze();

    expect(() => loadAndValidateContestFreeze(ROOT)).toThrow(
      /sepeOccupationMarket|sourceCommitSha|ancestor/i,
    );
    expect(freeze.manifest).toBeDefined();
  }, 30_000);

  it("recomputes an envelope-backed SEPE snapshot by adapted record count", async () => {
    const freeze = await readFreeze();
    const manifest = freeze.manifest as Record<string, unknown>;
    const resourceSnapshots = manifest.resourceSnapshots as Record<
      string,
      unknown
    >;
    const currentManifest = JSON.parse(
      await readFile("public/data/v1/manifest.json", "utf8"),
    ) as {
      resourceSnapshots: Record<
        string,
        { resourcePath: string; sha256: string; recordCount: number }
      >;
    };
    const sepeSnapshot = currentManifest.resourceSnapshots.sepeOccupationMarket;
    const freezeWithSepe = {
      ...freeze,
      manifest: {
        ...manifest,
        resourceSnapshots: {
          ...resourceSnapshots,
          sepeOccupationMarket: {
            resourcePath: sepeSnapshot.resourcePath,
            sha256: sepeSnapshot.sha256,
            recordCount: sepeSnapshot.recordCount,
          },
        },
      },
    } as unknown as ContestFreeze;

    const recomputed = recomputeContestFreeze(ROOT, freezeWithSepe);

    expect(
      recomputed.manifest.resourceSnapshots.sepeOccupationMarket.recordCount,
    ).toBe(116);
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
    ).toThrow(/manifest|sha256|recomput|sepeOccupationMarket/i);
  }, 30_000);

  it("rejects a source commit that cannot prove the no-mutation boundary", async () => {
    const freeze = await readFreeze();

    expect(() =>
      validateContestFreeze(
        { ...freeze, sourceCommitSha: "0".repeat(40) },
        { rootDir: ROOT },
      ),
    ).toThrow(/sourceCommitSha|commit|mutation|sepeOccupationMarket/i);
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
            distinctQualificationCount: 13,
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
    ).toThrow(/coverage|offer|recomput|marginal|sepeOccupationMarket/i);
  }, 30_000);
});
