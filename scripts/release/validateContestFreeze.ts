import { createHash } from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { format as formatPrettier } from "prettier";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  assertCanonicalSepeCandidateResource,
  assertCandidateResourceSet,
  CANDIDATE_RESOURCE_KEYS,
  type CandidateResourceKey,
} from "../../data/schemas/candidateResourceAllowlist";
import type { TrainingProgram } from "../../data/schemas/generated";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import {
  validateCuratedMappings,
  type ValidatedCuratedMappings,
} from "../data/validateCuratedMappings";

const MANIFEST_KEYS = [
  "path",
  "sha256",
  "generatedAt",
  "snapshotId",
  "qualityStatus",
  "qualityCounts",
  "resourceSnapshots",
] as const;
const RESOURCE_SNAPSHOT_KEYS = [
  "resourcePath",
  "sha256",
  "recordCount",
] as const;
const COVERAGE_KEYS = [
  "distinctQualificationKeys",
  "distinctQualificationCount",
  "modalityKeys",
  "modalityKeyCount",
  "approvedRelationKeys",
  "approvedRelationCount",
  "approvedAliasKeys",
  "approvedAliasCount",
  "matchedProgramKeys",
  "matchedProgramCount",
  "zeroReviewedProgramKeys",
  "zeroReviewedProgramCount",
  "matchedRelationKeys",
  "matchedRelationCount",
  "zeroReviewedRelationKeys",
  "zeroReviewedRelationCount",
  "deferredPrograms",
  "deferredProgramCount",
] as const;
const OFFER_KEYS = [
  "matchedOfferIds",
  "matchedOfferCount",
  "marginalOfferDeltas",
] as const;
const DELTA_KEYS = ["unionOfferIds", "unionOfferCount"] as const;
const ATTEMPT_KEYS = [
  "completed",
  "deferred",
  "discarded",
  "terminal",
  "reserveUnattempted",
] as const;
const FREEZE_KEYS = [
  "schemaVersion",
  "freezeStatus",
  "sourceCommitSha",
  "manifest",
  "coverage",
  "offers",
  "attempts",
] as const;

const CANONICAL_MANIFEST_PATH = "public/data/v1/manifest.json";
const CANONICAL_SNAPSHOT_ID = "20260822085631889-7bbe69380f6d";
const CANONICAL_MANIFEST_SHA256 =
  "92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18";
export const CONTEST_FREEZE_SOURCE_COMMIT_SHA =
  "15cd959529c5c223adff02eda124863a320fe0bf";

export const EXPECTED_CONTEST_RESOURCE_COUNT = CANDIDATE_RESOURCE_KEYS.length;
export const EXPECTED_SEPE_RECORD_COUNT = 116;

/**
 * These paths define the immutable coverage/data boundary. Keep this list as
 * the single source for both dirty-write preflight and source-commit diff
 * verification.
 */
export const CONTEST_FREEZE_SOURCE_PATHS = [
  "config/candidate-resource-allowlist.json",
  "analysis/fp_coverage_expansion_results.json",
  "analysis/fp_one_word_publication_reviews.json",
  "data/catalogs",
  "data/curated",
  "data/schemas",
  "public/data",
  "scripts/analysis/validateFpOneWordPublicationReview.ts",
  "scripts/data/validateCuratedMappings.ts",
  "src/data",
  "src/domain",
  "src/features",
] as const;

type ResourceSnapshot = {
  resourcePath: string;
  sha256: string;
  recordCount: number;
};

type FreezeManifest = {
  path: string;
  sha256: string;
  generatedAt: string;
  snapshotId: string;
  qualityStatus: "passed";
  qualityCounts: Record<string, number>;
  resourceSnapshots: Record<CandidateResourceKey, ResourceSnapshot>;
};

export type ContestFreezeV2 = {
  schemaVersion: "2.0.0";
  freezeStatus: "frozen";
  sourceCommitSha: string;
  manifest: FreezeManifest;
  coverage: {
    distinctQualificationKeys: string[];
    distinctQualificationCount: number;
    modalityKeys: string[];
    modalityKeyCount: number;
    approvedRelationKeys: string[];
    approvedRelationCount: number;
    approvedAliasKeys: string[];
    approvedAliasCount: number;
    matchedProgramKeys: string[];
    matchedProgramCount: number;
    zeroReviewedProgramKeys: string[];
    zeroReviewedProgramCount: number;
    matchedRelationKeys: string[];
    matchedRelationCount: number;
    zeroReviewedRelationKeys: string[];
    zeroReviewedRelationCount: number;
    deferredPrograms: string[];
    deferredProgramCount: number;
  };
  offers: {
    matchedOfferIds: string[];
    matchedOfferCount: number;
    marginalOfferDeltas: { unionOfferIds: string[]; unionOfferCount: number };
  };
  attempts: {
    completed: number;
    deferred: number;
    discarded: number;
    terminal: number;
    reserveUnattempted: number;
  };
};

/** Compatibility name retained for renderer consumers; this is schema 2 only. */
export type ContestFreeze = ContestFreezeV2;

type ValidationOptions = { rootDir?: string };

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: unknown,
  allowed: readonly string[],
  label: string,
): Record<string, unknown> {
  const result = record(value, label);
  const unknown = Object.keys(result).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} has unknown field(s): ${unknown.join(", ")}`);
  }
  for (const key of allowed) {
    if (!(key in result)) throw new Error(`${label} is missing ${key}`);
  }
  return result;
}

function stringValue(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function integerValue(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
  const values = value as string[];
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must not contain duplicates`);
  }
  const sorted = [...values].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) {
    throw new Error(`${label} must be sorted`);
  }
  return values;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function assertResourceKeyOrder(keys: readonly string[], label: string): void {
  try {
    assertCandidateResourceSet(keys);
  } catch (error) {
    throw new Error(
      `${label} must match the candidate resource set: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  if (JSON.stringify(keys) !== JSON.stringify(CANDIDATE_RESOURCE_KEYS)) {
    throw new Error(`${label} must use canonical candidate resource order`);
  }
}

export function getDirtyContestFreezeSourcePaths(
  rootDir = process.cwd(),
): string[] {
  const status = execFileSync(
    "git",
    [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      ...CONTEST_FREEZE_SOURCE_PATHS,
    ],
    { cwd: path.resolve(rootDir), encoding: "utf8" },
  );
  return status
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Must run before reading or replacing coverage-freeze.json for --write.
 * The freeze describes a clean source boundary; a dirty source tree cannot
 * produce a trustworthy replacement artifact.
 */
export function assertContestFreezeWritePreflight(
  rootDir = process.cwd(),
): void {
  const dirty = getDirtyContestFreezeSourcePaths(rootDir);
  if (dirty.length > 0) {
    throw new Error(
      `Refusing coverage freeze --write while source paths are dirty: ${dirty.join("; ")}`,
    );
  }
}

export function parseContestFreezeWriteSourceCommit(
  arguments_: readonly string[],
): string {
  const inline = arguments_.find((argument) =>
    argument.startsWith("--source-commit="),
  );
  const index = arguments_.indexOf("--source-commit");
  const sourceCommitSha =
    inline?.slice("--source-commit=".length) ??
    (index >= 0 ? arguments_[index + 1] : undefined);
  if (sourceCommitSha === undefined) {
    throw new Error(
      "coverage freeze --write requires an explicit --source-commit S argument",
    );
  }
  if (!/^[a-f0-9]{40}$/u.test(sourceCommitSha)) {
    throw new Error("--source-commit must be a 40-character commit SHA");
  }
  return sourceCommitSha;
}

/** Retained as a narrow path utility for callers migrating old snapshots. */
export function migrateFreezeResourcePathToSnapshot(
  resourcePath: string,
  snapshotId: string,
): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(snapshotId)) {
    throw new Error("freeze snapshotId is unsafe");
  }
  const match = resourcePath.match(
    /^\/data\/v1\/snapshots\/[a-z0-9]+(?:-[a-z0-9]+)*\/([^/]+)$/u,
  );
  if (match?.[1] === undefined) {
    throw new Error("resourcePath does not identify an immutable snapshot");
  }
  return `/data/v1/snapshots/${snapshotId}/${match[1]}`;
}

function readJson(rootDir: string, relativePath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.resolve(rootDir, relativePath), "utf8"),
  ) as unknown;
}

function relativeResourcePath(resourcePath: string): string {
  if (!resourcePath.startsWith("/data/v1/")) {
    throw new Error(`resource path must address /data/v1/: ${resourcePath}`);
  }
  return path.posix.join("public", resourcePath.slice(1));
}

function assertResourcePath(value: string, label: string): void {
  if (
    !/^\/data\/v1\/snapshots\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9-]+\.json$/u.test(
      value,
    )
  ) {
    throw new Error(`${label} is not an immutable snapshot resource path`);
  }
}

function parseFreeze(value: unknown): ContestFreezeV2 {
  const raw = record(value, "coverage freeze");
  if (raw.schemaVersion === "1.0.0") {
    throw new Error("coverage freeze schema 1.0.0 must be rebaked as 2.0.0");
  }
  if (raw.schemaVersion !== "2.0.0") {
    throw new Error("coverage freeze schemaVersion must be 2.0.0");
  }
  const root = exactKeys(raw, FREEZE_KEYS, "coverage freeze");
  if (root.freezeStatus !== "frozen") {
    throw new Error("coverage freeze must have freezeStatus=frozen");
  }
  const sourceCommitSha = stringValue(root.sourceCommitSha, "sourceCommitSha");
  if (!/^[a-f0-9]{40}$/u.test(sourceCommitSha)) {
    throw new Error("sourceCommitSha must be a 40-character commit SHA");
  }

  const manifest = exactKeys(root.manifest, MANIFEST_KEYS, "manifest");
  const resourceSnapshotRecord = record(
    manifest.resourceSnapshots,
    "manifest.resourceSnapshots",
  );
  assertResourceKeyOrder(
    Object.keys(resourceSnapshotRecord),
    "manifest.resourceSnapshots candidate resource set",
  );
  const resourceSnapshotEntries = Object.fromEntries(
    CANDIDATE_RESOURCE_KEYS.map((key) => {
      const snapshot = exactKeys(
        resourceSnapshotRecord[key],
        RESOURCE_SNAPSHOT_KEYS,
        `manifest.resourceSnapshots.${key}`,
      );
      const resourcePath = stringValue(
        snapshot.resourcePath,
        `manifest.resourceSnapshots.${key}.resourcePath`,
      );
      assertResourcePath(
        resourcePath,
        `manifest.resourceSnapshots.${key}.resourcePath`,
      );
      const sha256 = stringValue(
        snapshot.sha256,
        `manifest.resourceSnapshots.${key}.sha256`,
      );
      if (!/^[a-f0-9]{64}$/u.test(sha256)) {
        throw new Error(`invalid resource hash for ${key}`);
      }
      return [
        key,
        {
          resourcePath,
          sha256,
          recordCount: integerValue(
            snapshot.recordCount,
            `manifest.resourceSnapshots.${key}.recordCount`,
          ),
        },
      ];
    }),
  ) as ContestFreezeV2["manifest"]["resourceSnapshots"];

  const qualityCounts = record(
    manifest.qualityCounts,
    "manifest.qualityCounts",
  );
  const parsedQualityCounts = Object.fromEntries(
    Object.entries(qualityCounts).map(([key, value]) => [
      key,
      integerValue(value, `manifest.qualityCounts.${key}`),
    ]),
  );
  const snapshotIds = CANDIDATE_RESOURCE_KEYS.map(
    (key) =>
      resourceSnapshotEntries[key].resourcePath.match(
        /\/snapshots\/([a-z0-9]+(?:-[a-z0-9-]*[a-z0-9])?)\//u,
      )?.[1],
  );
  if (snapshotIds.some((value) => value === undefined)) {
    throw new Error("every resource must have a snapshot ID");
  }
  const snapshotId = stringValue(manifest.snapshotId, "manifest.snapshotId");
  if (new Set(snapshotIds).size !== 1 || snapshotIds[0] !== snapshotId) {
    throw new Error("manifest snapshotId must address every resource");
  }

  const parsedManifest: FreezeManifest = {
    path: stringValue(manifest.path, "manifest.path"),
    sha256: stringValue(manifest.sha256, "manifest.sha256"),
    generatedAt: stringValue(manifest.generatedAt, "manifest.generatedAt"),
    snapshotId,
    qualityStatus:
      manifest.qualityStatus === "passed"
        ? "passed"
        : (() => {
            throw new Error("manifest qualityStatus must be passed");
          })(),
    qualityCounts: parsedQualityCounts,
    resourceSnapshots: resourceSnapshotEntries,
  };

  const coverage = exactKeys(root.coverage, COVERAGE_KEYS, "coverage");
  const parsedCoverage: ContestFreezeV2["coverage"] = {
    distinctQualificationKeys: stringArray(
      coverage.distinctQualificationKeys,
      "coverage.distinctQualificationKeys",
    ),
    distinctQualificationCount: integerValue(
      coverage.distinctQualificationCount,
      "coverage.distinctQualificationCount",
    ),
    modalityKeys: stringArray(coverage.modalityKeys, "coverage.modalityKeys"),
    modalityKeyCount: integerValue(
      coverage.modalityKeyCount,
      "coverage.modalityKeyCount",
    ),
    approvedRelationKeys: stringArray(
      coverage.approvedRelationKeys,
      "coverage.approvedRelationKeys",
    ),
    approvedRelationCount: integerValue(
      coverage.approvedRelationCount,
      "coverage.approvedRelationCount",
    ),
    approvedAliasKeys: stringArray(
      coverage.approvedAliasKeys,
      "coverage.approvedAliasKeys",
    ),
    approvedAliasCount: integerValue(
      coverage.approvedAliasCount,
      "coverage.approvedAliasCount",
    ),
    matchedProgramKeys: stringArray(
      coverage.matchedProgramKeys,
      "coverage.matchedProgramKeys",
    ),
    matchedProgramCount: integerValue(
      coverage.matchedProgramCount,
      "coverage.matchedProgramCount",
    ),
    zeroReviewedProgramKeys: stringArray(
      coverage.zeroReviewedProgramKeys,
      "coverage.zeroReviewedProgramKeys",
    ),
    zeroReviewedProgramCount: integerValue(
      coverage.zeroReviewedProgramCount,
      "coverage.zeroReviewedProgramCount",
    ),
    matchedRelationKeys: stringArray(
      coverage.matchedRelationKeys,
      "coverage.matchedRelationKeys",
    ),
    matchedRelationCount: integerValue(
      coverage.matchedRelationCount,
      "coverage.matchedRelationCount",
    ),
    zeroReviewedRelationKeys: stringArray(
      coverage.zeroReviewedRelationKeys,
      "coverage.zeroReviewedRelationKeys",
    ),
    zeroReviewedRelationCount: integerValue(
      coverage.zeroReviewedRelationCount,
      "coverage.zeroReviewedRelationCount",
    ),
    deferredPrograms: stringArray(
      coverage.deferredPrograms,
      "coverage.deferredPrograms",
    ),
    deferredProgramCount: integerValue(
      coverage.deferredProgramCount,
      "coverage.deferredProgramCount",
    ),
  };

  const offers = exactKeys(root.offers, OFFER_KEYS, "offers");
  const marginalOfferDeltas = exactKeys(
    offers.marginalOfferDeltas,
    DELTA_KEYS,
    "offers.marginalOfferDeltas",
  );
  const parsedOffers: ContestFreezeV2["offers"] = {
    matchedOfferIds: stringArray(
      offers.matchedOfferIds,
      "offers.matchedOfferIds",
    ),
    matchedOfferCount: integerValue(
      offers.matchedOfferCount,
      "offers.matchedOfferCount",
    ),
    marginalOfferDeltas: {
      unionOfferIds: stringArray(
        marginalOfferDeltas.unionOfferIds,
        "offers.marginalOfferDeltas.unionOfferIds",
      ),
      unionOfferCount: integerValue(
        marginalOfferDeltas.unionOfferCount,
        "offers.marginalOfferDeltas.unionOfferCount",
      ),
    },
  };

  const attempts = exactKeys(root.attempts, ATTEMPT_KEYS, "attempts");
  const parsedAttempts = Object.fromEntries(
    ATTEMPT_KEYS.map((key) => [
      key,
      integerValue(attempts[key], `attempts.${key}`),
    ]),
  ) as ContestFreezeV2["attempts"];

  return {
    schemaVersion: "2.0.0",
    freezeStatus: "frozen",
    sourceCommitSha,
    manifest: parsedManifest,
    coverage: parsedCoverage,
    offers: parsedOffers,
    attempts: parsedAttempts,
  };
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} does not match recomputation`);
  }
}

function readCurrentManifest(rootDir: string): {
  text: string;
  manifest: FreezeManifest;
} {
  const text = fs.readFileSync(
    path.resolve(rootDir, CANONICAL_MANIFEST_PATH),
    "utf8",
  );
  const value = record(JSON.parse(text) as unknown, "public manifest");
  if (value.schemaVersion !== "1.0.0") {
    throw new Error("public manifest schemaVersion must be 1.0.0");
  }
  if (value.qualityStatus !== "passed") {
    throw new Error("public manifest qualityStatus must be passed");
  }
  const resourceSnapshotRecord = record(
    value.resourceSnapshots,
    "public manifest.resourceSnapshots",
  );
  assertResourceKeyOrder(
    Object.keys(resourceSnapshotRecord),
    "public manifest.resourceSnapshots candidate resource set",
  );
  const parsedSnapshots = Object.fromEntries(
    CANDIDATE_RESOURCE_KEYS.map((key) => {
      const snapshot = record(
        resourceSnapshotRecord[key],
        `public manifest.resourceSnapshots.${key}`,
      );
      const resourcePath = stringValue(
        snapshot.resourcePath,
        `public manifest.resourceSnapshots.${key}.resourcePath`,
      );
      assertResourcePath(
        resourcePath,
        `public manifest.resourceSnapshots.${key}.resourcePath`,
      );
      const sha256 = stringValue(
        snapshot.sha256,
        `public manifest.resourceSnapshots.${key}.sha256`,
      );
      if (!/^[a-f0-9]{64}$/u.test(sha256)) {
        throw new Error(`public manifest resource hash is invalid for ${key}`);
      }
      return [
        key,
        {
          resourcePath,
          sha256,
          recordCount: integerValue(
            snapshot.recordCount,
            `public manifest.resourceSnapshots.${key}.recordCount`,
          ),
        },
      ];
    }),
  ) as FreezeManifest["resourceSnapshots"];
  const snapshotIds = CANDIDATE_RESOURCE_KEYS.map(
    (key) =>
      parsedSnapshots[key].resourcePath.match(
        /\/snapshots\/([a-z0-9]+(?:-[a-z0-9-]*[a-z0-9])?)\//u,
      )?.[1],
  );
  if (snapshotIds.some((value) => value === undefined)) {
    throw new Error("public manifest resources must have a snapshot ID");
  }
  if (new Set(snapshotIds).size !== 1) {
    throw new Error("public manifest resources must share one snapshot ID");
  }
  const snapshotId = snapshotIds[0];
  if (snapshotId !== CANONICAL_SNAPSHOT_ID) {
    throw new Error(
      `public manifest snapshot must be ${CANONICAL_SNAPSHOT_ID}; got ${snapshotId}`,
    );
  }
  const qualityReport = record(
    value.qualityReport,
    "public manifest.qualityReport",
  );
  const qualityCounts = record(
    qualityReport.counts,
    "public manifest.qualityReport.counts",
  );
  const parsedQualityCounts = Object.fromEntries(
    Object.entries(qualityCounts).map(([key, count]) => [
      key,
      integerValue(count, `public manifest.qualityReport.counts.${key}`),
    ]),
  );
  const manifestSha256 = hashText(text);
  if (manifestSha256 !== CANONICAL_MANIFEST_SHA256) {
    throw new Error(
      `public manifest SHA-256 must be ${CANONICAL_MANIFEST_SHA256}; got ${manifestSha256}`,
    );
  }
  return {
    text,
    manifest: {
      path: CANONICAL_MANIFEST_PATH,
      sha256: manifestSha256,
      generatedAt: stringValue(
        value.generatedAt,
        "public manifest.generatedAt",
      ),
      snapshotId: stringValue(snapshotId, "public manifest.snapshotId"),
      qualityStatus: "passed",
      qualityCounts: parsedQualityCounts,
      resourceSnapshots: parsedSnapshots,
    },
  };
}

function readResourceSnapshot(
  rootDir: string,
  manifest: FreezeManifest,
  key: CandidateResourceKey,
): { value: unknown; text: string; recordCount: number } {
  const specification = manifest.resourceSnapshots[key];
  const text = fs.readFileSync(
    path.resolve(rootDir, relativeResourcePath(specification.resourcePath)),
    "utf8",
  );
  const value = JSON.parse(text) as unknown;
  const recordCount =
    key === "sepeOccupationMarket"
      ? assertCanonicalSepeCandidateResource(value).records.length
      : Array.isArray(value)
        ? value.length
        : (() => {
            throw new Error(`public resource ${key} must be a JSON array`);
          })();
  const actualHash = hashText(text);
  if (actualHash !== specification.sha256) {
    throw new Error(
      `public resource ${key} hash does not match public manifest.sha256`,
    );
  }
  if (recordCount !== specification.recordCount) {
    throw new Error(
      `public resource ${key} recordCount does not match public manifest`,
    );
  }
  return { value, text, recordCount };
}

function recomputeFreeze(
  rootDir: string,
  freeze: ContestFreezeV2,
): ContestFreezeV2 {
  const current = readCurrentManifest(rootDir);
  const resources = new Map<CandidateResourceKey, unknown>();
  for (const key of CANDIDATE_RESOURCE_KEYS) {
    resources.set(
      key,
      readResourceSnapshot(rootDir, current.manifest, key).value,
    );
  }
  const programs = resources.get("programs") as TrainingProgram[];
  const curated = validateCuratedMappings(
    {
      programs,
      occupations: readJson(
        rootDir,
        "data/curated/occupations.json",
      ) as unknown[],
      aliases: readJson(
        rootDir,
        "data/curated/occupation-aliases.json",
      ) as unknown[],
      links: readJson(
        rootDir,
        "data/curated/training-occupation-links.json",
      ) as unknown[],
    },
    { rootDirectory: rootDir },
  );
  const expansion = record(
    readJson(rootDir, "analysis/fp_coverage_expansion_results.json"),
    "expansion results",
  );
  const approvedRelationKeys = sortedUnique(
    curated.links
      .filter((link) => link.reviewStatus === "approved")
      .map((link) => `${link.trainingProgramKey}|${link.occupationId}`),
  );
  const approvedAliasKeys = sortedUnique(
    curated.aliases
      .filter((alias) => alias.reviewStatus === "approved")
      .map((alias) => `${alias.alias}|${alias.occupationId}`),
  );
  const modalityKeys = sortedUnique(
    curated.links
      .filter((link) => link.reviewStatus === "approved")
      .map((link) => link.trainingProgramKey),
  );
  const programsByKey = new Map(
    programs.map((program) => [program.programKey, program]),
  );
  const distinctQualificationKeys = sortedUnique(
    modalityKeys.map((programKey) => {
      const program = programsByKey.get(programKey);
      if (program === undefined)
        throw new Error(`Reviewed relation references unknown ${programKey}`);
      if (programKey.endsWith("D")) {
        const possibleBaseKey = programKey.slice(0, -1);
        const possibleBase = programsByKey.get(possibleBaseKey);
        if (
          possibleBase !== undefined &&
          possibleBase.familyCode === program.familyCode &&
          possibleBase.level === program.level &&
          program.programTitle.replace(/\s*\(distancia\)\s*$/iu, "") ===
            possibleBase.programTitle
        ) {
          return `qualification:${possibleBaseKey}`;
        }
      }
      return `qualification:${programKey}`;
    }),
  );

  const data = {
    programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations: resources.get(
      "occupations",
    ) as ValidatedCuratedMappings["occupations"],
    aliases: resources.get(
      "occupationAliases",
    ) as ValidatedCuratedMappings["aliases"],
    links: resources.get(
      "trainingOccupationLinks",
    ) as ValidatedCuratedMappings["links"],
    offers: resources.get("jobOffers") as never[],
    publishedRequirements: resources.get("publishedRequirements") as never[],
    humanOverrides: [],
  };
  const matchedOfferIdsSet = new Set<string>();
  const matchedRelationKeysSet = new Set<string>();
  const matchedProgramKeys: string[] = [];
  for (const program of programs) {
    const matches = matchOffersForProgram(program.programKey, data);
    if (matches.length === 0) continue;
    matchedProgramKeys.push(program.programKey);
    for (const match of matches) {
      matchedOfferIdsSet.add(match.offerId);
      matchedRelationKeysSet.add(`${program.programKey}|${match.occupationId}`);
    }
  }
  const matchedOfferIds = sortedUnique([...matchedOfferIdsSet]);
  const matchedRelationKeys = sortedUnique([...matchedRelationKeysSet]);
  const zeroReviewedRelationKeys = approvedRelationKeys.filter(
    (key) => !matchedRelationKeysSet.has(key),
  );
  const reviewedProgramKeys = sortedUnique(
    approvedRelationKeys.map((key) => key.split("|", 1)[0]),
  );
  const matchedProgramKeySet = new Set(matchedProgramKeys);
  const zeroReviewedProgramKeys = reviewedProgramKeys.filter(
    (key) => !matchedProgramKeySet.has(key),
  );
  const candidates = expansion.candidates;
  if (!Array.isArray(candidates))
    throw new Error("expansion candidates must be an array");
  const deferredPrograms = sortedUnique(
    candidates
      .filter(
        (candidate) =>
          record(candidate, "expansion candidate").state === "deferred",
      )
      .map((candidate) =>
        stringValue(
          record(candidate, "expansion candidate").programKey,
          "candidate.programKey",
        ),
      ),
  );
  const expansionCounts = record(expansion.counts, "expansion counts");
  const offerDeltas = record(expansion.offerDeltas, "expansion offerDeltas");
  const unionOfferIds = stringArray(
    offerDeltas.union,
    "expansion offerDeltas.union",
  );

  return {
    schemaVersion: "2.0.0",
    freezeStatus: "frozen",
    sourceCommitSha: freeze.sourceCommitSha,
    manifest: current.manifest,
    coverage: {
      distinctQualificationKeys,
      distinctQualificationCount: distinctQualificationKeys.length,
      modalityKeys,
      modalityKeyCount: modalityKeys.length,
      approvedRelationKeys,
      approvedRelationCount: approvedRelationKeys.length,
      approvedAliasKeys,
      approvedAliasCount: approvedAliasKeys.length,
      matchedProgramKeys: sortedUnique(matchedProgramKeys),
      matchedProgramCount: matchedProgramKeys.length,
      zeroReviewedProgramKeys,
      zeroReviewedProgramCount: zeroReviewedProgramKeys.length,
      matchedRelationKeys,
      matchedRelationCount: matchedRelationKeys.length,
      zeroReviewedRelationKeys,
      zeroReviewedRelationCount: zeroReviewedRelationKeys.length,
      deferredPrograms,
      deferredProgramCount: deferredPrograms.length,
    },
    offers: {
      matchedOfferIds,
      matchedOfferCount: matchedOfferIds.length,
      marginalOfferDeltas: {
        unionOfferIds: unionOfferIds.toSorted(),
        unionOfferCount: unionOfferIds.length,
      },
    },
    attempts: {
      completed: integerValue(
        expansionCounts.completed,
        "expansion counts.completed",
      ),
      deferred: integerValue(
        expansionCounts.deferred,
        "expansion counts.deferred",
      ),
      discarded: integerValue(
        expansionCounts.discarded,
        "expansion counts.discarded",
      ),
      terminal: integerValue(
        expansionCounts.terminal,
        "expansion counts.terminal",
      ),
      reserveUnattempted: integerValue(
        expansionCounts.reserveUnattempted,
        "expansion counts.reserveUnattempted",
      ),
    },
  };
}

export function recomputeContestFreeze(
  rootDir: string,
  freeze: ContestFreeze,
): ContestFreezeV2 {
  return recomputeFreeze(path.resolve(rootDir), freeze);
}

export function createFreshContestFreeze(
  rootDir: string,
  sourceCommitSha: string,
): ContestFreezeV2 {
  const current = readCurrentManifest(path.resolve(rootDir));
  return recomputeFreeze(path.resolve(rootDir), {
    schemaVersion: "2.0.0",
    freezeStatus: "frozen",
    sourceCommitSha,
    manifest: current.manifest,
    coverage: {
      distinctQualificationKeys: [],
      distinctQualificationCount: 0,
      modalityKeys: [],
      modalityKeyCount: 0,
      approvedRelationKeys: [],
      approvedRelationCount: 0,
      approvedAliasKeys: [],
      approvedAliasCount: 0,
      matchedProgramKeys: [],
      matchedProgramCount: 0,
      zeroReviewedProgramKeys: [],
      zeroReviewedProgramCount: 0,
      matchedRelationKeys: [],
      matchedRelationCount: 0,
      zeroReviewedRelationKeys: [],
      zeroReviewedRelationCount: 0,
      deferredPrograms: [],
      deferredProgramCount: 0,
    },
    offers: {
      matchedOfferIds: [],
      matchedOfferCount: 0,
      marginalOfferDeltas: { unionOfferIds: [], unionOfferCount: 0 },
    },
    attempts: {
      completed: 0,
      deferred: 0,
      discarded: 0,
      terminal: 0,
      reserveUnattempted: 0,
    },
  });
}

function assertSourceCommitBoundary(
  rootDir: string,
  sourceCommitSha: string,
): void {
  if (sourceCommitSha !== CONTEST_FREEZE_SOURCE_COMMIT_SHA) {
    throw new Error(
      `sourceCommitSha must equal the approved coverage boundary ${CONTEST_FREEZE_SOURCE_COMMIT_SHA}; legacy coverage boundary ${sourceCommitSha} is rejected`,
    );
  }
  try {
    execFileSync(
      "git",
      ["rev-parse", "--verify", `${sourceCommitSha}^{commit}`],
      { cwd: rootDir, stdio: "pipe" },
    );
    execFileSync(
      "git",
      ["merge-base", "--is-ancestor", sourceCommitSha, "HEAD"],
      { cwd: rootDir, stdio: "pipe" },
    );
    execFileSync(
      "git",
      [
        "diff",
        "--quiet",
        sourceCommitSha,
        "--",
        ...CONTEST_FREEZE_SOURCE_PATHS,
      ],
      { cwd: rootDir, stdio: "pipe" },
    );
  } catch {
    throw new Error(
      "sourceCommitSha cannot prove an ancestor boundary without source/public data mutations",
    );
  }
}

function assertManifestIdentity(
  actual: FreezeManifest,
  expected: FreezeManifest,
): void {
  if (actual.path !== expected.path) {
    throw new Error("manifest.path does not match the current public manifest");
  }
  if (actual.sha256 !== expected.sha256) {
    throw new Error(
      "manifest.sha256 does not match the current public manifest",
    );
  }
  if (actual.generatedAt !== expected.generatedAt) {
    throw new Error(
      "manifest.generatedAt does not match the current public manifest",
    );
  }
  if (actual.snapshotId !== expected.snapshotId) {
    throw new Error(
      "manifest.snapshotId does not match the current public manifest",
    );
  }
  if (
    JSON.stringify(actual.qualityCounts) !==
    JSON.stringify(expected.qualityCounts)
  ) {
    throw new Error(
      "manifest.qualityCounts does not match the current public manifest",
    );
  }
  for (const key of CANDIDATE_RESOURCE_KEYS) {
    const actualResource = actual.resourceSnapshots[key];
    const expectedResource = expected.resourceSnapshots[key];
    if (actualResource.resourcePath !== expectedResource.resourcePath) {
      throw new Error(
        `manifest.resourceSnapshots.${key}.resourcePath does not match the current public manifest`,
      );
    }
    if (actualResource.sha256 !== expectedResource.sha256) {
      throw new Error(
        `manifest.resourceSnapshots.${key}.sha256 does not match the current public manifest`,
      );
    }
    if (actualResource.recordCount !== expectedResource.recordCount) {
      throw new Error(
        `manifest.resourceSnapshots.${key}.recordCount does not match the current public manifest`,
      );
    }
  }
}

export function validateContestFreeze(
  value: unknown,
  options: ValidationOptions = {},
): { valid: true; errors: [] } {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const freeze = parseFreeze(value);
  assertSourceCommitBoundary(rootDir, freeze.sourceCommitSha);
  const recomputed = recomputeFreeze(rootDir, freeze);
  assertManifestIdentity(freeze.manifest, recomputed.manifest);
  assertEqual(recomputed, freeze, "coverage freeze");
  return { valid: true, errors: [] };
}

export function loadAndValidateContestFreeze(
  rootDir = process.cwd(),
): ContestFreeze {
  const freeze = parseFreeze(
    readJson(rootDir, "docs/contest/coverage-freeze.json"),
  );
  validateContestFreeze(freeze, { rootDir });
  return freeze;
}

function assertLegacyFreezeMarker(value: unknown): void {
  const root = record(value, "coverage freeze");
  if (root.schemaVersion !== "1.0.0" && root.schemaVersion !== "2.0.0") {
    throw new Error(
      "coverage freeze --write requires a checked-in schema 1.0.0 legacy file or schema 2.0.0 file",
    );
  }
}

export async function writeContestFreeze(
  rootDir: string,
  sourceCommitSha: string,
  freezePath = path.resolve(rootDir, "docs/contest/coverage-freeze.json"),
): Promise<void> {
  assertContestFreezeWritePreflight(rootDir);
  // This private marker read intentionally does not call the schema-2 parser;
  // legacy deployment, paths, hashes, counts and derived values are discarded.
  assertLegacyFreezeMarker(
    JSON.parse(fs.readFileSync(freezePath, "utf8")) as unknown,
  );
  const fresh = createFreshContestFreeze(rootDir, sourceCommitSha);
  const candidate = await formatPrettier(JSON.stringify(fresh), {
    parser: "json",
  });
  validateContestFreeze(fresh, { rootDir });
  fs.writeFileSync(freezePath, candidate);
}

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  const rootDir = process.cwd();
  if (process.argv.includes("--write")) {
    const sourceCommitSha = parseContestFreezeWriteSourceCommit(process.argv);
    await writeContestFreeze(rootDir, sourceCommitSha);
    console.info(`Contest coverage freeze written from ${sourceCommitSha}.`);
  } else {
    loadAndValidateContestFreeze(rootDir);
    console.info(
      "Contest coverage freeze matches manifest, reports, and public data.",
    );
  }
}
