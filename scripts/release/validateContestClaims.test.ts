import { describe, expect, it } from "vitest";
import { validateContestClaims } from "./validateContestClaims";

const validClaim = {
  claimId: "problem-audience",
  text: "Ayuda a personas de Castilla y León a explorar decisiones formativas.",
  status: "invariant",
  evidenceType: "test",
  evidenceRef: "tests/e2e/contest-readiness.spec.ts#root",
  allowedDocuments: ["application-summary.md"],
  forbiddenParaphrases: ["garantiza empleo"],
} as const;

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

  it("requires symbolic freeze evidence and safe document paths", () => {
    expect(() =>
      validateContestClaims([
        {
          ...validClaim,
          claimId: "freeze_missing_token",
          status: "freeze_derived",
          evidenceType: "manifest_field",
          evidenceRef: "manifest.snapshotId",
          text: "La instantánea está lista.",
        },
      ]),
    ).toThrow(/symbolic token/iu);
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
});
