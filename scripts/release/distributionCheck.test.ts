import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { currentManifestFixture } from "../../tests/fixtures/generatedManifest";
import {
  assertDistribution,
  collectDistribution,
  DISTRIBUTION_BUDGET,
} from "./distributionCheck";

async function createDistributionDirectory(): Promise<{
  directory: string;
  resourcePath: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
  const resourcePath = "/data/v1/snapshots/build-1/programs.json";
  const payload = [{ programKey: "IFC03S" }];
  const resourceBytes = Buffer.from(JSON.stringify(payload));
  const resourceSha256 = createHash("sha256")
    .update(resourceBytes)
    .digest("hex");
  const fixture = currentManifestFixture();
  const resourceSnapshots = Object.fromEntries(
    Object.entries(fixture.resourceSnapshots).map(([key, snapshot]) => [
      key,
      {
        ...snapshot,
        resourcePath: resourcePath.replace(
          "programs",
          snapshot.resourcePath.split("/").at(-1)!.replace(".json", ""),
        ),
        recordCount: payload.length,
        sha256: resourceSha256,
      },
    ]),
  );
  const manifest = { ...fixture, resourceSnapshots };
  const resourceDirectory = join(
    directory,
    "data",
    "v1",
    "snapshots",
    "build-1",
  );
  await mkdir(resourceDirectory, { recursive: true });
  await writeFile(
    join(directory, "data", "v1", "manifest.json"),
    JSON.stringify(manifest),
  );
  await Promise.all(
    Object.values(resourceSnapshots).map((snapshot) =>
      writeFile(join(directory, snapshot.resourcePath.slice(1)), resourceBytes),
    ),
  );

  return { directory, resourcePath };
}

describe("distribution check", () => {
  it("verifies every manifest resource hash and record count", async () => {
    const { directory } = await createDistributionDirectory();
    try {
      await expect(collectDistribution(directory)).resolves.toMatchObject({
        dataFiles: 6,
        verifiedResources: 5,
        duplicateGroups: 1,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("counts the current SEPE resource envelope by its published records", async () => {
    const { directory } = await createDistributionDirectory();
    try {
      const sepePath = join(
        process.cwd(),
        "data",
        "curated",
        "sepe-occupation-market.json",
      );
      const sepeBytes = await readFile(sepePath);
      const sepeResource = JSON.parse(sepeBytes.toString("utf8")) as {
        records: readonly unknown[];
      };
      const manifestPath = join(directory, "data", "v1", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        resourceSnapshots: Record<string, unknown>;
      };
      const resourcePath =
        "/data/v1/snapshots/build-1/sepe-occupation-market.json";
      manifest.resourceSnapshots.sepeOccupationMarket = {
        qualityStatus: "passed",
        recordCount: sepeResource.records.length,
        resourcePath,
        schemaVersion: "1.0.0",
        sha256: createHash("sha256").update(sepeBytes).digest("hex"),
        snapshotFetchedAt: "2026-08-22T06:44:49.120Z",
        sourceId: "sepe-occupation-market",
        sourceUpdatedAt: null,
        sourceUrl: "https://www.sepe.es/",
      };
      await writeFile(manifestPath, JSON.stringify(manifest));
      await writeFile(join(directory, resourcePath.slice(1)), sepeBytes);

      await expect(collectDistribution(directory)).resolves.toMatchObject({
        verifiedResources: 6,
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects a tampered resource even when its JSON remains valid", async () => {
    const { directory, resourcePath } = await createDistributionDirectory();
    try {
      const resourceFile = join(directory, resourcePath.slice(1));
      await writeFile(
        resourceFile,
        JSON.stringify([{ programKey: "changed" }]),
      );
      await expect(collectDistribution(directory)).rejects.toThrow(
        /SHA-256 mismatch/iu,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects a manifest count that disagrees with the verified JSON", async () => {
    const { directory } = await createDistributionDirectory();
    try {
      const manifestPath = join(directory, "data", "v1", "manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        resourceSnapshots: Record<string, { recordCount: number }>;
      };
      manifest.resourceSnapshots.programs.recordCount = 2;
      await writeFile(manifestPath, JSON.stringify(manifest));
      await expect(collectDistribution(directory)).rejects.toThrow(
        /record count mismatch/iu,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("fails closed when the generated data budget is exceeded", async () => {
    const { directory } = await createDistributionDirectory();
    try {
      await expect(
        assertDistribution(directory, {
          ...DISTRIBUTION_BUDGET,
          dataBytes: 1,
        }),
      ).rejects.toThrow(/Distribution budget exceeded.*data/iu);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
