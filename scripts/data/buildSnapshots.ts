import { createHash, randomUUID } from "node:crypto";
import {
  access,
  link,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";

import { z } from "zod";

import {
  EducationCenterSchema,
  GeneratedManifestSchema,
  JobOfferSchema,
  LegacyEducationCenterSchema,
  LegacyTrainingOfferingSchema,
  LoadableGeneratedManifestSchema,
  SourceSnapshotSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type GeneratedManifest,
  type LoadableGeneratedManifest,
  type SourceSnapshot,
} from "../../data/schemas/generated";
import {
  GENERATED_RESOURCE_CATALOG,
  GENERATED_RESOURCE_KEYS,
  immutableGeneratedResourcePath,
  type GeneratedResourceKey,
} from "../../data/schemas/generatedResourceCatalog";
import {
  OfferSourceRecordSchema,
  type OfferSourceRecord,
} from "../../data/schemas/offerSource";
import {
  TrainingSourceRecordSchema,
  type TrainingSourceRecord,
} from "../../data/schemas/trainingSource";
import { fetchAllRecords } from "./fetchAllRecords";
import { hashFile } from "./hashFile";
import { normalizeOffers } from "./normalizeOffers";
import { normalizeTraining } from "./normalizeTraining";
import {
  runQualityGates,
  runLegacyQualityGates,
  type LegacySnapshotCandidate,
  type SnapshotCandidate,
  type SnapshotCounts,
} from "./qualityGates";
import { SOURCE_CONFIG } from "./sourceConfig";

/** Read-only migration for snapshots published before the v1 compatibility fix. */
const TransitionalJobOfferSchema = z
  .object({
    ...JobOfferSchema.shape,
    sourceRecordUpdatedAt: z.string().datetime(),
  })
  .strict()
  .transform(({ sourceRecordUpdatedAt, ...offer }) =>
    JobOfferSchema.parse({
      ...offer,
      sourceSnapshot: {
        ...offer.sourceSnapshot,
        sourceUpdatedAt: sourceRecordUpdatedAt,
      },
    }),
  );
const PreviousJobOffersSchema = z.array(
  z.union([JobOfferSchema, TransitionalJobOfferSchema]),
);

const ProgramsResourceSchema = z.array(TrainingProgramSchema);
const CentersResourceSchema = z.array(EducationCenterSchema);
const LegacyCentersResourceSchema = z.array(LegacyEducationCenterSchema);
const TrainingOfferingsResourceSchema = z.array(TrainingOfferingSchema);
const LegacyTrainingOfferingsResourceSchema = z.array(
  LegacyTrainingOfferingSchema,
);
const JobOffersResourceSchema = z.array(JobOfferSchema);

const RESOURCE_DEFINITIONS = {
  programs: {
    ...GENERATED_RESOURCE_CATALOG.programs,
    schema: ProgramsResourceSchema,
    previousSchema: ProgramsResourceSchema,
    legacySchema: ProgramsResourceSchema,
  },
  centers: {
    ...GENERATED_RESOURCE_CATALOG.centers,
    schema: CentersResourceSchema,
    previousSchema: CentersResourceSchema,
    legacySchema: LegacyCentersResourceSchema,
  },
  trainingOfferings: {
    ...GENERATED_RESOURCE_CATALOG.trainingOfferings,
    schema: TrainingOfferingsResourceSchema,
    previousSchema: TrainingOfferingsResourceSchema,
    legacySchema: LegacyTrainingOfferingsResourceSchema,
  },
  jobOffers: {
    ...GENERATED_RESOURCE_CATALOG.jobOffers,
    schema: JobOffersResourceSchema,
    previousSchema: PreviousJobOffersSchema,
    legacySchema: JobOffersResourceSchema,
  },
} as const;

type ResourceKey = GeneratedResourceKey;

interface PreviousSnapshot {
  manifest: LoadableGeneratedManifest;
  counts: SnapshotCounts;
  format: "current" | "legacy";
}

export interface SnapshotFailureInjection {
  beforeManifestCommit?: () => void | Promise<void>;
  afterManifestCommit?: () => void | Promise<void>;
  beforeCleanup?: () => void | Promise<void>;
  closeLockHandle?: (close: () => Promise<void>) => void | Promise<void>;
  assertLockPhysicalAfterClose?: (
    assertPhysical: () => Promise<void>,
  ) => void | Promise<void>;
  beforeLockReleaseValidation?: () => void | Promise<void>;
  afterLockReleaseOwnedRename?: () => void | Promise<void>;
  beforeFailedLockCleanupValidation?: () => void | Promise<void>;
  afterFailedLockCleanupOwnedRename?: () => void | Promise<void>;
}

export interface BuildSnapshotsOptions {
  rootDirectory?: string;
  now?: () => Date;
  fetchTrainingRecords?: () => Promise<TrainingSourceRecord[]>;
  fetchOfferRecords?: () => Promise<OfferSourceRecord[]>;
  log?: (message: string) => void;
  failureInjection?: SnapshotFailureInjection;
}

function compareCanonicalText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareCanonicalText(left, right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map(canonicalValue)
      .sort((left, right) =>
        compareCanonicalText(JSON.stringify(left), JSON.stringify(right)),
      );
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => compareCanonicalText(left, right))
        .map(([key, entry]) => [key, canonicalValue(entry)]),
    );
  }
  return value;
}

function serializeDeterministically(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function hashCanonicalSource(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalValue(value)))
    .digest("hex");
}

function errorCode(error: unknown): string | undefined {
  return error !== null && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

function isMissing(error: unknown): boolean {
  return errorCode(error) === "ENOENT";
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isMissing(error)) {
      return false;
    }
    throw error;
  }
}

function withoutWindowsDevicePrefix(path: string): string {
  return path
    .replace(/^\\\\\?\\UNC\\/iu, "\\\\")
    .replace(/^\\\\\?\\/u, "")
    .replace(/^\\\?\?\\/u, "");
}

function normalizedPhysicalPath(path: string): string {
  const normalized = resolve(withoutWindowsDevicePrefix(path));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isWithin(parent: string, child: string): boolean {
  const pathFromParent = relative(parent, child);
  return (
    pathFromParent.length > 0 &&
    pathFromParent !== ".." &&
    !pathFromParent.startsWith(`..${sep}`) &&
    !isAbsolute(pathFromParent)
  );
}

export async function assertSafeSnapshotRoot(
  rootDirectory: string,
): Promise<string> {
  const normalizedInput = withoutWindowsDevicePrefix(rootDirectory);
  if (!isAbsolute(normalizedInput)) {
    throw new Error("Snapshot root directory must be absolute.");
  }

  const root = resolve(normalizedInput);
  const broadRoots = new Set([
    normalizedPhysicalPath(parse(root).root),
    normalizedPhysicalPath(homedir()),
    normalizedPhysicalPath(await realpath(homedir())),
  ]);
  if (broadRoots.has(normalizedPhysicalPath(root))) {
    throw new Error(
      "Snapshot root directory is too broad for safe publication.",
    );
  }

  const rootStat = await lstat(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error(
      "Snapshot root cannot be a symbolic link or reparse point.",
    );
  }
  const physicalRoot = await realpath(root);
  if (broadRoots.has(normalizedPhysicalPath(physicalRoot))) {
    throw new Error("Snapshot physical root resolves to home or a drive root.");
  }
  if (normalizedPhysicalPath(physicalRoot) !== normalizedPhysicalPath(root)) {
    throw new Error(
      "Snapshot root physical path does not match its lexical path.",
    );
  }
  return root;
}

/**
 * Checks every existing component so a junction, symlink, or other realpath
 * escape cannot redirect a later write, rename, or recursive cleanup.
 */
async function assertPhysicalPath(
  root: string,
  candidate: string,
): Promise<void> {
  const absolute = resolve(candidate);
  if (absolute !== root && !isWithin(root, absolute)) {
    throw new Error("Physical path is outside the snapshot root.");
  }

  const physicalRoot = await realpath(root);
  const segments = relative(root, absolute)
    .split(sep)
    .filter((segment) => segment.length > 0);
  let lexical = root;

  for (let index = 0; index < segments.length; index += 1) {
    lexical = resolve(lexical, segments[index]);
    let entry;
    try {
      entry = await lstat(lexical);
    } catch (error) {
      if (isMissing(error)) {
        return;
      }
      throw error;
    }

    if (entry.isSymbolicLink()) {
      throw new Error(
        `Refusing symbolic link, junction, or reparse point in physical path: ${lexical}.`,
      );
    }

    const actual = await realpath(lexical);
    const expected = resolve(physicalRoot, ...segments.slice(0, index + 1));
    if (normalizedPhysicalPath(actual) !== normalizedPhysicalPath(expected)) {
      throw new Error(
        `Physical path escapes through a reparse point: ${lexical}.`,
      );
    }
  }
}

async function safeMkdir(root: string, path: string): Promise<void> {
  await assertPhysicalPath(root, path);
  await mkdir(path, { recursive: true });
  await assertPhysicalPath(root, path);
}

async function safeWriteFile(
  root: string,
  path: string,
  contents: string,
): Promise<void> {
  await assertPhysicalPath(root, dirname(path));
  await assertPhysicalPath(root, path);
  await writeFile(path, contents, "utf8");
}

async function safeRename(
  root: string,
  source: string,
  destination: string,
): Promise<void> {
  await assertPhysicalPath(root, source);
  await assertPhysicalPath(root, dirname(destination));
  await assertPhysicalPath(root, destination);
  await rename(source, destination);
}

function assertTemporaryName(path: string): void {
  const name = basename(path);
  if (!name.startsWith("data-build-") && !name.startsWith("data-backup-")) {
    throw new Error(
      "Refusing cleanup outside a named data build or backup path.",
    );
  }
}

async function safeRemoveTemporaryDirectory(
  root: string,
  temporaryRoot: string,
  path: string,
): Promise<void> {
  if (dirname(resolve(path)) !== temporaryRoot) {
    throw new Error("Refusing recursive cleanup outside .codex-tmp.");
  }
  assertTemporaryName(path);
  await assertPhysicalPath(root, path);
  await rm(path, { recursive: true, force: true });
}

const SNAPSHOT_BUILD_LOCK_NAME = "snapshot-build.lock";
const SNAPSHOT_BUILD_LOCK_OWNED_PREFIX = "snapshot-build.lock-owned-";

function snapshotBuildId(pid: number, token: string): string {
  return `${pid}-${token}`;
}

function canonicalLockRoot(root: string): string {
  return normalizedPhysicalPath(root);
}

const SnapshotBuildLockMetadataSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    token: z.string().uuid(),
    pid: z.number().int().positive(),
    startedAt: z.string().datetime(),
    root: z.string().min(1),
    buildId: z.string().min(1),
  })
  .strict()
  .superRefine((metadata, context) => {
    if (metadata.buildId !== snapshotBuildId(metadata.pid, metadata.token)) {
      context.addIssue({
        code: "custom",
        path: ["buildId"],
        message: "Build ID must match the lock PID and token.",
      });
    }
    if (
      !isAbsolute(metadata.root) ||
      metadata.root !== canonicalLockRoot(metadata.root)
    ) {
      context.addIssue({
        code: "custom",
        path: ["root"],
        message: "Lock root must be the canonical normalized absolute path.",
      });
    }
  });

type SnapshotBuildLockMetadata = z.infer<
  typeof SnapshotBuildLockMetadataSchema
>;

interface HeldSnapshotBuildLock {
  path: string;
  metadata: SnapshotBuildLockMetadata;
  identity: LockFileIdentity;
}

interface LockFileIdentity {
  dev: number;
  ino: number;
}

async function readSnapshotBuildLock(
  root: string,
  lockPath: string,
): Promise<SnapshotBuildLockMetadata> {
  await assertPhysicalPath(root, lockPath);
  try {
    return SnapshotBuildLockMetadataSchema.parse(
      JSON.parse(await readFile(lockPath, "utf8")),
    );
  } catch (error) {
    throw new Error("Snapshot build lock metadata is invalid.", {
      cause: error,
    });
  }
}

function sameLockIdentity(
  left: SnapshotBuildLockMetadata,
  right: SnapshotBuildLockMetadata,
): boolean {
  return (
    left.schemaVersion === right.schemaVersion &&
    left.token === right.token &&
    left.pid === right.pid &&
    left.startedAt === right.startedAt &&
    left.root === right.root &&
    left.buildId === right.buildId
  );
}

function assertExactLockPath(temporaryRoot: string, lockPath: string): void {
  if (resolve(lockPath) !== resolve(temporaryRoot, SNAPSHOT_BUILD_LOCK_NAME)) {
    throw new Error("Snapshot build lock path is not the exact lock file.");
  }
}

function assertExactOwnedLockPath(
  temporaryRoot: string,
  ownedPath: string,
): void {
  const resolved = resolve(ownedPath);
  if (
    dirname(resolved) !== temporaryRoot ||
    !basename(resolved).startsWith(SNAPSHOT_BUILD_LOCK_OWNED_PREFIX)
  ) {
    throw new Error("Owned snapshot build lock path is not contained.");
  }
}

async function moveCanonicalLockToOwnedPath(
  root: string,
  temporaryRoot: string,
  lockPath: string,
  purpose: "cleanup" | "release",
): Promise<string> {
  assertExactLockPath(temporaryRoot, lockPath);
  await assertPhysicalPath(root, temporaryRoot);
  const ownedPath = resolve(
    temporaryRoot,
    `${SNAPSHOT_BUILD_LOCK_OWNED_PREFIX}${purpose}-${randomUUID()}`,
  );
  assertExactOwnedLockPath(temporaryRoot, ownedPath);
  await assertPhysicalPath(root, ownedPath);
  await rename(lockPath, ownedPath);
  return ownedPath;
}

async function restoreOwnedSnapshotBuildLock(
  root: string,
  temporaryRoot: string,
  lockPath: string,
  ownedPath: string,
): Promise<void> {
  assertExactLockPath(temporaryRoot, lockPath);
  assertExactOwnedLockPath(temporaryRoot, ownedPath);
  await assertPhysicalPath(root, temporaryRoot);
  await assertPhysicalPath(root, ownedPath);
  await link(ownedPath, lockPath);
  await rm(ownedPath, { force: true });
}

async function removeOwnedLockPath(
  root: string,
  temporaryRoot: string,
  ownedPath: string,
): Promise<void> {
  assertExactOwnedLockPath(temporaryRoot, ownedPath);
  await assertPhysicalPath(root, ownedPath);
  await rm(ownedPath, { force: true });
}

function sameLockFileIdentity(
  left: LockFileIdentity,
  right: LockFileIdentity,
): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function snapshotBuildLockOperatorGuidance(lockPath: string): string {
  return `Operator recovery: verify no snapshot build is running, then deliberately remove only the exact lock file ${lockPath} and rerun.`;
}

async function validateExpectedSnapshotBuildLock(
  root: string,
  lockPath: string,
  heldLock: HeldSnapshotBuildLock,
): Promise<void> {
  try {
    const identity = await lstat(lockPath);
    if (identity.isSymbolicLink() || !identity.isFile()) {
      throw new Error("Snapshot build lock is not a regular owned file.");
    }
    const metadata = await readSnapshotBuildLock(root, lockPath);
    if (
      heldLock.metadata.root !== canonicalLockRoot(root) ||
      metadata.root !== canonicalLockRoot(root) ||
      !sameLockFileIdentity(identity, heldLock.identity) ||
      !sameLockIdentity(metadata, heldLock.metadata)
    ) {
      throw new Error("Snapshot build lock owner changed before mutation.");
    }
  } catch (error) {
    throw new Error(
      `Snapshot build lock ownership validation failed; the canonical lock was not mutated. ${snapshotBuildLockOperatorGuidance(lockPath)}`,
      { cause: error },
    );
  }
}

async function moveAndValidateOwnedSnapshotBuildLock(
  root: string,
  temporaryRoot: string,
  lockPath: string,
  heldLock: HeldSnapshotBuildLock,
  purpose: "cleanup" | "release",
  afterOwnedRename: (() => void | Promise<void>) | undefined,
): Promise<string> {
  // This is a cooperative lock protocol: callers validate the canonical object
  // immediately before this rename, and we validate the owned object again
  // before deletion. No build auto-removes an existing lock. Arbitrary external
  // filesystem mutation in the narrow precheck-to-rename interval is outside
  // the threat model; postvalidation still prevents deletion of an unexpected
  // owned object or of a contender that acquires the canonical pathname.
  const ownedPath = await moveCanonicalLockToOwnedPath(
    root,
    temporaryRoot,
    lockPath,
    purpose,
  );
  try {
    await afterOwnedRename?.();
    const movedIdentity = await lstat(ownedPath);
    const movedMetadata = await readSnapshotBuildLock(root, ownedPath);
    if (
      !sameLockFileIdentity(movedIdentity, heldLock.identity) ||
      !sameLockIdentity(movedMetadata, heldLock.metadata)
    ) {
      throw new Error("Snapshot build lock owner changed before release.");
    }
    return ownedPath;
  } catch (error) {
    try {
      await restoreOwnedSnapshotBuildLock(
        root,
        temporaryRoot,
        lockPath,
        ownedPath,
      );
    } catch (restoreError) {
      throw new Error(
        `Snapshot build lock ownership validation failed (${error instanceof Error ? error.message : String(error)}) and safe restoration was not possible.`,
        { cause: restoreError },
      );
    }
    throw error;
  }
}

async function cleanupFailedLockAcquisition(
  root: string,
  temporaryRoot: string,
  lockPath: string,
  heldLock: HeldSnapshotBuildLock,
  failureInjection: SnapshotFailureInjection | undefined,
): Promise<void> {
  await failureInjection?.beforeFailedLockCleanupValidation?.();
  await validateExpectedSnapshotBuildLock(root, lockPath, heldLock);
  const ownedPath = await moveAndValidateOwnedSnapshotBuildLock(
    root,
    temporaryRoot,
    lockPath,
    heldLock,
    "cleanup",
    failureInjection?.afterFailedLockCleanupOwnedRename,
  );
  await removeOwnedLockPath(root, temporaryRoot, ownedPath);
}

async function describeExistingSnapshotBuildLock(
  root: string,
  lockPath: string,
): Promise<string> {
  try {
    const identity = await lstat(lockPath);
    if (identity.isSymbolicLink() || !identity.isFile()) {
      return "metadata is unavailable or invalid";
    }
    const metadata = await readSnapshotBuildLock(root, lockPath);
    return `metadata pid=${metadata.pid}, startedAt=${metadata.startedAt}, buildId=${metadata.buildId}, token=${metadata.token}, root=${metadata.root}`;
  } catch {
    return "metadata is unavailable or invalid";
  }
}

async function acquireSnapshotBuildLock(
  root: string,
  temporaryRoot: string,
  failureInjection: SnapshotFailureInjection | undefined,
  log: (message: string) => void,
): Promise<HeldSnapshotBuildLock> {
  const lockPath = resolve(temporaryRoot, SNAPSHOT_BUILD_LOCK_NAME);
  const token = randomUUID();
  const metadata = SnapshotBuildLockMetadataSchema.parse({
    schemaVersion: "1.0.0",
    token,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    root: canonicalLockRoot(root),
    buildId: snapshotBuildId(process.pid, token),
  });

  await assertPhysicalPath(root, temporaryRoot);
  let handle;
  try {
    handle = await open(lockPath, "wx");
  } catch (error) {
    if (errorCode(error) !== "EEXIST") {
      throw error;
    }
    const diagnostic = await describeExistingSnapshotBuildLock(root, lockPath);
    throw new Error(
      `Snapshot build lock already exists; build stopped before fetch or startup cleanup (${diagnostic}). ${snapshotBuildLockOperatorGuidance(lockPath)}`,
      { cause: error },
    );
  }

  const identity = await handle.stat();
  try {
    await handle.writeFile(serializeDeterministically(metadata), "utf8");
    await handle.sync();
    const close = () => handle.close();
    if (failureInjection?.closeLockHandle === undefined) {
      await close();
    } else {
      await failureInjection.closeLockHandle(close);
    }
    const assertAfterClose = () => assertPhysicalPath(root, lockPath);
    if (failureInjection?.assertLockPhysicalAfterClose === undefined) {
      await assertAfterClose();
    } else {
      await failureInjection.assertLockPhysicalAfterClose(assertAfterClose);
    }
  } catch (error) {
    await handle.close().catch(() => undefined);
    const heldLock = { path: lockPath, metadata, identity };
    try {
      await cleanupFailedLockAcquisition(
        root,
        temporaryRoot,
        lockPath,
        heldLock,
        failureInjection,
      );
    } catch (cleanupError) {
      log(
        `Non-fatal snapshot build lock acquisition cleanup failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
      );
    }
    throw error;
  }
  return { path: lockPath, metadata, identity };
}

async function releaseSnapshotBuildLock(
  root: string,
  temporaryRoot: string,
  heldLock: HeldSnapshotBuildLock,
  log: (message: string) => void,
  failureInjection: SnapshotFailureInjection | undefined,
): Promise<void> {
  try {
    await failureInjection?.beforeLockReleaseValidation?.();
    await validateExpectedSnapshotBuildLock(root, heldLock.path, heldLock);
    const ownedPath = await moveAndValidateOwnedSnapshotBuildLock(
      root,
      temporaryRoot,
      heldLock.path,
      heldLock,
      "release",
      failureInjection?.afterLockReleaseOwnedRename,
    );
    await removeOwnedLockPath(root, temporaryRoot, ownedPath);
  } catch (error) {
    log(
      `Non-fatal snapshot build lock release failure: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function countsFromManifest(
  manifest: LoadableGeneratedManifest,
): SnapshotCounts {
  return {
    programs: manifest.resourceSnapshots.programs.recordCount,
    centers: manifest.resourceSnapshots.centers.recordCount,
    offerings: manifest.resourceSnapshots.trainingOfferings.recordCount,
    offers: manifest.resourceSnapshots.jobOffers.recordCount,
  };
}

function parseManifest(json: unknown): LoadableGeneratedManifest {
  return LoadableGeneratedManifestSchema.parse(json);
}

function parseManifestWithFormat(json: unknown): {
  manifest: LoadableGeneratedManifest;
  format: PreviousSnapshot["format"];
} {
  const current = GeneratedManifestSchema.safeParse(json);
  if (current.success) {
    return { manifest: current.data, format: "current" };
  }
  return {
    manifest: LoadableGeneratedManifestSchema.parse(json),
    format: "legacy",
  };
}

function resourceFileInSnapshot(
  snapshotDirectory: string,
  resourcePath: string,
): string {
  const relativeAsset = resourcePath.replace(/^\/data\/v1\//u, "");
  return resolve(snapshotDirectory, ...relativeAsset.split("/"));
}

async function validateSnapshotDirectory(
  root: string,
  directory: string,
): Promise<PreviousSnapshot> {
  await assertPhysicalPath(root, directory);
  const manifestPath = resolve(directory, "manifest.json");
  await assertPhysicalPath(root, manifestPath);
  const parsedManifest = parseManifestWithFormat(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const { manifest } = parsedManifest;

  const loaded = {} as Record<ResourceKey, unknown[]>;
  for (const key of GENERATED_RESOURCE_KEYS) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resourceFileInSnapshot(
      directory,
      manifest.resourceSnapshots[key].resourcePath,
    );
    await assertPhysicalPath(root, filePath);
    const json = JSON.parse(await readFile(filePath, "utf8"));
    const previousSchema =
      parsedManifest.format === "current"
        ? definition.previousSchema
        : definition.legacySchema;
    const parsedResource = previousSchema.safeParse(json);
    if (!parsedResource.success) {
      throw new Error(`Snapshot schema mismatch for ${definition.fileName}.`, {
        cause: parsedResource.error,
      });
    }
    const records = parsedResource.data as unknown[];
    const snapshot = manifest.resourceSnapshots[key];

    if (records.length !== snapshot.recordCount) {
      throw new Error(`Snapshot count mismatch for ${definition.fileName}.`);
    }
    if ((await hashFile(filePath)) !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch for ${definition.fileName}.`);
    }
    loaded[key] = records;
  }

  for (const [key, snapshot] of Object.entries(manifest.resourceSnapshots)) {
    if ((GENERATED_RESOURCE_KEYS as readonly string[]).includes(key)) {
      continue;
    }
    const filePath = resourceFileInSnapshot(directory, snapshot.resourcePath);
    await assertPhysicalPath(root, filePath);
    const records = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(records)) {
      throw new Error(`Additive snapshot resource ${key} must be an array.`);
    }
    if (records.length !== snapshot.recordCount) {
      throw new Error(`Snapshot count mismatch for additive resource ${key}.`);
    }
    if ((await hashFile(filePath)) !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch for additive resource ${key}.`);
    }
  }

  const resourceContract = parsedManifest.format;
  const report =
    resourceContract === "current"
      ? runQualityGates(
          {
            programs: loaded.programs as SnapshotCandidate["programs"],
            centers: loaded.centers as SnapshotCandidate["centers"],
            trainingOfferings:
              loaded.trainingOfferings as SnapshotCandidate["trainingOfferings"],
            jobOffers: loaded.jobOffers as SnapshotCandidate["jobOffers"],
          },
          undefined,
          manifest.qualityReport?.reconciliationAnomalies ?? [],
        )
      : runLegacyQualityGates({
          programs: loaded.programs as LegacySnapshotCandidate["programs"],
          centers: loaded.centers as LegacySnapshotCandidate["centers"],
          trainingOfferings:
            loaded.trainingOfferings as LegacySnapshotCandidate["trainingOfferings"],
          jobOffers: loaded.jobOffers as LegacySnapshotCandidate["jobOffers"],
        });
  const counts = countsFromManifest(manifest);
  if (JSON.stringify(report.counts) !== JSON.stringify(counts)) {
    throw new Error(
      "Snapshot manifest counts do not match quality-gate counts.",
    );
  }
  if (
    manifest.qualityReport !== undefined &&
    JSON.stringify(stableValue(manifest.qualityReport)) !==
      JSON.stringify(stableValue(report))
  ) {
    throw new Error(
      "Snapshot manifest quality report contradicts recomputed quality gates.",
    );
  }

  return { manifest, counts, format: parsedManifest.format };
}

async function validateFlatCandidateDirectory(
  root: string,
  staging: string,
  manifest: GeneratedManifest,
): Promise<void> {
  for (const key of GENERATED_RESOURCE_KEYS) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resolve(staging, definition.fileName);
    await assertPhysicalPath(root, filePath);
    const records = definition.schema.parse(
      JSON.parse(await readFile(filePath, "utf8")),
    );
    const snapshot = manifest.resourceSnapshots[key];
    if (
      records.length !== snapshot.recordCount ||
      (await hashFile(filePath)) !== snapshot.sha256
    ) {
      throw new Error(
        `Staged resource validation failed for ${definition.fileName}.`,
      );
    }
  }
}

async function loadPreviousSnapshot(
  root: string,
  target: string,
): Promise<PreviousSnapshot | undefined> {
  const manifestPath = resolve(target, "manifest.json");
  if (!(await pathExists(manifestPath))) {
    return undefined;
  }
  return validateSnapshotDirectory(root, target);
}

async function legacyBackups(temporaryRoot: string): Promise<string[]> {
  if (!(await pathExists(temporaryRoot))) {
    return [];
  }
  return (await readdir(temporaryRoot, { withFileTypes: true }))
    .filter(
      (entry) => entry.isDirectory() && entry.name.startsWith("data-backup-"),
    )
    .map((entry) => resolve(temporaryRoot, entry.name))
    .sort()
    .reverse();
}

async function abandonedBuildDirectories(
  temporaryRoot: string,
): Promise<string[]> {
  if (!(await pathExists(temporaryRoot))) {
    return [];
  }
  return (await readdir(temporaryRoot, { withFileTypes: true }))
    .filter(
      (entry) => entry.isDirectory() && entry.name.startsWith("data-build-"),
    )
    .map((entry) => resolve(temporaryRoot, entry.name));
}

async function recoverInterruptedLegacyBackup(
  root: string,
  temporaryRoot: string,
  target: string,
): Promise<string[]> {
  const backups = await legacyBackups(temporaryRoot);
  if (await pathExists(resolve(target, "manifest.json"))) {
    return backups;
  }

  for (const backup of backups) {
    try {
      await validateSnapshotDirectory(root, backup);
    } catch {
      continue;
    }

    if (await pathExists(target)) {
      const orphan = resolve(
        temporaryRoot,
        `data-build-recovery-orphan-${Date.now()}`,
      );
      await safeRename(root, target, orphan);
    }
    await safeMkdir(root, dirname(target));
    await safeRename(root, backup, target);
    await validateSnapshotDirectory(root, target);
    return backups.filter((candidate) => candidate !== backup);
  }

  return backups;
}

function latestSourceUpdatedAt(
  offers: readonly ReturnType<typeof normalizeOffers>[number][],
): string | null {
  const values = offers
    .map((offer) => offer.sourceSnapshot.sourceUpdatedAt)
    .sort();
  return values.at(-1) ?? null;
}

function sourceSnapshot(
  source: (typeof SOURCE_CONFIG)["training"] | (typeof SOURCE_CONFIG)["offers"],
  fetchedAt: string,
  sourceUpdatedAt: string | null,
  recordCount: number,
  sha256: string,
): SourceSnapshot {
  return SourceSnapshotSchema.parse({
    sourceId: source.id,
    sourceUrl: source.recordsUrl,
    sourceUpdatedAt,
    snapshotFetchedAt: fetchedAt,
    schemaVersion: "1.0.0",
    recordCount,
    sha256,
    qualityStatus: "passed",
  });
}

async function writeCandidate(
  root: string,
  staging: string,
  snapshotId: string,
  fetchedAt: string,
  trainingRecords: readonly TrainingSourceRecord[],
  offerRecords: readonly OfferSourceRecord[],
  previousCounts: SnapshotCounts | undefined,
): Promise<{ manifest: GeneratedManifest; counts: SnapshotCounts }> {
  const training = normalizeTraining(trainingRecords);
  const firstPassOffers = normalizeOffers(offerRecords);
  const offerSourceSnapshot = sourceSnapshot(
    SOURCE_CONFIG.offers,
    fetchedAt,
    latestSourceUpdatedAt(firstPassOffers),
    offerRecords.length,
    hashCanonicalSource(offerRecords),
  );
  const offers = normalizeOffers(offerRecords, {
    datasetSnapshot: offerSourceSnapshot,
  });
  const candidate = {
    programs: z.array(TrainingProgramSchema).parse(training.programs),
    centers: z.array(EducationCenterSchema).parse(training.centers),
    trainingOfferings: z
      .array(TrainingOfferingSchema)
      .parse(training.offerings),
    jobOffers: z.array(JobOfferSchema).parse(offers),
  };
  const qualityReport = runQualityGates(
    candidate,
    previousCounts,
    training.reconciliationAnomalies,
  );

  await safeMkdir(root, staging);
  const resourceHashes = {} as Record<ResourceKey, string>;
  for (const key of GENERATED_RESOURCE_KEYS) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resolve(staging, definition.fileName);
    await safeWriteFile(
      root,
      filePath,
      serializeDeterministically(candidate[key]),
    );
    resourceHashes[key] = await hashFile(filePath);
  }

  const resourceSnapshot = (
    key: ResourceKey,
    source:
      (typeof SOURCE_CONFIG)["training"] | (typeof SOURCE_CONFIG)["offers"],
    sourceUpdatedAt: string | null,
    count: number,
  ) => ({
    ...sourceSnapshot(
      source,
      fetchedAt,
      sourceUpdatedAt,
      count,
      resourceHashes[key],
    ),
    resourcePath: immutableGeneratedResourcePath(key, snapshotId),
  });
  const manifest = GeneratedManifestSchema.parse({
    schemaVersion: "1.0.0",
    generatedAt: fetchedAt,
    qualityStatus: "passed",
    resourceSnapshots: {
      programs: resourceSnapshot(
        "programs",
        SOURCE_CONFIG.training,
        null,
        candidate.programs.length,
      ),
      centers: resourceSnapshot(
        "centers",
        SOURCE_CONFIG.training,
        null,
        candidate.centers.length,
      ),
      trainingOfferings: resourceSnapshot(
        "trainingOfferings",
        SOURCE_CONFIG.training,
        null,
        candidate.trainingOfferings.length,
      ),
      jobOffers: resourceSnapshot(
        "jobOffers",
        SOURCE_CONFIG.offers,
        offerSourceSnapshot.sourceUpdatedAt,
        candidate.jobOffers.length,
      ),
    },
    qualityReport,
  });

  await validateFlatCandidateDirectory(root, staging, manifest);
  return { manifest, counts: qualityReport.counts };
}

async function publishImmutableResources(
  root: string,
  temporaryRoot: string,
  staging: string,
  target: string,
  snapshotId: string,
): Promise<{ destination: string; created: boolean }> {
  const snapshotsRoot = resolve(target, "snapshots");
  const destination = resolve(snapshotsRoot, snapshotId);
  await safeMkdir(root, snapshotsRoot);

  if (await pathExists(destination)) {
    await safeRemoveTemporaryDirectory(root, temporaryRoot, staging);
    return { destination, created: false };
  }

  await safeRename(root, staging, destination);
  return { destination, created: true };
}

async function commitManifest(
  root: string,
  target: string,
  buildId: string,
  manifest: unknown,
  beforeCommit?: () => void | Promise<void>,
  validator: z.ZodType = GeneratedManifestSchema,
): Promise<void> {
  const manifestPath = resolve(target, "manifest.json");
  const candidatePath = resolve(target, `manifest.next-${buildId}.json`);
  await safeWriteFile(
    root,
    candidatePath,
    serializeDeterministically(manifest),
  );
  validator.parse(JSON.parse(await readFile(candidatePath, "utf8")));
  await beforeCommit?.();
  await safeRename(root, candidatePath, manifestPath);
}

async function markPreviousSnapshotStale(
  root: string,
  target: string,
  buildId: string,
): Promise<void> {
  const previous = await validateSnapshotDirectory(root, target);
  if (previous.format === "legacy") {
    const staleLegacySnapshot = (snapshot: SourceSnapshot) => ({
      sourceId: snapshot.sourceId,
      sourceUrl: snapshot.sourceUrl,
      sourceUpdatedAt: snapshot.sourceUpdatedAt,
      snapshotFetchedAt: snapshot.snapshotFetchedAt,
      schemaVersion: snapshot.schemaVersion,
      recordCount: snapshot.recordCount,
      sha256: snapshot.sha256,
      qualityStatus: "stale" as const,
    });
    const staleLegacyManifest = {
      schemaVersion: previous.manifest.schemaVersion,
      generatedAt: previous.manifest.generatedAt,
      qualityStatus: "stale" as const,
      resourceSnapshots: {
        programs: staleLegacySnapshot(
          previous.manifest.resourceSnapshots.programs,
        ),
        centers: staleLegacySnapshot(
          previous.manifest.resourceSnapshots.centers,
        ),
        trainingOfferings: staleLegacySnapshot(
          previous.manifest.resourceSnapshots.trainingOfferings,
        ),
        jobOffers: staleLegacySnapshot(
          previous.manifest.resourceSnapshots.jobOffers,
        ),
      },
      ...(previous.manifest.qualityReport === undefined
        ? {}
        : { qualityReport: previous.manifest.qualityReport }),
    };
    LoadableGeneratedManifestSchema.parse(staleLegacyManifest);
    await commitManifest(
      root,
      target,
      `${buildId}-stale`,
      staleLegacyManifest,
      undefined,
      LoadableGeneratedManifestSchema,
    );
    await validateSnapshotDirectory(root, target);
    return;
  }

  const staleManifest = GeneratedManifestSchema.parse({
    ...previous.manifest,
    qualityStatus: "stale",
    resourceSnapshots: Object.fromEntries(
      Object.entries(previous.manifest.resourceSnapshots).map(
        ([key, value]) => [key, { ...value, qualityStatus: "stale" }],
      ),
    ),
  });
  await commitManifest(root, target, `${buildId}-stale`, staleManifest);
  await validateSnapshotDirectory(root, target);
}

const RETAINED_HISTORY_SNAPSHOTS = 2;
const IMMUTABLE_SNAPSHOT_ID_PATTERN = /^\d{17}-[a-f0-9]{12}$/u;

async function safeRemoveImmutableSnapshotDirectory(
  root: string,
  target: string,
  candidate: string,
): Promise<void> {
  const snapshotsRoot = resolve(target, "snapshots");
  if (
    dirname(resolve(candidate)) !== snapshotsRoot ||
    !IMMUTABLE_SNAPSHOT_ID_PATTERN.test(basename(candidate))
  ) {
    throw new Error(
      "Refusing snapshot retention cleanup outside version root.",
    );
  }
  await assertPhysicalPath(root, candidate);
  await rm(candidate, { recursive: true, force: true });
}

async function enforceSnapshotRetention(
  root: string,
  target: string,
): Promise<void> {
  const manifest = parseManifest(
    JSON.parse(await readFile(resolve(target, "manifest.json"), "utf8")),
  );
  const snapshotIds = Object.values(manifest.resourceSnapshots).map(
    (snapshot) =>
      /^\/data\/v1\/snapshots\/([a-z0-9-]+)\//u.exec(
        snapshot.resourcePath,
      )?.[1],
  );
  const currentSnapshotId = snapshotIds[0];
  if (
    currentSnapshotId === undefined ||
    snapshotIds.some((snapshotId) => snapshotId !== currentSnapshotId)
  ) {
    return;
  }

  const snapshotsRoot = resolve(target, "snapshots");
  if (!(await pathExists(snapshotsRoot))) {
    return;
  }
  await assertPhysicalPath(root, snapshotsRoot);
  const immutableSnapshotNames = (
    await readdir(snapshotsRoot, { withFileTypes: true })
  )
    .filter(
      (entry) =>
        entry.isDirectory() && IMMUTABLE_SNAPSHOT_ID_PATTERN.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((left, right) => compareCanonicalText(right, left));
  const retained = new Set([
    currentSnapshotId,
    ...immutableSnapshotNames
      .filter(
        (snapshotId) =>
          snapshotId !== currentSnapshotId &&
          snapshotId.slice(0, 17) < currentSnapshotId.slice(0, 17),
      )
      .slice(0, RETAINED_HISTORY_SNAPSHOTS),
  ]);

  for (const snapshotId of immutableSnapshotNames) {
    if (retained.has(snapshotId)) {
      continue;
    }
    await safeRemoveImmutableSnapshotDirectory(
      root,
      target,
      resolve(snapshotsRoot, snapshotId),
    );
  }
}

async function cleanupAfterCommit(
  root: string,
  temporaryRoot: string,
  target: string,
  cleanupPaths: readonly string[],
  beforeCleanup: (() => void | Promise<void>) | undefined,
  log: (message: string) => void,
): Promise<void> {
  const runCleanupStage = async (
    label: string,
    cleanup: () => Promise<void>,
  ): Promise<void> => {
    try {
      await cleanup();
    } catch (error) {
      log(
        `Non-fatal ${label} cleanup failure: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  await runCleanupStage("temporary snapshot", async () => {
    await beforeCleanup?.();
    for (const cleanupPath of cleanupPaths) {
      if (await pathExists(cleanupPath)) {
        await safeRemoveTemporaryDirectory(root, temporaryRoot, cleanupPath);
      }
    }
  });
  await runCleanupStage("manifest candidate", async () => {
    for (const entry of await readdir(target, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.startsWith("manifest.next-")) {
        const candidate = resolve(target, entry.name);
        await assertPhysicalPath(root, candidate);
        await rm(candidate, { force: true });
      }
    }
  });
  await runCleanupStage("snapshot retention", async () => {
    await enforceSnapshotRetention(root, target);
  });
}

/** Builds and publishes immutable resource sets with a manifest-last commit. */
export async function buildSnapshots(
  options: BuildSnapshotsOptions = {},
): Promise<void> {
  const root = await assertSafeSnapshotRoot(
    options.rootDirectory ?? process.cwd(),
  );
  const now = options.now ?? (() => new Date());
  const fetchedAt = now().toISOString();
  const log = options.log ?? console.info;
  const temporaryRoot = resolve(root, ".codex-tmp");
  const target = resolve(root, "public", "data", "v1");

  await assertPhysicalPath(root, resolve(root, "public", "data"));
  await assertPhysicalPath(root, temporaryRoot);
  await safeMkdir(root, temporaryRoot);
  await safeMkdir(root, resolve(root, "public", "data"));

  const heldLock = await acquireSnapshotBuildLock(
    root,
    temporaryRoot,
    options.failureInjection,
    log,
  );
  try {
    const legacyBackupPaths = await recoverInterruptedLegacyBackup(
      root,
      temporaryRoot,
      target,
    );
    const abandonedBuildPaths = await abandonedBuildDirectories(temporaryRoot);
    const cleanupPaths = [...legacyBackupPaths, ...abandonedBuildPaths];
    const previous = await loadPreviousSnapshot(root, target);
    if (previous !== undefined) {
      try {
        await enforceSnapshotRetention(root, target);
      } catch (error) {
        log(
          `Non-fatal startup snapshot cleanup failure: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    const fetchTrainingRecords =
      options.fetchTrainingRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.training.recordsUrl,
          TrainingSourceRecordSchema,
        ));
    const fetchOfferRecords =
      options.fetchOfferRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.offers.recordsUrl,
          OfferSourceRecordSchema,
        ));

    let committed = false;
    let staging: string | undefined;
    let immutableDestination: string | undefined;
    try {
      const [fetchedTrainingRecords, fetchedOfferRecords] = await Promise.all([
        fetchTrainingRecords(),
        fetchOfferRecords(),
      ]);
      const trainingRecords = z
        .array(TrainingSourceRecordSchema)
        .parse(fetchedTrainingRecords);
      const offerRecords = z
        .array(OfferSourceRecordSchema)
        .parse(fetchedOfferRecords);
      const sourceHash = hashCanonicalSource({
        offers: offerRecords,
        training: trainingRecords,
      });
      const snapshotId = `${fetchedAt.replace(/\D/gu, "").toLowerCase()}-${sourceHash.slice(0, 12)}`;
      const buildId = `${snapshotId}-${process.pid}`;
      staging = resolve(temporaryRoot, `data-build-${buildId}`);
      const result = await writeCandidate(
        root,
        staging,
        snapshotId,
        fetchedAt,
        trainingRecords,
        offerRecords,
        previous?.counts,
      );
      await safeMkdir(root, target);
      const publication = await publishImmutableResources(
        root,
        temporaryRoot,
        staging,
        target,
        snapshotId,
      );
      staging = undefined;
      immutableDestination = publication.created
        ? publication.destination
        : undefined;
      await validateFlatCandidateDirectory(
        root,
        publication.destination,
        result.manifest,
      );
      await commitManifest(
        root,
        target,
        buildId,
        result.manifest,
        options.failureInjection?.beforeManifestCommit,
      );
      committed = true;
      await options.failureInjection?.afterManifestCommit?.();
      await cleanupAfterCommit(
        root,
        temporaryRoot,
        target,
        cleanupPaths,
        options.failureInjection?.beforeCleanup,
        log,
      );
      log(
        `Generated official snapshots at ${fetchedAt}: ${JSON.stringify(result.counts)}`,
      );
    } catch (error) {
      if (committed) {
        await cleanupAfterCommit(
          root,
          temporaryRoot,
          target,
          cleanupPaths,
          options.failureInjection?.beforeCleanup,
          log,
        );
        throw error;
      }

      if (staging !== undefined && (await pathExists(staging))) {
        try {
          await safeRemoveTemporaryDirectory(root, temporaryRoot, staging);
        } catch (cleanupError) {
          log(
            `Non-fatal staging cleanup failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
          );
        }
      }

      if (
        immutableDestination !== undefined &&
        (await pathExists(immutableDestination))
      ) {
        try {
          await safeRemoveImmutableSnapshotDirectory(
            root,
            target,
            immutableDestination,
          );
        } catch (cleanupError) {
          log(
            `Non-fatal unpublished snapshot cleanup failure: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
          );
        }
      }

      if (previous !== undefined) {
        await markPreviousSnapshotStale(
          root,
          target,
          `${fetchedAt.replace(/\D/gu, "")}-${process.pid}`,
        );
        throw new Error(
          `Snapshot refresh failed; previous snapshot marked stale. ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      throw error;
    }
  } finally {
    await releaseSnapshotBuildLock(
      root,
      temporaryRoot,
      heldLock,
      log,
      options.failureInjection,
    );
  }
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  await buildSnapshots();
}
