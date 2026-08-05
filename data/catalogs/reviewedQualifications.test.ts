import { describe, expect, it } from "vitest";

import {
  qualificationCatalogKey,
  REVIEWED_QUALIFICATIONS,
  ReviewedQualificationsCatalogSchema,
  reviewedQualificationLabel,
} from "./reviewedQualifications";

describe("reviewed qualification catalog", () => {
  it("normalizes only safe presentation differences", () => {
    expect(reviewedQualificationLabel(" • GRADO EN ENFERMERÍA. ")).toBe(
      "Grado en Enfermería",
    );
    expect(qualificationCatalogKey("Grado en Derecho / otro")).toContain("/");
    expect(
      reviewedQualificationLabel("Grado en Derecho o similar"),
    ).toBeUndefined();
    expect(reviewedQualificationLabel("Grado en Astronomía")).toBeUndefined();
  });

  it("is strict and rejects duplicate normalized labels", () => {
    const first = REVIEWED_QUALIFICATIONS[0];
    expect(
      ReviewedQualificationsCatalogSchema.safeParse([
        { ...first, unexpected: true },
      ]).success,
    ).toBe(false);
    expect(
      ReviewedQualificationsCatalogSchema.safeParse([
        first,
        {
          ...first,
          catalogId: "qualification:duplicate-label",
          acceptedLabels: [first.acceptedLabels[0].toLocaleUpperCase("es-ES")],
        },
      ]).success,
    ).toBe(false);
  });
});
