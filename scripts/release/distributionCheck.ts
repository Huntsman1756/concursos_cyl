import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import { isGenericImmutableGeneratedResourcePath } from "../../data/schemas/generatedResourceCatalog";
import { adaptSepeOccupationMarketResource } from "../../data/schemas/sepeOccupationMarket";

/** Release limits for generated public data copied into the deployable artifact. */
export const DISTRIBUTION_BUDGET = {
  dataBytes: 125_000_000,
  deduplicableDataBytes: 75_000_000,
  largestDataFileBytes: 12_500_000,
} as const;

export type DistributionBudget = {
  dataBytes: number;
  deduplicableDataBytes: number;
  largestDataFileBytes: number;
};

export type DistributionReport = {
  dataBytes: number;
  dataFiles: number;
  deduplicableDataBytes: number;
  duplicateGroups: number;
  largestDataFile: { path: string; bytes: number };
  verifiedResourceBytes: number;
  verifiedResources: number;
};

type DistributionFile = {
  bytes: number;
  path: string;
  sha256: string;
};

async function collectFiles(
  directory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    const absolutePath = join(directory, entry.name);
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function collectDistributionFiles(
  dataDirectory: string,
): Promise<DistributionFile[]> {
  const relativePaths = await collectFiles(dataDirectory);
  return Promise.all(
    relativePaths.map(async (relativePath) => {
      const bytes = await readFile(join(dataDirectory, relativePath));
      return {
        bytes: bytes.byteLength,
        path: relativePath.replaceAll("\\", "/"),
        sha256: sha256(bytes),
      };
    }),
  );
}

function resourceFilePath(distDirectory: string, resourcePath: string): string {
  if (!isGenericImmutableGeneratedResourcePath(resourcePath)) {
    throw new Error(
      `Manifest resource path is not immutable and same-origin: ${resourcePath}.`,
    );
  }

  const absoluteDistDirectory = resolve(distDirectory);
  const absoluteResourcePath = resolve(
    absoluteDistDirectory,
    `.${resourcePath}`,
  );
  if (
    absoluteResourcePath !== absoluteDistDirectory &&
    !absoluteResourcePath.startsWith(`${absoluteDistDirectory}${sep}`)
  ) {
    throw new Error(`Manifest resource escapes dist: ${resourcePath}.`);
  }

  return absoluteResourcePath;
}

async function verifyManifestResources(
  distDirectory: string,
): Promise<{ bytes: number; count: number }> {
  const manifestPath = join(distDirectory, "data", "v1", "manifest.json");
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Could not parse deployable data manifest at ${manifestPath}.`,
      { cause: error },
    );
  }

  const parsedManifest = GeneratedManifestSchema.safeParse(manifest);
  if (!parsedManifest.success) {
    throw new Error(
      `Deployable data manifest failed schema validation: ${parsedManifest.error.message}`,
    );
  }

  const seenPaths = new Set<string>();
  let verifiedResourceBytes = 0;

  for (const [key, snapshot] of Object.entries(
    parsedManifest.data.resourceSnapshots,
  )) {
    if (seenPaths.has(snapshot.resourcePath)) {
      throw new Error(
        `Manifest resource path is reused by more than one key: ${snapshot.resourcePath}.`,
      );
    }
    seenPaths.add(snapshot.resourcePath);

    const resourcePath = resourceFilePath(distDirectory, snapshot.resourcePath);
    let bytes: Buffer;
    try {
      bytes = await readFile(resourcePath);
    } catch (error) {
      throw new Error(
        `Manifest resource ${key} is missing from the deployable artifact: ${snapshot.resourcePath}.`,
        { cause: error },
      );
    }

    const actualSha256 = sha256(bytes);
    if (actualSha256 !== snapshot.sha256) {
      throw new Error(
        `Manifest resource ${key} has a SHA-256 mismatch: expected ${snapshot.sha256}, got ${actualSha256}.`,
      );
    }

    let value: unknown;
    try {
      value = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      throw new Error(
        `Manifest resource ${key} is not valid JSON: ${snapshot.resourcePath}.`,
        { cause: error },
      );
    }
    let recordCount: number | "non-array";
    if (key === "sepeOccupationMarket") {
      try {
        recordCount = adaptSepeOccupationMarketResource(value).records.length;
      } catch (error) {
        throw new Error(
          `Manifest resource ${key} failed SEPE resource schema validation: ${snapshot.resourcePath}.`,
          { cause: error },
        );
      }
    } else {
      recordCount = Array.isArray(value) ? value.length : "non-array";
    }
    if (recordCount !== snapshot.recordCount) {
      throw new Error(
        `Manifest resource ${key} record count mismatch: expected ${snapshot.recordCount}, got ${recordCount}.`,
      );
    }

    verifiedResourceBytes += bytes.byteLength;
  }

  return {
    bytes: verifiedResourceBytes,
    count: seenPaths.size,
  };
}

export async function collectDistribution(
  distDirectory: string,
): Promise<DistributionReport> {
  const dataDirectory = resolve(distDirectory, "data");
  const files = await collectDistributionFiles(dataDirectory);
  if (files.length === 0) {
    throw new Error(`Deployable data directory is empty: ${dataDirectory}.`);
  }

  const bySha256 = new Map<string, { bytes: number; count: number }>();
  let dataBytes = 0;
  let largestDataFile = { path: "", bytes: 0 };

  for (const file of files) {
    dataBytes += file.bytes;
    if (file.bytes > largestDataFile.bytes) {
      largestDataFile = { path: file.path, bytes: file.bytes };
    }
    const existing = bySha256.get(file.sha256);
    if (existing === undefined) {
      bySha256.set(file.sha256, { bytes: file.bytes, count: 1 });
    } else {
      existing.count += 1;
    }
  }

  let duplicateGroups = 0;
  let deduplicableDataBytes = 0;
  for (const group of bySha256.values()) {
    if (group.count > 1) {
      duplicateGroups += 1;
      deduplicableDataBytes += group.bytes * (group.count - 1);
    }
  }

  const verifiedResources = await verifyManifestResources(distDirectory);
  return {
    dataBytes,
    dataFiles: files.length,
    deduplicableDataBytes,
    duplicateGroups,
    largestDataFile,
    verifiedResourceBytes: verifiedResources.bytes,
    verifiedResources: verifiedResources.count,
  };
}

export async function assertDistribution(
  distDirectory: string,
  budget: DistributionBudget = DISTRIBUTION_BUDGET,
): Promise<DistributionReport> {
  const report = await collectDistribution(distDirectory);
  const violations = [
    ["data", report.dataBytes, budget.dataBytes],
    [
      "deduplicable data",
      report.deduplicableDataBytes,
      budget.deduplicableDataBytes,
    ],
    [
      "largest data file",
      report.largestDataFile.bytes,
      budget.largestDataFileBytes,
    ],
  ].filter(([, actual, maximum]) => actual > maximum);

  if (violations.length > 0) {
    const details = violations
      .map(
        ([category, actual, maximum]) =>
          `${category} ${actual}/${maximum} bytes`,
      )
      .join(", ");
    throw new Error(`Distribution budget exceeded: ${details}`);
  }

  return report;
}

function formatBytes(bytes: number): string {
  return bytes.toLocaleString("en-US");
}

async function main(): Promise<void> {
  const distDirectory = resolve(process.argv[2] ?? "dist");
  const report = await assertDistribution(distDirectory);
  const duplicatePercentage =
    report.dataBytes === 0
      ? 0
      : (report.deduplicableDataBytes / report.dataBytes) * 100;
  console.log(
    `Distribution check OK: ${report.verifiedResources} manifest resources, ${report.dataFiles} data files, ${formatBytes(report.dataBytes)} raw bytes; ${formatBytes(report.deduplicableDataBytes)} bytes (${duplicatePercentage.toFixed(1)}%) are duplicate content.`,
  );
  console.log(
    JSON.stringify({
      check: "distribution",
      dataBytes: report.dataBytes,
      dataFiles: report.dataFiles,
      deduplicableDataBytes: report.deduplicableDataBytes,
      duplicateGroups: report.duplicateGroups,
      largestDataFile: report.largestDataFile,
      verifiedResourceBytes: report.verifiedResourceBytes,
      verifiedResources: report.verifiedResources,
    }),
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
