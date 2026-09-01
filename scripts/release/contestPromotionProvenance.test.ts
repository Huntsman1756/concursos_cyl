import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  renderContestSubmission,
  type ContestDeploymentEvidence,
} from "./renderContestSubmission";
import {
  assertContestReleaseGitChain,
  validateContestReleaseEvidence,
  type ContestReleaseEvidence,
  type ReleaseEvidenceValidationContext,
} from "./validateContestReleaseEvidence";
import {
  loadAndValidateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";

const EXPANDED_SOURCE_SHA = "a0350acdfd6064b68dee30af80433d8564347da3";
const EXPANDED_FREEZE_COMMIT_SHA = "fa9598df89f24d3fdbf728a20c81cb7a7d6cf621";
const CAPTURE_COUNT = 0;
const LEGACY_SOURCE_SHA = "ff9e6197f926e462bea1a3e8ac6a57a23d3f825a";
const CANDIDATE_4_TAG = "v2026.08.27-candidate.4";
const CANDIDATE_4_COMMIT = "a59a788a39bc8d300c66fee39ea2f2469f588112";
const CANDIDATE_4_SNAPSHOT_ID = "20260822085631889-7bbe69380f6d";
const CANDIDATE_4_MANIFEST_SHA =
  "92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18";
const FREEZE_PATH = "docs/contest/coverage-freeze.json";
const POINTER_PATH = "docs/contest/release-evidence.json";

function gitShowText(revisionPath: string, revision: string): string {
  return execFileSync("git", ["show", `${revision}:${revisionPath}`], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

function freezeContext(
  freeze: Pick<ContestFreeze, "sourceCommitSha" | "manifest">,
): ReleaseEvidenceValidationContext {
  const { resourceSnapshots } = freeze.manifest;
  return {
    coverageFreeze: {
      sourceCommitSha: freeze.sourceCommitSha,
      manifest: {
        snapshotId: freeze.manifest.snapshotId,
        sha256: freeze.manifest.sha256,
        resourceSnapshots: {
          programs: {
            recordCount: resourceSnapshots.programs.recordCount,
          },
          centers: {
            recordCount: resourceSnapshots.centers.recordCount,
          },
          trainingOfferings: {
            recordCount: resourceSnapshots.trainingOfferings.recordCount,
          },
          jobOffers: {
            recordCount: resourceSnapshots.jobOffers.recordCount,
          },
        },
      },
    },
  };
}

function checkedInPointer(): ContestReleaseEvidence {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), POINTER_PATH), "utf8"),
  ) as ContestReleaseEvidence;
}

function pendingDeploymentEvidence(): ContestDeploymentEvidence {
  return {
    status: "pending",
    commitSha: null,
    workflowRunId: null,
    verifiedAt: null,
    captureProductCommitSha: null,
    captureCount: 0,
    capturesAreCurrent: false,
    releaseGatesVerified: false,
    releaseTag: null,
    versionJsonUrl: null,
    versionJsonCommitSha: null,
    versionJsonSchemaVersion: null,
    versionJsonVerifiedAt: null,
  };
}

describe("contest promotion provenance matrix", () => {
  let freeze: ContestFreeze;
  let context: ReleaseEvidenceValidationContext;
  let captureManifest: {
    captures: Array<{
      outputFile: string;
      localCommitSha?: string;
      deployedCommitSha?: string | null;
    }>;
  };

  beforeAll(() => {
    freeze = loadAndValidateContestFreeze();
    captureManifest = { captures: [] };
    context = {
      ...freezeContext(freeze),
      captureCount: 0,
      captures: [],
    };
  }, 240_000);

  it("preserves the candidate.4 tag as an immutable baseline", () => {
    const tagCommit = execFileSync(
      "git",
      ["rev-parse", `${CANDIDATE_4_TAG}^{commit}`],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();
    expect(tagCommit).toBe(CANDIDATE_4_COMMIT);
  });

  it("keeps the candidate.4 evidence pair PASS and blocks it against the expanded freeze", () => {
    const tagPointer = JSON.parse(
      gitShowText(POINTER_PATH, CANDIDATE_4_TAG),
    ) as ContestReleaseEvidence;
    const tagFreeze = JSON.parse(
      gitShowText(FREEZE_PATH, CANDIDATE_4_TAG),
    ) as ContestFreeze;
    const tagCaptureValue = JSON.parse(
      gitShowText("docs/contest/evidence-capture.json", CANDIDATE_4_TAG),
    ) as {
      captures: Array<{
        localCommitSha?: string;
        deployedCommitSha?: string | null;
      }>;
    };

    expect(tagFreeze.manifest.snapshotId).toBe(CANDIDATE_4_SNAPSHOT_ID);
    expect(tagFreeze.manifest.sha256).toBe(CANDIDATE_4_MANIFEST_SHA);

    const tagContext: ReleaseEvidenceValidationContext = {
      ...freezeContext(tagFreeze),
      captureCount: tagCaptureValue.captures.length,
      captures: tagCaptureValue.captures.map((capture) => ({
        localCommitSha: capture.localCommitSha,
        deployedCommitSha: capture.deployedCommitSha,
      })),
    };
    expect(
      validateContestReleaseEvidence(tagPointer, tagContext),
    ).toMatchObject({
      valid: true,
      status: "verified",
      capturesAreCurrent: true,
    });

    expect(() => validateContestReleaseEvidence(tagPointer, context)).toThrow(
      /coverageSourceCommitSha|frozen source/i,
    );
  });

  it("binds the checked-in pointer to the expanded freeze as a pending record", () => {
    const pointer = checkedInPointer();

    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: "pending",
      capturesAreCurrent: false,
    });

    expect(freeze.sourceCommitSha).toBe(EXPANDED_SOURCE_SHA);
    expect(pointer.coverageSourceCommitSha).toBe(EXPANDED_SOURCE_SHA);
    expect(pointer.coverageFreezeDocumentCommitSha).toBe(
      EXPANDED_FREEZE_COMMIT_SHA,
    );
    expect(pointer.coverageFreezeCommitSha).toBe(EXPANDED_FREEZE_COMMIT_SHA);
    expect(pointer.manifest.snapshotId).toBe(freeze.manifest.snapshotId);
    expect(pointer.manifest.sha256).toBe(freeze.manifest.sha256);
    expect(pointer.manifest.programs).toBe(
      freeze.manifest.resourceSnapshots.programs.recordCount,
    );
    expect(pointer.manifest.centers).toBe(
      freeze.manifest.resourceSnapshots.centers.recordCount,
    );
    expect(pointer.manifest.offerings).toBe(
      freeze.manifest.resourceSnapshots.trainingOfferings.recordCount,
    );
    expect(pointer.manifest.offers).toBe(
      freeze.manifest.resourceSnapshots.jobOffers.recordCount,
    );

    expect(pointer.publicationCommitSha).toBeNull();
    expect(pointer.captureProductCommitSha).toBeNull();
    expect(pointer.auditHeadSha).toBeNull();
    expect(pointer.localReviewHeadSha).toBeNull();
    for (const [key, gateValue] of Object.entries(pointer.localGates)) {
      expect(gateValue.status).toBe("pending");
      expect(gateValue.checkedCommitSha).toBeNull();
      expect(gateValue.verifiedAt).toBeNull();
      expect(key.length).toBeGreaterThan(0);
    }
    expect(pointer.localGates.evidenceManifest.captureCount).toBe(
      CAPTURE_COUNT,
    );
    expect(pointer.localGates.evidenceManifest).not.toHaveProperty("note");
    expect(pointer.deployment).toMatchObject({
      status: "pending",
      commitSha: null,
      workflowRunId: null,
      workflowUrl: null,
      liveRootVerified: false,
      verifiedAt: null,
      versionJsonCommitSha: null,
      versionJsonSchemaVersion: null,
    });
    expect(pointer.deployment.releaseTag ?? null).toBeNull();
    expect(pointer.publicVerification).toMatchObject({
      status: "pending",
      rootUrl: pointer.expectedRootUrl,
      rootHttpStatus: null,
      manifestSha256: null,
      verifiedAt: null,
    });
    expect(pointer.humanApproval).toEqual({
      finalApplicationTextApproved: false,
      rootUrlApproved: false,
      submissionAuthorized: false,
    });
    expect(pointer.blockers.length).toBeGreaterThan(0);
    expect(pointer.candidatePlan).toBeUndefined();
  });

  it("keeps the pending S-to-F git chain valid for the expanded freeze", () => {
    const pointer = checkedInPointer();
    expect(pointer.publicationCommitSha).toBeNull();
    expect(pointer.auditHeadSha).toBeNull();
    expect(captureManifest.captures).toHaveLength(CAPTURE_COUNT);

    expect(() =>
      assertContestReleaseGitChain(process.cwd(), {
        sourceCommitSha: freeze.sourceCommitSha,
        freezeCommitSha: pointer.coverageFreezeCommitSha,
        publicationCommitSha: null,
        evidenceCommitSha: null,
        freezePath: FREEZE_PATH,
        evidencePaths: [],
      }),
    ).not.toThrow();
  });

  it("blocks the expanded candidate against a tampered legacy source boundary", () => {
    const pointer = checkedInPointer();
    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: "pending",
    });

    const legacyFreeze = JSON.parse(JSON.stringify(freeze)) as ContestFreeze;
    legacyFreeze.sourceCommitSha = LEGACY_SOURCE_SHA;
    expect(() =>
      validateContestReleaseEvidence(pointer, freezeContext(legacyFreeze)),
    ).toThrow(/coverageSourceCommitSha|frozen source/i);
  });

  it("blocks the expanded candidate against a tampered snapshot identity", () => {
    const pointer = checkedInPointer();
    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: "pending",
    });

    const tamperedContext: ReleaseEvidenceValidationContext = {
      ...context,
      coverageFreeze: {
        ...context.coverageFreeze,
        manifest: {
          ...context.coverageFreeze.manifest,
          snapshotId: CANDIDATE_4_SNAPSHOT_ID,
        },
      },
    };
    expect(() =>
      validateContestReleaseEvidence(pointer, tamperedContext),
    ).toThrow(/manifest\.snapshotId|frozen source/i);
  });

  it("blocks the expanded candidate against a tampered manifest digest", () => {
    const pointer = checkedInPointer();
    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: "pending",
    });

    const tamperedContext: ReleaseEvidenceValidationContext = {
      ...context,
      coverageFreeze: {
        ...context.coverageFreeze,
        manifest: {
          ...context.coverageFreeze.manifest,
          sha256: CANDIDATE_4_MANIFEST_SHA,
        },
      },
    };
    expect(() =>
      validateContestReleaseEvidence(pointer, tamperedContext),
    ).toThrow(/manifest\.sha256|frozen source/i);
  });

  it("renders the checked-in documents from the expanded freeze without stale candidate claims", () => {
    const documents = renderContestSubmission(
      freeze,
      pendingDeploymentEvidence(),
    );

    for (const [name, content] of Object.entries(documents)) {
      const checkedIn = readFileSync(
        resolve(process.cwd(), "docs", "contest", name),
        "utf8",
      );
      expect(checkedIn).toBe(content);
    }

    expect(documents["application-summary.md"]).toContain(
      `${freeze.offers.matchedOfferCount} de las 1.058 ofertas de la instantánea`,
    );
    expect(documents["technical-evidence.md"]).toContain(
      `Snapshot | \`${freeze.manifest.snapshotId}\``,
    );
    expect(documents["technical-evidence.md"]).toContain(
      "Estos dos campos no se inventan antes de ejecutar y verificar el release.",
    );
    expect(documents["technical-evidence.md"]).toContain(
      "PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN",
    );
    expect(documents["submission-checklist.md"]).toContain(
      "- [ ] Ejecutar los gates de release y verificar la aplicación pública.",
    );
    expect(documents["submission-checklist.md"]).toContain(
      "- [ ] Captura automatizada A4: pendiente de recaptura y validación.",
    );
    for (const content of Object.values(documents)) {
      expect(content).not.toContain(CANDIDATE_4_SNAPSHOT_ID);
      expect(content).not.toContain(CANDIDATE_4_MANIFEST_SHA);
      expect(content).not.toContain("v2026.08.25-candidate.2");
      expect(content).not.toContain("v2026.08.27-candidate.4");
      expect(content).not.toContain("v2026.08.");
    }
  });
});
