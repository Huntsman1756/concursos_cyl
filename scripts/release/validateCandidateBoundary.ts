import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import {
  assertCandidateResourceSet,
  assertCanonicalSepeCandidateResource,
  CANDIDATE_RESOURCE_KEYS,
  classifyCandidateReference,
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

type CandidateResourceEvidence = {
  resourceKeys: string[];
  resourceSnapshots?: Record<string, ResourceSnapshot>;
};

const RESOURCE_SNAPSHOT_FIELDS = [
  "resourcePath",
  "sha256",
  "recordCount",
] as const;

class DuplicateJsonKeyError extends Error {
  constructor(readonly key: string) {
    super(`Duplicate JSON key: ${key}.`);
  }
}

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
  const stat = await assertPhysicalPath(rootDir, absolutePath, label);
  if (!stat.isFile()) {
    throw new Error(`${label} must be a regular file: ${candidatePath}.`);
  }
  return { absolutePath, bytes: await readFile(absolutePath) };
}

async function assertPhysicalPath(
  rootDir: string,
  absolutePath: string,
  label: string,
) {
  const root = resolve(rootDir);
  const fromRoot = relative(root, absolutePath);
  if (
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    pathIsAbsolute(fromRoot)
  ) {
    throw new Error(`${label} escapes the candidate root.`);
  }

  let current = root;
  const components = fromRoot === "" ? [] : fromRoot.split(sep);
  let finalStat;
  for (const [index, component] of components.entries()) {
    current = join(current, component);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      throw new Error(`${label} is missing: ${absolutePath}.`, {
        cause: error,
      });
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`${label} must not contain a symlink: ${current}.`);
    }
    if (index < components.length - 1 && !stat.isDirectory()) {
      throw new Error(
        `${label} contains a non-directory path component: ${current}.`,
      );
    }
    finalStat = stat;
  }

  if (finalStat === undefined) {
    finalStat = await lstat(root);
  }
  return finalStat;
}

async function collectRegularFiles(
  rootDir: string,
  directoryPath: string,
  label: string,
): Promise<string[]> {
  const absoluteDirectory = resolveCandidatePath(rootDir, directoryPath, label);
  const stat = await assertPhysicalPath(rootDir, absoluteDirectory, label);
  if (!stat.isDirectory()) {
    throw new Error(`${label} must be a real directory: ${directoryPath}.`);
  }

  const files: string[] = [];
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    const entryPath = join(absoluteDirectory, entry.name);
    const entryStat = await assertPhysicalPath(rootDir, entryPath, label);
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

function assertNoDuplicateJsonKeys(json: string): void {
  let index = 0;

  function skipWhitespace(): void {
    while (/\s/u.test(json[index] ?? "")) index += 1;
  }

  function readString(): string {
    if (json[index] !== '"') {
      throw new Error(`Expected a JSON string at offset ${index}.`);
    }
    const start = index;
    index += 1;
    while (index < json.length) {
      const character = json[index];
      index += 1;
      if (character === "\\") {
        index += 1;
      } else if (character === '"') {
        return JSON.parse(json.slice(start, index)) as string;
      }
    }
    throw new Error("Unterminated JSON string.");
  }

  function readValue(): void {
    skipWhitespace();
    const character = json[index];
    if (character === "{") {
      readObject();
      return;
    }
    if (character === "[") {
      readArray();
      return;
    }
    if (character === '"') {
      readString();
      return;
    }
    const start = index;
    while (index < json.length && !/[\s,\]}]/u.test(json[index] ?? "")) {
      index += 1;
    }
    if (start === index) {
      throw new Error(`Expected a JSON value at offset ${index}.`);
    }
  }

  function readArray(): void {
    index += 1;
    skipWhitespace();
    if (json[index] === "]") {
      index += 1;
      return;
    }
    while (index < json.length) {
      readValue();
      skipWhitespace();
      if (json[index] === "]") {
        index += 1;
        return;
      }
      if (json[index] !== ",") {
        throw new Error(`Expected a JSON array separator at offset ${index}.`);
      }
      index += 1;
      skipWhitespace();
    }
    throw new Error("Unterminated JSON array.");
  }

  function readObject(): void {
    index += 1;
    skipWhitespace();
    const keys = new Set<string>();
    if (json[index] === "}") {
      index += 1;
      return;
    }
    while (index < json.length) {
      const key = readString();
      if (keys.has(key)) throw new DuplicateJsonKeyError(key);
      keys.add(key);
      skipWhitespace();
      if (json[index] !== ":") {
        throw new Error(`Expected a JSON object separator at offset ${index}.`);
      }
      index += 1;
      readValue();
      skipWhitespace();
      if (json[index] === "}") {
        index += 1;
        return;
      }
      if (json[index] !== ",") {
        throw new Error(`Expected a JSON object separator at offset ${index}.`);
      }
      index += 1;
      skipWhitespace();
    }
    throw new Error("Unterminated JSON object.");
  }

  readValue();
  skipWhitespace();
  if (index !== json.length) {
    throw new Error(`Unexpected JSON content at offset ${index}.`);
  }
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  const json = Buffer.from(bytes).toString("utf8");
  let value: unknown;
  try {
    value = JSON.parse(json) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
  try {
    assertNoDuplicateJsonKeys(json);
  } catch (error) {
    if (error instanceof DuplicateJsonKeyError) {
      throw new Error(`${label} contains duplicate JSON key ${error.key}.`, {
        cause: error,
      });
    }
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
  return value;
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

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function parseResourceSnapshot(
  value: unknown,
  key: string,
  label: string,
): ResourceSnapshot {
  const record = asRecord(value, `${label}.${key}`);
  const actualFields = Object.keys(record).sort();
  const expectedFields = [...RESOURCE_SNAPSHOT_FIELDS].sort();
  if (JSON.stringify(actualFields) !== JSON.stringify(expectedFields)) {
    throw new Error(
      `${label}.${key} must contain exactly resourcePath, sha256, and recordCount.`,
    );
  }
  if (
    typeof record.resourcePath !== "string" ||
    typeof record.sha256 !== "string" ||
    typeof record.recordCount !== "number"
  ) {
    throw new Error(`${label}.${key} has malformed snapshot fields.`);
  }
  if (
    !record.resourcePath.startsWith("/data/v1/") ||
    record.resourcePath.includes("\\") ||
    record.resourcePath.split("/").includes("..")
  ) {
    throw new Error(`${label}.${key}.resourcePath is unsafe.`);
  }
  if (!/^[a-f0-9]{64}$/u.test(record.sha256)) {
    throw new Error(`${label}.${key}.sha256 is malformed.`);
  }
  if (!Number.isInteger(record.recordCount) || record.recordCount < 0) {
    throw new Error(`${label}.${key}.recordCount is malformed.`);
  }
  return {
    resourcePath: record.resourcePath,
    sha256: record.sha256,
    recordCount: record.recordCount,
  };
}

function parseResourceSnapshotMap(
  value: unknown,
  label: string,
): Record<string, ResourceSnapshot> {
  const record = asRecord(value, label);
  assertCandidateResourceSet(Object.keys(record));
  return Object.fromEntries(
    Object.entries(record).map(([key, snapshot]) => [
      key,
      parseResourceSnapshot(snapshot, key, label),
    ]),
  );
}

function compareResourceSnapshots(
  expected: Record<string, ResourceSnapshot>,
  actual: Record<string, ResourceSnapshot>,
  label: string,
): void {
  assertCandidateResourceSet(Object.keys(expected));
  assertCandidateResourceSet(Object.keys(actual));
  for (const key of CANDIDATE_RESOURCE_KEYS) {
    const expectedSnapshot = expected[key];
    const actualSnapshot = actual[key];
    for (const field of RESOURCE_SNAPSHOT_FIELDS) {
      if (expectedSnapshot[field] !== actualSnapshot[field]) {
        throw new Error(
          `${label} ${key} ${field} differs from public manifest.`,
        );
      }
    }
  }
}

function assertResourceKeysArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((key) => typeof key !== "string")) {
    throw new Error(`${label} must be an array of resource keys.`);
  }
  const resourceKeys = value as string[];
  assertCandidateResourceSet(resourceKeys);
  return resourceKeys;
}

function extractApplicableResourceEvidence(
  value: unknown,
  label: string,
): CandidateResourceEvidence | null {
  if (Array.isArray(value)) return null;
  const record = asRecord(value, label);
  const candidates: CandidateResourceEvidence[] = [];
  const addSnapshots = (snapshots: unknown, snapshotsLabel: string): void => {
    const parsed = parseResourceSnapshotMap(snapshots, snapshotsLabel);
    candidates.push({
      resourceKeys: Object.keys(parsed),
      resourceSnapshots: parsed,
    });
  };
  const addKeys = (keys: unknown, keysLabel: string): void => {
    candidates.push({
      resourceKeys: assertResourceKeysArray(keys, keysLabel),
    });
  };

  if (hasOwn(record, "resourceSnapshots")) {
    addSnapshots(record.resourceSnapshots, `${label}.resourceSnapshots`);
  }
  if (hasOwn(record, "resourceKeys")) {
    addKeys(record.resourceKeys, `${label}.resourceKeys`);
  }

  if (hasOwn(record, "manifest")) {
    const manifest = asRecord(record.manifest, `${label}.manifest`);
    if (hasOwn(manifest, "resourceSnapshots")) {
      addSnapshots(
        manifest.resourceSnapshots,
        `${label}.manifest.resourceSnapshots`,
      );
    }
    if (hasOwn(manifest, "resourceKeys")) {
      addKeys(manifest.resourceKeys, `${label}.manifest.resourceKeys`);
    }
  }

  if (candidates.length === 0) return null;
  const first = candidates[0];
  for (const candidate of candidates.slice(1)) {
    assertCandidateResourceSet(candidate.resourceKeys);
    if (first.resourceSnapshots && candidate.resourceSnapshots) {
      compareResourceSnapshots(
        first.resourceSnapshots,
        candidate.resourceSnapshots,
        `${label} resource snapshots`,
      );
    }
  }
  return first;
}

function assertEvidenceManifestIdentity(
  value: unknown,
  label: string,
  expectedSnapshotId: string,
  expectedSha256: string,
): void {
  if (Array.isArray(value)) return;
  const record = asRecord(value, label);
  if (!hasOwn(record, "manifest")) return;
  const manifest = asRecord(record.manifest, `${label}.manifest`);
  if (hasOwn(manifest, "snapshotId")) {
    if (
      typeof manifest.snapshotId !== "string" ||
      manifest.snapshotId !== expectedSnapshotId
    ) {
      throw new Error(
        `${label}.manifest.snapshotId does not match the public manifest.`,
      );
    }
  }
  if (hasOwn(manifest, "sha256")) {
    if (
      typeof manifest.sha256 !== "string" ||
      manifest.sha256 !== expectedSha256
    ) {
      throw new Error(
        `${label}.manifest.sha256 does not match the public manifest bytes.`,
      );
    }
  }
}

function manifestSnapshotId(
  manifest: CandidateManifest,
  label: string,
): string {
  const snapshotIds = new Set<string>();
  for (const snapshot of Object.values(manifest.resourceSnapshots)) {
    const match = /^\/data\/v1\/snapshots\/([a-z\d-]+)\/[a-z\d-]+\.json$/u.exec(
      snapshot.resourcePath,
    );
    if (!match) {
      throw new Error(`${label} contains an invalid snapshot resource path.`);
    }
    snapshotIds.add(match[1]);
  }
  if (snapshotIds.size !== 1) {
    throw new Error(`${label} resource snapshots do not share one snapshotId.`);
  }
  return [...snapshotIds][0];
}

function normalizeClaimText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function assertNoContradictoryOwnership(text: string, label: string): void {
  const normalized = normalizeClaimText(text);
  const sourceOffsets: number[] = [];
  for (const match of normalized.matchAll(/\bsepe(?:occupationmarket)?\b/giu)) {
    sourceOffsets.push(match.index ?? 0);
  }
  for (const match of normalized.matchAll(/https?:\/\/[^\s<>()]+/giu)) {
    const reference = match[0].replace(/[.,;]+$/u, "");
    if (
      classifyCandidateReference(reference) ===
      "complementary-classification-source"
    ) {
      sourceOffsets.push(match.index ?? 0);
    }
  }

  for (const offset of sourceOffsets) {
    const window = normalized.slice(
      Math.max(0, offset - 220),
      Math.min(normalized.length, offset + 320),
    );
    const mentionsOwnershipTarget =
      /(?:junta|jcyl|castilla y leon|cc\s*by|mit)/iu.test(window);
    const mentionsOwnership =
      /(?:propiedad|propio|titularidad|licenc|relicenc|copyright|autor(?:ia)?|dataset|recurso|bajo\s+(?:la\s+)?licencia)/iu.test(
        window,
      );
    if (!mentionsOwnershipTarget || !mentionsOwnership) continue;

    const isExplicitNegative =
      /(?:\bno\b|\bnunca\b|\bsin\b|\bnot\b|\bdoes\s+not\b|\bdoesn't\b).{0,120}(?:licenc|propiedad|relicenc|cc\s*by|mit)/iu.test(
        window,
      );
    if (!isExplicitNegative) {
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
    const bytes = (
      await readRegularFile(rootDir, resourcePath, `${label} resource ${key}`)
    ).bytes;
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
  compareResourceSnapshots(
    sourceManifest.resourceSnapshots,
    parsedBundleManifest.resourceSnapshots,
    "Candidate bundle manifest",
  );
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
  assertCandidateResourceSet(Object.keys(sourceManifest.resourceSnapshots));
  assertCandidateResourceSet(GENERATED_RESOURCE_KEYS);
  const publicSnapshotId = manifestSnapshotId(
    sourceManifest,
    "Candidate manifest",
  );
  const publicManifestSha256 = hashBytes(sourceManifestFile.bytes);

  const sourceResourceValidation = await validateResourceSnapshots(
    rootDir,
    sourceManifest,
    "public",
    "Candidate manifest",
  );
  const sepeSnapshot = sourceManifest.resourceSnapshots.sepeOccupationMarket;
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
      const resourceEvidence = extractApplicableResourceEvidence(
        value,
        documentPath,
      );
      if (resourceEvidence !== null) {
        assertCandidateResourceSet(resourceEvidence.resourceKeys);
        if (resourceEvidence.resourceSnapshots) {
          compareResourceSnapshots(
            sourceManifest.resourceSnapshots,
            resourceEvidence.resourceSnapshots,
            `Candidate document ${documentPath}`,
          );
        }
      }
      assertEvidenceManifestIdentity(
        value,
        `Candidate document ${documentPath}`,
        publicSnapshotId,
        publicManifestSha256,
      );
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
