import { describe, expect, it } from "vitest";

import type { JobOffer, TrainingProgram } from "../../data/schemas/generated";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  deriveEvidenceState,
  orderOfferMatches,
  SessionAnswersSchema,
} from "./evidence";
import { matchOffersForProgram, type OfferMatchingData } from "./offerMatching";
import { publishedRequirementId } from "./requirements";

const occupationId = "occupation:cno11:2713";
const program: TrainingProgram = {
  programKey: "IFC03S",
  programTitle: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};
const occupation: Occupation = {
  occupationId,
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
};
const alias: OccupationAlias = {
  alias: "desarrollador web",
  occupationId,
  reviewStatus: "approved",
  reviewedAt: "2026-08-04",
  mappingVersion: "1.0.0",
};
const link: TrainingOccupationLink = {
  trainingProgramKey: program.programKey,
  occupationId,
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
  sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
  reviewedAt: "2026-08-04",
  mappingVersion: "1.0.0",
};

function offer(id: string, title: string, publishedAt: string): JobOffer {
  return {
    id,
    title,
    province: null,
    locality: null,
    publishedAt,
    sourceName: "ECYL",
    descriptionText: "",
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    },
    originalUrl: `https://empleo.jcyl.es/${id}`,
    sourceSnapshot: {
      sourceId: "ecyl-job-offers",
      sourceUrl: "https://datosabiertos.jcyl.es/",
      sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
      snapshotFetchedAt: "2026-08-02T00:00:00.000Z",
      schemaVersion: "1.0.0",
      recordCount: 3,
      sha256: "b".repeat(64),
      qualityStatus: "passed",
    },
  };
}

function fixture() {
  const sourceQuote = "Permiso de conducir B.";
  const gapOffer = offer(
    "offer:gap",
    "Desarrollador web",
    "2026-08-03T00:00:00.000Z",
  );
  const requirement = {
    id: publishedRequirementId(
      gapOffer.id,
      "driving_license_or_vehicle",
      sourceQuote,
    ),
    category: "driving_license_or_vehicle" as const,
    normalizedValue: "B" as const,
    sourceQuote,
    parserRule: "license.driving_b" as const,
    parserVersion: "1.0.0" as const,
  };
  const phraseOffer = offer(
    "offer:phrase",
    "Desarrollador web junior",
    "2026-08-04T00:00:00.000Z",
  );
  const explicitOffer = offer(
    "offer:explicit",
    "DESARROLLADOR WEB",
    "2026-08-02T00:00:00.000Z",
  );
  const data: OfferMatchingData = {
    programs: [program],
    occupations: [occupation],
    aliases: [alias],
    links: [link],
    offers: [gapOffer, phraseOffer, explicitOffer],
    publishedRequirements: [
      { offerId: gapOffer.id, requirements: [requirement] },
    ],
    humanOverrides: [],
  };
  return {
    matches: matchOffersForProgram(program.programKey, data),
    requirement,
  };
}

describe("deriveEvidenceState", () => {
  it("creates a gap only from a real published requirement answered lacks", () => {
    const { matches, requirement } = fixture();
    const match = matches.find(({ offerId }) => offerId === "offer:gap");

    expect(deriveEvidenceState(match!, { [requirement.id]: "lacks" })).toBe(
      "declared_explicit_gap",
    );
    expect(match?.requirements).toEqual([
      expect.objectContaining({
        id: requirement.id,
        sourceQuote: requirement.sourceQuote,
      }),
    ]);
  });

  it("ignores stale answer IDs and never turns absence into a gap", () => {
    const { matches } = fixture();
    const phrase = matches.find(({ offerId }) => offerId === "offer:phrase");

    expect(deriveEvidenceState(phrase!, { "requirement:stale": "lacks" })).toBe(
      "occupational_relationship_incomplete",
    );
    expect(deriveEvidenceState(phrase!, {})).toBe(
      "occupational_relationship_incomplete",
    );
  });

  it("keeps has and unsure neutral while exact approved evidence remains explicit", () => {
    const { matches, requirement } = fixture();
    const phrase = matches.find(({ offerId }) => offerId === "offer:phrase");
    const exact = matches.find(({ offerId }) => offerId === "offer:explicit");

    expect(deriveEvidenceState(phrase!, { [requirement.id]: "has" })).toBe(
      "occupational_relationship_incomplete",
    );
    expect(deriveEvidenceState(phrase!, { [requirement.id]: "unsure" })).toBe(
      "occupational_relationship_incomplete",
    );
    expect(deriveEvidenceState(exact!, {})).toBe("explicit_fit");
  });

  it("exposes a closed answer contract", () => {
    expect(
      SessionAnswersSchema.safeParse({ "requirement:1": "has" }).success,
    ).toBe(true);
    expect(
      SessionAnswersSchema.safeParse({ "requirement:1": "maybe" }).success,
    ).toBe(false);
  });
});

describe("orderOfferMatches", () => {
  it("orders by evidence group, publication date descending and stable offer ID", () => {
    const { matches, requirement } = fixture();
    const sameDateData: OfferMatchingData = {
      programs: [program],
      occupations: [occupation],
      aliases: [alias],
      links: [link],
      offers: [
        offer("offer:z", "Desarrollador web", "2026-08-05T00:00:00.000Z"),
        offer("offer:a", "Desarrollador web", "2026-08-05T00:00:00.000Z"),
      ],
      publishedRequirements: [],
      humanOverrides: [],
    };
    const all = [
      ...matches,
      ...matchOffersForProgram(program.programKey, sameDateData),
    ];

    expect(
      orderOfferMatches(all, { [requirement.id]: "lacks" }).map(
        ({ offerId }) => offerId,
      ),
    ).toEqual([
      "offer:a",
      "offer:z",
      "offer:explicit",
      "offer:phrase",
      "offer:gap",
    ]);
  });

  it("rejects duplicate offer matches before sorting", () => {
    const { matches } = fixture();
    expect(() => orderOfferMatches([matches[0], matches[0]], {})).toThrow(
      /unique/i,
    );
  });
});
