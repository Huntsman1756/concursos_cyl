import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  prepareRuntimeData,
  shouldCopyRuntimeCandidate,
} from "./prepareRuntimeData";

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

async function writeRetentionConfig(
  root: string,
  snapshotIds: readonly string[] = [],
): Promise<void> {
  await writeJson(join(root, "config", "runtime-snapshot-retention.json"), {
    schemaVersion: "1.0.0",
    snapshotIds,
  });
  for (const snapshotId of snapshotIds) {
    await mkdir(join(root, "public", "data", "v1", "snapshots", snapshotId), {
      recursive: true,
    });
  }
}

async function createMinimalRuntimeFixture(manifestResourcePath?: string) {
  const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
  const source = join(root, "public", "data");
  const target = join(root, "dist", "data");
  const active = "20260821144454118-a56e3eeaffa6";

  await writeJson(join(source, "v1", "manifest.json"), {
    snapshotId: active,
    resourceSnapshots:
      manifestResourcePath === undefined
        ? {}
        : { programs: { resourcePath: manifestResourcePath } },
  });
  await writeJson(join(source, "v1", "programs.json"), []);
  await writeJson(join(source, "v1", "snapshots", active, "programs.json"), []);
  await writeRetentionConfig(root);

  return { active, root, source, target };
}

describe("prepareRuntimeData", () => {
  it("retains configured snapshots and ignores bare IDs elsewhere", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const coverageFreeze = "20260821150000000-111111111111";
    const releaseEvidence = "20260821160000000-222222222222";
    const bareAnalysisId = "20260101000000000-000000000000";
    const unreferenced = "20260821144337486-a56e3eeaffa6";

    await writeRetentionConfig(root, [coverageFreeze]);

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {
        programs: {
          resourcePath: `/data/v1/snapshots/${active}/programs.json`,
        },
      },
    });
    await writeJson(join(source, "v1", "programs.json"), [{ id: "flat" }]);
    await writeFile(join(source, "v1", "README.md"), "contract\n", "utf8");
    for (const snapshotId of [
      active,
      coverageFreeze,
      releaseEvidence,
      bareAnalysisId,
      unreferenced,
    ]) {
      await writeJson(
        join(source, "v1", "snapshots", snapshotId, "programs.json"),
        [{ id: snapshotId }],
      );
    }
    await writeJson(
      join(
        source,
        "v1",
        "snapshots",
        releaseEvidence,
        "outcome-indicators.json",
      ),
      [],
    );
    await writeJson(join(root, "docs", "contest", "coverage-freeze.json"), {
      manifest: {
        resourceSnapshots: {
          programs: {
            resourcePath: `/data/v1/snapshots/${coverageFreeze}/programs.json`,
          },
        },
      },
    });
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {
      publicVerification: {
        outcomeIndicators: {
          logicalResourcePath: `https://canonical.example/data/v1/snapshots/${releaseEvidence}/outcome-indicators.json`,
        },
      },
    });
    await mkdir(join(root, "analysis"), { recursive: true });
    await writeFile(
      join(root, "analysis", "research.md"),
      `Research note ${bareAnalysisId}\n`,
      "utf8",
    );

    const result = await prepareRuntimeData({ root, source, target });

    expect(result.snapshotIds).toEqual([active, coverageFreeze]);
    expect(await readdir(join(target, "v1", "snapshots"))).toEqual([
      active,
      coverageFreeze,
    ]);
    expect(
      JSON.parse(await readFile(join(target, "v1", "programs.json"), "utf8")),
    ).toEqual([{ id: "flat" }]);
    expect(await readFile(join(target, "v1", "README.md"), "utf8")).toBe(
      "contract\n",
    );
  });

  it("replaces stale generated target data without mutating public source", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";

    await writeRetentionConfig(root);

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await writeJson(join(target, "stale.json"), { stale: true });

    await prepareRuntimeData({ root, source, target });

    expect(await readdir(target)).toEqual(["v1"]);
    expect(
      await readFile(
        join(source, "v1", "snapshots", active, "programs.json"),
        "utf8",
      ),
    ).toBe("[]\n");
  });

  it("restores the old target when staged replacement fails", async () => {
    const fixture = await createMinimalRuntimeFixture(
      `/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json`,
    );
    await writeJson(join(fixture.target, "old.json"), { old: true });
    const stagingPrefix = join(
      dirname(fixture.target),
      `.${basename(fixture.target)}.runtime-`,
    );
    let replacementFailureInjected = false;
    const renameOperation: typeof rename = async (from, to) => {
      if (
        !replacementFailureInjected &&
        String(to) === fixture.target &&
        String(from).startsWith(stagingPrefix)
      ) {
        replacementFailureInjected = true;
        throw new Error("injected replacement failure");
      }
      return rename(from, to);
    };

    await expect(
      prepareRuntimeData(
        {
          root: fixture.root,
          source: fixture.source,
          target: fixture.target,
        },
        { rename: renameOperation },
      ),
    ).rejects.toThrow("injected replacement failure");

    expect(await readFile(join(fixture.target, "old.json"), "utf8")).toBe(
      '{"old":true}\n',
    );
    expect(
      (await readdir(dirname(fixture.target))).filter((entry) =>
        entry.startsWith(`.${basename(fixture.target)}.runtime-`),
      ),
    ).toEqual([]);
    expect(
      await readFile(
        join(
          fixture.source,
          "v1",
          "snapshots",
          fixture.active,
          "programs.json",
        ),
        "utf8",
      ),
    ).toBe("[]\n");
  });

  it("ignores contest documents when selecting configured snapshots", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const retained = "20260822082339635-2706ba4b5a53";
    const evidenceA = "20260821120933391-9bd4488f9029";
    const evidenceB = "20260821144454118-a56e3eeaffa6";

    await writeRetentionConfig(root, [retained]);
    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(join(source, "v1", "programs.json"), [{ id: "flat" }]);
    for (const snapshotId of [active, retained, evidenceA, evidenceB]) {
      await writeJson(
        join(source, "v1", "snapshots", snapshotId, "programs.json"),
        [{ id: snapshotId }],
      );
    }
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {
      manifest: { snapshotId: evidenceA },
    });

    const before = await prepareRuntimeData({ root, source, target });
    const beforeBytes = await readFile(
      join(target, "v1", "programs.json"),
      "utf8",
    );
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {
      manifest: { snapshotId: evidenceB },
    });
    const after = await prepareRuntimeData({ root, source, target });

    expect(before.snapshotIds).toEqual([active, retained]);
    expect(after.snapshotIds).toEqual(before.snapshotIds);
    expect(await readFile(join(target, "v1", "programs.json"), "utf8")).toBe(
      beforeBytes,
    );
  });

  it("rejects a configured snapshot directory that is unavailable", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const missing = "20260821150000000-111111111111";

    await writeJson(join(root, "config", "runtime-snapshot-retention.json"), {
      schemaVersion: "1.0.0",
      snapshotIds: [missing],
    });
    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );

    await expect(prepareRuntimeData({ root, source, target })).rejects.toThrow(
      missing,
    );
  });

  it("rejects a manifest resource file that is missing", async () => {
    const fixture = await createMinimalRuntimeFixture(
      `/data/v1/snapshots/20260821144454118-a56e3eeaffa6/missing.json`,
    );

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("Referenced runtime resource is missing");
  });

  it("rejects an active manifest resource file that is missing", async () => {
    const fixture = await createMinimalRuntimeFixture(
      `/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json`,
    );
    await writeJson(join(fixture.source, "v1", "manifest.json"), {
      snapshotId: fixture.active,
      resourceSnapshots: {
        programs: {
          resourcePath: `/data/v1/snapshots/${fixture.active}/missing.json`,
        },
      },
    });

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("Referenced runtime resource is missing");
  });

  it.each([
    [
      "percent-encoded route",
      "%2Fdata%2Fv1%2Fsnapshots%2F20260821144454118-a56e3eeaffa6%2Fprograms.json",
    ],
    [
      "query abuse",
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json?download=1",
    ],
    [
      "path traversal",
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/../programs.json",
    ],
  ])("rejects snapshot-like %s", async (_name, evidencePath) => {
    const fixture = await createMinimalRuntimeFixture(evidencePath);

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow(
      /Malformed runtime snapshot resource path|not a local resource path/u,
    );
  });

  it("rejects a target parent symlink that resolves into source", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    const targetParent = join(fixture.root, "linked-output");
    await symlink(fixture.source, targetParent, "dir");

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: join(targetParent, "data"),
      }),
    ).rejects.toThrow("disjoint");
  });

  it("rejects an existing target symlink whose physical parent is inside source", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    const outsideTarget = join(fixture.root, "outside-target");
    const target = join(fixture.source, "v1", "snapshots", "runtime-target");
    await mkdir(outsideTarget, { recursive: true });
    await symlink(outsideTarget, target, "dir");

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target,
      }),
    ).rejects.toThrow("disjoint");
  });

  it("rejects an existing target symlink before replacing it", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    const outsideTarget = join(fixture.root, "outside-target");
    const target = join(fixture.root, "linked-output", "data");
    await writeJson(join(outsideTarget, "sentinel.json"), { preserved: true });
    await mkdir(dirname(target), { recursive: true });
    await symlink(outsideTarget, target, "dir");

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target,
      }),
    ).rejects.toThrow("symbolic link");
    expect(
      JSON.parse(await readFile(join(outsideTarget, "sentinel.json"), "utf8")),
    ).toEqual({ preserved: true });
  });

  it("rejects symlinks in flat resources before copying", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await symlink(
      join(fixture.source, "v1", "programs.json"),
      join(fixture.source, "v1", "unsafe-link"),
    );

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("symbolic link");
  });

  it("rejects symlinks in each retained snapshot tree", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await symlink(
      join(fixture.source, "v1", "programs.json"),
      join(fixture.source, "v1", "snapshots", fixture.active, "unsafe-link"),
    );

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("symbolic link");
  });

  it("rejects non-regular flat resource entries", async () => {
    if (process.platform === "win32") return;
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    const socketPath = join(fixture.source, "v1", "runtime.sock");
    const server = createServer();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(socketPath, () => resolve());
    });

    try {
      await expect(
        prepareRuntimeData({
          root: fixture.root,
          source: fixture.source,
          target: fixture.target,
        }),
      ).rejects.toThrow("non-regular entry");
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await rm(socketPath, { force: true });
    }
  });

  it("permits nested directories containing regular flat resources", async () => {
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await writeJson(join(fixture.source, "v1", "nested", "metadata.json"), {
      ok: true,
    });

    await prepareRuntimeData({
      root: fixture.root,
      source: fixture.source,
      target: fixture.target,
    });

    expect(
      JSON.parse(
        await readFile(
          join(fixture.target, "v1", "nested", "metadata.json"),
          "utf8",
        ),
      ),
    ).toEqual({ ok: true });
  });

  it("filters snapshot paths independently of path separators", () => {
    expect(shouldCopyRuntimeCandidate("")).toBe(true);
    expect(shouldCopyRuntimeCandidate("v1/snapshots")).toBe(false);
    expect(
      shouldCopyRuntimeCandidate("v1/snapshots/active/programs.json"),
    ).toBe(false);
    expect(
      shouldCopyRuntimeCandidate("v1\\snapshots\\active\\programs.json"),
    ).toBe(false);
    expect(shouldCopyRuntimeCandidate("v1\\programs.json")).toBe(true);
  });

  it("resolves a multi-segment target after a physical source alias", async () => {
    if (process.platform === "win32") return;
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const physicalRoot = join(root, "physical");
    const source = join(physicalRoot, "two", "one");
    const sourceAlias = join(root, "source-alias");
    const target = join(sourceAlias, "one", "two");
    const active = "20260821144454118-a56e3eeaffa6";

    await writeRetentionConfig(root);
    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await symlink(physicalRoot, sourceAlias, "dir");

    await prepareRuntimeData({ root, source, target });

    expect(await readdir(join(target, "v1", "snapshots"))).toEqual([active]);
  });

  it.each([
    [
      "query",
      `/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json?download=1`,
    ],
    [
      "traversal",
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/../programs.json",
    ],
    [
      "encoded",
      "%2Fdata%2Fv1%2Fsnapshots%2F20260821144454118-a56e3eeaffa6%2Fprograms.json",
    ],
  ])("rejects malformed manifest resource route: %s", async (_name, path) => {
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await writeJson(join(fixture.source, "v1", "manifest.json"), {
      snapshotId: fixture.active,
      resourceSnapshots: { programs: { resourcePath: path } },
    });

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow(/Malformed runtime snapshot resource path|resource path/);
  });

  it("rejects an absolute URL in a manifest resource path", async () => {
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await writeJson(join(fixture.source, "v1", "manifest.json"), {
      snapshotId: fixture.active,
      resourceSnapshots: {
        programs: {
          resourcePath: `https://example.invalid/data/v1/snapshots/${fixture.active}/programs.json`,
        },
      },
    });

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("manifest resourceSnapshots.programs.resourcePath");
  });

  it("rejects manifest resource snapshots that disagree with snapshotId", async () => {
    const fixture = await createMinimalRuntimeFixture(
      "/data/v1/snapshots/20260821144454118-a56e3eeaffa6/programs.json",
    );
    await writeJson(join(fixture.source, "v1", "manifest.json"), {
      snapshotId: fixture.active,
      resourceSnapshots: {
        programs: {
          resourcePath:
            "/data/v1/snapshots/20260821150000000-111111111111/programs.json",
        },
      },
    });

    await expect(
      prepareRuntimeData({
        root: fixture.root,
        source: fixture.source,
        target: fixture.target,
      }),
    ).rejects.toThrow("exactly one snapshot");
  });
});
