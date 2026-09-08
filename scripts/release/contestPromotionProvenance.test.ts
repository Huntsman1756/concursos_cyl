import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import {
  loadContestDeploymentEvidence,
  renderContestSubmission,
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

const EXPANDED_SOURCE_SHA = "8bf3ab85aac3e4c08d1826280529e9a648cbe0cc";
const EXPANDED_FREEZE_COMMIT_SHA = "be3431cef26545e7a976ba68f2c111bddbe528e8";
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
    captureManifest = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "docs/contest/evidence-capture.json"),
        "utf8",
      ),
    ) as typeof captureManifest;
    context = {
      ...freezeContext(freeze),
      captureCount: captureManifest.captures.length,
      captures: captureManifest.captures.map((capture) => ({
        localCommitSha: capture.localCommitSha,
        deployedCommitSha: capture.deployedCommitSha,
      })),
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

  it("binds the checked-in pointer to the expanded freeze and the released candidate", () => {
    const pointer = checkedInPointer();

    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: pointer.status,
      capturesAreCurrent: pointer.status === "verified",
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

    if (pointer.status === "pending") {
      expect(pointer.publicationCommitSha).toBeNull();
      expect(pointer.deployment.status).toBe("pending");
      expect(pointer.publicVerification.status).toBe("pending");
      expect(pointer.captureProductCommitSha).toBeNull();
    } else {
      expect(pointer.schemaVersion).toBe(2);
      expect(pointer.publicationCommitSha).toMatch(/^[a-f0-9]{40}$/u);
      expect(pointer.publicationCommitSha).toBe(pointer.deployment.commitSha);
      expect(pointer.captureProductCommitSha).toBe(
        pointer.publicationCommitSha,
      );
      for (const gate of Object.values(pointer.localGates)) {
        expect(gate.status).toBe("passed");
        expect(gate.checkedCommitSha).toBe(pointer.publicationCommitSha);
        expect(gate.verifiedAt).not.toBeNull();
      }
      expect(pointer.publicVerification.rootHttpStatus).toBe(200);
    }
  });

  it("keeps the published S-to-F-to-P git chain valid for the expanded freeze", () => {
    const pointer = checkedInPointer();
    expect(pointer.coverageFreezeCommitSha).toMatch(/^[a-f0-9]{40}$/u);

    expect(() =>
      assertContestReleaseGitChain(process.cwd(), {
        sourceCommitSha: freeze.sourceCommitSha,
        freezeCommitSha: pointer.coverageFreezeCommitSha,
        publicationCommitSha: pointer.publicationCommitSha,
        evidenceCommitSha: null,
        freezePath: FREEZE_PATH,
        evidencePaths: [],
        publishedWithoutEvidenceCommit: true,
      }),
    ).not.toThrow();
  });

  it("blocks the expanded candidate against a tampered legacy source boundary", () => {
    const pointer = checkedInPointer();
    expect(validateContestReleaseEvidence(pointer, context)).toMatchObject({
      valid: true,
      status: pointer.status,
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
      status: pointer.status,
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
      status: pointer.status,
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
    const deploymentEvidence = loadContestDeploymentEvidence(
      process.cwd(),
      freeze,
    );
    const documents = renderContestSubmission(freeze, deploymentEvidence);

    for (const [name, content] of Object.entries(documents)) {
      const checkedIn = readFileSync(
        resolve(process.cwd(), "docs", "contest", name),
        "utf8",
      );
      expect(checkedIn).toBe(content);
    }

    expect(documents["application-summary.md"]).toContain(
      `${freeze.offers.matchedOfferCount} de las ${freeze.manifest.resourceSnapshots.jobOffers.recordCount.toLocaleString("es-ES", { useGrouping: "always" })} ofertas de la instantánea`,
    );
    expect(documents["technical-evidence.md"]).toContain(
      `Snapshot | \`${freeze.manifest.snapshotId}\``,
    );
    expect(documents["submission-checklist.md"]).toContain(
      deploymentEvidence.status === "verified"
        ? "- [x] Ejecutar los gates de release"
        : "- [ ] Ejecutar los gates de release",
    );
    for (const content of Object.values(documents)) {
      expect(content).not.toContain(CANDIDATE_4_SNAPSHOT_ID);
      expect(content).not.toContain(CANDIDATE_4_MANIFEST_SHA);
      expect(content).not.toContain("v2026.08.25-candidate.2");
      expect(content).not.toContain("v2026.08.27-candidate.4");
      expect(content).not.toContain("v2026.08.");
      if (deploymentEvidence.status === "verified")
        expect(content).not.toContain("PENDIENTE DE DESPLIEGUE");
    }
  });
});
