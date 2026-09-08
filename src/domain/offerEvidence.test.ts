import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  OfferEvidenceResourceSchema,
  type OfferEvidenceRecord,
} from "../../data/schemas/offerEvidence";
import {
  filterOfferEvidenceRecords,
  offerEvidenceCategoryLabel,
  offerEvidenceStatusLabel,
  sortOfferEvidenceRecords,
} from "./offerEvidence";

function record(
  overrides: Partial<OfferEvidenceRecord> = {},
): OfferEvidenceRecord {
  return {
    offerId: "offer-1",
    title: "CUIDADORES DE PERSONAS EN INSTITUCIONES",
    occupationLabel: "CUIDADORES DE PERSONAS EN INSTITUCIONES",
    province: "Burgos",
    locality: "Burgos",
    sourceName: "ECYL",
    employer: null,
    status: "published_in_snapshot",
    publishedAt: "2026-08-18T00:00:00.000Z",
    sourceDate: "2026-08-18T00:00:00.000Z",
    freshnessDate: "2026-08-20T00:00:00.000Z",
    sourceUrl: "https://example.com/dataset",
    originalUrl: "https://example.com/offer-1",
    evidenceStatus: "ambiguous_requirement",
    hasAmbiguousRequirements: true,
    requirements: [
      {
        requirementId:
          "requirement:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        literalRequirement: "Se valorará formación relacionada.",
        normalizedCategory: "unknown",
        normalizedValue: null,
        classificationStatus: "ambiguous",
        parserRule: "unclassified.ambiguous_or_negated",
        sourceUrl: "https://example.com/offer-1",
        sourceDate: "2026-08-18T00:00:00.000Z",
      },
    ],
    relations: [],
    nextActions: [
      {
        actionType: "open_original_offer",
        targetKind: "external",
        label: "Abrir la oferta original",
        href: "https://example.com/offer-1",
        reason: "Comprobar la publicación.",
      },
    ],
    ...overrides,
  };
}

describe("offer evidence domain", () => {
  it("filters accents, status and province without changing the source records", () => {
    const records = [
      record(),
      record({ offerId: "offer-2", province: "León" }),
    ];

    expect(
      filterOfferEvidenceRecords(records, {
        query: "cuidador",
        status: "ambiguous_requirement",
        province: "Burgos",
      }).map(({ offerId }) => offerId),
    ).toEqual(["offer-1"]);
    expect(records[0]?.requirements[0]?.literalRequirement).toBe(
      "Se valorará formación relacionada.",
    );
  });

  it("sorts by publication date and then stable title/id", () => {
    const records = [
      record({
        offerId: "older",
        publishedAt: "2026-07-01T00:00:00.000Z",
        sourceDate: "2026-07-01T00:00:00.000Z",
      }),
      record({
        offerId: "newer",
        publishedAt: "2026-08-20T00:00:00.000Z",
        sourceDate: "2026-08-20T00:00:00.000Z",
      }),
    ];
    expect(
      sortOfferEvidenceRecords(records).map(({ offerId }) => offerId),
    ).toEqual(["newer", "older"]);
  });

  it("puts a reviewed FP link ahead of a newer unlinked offer without mutating input", () => {
    const manifest = JSON.parse(
      readFileSync("public/data/v1/manifest.json", "utf8"),
    );
    const evidence = OfferEvidenceResourceSchema.parse(
      JSON.parse(
        readFileSync(
          `public${manifest.resourceSnapshots.offerEvidence.resourcePath}`,
          "utf8",
        ),
      ),
    );
    const relation = evidence.records.find((row) => row.relations.length > 0)!
      .relations[0]!;
    const unlinked = record({
      offerId: "new-unlinked",
      publishedAt: "2026-09-08",
    });
    const linked = record({
      offerId: "old-linked",
      publishedAt: "2026-08-01",
      relations: [relation],
    });
    const input = [unlinked, linked];
    expect(sortOfferEvidenceRecords(input).map((row) => row.offerId)).toEqual([
      "old-linked",
      "new-unlinked",
    ]);
    expect(input[0]).toBe(unlinked);
  });

  it("exposes only the small user-facing taxonomy", () => {
    expect(offerEvidenceStatusLabel("reviewed_fp_relationship")).toBe(
      "Relación FP revisada",
    );
    expect(offerEvidenceCategoryLabel("unknown")).toBe("Sin clasificar");
    expect(OfferEvidenceResourceSchema.shape.records).toBeDefined();
  });
});
