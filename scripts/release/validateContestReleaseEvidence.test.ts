import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertContestReleaseEvidenceWorktreeClean,
  assertContestReleaseGitChain,
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
const VERIFIED_AT = "2026-08-22T03:21:54Z";

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
  captures: [
    { localCommitSha: PUBLICATION_SHA, deployedCommitSha: PUBLICATION_SHA },
    { localCommitSha: PUBLICATION_SHA, deployedCommitSha: PUBLICATION_SHA },
  ],
};

function passedGate(command: string, captureCount?: number) {
  return {
    status: "passed" as const,
    command,
    checkedCommitSha: PUBLICATION_SHA,
    verifiedAt: VERIFIED_AT,
    ...(captureCount === undefined ? {} : { captureCount }),
  };
}

function markLocalGatesPending(evidence: ContestReleaseEvidence): void {
  for (const gate of Object.values(evidence.localGates)) {
    gate.status = "pending";
    gate.checkedCommitSha = null;
    gate.verifiedAt = null;
  }
}

type CandidatePlan = {
  baseline: {
    status: "verified";
    commitSha: string;
    releaseTag: string;
    pagesVpsStatus: "verified";
    versionJsonStatus: "verified";
    a4Status: "passed";
    captureCount: number;
  };
  documentaryBranch: string;
  documentaryBaseHeadSha: string;
  finalCandidate: {
    status: "pending" | "verified";
    releaseTag: string;
    commitSha: string | null;
    pagesVpsStatus: "pending" | "verified";
    versionJsonStatus: "pending" | "verified";
    a4Status: "pending" | "passed";
  };
};

function evidenceWithCandidatePlan(): ContestReleaseEvidence & {
  candidatePlan: CandidatePlan;
} {
  const evidence = validEvidence() as ContestReleaseEvidence & {
    candidatePlan: CandidatePlan;
  };
  evidence.deployment.releaseTag = "v2026.08.22";
  evidence.deployment.versionJsonUrl = "https://example.invalid/version.json";
  evidence.deployment.versionJsonCommitSha = PUBLICATION_SHA;
  evidence.deployment.versionJsonSchemaVersion = "1.0.0";
  evidence.deployment.versionJsonVerifiedAt = VERIFIED_AT;
  evidence.candidatePlan = {
    baseline: {
      status: "verified",
      commitSha: PUBLICATION_SHA,
      releaseTag: "v2026.08.22",
      pagesVpsStatus: "verified",
      versionJsonStatus: "verified",
      a4Status: "passed",
      captureCount: 2,
    },
    documentaryBranch: "codex/test-documentary-branch",
    documentaryBaseHeadSha: EVIDENCE_SHA,
    finalCandidate: {
      status: "pending",
      releaseTag: "v2026.08.26-candidate.3",
      commitSha: null,
      pagesVpsStatus: "pending",
      versionJsonStatus: "pending",
      a4Status: "pending",
    },
  };
  return evidence;
}

function validEvidence(): ContestReleaseEvidence {
  return {
    schemaVersion: 1,
    status: "verified",
    recordedAt: VERIFIED_AT,
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
      coverageFreeze: passedGate("freeze"),
      submissionPack: passedGate("submission"),
      evidenceManifest: passedGate("evidence", 2),
      fullVitestCi: passedGate("test"),
      playwright: passedGate("playwright"),
      lint: passedGate("lint"),
      build: passedGate("build"),
      license: passedGate("license"),
      prettier: passedGate("format"),
      gitDiffCheck: passedGate("diff"),
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
  it("validates a pending final-candidate plan without replacing verified baseline evidence", () => {
    const evidence = evidenceWithCandidatePlan();

    expect(validateContestReleaseEvidence(evidence, context)).toMatchObject({
      valid: true,
      status: "verified",
    });

    const mismatchedBaseline = evidenceWithCandidatePlan();
    mismatchedBaseline.candidatePlan.baseline.commitSha = "f".repeat(40);
    expect(() =>
      validateContestReleaseEvidence(mismatchedBaseline, context),
    ).toThrow(/candidatePlan|baseline|publication|commit/i);

    const pendingFinal = evidenceWithCandidatePlan();
    const claimedFinal = {
      ...pendingFinal,
      candidatePlan: {
        ...pendingFinal.candidatePlan,
        finalCandidate: {
          ...pendingFinal.candidatePlan.finalCandidate,
          status: "verified",
          commitSha: PUBLICATION_SHA,
        },
      },
    };
    expect(() => validateContestReleaseEvidence(claimedFinal, context)).toThrow(
      /candidatePlan|final|pending/i,
    );
  });

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

  it("rejects passed gates that have no publication-bound provenance", () => {
    const legacy = validEvidence() as unknown as {
      localGates: Record<string, Record<string, unknown>>;
    };
    delete legacy.localGates.coverageFreeze?.checkedCommitSha;
    delete legacy.localGates.coverageFreeze?.verifiedAt;
    expect(() => validateContestReleaseEvidence(legacy, context)).toThrow(
      /gate|commit|provenance|verifiedAt/i,
    );
  });

  it("rejects gates checked against another commit or after the evidence record", () => {
    const wrongCommit = validEvidence();
    wrongCommit.localGates.lint.checkedCommitSha = "f".repeat(40);
    expect(() => validateContestReleaseEvidence(wrongCommit, context)).toThrow(
      /gate|commit|publication/i,
    );

    const missingTimestamp = validEvidence();
    missingTimestamp.localGates.build.verifiedAt = null;
    expect(() =>
      validateContestReleaseEvidence(missingTimestamp, context),
    ).toThrow(/gate|verifiedAt|provenance/i);

    const futureGate = validEvidence();
    futureGate.localGates.playwright.verifiedAt = "2026-08-22T03:21:55Z";
    expect(() => validateContestReleaseEvidence(futureGate, context)).toThrow(
      /gate|verifiedAt|recordedAt/i,
    );
  });

  it("accepts a pending pre-publication record with frozen counts and no deployment assertions", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    markLocalGatesPending(pending);
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

  it("rejects pending evidence with incomplete verified deployment facts", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    markLocalGatesPending(pending);
    pending.deployment.status = "verified";
    pending.deployment.commitSha = null;

    expect(() => validateContestReleaseEvidence(pending, context)).toThrow(
      /pending|deployment|workflow/i,
    );
  });

  it("accepts verified deployment facts while current visual evidence remains pending", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    markLocalGatesPending(pending);
    pending.deployment = {
      status: "verified",
      commitSha: PUBLICATION_SHA,
      workflowRunId: "32597524256",
      workflowUrl:
        "https://github.com/Huntsman1756/concursos_cyl/actions/runs/32597524256",
      liveRootVerified: true,
      verifiedAt: VERIFIED_AT,
    };
    pending.publicVerification = {
      status: "verified",
      rootUrl: ROOT_URL,
      rootHttpStatus: 200,
      manifestSha256: MANIFEST_SHA,
      verifiedAt: VERIFIED_AT,
    };

    expect(validateContestReleaseEvidence(pending, context)).toMatchObject({
      valid: true,
      status: "pending",
      capturesAreCurrent: false,
    });
  });

  it("accepts version.json traceability bound to the deployed commit", () => {
    const pending = validEvidence();
    pending.status = "pending";
    pending.auditHeadSha = null;
    pending.localReviewHeadSha = null;
    pending.publicationCommitSha = null;
    pending.captureProductCommitSha = null;
    pending.localGates.evidenceManifest.captureCount = 0;
    markLocalGatesPending(pending);
    pending.deployment = {
      status: "verified",
      commitSha: PUBLICATION_SHA,
      workflowRunId: "32597524256",
      workflowUrl:
        "https://github.com/Huntsman1756/concursos_cyl/actions/runs/32597524256",
      liveRootVerified: true,
      verifiedAt: VERIFIED_AT,
      releaseTag: "v2026.08.22",
      versionJsonUrl:
        "https://huntsman1756.github.io/concursos_cyl/version.json",
      versionJsonCommitSha: PUBLICATION_SHA,
      versionJsonSchemaVersion: "1.0.0",
      versionJsonVerifiedAt: VERIFIED_AT,
    } as ContestReleaseEvidence["deployment"];
    pending.publicVerification = {
      status: "verified",
      rootUrl: ROOT_URL,
      rootHttpStatus: 200,
      manifestSha256: MANIFEST_SHA,
      verifiedAt: VERIFIED_AT,
    };

    expect(validateContestReleaseEvidence(pending, context)).toMatchObject({
      valid: true,
      status: "pending",
    });
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

  it("rejects evidence marked verified when its capture commit is older", () => {
    const evidence = validEvidence();
    evidence.captureProductCommitSha = "f".repeat(40);

    expect(() => validateContestReleaseEvidence(evidence, context)).toThrow(
      /verified|capture|publication/i,
    );
  });

  it("requires complete current capture provenance for verified evidence", () => {
    const evidence = validEvidence();
    evidence.captureProductCommitSha = null;

    expect(() => validateContestReleaseEvidence(evidence, context)).toThrow(
      /verified|capture|publication/i,
    );

    const mismatch = validEvidence();
    const captures = context.captures ?? [];
    expect(() =>
      validateContestReleaseEvidence(mismatch, {
        ...context,
        captures: [
          {
            localCommitSha: "f".repeat(40),
            deployedCommitSha: PUBLICATION_SHA,
          },
          ...captures.slice(1),
        ],
      }),
    ).toThrow(/verified|capture|publication/i);

    expect(() =>
      validateContestReleaseEvidence(validEvidence(), {
        ...context,
        captures: [context.captures![0]!],
      }),
    ).toThrow(/capture|count|verified/i);

    const splitAudit = validEvidence();
    splitAudit.localReviewHeadSha = "f".repeat(40);
    expect(() => validateContestReleaseEvidence(splitAudit, context)).toThrow(
      /audit|review|commit/i,
    );
  });

  it("validates the S-to-F-to-P-to-E Git chain", () => {
    const root = mkdtempSync(join(tmpdir(), "contest-release-chain-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: root });
      execFileSync("git", ["config", "user.email", "test@example.invalid"], {
        cwd: root,
      });
      execFileSync("git", ["config", "user.name", "Contest Test"], {
        cwd: root,
      });
      writeFileSync(join(root, "evidence.txt"), "S\n", "utf8");
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "S"], { cwd: root });
      const source = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      mkdirSync(join(root, "docs", "contest", "evidence"), {
        recursive: true,
      });
      const freezePath = "docs/contest/coverage-freeze.json";
      const evidenceManifestPath = "docs/contest/evidence-capture.json";
      const capturePath = "docs/contest/evidence/home.png";
      writeFileSync(join(root, freezePath), '{"freeze":"F"}\n', "utf8");
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "F"], { cwd: root });
      const freeze = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      writeFileSync(join(root, "publication.txt"), "P\n", "utf8");
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "P"], { cwd: root });
      const publication = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      writeFileSync(join(root, evidenceManifestPath), '{"capture":"E"}\n');
      writeFileSync(join(root, capturePath), "png-bytes");
      execFileSync("git", ["add", "."], { cwd: root });
      execFileSync("git", ["commit", "-qm", "E"], { cwd: root });
      const evidence = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();

      expect(() =>
        assertContestReleaseGitChain(root, {
          sourceCommitSha: source,
          freezeCommitSha: freeze,
          publicationCommitSha: publication,
          evidenceCommitSha: evidence,
          freezePath,
          evidencePaths: [evidenceManifestPath, capturePath],
        }),
      ).not.toThrow();
      expect(() =>
        assertContestReleaseEvidenceWorktreeClean(root),
      ).not.toThrow();
      expect(() =>
        assertContestReleaseGitChain(root, {
          sourceCommitSha: source,
          freezeCommitSha: freeze,
          publicationCommitSha: freeze,
          evidenceCommitSha: evidence,
          freezePath,
          evidencePaths: [evidenceManifestPath, capturePath],
        }),
      ).toThrow(/distinct|order|ancestor/i);

      writeFileSync(join(root, freezePath), '{"freeze":"tampered"}\n');
      expect(() =>
        assertContestReleaseGitChain(root, {
          sourceCommitSha: source,
          freezeCommitSha: freeze,
          publicationCommitSha: publication,
          evidenceCommitSha: evidence,
          freezePath,
          evidencePaths: [evidenceManifestPath, capturePath],
        }),
      ).toThrow(/freeze|bytes|commit/i);
      expect(() => assertContestReleaseEvidenceWorktreeClean(root)).toThrow(
        /dirty|coverage-freeze/i,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
