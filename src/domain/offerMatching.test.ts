import { describe, expect, it } from "vitest";
import type { JobOffer } from "../../data/schemas/generated";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import { matchOffersForProgram } from "./offerMatching";

const occupation: Occupation = {
  occupationId: "occupation:administrative-assistant",
  preferredLabel: "Personal administrativo",
  description: "Realiza tareas de gestión y apoyo administrativo.",
};
const alias: OccupationAlias = {
  occupationId: occupation.occupationId,
  alias: "auxiliar administrativo",
  reviewStatus: "approved",
  sourceUrl: "https://example.test/source",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
};
const link: TrainingOccupationLink = {
  trainingProgramKey: "ADG01M",
  occupationId: occupation.occupationId,
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://example.test/mapping",
  sourceQuote: "Gestión Administrativa",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
};

function offer(id: string, title: string, publishedAt: string): JobOffer {
  return {
    id,
    title,
    province: "Valladolid",
    locality: "Valladolid",
    publishedAt,
    updatedAt: null,
    sourceName: "ECYL",
    descriptionText: title,
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    },
    publishedRequirements: [],
    originalUrl: "https://example.test/offer/" + id,
    snapshot: {
      sourceId: "jcyl-employment-offers",
      snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
    },
  };
}

describe("matchOffersForProgram", () => {
  it("matches an offer through a reviewed occupation alias and records evidence", () => {
    const matches = matchOffersForProgram("ADG01M", {
      occupations: [occupation],
      aliases: [alias],
      links: [link],
      offers: [
        offer("offer:1", "Auxiliar administrativo", "2026-08-13T00:00:00Z"),
      ],
    });

    expect(matches[0]).toMatchObject({
      offerId: "offer:1",
      occupationId: "occupation:administrative-assistant",
      matchRule: "title_alias_exact",
      relationshipType: "official_output",
    });
  });

  it("orders current publications before older ones without a score", () => {
    const matches = matchOffersForProgram("ADG01M", {
      occupations: [occupation],
      aliases: [alias],
      links: [link],
      offers: [
        offer("offer:old", "Auxiliar administrativo", "2026-08-01T00:00:00Z"),
        offer(
          "offer:new",
          "Auxiliar administrativo en oficina",
          "2026-08-13T00:00:00Z",
        ),
      ],
    });
    expect(matches.map((match) => match.offerId)).toEqual([
      "offer:new",
      "offer:old",
    ]);
  });
});
