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
  MappingCoverageResourceSchema,
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
} from "../../data/schemas/curatedMappings";
import { FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID } from "../../data/schemas/fpOfficialAliasPass";
import { FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT } from "../../data/schemas/fpOneWordPublicationReview";
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
import { OutcomeIndicatorsResourceSchema } from "../../data/schemas/outcomes";
import {
  DerivedFpOccupationGraphResourceSchema,
  OpenDataCatalogResourceSchema,
} from "../../data/schemas/openData";
import {
  EcylCourseSourceRecordSchema,
  EcylCoursesResourceSchema,
  ProfessionalCertificateSourceRecordSchema,
  ProfessionalCertificatesResourceSchema,
  type EcylCourseSourceRecord,
  type ProfessionalCertificateSourceRecord,
} from "../../data/schemas/ecylResources";
import {
  ProfessionalProfilesResourceSchema,
  assertCompleteProfessionalProfileCoverage,
  type ProfessionalProfile,
} from "../../data/schemas/professionalProfiles";
import {
  MunicipalitiesResourceSchema,
  MunicipalitySourceRecordSchema,
  ProvincialContractsResourceSchema,
  RegionalContractSourceRecordSchema,
  type MunicipalitySourceRecord,
  type RegionalContractSourceRecord,
} from "../../data/schemas/regionalContext";
import {
  PublicEmploymentCallSourceRecordSchema,
  PublicEmploymentCallsResourceSchema,
  type PublicEmploymentCallSourceRecord,
} from "../../data/schemas/publicEmployment";
import {
  GENERATED_RESOURCE_CATALOG,
  GENERATED_FOUNDATION_RESOURCE_KEYS,
  GENERATED_RESOURCE_KEYS,
  immutableDerivedFpOccupationGraphCsvPath,
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
import { loadApprovedMappings } from "../../src/domain/occupation";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";
import { fetchAllRecords } from "./fetchAllRecords";
import {
  buildDerivedFpOccupationGraph,
  serializeDerivedFpOccupationGraphCsv,
  sha256Text,
} from "./buildDerivedFpOccupationGraph";
import { hashFile } from "./hashFile";
import {
  loadEducabaseIncomeBundle,
  type EducabaseIncomeBundle,
} from "./loadEducabaseIncome";
import { normalizeIncomeOutcomes } from "./normalizeIncomeOutcomes";
import {
  normalizeOffers,
  normalizeOffersWithPublishedRequirements,
} from "./normalizeOffers";
import { normalizeTraining } from "./normalizeTraining";
import {
  normalizeMunicipalities,
  normalizeRegionalContracts,
} from "./normalizeRegionalContext";
import {
  normalizeEcylCourses,
  normalizeProfessionalCertificates,
} from "./normalizeEcylResources";
import { normalizePublicEmploymentCalls } from "./normalizePublicEmployment";
import {
  buildMappingCoverage,
  loadCuratedMappingsFromDisk,
  type ValidatedCuratedMappings,
} from "./validateCuratedMappings";
import {
  assertPublicSnapshotDistribution,
  findRevokedPublicSnapshotDirectories,
} from "./validatePublicDistribution";
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
  occupations: {
    ...GENERATED_RESOURCE_CATALOG.occupations,
    schema: OccupationsSchema,
  },
  officialOccupations: {
    ...GENERATED_RESOURCE_CATALOG.officialOccupations,
    schema: OccupationsSchema,
  },
  occupationAliases: {
    ...GENERATED_RESOURCE_CATALOG.occupationAliases,
    schema: OccupationAliasesSchema,
  },
  trainingOccupationLinks: {
    ...GENERATED_RESOURCE_CATALOG.trainingOccupationLinks,
    schema: TrainingOccupationLinksSchema,
  },
  professionalProfiles: {
    ...GENERATED_RESOURCE_CATALOG.professionalProfiles,
    schema: ProfessionalProfilesResourceSchema,
  },
  mappingCoverage: {
    ...GENERATED_RESOURCE_CATALOG.mappingCoverage,
    schema: MappingCoverageResourceSchema,
  },
  publishedRequirements: {
    ...GENERATED_RESOURCE_CATALOG.publishedRequirements,
    schema: PublishedRequirementsResourceSchema,
  },
  outcomeIndicators: {
    ...GENERATED_RESOURCE_CATALOG.outcomeIndicators,
    schema: OutcomeIndicatorsResourceSchema,
  },
  ecylCourses: {
    ...GENERATED_RESOURCE_CATALOG.ecylCourses,
    schema: EcylCoursesResourceSchema,
  },
  professionalCertificates: {
    ...GENERATED_RESOURCE_CATALOG.professionalCertificates,
    schema: ProfessionalCertificatesResourceSchema,
  },
  publicEmploymentCalls: {
    ...GENERATED_RESOURCE_CATALOG.publicEmploymentCalls,
    schema: PublicEmploymentCallsResourceSchema,
  },
  provincialContracts: {
    ...GENERATED_RESOURCE_CATALOG.provincialContracts,
    schema: ProvincialContractsResourceSchema,
  },
  municipalities: {
    ...GENERATED_RESOURCE_CATALOG.municipalities,
    schema: MunicipalitiesResourceSchema,
  },
  derivedFpOccupationGraph: {
    ...GENERATED_RESOURCE_CATALOG.derivedFpOccupationGraph,
    schema: DerivedFpOccupationGraphResourceSchema,
  },
  openDataCatalog: {
    ...GENERATED_RESOURCE_CATALOG.openDataCatalog,
    schema: OpenDataCatalogResourceSchema,
  },
} as const;

type ResourceKey = GeneratedResourceKey;

interface PreviousSnapshot {
  manifest: LoadableGeneratedManifest;
  counts: SnapshotCounts;
  manifestFormat: "current" | "legacy";
}

class PublicSnapshotDistributionError extends Error {}
class SnapshotCrashSimulationError extends PublicSnapshotDistributionError {}

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
  beforeRevokedSnapshotPrune?: () => void | Promise<void>;
  afterRevokedSnapshotPrune?: () => void | Promise<void>;
  beforeActiveRevokedSnapshotQuarantine?: () => void | Promise<void>;
  afterActiveRevokedSnapshotQuarantine?: () => void | Promise<void>;
  beforeRollbackManifestCommit?: () => void | Promise<void>;
  crashAfterActiveSnapshotQuarantine?: () => void | Promise<void>;
  crashAfterActiveJournalBeforeFirstSnapshotRename?: () => void | Promise<void>;
  crashAfterManifestCommitBeforeActiveSnapshotRename?: () => void | Promise<void>;
}

export interface BuildSnapshotsOptions {
  rootDirectory?: string;
  now?: () => Date;
  fetchTrainingRecords?: () => Promise<TrainingSourceRecord[]>;
  fetchOfferRecords?: () => Promise<OfferSourceRecord[]>;
  fetchEcylCourseRecords?: () => Promise<EcylCourseSourceRecord[]>;
  fetchProfessionalCertificateRecords?: () => Promise<
    ProfessionalCertificateSourceRecord[]
  >;
  fetchPublicEmploymentCallRecords?: () => Promise<
    PublicEmploymentCallSourceRecord[]
  >;
  fetchRegionalContractRecords?: () => Promise<RegionalContractSourceRecord[]>;
  fetchMunicipalityRecords?: () => Promise<MunicipalitySourceRecord[]>;
  fetchIncomeBundle?: () => Promise<EducabaseIncomeBundle>;
  loadCuratedMappings?: (
    programs: readonly z.infer<typeof TrainingProgramSchema>[],
  ) => Promise<ValidatedCuratedMappings>;
  loadProfessionalProfiles?: (
    programs: readonly z.infer<typeof TrainingProgramSchema>[],
  ) => Promise<ProfessionalProfile[]>;
  loadOfficialOccupations?: () => Promise<z.infer<typeof OccupationsSchema>>;
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
  manifestFormat: PreviousSnapshot["manifestFormat"];
} {
  const current = GeneratedManifestSchema.safeParse(json);
  if (current.success) {
    return { manifest: current.data, manifestFormat: "current" };
  }
  return {
    manifest: LoadableGeneratedManifestSchema.parse(json),
    manifestFormat: "legacy",
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

  const candidates = {} as Record<
    ResourceKey,
    { current?: unknown[]; legacy?: unknown[] }
  >;
  const unambiguousContracts = new Set<"current" | "legacy">();
  for (const key of GENERATED_FOUNDATION_RESOURCE_KEYS) {
    const definition = RESOURCE_DEFINITIONS[key];
    const filePath = resourceFileInSnapshot(
      directory,
      manifest.resourceSnapshots[key].resourcePath,
    );
    await assertPhysicalPath(root, filePath);
    const json = JSON.parse(await readFile(filePath, "utf8"));
    const current = definition.previousSchema.safeParse(json);
    const legacy = definition.legacySchema.safeParse(json);
    if (!current.success && !legacy.success) {
      throw new Error(`Snapshot schema mismatch for ${definition.fileName}.`, {
        cause: current.error,
      });
    }
    if (current.success !== legacy.success) {
      unambiguousContracts.add(current.success ? "current" : "legacy");
    }
    candidates[key] = {
      ...(current.success ? { current: current.data as unknown[] } : {}),
      ...(legacy.success ? { legacy: legacy.data as unknown[] } : {}),
    };
    const records = (current.success ? current.data : legacy.data) as unknown[];
    const snapshot = manifest.resourceSnapshots[key];

    if (records.length !== snapshot.recordCount) {
      throw new Error(`Snapshot count mismatch for ${definition.fileName}.`);
    }
    if ((await hashFile(filePath)) !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch for ${definition.fileName}.`);
    }
  }

  if (unambiguousContracts.size > 1) {
    throw new Error("Snapshot mixes current and legacy resource contracts.");
  }
  const resourceContract =
    [...unambiguousContracts][0] ?? parsedManifest.manifestFormat;
  const loaded = {} as Record<ResourceKey, unknown[]>;
  for (const key of GENERATED_FOUNDATION_RESOURCE_KEYS) {
    const records = candidates[key][resourceContract];
    if (records === undefined) {
      throw new Error(
        `Snapshot schema mismatch for ${RESOURCE_DEFINITIONS[key].fileName}.`,
      );
    }
    loaded[key] = records;
  }

  for (const [key, snapshot] of Object.entries(manifest.resourceSnapshots)) {
    if (
      (GENERATED_FOUNDATION_RESOURCE_KEYS as readonly string[]).includes(key)
    ) {
      continue;
    }
    const filePath = resourceFileInSnapshot(directory, snapshot.resourcePath);
    await assertPhysicalPath(root, filePath);
    const json = JSON.parse(await readFile(filePath, "utf8"));
    const definition = RESOURCE_DEFINITIONS[key as ResourceKey];
    const records =
      definition === undefined
        ? z.array(z.unknown()).parse(json)
        : (definition.schema.parse(json) as unknown[]);
    if (records.length !== snapshot.recordCount) {
      throw new Error(`Snapshot count mismatch for additive resource ${key}.`);
    }
    if ((await hashFile(filePath)) !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch for additive resource ${key}.`);
    }
    if (key === "openDataCatalog") {
      const [catalog] = OpenDataCatalogResourceSchema.parse(records);
      const csvPath = resourceFileInSnapshot(
        directory,
        catalog.csvResourcePath,
      );
      await assertPhysicalPath(root, csvPath);
      if ((await hashFile(csvPath)) !== catalog.csvSha256) {
        throw new Error("Open-data CSV hash does not match its catalog.");
      }
    }
  }

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

  return {
    manifest,
    counts,
    manifestFormat: parsedManifest.manifestFormat,
  };
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
  const [catalog] = OpenDataCatalogResourceSchema.parse(
    JSON.parse(
      await readFile(
        resolve(staging, RESOURCE_DEFINITIONS.openDataCatalog.fileName),
        "utf8",
      ),
    ),
  );
  const csvPath = resolve(staging, basename(catalog.csvResourcePath));
  await assertPhysicalPath(root, csvPath);
  if ((await hashFile(csvPath)) !== catalog.csvSha256) {
    throw new Error("Staged open-data CSV hash does not match its catalog.");
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
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("data-backup-") &&
        !entry.name.startsWith("data-backup-revoked-snapshots-"),
    )
    .map((entry) => resolve(temporaryRoot, entry.name))
    .sort()
    .reverse();
}

async function interruptedSnapshotQuarantines(
  temporaryRoot: string,
): Promise<string[]> {
  if (!(await pathExists(temporaryRoot))) return [];
  return (await readdir(temporaryRoot, { withFileTypes: true }))
    .filter(
      (entry) =>
        entry.isDirectory() &&
        entry.name.startsWith("data-backup-revoked-snapshots-"),
    )
    .map((entry) => resolve(temporaryRoot, entry.name))
    .sort();
}

const ManifestIdentitySchema = z
  .object({
    canonicalSha256: z.string().regex(/^[a-f0-9]{64}$/u),
    snapshotIds: z.array(z.string()).readonly(),
  })
  .strict();

const SnapshotQuarantineJournalSchema = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    buildId: z.string().min(1),
    previousManifestIdentity: ManifestIdentitySchema.nullable(),
    candidateManifestIdentity: ManifestIdentitySchema,
    committed: z.boolean().default(false),
    entries: z.array(
      z
        .object({
          source: z.string().min(1),
          destination: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

async function recoverInterruptedSnapshotQuarantines(
  root: string,
  temporaryRoot: string,
  target: string,
  loadCuratedMappings?: BuildSnapshotsOptions["loadCuratedMappings"],
): Promise<void> {
  for (const directory of await interruptedSnapshotQuarantines(temporaryRoot)) {
    const journalPath = resolve(directory, "snapshot-quarantine-journal.json");
    const temporaryJournalPath = resolve(
      directory,
      "snapshot-quarantine-journal.next.json",
    );
    if (await pathExists(temporaryJournalPath)) {
      await assertPhysicalPath(root, temporaryJournalPath);
      await rm(temporaryJournalPath, { force: true });
    }
    await assertPhysicalPath(root, journalPath);
    let journal: z.infer<typeof SnapshotQuarantineJournalSchema>;
    try {
      journal = SnapshotQuarantineJournalSchema.parse(
        JSON.parse(await readFile(journalPath, "utf8")),
      );
    } catch (error) {
      const isolated = resolve(
        temporaryRoot,
        `data-quarantine-corrupt-${basename(directory)}-${randomUUID()}`,
      );
      await safeRename(root, directory, isolated);
      throw new Error(
        `Corrupt snapshot quarantine journal isolated at ${isolated}; revoked bytes remain outside public.`,
        { cause: error },
      );
    }
    const snapshotsRoot = resolve(target, "snapshots");
    for (const entry of journal.entries) {
      if (
        dirname(resolve(entry.source)) !== snapshotsRoot ||
        !IMMUTABLE_SNAPSHOT_ID_PATTERN.test(basename(entry.source)) ||
        dirname(resolve(entry.destination)) !== directory ||
        basename(entry.destination) !== basename(entry.source)
      ) {
        throw new Error("Invalid snapshot quarantine journal path.");
      }
    }
    const quarantine: SnapshotQuarantine = {
      directory,
      journalPath,
      entries: journal.entries,
      committed: journal.committed,
      buildId: journal.buildId,
      previousManifestIdentity: journal.previousManifestIdentity,
      candidateManifestIdentity: journal.candidateManifestIdentity,
    };
    const activeManifestPath = resolve(target, "manifest.json");
    const activeManifest = (await pathExists(activeManifestPath))
      ? LoadableGeneratedManifestSchema.parse(
          JSON.parse(await readFile(activeManifestPath, "utf8")),
        )
      : undefined;
    const activeIdentity =
      activeManifest === undefined
        ? undefined
        : manifestIdentity(target, activeManifest);
    const candidateIsActive =
      activeIdentity !== undefined &&
      manifestsMatch(activeIdentity, quarantine.candidateManifestIdentity);
    const previousIsActive =
      activeIdentity !== undefined &&
      quarantine.previousManifestIdentity !== null &&
      manifestsMatch(activeIdentity, quarantine.previousManifestIdentity);
    if (candidateIsActive) {
      await returnSnapshotsToQuarantine(root, quarantine);
      const programsSnapshot = activeManifest!.resourceSnapshots.programs;
      const programs = z
        .array(TrainingProgramSchema)
        .parse(
          JSON.parse(
            await readFile(
              resourceFileInSnapshot(target, programsSnapshot.resourcePath),
              "utf8",
            ),
          ),
        );
      const curatedMappings = await (
        loadCuratedMappings ??
        ((currentPrograms) =>
          loadCuratedMappingsFromDisk(root, currentPrograms))
      )(programs);
      await assertPublicSnapshotDistribution(
        root,
        curatedMappings,
        await completedPilotSnapshotDistributionOptions(root, target),
      );
      await safeRemoveTemporaryDirectory(root, temporaryRoot, directory);
      continue;
    }
    if (previousIsActive) {
      await restoreSnapshotQuarantine(root, quarantine);
      await validateSnapshotDirectory(root, target);
      await safeRemoveTemporaryDirectory(root, temporaryRoot, directory);
      continue;
    }
    const isolated = resolve(
      temporaryRoot,
      `data-quarantine-ambiguous-${basename(directory)}-${randomUUID()}`,
    );
    await safeRename(root, directory, isolated);
    throw new Error(
      `Snapshot quarantine identity is ambiguous; revoked bytes remain isolated at ${isolated}.`,
    );
  }
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
  source: { id: string; recordsUrl: string },
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
  ecylCourseRecords: readonly EcylCourseSourceRecord[],
  professionalCertificateRecords: readonly ProfessionalCertificateSourceRecord[],
  publicEmploymentCallRecords: readonly PublicEmploymentCallSourceRecord[],
  regionalContractRecords: readonly RegionalContractSourceRecord[],
  municipalityRecords: readonly MunicipalitySourceRecord[],
  incomeBundle: EducabaseIncomeBundle,
  outcomeIndicators: z.infer<typeof OutcomeIndicatorsResourceSchema>,
  curatedMappings: ValidatedCuratedMappings,
  officialOccupations: z.infer<typeof OccupationsSchema>,
  professionalProfiles: readonly ProfessionalProfile[],
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
  const normalizedOfferArtifacts = normalizeOffersWithPublishedRequirements(
    offerRecords,
    {
      datasetSnapshot: offerSourceSnapshot,
    },
  );
  const offers = normalizedOfferArtifacts.jobOffers;
  const approvedMappings = loadApprovedMappings(curatedMappings);
  const derivedFpOccupationGraph = buildDerivedFpOccupationGraph(
    training.programs,
    approvedMappings.occupations,
    approvedMappings.links,
  );
  const derivedGraphCsvFileName = "derived-fp-occupation-graph.csv";
  const derivedGraphCsv = serializeDerivedFpOccupationGraphCsv(
    derivedFpOccupationGraph,
  );
  const derivedGraphCsvResourcePath =
    immutableDerivedFpOccupationGraphCsvPath(snapshotId);
  const canonicalAliasIdentity = (alias: {
    alias: string;
    occupationId: string;
  }): string =>
    `${alias.alias
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("es-ES")
      .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
      .replace(/\s+/gu, " ")
      .trim()}:${alias.occupationId}`;
  const candidate = {
    programs: z
      .array(TrainingProgramSchema)
      .parse(training.programs)
      .sort((left, right) => left.programKey.localeCompare(right.programKey)),
    centers: z.array(EducationCenterSchema).parse(training.centers),
    trainingOfferings: z
      .array(TrainingOfferingSchema)
      .parse(training.offerings),
    jobOffers: z.array(JobOfferSchema).parse(offers),
    occupations: OccupationsSchema.parse(approvedMappings.occupations).sort(
      (left, right) => left.occupationId.localeCompare(right.occupationId),
    ),
    officialOccupations: OccupationsSchema.parse(officialOccupations).sort(
      (left, right) => left.occupationId.localeCompare(right.occupationId),
    ),
    occupationAliases: OccupationAliasesSchema.parse(
      approvedMappings.aliases,
    ).sort((left, right) =>
      canonicalAliasIdentity(left).localeCompare(canonicalAliasIdentity(right)),
    ),
    trainingOccupationLinks: TrainingOccupationLinksSchema.parse(
      approvedMappings.links,
    ).sort((left, right) =>
      `${left.trainingProgramKey}:${left.occupationId}:${left.relationshipType}`.localeCompare(
        `${right.trainingProgramKey}:${right.occupationId}:${right.relationshipType}`,
      ),
    ),
    professionalProfiles: ProfessionalProfilesResourceSchema.parse(
      professionalProfiles,
    ).sort((left, right) => left.profileId.localeCompare(right.profileId)),
    mappingCoverage: buildMappingCoverage(
      training.programs,
      curatedMappings.links,
    ),
    publishedRequirements: normalizedOfferArtifacts.publishedRequirements,
    outcomeIndicators: OutcomeIndicatorsResourceSchema.parse(outcomeIndicators),
    ecylCourses: EcylCoursesResourceSchema.parse(
      normalizeEcylCourses(ecylCourseRecords),
    ),
    professionalCertificates: ProfessionalCertificatesResourceSchema.parse(
      normalizeProfessionalCertificates(professionalCertificateRecords),
    ),
    publicEmploymentCalls: PublicEmploymentCallsResourceSchema.parse(
      normalizePublicEmploymentCalls(publicEmploymentCallRecords),
    ),
    provincialContracts: ProvincialContractsResourceSchema.parse(
      normalizeRegionalContracts(regionalContractRecords),
    ),
    municipalities: MunicipalitiesResourceSchema.parse(
      normalizeMunicipalities(municipalityRecords),
    ),
    derivedFpOccupationGraph,
    openDataCatalog: OpenDataCatalogResourceSchema.parse([
      {
        datasetId: "salida-cyl-fp-occupation-graph",
        title: "Grafo FP y ocupaciones de SALIDA CyL",
        description:
          "Relaciones revisadas entre ciclos de Formación Profesional y grupos primarios CNO-11 con evidencia de procedencia.",
        generatedAt: fetchedAt,
        licenseName: "CC BY 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
        csvResourcePath: derivedGraphCsvResourcePath,
        csvSha256: sha256Text(derivedGraphCsv),
        recordCount: derivedFpOccupationGraph.length,
      },
    ]),
  };
  const qualityReport = runQualityGates(
    candidate,
    previousCounts,
    training.reconciliationAnomalies,
  );

  await safeMkdir(root, staging);
  await safeWriteFile(
    root,
    resolve(staging, derivedGraphCsvFileName),
    derivedGraphCsv,
  );
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

  const curatedOccupationSource = {
    id: "ine-cno11-reviewed-occupation-catalog",
    recordsUrl:
      "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  };
  const officialOccupationSource = {
    id: "boe-cno11-complete-occupation-catalog",
    recordsUrl: "https://www.boe.es/eli/es/rd/2010/11/26/1591",
  };
  const curatedRelationshipSource = {
    id: "todofp-boe-reviewed-training-occupation-links",
    recordsUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales.html",
  };
  const professionalProfileSource = {
    id: "todofp-official-professional-outputs",
    recordsUrl:
      "https://www.todofp.es/que-estudiar/familias-profesionales.html",
  };
  const derivedRelationshipSource = {
    id: "salida-cyl-derived-fp-occupation-graph",
    recordsUrl: "https://github.com/Huntsman1756/concursos_cyl",
  };
  const resourceSnapshot = (key: ResourceKey, count: number) => ({
    ...sourceSnapshot(
      RESOURCE_DEFINITIONS[key].sourceKind === "training"
        ? SOURCE_CONFIG.training
        : RESOURCE_DEFINITIONS[key].sourceKind === "offers"
          ? SOURCE_CONFIG.offers
          : RESOURCE_DEFINITIONS[key].sourceKind === "curatedOccupations"
            ? curatedOccupationSource
            : RESOURCE_DEFINITIONS[key].sourceKind ===
                "officialOccupationCatalog"
              ? officialOccupationSource
              : RESOURCE_DEFINITIONS[key].sourceKind === "educabaseIncome"
                ? SOURCE_CONFIG.educabaseIncome
                : RESOURCE_DEFINITIONS[key].sourceKind === "ecylCourses"
                  ? SOURCE_CONFIG.ecylCourses
                  : RESOURCE_DEFINITIONS[key].sourceKind ===
                      "publicEmploymentCalls"
                    ? SOURCE_CONFIG.publicEmploymentCalls
                    : RESOURCE_DEFINITIONS[key].sourceKind ===
                        "professionalCertificates"
                      ? SOURCE_CONFIG.professionalCertificates
                      : RESOURCE_DEFINITIONS[key].sourceKind ===
                          "professionalProfiles"
                        ? professionalProfileSource
                        : RESOURCE_DEFINITIONS[key].sourceKind ===
                            "regionalContracts"
                          ? SOURCE_CONFIG.regionalContracts
                          : RESOURCE_DEFINITIONS[key].sourceKind ===
                              "municipalities"
                            ? SOURCE_CONFIG.municipalities
                            : RESOURCE_DEFINITIONS[key].sourceKind ===
                                "derivedRelationships"
                              ? derivedRelationshipSource
                              : curatedRelationshipSource,
      fetchedAt,
      RESOURCE_DEFINITIONS[key].sourceKind === "offers"
        ? offerSourceSnapshot.sourceUpdatedAt
        : null,
      count,
      resourceHashes[key],
    ),
    resourcePath: immutableGeneratedResourcePath(key, snapshotId),
    ...(key === "outcomeIndicators"
      ? { upstreamArtifacts: incomeBundle.artifacts }
      : {}),
  });
  const manifest = GeneratedManifestSchema.parse({
    schemaVersion: "1.0.0",
    generatedAt: fetchedAt,
    qualityStatus: "passed",
    resourceSnapshots: Object.fromEntries(
      GENERATED_RESOURCE_KEYS.map((key) => [
        key,
        resourceSnapshot(key, candidate[key].length),
      ]),
    ),
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

function manifestAddressedSnapshotDirectories(
  target: string,
  manifest: LoadableGeneratedManifest,
): Set<string> {
  return new Set(
    Object.values(manifest.resourceSnapshots)
      .filter((snapshot) => snapshot.resourcePath.includes("/snapshots/"))
      .map((snapshot) =>
        dirname(resourceFileInSnapshot(target, snapshot.resourcePath)),
      ),
  );
}

async function activeManifestMayAddressSnapshotDirectory(
  root: string,
  target: string,
  directory: string,
): Promise<boolean> {
  try {
    const active = await loadPreviousSnapshot(root, target);
    return (
      active !== undefined &&
      manifestAddressedSnapshotDirectories(target, active.manifest).has(
        resolve(directory),
      )
    );
  } catch {
    // If the active manifest cannot be re-read safely, preserve the immutable
    // candidate rather than risk deleting bytes it may address.
    return true;
  }
}

interface QuarantinedSnapshot {
  source: string;
  destination: string;
}

interface SnapshotQuarantine {
  directory: string;
  journalPath: string;
  entries: QuarantinedSnapshot[];
  committed: boolean;
  buildId: string;
  previousManifestIdentity: z.infer<typeof ManifestIdentitySchema> | null;
  candidateManifestIdentity: z.infer<typeof ManifestIdentitySchema>;
}

function manifestIdentity(
  target: string,
  manifest: LoadableGeneratedManifest,
): z.infer<typeof ManifestIdentitySchema> {
  const canonical = serializeDeterministically(manifest);
  return ManifestIdentitySchema.parse({
    canonicalSha256: createHash("sha256").update(canonical).digest("hex"),
    snapshotIds: [...manifestAddressedSnapshotDirectories(target, manifest)]
      .map((directory) => basename(directory))
      .sort(),
  });
}

async function writeSnapshotQuarantineJournal(
  root: string,
  quarantine: SnapshotQuarantine,
): Promise<void> {
  const temporaryPath = resolve(
    quarantine.directory,
    "snapshot-quarantine-journal.next.json",
  );
  const contents = serializeDeterministically({
    schemaVersion: "2.0.0",
    buildId: quarantine.buildId,
    previousManifestIdentity: quarantine.previousManifestIdentity,
    candidateManifestIdentity: quarantine.candidateManifestIdentity,
    committed: quarantine.committed,
    entries: quarantine.entries,
  });
  await assertPhysicalPath(root, temporaryPath);
  const handle = await open(temporaryPath, "w");
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  SnapshotQuarantineJournalSchema.parse(
    JSON.parse(await readFile(temporaryPath, "utf8")),
  );
  await safeRename(root, temporaryPath, quarantine.journalPath);
}

async function createSnapshotQuarantine(
  root: string,
  temporaryRoot: string,
  buildId: string,
  target: string,
  previous: PreviousSnapshot | undefined,
  candidateManifest: GeneratedManifest,
  invalidDirectories: readonly string[],
): Promise<SnapshotQuarantine> {
  const directory = resolve(
    temporaryRoot,
    `data-backup-revoked-snapshots-${buildId}`,
  );
  await safeMkdir(root, directory);
  const quarantine = {
    directory,
    journalPath: resolve(directory, "snapshot-quarantine-journal.json"),
    entries: invalidDirectories.map((source) => ({
      source,
      destination: resolve(directory, basename(source)),
    })),
    committed: false,
    buildId,
    previousManifestIdentity:
      previous === undefined
        ? null
        : manifestIdentity(target, previous.manifest),
    candidateManifestIdentity: manifestIdentity(target, candidateManifest),
  };
  await writeSnapshotQuarantineJournal(root, quarantine);
  return quarantine;
}

async function moveSnapshotsToQuarantine(
  root: string,
  quarantine: SnapshotQuarantine,
  directories: readonly string[],
  afterFirstJournalWrite?: () => void | Promise<void>,
): Promise<void> {
  for (const [index, source] of directories.entries()) {
    const entry = quarantine.entries.find(
      (candidate) => resolve(candidate.source) === resolve(source),
    );
    if (entry === undefined) {
      throw new Error(
        `Snapshot quarantine intent was not declared: ${source}.`,
      );
    }
    if (index === 0) await afterFirstJournalWrite?.();
    await safeRename(root, entry.source, entry.destination);
  }
}

async function restoreSnapshotQuarantine(
  root: string,
  quarantine: SnapshotQuarantine,
): Promise<void> {
  for (const entry of [...quarantine.entries].reverse()) {
    const sourceExists = await pathExists(entry.source);
    const destinationExists = await pathExists(entry.destination);
    if (sourceExists && destinationExists) continue;
    if (!sourceExists && destinationExists) {
      await safeRename(root, entry.destination, entry.source);
    } else if (!sourceExists) {
      throw new Error(
        `Cannot restore quarantined snapshot because both paths are absent: ${entry.source}.`,
      );
    }
  }
}

async function returnSnapshotsToQuarantine(
  root: string,
  quarantine: SnapshotQuarantine,
): Promise<void> {
  for (const entry of quarantine.entries) {
    const sourceExists = await pathExists(entry.source);
    const destinationExists = await pathExists(entry.destination);
    if (sourceExists && destinationExists) {
      await safeRename(
        root,
        entry.source,
        resolve(
          quarantine.directory,
          `${basename(entry.source)}-public-source-${randomUUID()}`,
        ),
      );
      continue;
    }
    if (sourceExists && !destinationExists) {
      await safeRename(root, entry.source, entry.destination);
    } else if (!destinationExists && !quarantine.committed) {
      throw new Error(
        `Cannot re-quarantine snapshot because both paths are absent: ${entry.source}.`,
      );
    }
  }
  await writeSnapshotQuarantineJournal(root, quarantine);
}

function manifestsMatch(left: unknown, right: unknown): boolean {
  return serializeDeterministically(left) === serializeDeterministically(right);
}

async function commitManifestWithSnapshotQuarantine(
  root: string,
  temporaryRoot: string,
  target: string,
  buildId: string,
  manifest: GeneratedManifest,
  previous: PreviousSnapshot | undefined,
  curatedMappings: ValidatedCuratedMappings,
  failureInjection: SnapshotFailureInjection | undefined,
): Promise<void> {
  let quarantine: SnapshotQuarantine | undefined;
  let manifestCommitted = false;
  const pilotSnapshotDistributionOptions =
    await completedPilotSnapshotDistributionOptions(root, target);
  try {
    const invalidDirectories = await findRevokedPublicSnapshotDirectories(
      root,
      curatedMappings,
      pilotSnapshotDistributionOptions,
    );
    const addressedDirectories =
      previous === undefined
        ? new Set<string>()
        : manifestAddressedSnapshotDirectories(target, previous.manifest);
    const activeInvalid = invalidDirectories.filter((directory) =>
      addressedDirectories.has(directory),
    );
    const inactiveInvalid = invalidDirectories.filter(
      (directory) => !addressedDirectories.has(directory),
    );

    if (invalidDirectories.length > 0) {
      quarantine = await createSnapshotQuarantine(
        root,
        temporaryRoot,
        buildId,
        target,
        previous,
        manifest,
        invalidDirectories,
      );
    }
    await failureInjection?.beforeRevokedSnapshotPrune?.();
    if (quarantine !== undefined) {
      await moveSnapshotsToQuarantine(root, quarantine, inactiveInvalid);
    }
    await failureInjection?.afterRevokedSnapshotPrune?.();
    await assertPublicSnapshotDistribution(root, curatedMappings, {
      ignoredDirectories: activeInvalid,
      ...pilotSnapshotDistributionOptions,
    });

    await commitManifest(
      root,
      target,
      buildId,
      manifest,
      failureInjection?.beforeManifestCommit,
    );
    manifestCommitted = true;

    if (
      failureInjection?.crashAfterManifestCommitBeforeActiveSnapshotRename !==
      undefined
    ) {
      try {
        await failureInjection.crashAfterManifestCommitBeforeActiveSnapshotRename();
      } catch (error) {
        throw new SnapshotCrashSimulationError(
          error instanceof Error ? error.message : String(error),
          { cause: error },
        );
      }
    }

    await failureInjection?.beforeActiveRevokedSnapshotQuarantine?.();
    if (quarantine !== undefined) {
      await moveSnapshotsToQuarantine(
        root,
        quarantine,
        activeInvalid,
        async () => {
          if (
            failureInjection?.crashAfterActiveJournalBeforeFirstSnapshotRename ===
            undefined
          ) {
            return;
          }
          try {
            await failureInjection.crashAfterActiveJournalBeforeFirstSnapshotRename();
          } catch (error) {
            throw new SnapshotCrashSimulationError(
              error instanceof Error ? error.message : String(error),
              { cause: error },
            );
          }
        },
      );
    }
    await failureInjection?.afterActiveRevokedSnapshotQuarantine?.();
    await assertPublicSnapshotDistribution(
      root,
      curatedMappings,
      pilotSnapshotDistributionOptions,
    );
    if (failureInjection?.crashAfterActiveSnapshotQuarantine !== undefined) {
      try {
        await failureInjection.crashAfterActiveSnapshotQuarantine();
      } catch (error) {
        throw new SnapshotCrashSimulationError(
          error instanceof Error ? error.message : String(error),
          { cause: error },
        );
      }
    }

    if (quarantine !== undefined) {
      quarantine.committed = true;
      await writeSnapshotQuarantineJournal(root, quarantine);
      try {
        await safeRemoveTemporaryDirectory(
          root,
          temporaryRoot,
          quarantine.directory,
        );
      } catch {
        // The committed journal lets the next build retry cleanup without
        // restoring revoked snapshots into the deployable public tree.
      }
    }
  } catch (error) {
    if (error instanceof SnapshotCrashSimulationError) throw error;
    try {
      if (quarantine !== undefined) {
        await restoreSnapshotQuarantine(root, quarantine);
      }
      if (manifestCommitted && previous !== undefined) {
        await commitManifest(
          root,
          target,
          `${buildId}-revoked-rollback`,
          previous.manifest,
          failureInjection?.beforeRollbackManifestCommit,
          LoadableGeneratedManifestSchema,
        );
      }
      if (
        quarantine !== undefined &&
        (await pathExists(quarantine.directory))
      ) {
        await safeRemoveTemporaryDirectory(
          root,
          temporaryRoot,
          quarantine.directory,
        );
      }
    } catch (rollbackError) {
      if (manifestCommitted && quarantine !== undefined) {
        try {
          const active = await loadPreviousSnapshot(root, target);
          if (
            active !== undefined &&
            manifestsMatch(active.manifest, manifest)
          ) {
            await returnSnapshotsToQuarantine(root, quarantine);
            await assertPublicSnapshotDistribution(
              root,
              curatedMappings,
              pilotSnapshotDistributionOptions,
            );
            quarantine.committed = true;
            await writeSnapshotQuarantineJournal(root, quarantine);
          }
        } catch (recoveryError) {
          throw new PublicSnapshotDistributionError(
            `Snapshot publication and rollback failed; preserving a loadable state also failed: ${error instanceof Error ? error.message : String(error)}; rollback: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}; recovery: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
            { cause: recoveryError },
          );
        }
      }
      throw new PublicSnapshotDistributionError(
        `Snapshot publication failed and rollback also failed: ${error instanceof Error ? error.message : String(error)}; rollback: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        { cause: rollbackError },
      );
    }
    if (quarantine === undefined && !manifestCommitted) {
      throw error;
    }
    throw new PublicSnapshotDistributionError(
      `Snapshot publication transaction failed; prior state restored: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
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
  if (previous.manifestFormat === "legacy") {
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
const HISTORICAL_PINNED_SNAPSHOT_IDS = [
  FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID,
  FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId,
] as const;
const FP_COVERAGE_PILOT_RESULTS_PATH = [
  "analysis",
  "fp_coverage_pilot_results.json",
] as const;
const FP_COVERAGE_EXPANSION_DIRECTORY = [
  "analysis",
  "fp_coverage_expansion",
] as const;
const FP_MARGINAL_ALIAS_REVIEW_PATH = [
  "analysis",
  "fp_marginal_alias_review.json",
] as const;
const FP_SPECIFIC_EVIDENCE_REVIEW_PATH = [
  "analysis",
  "fp_specific_evidence_review.json",
] as const;
const FP_OFFER_SNAPSHOT_REFERENCE_PATHS = [
  ["analysis", "fp_offer_alias_candidates.json"],
  ["analysis", "fp_mention_offer_queue.json"],
] as const;

const MarginalAliasSnapshotReferenceSchema = z
  .object({
    snapshotId: z.string().regex(IMMUTABLE_SNAPSHOT_ID_PATTERN),
  })
  .passthrough();

const ExpansionSnapshotReferenceSchema = z.discriminatedUnion("state", [
  z
    .object({
      state: z.enum(["completed", "deferred", "discarded"]),
      snapshotId: z.string().regex(IMMUTABLE_SNAPSHOT_ID_PATTERN),
    })
    .passthrough(),
  z
    .object({
      state: z.enum(["not_started", "in_progress"]),
      snapshotId: z.string().regex(IMMUTABLE_SNAPSHOT_ID_PATTERN).optional(),
    })
    .passthrough(),
]);

const PilotSnapshotReferenceSchema = z
  .object({
    state: z.string(),
    snapshotCoverage: z
      .object({
        status: z.literal("verified"),
        snapshotId: z.string().regex(IMMUTABLE_SNAPSHOT_ID_PATTERN),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const PilotSnapshotReferencesSchema = z
  .object({
    attempts: z.array(PilotSnapshotReferenceSchema),
  })
  .passthrough();

async function completedPilotSnapshotIds(root: string): Promise<Set<string>> {
  const path = resolve(root, ...FP_COVERAGE_PILOT_RESULTS_PATH);
  if (!(await pathExists(path))) return new Set();

  const results = PilotSnapshotReferencesSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
  return new Set(
    results.attempts.flatMap((attempt) =>
      attempt.state === "completed" &&
      attempt.snapshotCoverage?.status === "verified"
        ? [attempt.snapshotCoverage.snapshotId]
        : [],
    ),
  );
}

async function marginalAliasReviewSnapshotIds(
  root: string,
): Promise<Set<string>> {
  const path = resolve(root, ...FP_MARGINAL_ALIAS_REVIEW_PATH);
  if (!(await pathExists(path))) return new Set();

  const review = MarginalAliasSnapshotReferenceSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
  return new Set([review.snapshotId]);
}

async function specificEvidenceReviewSnapshotIds(
  root: string,
): Promise<Set<string>> {
  const path = resolve(root, ...FP_SPECIFIC_EVIDENCE_REVIEW_PATH);
  if (!(await pathExists(path))) return new Set();

  const review = MarginalAliasSnapshotReferenceSchema.parse(
    JSON.parse(await readFile(path, "utf8")),
  );
  return new Set([review.snapshotId]);
}

async function offerAnalysisSnapshotIds(root: string): Promise<Set<string>> {
  const snapshotIds = new Set<string>();
  for (const segments of FP_OFFER_SNAPSHOT_REFERENCE_PATHS) {
    const path = resolve(root, ...segments);
    if (!(await pathExists(path))) continue;
    const artifact = MarginalAliasSnapshotReferenceSchema.parse(
      JSON.parse(await readFile(path, "utf8")),
    );
    snapshotIds.add(artifact.snapshotId);
  }
  return snapshotIds;
}

async function terminalExpansionSnapshotIds(
  root: string,
): Promise<Set<string>> {
  const directory = resolve(root, ...FP_COVERAGE_EXPANSION_DIRECTORY);
  if (!(await pathExists(directory))) return new Set();
  await assertPhysicalPath(root, directory);

  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .toSorted((left, right) => compareCanonicalText(left.name, right.name));
  const snapshotIds = new Set<string>();

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    try {
      await assertPhysicalPath(root, path);
      const attempt = ExpansionSnapshotReferenceSchema.parse(
        JSON.parse(await readFile(path, "utf8")),
      );
      if (
        attempt.state === "completed" ||
        attempt.state === "deferred" ||
        attempt.state === "discarded"
      ) {
        snapshotIds.add(attempt.snapshotId);
      }
    } catch (error) {
      throw new Error(`Invalid expansion file ${entry.name}.`, {
        cause: error,
      });
    }
  }

  return snapshotIds;
}

async function completedPilotSnapshotDistributionOptions(
  root: string,
  target: string,
): Promise<{ historicalSnapshotDirectories: string[] }> {
  const snapshotsRoot = resolve(target, "snapshots");
  const retainedSnapshotIds = (await pathExists(snapshotsRoot))
    ? (await readdir(snapshotsRoot, { withFileTypes: true }))
        .filter(
          (entry) =>
            entry.isDirectory() &&
            IMMUTABLE_SNAPSHOT_ID_PATTERN.test(entry.name),
        )
        .map((entry) => entry.name)
    : [];
  const historicalSnapshotIds = new Set([
    ...(await completedPilotSnapshotIds(root)),
    ...(await terminalExpansionSnapshotIds(root)),
    ...(await marginalAliasReviewSnapshotIds(root)),
    ...(await specificEvidenceReviewSnapshotIds(root)),
    ...(await offerAnalysisSnapshotIds(root)),
    ...HISTORICAL_PINNED_SNAPSHOT_IDS,
    ...retainedSnapshotIds,
  ]);
  return {
    historicalSnapshotDirectories: [...historicalSnapshotIds]
      .toSorted(compareCanonicalText)
      .map((snapshotId) => resolve(target, "snapshots", snapshotId)),
  };
}

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
    ...(await completedPilotSnapshotIds(root)),
    ...(await terminalExpansionSnapshotIds(root)),
    ...(await marginalAliasReviewSnapshotIds(root)),
    ...(await specificEvidenceReviewSnapshotIds(root)),
    ...(await offerAnalysisSnapshotIds(root)),
    ...HISTORICAL_PINNED_SNAPSHOT_IDS,
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

/**
 * Returns a function that limits concurrent execution of async functions
 * to at most `limit` at a time. Queued functions are dispatched via an
 * internal pump that drains while active < limit. Each completed or
 * rejected call releases its slot and triggers the next pump cycle.
 */
function createConcurrencyLimiter(
  limit: number,
): <T>(fn: () => Promise<T>) => Promise<T> {
  type QueueItem = {
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  };
  const queue: QueueItem[] = [];
  let active = 0;

  function pump(): void {
    while (active < limit && queue.length > 0) {
      const item = queue.shift()!;
      active += 1;
      Promise.resolve(item.fn())
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          active -= 1;
          pump();
        });
    }
  }

  return function limitIngestion<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      pump();
    });
  };
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
    await recoverInterruptedSnapshotQuarantines(
      root,
      temporaryRoot,
      target,
      options.loadCuratedMappings,
    );
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
    const fetchIncomeBundle =
      options.fetchIncomeBundle ?? (() => loadEducabaseIncomeBundle());
    const fetchEcylCourseRecords =
      options.fetchEcylCourseRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.ecylCourses.recordsUrl,
          EcylCourseSourceRecordSchema,
        ));
    const fetchProfessionalCertificateRecords =
      options.fetchProfessionalCertificateRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.professionalCertificates.recordsUrl,
          ProfessionalCertificateSourceRecordSchema,
        ));
    const fetchPublicEmploymentCallRecords =
      options.fetchPublicEmploymentCallRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.publicEmploymentCalls.recordsUrl,
          PublicEmploymentCallSourceRecordSchema,
        ));
    const fetchRegionalContractRecords =
      options.fetchRegionalContractRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.regionalContracts.recordsUrl,
          RegionalContractSourceRecordSchema,
        ));
    const fetchMunicipalityRecords =
      options.fetchMunicipalityRecords ??
      (() =>
        fetchAllRecords(
          SOURCE_CONFIG.municipalities.recordsUrl,
          MunicipalitySourceRecordSchema,
        ));

    let committed = false;
    let staging: string | undefined;
    let immutableDestination: string | undefined;
    try {
      const limitIngestion = createConcurrencyLimiter(3);
      const [
        fetchedTrainingRecords,
        fetchedOfferRecords,
        incomeBundle,
        fetchedEcylCourseRecords,
        fetchedProfessionalCertificateRecords,
        fetchedPublicEmploymentCallRecords,
        fetchedRegionalContractRecords,
        fetchedMunicipalityRecords,
      ] = await Promise.all([
        limitIngestion(() => fetchTrainingRecords()),
        limitIngestion(() => fetchOfferRecords()),
        limitIngestion(() => fetchIncomeBundle()),
        limitIngestion(() => fetchEcylCourseRecords()),
        limitIngestion(() => fetchProfessionalCertificateRecords()),
        limitIngestion(() => fetchPublicEmploymentCallRecords()),
        limitIngestion(() => fetchRegionalContractRecords()),
        limitIngestion(() => fetchMunicipalityRecords()),
      ]);
      const trainingRecords = z
        .array(TrainingSourceRecordSchema)
        .parse(fetchedTrainingRecords);
      const offerRecords = z
        .array(OfferSourceRecordSchema)
        .parse(fetchedOfferRecords);
      const ecylCourseRecords = z
        .array(EcylCourseSourceRecordSchema)
        .parse(fetchedEcylCourseRecords);
      const professionalCertificateRecords = z
        .array(ProfessionalCertificateSourceRecordSchema)
        .parse(fetchedProfessionalCertificateRecords);
      const publicEmploymentCallRecords = z
        .array(PublicEmploymentCallSourceRecordSchema)
        .parse(fetchedPublicEmploymentCallRecords);
      const regionalContractRecords = z
        .array(RegionalContractSourceRecordSchema)
        .parse(fetchedRegionalContractRecords);
      const municipalityRecords = z
        .array(MunicipalitySourceRecordSchema)
        .parse(fetchedMunicipalityRecords);
      const outcomeIndicators = OutcomeIndicatorsResourceSchema.parse(
        normalizeIncomeOutcomes(incomeBundle.tables),
      );
      const normalizedPrograms = normalizeTraining(trainingRecords).programs;
      const professionalProfiles = ProfessionalProfilesResourceSchema.parse(
        await (
          options.loadProfessionalProfiles ??
          (async () =>
            JSON.parse(
              await readFile(
                resolve(root, "data", "curated", "professional-profiles.json"),
                "utf8",
              ),
            ) as unknown)
        )(normalizedPrograms),
      );
      assertCompleteProfessionalProfileCoverage(
        normalizedPrograms,
        professionalProfiles,
      );
      const curatedMappings = await (
        options.loadCuratedMappings ??
        ((programs) => loadCuratedMappingsFromDisk(root, programs))
      )(normalizedPrograms);
      const officialOccupations = OccupationsSchema.parse(
        await (
          options.loadOfficialOccupations ??
          (async () => {
            const path = resolve(
              root,
              "data",
              "curated",
              "official-occupations.json",
            );
            return (await pathExists(path))
              ? (JSON.parse(await readFile(path, "utf8")) as unknown)
              : loadApprovedMappings(curatedMappings).occupations;
          })
        )(),
      );
      const sourceHash = hashCanonicalSource({
        curatedMappings,
        officialOccupations,
        professionalProfiles,
        income: incomeBundle.artifacts.map((artifact) => ({
          format: artifact.format,
          sha256: artifact.sha256,
          tableId: artifact.tableId,
        })),
        offers: offerRecords,
        training: trainingRecords,
        ecylCourses: ecylCourseRecords,
        professionalCertificates: professionalCertificateRecords,
        publicEmploymentCalls: publicEmploymentCallRecords,
        regionalContracts: regionalContractRecords,
        municipalities: municipalityRecords,
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
        ecylCourseRecords,
        professionalCertificateRecords,
        publicEmploymentCallRecords,
        regionalContractRecords,
        municipalityRecords,
        incomeBundle,
        outcomeIndicators,
        curatedMappings,
        officialOccupations,
        professionalProfiles,
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
      await commitManifestWithSnapshotQuarantine(
        root,
        temporaryRoot,
        target,
        buildId,
        result.manifest,
        previous,
        curatedMappings,
        options.failureInjection,
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
        (await pathExists(immutableDestination)) &&
        !(await activeManifestMayAddressSnapshotDirectory(
          root,
          target,
          immutableDestination,
        ))
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
        if (error instanceof PublicSnapshotDistributionError) {
          throw error;
        }
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
