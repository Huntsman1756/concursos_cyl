import { describe, expect, it } from "vitest";

import {
  validateContestReleaseEvidence,
  type ContestReleaseEvidence,
  type ReleaseEvidenceValidationContext,
} from "./validateContestReleaseEvidence";

const SOURCE_SHA = "a".repeat(40);
const FREEZE_SHA = "b".repeat(40);
const PUBLICATION_SHA = "c".repeat(40);
const EVIDENCE_SHA = "d".repeat(40);
const MANIFEST_SHA = "e".repeat(64);
const ROOT_URL = "https://salida-cyl.157-90-22-40.sslip.io/";

const context: ReleaseEvidenceValidationContext = {
  coverageFreeze: {
    sourceCommitSha: SOURCE_SHA,
    manifest: {
      snapshotId: "20260822082339635-2706ba4b5a53",
      sha256: MANIFEST_SHA,
      resourceSnapshots: {
        programs: { recordCount: 187 },
        centers: { recordCount: 229 },
        trainingOfferings: { recordCount: 1294 },
        jobOffers: { recordCount: 1058 },
      },
    },
  },
};

function validEvidence(): ContestReleaseEvidence {
  return {
    schemaVersion: 1,
    status: "verified",
    recordedAt: "2026-08-22T03:21:54Z",
    expectedRootUrl: ROOT_URL,
    auditHeadSha: EVIDENCE_SHA,
    coverageSourceCommitSha: SOURCE_SHA,
    coverageFreezeDocumentCommitSha: FREEZE_SHA,
    coverageFreezeCommitSha: FREEZE_SHA,
    publicationCommitSha: PUBLICATION_SHA,
    localReviewHeadSha: EVIDENCE_SHA,
    captureProductCommitSha: PUBLICATION_SHA,
    manifest: {
      snapshotId: context.coverageFreeze.manifest.snapshotId,
      sha256: MANIFEST_SHA,
      qualityStatus: "passed",
      programs: 187,
      centers: 229,
      offerings: 1294,
      offers: 1058,
    },
    localGates: {
      coverageFreeze: { status: "passed", command: "freeze" },
      submissionPack: { status: "passed", command: "submission" },
      evidenceManifest: {
        status: "passed",
        captureCount: 2,
        command: "evidence",
      },
      fullVitestCi: { status: "passed", command: "test" },
      playwright: { status: "passed", command: "playwright" },
      lint: { status: "passed", command: "lint" },
      build: { status: "passed", command: "build" },
      license: { status: "passed", command: "license" },
      prettier: { status: "passed", command: "format" },
      gitDiffCheck: { status: "passed", command: "diff" },
    },
    deployment: {
      status: "verified",
      commitSha: PUBLICATION_SHA,
      workflowRunId: "32548299249",
      workflowUrl:
        "https://github.com/Huntsman1756/concursos_cyl/actions/runs/32548299249",
      liveRootVerified: true,
      verifiedAt: "2026-08-22T03:21:54Z",
    },
    publicVerification: {
      status: "verified",
      rootUrl: ROOT_URL,
      rootHttpStatus: 200,
      manifestSha256: MANIFEST_SHA,
      verifiedAt: "2026-08-22T03:21:54Z",
    },
    humanApproval: {
      finalApplicationTextApproved: false,
      rootUrlApproved: false,
      submissionAuthorized: false,
    },
    blockers: ["Human approval remains pending."],
  };
}

describe("contest release evidence validator", () => {
  it("accepts evidence whose frozen snapshot, counts, publication, deployment, and captures agree", () => {
    expect(
      validateContestReleaseEvidence(validEvidence(), context),
    ).toMatchObject({
      valid: true,
      capturesAreCurrent: true,
      humanApproval: {
        finalApplicationTextApproved: false,
        rootUrlApproved: false,
        submissionAuthorized: false,
      },
    });
  });

  it("accepts a pending pre-publication record with frozen counts and no deployment assertions", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    pending.deployment = {
      status: "pending",
      commitSha: null,
      workflowRunId: null,
      workflowUrl: null,
      liveRootVerified: false,
      verifiedAt: null,
    };
    pending.publicVerification = {
      status: "pending",
      rootUrl: ROOT_URL,
      rootHttpStatus: null,
      manifestSha256: null,
      verifiedAt: null,
    };

    expect(validateContestReleaseEvidence(pending, context)).toMatchObject({
      valid: true,
      status: "pending",
      capturesAreCurrent: false,
    });
  });

  it("rejects pending evidence that mixes in verified deployment facts", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    pending.deployment.status = "verified";

    expect(() => validateContestReleaseEvidence(pending, context)).toThrow(
      /pending|deployment|workflow/i,
    );
  });

  it.each([
    ["snapshot", { manifest: { snapshotId: "other" } }],
    ["manifest SHA", { manifest: { sha256: "f".repeat(64) } }],
    ["source SHA", { coverageSourceCommitSha: "f".repeat(40) }],
    ["publication", { publicationCommitSha: "f".repeat(40) }],
    ["deployment", { deployment: { commitSha: "f".repeat(40) } }],
    [
      "public verification",
      { publicVerification: { manifestSha256: "f".repeat(64) } },
    ],
    ["counts", { manifest: { offers: 999 } }],
  ])("rejects stale or cross-commit %s evidence", (_label, patch) => {
    const evidence = validEvidence();
    Object.assign(evidence, patch);
    expect(() => validateContestReleaseEvidence(evidence, context)).toThrow(
      /snapshot|sha|source|publication|deployment|manifest|count|missing/i,
    );
  });

  it("rejects incomplete workflow metadata and any human approval flag", () => {
    const incomplete = validEvidence();
    incomplete.deployment.workflowRunId = "not-a-run";
    expect(() => validateContestReleaseEvidence(incomplete, context)).toThrow(
      /workflow/i,
    );

    const approved = validEvidence();
    approved.humanApproval.rootUrlApproved = true;
    expect(() => validateContestReleaseEvidence(approved, context)).toThrow(
      /human|approval/i,
    );
  });

  it("classifies an older capture commit as historical and never as current", () => {
    const evidence = validEvidence();
    evidence.captureProductCommitSha = "f".repeat(40);

    expect(validateContestReleaseEvidence(evidence, context)).toMatchObject({
      valid: true,
      capturesAreCurrent: false,
    });
  });
});
