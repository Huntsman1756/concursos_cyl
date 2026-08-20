import { describe, expect, it } from "vitest";

import type { TrainingOccupationLink } from "../../data/schemas/curatedMappings";
import { mergeFrontierReviewedCoverage } from "./restoreFrontierReviewedCoverage";

const base = {
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://www.todofp.es/example",
  sourceQuote: "Una salida profesional oficial suficientemente extensa.",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
} as const;

describe("mergeFrontierReviewedCoverage", () => {
  it("fails closed when the reviewed source does not contain every accepted key", () => {
    const current: TrainingOccupationLink[] = [];
    expect(() => mergeFrontierReviewedCoverage(current, [])).toThrow(
      /Expected one approved reviewed relationship/u,
    );
  });

  it("rejects a current non-approved relationship instead of overwriting it", () => {
    const current = [
      {
        ...base,
        trainingProgramKey: "ADG01S",
        occupationId: "occupation:cno11:4223",
        reviewStatus: "draft",
        reviewNote: "Pendiente de una revisión oficial adicional.",
      },
    ];
    const reviewed = [
      {
        ...base,
        trainingProgramKey: "ADG01S",
        occupationId: "occupation:cno11:4223",
      },
    ];
    expect(() => mergeFrontierReviewedCoverage(current, reviewed)).toThrow(
      /is not approved/u,
    );
  });
});
