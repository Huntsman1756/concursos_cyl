import { createHash } from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { format as formatPrettier } from "prettier";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import type { TrainingProgram } from "../../data/schemas/generated";
import { adaptSepeOccupationMarketResource } from "../../data/schemas/sepeOccupationMarket";
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
const RESOURCE_KEYS = [
  "centers",
  "derivedFpOccupationGraph",
  "ecylCourses",
  "educationCenterDirectory",
  "jobOffers",
  "mappingCoverage",
  "municipalities",
  "officialOccupations",
  "occupationAliases",
  "occupations",
  "openDataCatalog",
  "outcomeIndicators",
  "professionalCertificates",
  "professionalProfiles",
  "programs",
  "provincialContracts",
  "publicEmploymentCalls",
  "publishedRequirements",
  "sepeOccupationMarket",
  "trainingOccupationLinks",
  "trainingOfferings",
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
const DEPLOYMENT_KEYS = ["expectedRootUrl", "status"] as const;
const FREEZE_KEYS = [
  "schemaVersion",
  "freezeStatus",
  "sourceCommitSha",
  "manifest",
  "coverage",
  "offers",
  "attempts",
  "deployment",
] as const;
const EXPECTED_ROOT_URL = "https://salida-cyl.157-90-22-40.sslip.io/";
export const EXPECTED_CONTEST_RESOURCE_COUNT = 21;
export const EXPECTED_SEPE_RECORD_COUNT = 116;
export const CONTEST_FREEZE_SOURCE_PATHS = [
  "analysis/fp_coverage_expansion_results.json",
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

type ResourceKey = (typeof RESOURCE_KEYS)[number];

export type ContestFreeze = {
  schemaVersion: "1.0.0";
  freezeStatus: "frozen";
  sourceCommitSha: string;
  manifest: {
    path: string;
    sha256: string;
    generatedAt: string;
    snapshotId: string;
    qualityStatus: "passed";
    qualityCounts: Record<string, number>;
    resourceSnapshots: Record<
      ResourceKey,
      { resourcePath: string; sha256: string; recordCount: number }
    >;
  };
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
  deployment: {
    expectedRootUrl: string;
    status: "pending" | "verified";
  };
};

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

function parseFreeze(value: unknown): ContestFreeze {
  const root = exactKeys(value, FREEZE_KEYS, "coverage freeze");
  if (root.schemaVersion !== "1.0.0") {
    throw new Error("coverage freeze schemaVersion must be 1.0.0");
  }
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
  if (
    Object.keys(resourceSnapshotRecord).length !==
    EXPECTED_CONTEST_RESOURCE_COUNT
  ) {
    throw new Error(
      `manifest.resourceSnapshots must contain exactly ${EXPECTED_CONTEST_RESOURCE_COUNT} resources`,
    );
  }
  const resourceSnapshots = exactKeys(
    resourceSnapshotRecord,
    RESOURCE_KEYS,
    "manifest.resourceSnapshots",
  );
  const resourceSnapshotEntries = Object.fromEntries(
    RESOURCE_KEYS.map((key) => {
      const snapshot = exactKeys(
        resourceSnapshots[key],
        RESOURCE_SNAPSHOT_KEYS,
        `manifest.resourceSnapshots.${key}`,
      );
      const resourcePath = stringValue(
        snapshot.resourcePath,
        `manifest.resourceSnapshots.${key}.resourcePath`,
      );
      if (
        !/^\/data\/v1\/snapshots\/[a-z0-9-]+\/[a-z-]+\.json$/u.test(
          resourcePath,
        )
      ) {
        throw new Error(`invalid resource path for ${key}`);
      }
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
  ) as ContestFreeze["manifest"]["resourceSnapshots"];
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
  const snapshotIds = RESOURCE_KEYS.map(
    (key) =>
      resourceSnapshotEntries[key].resourcePath.match(
        /\/snapshots\/([a-z0-9-]+)\//u,
      )?.[1],
  );
  if (snapshotIds.some((value) => value === undefined)) {
    throw new Error("every resource must have a snapshot ID");
  }
  if (
    new Set(snapshotIds).size !== 1 ||
    snapshotIds[0] !== manifest.snapshotId
  ) {
    throw new Error("manifest snapshotId must address every resource");
  }

  const parsedManifest: ContestFreeze["manifest"] = {
    path: stringValue(manifest.path, "manifest.path"),
    sha256: stringValue(manifest.sha256, "manifest.sha256"),
    generatedAt: stringValue(manifest.generatedAt, "manifest.generatedAt"),
    snapshotId: stringValue(manifest.snapshotId, "manifest.snapshotId"),
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
  const parsedCoverage = {
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
  } satisfies ContestFreeze["coverage"];

  const offers = exactKeys(root.offers, OFFER_KEYS, "offers");
  const marginalOfferDeltas = exactKeys(
    offers.marginalOfferDeltas,
    DELTA_KEYS,
    "offers.marginalOfferDeltas",
  );
  const parsedOffers: ContestFreeze["offers"] = {
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
  ) as ContestFreeze["attempts"];

  const deployment = exactKeys(root.deployment, DEPLOYMENT_KEYS, "deployment");
  const deploymentStatus = deployment.status;
  if (deploymentStatus !== "pending" && deploymentStatus !== "verified") {
    throw new Error("deployment.status must be pending or verified");
  }

  return {
    schemaVersion: "1.0.0",
    freezeStatus: "frozen",
    sourceCommitSha,
    manifest: parsedManifest,
    coverage: parsedCoverage,
    offers: parsedOffers,
    attempts: parsedAttempts,
    deployment: {
      expectedRootUrl: stringValue(
        deployment.expectedRootUrl,
        "deployment.expectedRootUrl",
      ),
      status: deploymentStatus,
    },
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

function readResource<T>(
  rootDir: string,
  manifest: ContestFreeze["manifest"],
  key: ResourceKey,
): T {
  return readJson(
    rootDir,
    relativeResourcePath(manifest.resourceSnapshots[key].resourcePath),
  ) as T;
}

function recomputeFreeze(
  rootDir: string,
  freeze: ContestFreeze,
): ContestFreeze {
  const manifestText = fs.readFileSync(
    path.resolve(rootDir, freeze.manifest.path),
    "utf8",
  );
  const manifest = JSON.parse(manifestText) as Record<string, unknown>;
  const qualityReport = record(
    manifest.qualityReport,
    "manifest.qualityReport",
  );
  const manifestQualityCounts = record(
    qualityReport.counts,
    "manifest.qualityReport.counts",
  );
  if (manifest.qualityStatus !== "passed") {
    throw new Error("manifest qualityStatus must be passed");
  }
  const programs = readResource<TrainingProgram[]>(
    rootDir,
    freeze.manifest,
    "programs",
  );
  const curated = validateCuratedMappings({
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
  });
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
    occupations: readResource<ValidatedCuratedMappings["occupations"]>(
      rootDir,
      freeze.manifest,
      "occupations",
    ),
    aliases: readResource<ValidatedCuratedMappings["aliases"]>(
      rootDir,
      freeze.manifest,
      "occupationAliases",
    ),
    links: readResource<ValidatedCuratedMappings["links"]>(
      rootDir,
      freeze.manifest,
      "trainingOccupationLinks",
    ),
    offers: readResource<never[]>(rootDir, freeze.manifest, "jobOffers"),
    publishedRequirements: readResource<never[]>(
      rootDir,
      freeze.manifest,
      "publishedRequirements",
    ),
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

  const resourceSnapshots = Object.fromEntries(
    RESOURCE_KEYS.map((key) => {
      const specification = freeze.manifest.resourceSnapshots[key];
      const text = fs.readFileSync(
        path.resolve(rootDir, relativeResourcePath(specification.resourcePath)),
        "utf8",
      );
      const value = JSON.parse(text) as unknown;
      const recordCount =
        key === "sepeOccupationMarket"
          ? adaptSepeOccupationMarketResource(value).records.length
          : Array.isArray(value)
            ? value.length
            : -1;
      if (
        key === "sepeOccupationMarket" &&
        recordCount !== EXPECTED_SEPE_RECORD_COUNT
      ) {
        throw new Error(
          `SEPE occupation market must contain exactly ${EXPECTED_SEPE_RECORD_COUNT} records, found ${recordCount}.`,
        );
      }
      return [
        key,
        {
          resourcePath: specification.resourcePath,
          sha256: hashText(text),
          recordCount,
        },
      ];
    }),
  ) as ContestFreeze["manifest"]["resourceSnapshots"];
  const snapshotId = resourceSnapshots.programs.resourcePath.match(
    /\/snapshots\/([a-z0-9-]+)\//u,
  )?.[1];
  if (snapshotId === undefined)
    throw new Error("program resource lacks snapshot ID");

  return {
    schemaVersion: "1.0.0",
    freezeStatus: "frozen",
    sourceCommitSha: freeze.sourceCommitSha,
    manifest: {
      path: freeze.manifest.path,
      sha256: hashText(manifestText),
      generatedAt: stringValue(manifest.generatedAt, "manifest.generatedAt"),
      snapshotId,
      qualityStatus: "passed",
      qualityCounts: Object.fromEntries(
        Object.entries(manifestQualityCounts).map(([key, value]) => [
          key,
          integerValue(value, `manifest.qualityReport.counts.${key}`),
        ]),
      ),
      resourceSnapshots,
    },
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
    deployment: freeze.deployment,
  };
}

export function recomputeContestFreeze(
  rootDir: string,
  freeze: ContestFreeze,
): ContestFreeze {
  return recomputeFreeze(path.resolve(rootDir), freeze);
}

function assertSourceCommitBoundary(
  rootDir: string,
  sourceCommitSha: string,
): void {
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
        "data/catalogs",
        "data/curated",
        "data/schemas",
        "public/data",
        "analysis/fp_coverage_expansion_results.json",
        "scripts/analysis/validateFpOneWordPublicationReview.ts",
        "scripts/data/validateCuratedMappings.ts",
        "src/domain",
        "src/data",
        "src/features",
      ],
      { cwd: rootDir, stdio: "pipe" },
    );
  } catch {
    throw new Error(
      "sourceCommitSha cannot prove an ancestor boundary without source/public data mutations",
    );
  }
}

export function validateContestFreeze(
  value: unknown,
  options: ValidationOptions = {},
): { valid: true; errors: [] } {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const freeze = parseFreeze(value);
  if (freeze.deployment.expectedRootUrl !== EXPECTED_ROOT_URL) {
    throw new Error("deployment expectedRootUrl must be the public root URL");
  }
  assertSourceCommitBoundary(rootDir, freeze.sourceCommitSha);
  const recomputed = recomputeFreeze(rootDir, freeze);
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

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  const rootDir = process.cwd();
  if (process.argv.includes("--write")) {
    const sourceCommitSha = parseContestFreezeWriteSourceCommit(process.argv);
    assertContestFreezeWritePreflight(rootDir);
    const freezePath = path.resolve(
      rootDir,
      "docs/contest/coverage-freeze.json",
    );
    const existingJson = record(
      JSON.parse(fs.readFileSync(freezePath, "utf8")),
      "coverage freeze",
    );
    const existingManifest = record(
      existingJson.manifest,
      "coverage freeze manifest",
    );
    const existingResourceSnapshots = record(
      existingManifest.resourceSnapshots,
      "coverage freeze resource snapshots",
    );
    const manifestPath = stringValue(
      existingManifest.path,
      "coverage freeze manifest path",
    );
    const currentManifest = record(readJson(rootDir, manifestPath), "manifest");
    const currentResourceSnapshots = record(
      currentManifest.resourceSnapshots,
      "manifest.resourceSnapshots",
    );
    const migrationResourceSnapshots = Object.fromEntries(
      RESOURCE_KEYS.map((key) => {
        const current = record(
          currentResourceSnapshots[key],
          `manifest.resourceSnapshots.${key}`,
        );
        return [
          key,
          existingResourceSnapshots[key] ?? {
            resourcePath: current.resourcePath,
            sha256: current.sha256,
            recordCount: current.recordCount,
          },
        ];
      }),
    );
    const existing = parseFreeze({
      ...existingJson,
      manifest: {
        ...existingManifest,
        resourceSnapshots: migrationResourceSnapshots,
      },
    });
    const seededResourceSnapshots = Object.fromEntries(
      RESOURCE_KEYS.map((key) => {
        const specification = record(
          currentResourceSnapshots[key],
          `manifest.resourceSnapshots.${key}`,
        );
        return [
          key,
          {
            ...existing.manifest.resourceSnapshots[key],
            resourcePath: stringValue(
              specification.resourcePath,
              `manifest.resourceSnapshots.${key}.resourcePath`,
            ),
          },
        ];
      }),
    ) as ContestFreeze["manifest"]["resourceSnapshots"];
    const recomputed = recomputeContestFreeze(rootDir, {
      ...existing,
      sourceCommitSha,
      manifest: {
        ...existing.manifest,
        resourceSnapshots: seededResourceSnapshots,
      },
    });
    const candidate = await formatPrettier(JSON.stringify(recomputed), {
      parser: "json",
    });
    validateContestFreeze(recomputed, { rootDir });
    fs.writeFileSync(freezePath, candidate);
    console.info(`Contest coverage freeze written from ${sourceCommitSha}.`);
  } else {
    loadAndValidateContestFreeze(rootDir);
    console.info(
      "Contest coverage freeze matches manifest, reports, and public data.",
    );
  }
}
