import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
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
  type SnapshotCandidate,
  type SnapshotCounts,
} from "./qualityGates";
import { SOURCE_CONFIG } from "./sourceConfig";

const RESOURCE_DEFINITIONS = {
  programs: {
    ...GENERATED_RESOURCE_CATALOG.programs,
    schema: z.array(TrainingProgramSchema),
  },
  centers: {
    ...GENERATED_RESOURCE_CATALOG.centers,
    schema: z.array(EducationCenterSchema),
  },
  trainingOfferings: {
    ...GENERATED_RESOURCE_CATALOG.trainingOfferings,
    schema: z.array(TrainingOfferingSchema),
  },
  jobOffers: {
    ...GENERATED_RESOURCE_CATALOG.jobOffers,
    schema: z.array(JobOfferSchema),
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

function isMissing(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT"
  );
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
    const records = definition.schema.parse(
      JSON.parse(await readFile(filePath, "utf8")),
    );
    const snapshot = manifest.resourceSnapshots[key];

    if (records.length !== snapshot.recordCount) {
      throw new Error(`Snapshot count mismatch for ${definition.fileName}.`);
    }
    if ((await hashFile(filePath)) !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch for ${definition.fileName}.`);
    }
    loaded[key] = records;
  }

  const candidate: SnapshotCandidate = {
    programs: loaded.programs as SnapshotCandidate["programs"],
    centers: loaded.centers as SnapshotCandidate["centers"],
    trainingOfferings:
      loaded.trainingOfferings as SnapshotCandidate["trainingOfferings"],
    jobOffers: loaded.jobOffers as SnapshotCandidate["jobOffers"],
  };
  const report = runQualityGates(candidate);
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
    .filter((value): value is string => value !== null)
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
    sourceSnapshot: offerSourceSnapshot,
  });
  const candidate = {
    programs: z.array(TrainingProgramSchema).parse(training.programs),
    centers: z.array(EducationCenterSchema).parse(training.centers),
    trainingOfferings: z
      .array(TrainingOfferingSchema)
      .parse(training.offerings),
    jobOffers: z.array(JobOfferSchema).parse(offers),
  };
  const qualityReport = runQualityGates(candidate, previousCounts);

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
  manifest: GeneratedManifest,
): Promise<void> {
  const snapshotsRoot = resolve(target, "snapshots");
  const destination = resolve(snapshotsRoot, snapshotId);
  await safeMkdir(root, snapshotsRoot);

  if (await pathExists(destination)) {
    await validateFlatCandidateDirectory(root, destination, manifest);
    await safeRemoveTemporaryDirectory(root, temporaryRoot, staging);
    return;
  }

  await safeRename(root, staging, destination);
  await validateFlatCandidateDirectory(root, destination, manifest);
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
        entry.isDirectory() && /^\d{17}-[a-f0-9]{12}$/u.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort((left, right) => compareCanonicalText(right, left));
  const retained = new Set([
    currentSnapshotId,
    ...immutableSnapshotNames
      .filter((snapshotId) => snapshotId !== currentSnapshotId)
      .slice(0, RETAINED_HISTORY_SNAPSHOTS),
  ]);

  for (const snapshotId of immutableSnapshotNames) {
    if (retained.has(snapshotId)) {
      continue;
    }
    const candidate = resolve(snapshotsRoot, snapshotId);
    if (
      dirname(candidate) !== snapshotsRoot ||
      !/^\d{17}-[a-f0-9]{12}$/u.test(basename(candidate))
    ) {
      throw new Error(
        "Refusing snapshot retention cleanup outside version root.",
      );
    }
    await assertPhysicalPath(root, candidate);
    await rm(candidate, { recursive: true, force: true });
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

  const legacyBackupPaths = await recoverInterruptedLegacyBackup(
    root,
    temporaryRoot,
    target,
  );
  const abandonedBuildPaths = await abandonedBuildDirectories(temporaryRoot);
  const cleanupPaths = [...legacyBackupPaths, ...abandonedBuildPaths];
  const previous = await loadPreviousSnapshot(root, target);
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
  try {
    const [trainingRecords, offerRecords] = await Promise.all([
      fetchTrainingRecords(),
      fetchOfferRecords(),
    ]);
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
    await publishImmutableResources(
      root,
      temporaryRoot,
      staging,
      target,
      snapshotId,
      result.manifest,
    );
    staging = undefined;
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
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  await buildSnapshots();
}
