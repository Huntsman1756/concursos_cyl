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
  assertCandidateResourceSet,
  assertCanonicalSepeCandidateResource,
  CANDIDATE_RESOURCE_KEYS,
} from "../../data/schemas/candidateResourceAllowlist";
import {
  assertContestFreezeWritePreflight,
  createFreshContestFreeze,
  getDirtyContestFreezeSourcePaths,
  loadAndValidateContestFreeze,
  migrateFreezeResourcePathToSnapshot,
  parseContestFreezeWriteSourceCommit,
  recomputeContestFreeze,
  validateContestFreeze,
  type ContestFreeze,
  writeContestFreeze,
} from "./validateContestFreeze";

const ROOT = process.cwd();

const APPROVED_SOURCE_COMMIT_SHA = "15cd959529c5c223adff02eda124863a320fe0bf";
const LEGACY_SOURCE_COMMIT_SHA = "05f905397d22b217c4716c88a2406d802892fb6d";

async function readFreeze(): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile("docs/contest/coverage-freeze.json", "utf8"),
  ) as Record<string, unknown>;
}

async function readFreezeV2Shape(): Promise<Record<string, unknown>> {
  const freeze = await readFreeze();
  freeze.schemaVersion = "2.0.0";
  delete freeze.deployment;
  return freeze;
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

  it("blocks --write when the candidate resource allowlist is dirty", () => {
    const root = mkdtempSync(join(tmpdir(), "contest-freeze-allowlist-"));
    try {
      mkdirSync(join(root, "config"), { recursive: true });
      const allowlistPath = join(
        root,
        "config",
        "candidate-resource-allowlist.json",
      );
      writeFileSync(allowlistPath, '{"schemaVersion":"1.0.0"}\n', "utf8");
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], {
        cwd: root,
      });
      execFileSync("git", ["config", "user.name", "Contest Test"], {
        cwd: root,
      });
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
      writeFileSync(allowlistPath, '{"dirty":true}\n', "utf8");

      expect(getDirtyContestFreezeSourcePaths(root)).toEqual([
        "M config/candidate-resource-allowlist.json",
      ]);
      expect(() => assertContestFreezeWritePreflight(root)).toThrow(
        /candidate-resource-allowlist|dirty/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects schema 1 freezes with the exact rebake message", async () => {
    const freeze = await readFreezeV2Shape();
    expect(() =>
      validateContestFreeze(
        { ...freeze, schemaVersion: "1.0.0" },
        { rootDir: ROOT },
      ),
    ).toThrow("coverage freeze schema 1.0.0 must be rebaked as 2.0.0");
  });

  it("rejects deployment state as an unknown schema-2 field", async () => {
    const freeze = await readFreezeV2Shape();
    expect(() =>
      validateContestFreeze(
        { ...freeze, deployment: { status: "verified" } },
        { rootDir: ROOT },
      ),
    ).toThrow(/unknown field.*deployment/iu);
  });

  it("requires the complete candidate resource set in canonical allowlist order", async () => {
    const freeze = await readFreezeV2Shape();
    const manifest = freeze.manifest as Record<string, unknown>;
    const snapshots = manifest.resourceSnapshots as Record<string, unknown>;

    const missing = { ...snapshots };
    delete missing.centers;
    expect(() =>
      validateContestFreeze(
        {
          ...freeze,
          manifest: { ...manifest, resourceSnapshots: missing },
        },
        { rootDir: ROOT },
      ),
    ).toThrow(/candidate resource set|missing|21/iu);

    const extra = { ...snapshots, unexpected: snapshots.centers };
    expect(() =>
      validateContestFreeze(
        {
          ...freeze,
          manifest: { ...manifest, resourceSnapshots: extra },
        },
        { rootDir: ROOT },
      ),
    ).toThrow(/candidate resource set|extra|21/iu);

    const reordered = Object.fromEntries(Object.entries(snapshots).reverse());
    expect(Object.keys(reordered)).not.toEqual([...CANDIDATE_RESOURCE_KEYS]);
    expect(() =>
      validateContestFreeze(
        {
          ...freeze,
          manifest: { ...manifest, resourceSnapshots: reordered },
        },
        { rootDir: ROOT },
      ),
    ).toThrow(/candidate resource set|canonical.*order|order/iu);

    expect(() =>
      assertCandidateResourceSet([...CANDIDATE_RESOURCE_KEYS, "centers"]),
    ).toThrow(/duplicate/iu);
  });

  it.each(["resourcePath", "sha256", "recordCount"] as const)(
    "rejects a current-manifest %s mismatch",
    async (field) => {
      const freeze = await readFreezeV2Shape();
      const manifest = freeze.manifest as Record<string, unknown>;
      const snapshots = manifest.resourceSnapshots as Record<
        string,
        Record<string, unknown>
      >;
      const programs = snapshots.programs;
      const replacement =
        field === "recordCount"
          ? (programs[field] as number) + 1
          : field === "sha256"
            ? "0".repeat(64)
            : "/data/v1/snapshots/wrong/programs.json";

      expect(() =>
        validateContestFreeze(
          {
            ...freeze,
            manifest: {
              ...manifest,
              resourceSnapshots: {
                ...snapshots,
                programs: { ...programs, [field]: replacement },
              },
            },
          },
          { rootDir: ROOT },
        ),
      ).toThrow(/manifest|resource|path|sha256|recordCount|recomput/iu);
    },
  );

  it("validates the canonical SEPE period, sorted unique CNOs, and coverage", async () => {
    const sepe = JSON.parse(
      await readFile(
        "public/data/v1/snapshots/20260822085631889-7bbe69380f6d/sepe-occupation-market.json",
        "utf8",
      ),
    ) as Record<string, unknown>;
    expect(() => assertCanonicalSepeCandidateResource(sepe)).not.toThrow();

    expect(() =>
      assertCanonicalSepeCandidateResource({ ...sepe, period: "2026-06" }),
    ).toThrow(/canonical.*strict|period.*2026-07/iu);

    const records = [...(sepe.records as unknown[])];
    const first = records[0];
    records[1] = first;
    expect(() =>
      assertCanonicalSepeCandidateResource({ ...sepe, records }),
    ).toThrow(/canonical.*strict|unique.*CNO/iu);

    expect(() =>
      assertCanonicalSepeCandidateResource({
        ...sepe,
        records: [...(sepe.records as unknown[])].reverse(),
      }),
    ).toThrow(/canonical.*strict|sorted/iu);

    const coverage = sepe.coverage as Record<string, unknown>;
    expect(() =>
      assertCanonicalSepeCandidateResource({
        ...sepe,
        coverage: {
          ...coverage,
          notPublishedCnoCodes: ["9999"],
        },
      }),
    ).toThrow(/canonical.*strict|missing published CNO|not contain/iu);
  });

  it("rejects the legacy coverage boundary", async () => {
    const freeze = await readFreezeV2Shape();
    expect(() =>
      validateContestFreeze(
        { ...freeze, sourceCommitSha: LEGACY_SOURCE_COMMIT_SHA },
        { rootDir: ROOT },
      ),
    ).toThrow(/05f9053|coverage boundary|sourceCommitSha|mutation/iu);
  });

  it("seeds schema 2 exclusively from current public sources", async () => {
    const fresh = createFreshContestFreeze(ROOT, APPROVED_SOURCE_COMMIT_SHA);

    expect(fresh.schemaVersion).toBe("2.0.0");
    expect(fresh).not.toHaveProperty("deployment");
    expect(Object.keys(fresh.manifest.resourceSnapshots)).toEqual([
      ...CANDIDATE_RESOURCE_KEYS,
    ]);
    expect(fresh.manifest.path).toBe("public/data/v1/manifest.json");
    expect(fresh.manifest.snapshotId).toBe("20260822085631889-7bbe69380f6d");
    expect(fresh.manifest.sha256).toBe(
      "92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18",
    );
    expect(fresh.coverage.approvedRelationCount).toBe(264);
    expect(fresh.coverage.distinctQualificationCount).toBe(113);
    expect(fresh.coverage.modalityKeyCount).toBe(130);
    expect(fresh.coverage.matchedRelationCount).toBe(3);
    expect(fresh.coverage.zeroReviewedRelationCount).toBe(261);
    expect(fresh.offers.matchedOfferCount).toBe(38);
    expect(fresh.coverage.deferredProgramCount).toBe(0);
    expect(fresh.attempts).toEqual({
      completed: 11,
      deferred: 0,
      discarded: 0,
      terminal: 11,
      reserveUnattempted: 0,
    });
  });

  it("writes a v2 candidate from current sources and discards poisoned v1 metadata", async () => {
    const root = mkdtempSync(join(tmpdir(), "contest-freeze-write-"));
    const freezePath = join(root, "coverage-freeze.json");
    try {
      writeFileSync(
        freezePath,
        JSON.stringify({
          schemaVersion: "1.0.0",
          deployment: { status: "verified", expectedRootUrl: "poison" },
          manifest: {
            path: "poisoned/path.json",
            sha256: "f".repeat(64),
            resourceSnapshots: { programs: { recordCount: 1 } },
          },
          coverage: { approvedRelationCount: 1 },
          offers: { matchedOfferCount: 1 },
          attempts: { completed: 1 },
        }),
        "utf8",
      );

      await writeContestFreeze(ROOT, APPROVED_SOURCE_COMMIT_SHA, freezePath);
      const written = JSON.parse(readFileSync(freezePath, "utf8")) as Record<
        string,
        unknown
      >;
      expect(written.schemaVersion).toBe("2.0.0");
      expect(written).not.toHaveProperty("deployment");
      expect(written.manifest).toMatchObject({
        path: "public/data/v1/manifest.json",
        sha256:
          "92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18",
      });
      expect(JSON.stringify(written)).not.toContain("poisoned");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);

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

it("asserts every canonical final fact in the checked-in fixture", async () => {
  const freeze = await readFreeze();
  expect(freeze).not.toHaveProperty("deployment");
  expect(freeze.schemaVersion).toBe("2.0.0");
  expect(freeze.sourceCommitSha).toBe(APPROVED_SOURCE_COMMIT_SHA);

  const manifest = freeze.manifest as Record<string, unknown>;
  expect(manifest).toMatchObject({
    path: "public/data/v1/manifest.json",
    snapshotId: "20260822085631889-7bbe69380f6d",
    sha256: "92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18",
  });
  expect(Object.keys(manifest.resourceSnapshots as object)).toEqual([
    ...CANDIDATE_RESOURCE_KEYS,
  ]);
  const resources = manifest.resourceSnapshots as Record<
    string,
    { recordCount: number }
  >;
  expect(resources.occupations.recordCount).toBe(131);
  expect(resources.occupationAliases.recordCount).toBe(21);
  expect(
    (freeze.coverage as Record<string, unknown>).approvedRelationCount,
  ).toBe(264);
  expect((freeze.coverage as Record<string, unknown>).approvedAliasCount).toBe(
    21,
  );
  expect(
    (freeze.coverage as Record<string, unknown>).matchedRelationCount,
  ).toBe(3);
  expect(
    (freeze.coverage as Record<string, unknown>).zeroReviewedRelationCount,
  ).toBe(261);
  expect((freeze.offers as Record<string, unknown>).matchedOfferCount).toBe(38);
  expect(
    (freeze.coverage as Record<string, unknown>).deferredProgramCount,
  ).toBe(0);
  expect(freeze.attempts).toEqual({
    completed: 11,
    deferred: 0,
    discarded: 0,
    terminal: 11,
    reserveUnattempted: 0,
  });
});
