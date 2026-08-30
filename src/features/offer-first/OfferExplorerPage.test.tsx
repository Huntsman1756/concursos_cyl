import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfferEvidenceResource } from "../../../data/schemas/offerEvidence";
import { OfferExplorerPage } from "./OfferExplorerPage";

const generatedDataClient = vi.hoisted(() => ({
  loadManifest: vi.fn(),
  loadOfferEvidence: vi.fn(),
}));

vi.mock("../../data/generatedDataClient", () => generatedDataClient);

const resource: OfferEvidenceResource = {
  schemaVersion: "1.0.0",
  snapshotId: "20260830120000000-8c6c79fbd2a1",
  baseSnapshotId: "20260822085631889-fc9bf2ba23f9",
  generatedAt: "2026-08-30T12:00:00.000Z",
  reviewVersion: "1.0.0",
  sourceSnapshots: [
    {
      resourceKey: "jobOffers",
      snapshotId: "offers",
      sourceId: "offers",
      sourceUrl: "https://example.com/dataset",
      recordCount: 2,
      sha256:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
  ],
  counts: {
    offerCount: 2,
    offersWithPublishedRequirements: 1,
    requirementCount: 1,
    classifiedRequirementCount: 1,
    unclassifiedRequirementCount: 0,
    offersWithReviewedFpRelationship: 1,
    reviewedRelationCount: 1,
    offersWithAlternativePathway: 0,
    offersWithAmbiguity: 0,
    universitySignalCount: 1,
    universityAcceptedRecordCount: 1,
    titleOnlyUniversitySignalCount: 0,
    universityEvidenceClassCounts: { U1: 0, U2: 1, U3: 0 },
    accreditationActionCount: 0,
    certificateOfferAcceptanceCount: 0,
    certificateAlternativeRouteCount: 0,
  },
  notes: ["Nota de prueba"],
  records: [
    {
      offerId: "cooking-offer",
      title: "COCINEROS, EN GENERAL",
      occupationLabel: "COCINEROS, EN GENERAL",
      province: "Burgos",
      locality: "Burgos",
      sourceName: "ECYL",
      employer: null,
      status: "published_in_snapshot",
      publishedAt: "2026-08-18T00:00:00.000Z",
      sourceDate: "2026-08-18T00:00:00.000Z",
      freshnessDate: "2026-08-20T00:00:00.000Z",
      sourceUrl: "https://example.com/dataset",
      originalUrl: "https://example.com/cooking-offer",
      evidenceStatus: "reviewed_fp_relationship",
      hasAmbiguousRequirements: false,
      universitySignal: "none",
      universityEvidenceClass: null,
      universityEvidence: null,
      certificateRouteType: null,
      requirements: [
        {
          requirementId:
            "requirement:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          literalRequirement: "Título de Técnico en Cocina y Gastronomía.",
          normalizedCategory: "fp",
          normalizedValue: "Técnico en Cocina y Gastronomía",
          classificationStatus: "reviewed",
          parserRule: "unclassified.conservative_fallback",
          sourceUrl: "https://example.com/cooking-offer",
          sourceDate: "2026-08-18T00:00:00.000Z",
        },
      ],
      relations: [
        {
          programKey: "HOT01M",
          programTitle: "Cocina y Gastronomía",
          occupationId: "occupation:cno11:5110",
          occupationLabel: "Cocineros asalariados",
          relationshipType: "official_output",
          matchRule: "reviewed_exact_program_title",
          sourceUrl:
            "https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/cocina-gastronomia.html",
          sourceQuote: "Técnico en Cocina y Gastronomía",
          reviewedAt: "2026-08-30",
          mappingVersion: "1.0.0",
        },
      ],
      nextActions: [
        {
          actionType: "open_original_offer",
          targetKind: "external",
          label: "Abrir la oferta original",
          href: "https://example.com/cooking-offer",
          reason: "Comprueba la publicación.",
        },
        {
          actionType: "view_fp_route",
          targetKind: "internal",
          label: "Ver dónde estudiar Cocina y Gastronomía",
          href: "/formacion/HOT01M",
          reason: "La relación está revisada.",
          programKey: "HOT01M",
        },
      ],
    },
    {
      offerId: "physio-offer",
      title: "FISIOTERAPEUTAS",
      occupationLabel: "FISIOTERAPEUTAS",
      province: "León",
      locality: "León",
      sourceName: "ECYL",
      employer: null,
      status: "published_in_snapshot",
      publishedAt: "2026-08-01T00:00:00.000Z",
      sourceDate: "2026-08-01T00:00:00.000Z",
      freshnessDate: "2026-08-20T00:00:00.000Z",
      sourceUrl: "https://example.com/dataset",
      originalUrl: "https://example.com/physio-offer",
      evidenceStatus: "university_or_regulatory_route",
      hasAmbiguousRequirements: false,
      universitySignal: "regulated_profession_official_source",
      universityEvidenceClass: "U2",
      universityEvidence: {
        evidenceClass: "U2",
        basis: "regulated_profession_official_source",
        sourceUrl: "https://example.com/official-regulated-profession",
        sourceQuote: "La profesión de fisioterapia está regulada.",
      },
      certificateRouteType: null,
      requirements: [],
      relations: [],
      nextActions: [
        {
          actionType: "open_original_offer",
          targetKind: "external",
          label: "Abrir la oferta original",
          href: "https://example.com/physio-offer",
          reason: "Comprueba la publicación.",
        },
        {
          actionType: "university_route",
          targetKind: "external",
          label: "Consultar la vía universitaria oficial",
          href: "https://www.universidades.gob.es/",
          reason: "Hay un límite regulado.",
          caveat: "No inferimos equivalencias.",
          universityEvidenceClass: "U2",
        },
      ],
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OfferExplorerPage", () => {
  it("connects a literal requirement to a reviewed FP relation and action", async () => {
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(resource);

    render(
      <MemoryRouter initialEntries={["/desde-oferta?query=cocina"]}>
        <OfferExplorerPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Tengo una oferta" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1 de 2 ofertas" }),
    ).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByText("Ver requisitos, relación y siguiente acción"));
    expect(
      screen.getByText(/Título de Técnico en Cocina y Gastronomía/),
    ).toBeVisible();
    expect(screen.getByText("FP", { selector: "span" })).toBeVisible();
    expect(
      screen.getByText("Cocina y Gastronomía", { selector: "strong" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Ver dónde estudiar Cocina/ }),
    ).toHaveAttribute("href", "/formacion/HOT01M");
    expect(screen.getByText("No publicado en esta copia")).toBeVisible();
  });

  it("keeps the university boundary visible and lets people try another query", async () => {
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(resource);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-oferta"]}>
        <OfferExplorerPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "2 de 2 ofertas" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("link", { name: /Fisioterapia: límite universitario/ }),
    );
    const card = await screen.findByRole("article", {
      name: "FISIOTERAPEUTAS",
    });
    await user.click(
      within(card).getByText("Ver requisitos, relación y siguiente acción"),
    );
    expect(
      within(card).getByText("Vía universitaria o regulada", {
        selector: "span",
      }),
    ).toBeVisible();
    expect(
      within(card).getByText(
        "No inferimos equivalencias, acceso, colegiación ni empleabilidad desde esta copia.",
      ),
    ).toBeVisible();
    expect(
      within(card).getByText(
        "Esta profesión está regulada y requiere comprobar la fuente oficial.",
      ),
    ).toBeVisible();
    expect(within(card).queryByText(/Esta oferta exige/)).toBeNull();
  });
});
