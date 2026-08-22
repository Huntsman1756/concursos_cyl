import { describe, expect, it } from "vitest";

import {
  renderContestSubmission,
  type ContestDeploymentEvidence,
} from "./renderContestSubmission";

const freeze = {
  schemaVersion: "1.0.0",
  freezeStatus: "frozen",
  sourceCommitSha: "a".repeat(40),
  manifest: {
    path: "public/data/v1/manifest.json",
    sha256: "b".repeat(64),
    generatedAt: "2026-08-22T00:00:00.000Z",
    snapshotId: "20260822000000000-aaaaaaaaaaaa",
    qualityStatus: "passed",
    qualityCounts: { centers: 1, programs: 1, offerings: 1, offers: 1 },
    resourceSnapshots: {
      programs: {
        resourcePath: "/data/v1/snapshots/current/programs.json",
        sha256: "c".repeat(64),
        recordCount: 1,
      },
      officialOccupations: {
        resourcePath: "/data/v1/snapshots/current/official-occupations.json",
        sha256: "d".repeat(64),
        recordCount: 1,
      },
      jobOffers: {
        resourcePath: "/data/v1/snapshots/current/job-offers.json",
        sha256: "e".repeat(64),
        recordCount: 1,
      },
    },
  },
  coverage: {
    distinctQualificationKeys: ["qualification:A"],
    distinctQualificationCount: 1,
    modalityKeys: ["A"],
    modalityKeyCount: 1,
    approvedRelationKeys: ["A|occupation:cno11:1111"],
    approvedRelationCount: 1,
    approvedAliasKeys: [],
    approvedAliasCount: 0,
    matchedProgramKeys: ["A"],
    matchedProgramCount: 1,
    zeroReviewedProgramKeys: [],
    zeroReviewedProgramCount: 0,
    matchedRelationKeys: ["A|occupation:cno11:1111"],
    matchedRelationCount: 1,
    zeroReviewedRelationKeys: [],
    zeroReviewedRelationCount: 0,
    deferredPrograms: [],
    deferredProgramCount: 0,
  },
  offers: {
    matchedOfferIds: ["offer-1"],
    matchedOfferCount: 1,
    marginalOfferDeltas: { unionOfferIds: [], unionOfferCount: 0 },
  },
  attempts: {
    completed: 1,
    deferred: 0,
    discarded: 0,
    terminal: 1,
    reserveUnattempted: 0,
  },
  deployment: {
    expectedRootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
    status: "pending",
  },
} as never;

describe("contest submission manual gates", () => {
  it("never auto-checks visual review or figure confirmation for current captures", () => {
    const deployment: ContestDeploymentEvidence = {
      status: "verified",
      commitSha: "f".repeat(40),
      workflowRunId: "123",
      verifiedAt: "2026-08-22T00:00:00.000Z",
      captureProductCommitSha: "f".repeat(40),
      captureCount: 1,
      capturesAreCurrent: true,
    };
    const rendered = renderContestSubmission(freeze, deployment);

    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Revisar las capturas en contexto anónimo",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "- [ ] Confirmar que las cifras visibles siguen coincidiendo",
    );
    expect(rendered["submission-checklist.md"]).not.toContain(
      "- [x] Revisar las capturas",
    );
  });
});
