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
  it("stages flat resources, the active snapshot and referenced historical snapshots", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-data-"));
    const source = join(root, "public", "data");
    const target = join(root, "dist", "data");
    const active = "20260821144454118-a56e3eeaffa6";
    const referenced = "20260809014318761-5b22c488ce4b";
    const unreferenced = "20260821144337486-a56e3eeaffa6";

    await writeJson(join(source, "v1", "manifest.json"), {
      resourceSnapshots: {
        programs: {
          resourcePath: `/data/v1/snapshots/${active}/programs.json`,
        },
      },
    });
    await writeJson(join(source, "v1", "programs.json"), [{ id: "flat" }]);
    await writeFile(join(source, "v1", "README.md"), "contract\n", "utf8");
    for (const snapshotId of [active, referenced, unreferenced]) {
      await writeJson(
        join(source, "v1", "snapshots", snapshotId, "programs.json"),
        [{ id: snapshotId }],
      );
    }
    await writeJson(join(root, "analysis", "evidence.json"), {
      snapshotId: referenced,
    });
    await writeJson(join(root, "analysis", "ignored.json"), {
      snapshotId: "20260101000000000-000000000000",
    });

    const result = await prepareRuntimeData({ root, source, target });

    expect(result.snapshotIds).toEqual([referenced, active]);
    expect(await readdir(join(target, "v1", "snapshots"))).toEqual([
      referenced,
      active,
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
});
