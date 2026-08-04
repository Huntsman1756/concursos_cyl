import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import {
  liveOfferSourceRecord,
  liveTrainingSourceRecord,
} from "../../tests/fixtures/sourceRecords";
import { buildSnapshots } from "./buildSnapshots";
import { hashFile } from "./hashFile";

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "salida-cyl-task-6-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("hashFile", () => {
  it("hashes the exact bytes written to disk", async () => {
    const root = await temporaryRoot();
    const file = join(root, "bytes.txt");
    await writeFile(file, Buffer.from([0x61, 0x62, 0x63]));

    await expect(hashFile(file)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("buildSnapshots", () => {
  it("writes validated deterministic resources with exact counts and hashes", async () => {
    const root = await temporaryRoot();

    await buildSnapshots({
      rootDirectory: root,
      now: () => new Date("2026-08-04T10:00:00.000Z"),
      fetchTrainingRecords: async () => [{ ...liveTrainingSourceRecord }],
      fetchOfferRecords: async () => [{ ...liveOfferSourceRecord }],
      log: () => undefined,
    });

    const output = join(root, "public", "data", "v1");
    const manifest = GeneratedManifestSchema.parse(
      JSON.parse(await readFile(join(output, "manifest.json"), "utf8")),
    );
    const resources = [
      ["programs", "programs.json"],
      ["centers", "centers.json"],
      ["trainingOfferings", "training-offerings.json"],
      ["jobOffers", "job-offers.json"],
    ] as const;

    expect(manifest.qualityStatus).toBe("passed");
    expect(manifest.qualityReport).toMatchObject({
      counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
    });

    for (const [key, fileName] of resources) {
      const bytes = await readFile(join(output, fileName));
      const records = JSON.parse(bytes.toString("utf8")) as unknown[];
      expect(manifest.resourceSnapshots[key].recordCount).toBe(records.length);
      expect(manifest.resourceSnapshots[key].sha256).toBe(
        createHash("sha256").update(bytes).digest("hex"),
      );
    }
  });

  it("preserves prior resource bytes and records staleness after refresh failure", async () => {
    const root = await temporaryRoot();
    const options = {
      rootDirectory: root,
      now: () => new Date("2026-08-04T10:00:00.000Z"),
      fetchTrainingRecords: async () => [{ ...liveTrainingSourceRecord }],
      fetchOfferRecords: async () => [{ ...liveOfferSourceRecord }],
      log: () => undefined,
    };
    await buildSnapshots(options);

    const output = join(root, "public", "data", "v1");
    const resourceNames = [
      "programs.json",
      "centers.json",
      "training-offerings.json",
      "job-offers.json",
    ];
    const before = await Promise.all(
      resourceNames.map((name) => readFile(join(output, name))),
    );

    await expect(
      buildSnapshots({
        ...options,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        fetchTrainingRecords: async () => {
          throw new Error("official source unavailable");
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    const after = await Promise.all(
      resourceNames.map((name) => readFile(join(output, name))),
    );
    expect(after).toEqual(before);

    const manifest = GeneratedManifestSchema.parse(
      JSON.parse(await readFile(join(output, "manifest.json"), "utf8")),
    );
    expect(manifest.qualityStatus).toBe("stale");
    expect(
      Object.values(manifest.resourceSnapshots).every(
        (snapshot) => snapshot.qualityStatus === "stale",
      ),
    ).toBe(true);
  });
});
