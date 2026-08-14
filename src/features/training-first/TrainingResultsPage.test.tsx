import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type {
  JobOffer,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../../data/schemas/curatedMappings";
import { TrainingResultsPage } from "./TrainingResultsPage";
import type { TrainingFeatureData } from "./trainingData";

const program: TrainingProgram = {
  programKey: "ADG01M",
  programTitle: "Gestión Administrativa",
  level: "intermediate",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
};
const occupation: Occupation = {
  occupationId: "occupation:administrative-assistant",
  preferredLabel: "Personal administrativo",
  description: "Realiza tareas de gestión y apoyo administrativo.",
};
const alias: OccupationAlias = {
  occupationId: occupation.occupationId,
  alias: "auxiliar administrativo",
  reviewStatus: "approved",
  sourceUrl: "https://example.test/alias",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
};
const link: TrainingOccupationLink = {
  trainingProgramKey: "ADG01M",
  occupationId: occupation.occupationId,
  relationshipType: "reviewed_relationship",
  reviewStatus: "approved",
  sourceUrl: "https://example.test/mapping",
  sourceQuote: "Gestión Administrativa",
  reviewedAt: "2026-08-14",
  mappingVersion: "1.0.0",
};
const offer: JobOffer = {
  id: "offer:1",
  title: "Auxiliar administrativo",
  province: "Valladolid",
  locality: "Valladolid",
  publishedAt: "2026-08-14T00:00:00.000Z",
  updatedAt: null,
  sourceName: "ECYL",
  descriptionText: "Oferta de apoyo administrativo.",
  descriptionSections: {
    summary: [],
    functions: [],
    requirements: ["Permiso de conducir B."],
    conditions: [],
    application: [],
    other: [],
  },
  publishedRequirements: [
    {
      id: "requirement:license",
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      sourceQuote: "Permiso de conducir B.",
      parserRule: "license.driving_class",
      parserVersion: "1.0.0",
    },
  ],
  originalUrl: "https://example.test/offer/1",
  snapshot: {
    sourceId: "jcyl-employment-offers",
    snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
  },
};

const data: TrainingFeatureData = {
  programs: [program],
  offers: [offer],
  occupations: [occupation],
  aliases: [alias],
  links: [link],
  manifest: {
    schemaVersion: "1.0.0",
    generatedAt: "2026-08-14T00:00:00.000Z",
    qualityStatus: "passed",
    sources: {
      training: {
        sourceId: "training",
        sourceUrl: "https://example.test/training",
        sourceUpdatedAt: null,
        snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
        schemaVersion: "1.0.0",
        recordCount: 1,
        sha256: "0".repeat(64),
        qualityStatus: "passed",
      },
      offers: {
        sourceId: "offers",
        sourceUrl: "https://example.test/offers",
        sourceUpdatedAt: null,
        snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
        schemaVersion: "1.0.0",
        recordCount: 1,
        sha256: "0".repeat(64),
        qualityStatus: "passed",
      },
    },
    counts: { programs: 1, centers: 0, offerings: 0, offers: 1 },
  },
};

describe("TrainingResultsPage", () => {
  it("renders evidence in the approved narrative order without a compatibility score", () => {
    render(
      <MemoryRouter>
        <TrainingResultsPage programKey="ADG01M" data={data} />
      </MemoryRouter>,
    );

    const headings = screen
      .getAllByRole("heading")
      .map((node) => node.textContent);
    expect(headings).toEqual(
      expect.arrayContaining([
        "Por qué aparece",
        "Qué publica la vacante",
        "Tu comprobación",
        "Siguiente acción",
      ]),
    );
    expect(screen.queryByText(/% de compatibilidad/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Permiso de conducir B\./)).toBeVisible();
  });
});
