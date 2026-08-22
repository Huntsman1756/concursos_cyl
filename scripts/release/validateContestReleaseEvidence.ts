import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadAndValidateContestClaims } from "./validateContestClaims";
import {
  validateContestEvidenceManifest,
  type ContestEvidenceManifest,
} from "./validateContestEvidenceManifest";
import { loadAndValidateContestFreeze } from "./validateContestFreeze";

const EXPECTED_ROOT_URL = "https://salida-cyl.157-90-22-40.sslip.io/";
const SHA1 = /^[a-f0-9]{40}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const GATE_KEYS = [
  "coverageFreeze",
  "submissionPack",
  "evidenceManifest",
  "fullVitestCi",
  "playwright",
  "lint",
  "build",
  "license",
  "prettier",
  "gitDiffCheck",
] as const;
const ROOT_KEYS = [
  "schemaVersion",
  "status",
  "recordedAt",
  "expectedRootUrl",
  "auditHeadSha",
  "coverageSourceCommitSha",
  "coverageFreezeDocumentCommitSha",
  "coverageFreezeCommitSha",
  "publicationCommitSha",
  "localReviewHeadSha",
  "captureProductCommitSha",
  "manifest",
  "localGates",
  "deployment",
  "publicVerification",
  "humanApproval",
  "blockers",
] as const;

export type ContestReleaseEvidence = {
  schemaVersion: 1;
  status: "pending" | "verified";
  recordedAt: string;
  expectedRootUrl: string;
  auditHeadSha: string | null;
  coverageSourceCommitSha: string;
  coverageFreezeDocumentCommitSha: string;
  coverageFreezeCommitSha: string;
  publicationCommitSha: string | null;
  localReviewHeadSha: string | null;
  captureProductCommitSha: string | null;
  manifest: {
    snapshotId: string;
    sha256: string;
    qualityStatus: "passed";
    programs: number;
    centers: number;
    offerings: number;
    offers: number;
  };
  localGates: Record<
    (typeof GATE_KEYS)[number],
    {
      status: "pending" | "passed";
      command: string;
      checkedCommitSha: string | null;
      verifiedAt: string | null;
      captureCount?: number;
      note?: string;
    }
  >;
  deployment: {
    status: "pending" | "verified";
    commitSha: string | null;
    workflowRunId: string | null;
    workflowUrl: string | null;
    liveRootVerified: boolean;
    verifiedAt: string | null;
  };
  publicVerification: {
    status: "pending" | "verified";
    rootUrl: string;
    rootHttpStatus: number | null;
    manifestSha256: string | null;
    verifiedAt: string | null;
  };
  humanApproval: {
    finalApplicationTextApproved: boolean;
    rootUrlApproved: boolean;
    submissionAuthorized: boolean;
  };
  blockers: string[];
};

export type ReleaseEvidenceValidationContext = {
  coverageFreeze: {
    sourceCommitSha: string;
    manifest: {
      snapshotId: string;
      sha256: string;
      resourceSnapshots: Record<string, { recordCount: number }>;
    };
  };
  expectedRootUrl?: string;
  captureCount?: number;
  captures?: ReadonlyArray<{
    localCommitSha?: string;
    deployedCommitSha?: string | null;
  }>;
};

export type ContestReleaseGitChain = {
  sourceCommitSha: string;
  freezeCommitSha: string;
  publicationCommitSha: string | null;
  evidenceCommitSha: string | null;
  freezePath: string;
  evidencePaths: readonly string[];
};

export type ContestReleaseEvidenceValidation = {
  valid: true;
  errors: [];
  status: "pending" | "verified";
  capturesAreCurrent: boolean;
  humanApproval: ContestReleaseEvidence["humanApproval"];
};

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: unknown,
  keys: readonly string[],
  label: string,
  required: readonly string[] = keys,
): Record<string, unknown> {
  const result = record(value, label);
  const unknown = Object.keys(result).filter((key) => !keys.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} has unknown field(s): ${unknown.join(", ")}`);
  }
  for (const key of required) {
    if (!(key in result)) throw new Error(`${label} is missing ${key}`);
  }
  return result;
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function sha(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA1.test(result)) throw new Error(`${label} must be a commit SHA`);
  return result;
}

function nullableSha(value: unknown, label: string): string | null {
  if (value === null) return null;
  return sha(value, label);
}

function nullableIsoUtc(value: unknown, label: string): string | null {
  if (value === null) return null;
  return isoUtc(value, label);
}

function sha256(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA256.test(result))
    throw new Error(`${label} must be a SHA-256 digest`);
  return result;
}

function isoUtc(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!result.endsWith("Z") || Number.isNaN(Date.parse(result))) {
    throw new Error(`${label} must be an ISO UTC timestamp`);
  }
  return result;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label} does not match the frozen source`);
  }
}

function assertCommitExists(rootDir: string, commitSha: string): void {
  if (!SHA1.test(commitSha)) {
    throw new Error(`Git chain contains an invalid commit SHA: ${commitSha}`);
  }
  try {
    execFileSync("git", ["rev-parse", "--verify", `${commitSha}^{commit}`], {
      cwd: rootDir,
      stdio: "pipe",
    });
  } catch {
    throw new Error(`Git chain commit does not exist: ${commitSha}`);
  }
}

function assertAncestor(
  rootDir: string,
  ancestorSha: string,
  descendantSha: string,
): void {
  try {
    execFileSync(
      "git",
      ["merge-base", "--is-ancestor", ancestorSha, descendantSha],
      { cwd: rootDir, stdio: "pipe" },
    );
  } catch {
    throw new Error(
      `Git chain order is invalid: ${ancestorSha} is not an ancestor of ${descendantSha}`,
    );
  }
}

function assertSafeGitPath(relativePath: string, label: string): void {
  if (
    relativePath.trim() === "" ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.split("/").includes("..") ||
    relativePath.startsWith("-")
  ) {
    throw new Error(`${label} must be a safe repository-relative POSIX path`);
  }
}

function assertCommitContainsCurrentPaths(
  rootDir: string,
  commitSha: string,
  paths: readonly string[],
  label: string,
): void {
  if (paths.length === 0) return;
  paths.forEach((relativePath) => assertSafeGitPath(relativePath, label));
  try {
    execFileSync("git", ["diff", "--quiet", commitSha, "--", ...paths], {
      cwd: rootDir,
      stdio: "pipe",
    });
  } catch {
    throw new Error(`${label} bytes do not match commit ${commitSha}`);
  }
}

const RELEASE_EVIDENCE_WORKTREE_PATHS = [
  "docs/contest/coverage-freeze.json",
  "docs/contest/release-evidence.json",
  "docs/contest/evidence-capture.json",
  "docs/contest/claim-ledger.json",
  "docs/contest/evidence",
] as const;

export function assertContestReleaseEvidenceWorktreeClean(
  rootDir = process.cwd(),
): void {
  const dirty = execFileSync(
    "git",
    [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      ...RELEASE_EVIDENCE_WORKTREE_PATHS,
    ],
    { cwd: path.resolve(rootDir), encoding: "utf8" },
  ).trim();
  if (dirty !== "") {
    throw new Error(`Contest release evidence paths are dirty: ${dirty}`);
  }
}

export function assertContestReleaseGitChain(
  rootDir: string,
  chain: ContestReleaseGitChain,
): void {
  const evidenceCommitSha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: path.resolve(rootDir),
    encoding: "utf8",
  }).trim();
  assertCommitExists(rootDir, chain.sourceCommitSha);
  assertCommitExists(rootDir, chain.freezeCommitSha);
  assertCommitExists(rootDir, evidenceCommitSha);
  if (chain.sourceCommitSha === chain.freezeCommitSha) {
    throw new Error("Git chain requires distinct S and F commits");
  }
  assertAncestor(rootDir, chain.sourceCommitSha, chain.freezeCommitSha);
  assertCommitContainsCurrentPaths(
    rootDir,
    chain.freezeCommitSha,
    [chain.freezePath],
    "coverage freeze",
  );
  if (chain.publicationCommitSha === null) {
    if (chain.evidenceCommitSha !== null || chain.evidencePaths.length > 0) {
      throw new Error(
        "A pending Git chain must not claim an evidence commit or evidence paths",
      );
    }
    assertAncestor(rootDir, chain.freezeCommitSha, evidenceCommitSha);
    return;
  }
  assertCommitExists(rootDir, chain.publicationCommitSha);
  if (chain.evidenceCommitSha === null) {
    throw new Error("A published Git chain requires an evidence commit");
  }
  assertCommitExists(rootDir, chain.evidenceCommitSha);
  if (
    chain.publicationCommitSha === chain.sourceCommitSha ||
    chain.publicationCommitSha === chain.freezeCommitSha ||
    chain.publicationCommitSha === chain.evidenceCommitSha
  ) {
    throw new Error("Git chain requires distinct F, P, and E commits");
  }
  assertAncestor(rootDir, chain.freezeCommitSha, chain.publicationCommitSha);
  assertAncestor(rootDir, chain.publicationCommitSha, chain.evidenceCommitSha);
  assertAncestor(rootDir, chain.evidenceCommitSha, evidenceCommitSha);
  assertCommitContainsCurrentPaths(
    rootDir,
    chain.evidenceCommitSha,
    chain.evidencePaths,
    "capture evidence",
  );
}

function capturesMatchPublication(
  context: ReleaseEvidenceValidationContext,
  publicationSha: string | null,
  declaredCaptureCount: number,
): boolean {
  if (publicationSha === null || context.captures === undefined) return false;
  if (context.captures.length !== declaredCaptureCount) return false;
  if (
    context.captureCount !== undefined &&
    context.captures.length !== context.captureCount
  ) {
    return false;
  }
  return (
    context.captures.length > 0 &&
    context.captures.every(
      (capture) =>
        typeof capture.localCommitSha === "string" &&
        SHA1.test(capture.localCommitSha) &&
        capture.localCommitSha === publicationSha &&
        typeof capture.deployedCommitSha === "string" &&
        SHA1.test(capture.deployedCommitSha) &&
        capture.deployedCommitSha === publicationSha,
    )
  );
}

function gate(
  value: unknown,
  label: string,
): ContestReleaseEvidence["localGates"][keyof ContestReleaseEvidence["localGates"]] {
  const parsed = exactKeys(
    value,
    [
      "status",
      "command",
      "checkedCommitSha",
      "verifiedAt",
      "captureCount",
      "note",
    ],
    label,
    ["status", "command", "checkedCommitSha", "verifiedAt"],
  );
  if (parsed.status !== "pending" && parsed.status !== "passed") {
    throw new Error(`${label}.status must be pending or passed`);
  }
  const command = nonEmptyString(parsed.command, `${label}.command`);
  const checkedCommitSha = nullableSha(
    parsed.checkedCommitSha,
    `${label}.checkedCommitSha`,
  );
  const verifiedAt = nullableIsoUtc(parsed.verifiedAt, `${label}.verifiedAt`);
  if (
    parsed.status === "pending" &&
    (checkedCommitSha !== null || verifiedAt !== null)
  ) {
    throw new Error(`${label} pending gate must not claim provenance`);
  }
  if (
    parsed.status === "passed" &&
    (checkedCommitSha === null || verifiedAt === null)
  ) {
    throw new Error(
      `${label} passed gate requires checkedCommitSha and verifiedAt provenance`,
    );
  }
  if ("captureCount" in parsed) {
    nonNegativeInteger(parsed.captureCount, `${label}.captureCount`);
  }
  return {
    status: parsed.status,
    command,
    checkedCommitSha,
    verifiedAt,
    ...(parsed.captureCount === undefined
      ? {}
      : { captureCount: parsed.captureCount as number }),
    ...(parsed.note === undefined
      ? {}
      : { note: nonEmptyString(parsed.note, `${label}.note`) }),
  };
}

function resourceCount(
  context: ReleaseEvidenceValidationContext,
  key: string,
  label: string,
): number {
  const resource = context.coverageFreeze.manifest.resourceSnapshots[key];
  if (resource === undefined) {
    throw new Error(
      `coverageFreeze.manifest.resourceSnapshots is missing ${key}`,
    );
  }
  return nonNegativeInteger(resource.recordCount, label);
}

export function validateContestReleaseEvidence(
  value: unknown,
  context: ReleaseEvidenceValidationContext,
): ContestReleaseEvidenceValidation {
  const root = exactKeys(value, ROOT_KEYS, "release evidence");
  if (root.schemaVersion !== 1)
    throw new Error("release evidence schemaVersion must be 1");
  const status = root.status;
  if (status !== "pending" && status !== "verified")
    throw new Error("release evidence status must be pending or verified");
  const recordedAt = isoUtc(root.recordedAt, "recordedAt");
  void recordedAt;
  const expectedRootUrl = nonEmptyString(
    root.expectedRootUrl,
    "expectedRootUrl",
  );
  assertEqual(
    expectedRootUrl,
    context.expectedRootUrl ?? EXPECTED_ROOT_URL,
    "expectedRootUrl",
  );

  const sourceSha = sha(
    root.coverageSourceCommitSha,
    "coverageSourceCommitSha",
  );
  assertEqual(
    sourceSha,
    context.coverageFreeze.sourceCommitSha,
    "coverageSourceCommitSha",
  );
  const freezeDocumentSha = sha(
    root.coverageFreezeDocumentCommitSha,
    "coverageFreezeDocumentCommitSha",
  );
  const freezeCommitSha = sha(
    root.coverageFreezeCommitSha,
    "coverageFreezeCommitSha",
  );
  if (freezeDocumentSha === sourceSha || freezeCommitSha === sourceSha) {
    throw new Error(
      "coverage freeze commit must be distinct from the source commit",
    );
  }
  assertEqual(freezeDocumentSha, freezeCommitSha, "coverageFreezeCommitSha");
  const publicationSha = nullableSha(
    root.publicationCommitSha,
    "publicationCommitSha",
  );
  const auditHeadSha = nullableSha(root.auditHeadSha, "auditHeadSha");
  const localReviewHeadSha = nullableSha(
    root.localReviewHeadSha,
    "localReviewHeadSha",
  );
  if (status === "pending") {
    if (
      publicationSha !== null ||
      auditHeadSha !== null ||
      localReviewHeadSha !== null
    ) {
      throw new Error(
        "pending release evidence must not claim a publication or evidence commit",
      );
    }
  } else if (
    publicationSha === null ||
    auditHeadSha === null ||
    localReviewHeadSha === null
  ) {
    throw new Error(
      "verified release evidence requires publication, audit, and local review commits",
    );
  } else if (auditHeadSha !== localReviewHeadSha) {
    throw new Error(
      "verified auditHeadSha and localReviewHeadSha must identify the same evidence commit",
    );
  }

  const rawCaptureSha = root.captureProductCommitSha;
  if (rawCaptureSha !== null) sha(rawCaptureSha, "captureProductCommitSha");
  if (status === "pending" && rawCaptureSha !== null) {
    throw new Error(
      "pending release evidence must not claim a capture product commit",
    );
  }

  const manifest = exactKeys(
    root.manifest,
    [
      "snapshotId",
      "sha256",
      "qualityStatus",
      "programs",
      "centers",
      "offerings",
      "offers",
    ],
    "release evidence manifest",
  );
  assertEqual(
    nonEmptyString(manifest.snapshotId, "manifest.snapshotId"),
    context.coverageFreeze.manifest.snapshotId,
    "manifest.snapshotId",
  );
  assertEqual(
    sha256(manifest.sha256, "manifest.sha256"),
    context.coverageFreeze.manifest.sha256,
    "manifest.sha256",
  );
  if (manifest.qualityStatus !== "passed") {
    throw new Error("manifest.qualityStatus must be passed");
  }
  assertEqual(
    nonNegativeInteger(manifest.programs, "manifest.programs"),
    resourceCount(context, "programs", "programs"),
    "manifest.programs",
  );
  assertEqual(
    nonNegativeInteger(manifest.centers, "manifest.centers"),
    resourceCount(context, "centers", "centers"),
    "manifest.centers",
  );
  assertEqual(
    nonNegativeInteger(manifest.offerings, "manifest.offerings"),
    resourceCount(context, "trainingOfferings", "offerings"),
    "manifest.offerings",
  );
  assertEqual(
    nonNegativeInteger(manifest.offers, "manifest.offers"),
    resourceCount(context, "jobOffers", "offers"),
    "manifest.offers",
  );

  const gates = exactKeys(root.localGates, GATE_KEYS, "localGates");
  const parsedGates = Object.fromEntries(
    GATE_KEYS.map((key) => [key, gate(gates[key], `localGates.${key}`)]),
  ) as ContestReleaseEvidence["localGates"];
  for (const [key, parsedGate] of Object.entries(parsedGates)) {
    if (status === "pending") {
      if (parsedGate.status !== "pending") {
        throw new Error(
          `localGates.${key} must remain pending before publication`,
        );
      }
      continue;
    }
    if (
      parsedGate.status !== "passed" ||
      publicationSha === null ||
      parsedGate.checkedCommitSha !== publicationSha ||
      parsedGate.verifiedAt === null
    ) {
      throw new Error(
        `localGates.${key} must be passed for the exact publication commit`,
      );
    }
    if (Date.parse(parsedGate.verifiedAt) > Date.parse(recordedAt)) {
      throw new Error(
        `localGates.${key}.verifiedAt must not be later than recordedAt`,
      );
    }
  }
  const captureCount = parsedGates.evidenceManifest.captureCount;
  if (captureCount === undefined) {
    throw new Error("localGates.evidenceManifest.captureCount is required");
  }
  if (status === "pending" && captureCount !== 0) {
    throw new Error("pending release evidence must not claim current captures");
  }
  if (status === "verified" && captureCount <= 0) {
    throw new Error(
      "verified release evidence requires a positive capture count",
    );
  }
  if (context.captureCount !== undefined && status === "verified") {
    assertEqual(captureCount, context.captureCount, "captureCount");
  }

  const deployment = exactKeys(
    root.deployment,
    [
      "status",
      "commitSha",
      "workflowRunId",
      "workflowUrl",
      "liveRootVerified",
      "verifiedAt",
    ],
    "deployment",
  );
  if (deployment.status !== "pending" && deployment.status !== "verified") {
    throw new Error("deployment.status must be pending or verified");
  }
  const deploymentCommitSha = nullableSha(
    deployment.commitSha,
    "deployment.commitSha",
  );
  const deploymentWorkflowRunId =
    deployment.workflowRunId === null
      ? null
      : nonEmptyString(deployment.workflowRunId, "deployment.workflowRunId");
  const deploymentWorkflowUrl =
    deployment.workflowUrl === null
      ? null
      : nonEmptyString(deployment.workflowUrl, "deployment.workflowUrl");
  const deploymentVerifiedAt = nullableIsoUtc(
    deployment.verifiedAt,
    "deployment.verifiedAt",
  );
  if (status === "pending") {
    if (
      deployment.status !== "pending" ||
      deploymentCommitSha !== null ||
      deploymentWorkflowRunId !== null ||
      deploymentWorkflowUrl !== null ||
      deployment.liveRootVerified !== false ||
      deploymentVerifiedAt !== null
    ) {
      throw new Error(
        "pending release evidence must not claim deployment or workflow verification",
      );
    }
  } else {
    if (
      deployment.status !== "verified" ||
      publicationSha === null ||
      deploymentCommitSha === null ||
      deploymentWorkflowRunId === null ||
      deploymentWorkflowUrl === null ||
      deploymentVerifiedAt === null ||
      deployment.liveRootVerified !== true
    ) {
      throw new Error("verified deployment evidence is incomplete");
    }
    assertEqual(deploymentCommitSha, publicationSha, "deployment.commitSha");
    if (!/^\d+$/u.test(deploymentWorkflowRunId)) {
      throw new Error("deployment.workflowRunId must be numeric");
    }
    if (
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/u.test(
        deploymentWorkflowUrl,
      )
    ) {
      throw new Error(
        "deployment.workflowUrl must identify a GitHub Actions run",
      );
    }
  }

  const publicVerification = exactKeys(
    root.publicVerification,
    ["status", "rootUrl", "rootHttpStatus", "manifestSha256", "verifiedAt"],
    "publicVerification",
  );
  if (
    publicVerification.status !== "pending" &&
    publicVerification.status !== "verified"
  ) {
    throw new Error("publicVerification.status must be pending or verified");
  }
  assertEqual(
    nonEmptyString(publicVerification.rootUrl, "publicVerification.rootUrl"),
    expectedRootUrl,
    "publicVerification.rootUrl",
  );
  const publicManifestSha =
    publicVerification.manifestSha256 === null
      ? null
      : sha256(
          publicVerification.manifestSha256,
          "publicVerification.manifestSha256",
        );
  const publicVerifiedAt = nullableIsoUtc(
    publicVerification.verifiedAt,
    "publicVerification.verifiedAt",
  );
  if (status === "pending") {
    if (
      publicVerification.status !== "pending" ||
      publicVerification.rootHttpStatus !== null ||
      publicManifestSha !== null ||
      publicVerifiedAt !== null
    ) {
      throw new Error(
        "pending release evidence must not claim public verification",
      );
    }
  } else {
    if (
      publicVerification.status !== "verified" ||
      publicVerification.rootHttpStatus !== 200 ||
      publicManifestSha === null ||
      publicVerifiedAt === null ||
      deploymentVerifiedAt === null
    ) {
      throw new Error("verified public verification evidence is incomplete");
    }
    assertEqual(
      publicManifestSha,
      manifest.sha256,
      "publicVerification.manifestSha256",
    );
    assertEqual(
      publicVerifiedAt,
      deploymentVerifiedAt,
      "verification timestamps",
    );
  }

  const humanApproval = exactKeys(
    root.humanApproval,
    ["finalApplicationTextApproved", "rootUrlApproved", "submissionAuthorized"],
    "humanApproval",
  ) as ContestReleaseEvidence["humanApproval"];
  for (const [key, approved] of Object.entries(humanApproval)) {
    if (typeof approved !== "boolean")
      throw new Error(`humanApproval.${key} must be boolean`);
    if (approved) throw new Error(`humanApproval.${key} must remain false`);
  }

  const blockers = root.blockers;
  if (
    !Array.isArray(blockers) ||
    blockers.length === 0 ||
    blockers.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new Error("blockers must contain a human approval boundary");
  }
  const capturesAreCurrent =
    status === "verified" &&
    rawCaptureSha !== null &&
    publicationSha !== null &&
    rawCaptureSha === publicationSha &&
    capturesMatchPublication(context, publicationSha, captureCount);
  if (status === "verified" && !capturesAreCurrent) {
    throw new Error(
      "verified release evidence requires complete captures for the exact publication commit",
    );
  }
  return {
    valid: true,
    errors: [],
    status,
    capturesAreCurrent,
    humanApproval,
  };
}

export function loadAndValidateContestReleaseEvidence(
  rootDir = process.cwd(),
  context: ReleaseEvidenceValidationContext,
): ContestReleaseEvidenceValidation {
  const value = JSON.parse(
    fs.readFileSync(
      path.join(rootDir, "docs", "contest", "release-evidence.json"),
      "utf8",
    ),
  ) as unknown;
  return validateContestReleaseEvidence(value, context);
}

/**
 * Loads the two checked-in evidence records without pretending that a stale
 * freeze is valid. This is the pre-S/P gate; callers can run it after S/F or
 * after observing P and E respectively.
 */
export function validateContestReleaseEvidenceFromRoot(
  rootDir = process.cwd(),
): ContestReleaseEvidenceValidation {
  const resolvedRoot = path.resolve(rootDir);
  assertContestReleaseEvidenceWorktreeClean(resolvedRoot);
  const freeze = loadAndValidateContestFreeze(resolvedRoot);
  const evidence = JSON.parse(
    fs.readFileSync(
      path.join(resolvedRoot, "docs", "contest", "release-evidence.json"),
      "utf8",
    ),
  ) as ContestReleaseEvidence;
  const claims = loadAndValidateContestClaims(
    path.join(resolvedRoot, "docs", "contest", "claim-ledger.json"),
  );
  const captureValue = JSON.parse(
    fs.readFileSync(
      path.join(resolvedRoot, "docs", "contest", "evidence-capture.json"),
      "utf8",
    ),
  ) as unknown;
  validateContestEvidenceManifest(captureValue, {
    rootDir: resolvedRoot,
    knownClaimIds: claims.map(({ claimId }) => claimId),
    freezeRecordPresent: true,
    requireProvenance: true,
  });
  const captures = captureValue as ContestEvidenceManifest;
  const context: ReleaseEvidenceValidationContext = {
    coverageFreeze: {
      sourceCommitSha: freeze.sourceCommitSha,
      manifest: {
        snapshotId: freeze.manifest.snapshotId,
        sha256: freeze.manifest.sha256,
        resourceSnapshots: freeze.manifest.resourceSnapshots,
      },
    },
    captureCount: captures.captures.length,
    captures: captures.captures.map((capture) => ({
      localCommitSha: capture.localCommitSha,
      deployedCommitSha: capture.deployedCommitSha,
    })),
  };
  const result = validateContestReleaseEvidence(evidence, context);
  assertContestReleaseGitChain(resolvedRoot, {
    sourceCommitSha: freeze.sourceCommitSha,
    freezeCommitSha: evidence.coverageFreezeCommitSha,
    publicationCommitSha: evidence.publicationCommitSha,
    evidenceCommitSha:
      evidence.status === "verified" ? evidence.auditHeadSha : null,
    freezePath: "docs/contest/coverage-freeze.json",
    evidencePaths:
      evidence.status === "verified"
        ? [
            "docs/contest/evidence-capture.json",
            ...captures.captures.map((capture) => capture.outputFile),
          ]
        : [],
  });
  return result;
}

if (
  path.resolve(process.argv[1] ?? "") === path.resolve(import.meta.filename)
) {
  const result = validateContestReleaseEvidenceFromRoot();
  console.info(
    `Contest release evidence is ${result.status}; capturesAreCurrent=${result.capturesAreCurrent}.`,
  );
}
