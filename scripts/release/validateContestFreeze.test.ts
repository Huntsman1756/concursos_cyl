import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertContestFreezeWritePreflight,
  getDirtyContestFreezeSourcePaths,
  loadAndValidateContestFreeze,
  migrateFreezeResourcePathToSnapshot,
  parseContestFreezeWriteSourceCommit,
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
  it("requires an explicit source commit when freeze write is requested", () => {
    expect(() => parseContestFreezeWriteSourceCommit(["--write"])).toThrow(
      /--source-commit/i,
    );
    expect(
      parseContestFreezeWriteSourceCommit([
        "--write",
        "--source-commit",
        "a".repeat(40),
      ]),
    ).toBe("a".repeat(40));
  });

  it("seeds a newly added resource inside the existing freeze snapshot", () => {
    expect(
      migrateFreezeResourcePathToSnapshot(
        "/data/v1/snapshots/new-snapshot/sepe-occupation-market.json",
        "old-snapshot",
      ),
    ).toBe("/data/v1/snapshots/old-snapshot/sepe-occupation-market.json");
  });

  it("detects dirty freeze inputs in a hermetic Git repository", () => {
    const root = mkdtempSync(join(tmpdir(), "contest-freeze-"));
    try {
      mkdirSync(join(root, "analysis"), { recursive: true });
      mkdirSync(join(root, "data", "curated"), { recursive: true });
      mkdirSync(join(root, "docs", "contest"), { recursive: true });
      writeFileSync(
        join(root, "analysis", "fp_coverage_expansion_results.json"),
        "{}\n",
        "utf8",
      );
      writeFileSync(
        join(root, "analysis", "fp_one_word_publication_reviews.json"),
        "{}\n",
        "utf8",
      );
      writeFileSync(
        join(root, "data", "curated", "input.json"),
        "{}\n",
        "utf8",
      );
      const freezePath = join(root, "docs", "contest", "coverage-freeze.json");
      writeFileSync(freezePath, '{"sentinel":true}\n', "utf8");
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], {
        cwd: root,
      });
      execFileSync("git", ["config", "user.name", "Contest Test"], {
        cwd: root,
      });
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
      writeFileSync(
        join(root, "analysis", "fp_one_word_publication_reviews.json"),
        '{"dirty":true}\n',
        "utf8",
      );

      const dirty = getDirtyContestFreezeSourcePaths(root);
      expect(dirty.some((entry) => entry.includes("analysis"))).toBe(true);
      expect(() => assertContestFreezeWritePreflight(root)).toThrow(
        /dirty|analysis/i,
      );
      expect(readFileSync(freezePath, "utf8")).toBe('{"sentinel":true}\n');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires exactly 21 manifest resources and the canonical SEPE snapshot count", async () => {
    const freeze = await readFreeze();
    const manifest = freeze.manifest as Record<string, unknown>;
    const resourceSnapshots = manifest.resourceSnapshots as Record<
      string,
      unknown
    >;

    const withoutSepe = { ...resourceSnapshots };
    delete withoutSepe.sepeOccupationMarket;
    expect(() =>
      validateContestFreeze({
        ...freeze,
        manifest: { ...manifest, resourceSnapshots: withoutSepe },
      }),
    ).toThrow(/21|sepeOccupationMarket|missing/i);

    const currentManifest = JSON.parse(
      await readFile("public/data/v1/manifest.json", "utf8"),
    ) as { resourceSnapshots: Record<string, { recordCount: number }> };
    expect(
      currentManifest.resourceSnapshots.sepeOccupationMarket.recordCount,
    ).toBe(116);
  }, 30_000);

  it("validates the final freeze after the SEPE inventory expansion", async () => {
    const freeze = await readFreeze();
    const manifest = freeze.manifest as {
      resourceSnapshots: Record<string, { recordCount: number }>;
    };

    expect(() => loadAndValidateContestFreeze(ROOT)).not.toThrow();
    expect(Object.keys(manifest.resourceSnapshots)).toHaveLength(21);
    expect(manifest.resourceSnapshots.sepeOccupationMarket?.recordCount).toBe(
      116,
    );
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
    ).toThrow(/21|sourceCommitSha|commit|mutation|sepeOccupationMarket/i);
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
    ).toThrow(/21|coverage|offer|recomput|marginal|sepeOccupationMarket/i);
  }, 30_000);
});
