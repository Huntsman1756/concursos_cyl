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

  it("requires each canonical label to be an accepted label", () => {
    const first = REVIEWED_QUALIFICATIONS[0];
    expect(
      ReviewedQualificationsCatalogSchema.safeParse([
        { ...first, canonicalLabel: "Una salida distinta" },
      ]).success,
    ).toBe(false);
  });

  it("rejects duplicate normalized canonical labels across entries", () => {
    const [first, second] = REVIEWED_QUALIFICATIONS;
    const result = ReviewedQualificationsCatalogSchema.safeParse([
      first,
      {
        ...second,
        canonicalLabel: first.canonicalLabel.toLocaleUpperCase("es-ES"),
        acceptedLabels: [
          ...second.acceptedLabels,
          first.canonicalLabel.toLocaleUpperCase("es-ES"),
        ],
      },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [1, "canonicalLabel"],
            message: expect.stringMatching(/canonical labels must be unique/i),
          }),
        ]),
      );
    }
  });

  it("accepts the reviewed catalog as its valid control", () => {
    expect(
      ReviewedQualificationsCatalogSchema.safeParse(REVIEWED_QUALIFICATIONS)
        .success,
    ).toBe(true);
  });
});
