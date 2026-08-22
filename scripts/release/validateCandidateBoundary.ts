import { createHash } from "node:crypto";
import { constants as fsConstants, type Dirent } from "node:fs";
import { lstat, open, opendir, realpath } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";

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
  resourceKeys?: string[];
  resourceSnapshots: readonly Record<string, ResourceSnapshot>[];
};

const RESOURCE_SNAPSHOT_FIELDS = [
  "resourcePath",
  "sha256",
  "recordCount",
] as const;

const MAX_CANDIDATE_FILE_BYTES = 16 * 1024 * 1024;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_ENTRIES = 1_000_000;
const MAX_DIRECTORY_DEPTH = 64;
const MAX_DIRECTORY_ENTRIES = 100_000;
const REQUIRED_EVIDENCE_DOCUMENTS = new Set([
  "docs/contest/coverage-freeze.json",
  "docs/contest/release-evidence.json",
]);
const EXPECTED_DOCUMENT_PATHS =
  DEFAULT_CANDIDATE_BOUNDARY_OPTIONS.documentPaths;
const EXPECTED_BUNDLE_ROOTS = DEFAULT_CANDIDATE_BOUNDARY_OPTIONS.bundleRoots;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

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

async function canonicalizeRoot(rootDir: string): Promise<string> {
  const root = resolve(rootDir);
  const rootStat = await lstat(root).catch((error: unknown) => {
    throw new Error(`Candidate root is missing: ${rootDir}.`, {
      cause: error,
    });
  });
  if (rootStat.isSymbolicLink()) {
    throw new Error(`Candidate root must not be a symlink: ${rootDir}.`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`Candidate root must be a directory: ${rootDir}.`);
  }
  return realpath(root);
}

function remapRootAlias(
  lexicalRoot: string,
  canonicalRoot: string,
  candidatePath: string,
): string {
  if (!pathIsAbsolute(candidatePath) || candidatePath.startsWith("/data/")) {
    return candidatePath;
  }
  const absoluteCandidate = resolve(candidatePath);
  const fromLexicalRoot = relative(lexicalRoot, absoluteCandidate);
  if (
    fromLexicalRoot === ".." ||
    fromLexicalRoot.startsWith(`..${sep}`) ||
    pathIsAbsolute(fromLexicalRoot)
  ) {
    return candidatePath;
  }
  return join(canonicalRoot, fromLexicalRoot);
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
  // Node exposes no openat-style directory handle here; the final lstat pass
  // closes the observable file TOCTOU, while a simultaneous parent-directory
  // replacement remains a residual race outside this primitive's control.
  const absolutePath = resolveCandidatePath(rootDir, candidatePath, label);
  const pathStat = await assertPhysicalPath(rootDir, absolutePath, label);
  if (!pathStat.isFile()) {
    throw new Error(`${label} must be a regular file: ${candidatePath}.`);
  }
  let handle;
  try {
    handle = await open(
      absolutePath,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
    );
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) {
      throw new Error(`${label} must be a regular file: ${candidatePath}.`);
    }
    if (openedStat.size > MAX_CANDIDATE_FILE_BYTES) {
      throw new Error(
        `${label} exceeds the ${MAX_CANDIDATE_FILE_BYTES}-byte limit: ${candidatePath}.`,
      );
    }
    if (!samePhysicalFile(pathStat, openedStat)) {
      throw new Error(
        `${label} changed while it was opened: ${candidatePath}.`,
      );
    }
    const bytes = await handle.readFile();
    if (bytes.byteLength > MAX_CANDIDATE_FILE_BYTES) {
      throw new Error(
        `${label} exceeds the ${MAX_CANDIDATE_FILE_BYTES}-byte limit: ${candidatePath}.`,
      );
    }
    const finalPathStat = await assertPhysicalPath(
      rootDir,
      absolutePath,
      label,
    );
    if (!samePhysicalFile(openedStat, finalPathStat)) {
      throw new Error(`${label} changed while it was read: ${candidatePath}.`);
    }
    return { absolutePath, bytes };
  } catch (error) {
    if (isNoFollowError(error)) {
      throw new Error(`${label} must not contain a symlink: ${absolutePath}.`, {
        cause: error,
      });
    }
    throw error;
  } finally {
    await handle?.close();
  }
}

function samePhysicalFile(
  left: { dev: number; ino: number },
  right: { dev: number; ino: number },
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function isNoFollowError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ELOOP"
  );
}

async function assertPhysicalPath(
  rootDir: string,
  absolutePath: string,
  label: string,
) {
  const root = resolve(rootDir);
  const rootStat = await lstat(root).catch((error: unknown) => {
    throw new Error(`${label} candidate root is missing: ${root}.`, {
      cause: error,
    });
  });
  if (rootStat.isSymbolicLink()) {
    throw new Error(`${label} candidate root must not be a symlink: ${root}.`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`${label} candidate root must be a directory: ${root}.`);
  }
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
    finalStat = rootStat;
  }
  return finalStat;
}

async function collectRegularFiles(
  rootDir: string,
  directoryPath: string,
  label: string,
  depth = 0,
  state: { entries: number } = { entries: 0 },
): Promise<string[]> {
  if (depth > MAX_DIRECTORY_DEPTH) {
    throw new Error(
      `${label} directory depth exceeds the ${MAX_DIRECTORY_DEPTH}-level limit.`,
    );
  }
  const absoluteDirectory = resolveCandidatePath(rootDir, directoryPath, label);
  const stat = await assertPhysicalPath(rootDir, absoluteDirectory, label);
  if (!stat.isDirectory()) {
    throw new Error(`${label} must be a real directory: ${directoryPath}.`);
  }

  const files: string[] = [];
  const entries: Dirent[] = [];
  const directory = await opendir(absoluteDirectory);
  for await (const entry of directory) {
    state.entries += 1;
    if (state.entries > MAX_DIRECTORY_ENTRIES) {
      throw new Error(
        `${label} entries exceed the ${MAX_DIRECTORY_ENTRIES}-entry limit.`,
      );
    }
    entries.push(entry);
  }
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "en"),
  )) {
    const entryPath = join(absoluteDirectory, entry.name);
    const entryStat = await assertPhysicalPath(rootDir, entryPath, label);
    if (entryStat.isDirectory()) {
      files.push(
        ...(await collectRegularFiles(
          rootDir,
          entryPath,
          label,
          depth + 1,
          state,
        )),
      );
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
  let depth = 0;
  let entries = 0;

  function enterContainer(): void {
    depth += 1;
    if (depth > MAX_JSON_DEPTH) {
      throw new Error(
        `JSON nesting exceeds the ${MAX_JSON_DEPTH}-level limit.`,
      );
    }
  }

  function leaveContainer(): void {
    depth -= 1;
  }

  function countEntry(): void {
    entries += 1;
    if (entries > MAX_JSON_ENTRIES) {
      throw new Error(
        `JSON entries exceed the ${MAX_JSON_ENTRIES}-entry limit.`,
      );
    }
  }

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
    enterContainer();
    index += 1;
    skipWhitespace();
    if (json[index] === "]") {
      index += 1;
      leaveContainer();
      return;
    }
    try {
      while (index < json.length) {
        countEntry();
        readValue();
        skipWhitespace();
        if (json[index] === "]") {
          index += 1;
          return;
        }
        if (json[index] !== ",") {
          throw new Error(
            `Expected a JSON array separator at offset ${index}.`,
          );
        }
        index += 1;
        skipWhitespace();
      }
      throw new Error("Unterminated JSON array.");
    } finally {
      leaveContainer();
    }
  }

  function readObject(): void {
    enterContainer();
    index += 1;
    skipWhitespace();
    const keys = new Set<string>();
    if (json[index] === "}") {
      index += 1;
      leaveContainer();
      return;
    }
    try {
      while (index < json.length) {
        countEntry();
        const key = readString();
        if (keys.has(key)) throw new DuplicateJsonKeyError(key);
        keys.add(key);
        skipWhitespace();
        if (json[index] !== ":") {
          throw new Error(
            `Expected a JSON object separator at offset ${index}.`,
          );
        }
        index += 1;
        readValue();
        skipWhitespace();
        if (json[index] === "}") {
          index += 1;
          return;
        }
        if (json[index] !== ",") {
          throw new Error(
            `Expected a JSON object separator at offset ${index}.`,
          );
        }
        index += 1;
        skipWhitespace();
      }
      throw new Error("Unterminated JSON object.");
    } finally {
      leaveContainer();
    }
  }

  readValue();
  skipWhitespace();
  if (index !== json.length) {
    throw new Error(`Unexpected JSON content at offset ${index}.`);
  }
}

function decodeUtf8(bytes: Uint8Array, label: string): string {
  if (bytes.byteLength > MAX_CANDIDATE_FILE_BYTES) {
    throw new Error(
      `${label} exceeds the ${MAX_CANDIDATE_FILE_BYTES}-byte limit.`,
    );
  }
  try {
    return UTF8_DECODER.decode(bytes);
  } catch (error) {
    throw new Error(`${label} must be valid UTF-8.`, { cause: error });
  }
}

function parseJson(bytes: Uint8Array, label: string): unknown {
  const json = decodeUtf8(bytes, label);
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
    if (
      error instanceof Error &&
      /JSON (?:nesting|entries) exceeds/iu.test(error.message)
    ) {
      throw new Error(`${label} ${error.message}`, { cause: error });
    }
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
  return value;
}

function visitStringLeaves(
  value: unknown,
  label: string,
  visit: (text: string) => void,
): void {
  const pending: Array<{ value: unknown; depth: number }> = [
    { value, depth: 0 },
  ];
  let entries = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) continue;
    if (typeof current.value === "string") {
      visit(current.value);
      continue;
    }
    if (current.value === null || typeof current.value !== "object") {
      continue;
    }
    if (current.depth >= MAX_JSON_DEPTH) {
      throw new Error(
        `${label} parsed nesting exceeds the ${MAX_JSON_DEPTH}-level limit.`,
      );
    }
    const values = Array.isArray(current.value)
      ? current.value
      : Object.values(current.value);
    for (const child of values) {
      entries += 1;
      if (entries > MAX_JSON_ENTRIES) {
        throw new Error(
          `${label} parsed entries exceed the ${MAX_JSON_ENTRIES}-entry limit.`,
        );
      }
      pending.push({ value: child, depth: current.depth + 1 });
    }
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
  const keyCandidates: string[][] = [];
  const snapshotCandidates: Array<Record<string, ResourceSnapshot>> = [];
  const addSnapshots = (snapshots: unknown, snapshotsLabel: string): void => {
    const parsed = parseResourceSnapshotMap(snapshots, snapshotsLabel);
    snapshotCandidates.push(parsed);
  };
  const addKeys = (keys: unknown, keysLabel: string): void => {
    keyCandidates.push(assertResourceKeysArray(keys, keysLabel));
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

  if (keyCandidates.length === 0 && snapshotCandidates.length === 0) {
    return null;
  }
  if (keyCandidates.length > 1) {
    throw new Error(`${label} contains multiple resourceKeys representations.`);
  }
  return {
    resourceKeys: keyCandidates[0],
    resourceSnapshots: snapshotCandidates,
  };
}

function assertCoverageFreezeResourceEvidence(
  evidence: CandidateResourceEvidence | null,
  label: string,
): void {
  if (evidence === null || evidence.resourceSnapshots.length !== 1) {
    throw new Error(
      `${label} must contain exactly one complete canonical resourceSnapshots map.`,
    );
  }
}

function assertEvidenceManifestIdentity(
  value: unknown,
  label: string,
  expectedSnapshotId: string,
  expectedSha256: string,
  required: boolean,
): void {
  if (Array.isArray(value)) {
    if (required) {
      throw new Error(`${label}.manifest is required for resource evidence.`);
    }
    return;
  }
  const record = asRecord(value, label);
  if (!hasOwn(record, "manifest")) {
    if (required) {
      throw new Error(`${label}.manifest is required for resource evidence.`);
    }
    return;
  }
  const manifest = asRecord(record.manifest, `${label}.manifest`);
  if (
    typeof manifest.snapshotId !== "string" ||
    manifest.snapshotId !== expectedSnapshotId
  ) {
    throw new Error(
      `${label}.manifest.snapshotId must match the public manifest.`,
    );
  }
  if (
    typeof manifest.sha256 !== "string" ||
    manifest.sha256 !== expectedSha256
  ) {
    throw new Error(
      `${label}.manifest.sha256 must match the public manifest bytes.`,
    );
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
  const rawClauses = /(?:^|\n)\s*\|/u.test(text)
    ? text.split(/\r?\n/u)
    : normalized.split(/(?<=[.!?;])\s+/u);
  const clauses = rawClauses
    .map((clause) => normalizeClaimText(clause))
    .map((clause) => clause.trim())
    .filter((clause) => clause !== "");

  let anchoredSemicolon = false;
  for (const clause of clauses) {
    const references = [...clause.matchAll(/https?:\/\/[^\s<>()]+/giu)].map(
      (match) => match[0].replace(/[.,;]+$/u, ""),
    );
    const hasSepeAnchor = /\bsepe(?:occupationmarket)?\b/iu.test(clause);
    const hasOccupationMarketAnchor = /occupation-market/iu.test(clause);
    const hasAuditedUrl = references.some(
      (reference) => classifyCandidateReference(reference) !== "other",
    );
    const hasExplicitAnchor =
      hasSepeAnchor || hasOccupationMarketAnchor || hasAuditedUrl;
    const hasInheritedAnchor = anchoredSemicolon && !hasExplicitAnchor;
    const hasAnchor = hasExplicitAnchor || hasInheritedAnchor;
    const endsWithSemicolon = /;\s*$/u.test(clause);
    if (!hasAnchor) {
      anchoredSemicolon = false;
      continue;
    }
    const semanticClause = clause.replace(/https?:\/\/[^\s<>()]+/giu, " ");
    const mentionsOwnershipTarget =
      /(?:junta|jcyl|castilla y leon|cc\s*by|mit)/iu.test(semanticClause);
    const mentionsOwnership =
      /(?:propiedad|propio|titularidad|licenc|relicenc|copyright|autor(?:ia)?|dataset|recurso|bajo\s+(?:la\s+)?licencia)/iu.test(
        semanticClause,
      );
    if (!mentionsOwnershipTarget || !mentionsOwnership) {
      anchoredSemicolon = endsWithSemicolon;
      continue;
    }

    const negativeClause =
      /(?:\bno\b|\bnunca\b|\bsin\b|\bnot\b|\bdoes\s+not\b|\bdoesn't\b).{0,120}?(?:licenc|propiedad|relicenc|cc\s*by|mit)/iu.exec(
        clause,
      )?.[0] ?? "";
    const remainingClause = semanticClause.replace(negativeClause, " ");
    const hasAffirmativeRemainder =
      /(?:junta|jcyl|castilla y leon|cc\s*by|mit)/iu.test(remainingClause) &&
      /(?:propiedad|propio|titularidad|licenc|relicenc|copyright|autor(?:ia)?|dataset|recurso|bajo\s+(?:la\s+)?licencia)/iu.test(
        remainingClause,
      );
    if (negativeClause === "" || hasAffirmativeRemainder) {
      throw new Error(
        `Candidate boundary contains a contradictory JCyL/MIT ownership claim in ${label}.`,
      );
    }
    anchoredSemicolon = endsWithSemicolon;
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

function relativeFileSet(
  rootDir: string,
  dataRoot: string,
  files: readonly string[],
): Set<string> {
  const absoluteDataRoot = resolveCandidatePath(rootDir, dataRoot, "data root");
  return new Set(
    files.map((file) => relative(absoluteDataRoot, file).split(sep).join("/")),
  );
}

async function compareBundleDataTree(
  rootDir: string,
  bundleRoot: "dist",
  sourceManifest: CandidateManifest,
): Promise<void> {
  const publicFiles = await collectRegularFiles(
    rootDir,
    "public/data/v1",
    "Candidate public data",
  );
  const bundleFiles = await collectRegularFiles(
    rootDir,
    `${bundleRoot}/data/v1`,
    "Candidate bundle data",
  );
  const publicPaths = relativeFileSet(rootDir, "public/data/v1", publicFiles);
  const bundlePaths = relativeFileSet(
    rootDir,
    `${bundleRoot}/data/v1`,
    bundleFiles,
  );
  const activeSnapshotId = manifestSnapshotId(
    sourceManifest,
    "Candidate manifest",
  );
  const activePrefix = `snapshots/${activeSnapshotId}/`;
  const expectedPaths = new Set(
    [...publicPaths].filter(
      (path) => !path.startsWith("snapshots/") || path.startsWith(activePrefix),
    ),
  );
  const missing = [...expectedPaths].filter((path) => !bundlePaths.has(path));
  const extra = [...bundlePaths].filter((path) => !expectedPaths.has(path));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Candidate bundle data must have the same resource set as public data; missing=${missing.join(",")}; extra=${extra.join(",")}.`,
    );
  }

  for (const path of [...expectedPaths].sort()) {
    const publicFile = await readRegularFile(
      rootDir,
      `public/data/v1/${path}`,
      `Candidate public data ${path}`,
    );
    const bundleFile = await readRegularFile(
      rootDir,
      `${bundleRoot}/data/v1/${path}`,
      `Candidate bundle data ${path}`,
    );
    if (!publicFile.bytes.equals(bundleFile.bytes)) {
      throw new Error(
        `Candidate bundle data ${path} differs from public data bytes or metadata.`,
      );
    }
  }
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
  await compareBundleDataTree(rootDir, bundleRoot, sourceManifest);
  await validateResourceSnapshots(
    rootDir,
    parsedBundleManifest,
    "dist",
    "Candidate bundle",
  );
}

function assertRuntimeOptions(
  value: unknown,
): asserts value is CandidateBoundaryOptions {
  const options = asRecord(value, "Candidate boundary options");
  const expectedKeys = [
    "rootDir",
    "manifestPath",
    "sepeResourcePath",
    "documentPaths",
    "bundleRoots",
  ].sort();
  const actualKeys = Object.keys(options).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(
      "Candidate boundary options must contain exactly rootDir, manifestPath, sepeResourcePath, documentPaths, and bundleRoots.",
    );
  }
  if (typeof options.rootDir !== "string" || options.rootDir.trim() === "") {
    throw new Error("Candidate boundary options rootDir is required.");
  }
  if (options.manifestPath !== "public/data/v1/manifest.json") {
    throw new Error(
      "Candidate boundary options manifestPath must be public/data/v1/manifest.json.",
    );
  }
  if (
    typeof options.sepeResourcePath !== "string" ||
    options.sepeResourcePath.trim() === ""
  ) {
    throw new Error("Candidate boundary options sepeResourcePath is required.");
  }
  if (
    !Array.isArray(options.documentPaths) ||
    JSON.stringify(options.documentPaths) !==
      JSON.stringify(EXPECTED_DOCUMENT_PATHS)
  ) {
    throw new Error(
      "Candidate boundary options documentPaths must equal the required evidence document tuple.",
    );
  }
  if (
    !Array.isArray(options.bundleRoots) ||
    JSON.stringify(options.bundleRoots) !==
      JSON.stringify(EXPECTED_BUNDLE_ROOTS)
  ) {
    throw new Error(
      "Candidate boundary options bundleRoots must equal [dist].",
    );
  }
}

export async function validateCandidateBoundary(
  options: CandidateBoundaryOptions,
): Promise<CandidateBoundaryValidation> {
  assertRuntimeOptions(options);
  const lexicalRoot = resolve(options.rootDir);
  const rootDir = await canonicalizeRoot(lexicalRoot);
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
  const sepeResourcePath = remapRootAlias(
    lexicalRoot,
    rootDir,
    options.sepeResourcePath,
  );
  const canonicalSepePath = manifestResourceFilePath(
    rootDir,
    sepeSnapshot.resourcePath,
    "public",
    "Candidate manifest sepeOccupationMarket",
  );
  const requestedSepePath = resolveCandidatePath(
    rootDir,
    sepeResourcePath,
    "sepeResourcePath",
  );
  if (requestedSepePath !== canonicalSepePath) {
    throw new Error(
      "sepeResourcePath must resolve to the canonical public manifest resource path for sepeOccupationMarket.",
    );
  }
  const requestedBytes = await readRegularFile(
    rootDir,
    sepeResourcePath,
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
    if (documentPath.endsWith(".json")) {
      const value = parseJson(
        document.bytes,
        `Candidate document ${documentPath}`,
      );
      visitStringLeaves(value, `Candidate document ${documentPath}`, (text) =>
        assertNoContradictoryOwnership(text, documentPath),
      );
      const resourceEvidence = extractApplicableResourceEvidence(
        value,
        documentPath,
      );
      if (resourceEvidence !== null) {
        if (resourceEvidence.resourceKeys) {
          assertCandidateResourceSet(resourceEvidence.resourceKeys);
        }
        for (const snapshots of resourceEvidence.resourceSnapshots) {
          compareResourceSnapshots(
            sourceManifest.resourceSnapshots,
            snapshots,
            `Candidate document ${documentPath}`,
          );
        }
        if (
          resourceEvidence.resourceKeys &&
          resourceEvidence.resourceSnapshots.length > 0
        ) {
          throw new Error(
            `Candidate document ${documentPath} must not mix resourceKeys with resourceSnapshots representations.`,
          );
        }
      }
      assertEvidenceManifestIdentity(
        value,
        `Candidate document ${documentPath}`,
        publicSnapshotId,
        publicManifestSha256,
        REQUIRED_EVIDENCE_DOCUMENTS.has(documentPath) ||
          resourceEvidence !== null,
      );
      if (documentPath === "docs/contest/coverage-freeze.json") {
        assertCoverageFreezeResourceEvidence(resourceEvidence, documentPath);
      }
    } else {
      assertNoContradictoryOwnership(
        decodeUtf8(document.bytes, `Candidate document ${documentPath}`),
        documentPath,
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

export async function main(
  argv: readonly string[],
  rootDir = process.cwd(),
): Promise<void> {
  const bundleRootIndex = argv.indexOf("--bundle-root");
  const bundleRoot =
    bundleRootIndex === -1 ? "dist" : (argv[bundleRootIndex + 1] ?? "");
  if (bundleRoot !== "dist") {
    throw new Error("Usage: validateCandidateBoundary.ts --bundle-root dist");
  }
  const manifestFile = await readRegularFile(
    rootDir,
    DEFAULT_CANDIDATE_BOUNDARY_OPTIONS.manifestPath,
    "Candidate manifest",
  );
  const manifest = parseCandidateManifest(
    parseJson(manifestFile.bytes, "Candidate manifest"),
    "Candidate manifest",
  );
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
