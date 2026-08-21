import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { prepareRuntimeData } from "./prepareRuntimeData";

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`, "utf8");
}

describe("prepareRuntimeData", () => {
  it("retains terminal evidence snapshots and ignores bare IDs elsewhere", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const coverageFreeze = "20260821150000000-111111111111";
    const releaseEvidence = "20260821160000000-222222222222";
    const bareAnalysisId = "20260101000000000-000000000000";
    const unreferenced = "20260821144337486-a56e3eeaffa6";

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

    expect(result.snapshotIds).toEqual([
      active,
      coverageFreeze,
      releaseEvidence,
    ]);
    expect(await readdir(join(target, "v1", "snapshots"))).toEqual([
      active,
      coverageFreeze,
      releaseEvidence,
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

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await writeJson(join(root, "docs", "contest", "coverage-freeze.json"), {});
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {});
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

  it("rejects a missing terminal evidence file", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await writeJson(join(root, "docs", "contest", "coverage-freeze.json"), {
      resourcePath: `/data/v1/snapshots/${active}/programs.json`,
    });

    await expect(prepareRuntimeData({ root, source, target })).rejects.toThrow(
      "docs/contest/release-evidence.json",
    );
  });

  it("rejects a terminal evidence snapshot that is unavailable", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const missing = "20260821150000000-111111111111";

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await writeJson(join(root, "docs", "contest", "coverage-freeze.json"), {
      resourcePath: `/data/v1/snapshots/${missing}/programs.json`,
    });
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {
      logicalResourcePath: `/data/v1/snapshots/${active}/programs.json`,
    });

    await expect(prepareRuntimeData({ root, source, target })).rejects.toThrow(
      `Referenced runtime snapshot is missing: ${missing}`,
    );
  });

  it("rejects an evidence path without a resource filename", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";

    await writeJson(join(source, "v1", "manifest.json"), {
      snapshotId: active,
      resourceSnapshots: {},
    });
    await writeJson(
      join(source, "v1", "snapshots", active, "programs.json"),
      [],
    );
    await writeJson(join(root, "docs", "contest", "coverage-freeze.json"), {
      resourcePath: `/data/v1/snapshots/${active}`,
    });
    await writeJson(join(root, "docs", "contest", "release-evidence.json"), {
      logicalResourcePath: `/data/v1/snapshots/${active}/programs.json`,
    });

    await expect(prepareRuntimeData({ root, source, target })).rejects.toThrow(
      "missing a resource filename",
    );
  });
});
