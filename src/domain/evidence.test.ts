import { describe, expect, it } from "vitest";
import type { JobOffer } from "../../data/schemas/generated";
import { deriveEvidenceState } from "./evidence";
import type { OfferMatch } from "./offerMatching";

const baseOffer: JobOffer = {
  id: "offer:1",
  title: "Personal administrativo",
  province: null,
  locality: null,
  publishedAt: null,
  updatedAt: null,
  sourceName: "ECYL",
  descriptionText: "Oferta con relación ocupacional.",
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

const baseMatch: OfferMatch = {
  offerId: baseOffer.id,
  occupationId: "occupation:administrative-assistant",
  relationshipType: "reviewed_relationship",
  matchRule: "title_alias_phrase",
  matchEvidence: "personal administrativo",
  sourceUrl: "https://example.test/mapping",
  offer: baseOffer,
  publishedRequirements: [],
};

describe("deriveEvidenceState", () => {
  it("does not create a gap from an unpublished requirement", () => {
    expect(deriveEvidenceState(baseMatch, {})).toBe(
      "occupational_relationship_incomplete",
    );
  });

  it("requires an in-memory lacks answer for a declared gap", () => {
    const requirement = {
      id: "requirement:license",
      category: "driving_license_or_vehicle" as const,
      normalizedValue: "B",
      sourceQuote: "Permiso de conducir B.",
      parserRule: "license.driving_class",
      parserVersion: "1.0.0" as const,
    };
    const match = {
      ...baseMatch,
      publishedRequirements: [requirement],
    };
    expect(deriveEvidenceState(match, {})).toBe(
      "occupational_relationship_incomplete",
    );
    expect(deriveEvidenceState(match, { [requirement.id]: "lacks" })).toBe(
      "declared_explicit_gap",
    );
  });

  it("recognizes exact occupation evidence as explicit fit", () => {
    expect(
      deriveEvidenceState({ ...baseMatch, matchRule: "title_alias_exact" }, {}),
    ).toBe("explicit_fit");
  });
});
