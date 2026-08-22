import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { CANDIDATE_RESOURCE_KEYS } from "../../data/schemas/candidateResourceAllowlist";
import {
  validateCandidateBoundary,
  type CandidateBoundaryOptions,
} from "./validateCandidateBoundary";

const ROOT = process.cwd();

const DOCUMENT_PATHS = [
  "docs/contest/claim-ledger.json",
  "docs/contest/application-summary.md",
  "docs/contest/technical-evidence.md",
  "docs/contest/jury-memo.md",
  "docs/contest/submission-checklist.md",
  "docs/contest/source-ledger.md",
  "docs/contest/limitations.md",
  "docs/contest/coverage-freeze.json",
  "docs/contest/evidence-capture.json",
  "docs/contest/release-evidence.json",
  "DATA_LICENSE.md",
] as const;

const PUBLIC_MANIFEST = "public/data/v1/manifest.json";
const DIST_MANIFEST = "dist/data/v1/manifest.json";
const SNAPSHOT_ID = "20260822085631889-7bbe69380f6d";
const RESTORED_FILES = [
  PUBLIC_MANIFEST,
  DIST_MANIFEST,
  ...DOCUMENT_PATHS,
] as const;

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

async function currentCandidateOptions(
  rootDir = ROOT,
): Promise<CandidateBoundaryOptions> {
  const manifest = JSON.parse(
    await readFile(join(rootDir, PUBLIC_MANIFEST), "utf8"),
  ) as {
    resourceSnapshots: {
      sepeOccupationMarket: { resourcePath: string };
    };
  };
  return {
    rootDir,
    manifestPath: "public/data/v1/manifest.json",
    sepeResourcePath: join(
      rootDir,
      "public",
      manifest.resourceSnapshots.sepeOccupationMarket.resourcePath.slice(1),
    ),
    documentPaths: DOCUMENT_PATHS,
    bundleRoots: ["dist"],
  };
}

function optionsPathFor(rootDir: string, key: "sepeOccupationMarket"): string {
  if (key !== "sepeOccupationMarket") {
    throw new Error(`Unsupported fixture key: ${key}`);
  }
  return join(
    rootDir,
    "public/data/v1/snapshots",
    SNAPSHOT_ID,
    "sepe-occupation-market.json",
  );
}

async function copyCandidateFixture(): Promise<string> {
  const rootDir = await mkdtemp(join(tmpdir(), "candidate-boundary-"));
  const publicSnapshotPath = join(
    rootDir,
    "public/data/v1/snapshots",
    SNAPSHOT_ID,
  );
  const distSnapshotPath = join(rootDir, "dist/data/v1/snapshots", SNAPSHOT_ID);

  await mkdir(join(rootDir, "public/data/v1/snapshots"), {
    recursive: true,
  });
  await mkdir(join(rootDir, "dist/data/v1/snapshots"), { recursive: true });
  await cp(join(ROOT, PUBLIC_MANIFEST), join(rootDir, PUBLIC_MANIFEST));
  await cp(join(ROOT, PUBLIC_MANIFEST), join(rootDir, DIST_MANIFEST));
  await cp(
    join(ROOT, "public/data/v1/snapshots", SNAPSHOT_ID),
    publicSnapshotPath,
    { recursive: true },
  );
  await cp(
    join(ROOT, "public/data/v1/snapshots", SNAPSHOT_ID),
    distSnapshotPath,
    { recursive: true },
  );

  for (const documentPath of DOCUMENT_PATHS) {
    const destination = join(rootDir, documentPath);
    await mkdir(join(destination, ".."), { recursive: true });
    await cp(join(ROOT, documentPath), destination);
  }
  return rootDir;
}

async function readFixtureJson(
  rootDir: string,
  relativePath: string,
): Promise<unknown> {
  return JSON.parse(await readFile(join(rootDir, relativePath), "utf8"));
}

async function writeFixtureJson(
  rootDir: string,
  relativePath: string,
  value: unknown,
): Promise<void> {
  await writeFile(
    join(rootDir, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function updateFixtureJson(
  rootDir: string,
  relativePath: string,
  update: (value: unknown) => void,
): Promise<void> {
  const value = await readFixtureJson(rootDir, relativePath);
  update(value);
  await writeFixtureJson(rootDir, relativePath, value);
}

function nestedResourceSnapshots(value: unknown): Record<string, unknown> {
  const document = asRecord(value, "coverage freeze");
  const manifest = asRecord(document.manifest, "coverage freeze manifest");
  return asRecord(
    manifest.resourceSnapshots,
    "coverage freeze resourceSnapshots",
  );
}

function publicResourceSnapshots(value: unknown): Record<string, unknown> {
  const manifest = asRecord(value, "manifest");
  return asRecord(manifest.resourceSnapshots, "manifest resourceSnapshots");
}

describe("candidate data boundary", () => {
  let fixtureRoot = "";
  const originalFiles = new Map<string, Buffer>();
  let snapshotTreeChanged = false;

  beforeAll(async () => {
    fixtureRoot = await copyCandidateFixture();
    for (const relativePath of RESTORED_FILES) {
      originalFiles.set(
        relativePath,
        await readFile(join(fixtureRoot, relativePath)),
      );
    }
  }, 120_000);

  afterEach(async () => {
    for (const [relativePath, bytes] of originalFiles) {
      await writeFile(join(fixtureRoot, relativePath), bytes);
    }
    await rm(join(fixtureRoot, "dist/data/v1/snapshots/decoupled"), {
      recursive: true,
      force: true,
    });
    await rm(join(fixtureRoot, "public/data/v1/physical-target"), {
      recursive: true,
      force: true,
    });
    await rm(join(fixtureRoot, "public/data/v1/alternate-manifest.json"), {
      force: true,
    });
    await rm(join(fixtureRoot, "public/data/v1/copied-sepe.json"), {
      force: true,
    });
    await rm(join(fixtureRoot, "dist/data/v1/extra.json"), { force: true });
    await rm(join(fixtureRoot, "root-alias"), { force: true });
    if (snapshotTreeChanged) {
      await rm(join(fixtureRoot, "public/data/v1/snapshots", SNAPSHOT_ID), {
        recursive: true,
        force: true,
      });
      await rm(join(fixtureRoot, "dist/data/v1/snapshots", SNAPSHOT_ID), {
        recursive: true,
        force: true,
      });
      await cp(
        join(ROOT, "public/data/v1/snapshots", SNAPSHOT_ID),
        join(fixtureRoot, "public/data/v1/snapshots", SNAPSHOT_ID),
        { recursive: true },
      );
      await cp(
        join(ROOT, "public/data/v1/snapshots", SNAPSHOT_ID),
        join(fixtureRoot, "dist/data/v1/snapshots", SNAPSHOT_ID),
        { recursive: true },
      );
      snapshotTreeChanged = false;
    }
  });

  afterAll(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
  });

  it("retains the canonical SEPE runtime evidence", async () => {
    await expect(
      validateCandidateBoundary(await currentCandidateOptions()),
    ).resolves.toMatchObject({ resourceCount: 21, sepeRecordCount: 116 });
  }, 90_000);

  it("rejects a stale one-record SEPE payload", async () => {
    const options = await currentCandidateOptions(fixtureRoot);
    const stalePath = join(fixtureRoot, "stale-sepe.json");
    await cp(
      join(
        ROOT,
        "public/data/v1/snapshots/20260822021233066-9d8fa948959b/sepe-occupation-market.json",
      ),
      stalePath,
    );
    await expect(
      validateCandidateBoundary({
        ...options,
        sepeResourcePath: stalePath,
      }),
    ).rejects.toThrow(/canonical.*116|sepeOccupationMarket/iu);
  }, 90_000);

  it("compares the candidate set with the generated manifest", async () => {
    const options = await currentCandidateOptions(fixtureRoot);
    const result = await validateCandidateBoundary(options);

    expect(result.resourceKeys).toEqual([...CANDIDATE_RESOURCE_KEYS]);
  }, 90_000);

  it("rejects a symlinked candidate root", async () => {
    const rootAlias = join(fixtureRoot, "root-alias");
    await symlink(fixtureRoot, rootAlias, "dir");

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(rootAlias)),
    ).rejects.toThrow(/root.*symlink|symlink.*root|canonical.*root/iu);
  }, 90_000);

  it("rejects runtime options with empty document and bundle lists", async () => {
    const options = await currentCandidateOptions(fixtureRoot);

    await expect(
      validateCandidateBoundary({
        ...options,
        documentPaths: [] as never,
        bundleRoots: [] as never,
      }),
    ).rejects.toThrow(/documentPaths|bundleRoots|expected|options/iu);
  }, 90_000);

  it("rejects an alternate manifest path even when its bytes are valid", async () => {
    await cp(
      join(fixtureRoot, PUBLIC_MANIFEST),
      join(fixtureRoot, "public/data/v1/alternate-manifest.json"),
    );
    const options = await currentCandidateOptions(fixtureRoot);

    await expect(
      validateCandidateBoundary({
        ...options,
        manifestPath: "public/data/v1/alternate-manifest.json",
      }),
    ).rejects.toThrow(/manifest.*path|options|canonical/iu);
  }, 90_000);

  it("rejects an alternate SEPE resource path with identical bytes", async () => {
    await cp(
      optionsPathFor(fixtureRoot, "sepeOccupationMarket"),
      join(fixtureRoot, "public/data/v1/copied-sepe.json"),
    );
    const options = await currentCandidateOptions(fixtureRoot);

    await expect(
      validateCandidateBoundary({
        ...options,
        sepeResourcePath: join(fixtureRoot, "public/data/v1/copied-sepe.json"),
      }),
    ).rejects.toThrow(/SEPE.*path|sepeResourcePath|canonical|options/iu);
  }, 90_000);

  it("rejects a bundle whose per-key snapshot triple is decoupled", async () => {
    const bundleManifest = await readFixtureJson(fixtureRoot, DIST_MANIFEST);
    const snapshots = publicResourceSnapshots(bundleManifest);
    const centers = asRecord(snapshots.centers, "centers snapshot");
    const decoupledId = "decoupled";
    const sourcePath = join(
      fixtureRoot,
      "dist",
      String(centers.resourcePath).slice(1),
    );
    const decoupledPath = join(
      fixtureRoot,
      "dist/data/v1/snapshots",
      decoupledId,
      "centers.json",
    );
    await mkdir(join(decoupledPath, ".."), { recursive: true });
    await cp(sourcePath, decoupledPath);
    centers.resourcePath = `/data/v1/snapshots/${decoupledId}/centers.json`;
    await writeFixtureJson(fixtureRoot, DIST_MANIFEST, bundleManifest);

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/bundle.*centers.*resourcePath|snapshot.*centers/iu);
  }, 90_000);

  it("rejects a bundle with divergent manifest metadata", async () => {
    await updateFixtureJson(fixtureRoot, DIST_MANIFEST, (manifest) => {
      const document = asRecord(manifest, "dist manifest");
      document.generatedAt = "2026-08-22T09:00:00.000Z";
    });

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/bundle|identical|metadata|generatedAt/iu);
  }, 90_000);

  it("rejects a bundle with an extra data resource", async () => {
    await writeFile(
      join(fixtureRoot, "dist/data/v1/extra.json"),
      "[]\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/bundle|extra|resource|identical/iu);
  }, 90_000);

  it.each([
    ["recordCount", 1, /recordCount|record count/iu],
    ["sha256", "0".repeat(64), /sha256|hash/iu],
    [
      "resourcePath",
      `/data/v1/snapshots/${SNAPSHOT_ID}/other.json`,
      /resourcePath|path/iu,
    ],
  ])(
    "rejects a nested SEPE snapshot with divergent %s",
    async (field, value, expected) => {
      await updateFixtureJson(
        fixtureRoot,
        "docs/contest/coverage-freeze.json",
        (freeze) => {
          const snapshots = nestedResourceSnapshots(freeze);
          const sepe = asRecord(
            snapshots.sepeOccupationMarket,
            "SEPE snapshot",
          );
          sepe[field] = value;
        },
      );

      await expect(
        validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
      ).rejects.toThrow(expected);
    },
  );

  it("compares direct resourceSnapshots when evidence is not nested", async () => {
    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/coverage-freeze.json",
      (freeze) => {
        const document = asRecord(freeze, "coverage freeze");
        const manifest = asRecord(
          document.manifest,
          "coverage freeze manifest",
        );
        document.resourceSnapshots = manifest.resourceSnapshots;
        delete manifest.resourceSnapshots;
        const snapshots = asRecord(
          document.resourceSnapshots,
          "direct resourceSnapshots",
        );
        const sepe = asRecord(snapshots.sepeOccupationMarket, "SEPE snapshot");
        sepe.recordCount = 1;
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/coverage-freeze.*recordCount|record count/iu);
  }, 90_000);

  it("rejects malformed recognized nested resourceSnapshots", async () => {
    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/coverage-freeze.json",
      (freeze) => {
        const document = asRecord(freeze, "coverage freeze");
        const manifest = asRecord(
          document.manifest,
          "coverage freeze manifest",
        );
        manifest.resourceSnapshots = "malformed";
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/resourceSnapshots.*object|malformed/iu);
  }, 90_000);

  it("rejects malformed recognized resourceKeys", async () => {
    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/release-evidence.json",
      (release) => {
        const document = asRecord(release, "release evidence");
        document.resourceKeys = "malformed";
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/resourceKeys.*array|malformed/iu);
  }, 90_000);

  it("requires every evidence document to carry a complete manifest", async () => {
    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/coverage-freeze.json",
      (freeze) => {
        delete asRecord(freeze, "coverage freeze").manifest;
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/manifest.*required|evidence.*manifest|snapshotId/iu);
  }, 90_000);

  it.each(["snapshotId", "sha256"])(
    "rejects evidence manifests missing %s",
    async (field) => {
      await updateFixtureJson(
        fixtureRoot,
        "docs/contest/release-evidence.json",
        (release) => {
          const document = asRecord(release, "release evidence");
          const manifest = asRecord(document.manifest, "release manifest");
          delete manifest[field];
        },
      );

      await expect(
        validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
      ).rejects.toThrow(/manifest|snapshotId|sha256/iu);
    },
  );

  it("does not accept resourceKeys as a keys-only evidence substitute", async () => {
    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/release-evidence.json",
      (release) => {
        const document = asRecord(release, "release evidence");
        document.resourceKeys = [...CANDIDATE_RESOURCE_KEYS];
        delete document.manifest;
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/manifest.*required|keys-only|snapshotId/iu);
  }, 90_000);

  it("compares snapshots after keys and rejects mixed divergent representations", async () => {
    const publicManifest = await readFixtureJson(fixtureRoot, PUBLIC_MANIFEST);
    const snapshots = JSON.parse(
      JSON.stringify(publicResourceSnapshots(publicManifest)),
    ) as Record<string, unknown>;
    const centers = asRecord(snapshots.centers, "centers snapshot");
    centers.recordCount = 1;

    await updateFixtureJson(
      fixtureRoot,
      "docs/contest/coverage-freeze.json",
      (release) => {
        const document = asRecord(release, "coverage freeze");
        const originalManifest = asRecord(
          document.manifest,
          "coverage freeze manifest",
        );
        document.resourceKeys = [...CANDIDATE_RESOURCE_KEYS];
        document.manifest = {
          snapshotId: originalManifest.snapshotId,
          sha256: originalManifest.sha256,
          resourceSnapshots: snapshots,
        };
      },
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(
      /coverage-freeze.*(?:centers|resourceKeys|resourceSnapshots)|recordCount|record count|mixed/iu,
    );
  }, 90_000);

  it.each([
    ["snapshotId", "different-snapshot", /snapshotId/iu],
    ["sha256", "0".repeat(64), /sha256|manifest.*hash/iu],
  ])(
    "binds evidence manifest %s to the public manifest",
    async (field, value, expected) => {
      await updateFixtureJson(
        fixtureRoot,
        "docs/contest/release-evidence.json",
        (release) => {
          const document = asRecord(release, "release evidence");
          const manifest = asRecord(document.manifest, "release manifest");
          manifest[field] = value;
        },
      );

      await expect(
        validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
      ).rejects.toThrow(expected);
    },
  );

  it.each([PUBLIC_MANIFEST, DIST_MANIFEST])(
    "rejects duplicate JSON keys in %s",
    async (relativePath) => {
      const original = await readFile(join(fixtureRoot, relativePath), "utf8");
      const duplicate = original.replace(
        '"qualityStatus": "passed",',
        '"qualityStatus": "passed",\n  "qualityStatus": "passed",',
      );
      expect(duplicate).not.toBe(original);
      await writeFile(join(fixtureRoot, relativePath), duplicate, "utf8");

      await expect(
        validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
      ).rejects.toThrow(/duplicate.*json.*key|duplicate.*qualityStatus/iu);
    },
    90_000,
  );

  it("rejects a symlink in a public resource file", async () => {
    const snapshotPath = join(
      fixtureRoot,
      "public/data/v1/snapshots",
      SNAPSHOT_ID,
    );
    const targetPath = join(fixtureRoot, "public/data/v1/physical-target");
    await mkdir(targetPath, { recursive: true });
    await cp(
      join(snapshotPath, "centers.json"),
      join(targetPath, "centers.json"),
    );
    await rm(join(snapshotPath, "centers.json"), { force: true });
    await symlink(
      join(targetPath, "centers.json"),
      join(snapshotPath, "centers.json"),
    );
    snapshotTreeChanged = true;

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/symlink/iu);
  }, 90_000);

  it("rejects a symlink in a physical resource parent", async () => {
    const snapshotsPath = join(fixtureRoot, "public/data/v1/snapshots");
    const realSnapshotPath = join(
      fixtureRoot,
      "public/data/v1/physical-target",
    );
    await rm(join(snapshotsPath, SNAPSHOT_ID), {
      recursive: true,
      force: true,
    });
    await cp(
      join(ROOT, "public/data/v1/snapshots", SNAPSHOT_ID),
      realSnapshotPath,
      { recursive: true },
    );
    await symlink(realSnapshotPath, join(snapshotsPath, SNAPSHOT_ID), "dir");
    snapshotTreeChanged = true;

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/symlink/iu);
  }, 90_000);

  it("rejects traversal in a requested resource path", async () => {
    const options = await currentCandidateOptions(fixtureRoot);
    await expect(
      validateCandidateBoundary({
        ...options,
        sepeResourcePath: "public/data/v1/../../outside.json",
      }),
    ).rejects.toThrow(/safe|escape|path/iu);
  }, 90_000);

  it("rejects affirmative multiline SEPE ownership and licence claims", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      "SEPE\nes un recurso propiedad de la Junta de Castilla y León y se distribuye bajo MIT.\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/ownership|licen|JCyL|SEPE/iu);
  }, 90_000);

  it("allows an explicit negative SEPE ownership and licence statement", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      "SEPE no se licencia como JCyL, CC BY o MIT; se conserva como fuente complementaria.\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).resolves.toMatchObject({ resourceCount: 21, sepeRecordCount: 116 });
  }, 90_000);

  it("rejects a later affirmative ownership claim after a negative clause", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      "SEPE no se licencia como JCyL, CC BY o MIT. Después, SEPE es propiedad de la Junta de Castilla y León.\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/ownership|licen|JCyL|SEPE/iu);
  }, 90_000);

  it("audits publisher-owned certificate references for ownership claims", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      "https://certificados.example/certificados/curso es un recurso propiedad de la Junta de Castilla y León y se distribuye bajo CC BY.\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/ownership|licen|publisher|certific/iu);
  }, 90_000);

  it("audits the literal occupation-market anchor independently of URL classification", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      "https://evil.example/occupation-market/cno es propiedad de la Junta de Castilla y León y se distribuye bajo MIT.\n",
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/ownership|occupation-market|licen|SEPE/iu);
  }, 90_000);

  it("rejects invalid UTF-8 in an evidence document", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/application-summary.md"),
      Buffer.from([0xc3, 0x28]),
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/utf-?8|encoding|decode/iu);
  }, 90_000);

  it("detects ownership claims in escaped Unicode JSON string leaves", async () => {
    const releasePath = join(fixtureRoot, "docs/contest/release-evidence.json");
    const original = await readFile(releasePath, "utf8");
    const escapedClaim =
      '"claim":"\\u0053\\u0045\\u0050\\u0045 es propiedad de la Junta de Castilla y Le\\u00f3n y se distribuye bajo MIT",';
    const withClaim = original.replace(
      '"manifest":',
      `${escapedClaim}\n  "manifest":`,
    );
    expect(withClaim).not.toBe(original);
    await writeFile(releasePath, withClaim, "utf8");

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/ownership|licen|SEPE|Junta/iu);
  }, 90_000);

  it("rejects JSON nesting beyond the parser limit", async () => {
    let deeplyNested = "{}";
    for (let depth = 0; depth < 80; depth += 1) {
      deeplyNested = `[${deeplyNested}]`;
    }
    await writeFile(
      join(fixtureRoot, "docs/contest/coverage-freeze.json"),
      `${deeplyNested}\n`,
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/depth|nesting|limit|entries/iu);
  }, 90_000);

  it("rejects trailing JSON garbage in an evidence document", async () => {
    const releasePath = join(fixtureRoot, "docs/contest/release-evidence.json");
    const original = await readFile(releasePath, "utf8");
    await writeFile(releasePath, `${original}\ntrailing`, "utf8");

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/json|trailing|parse/iu);
  }, 90_000);

  it("rejects escaped duplicate governing JSON keys, including surrogate text", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/release-evidence.json"),
      '{"manifest": {}, "\\u006d\\u0061\\u006e\\u0069\\u0066\\u0065\\u0073\\u0074": {}, "claim": "\\ud83d\\ude00"}\n',
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/duplicate.*json.*key|duplicate.*manifest/iu);
  }, 90_000);

  it("rejects duplicate JSON keys in a governing evidence document", async () => {
    await writeFile(
      join(fixtureRoot, "docs/contest/release-evidence.json"),
      '{"manifest": {}, "manifest": {}}\n',
      "utf8",
    );

    await expect(
      validateCandidateBoundary(await currentCandidateOptions(fixtureRoot)),
    ).rejects.toThrow(/duplicate.*json.*key|duplicate.*manifest/iu);
  }, 90_000);
});
