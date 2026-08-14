import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { GeneratedManifest } from "../../../data/schemas/generated";
import { MethodologyPage } from "./MethodologyPage";

const source = {
  sourceId: "test-source",
  sourceUrl: "https://example.test/source",
  sourceUpdatedAt: null,
  snapshotFetchedAt: "2026-08-14T00:00:00.000Z",
  schemaVersion: "1.0.0" as const,
  recordCount: 1,
  sha256: "0".repeat(64),
  qualityStatus: "passed" as const,
};

const fixtureManifest: GeneratedManifest = {
  schemaVersion: "1.0.0",
  generatedAt: "2026-08-14T00:00:00.000Z",
  qualityStatus: "passed",
  sources: { training: source, offers: source },
  counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
};

describe("MethodologyPage", () => {
  it("names the source, method and limitation for each public conclusion", () => {
    render(
      <MemoryRouter>
        <MethodologyPage manifest={fixtureManifest} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/oferta de formación profesional/i)).toBeVisible();
    expect(screen.getByText(/ofertas de empleo/i)).toBeVisible();
    expect(screen.getByText(/base de cotización anualizada/i)).toBeVisible();
    expect(screen.getByText(/cawi\/cati/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /descargar manifiesto de datos/i }),
    ).toHaveAttribute("href", "/data/v1/manifest.json");
  });
});
