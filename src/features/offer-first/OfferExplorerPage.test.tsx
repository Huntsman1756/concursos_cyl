import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  OfferEvidenceRecord,
  OfferEvidenceResource,
} from "../../../data/schemas/offerEvidence";
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

function withRecord(
  overrides: Partial<OfferEvidenceRecord>,
): OfferEvidenceRecord {
  return { ...resource.records[0], ...overrides };
}

const caregiverRecord = withRecord({
  offerId: "caregiver-offer",
  title:
    "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
  occupationLabel:
    "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
  evidenceStatus: "ambiguous_requirement",
  hasAmbiguousRequirements: true,
  requirements: [
    {
      ...resource.records[0].requirements[0],
      requirementId: `requirement:${"b".repeat(64)}`,
      literalRequirement: "Experiencia en cuidados a personas dependientes.",
      normalizedCategory: "unknown",
      normalizedValue: null,
      classificationStatus: "ambiguous",
      parserRule: "ambiguous.requirement",
    },
  ],
  relations: [],
  nextActions: [
    {
      ...resource.records[0].nextActions[0],
      href: "https://example.com/caregiver-offer",
    },
  ],
});

const physioU1Record: OfferEvidenceRecord = {
  ...resource.records[1],
  universitySignal: "literal_offer_requirement",
  universityEvidenceClass: "U1",
  universityEvidence: {
    evidenceClass: "U1",
    basis: "literal_offer_requirement",
    sourceUrl: "https://example.com/physio-requirement",
    sourceQuote: "Grado en Fisioterapia.",
  },
  nextActions: [resource.records[1].nextActions[0]],
};

const noReviewedRecord = withRecord({
  offerId: "no-reviewed-offer",
  title: "AYUDANTE DE COCINA",
  occupationLabel: "AYUDANTE DE COCINA",
  evidenceStatus: "no_reviewed_relationship",
  hasAmbiguousRequirements: false,
  requirements: [],
  relations: [],
  nextActions: [
    {
      ...resource.records[0].nextActions[0],
      href: "https://example.com/no-reviewed-offer",
    },
  ],
});

function renderOfferRecords(records: OfferEvidenceRecord[]) {
  generatedDataClient.loadManifest.mockResolvedValue({});
  generatedDataClient.loadOfferEvidence.mockResolvedValue({
    ...resource,
    records,
  });
  render(
    <MemoryRouter initialEntries={["/desde-oferta"]}>
      <OfferExplorerPage />
    </MemoryRouter>,
  );
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
      await screen.findByRole("heading", { name: "Tengo una oferta" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1 de 2 ofertas" }),
    ).toBeVisible();
    expect(
      screen
        .getAllByText(/Título de Técnico en Cocina y Gastronomía/)
        .find((element) => !element.closest("details")),
    ).toBeVisible();
    expect(
      screen
        .getAllByText("Relación revisada", { selector: "strong" })
        .find((element) => !element.closest("details")),
    ).toBeVisible();
    const summary = screen.getByText(
      "Ver requisito, evidencia y siguiente acción",
    );
    expect(summary.closest("details")).not.toHaveAttribute("open");
    expect(screen.getByText("Vigencia no confirmada.")).toBeVisible();
    expect(
      screen
        .getAllByRole("link", { name: /Abrir la oferta original/ })
        .find((element) => !element.closest("details")),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Lo que sabemos" }),
    ).not.toBeVisible();
    await userEvent.setup().click(summary);
    expect(
      screen
        .getAllByRole("heading", { name: "Requisito literal" })
        .find((element) => element.closest("details")?.hasAttribute("open")),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Estado de la evidencia" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Lo que sabemos" }),
    ).toBeVisible();
    expect(
      within(summary.closest("details") as HTMLElement).getByText(
        /Título de Técnico en Cocina y Gastronomía/,
      ),
    ).toBeVisible();
    expect(
      screen.getAllByText("FP", { selector: "strong" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Cocina y Gastronomía", { selector: "strong" }),
    ).toBeVisible();
    const studyLinks = screen.getAllByRole("link", {
      name: /Ver dónde estudiar Cocina/,
    });
    expect(studyLinks).toHaveLength(1);
    for (const studyLink of studyLinks) {
      expect(studyLink).toHaveAttribute("href", "/formacion/HOT01M");
    }
    expect(
      screen.getByRole("heading", { name: "Siguiente acción" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Fuentes y limitaciones" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "abrir publicación" }),
    ).toHaveAttribute("href", "https://example.com/cooking-offer");
    expect(screen.getByText(/Empleador no publicado/)).toBeVisible();
  });

  it.each([
    {
      name: "cocina revisada",
      record: resource.records[0],
      literal: "Título de Técnico en Cocina y Gastronomía.",
      status: "Relación revisada",
    },
    {
      name: "cuidador ambiguo",
      record: caregiverRecord,
      literal: "Experiencia en cuidados a personas dependientes.",
      status: "No confirmado",
    },
    {
      name: "fisioterapia U1",
      record: physioU1Record,
      literal: "Grado en Fisioterapia.",
      status: "Vía regulada",
    },
    {
      name: "sin relación revisada",
      record: noReviewedRecord,
      literal: "No hay requisitos concretos extraídos.",
      status: "Sin relación revisada",
    },
  ])(
    "exposes L1 decision signals before supporting detail for $name",
    async ({ record, literal, status }) => {
      renderOfferRecords([record]);

      expect(
        await screen.findByRole("heading", { name: "1 de 1 ofertas" }),
      ).toBeVisible();
      expect(
        screen
          .getAllByText(literal, { exact: false })
          .find((element) => !element.closest("details")),
      ).toBeVisible();
      expect(
        screen
          .getAllByText(status, { selector: "strong" })
          .find((element) => !element.closest("details")),
      ).toBeVisible();
      expect(screen.getByText("Vigencia no confirmada.")).toBeVisible();
      expect(
        screen
          .getAllByRole("link", { name: /Abrir la oferta original/ })
          .find((element) => !element.closest("details")),
      ).toBeVisible();
      const summary = screen.getByText(
        "Ver requisito, evidencia y siguiente acción",
      );
      expect(summary.closest("details")).not.toHaveAttribute("open");
      expect(
        screen.queryByRole("heading", { name: "Lo que sabemos" }),
      ).not.toBeVisible();

      await userEvent.setup().click(summary);
      expect(
        screen.getByRole("heading", { name: "Fuentes y limitaciones" }),
      ).toBeVisible();
    },
  );

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
      within(card).getByText("Ver requisito, evidencia y siguiente acción"),
    );
    expect(
      within(card).getByText(/U2 · Vía regulada/, { selector: "strong" }),
    ).toBeVisible();
    expect(
      within(card).getByText(
        /No inferimos equivalencias, acceso, colegiación ni empleabilidad desde esta copia\./,
      ),
    ).toBeVisible();
    expect(
      within(card).getByText(/profesión de fisioterapia está regulada/),
    ).toBeVisible();
    expect(within(card).queryByText(/Esta oferta exige/)).toBeNull();
  });
});
