import { describe, expect, it } from "vitest";
import type { JobOffer } from "../../data/schemas/generated";
import { deriveActions } from "./actionEngine";

const offer: JobOffer = {
  id: "offer:1",
  title: "Personal administrativo",
  province: "Ávila",
  locality: null,
  publishedAt: null,
  updatedAt: null,
  sourceName: "ECYL",
  descriptionText: "Oferta administrativa.",
  descriptionSections: {
    summary: [],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  },
  publishedRequirements: [],
  originalUrl: "https://example.test/offer/1",
  snapshot: {
    sourceId: "jcyl-employment-offers",
    snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
  },
};

describe("deriveActions", () => {
  it("sends requirement verification to the original offer first", () => {
    const actions = deriveActions({
      evidenceState: "occupational_relationship_incomplete",
      offer,
    });
    expect(actions[0]).toMatchObject({
      actionType: "verify_offer_requirements",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      href: offer.originalUrl,
    });
  });

  it("sends missing qualification to the official FP dataset", () => {
    expect(
      deriveActions({
        evidenceState: "declared_explicit_gap",
        offer,
        missingQualification: true,
        programKey: "ADG01M",
      }),
    ).toContainEqual(
      expect.objectContaining({
        actionType: "view_regulated_training_route",
        targetKind: "regulated_training",
        datasetKey: "oferta-de-formacion-profesional",
      }),
    );
  });

  it("does not add a location action when remote work is explicit", () => {
    expect(
      deriveActions({
        evidenceState: "explicit_fit",
        offer,
        location: {
          selectedProvince: "Valladolid",
          offerProvince: "Ávila",
          remoteModePublished: true,
        },
      }).map((item) => item.actionType),
    ).not.toContain("adjust_search_area");
  });
});
