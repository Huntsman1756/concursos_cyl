import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import {
  assertCandidateResourceSet,
  assertCanonicalSepeCandidateResource,
  CANDIDATE_RESOURCE_KEYS,
  type CandidateResourceKey,
} from "../../data/schemas/candidateResourceAllowlist";
import { GENERATED_RESOURCE_KEYS } from "../../data/schemas/generatedResourceCatalog";

export interface CandidateBoundaryOptions {
  rootDir: string;
  manifestPath: "public/data/v1/manifest.json";
  sepeResourcePath: string;
  documentPaths: readonly [
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
  ];
  bundleRoots: readonly ["dist"];
}

export type CandidateBoundaryValidation = {
  valid: true;
  resourceCount: number;
  resourceKeys: readonly CandidateResourceKey[];
  sepeRecordCount: number;
};

export const DEFAULT_CANDIDATE_BOUNDARY_OPTIONS = {
  rootDir: process.cwd(),
  manifestPath: "public/data/v1/manifest.json",
  sepeResourcePath: "",
  documentPaths: [
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
  ] as const,
  bundleRoots: ["dist"],
} as const;

type ResourceSnapshot = {
  resourcePath: string;
  sha256: string;
  recordCount: number;
};

type CandidateManifest = {
  resourceSnapshots: Record<string, ResourceSnapshot>;
};

function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function assertSafeRelativePath(value: string, label: string): void {
  if (
    value.trim() === "" ||
    value.includes("\\") ||
    pathIsAbsolute(value) ||
    value.split("/").includes("..") ||
    value.startsWith("-")
  ) {
    throw new Error(`${label} must be a safe repository-relative path.`);
  }
}

function pathIsAbsolute(value: string): boolean {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(value);
}

function assertInsideRoot(
  rootDir: string,
  candidate: string,
  label: string,
): string {
  const root = resolve(rootDir);
  const absolute = resolve(candidate);
  const fromRoot = relative(root, absolute);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    (fromRoot === "" && absolute !== root)
  ) {
    throw new Error(`${label} escapes the candidate root.`);
  }
  return absolute;
}

function resolveCandidatePath(
  rootDir: string,
  candidatePath: string,
  label: string,
): string {
  if (candidatePath.startsWith("/data/")) {
    return resolveCandidatePath(rootDir, `public${candidatePath}`, label);
  }
  if (pathIsAbsolute(candidatePath)) {
    return assertInsideRoot(rootDir, candidatePath, label);
  }
  assertSafeRelativePath(candidatePath, label);
  return assertInsideRoot(rootDir, join(rootDir, candidatePath), label);
}

async function readRegularFile(
  rootDir: string,
  candidatePath: string,
  label: string,
): Promise<{ absolutePath: string; bytes: Buffer }> {
  const absolutePath = resolveCandidatePath(rootDir, candidatePath, label);
  let stat;
  try {
    stat = await lstat(absolutePath);
  } catch (error) {
    throw new Error(`${label} is missing: ${candidatePath}.`, { cause: error });
  }
  if (stat.isSymbolicLink()) {
    throw new Error(`${label} must not be a symlink: ${candidatePath}.`);
  }
  if (!stat.isFile()) {
    throw new Error(`${label} must be a regular file: ${candidatePath}.`);
  }
  return { absolutePath, bytes: await readFile(absolutePath) };
}

async function collectRegularFiles(
  rootDir: string,
  directoryPath: string,
  label: string,
): Promise<string[]> {
  const absoluteDirectory = resolveCandidatePath(rootDir, directoryPath, label);
  let stat;
  try {
    stat = await lstat(absoluteDirectory);
  } catch (error) {
    throw new Error(`${label} is missing: ${directoryPath}.`, { cause: error });
  }
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`${label} must be a real directory: ${directoryPath}.`);
  }

  const files: string[] = [];
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    const entryPath = join(absoluteDirectory, entry.name);
    const entryStat = await lstat(entryPath);
    if (entryStat.isSymbolicLink()) {
      throw new Error(`${label} contains a symlink: ${entryPath}.`);
    }
    if (entryStat.isDirectory()) {
      files.push(...(await collectRegularFiles(rootDir, entryPath, label)));
    } else if (entryStat.isFile()) {
      files.push(entryPath);
    } else {
      throw new Error(`${label} contains a non-regular entry: ${entryPath}.`);
    }
  }
  return files;
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
}

function parseCandidateManifest(
  value: unknown,
  label: string,
): CandidateManifest {
  const parsed = GeneratedManifestSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} failed generated manifest schema validation.`, {
      cause: parsed.error,
    });
  }
  return parsed.data as CandidateManifest;
}

function manifestResourceFilePath(
  rootDir: string,
  resourcePath: string,
  publicRoot: "public" | "dist",
  label: string,
): string {
  if (
    !resourcePath.startsWith("/data/v1/") ||
    resourcePath.includes("\\") ||
    resourcePath.split("/").includes("..")
  ) {
    throw new Error(
      `${label} contains an unsafe resource path: ${resourcePath}.`,
    );
  }
  return resolveCandidatePath(
    rootDir,
    `${publicRoot}${resourcePath}`,
    `${label} resource`,
  );
}

function compareResourceKeys(value: unknown, label: string): void {
  const record = asRecord(value, label);
  assertCandidateResourceSet(Object.keys(record));
}

function extractApplicableResourceKeys(
  value: unknown,
  label: string,
): string[] | null {
  if (Array.isArray(value)) return null;
  const record = asRecord(value, label);
  const directSnapshots = record.resourceSnapshots;
  if (
    directSnapshots !== undefined &&
    directSnapshots !== null &&
    typeof directSnapshots === "object" &&
    !Array.isArray(directSnapshots)
  ) {
    return Object.keys(directSnapshots as Record<string, unknown>);
  }
  const manifest = record.manifest;
  if (
    manifest !== null &&
    typeof manifest === "object" &&
    !Array.isArray(manifest)
  ) {
    const manifestRecord = manifest as Record<string, unknown>;
    const nestedSnapshots = manifestRecord.resourceSnapshots;
    if (
      nestedSnapshots !== undefined &&
      nestedSnapshots !== null &&
      typeof nestedSnapshots === "object" &&
      !Array.isArray(nestedSnapshots)
    ) {
      return Object.keys(nestedSnapshots as Record<string, unknown>);
    }
    if (Array.isArray(manifestRecord.resourceKeys)) {
      return manifestRecord.resourceKeys as string[];
    }
  }
  if (Array.isArray(record.resourceKeys)) {
    return record.resourceKeys as string[];
  }
  return null;
}

function assertNoContradictoryOwnership(text: string, label: string): void {
  const lines = text.split(/\r?\n/u);
  for (const line of lines) {
    if (
      /(?:sepeoccupationmarket|sepe(?:\.es|\.gob\.es)|occupation-market)/iu.test(
        line,
      ) &&
      /(?:junta|jcyl|castilla y le[oó]n|cc\s*by|mit\s+(?:license|licencia|software|code|c[oó]digo))/iu.test(
        line,
      )
    ) {
      throw new Error(
        `Candidate boundary contains a contradictory JCyL/MIT ownership claim in ${label}.`,
      );
    }
  }
}

async function validateResourceSnapshots(
  rootDir: string,
  manifest: CandidateManifest,
  publicRoot: "public" | "dist",
  label: string,
): Promise<{ sepeRecordCount: number }> {
  const seenPaths = new Set<string>();
  let sepeRecordCount = 0;
  for (const [key, snapshot] of Object.entries(manifest.resourceSnapshots)) {
    if (seenPaths.has(snapshot.resourcePath)) {
      throw new Error(
        `${label} reuses resource path ${snapshot.resourcePath} for multiple keys.`,
      );
    }
    seenPaths.add(snapshot.resourcePath);
    const resourcePath = manifestResourceFilePath(
      rootDir,
      snapshot.resourcePath,
      publicRoot,
      `${label} ${key}`,
    );
    const bytes = await readFile(resourcePath).catch((error: unknown) => {
      throw new Error(`${label} resource ${key} is missing.`, { cause: error });
    });
    const actualSha256 = hashBytes(bytes);
    if (actualSha256 !== snapshot.sha256) {
      throw new Error(
        `${label} resource ${key} hash does not match its manifest snapshot.`,
      );
    }
    const value = parseJson(bytes, `${label} resource ${key}`);
    const recordCount =
      key === "sepeOccupationMarket"
        ? assertCanonicalSepeCandidateResource(value).records.length
        : Array.isArray(value)
          ? value.length
          : -1;
    if (recordCount !== snapshot.recordCount) {
      throw new Error(
        `${label} resource ${key} record count does not match its manifest snapshot.`,
      );
    }
    if (key === "sepeOccupationMarket") sepeRecordCount = recordCount;
  }
  return { sepeRecordCount };
}

async function validateBundle(
  rootDir: string,
  bundleRoot: "dist",
  sourceManifest: CandidateManifest,
): Promise<void> {
  const bundleFiles = await collectRegularFiles(
    rootDir,
    bundleRoot,
    "Candidate bundle",
  );
  if (bundleFiles.length === 0) {
    throw new Error(`Candidate bundle root is empty: ${bundleRoot}.`);
  }
  const bundleManifest = await readRegularFile(
    rootDir,
    `${bundleRoot}/data/v1/manifest.json`,
    "Candidate bundle manifest",
  );
  const parsedBundleManifest = parseCandidateManifest(
    parseJson(bundleManifest.bytes, "Candidate bundle manifest"),
    "Candidate bundle manifest",
  );
  compareResourceKeys(
    parsedBundleManifest.resourceSnapshots,
    "Candidate bundle manifest resourceSnapshots",
  );
  if (
    JSON.stringify(
      Object.keys(parsedBundleManifest.resourceSnapshots).sort(),
    ) !== JSON.stringify(Object.keys(sourceManifest.resourceSnapshots).sort())
  ) {
    throw new Error(
      "Candidate bundle manifest resource set differs from public manifest.",
    );
  }
  await validateResourceSnapshots(
    rootDir,
    parsedBundleManifest,
    "dist",
    "Candidate bundle",
  );
}

export async function validateCandidateBoundary(
  options: CandidateBoundaryOptions,
): Promise<CandidateBoundaryValidation> {
  const rootDir = resolve(options.rootDir);
  const sourceManifestFile = await readRegularFile(
    rootDir,
    options.manifestPath,
    "Candidate manifest",
  );
  const sourceManifest = parseCandidateManifest(
    parseJson(sourceManifestFile.bytes, "Candidate manifest"),
    "Candidate manifest",
  );
  compareResourceKeys(
    sourceManifest.resourceSnapshots,
    "Candidate manifest resourceSnapshots",
  );
  assertCandidateResourceSet(GENERATED_RESOURCE_KEYS);

  const sourceResourceValidation = await validateResourceSnapshots(
    rootDir,
    sourceManifest,
    "public",
    "Candidate manifest",
  );
  const sepeSnapshot = sourceManifest.resourceSnapshots.sepeOccupationMarket;
  const manifestSepePath = manifestResourceFilePath(
    rootDir,
    sepeSnapshot.resourcePath,
    "public",
    "Candidate manifest sepeOccupationMarket",
  );
  const requestedSepePath = resolveCandidatePath(
    rootDir,
    options.sepeResourcePath,
    "sepeResourcePath",
  );
  if (manifestSepePath !== requestedSepePath) {
    const requestedBytes = await readRegularFile(
      rootDir,
      options.sepeResourcePath,
      "sepeResourcePath",
    );
    const requestedValue = parseJson(requestedBytes.bytes, "sepeResourcePath");
    assertCanonicalSepeCandidateResource(requestedValue);
    if (hashBytes(requestedBytes.bytes) !== sepeSnapshot.sha256) {
      throw new Error(
        "sepeResourcePath hash does not match the canonical manifest snapshot.",
      );
    }
  } else {
    const requestedBytes = await readFile(requestedSepePath);
    if (hashBytes(requestedBytes) !== sepeSnapshot.sha256) {
      throw new Error(
        "sepeResourcePath hash does not match the canonical manifest snapshot.",
      );
    }
  }

  for (const documentPath of options.documentPaths) {
    const document = await readRegularFile(
      rootDir,
      documentPath,
      "Candidate document",
    );
    const text = document.bytes.toString("utf8");
    assertNoContradictoryOwnership(text, documentPath);
    if (documentPath.endsWith(".json")) {
      const value = parseJson(
        document.bytes,
        `Candidate document ${documentPath}`,
      );
      const resourceKeys = extractApplicableResourceKeys(value, documentPath);
      if (resourceKeys !== null) {
        assertCandidateResourceSet(resourceKeys);
      }
    }
  }

  for (const bundleRoot of options.bundleRoots) {
    await validateBundle(rootDir, bundleRoot, sourceManifest);
  }

  return {
    valid: true,
    resourceCount: CANDIDATE_RESOURCE_KEYS.length,
    resourceKeys: CANDIDATE_RESOURCE_KEYS,
    sepeRecordCount: sourceResourceValidation.sepeRecordCount,
  };
}

async function main(argv: readonly string[]): Promise<void> {
  const bundleRootIndex = argv.indexOf("--bundle-root");
  const bundleRoot =
    bundleRootIndex === -1 ? "dist" : (argv[bundleRootIndex + 1] ?? "");
  if (bundleRoot !== "dist") {
    throw new Error("Usage: validateCandidateBoundary.ts --bundle-root dist");
  }
  const rootDir = process.cwd();
  const manifest = JSON.parse(
    await readFile(join(rootDir, "public/data/v1/manifest.json"), "utf8"),
  ) as CandidateManifest;
  const sepeResourcePath =
    manifest.resourceSnapshots.sepeOccupationMarket.resourcePath;
  const result = await validateCandidateBoundary({
    ...DEFAULT_CANDIDATE_BOUNDARY_OPTIONS,
    rootDir,
    sepeResourcePath,
  });
  console.log(
    `Candidate boundary passed: ${result.resourceCount} resources, ${result.sepeRecordCount} SEPE records.`,
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
