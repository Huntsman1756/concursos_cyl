import { describe, expect, it } from "vitest";
import {
  validateContestClaims,
  type ContestClaimContext,
} from "./validateContestClaims";

const validClaim = {
  claimId: "problem-audience",
  text: "Ayuda a personas de Castilla y León a explorar decisiones formativas.",
  status: "invariant",
  evidenceType: "test",
  evidenceRef: "tests/e2e/contest-readiness.spec.ts#root",
  allowedDocuments: ["application-summary.md"],
  forbiddenParaphrases: ["garantiza empleo"],
} as const;

const coverageFreezeContext = {
  manifest: { snapshotId: "snapshot-1" },
  coverage: {
    distinctQualificationCount: 3,
    modalityKeys: ["A", "B"],
    approvedRelationKeys: ["A|occupation:cno11:1111"],
    approvedAliasKeys: ["albañil|occupation:cno11:7111"],
    zeroReviewedRelationCount: 1,
    deferredPrograms: ["C"],
  },
  offers: { matchedOfferCount: 2 },
};
const claimContext: ContestClaimContext = {
  coverageFreeze: coverageFreezeContext,
  releaseEvidence: {
    deployment: { commitSha: "a".repeat(40), workflowRunId: "123" },
    humanApproval: {
      finalApplicationTextApproved: false,
      rootUrlApproved: false,
      submissionAuthorized: false,
    },
  },
};

describe("contest claim validator", () => {
  it("accepts strict claims with source-bound evidence", () => {
    expect(validateContestClaims([validClaim])).toEqual({
      valid: true,
      errors: [],
    });
  });

  it("rejects unknown fields and duplicate claim IDs", () => {
    const duplicate = { ...validClaim, extra: true };
    expect(() => validateContestClaims([validClaim, duplicate])).toThrow(
      /unknown field|duplicate claimId/iu,
    );
    expect(() =>
      validateContestClaims([validClaim, { ...validClaim }]),
    ).toThrow(/duplicate claimId/iu);
  });

  it("rejects freeze-derived numeric prose and missing evidence", () => {
    expect(() =>
      validateContestClaims([
        {
          ...validClaim,
          claimId: "freeze-count",
          status: "freeze_derived",
          text: "Hay 67 cualificaciones revisadas.",
          evidenceType: "manifest_field",
          evidenceRef: "",
        },
      ]),
    ).toThrow(/evidenceRef|provisional numeric/iu);
  });

  it("rejects salary or employment claims and deep-link submitted URLs", () => {
    expect(() =>
      validateContestClaims([
        {
          ...validClaim,
          claimId: "unsafe",
          text: "Predice salario esperado y usa /desde-fp/IFC03S como URL enviada.",
        },
      ]),
    ).toThrow(/salary|employment|deep-link/iu);
  });

  it("finds forbidden claims in scoped repository documents", () => {
    expect(() =>
      validateContestClaims([validClaim], {
        documents: [{ path: "README.md", text: "67 como cobertura total" }],
      }),
    ).toThrow(/forbidden claim/iu);
  });

  it("accepts symbolic freeze evidence and rejects unsafe document paths", () => {
    expect(() =>
      validateContestClaims([
        {
          ...validClaim,
          claimId: "freeze_missing_token",
          status: "freeze_derived",
          evidenceType: "manifest_field",
          evidenceRef: "coverageFreeze.manifest.snapshotId",
          text: "La instantánea {coverageFreeze.manifest.snapshotId} está lista.",
        },
      ]),
    ).not.toThrow();
    expect(() =>
      validateContestClaims([
        {
          ...validClaim,
          claimId: "unsafe_path",
          allowedDocuments: ["../README.md"],
        },
      ]),
    ).toThrow(/allowedDocuments/iu);
  });

  it("resolves freeze-derived tokens against the typed coverageFreeze/releaseEvidence namespaces", () => {
    expect(
      validateContestClaims(
        [
          {
            ...validClaim,
            claimId: "freeze-snapshot",
            status: "freeze_derived",
            evidenceType: "manifest_field",
            evidenceRef: "coverageFreeze.manifest.snapshotId",
            text: "La instantánea publicada es {coverageFreeze.manifest.snapshotId}.",
          },
          {
            ...validClaim,
            claimId: "deployment-workflow",
            status: "freeze_derived",
            evidenceType: "workflow_run",
            evidenceRef: "releaseEvidence.deployment.workflowRunId",
            text: "La versión observada usa el run {releaseEvidence.deployment.workflowRunId}.",
          },
          {
            ...validClaim,
            claimId: "submission-authorization",
            status: "freeze_derived",
            evidenceType: "human_confirmation",
            evidenceRef: "releaseEvidence.humanApproval.submissionAuthorized",
            text: "El envío depende de {releaseEvidence.humanApproval.submissionAuthorized}.",
          },
        ],
        { claimContext },
      ),
    ).toEqual({ valid: true, errors: [] });

    expect(
      (
        claimContext.releaseEvidence as {
          humanApproval: { submissionAuthorized: boolean };
        }
      ).humanApproval.submissionAuthorized,
    ).toBe(false);
  });

  it("rejects unknown, missing, and mistyped claim paths", () => {
    const base = {
      ...validClaim,
      status: "freeze_derived" as const,
      evidenceType: "manifest_field" as const,
    };

    expect(() =>
      validateContestClaims(
        [
          {
            ...base,
            claimId: "unknown-path",
            evidenceRef: "coverageFreeze.manifest.snapshotId",
            text: "Valor {coverageFreeze.manifest.snapshotId} y {coverageFreeze.manifest.notAField}.",
          },
        ],
        { claimContext },
      ),
    ).toThrow(/unknown|path|namespace/i);

    expect(() =>
      validateContestClaims(
        [
          {
            ...base,
            claimId: "second-token-wrong-type",
            evidenceRef: "coverageFreeze.manifest.snapshotId",
            text: "Instantánea {coverageFreeze.manifest.snapshotId}; total {coverageFreeze.coverage.distinctQualificationCount}.",
          },
        ],
        {
          claimContext: {
            ...claimContext,
            coverageFreeze: {
              ...coverageFreezeContext,
              coverage: {
                ...coverageFreezeContext.coverage,
                distinctQualificationCount: "3",
              },
            },
          },
        },
      ),
    ).toThrow(/type|number|distinctQualificationCount/i);

    expect(() =>
      validateContestClaims(
        [
          {
            ...base,
            claimId: "missing-path",
            evidenceRef: "coverageFreeze.coverage.modalityKeys",
            text: "Modalidades {coverageFreeze.coverage.modalityKeys}.",
          },
        ],
        {
          claimContext: {
            ...claimContext,
            coverageFreeze: {
              ...coverageFreezeContext,
              coverage: {
                ...coverageFreezeContext.coverage,
                modalityKeys: undefined,
              },
            },
          },
        },
      ),
    ).toThrow(/missing|undefined|path/i);

    expect(() =>
      validateContestClaims(
        [
          {
            ...base,
            claimId: "mistyped-path",
            evidenceRef: "coverageFreeze.manifest.snapshotId",
            text: "Instantánea {coverageFreeze.manifest.snapshotId}.",
          },
        ],
        {
          claimContext: {
            ...claimContext,
            coverageFreeze: {
              ...coverageFreezeContext,
              manifest: { snapshotId: 123 },
            },
          },
        },
      ),
    ).toThrow(/type|string|snapshotId/i);
  });
});
