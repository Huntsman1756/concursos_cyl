import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadRuntimeSnapshotRetention,
  parseRuntimeSnapshotRetention,
} from "./runtimeSnapshotRetention";

const temporaryRoots: string[] = [];

const historicalSnapshotIds = [
  "20260808172031375-7c88ca187340",
  "20260808174436640-7b8aa74dc939",
  "20260808184316256-47f987062bc2",
  "20260808213621985-add4c517860c",
  "20260808215403108-add4c517860c",
  "20260809014318761-5b22c488ce4b",
  "20260822021233066-9d8fa948959b",
  "20260822064449120-b76d60c84145",
  "20260822074315030-a6fc9479d93c",
  "20260822082339635-2706ba4b5a53",
];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("runtime snapshot retention", () => {
  it("accepts the ordered unique snapshot retention shape", () => {
    expect(
      parseRuntimeSnapshotRetention({
        schemaVersion: "1.0.0",
        snapshotIds: historicalSnapshotIds,
      }),
    ).toEqual({
      schemaVersion: "1.0.0",
      snapshotIds: historicalSnapshotIds,
    });
  });

  it("rejects duplicate or unsorted retained snapshot IDs", () => {
    expect(() =>
      parseRuntimeSnapshotRetention({
        schemaVersion: "1.0.0",
        snapshotIds: [
          "20260822085631889-7bbe69380f6d",
          "20260822085631889-7bbe69380f6d",
        ],
      }),
    ).toThrow(/sorted unique/u);

    expect(() =>
      parseRuntimeSnapshotRetention({
        schemaVersion: "1.0.0",
        snapshotIds: [...historicalSnapshotIds].reverse(),
      }),
    ).toThrow(/sorted unique/u);
  });

  it("rejects snapshot IDs outside the immutable directory pattern", () => {
    expect(() =>
      parseRuntimeSnapshotRetention({
        schemaVersion: "1.0.0",
        snapshotIds: ["not-a-snapshot"],
      }),
    ).toThrow(/snapshotIds/u);
  });

  it("loads the config only when every retained snapshot directory exists", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-runtime-retention-"));
    temporaryRoots.push(root);
    await mkdir(join(root, "public", "data", "v1", "snapshots"), {
      recursive: true,
    });
    for (const snapshotId of historicalSnapshotIds) {
      await mkdir(join(root, "public", "data", "v1", "snapshots", snapshotId));
    }
    await mkdir(join(root, "config"), { recursive: true });
    await writeFile(
      join(root, "config", "runtime-snapshot-retention.json"),
      JSON.stringify({
        schemaVersion: "1.0.0",
        snapshotIds: historicalSnapshotIds,
      }),
      "utf8",
    );

    expect(loadRuntimeSnapshotRetention(root)).toEqual({
      schemaVersion: "1.0.0",
      snapshotIds: historicalSnapshotIds,
    });

    await rm(
      join(
        root,
        "public",
        "data",
        "v1",
        "snapshots",
        historicalSnapshotIds[0]!,
      ),
      { recursive: true },
    );
    expect(() => loadRuntimeSnapshotRetention(root)).toThrow(
      historicalSnapshotIds[0]!,
    );
  });
});
