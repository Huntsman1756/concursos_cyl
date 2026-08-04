import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
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
  SourceSnapshotSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type GeneratedManifest,
  type SourceSnapshot,
} from "../../data/schemas/generated";
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
import { runQualityGates, type SnapshotCounts } from "./qualityGates";
import { SOURCE_CONFIG } from "./sourceConfig";

const RESOURCE_DEFINITIONS = {
  programs: {
    fileName: "programs.json",
    schema: z.array(TrainingProgramSchema),
  },
  centers: {
    fileName: "centers.json",
    schema: z.array(EducationCenterSchema),
  },
  trainingOfferings: {
    fileName: "training-offerings.json",
    schema: z.array(TrainingOfferingSchema),
  },
  jobOffers: {
    fileName: "job-offers.json",
    schema: z.array(JobOfferSchema),
  },
} as const;

type ResourceKey = keyof typeof RESOURCE_DEFINITIONS;

interface PreviousSnapshot {
  manifest: GeneratedManifest;
  counts: SnapshotCounts;
}

export interface BuildSnapshotsOptions {
  rootDirectory?: string;
  now?: () => Date;
  fetchTrainingRecords?: () => Promise<TrainingSourceRecord[]>;
  fetchOfferRecords?: () => Promise<OfferSourceRecord[]>;
  log?: (message: string) => void;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function serializeDeterministically(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function hashValue(value: unknown): string {
  return createHash("sha256")
    .update(serializeDeterministically(value))
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

function assertSafeRoot(rootDirectory: string): string {
  if (!isAbsolute(rootDirectory)) {
    throw new Error("Snapshot root directory must be absolute.");
  }

  const root = resolve(rootDirectory);
  if (root === parse(root).root || root === resolve(homedir())) {
    throw new Error(
      "Snapshot root directory is too broad for safe replacement.",
    );
  }
  return root;
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

function assertSnapshotPaths(
  root: string,
  staging: string,
  target: string,
): void {
  const expectedTarget = resolve(root, "public", "data", "v1");
  const temporaryRoot = resolve(root, ".codex-tmp");

  if (resolve(target) !== expectedTarget || !isWithin(root, expectedTarget)) {
    throw new Error(
      "Snapshot target path is outside the exact public data path.",
    );
  }
  if (
    dirname(resolve(staging)) !== temporaryRoot ||
    !basename(staging).startsWith("data-build-")
  ) {
    throw new Error("Snapshot staging path is outside the guarded build area.");
  }
}

function assertTemporaryPath(root: string, path: string): void {
  const temporaryRoot = resolve(root, ".codex-tmp");
  const name = basename(path);
  if (
    dirname(resolve(path)) !== temporaryRoot ||
    (!name.startsWith("data-build-") && !name.startsWith("data-backup-"))
  ) {
    throw new Error(
      "Refusing recursive cleanup outside the guarded build area.",
    );
  }
}

async function removeTemporaryDirectory(
  root: string,
  path: string,
): Promise<void> {
  assertTemporaryPath(root, path);
  await rm(path, { recursive: true, force: true });
}

function countsFromManifest(manifest: GeneratedManifest): SnapshotCounts {
  return {
    programs: manifest.resourceSnapshots.programs.recordCount,
    centers: manifest.resourceSnapshots.centers.recordCount,
    offerings: manifest.resourceSnapshots.trainingOfferings.recordCount,
    offers: manifest.resourceSnapshots.jobOffers.recordCount,
  };
}

async function validateSnapshotDirectory(
  directory: string,
): Promise<PreviousSnapshot> {
  const manifest = GeneratedManifestSchema.parse(
    JSON.parse(await readFile(resolve(directory, "manifest.json"), "utf8")),
  );

  for (const key of Object.keys(RESOURCE_DEFINITIONS) as ResourceKey[]) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resolve(directory, definition.fileName);
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
  }

  return { manifest, counts: countsFromManifest(manifest) };
}

async function loadPreviousSnapshot(
  target: string,
): Promise<PreviousSnapshot | undefined> {
  try {
    await access(target);
  } catch (error) {
    if (isMissing(error)) {
      return undefined;
    }
    throw error;
  }

  return validateSnapshotDirectory(target);
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
  staging: string,
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
    hashValue(offerRecords),
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

  await mkdir(staging, { recursive: false });
  const resourceHashes = {} as Record<ResourceKey, string>;
  for (const key of Object.keys(RESOURCE_DEFINITIONS) as ResourceKey[]) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resolve(staging, definition.fileName);
    await writeFile(
      filePath,
      serializeDeterministically(candidate[key]),
      "utf8",
    );
    resourceHashes[key] = await hashFile(filePath);
  }

  const trainingUpdatedAt = null;
  const manifest = GeneratedManifestSchema.parse({
    schemaVersion: "1.0.0",
    generatedAt: fetchedAt,
    qualityStatus: "passed",
    resourceSnapshots: {
      programs: sourceSnapshot(
        SOURCE_CONFIG.training,
        fetchedAt,
        trainingUpdatedAt,
        candidate.programs.length,
        resourceHashes.programs,
      ),
      centers: sourceSnapshot(
        SOURCE_CONFIG.training,
        fetchedAt,
        trainingUpdatedAt,
        candidate.centers.length,
        resourceHashes.centers,
      ),
      trainingOfferings: sourceSnapshot(
        SOURCE_CONFIG.training,
        fetchedAt,
        trainingUpdatedAt,
        candidate.trainingOfferings.length,
        resourceHashes.trainingOfferings,
      ),
      jobOffers: sourceSnapshot(
        SOURCE_CONFIG.offers,
        fetchedAt,
        offerSourceSnapshot.sourceUpdatedAt,
        candidate.jobOffers.length,
        resourceHashes.jobOffers,
      ),
    },
    qualityReport,
  });

  await writeFile(
    resolve(staging, "manifest.json"),
    serializeDeterministically(manifest),
    "utf8",
  );
  await validateSnapshotDirectory(staging);
  return { manifest, counts: qualityReport.counts };
}

async function promoteCandidate(
  root: string,
  staging: string,
  target: string,
  buildId: string,
): Promise<void> {
  assertSnapshotPaths(root, staging, target);
  const backup = resolve(root, ".codex-tmp", `data-backup-${buildId}`);
  assertTemporaryPath(root, backup);
  await mkdir(dirname(target), { recursive: true });
  let hasBackup = false;

  try {
    await rename(target, backup);
    hasBackup = true;
  } catch (error) {
    if (!isMissing(error)) {
      throw error;
    }
  }

  try {
    await rename(staging, target);
  } catch (error) {
    if (hasBackup) {
      await rename(backup, target);
    }
    throw error;
  }

  if (hasBackup) {
    await removeTemporaryDirectory(root, backup);
  }
}

async function markPreviousSnapshotStale(
  root: string,
  target: string,
  buildId: string,
): Promise<void> {
  const previous = await validateSnapshotDirectory(target);
  const staleManifest = GeneratedManifestSchema.parse({
    ...previous.manifest,
    qualityStatus: "stale",
    resourceSnapshots: Object.fromEntries(
      Object.entries(previous.manifest.resourceSnapshots).map(
        ([key, value]) => [key, { ...value, qualityStatus: "stale" }],
      ),
    ),
  });
  const temporaryRoot = resolve(root, ".codex-tmp");
  const recovery = resolve(temporaryRoot, `data-build-${buildId}-stale`);
  const backup = resolve(temporaryRoot, `data-backup-${buildId}-manifest`);
  assertTemporaryPath(root, recovery);
  assertTemporaryPath(root, backup);
  await mkdir(recovery, { recursive: false });
  const recoveryManifest = resolve(recovery, "manifest.json");
  await writeFile(
    recoveryManifest,
    serializeDeterministically(staleManifest),
    "utf8",
  );
  GeneratedManifestSchema.parse(
    JSON.parse(await readFile(recoveryManifest, "utf8")),
  );

  const manifestPath = resolve(target, "manifest.json");
  const backupManifest = resolve(backup, "manifest.json");
  await mkdir(backup, { recursive: false });
  await rename(manifestPath, backupManifest);
  try {
    await rename(recoveryManifest, manifestPath);
  } catch (error) {
    await rename(backupManifest, manifestPath);
    throw error;
  }

  await validateSnapshotDirectory(target);
  await removeTemporaryDirectory(root, recovery);
  await removeTemporaryDirectory(root, backup);
}

/** Builds, validates, and atomically publishes the official static snapshots. */
export async function buildSnapshots(
  options: BuildSnapshotsOptions = {},
): Promise<void> {
  const root = assertSafeRoot(options.rootDirectory ?? process.cwd());
  const now = options.now ?? (() => new Date());
  const fetchedAt = now().toISOString();
  const buildId = `${Date.parse(fetchedAt)}-${process.pid}`;
  const staging = resolve(root, ".codex-tmp", `data-build-${buildId}`);
  const target = resolve(root, "public", "data", "v1");
  const temporaryRoot = resolve(root, ".codex-tmp");
  assertSnapshotPaths(root, staging, target);
  await mkdir(temporaryRoot, { recursive: true });

  const previous = await loadPreviousSnapshot(target);
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

  try {
    const [trainingRecords, offerRecords] = await Promise.all([
      fetchTrainingRecords(),
      fetchOfferRecords(),
    ]);
    const result = await writeCandidate(
      staging,
      fetchedAt,
      trainingRecords,
      offerRecords,
      previous?.counts,
    );
    await promoteCandidate(root, staging, target, buildId);
    (options.log ?? console.info)(
      `Generated official snapshots at ${fetchedAt}: ${JSON.stringify(result.counts)}`,
    );
  } catch (error) {
    try {
      await removeTemporaryDirectory(root, staging);
    } catch (cleanupError) {
      if (!isMissing(cleanupError)) {
        throw cleanupError;
      }
    }

    if (previous !== undefined) {
      await markPreviousSnapshotStale(root, target, buildId);
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
