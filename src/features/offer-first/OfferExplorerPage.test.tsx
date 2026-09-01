import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfferEvidenceResource } from "../../../data/schemas/offerEvidence";
import { OfferExplorerPage } from "./OfferExplorerPage";

const generatedDataClient = vi.hoisted(() => ({
  loadManifest: vi.fn(),
  loadFoundationResourceSubset: vi.fn(),
  loadOfficialOccupations: vi.fn(),
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
      snapshotId: "offers",
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
        },
      ],
    },
  ],
};

function LocationEcho() {
  return <output aria-label="Ubicación actual">{useLocation().search}</output>;
}

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
      await screen.findByRole("heading", { name: "Ofertas de empleo" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1–1 de 1 oferta" }),
    ).toBeVisible();
    expect(
      screen.getAllByText(/La relación orienta la búsqueda/u),
    ).toHaveLength(1);
    const card = screen.getByRole("article", {
      name: "COCINEROS, EN GENERAL",
    });
    expect(
      within(card).getByRole("link", { name: /Ver oferta oficial/ }),
    ).toHaveAttribute("href", "https://example.com/cooking-offer");
    expect(
      within(card).getByRole("link", { name: /Ver oferta oficial/ }),
    ).toHaveAttribute("target", "_blank");
    expect(
      within(card).getByText("Versión de la relación: 1.0.0"),
    ).not.toBeVisible();
    await userEvent
      .setup()
      .click(
        within(card).getByLabelText(
          "Ver trazabilidad de COCINEROS, EN GENERAL",
        ),
      );
    expect(
      screen.getByText(/Título de Técnico en Cocina y Gastronomía/),
    ).toBeVisible();
    expect(
      screen.getByText("Técnico en Cocina y Gastronomía", {
        exact: true,
        selector: "strong",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Cocina y Gastronomía" }),
    ).toHaveAttribute("href", "/desde-fp/HOT01M");
    expect(screen.getByText("Formación relacionada:")).toBeVisible();
    expect(
      screen.queryByText("Localizar una oficina ECYL"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Consultar admisión oficial de FP"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Requisitos destacados" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No publicado en esta copia"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Ver requisitos, relación y siguiente acción"),
    ).not.toBeInTheDocument();
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
      await screen.findByRole("heading", { name: "1–2 de 2 ofertas" }),
    ).toBeVisible();
    const query = screen.getByRole("searchbox");
    await user.clear(query);
    await user.type(query, "fisioterapeutas");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    const card = await screen.findByRole("article", {
      name: "FISIOTERAPEUTAS",
    });
    expect(
      within(card).getByRole("link", { name: /Ver oferta oficial/ }),
    ).toHaveAttribute("href", "https://example.com/physio-offer");
    await user.click(
      within(card).getByLabelText("Ver trazabilidad de FISIOTERAPEUTAS"),
    );
    expect(
      within(card).getByText("Vía universitaria o regulada"),
    ).toBeVisible();
    expect(
      within(card).getByText(
        "Aquí marcamos un límite: no inferimos equivalencias, acceso, colegiación ni empleabilidad universitaria.",
      ),
    ).toBeVisible();
  });

  it("clears the visible query together with the applied filters", async () => {
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(resource);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-oferta?query=cocina"]}>
        <OfferExplorerPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "1–1 de 1 oferta" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(
      screen.getByRole("heading", { name: "1–2 de 2 ofertas" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Limpiar filtros" }),
    ).not.toBeInTheDocument();
  });

  it("filters the evidence by the selected FP instead of showing the global catalogue", async () => {
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(resource);
    generatedDataClient.loadFoundationResourceSubset.mockResolvedValue({
      programs: [
        {
          programKey: "HOT01M",
          programTitle: "Cocina y Gastronomia",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/desde-fp/HOT01M/ofertas"]}>
        <Routes>
          <Route
            path="/desde-fp/:programKey/ofertas"
            element={<OfferExplorerPage scope="program" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Ofertas relacionadas con Cocina y Gastronomia",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1–1 de 1 oferta relacionada" }),
    ).toBeVisible();
    expect(
      screen.getByRole("article", { name: "COCINEROS, EN GENERAL" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("article", { name: "FISIOTERAPEUTAS" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cocina y Gastronomia" }),
    ).toHaveAttribute("href", "/desde-fp/HOT01M");
    expect(
      generatedDataClient.loadFoundationResourceSubset,
    ).toHaveBeenCalledWith({}, ["programs"], expect.anything());
  });

  it("filters the evidence by an official occupation context", async () => {
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(resource);
    generatedDataClient.loadOfficialOccupations.mockResolvedValue([
      {
        occupationId: "occupation:cno11:5110",
        preferredLabel: "Cocineros asalariados",
        classificationCode: "5110",
      },
    ]);

    render(
      <MemoryRouter
        initialEntries={["/desde-ocupacion/occupation%3Acno11%3A5110/ofertas"]}
      >
        <Routes>
          <Route
            path="/desde-ocupacion/:occupationId/ofertas"
            element={<OfferExplorerPage scope="occupation" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Ofertas relacionadas con Cocineros asalariados",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1–1 de 1 oferta relacionada" }),
    ).toBeVisible();
    expect(
      screen.getByRole("article", { name: "COCINEROS, EN GENERAL" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("article", { name: "FISIOTERAPEUTAS" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cocineros asalariados" }),
    ).toHaveAttribute("href", "/desde-ocupacion/occupation%3Acno11%3A5110");
  });

  it("paginates global results while preserving the query string state", async () => {
    const paginatedResource: OfferEvidenceResource = {
      ...resource,
      counts: { ...resource.counts, offerCount: 26 },
      records: Array.from({ length: 26 }, (_, index) => ({
        ...resource.records[1]!,
        offerId: `pagination-offer-${index + 1}`,
        title: `Oferta de prueba ${index + 1}`,
      })),
    };
    generatedDataClient.loadManifest.mockResolvedValue({});
    generatedDataClient.loadOfferEvidence.mockResolvedValue(paginatedResource);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-oferta?query=oferta&page=2"]}>
        <Routes>
          <Route
            path="/desde-oferta"
            element={
              <>
                <OfferExplorerPage />
                <LocationEcho />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "13–24 de 26 ofertas" }),
    ).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(12);
    expect(
      screen.getByRole("navigation", { name: "Paginación de ofertas" }),
    ).toHaveAttribute("aria-controls", "offer-results-list");
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeEnabled();
    expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent(
      "query=oferta&page=2",
    );

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(
      screen.getByRole("heading", { name: "25–26 de 26 ofertas" }),
    ).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent(
      "query=oferta&page=3",
    );
  });
});
