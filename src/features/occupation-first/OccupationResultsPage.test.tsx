import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { TrainingFeatureData } from "../training-first/trainingData";
import { OccupationResultsPage } from "./OccupationResultsPage";

const data = {
  programs: [
    {
      programKey: "IFC03S",
      programTitle: "Desarrollo de Aplicaciones Web",
      level: "higher" as const,
      familyCode: "IFC",
      familyName: "Informática y Comunicaciones",
    },
  ],
  centers: [
    {
      centerCode: "47000000",
      centerName: "IES Río Esgueva",
      province: "Valladolid",
      locality: "Valladolid",
      address: null,
      phone: null,
      email: null,
      website: null,
    },
  ],
  offerings: [
    {
      programKey: "IFC03S",
      programTitle: "Desarrollo de Aplicaciones Web",
      level: "higher" as const,
      familyCode: "IFC",
      familyName: "Informática y Comunicaciones",
      centerCode: "47000000",
      province: "Valladolid",
      locality: "Valladolid",
      modality: "on_site" as const,
    },
  ],
  offers: [],
  occupations: [
    {
      occupationId: "occupation:web-development",
      preferredLabel: "Desarrollador web",
      description: "Diseña y mantiene aplicaciones web públicas.",
    },
  ],
  aliases: [],
  links: [
    {
      trainingProgramKey: "IFC03S",
      occupationId: "occupation:web-development",
      relationshipType: "reviewed_relationship" as const,
      reviewStatus: "approved" as const,
      sourceUrl: "https://example.test/source",
      sourceQuote: "Desarrollo de Aplicaciones Web",
      reviewedAt: "2026-08-14",
      mappingVersion: "1.0.0",
    },
  ],
  manifest: {
    schemaVersion: "1.0.0" as const,
    generatedAt: "2026-08-14T00:00:00.000Z",
    qualityStatus: "passed" as const,
    sources: {
      training: {
        sourceId: "training",
        sourceUrl: "https://example.test/training",
        sourceUpdatedAt: null,
        snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
        schemaVersion: "1.0.0" as const,
        recordCount: 1,
        sha256: "0".repeat(64),
        qualityStatus: "passed" as const,
      },
      offers: {
        sourceId: "offers",
        sourceUrl: "https://example.test/offers",
        sourceUpdatedAt: null,
        snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
        schemaVersion: "1.0.0" as const,
        recordCount: 0,
        sha256: "0".repeat(64),
        qualityStatus: "passed" as const,
      },
    },
    counts: { programs: 1, centers: 1, offerings: 1, offers: 0 },
  },
} satisfies TrainingFeatureData;

describe("OccupationResultsPage", () => {
  it("shows an explained route and official center disclosure", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <OccupationResultsPage
          occupationId="occupation:web-development"
          data={data}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /desarrollador web/i }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: /ver dónde estudiarlo/i }),
    );
    expect(screen.getByText(/ies río esgueva/i)).toBeVisible();
    expect(screen.getByText(/on_site/i)).toBeVisible();
  });
});
