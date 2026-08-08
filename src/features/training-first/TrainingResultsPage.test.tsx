import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import occupationAliases from "../../../data/curated/occupation-aliases.json";
import occupations from "../../../data/curated/occupations.json";
import trainingOccupationLinks from "../../../data/curated/training-occupation-links.json";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { AppRoutes } from "../../app/routes";
import { publishedRequirementId } from "../../domain/requirements";

const program = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
} as const;

const distanceProgram = {
  ...program,
  programKey: "IFC03SD",
  programTitle: "Desarrollo de Aplicaciones Web (distancia)",
} as const;

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installResultsFetch(
  options: {
    links?: unknown[];
    offers?: unknown[];
    requirements?: unknown[];
    stale?: boolean;
  } = {},
): void {
  const baseManifest = currentManifestFixture();
  const baseSnapshot = baseManifest.resourceSnapshots.jobOffers;
  const extraSnapshots = {
    occupations: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/occupations.json",
    },
    occupationAliases: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
    },
    trainingOccupationLinks: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/training-occupation-links.json",
    },
    publishedRequirements: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/published-requirements.json",
    },
  } as const;
  const manifest = {
    ...baseManifest,
    qualityStatus: options.stale
      ? ("stale" as const)
      : baseManifest.qualityStatus,
    resourceSnapshots: {
      ...baseManifest.resourceSnapshots,
      ...extraSnapshots,
    },
  };
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [
      manifest.resourceSnapshots.programs.resourcePath,
      [program, distanceProgram],
    ],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, []],
    [manifest.resourceSnapshots.jobOffers.resourcePath, options.offers ?? []],
    [extraSnapshots.occupations.resourcePath, occupations],
    [extraSnapshots.occupationAliases.resourcePath, occupationAliases],
    [
      extraSnapshots.trainingOccupationLinks.resourcePath,
      options.links ?? trainingOccupationLinks,
    ],
    [
      extraSnapshots.publishedRequirements.resourcePath,
      options.requirements ?? [],
    ],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      return Promise.resolve(
        payload === undefined
          ? new Response(null, { status: 404 })
          : responseFor(payload),
      );
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TrainingResultsPage", () => {
  it("reports missing audited coverage instead of inventing a relationship", async () => {
    installResultsFetch({ links: [] });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Aún no hay una relación revisada para este ciclo.",
      ),
    ).toBeVisible();
  });

  it("describes a truthful zero-match snapshot without claiming there are no jobs", async () => {
    installResultsFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "No hay ofertas relacionadas en la instantánea del 31 de julio de 2026.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Grado superior · Código oficial IFC03S"),
    ).toBeVisible();
    expect(screen.queryByText(/no hay trabajo/iu)).not.toBeInTheDocument();
  });

  it("warns above results when the generated snapshot is stale", async () => {
    installResultsFetch({ stale: true });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const warning = await screen.findByRole("status");
    expect(warning).toHaveTextContent(
      "No se han podido actualizar los datos. Mostramos la última copia disponible.",
    );
    const emptyState = screen.getByText(
      /No hay ofertas relacionadas en la instantánea/,
    );
    expect(
      warning.compareDocumentPosition(emptyState) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the vertical evidence story and derives a reliable action from an answer", async () => {
    const offerId = "offer:synthetic-card";
    const sourceQuote = "Se requiere permiso de conducir B.";
    const requirement = {
      id: publishedRequirementId(
        offerId,
        "driving_license_or_vehicle",
        sourceQuote,
      ),
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      sourceQuote,
      parserRule: "license.driving_b",
      parserVersion: "1.0.0",
    } as const;
    const offer = {
      id: offerId,
      title: "Programador web para servicios públicos",
      province: "Valladolid",
      locality: "Valladolid",
      publishedAt: "2026-07-30T00:00:00.000Z",
      sourceName: "ECYL",
      descriptionText: sourceQuote,
      descriptionSections: {
        summary: [],
        functions: [],
        requirements: [sourceQuote],
        conditions: [],
        application: [],
        other: [],
      },
      originalUrl: "https://empleo.jcyl.es/oferta/synthetic-card",
      sourceSnapshot: {
        sourceId: "ofertas-de-empleo",
        sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
        sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
        snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
        schemaVersion: "1.0.0",
        recordCount: 1,
        sha256: "a".repeat(64),
        qualityStatus: "passed",
      },
    } as const;
    installResultsFetch({
      offers: [offer],
      requirements: [{ offerId, requirements: [requirement] }],
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const card = await screen.findByRole("article", {
      name: "Programador web para servicios públicos",
    });
    const headings = Array.from(card.querySelectorAll("h3")).map(
      (heading) => heading.textContent,
    );
    expect(headings).toEqual([
      "Por qué aparece",
      "Qué publica la vacante",
      "Tu comprobación",
      "Siguiente acción",
    ]);
    const disclosures = screen.getAllByText("Ver cita exacta");
    const mappingDisclosure = disclosures[0].closest("details");
    const requirementDisclosure = disclosures[1].closest("details");
    expect(mappingDisclosure).not.toBeNull();
    expect(requirementDisclosure).not.toBeNull();
    expect(screen.getByText(sourceQuote)).not.toBeVisible();
    await user.click(disclosures[0]);
    expect(
      within(mappingDisclosure!).getByText(
        "Revisión del mapeo: 4 de agosto de 2026",
      ),
    ).toBeVisible();
    expect(
      within(mappingDisclosure!).getByText("Versión del mapeo: 1.0.0"),
    ).toBeVisible();
    await user.click(disclosures[1]);
    expect(screen.getByText(sourceQuote)).toBeVisible();
    expect(
      within(requirementDisclosure!).getByRole("link", {
        name: /Abrir fuente de la vacante/,
      }),
    ).toHaveAttribute("href", offer.sourceSnapshot.sourceUrl);
    expect(
      within(requirementDisclosure!).getByText(
        "Fecha de la fuente: 31 de julio de 2026",
      ),
    ).toBeVisible();
    expect(
      within(requirementDisclosure!).getByText(
        "Regla de extracción: license.driving_b",
      ),
    ).toBeVisible();
    expect(
      within(requirementDisclosure!).getByText("Versión del parser: 1.0.0"),
    ).toBeVisible();

    await user.click(
      screen.getByRole("radio", {
        name: `No lo tengo: ${sourceQuote}`,
      }),
    );
    expect(
      await screen.findByRole("link", { name: /Consultar trámite oficial/ }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.queryByText(/compatibilidad|porcentaje|%/iu),
    ).not.toBeInTheDocument();
  });

  it("executes an exact unpublished-requirement filter through the URL", async () => {
    const sourceQuote = "Se requiere experiencia mínima de un año.";
    const firstOfferId = "offer:with-experience";
    const sourceSnapshot = {
      sourceId: "ofertas-de-empleo",
      sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
      sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
      snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
      schemaVersion: "1.0.0",
      recordCount: 2,
      sha256: "a".repeat(64),
      qualityStatus: "passed",
    } as const;
    const descriptionSections = {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    };
    const offers = [
      {
        id: firstOfferId,
        title: "Programador web con experiencia",
        province: "León",
        locality: "León",
        publishedAt: "2026-07-30T00:00:00.000Z",
        sourceName: "ECYL",
        descriptionText: sourceQuote,
        descriptionSections: {
          ...descriptionSections,
          requirements: [sourceQuote],
        },
        originalUrl: "https://empleo.jcyl.es/oferta/with-experience",
        sourceSnapshot,
      },
      {
        id: "offer:without-experience",
        title: "Programador web junior",
        province: "Burgos",
        locality: "Burgos",
        publishedAt: "2026-07-29T00:00:00.000Z",
        sourceName: "ECYL",
        descriptionText: "Oferta sin experiencia publicada.",
        descriptionSections,
        originalUrl: "https://empleo.jcyl.es/oferta/without-experience",
        sourceSnapshot,
      },
    ];
    const requirement = {
      id: publishedRequirementId(firstOfferId, "experience", sourceQuote),
      category: "experience",
      normalizedValue: 12,
      sourceQuote,
      parserRule: "experience.years",
      parserVersion: "1.0.0",
    } as const;
    installResultsFetch({
      offers,
      requirements: [{ offerId: firstOfferId, requirements: [requirement] }],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await user.click(
      await screen.findByRole("radio", {
        name: `No lo tengo: ${sourceQuote}`,
      }),
    );
    const filterLink = await screen.findByRole("link", {
      name: "Ver ofertas relacionadas donde no se publica este requisito",
    });
    expect(filterLink).toHaveAttribute(
      "href",
      "/desde-fp/IFC03S?publication=not-published&category=experience&value=12",
    );
    await user.click(filterLink);

    expect(
      await screen.findByText(
        "Filtro activo: ofertas relacionadas que no publican este requisito exacto.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("article", {
        name: "Programador web con experiencia",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Programador web junior" }),
    ).toBeVisible();
  });
});
