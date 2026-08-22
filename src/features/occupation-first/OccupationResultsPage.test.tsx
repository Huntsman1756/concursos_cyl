import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SEPE_CYL_PROVINCES,
  SEPE_OCCUPATION_MARKET_ATTRIBUTION,
} from "../../../data/schemas/sepeOccupationMarket";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { AppRoutes } from "../../app/routes";

const occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
} as const;

const programs = [
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC03SD",
    programTitle: "Desarrollo de Aplicaciones Web",
    level: "specialization",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
] as const;

const links = [
  {
    trainingProgramKey: "IFC03SD",
    occupationId: occupation.occupationId,
    relationshipType: "reviewed_relationship",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
    sourceQuote: "Competencias compartidas de desarrollo Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "IFC03S",
    occupationId: occupation.occupationId,
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
    sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    trainingProgramKey: "DRAFT",
    occupationId: occupation.occupationId,
    relationshipType: "official_output",
    reviewStatus: "draft",
    sourceUrl: "https://example.org/draft",
    sourceQuote: "Esta relación no puede mostrarse.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
    reviewNote:
      "Pending exact official evidence before this mapping may be published.",
  },
  {
    trainingProgramKey: "IFC03S",
    occupationId: occupation.occupationId,
    relationshipType: "official_output",
    reviewStatus: "rejected",
    sourceUrl: "https://example.org/rejected",
    sourceQuote: "Esta relación rechazada no puede mostrarse.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

function offering(
  program: (typeof programs)[number],
  centerCode: string,
  province: string,
  modality: "on_site" | "distance" | "mixed",
) {
  return {
    ...program,
    offeringId: `${program.programKey}:${centerCode}:${modality}:public:education`,
    centerCode,
    centerName: `Centro ${centerCode}`,
    centerOwnership: "education",
    teachingType: "public",
    province,
    locality: province,
    modality,
  } as const;
}

interface FetchOptions {
  occupations?: unknown[];
  relationshipLinks?: readonly unknown[];
  stale?: boolean;
  sepeResource?: unknown[];
  sepeStale?: boolean;
}

const sepeRecord = {
  period: "2026-07",
  cno: {
    code: occupation.classificationCode,
    label: occupation.preferredLabel,
  },
  national: {
    registeredContracts: {
      total: 116,
      people: 115,
      monthlyVariationPercent: -4.92,
      annualVariationPercent: -17.14,
    },
    registeredUnemployment: {
      total: 2478,
      monthlyVariationPercent: 2.65,
      annualVariationPercent: 17.5,
    },
  },
  provinces: SEPE_CYL_PROVINCES.map((province, index) => ({
    province,
    registeredContracts: {
      total: index === 0 ? 0 : index + 1,
      monthlyVariationPercent: index === 0 ? 0 : 1.1,
      annualVariationPercent: index === 0 ? 0 : 2.2,
    },
    ...(index === 1
      ? {}
      : {
          registeredUnemployment: {
            total: index + 10,
            monthlyVariationPercent: 0,
            annualVariationPercent: -1.5,
          },
        }),
  })),
  source: {
    url: "https://www.sepe.es/HomeSepe/occupation/2713",
    retrievedAt: "2026-08-22T09:30:00Z",
    attribution: SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  },
} as const;

function installFetch({
  occupations = [occupation],
  relationshipLinks = links,
  stale = false,
  sepeResource,
  sepeStale = false,
}: FetchOptions = {}): void {
  const base = currentManifestFixture({
    snapshotFetchedAt: "2026-08-05T07:52:50.485Z",
  });
  const snapshot = {
    ...base.resourceSnapshots.programs,
    qualityStatus: stale ? "stale" : "passed",
  };
  const manifest = {
    ...base,
    qualityStatus: stale ? "stale" : "passed",
    resourceSnapshots: {
      ...base.resourceSnapshots,
      trainingOfferings: {
        ...snapshot,
        resourcePath: base.resourceSnapshots.trainingOfferings.resourcePath,
      },
      occupations: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/occupations.json",
      },
      officialOccupations: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/official-occupations.json",
      },
      occupationAliases: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
      },
      trainingOccupationLinks: {
        ...snapshot,
        resourcePath:
          "/data/v1/snapshots/build-1/training-occupation-links.json",
      },
    } as typeof base.resourceSnapshots &
      Record<string, { resourcePath: string; [key: string]: unknown }>,
  };
  const offerings = [
    offering(programs[0], "A", "Ávila", "on_site"),
    offering(programs[0], "B", "Valladolid", "distance"),
    offering(programs[1], "C", "León", "mixed"),
  ];
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, programs],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, offerings],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
    [manifest.resourceSnapshots.occupations.resourcePath, occupations],
    [manifest.resourceSnapshots.officialOccupations.resourcePath, occupations],
    [manifest.resourceSnapshots.occupationAliases.resourcePath, []],
    [
      manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
      relationshipLinks,
    ],
  ]);
  if (sepeResource !== undefined) {
    const sepePath = "/data/v1/snapshots/build-1/sepe-occupation-market.json";
    manifest.resourceSnapshots.sepeOccupationMarket = {
      ...snapshot,
      sourceId: "sepe-occupation-market",
      sourceUrl: sepeRecord.source.url,
      resourcePath: sepePath,
      qualityStatus: sepeStale ? "stale" : "passed",
      recordCount: sepeResource.length,
    };
    resources.set(sepePath, sepeResource);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      return Promise.resolve(
        payload === undefined
          ? new Response(null, { status: 404 })
          : new Response(JSON.stringify(payload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
      );
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("occupation-first results", () => {
  it("rejects an unknown occupation with a useful path back", async () => {
    installFetch();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion/unknown"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Ocupación no encontrada" }),
    ).toBeVisible();
    const manifest = currentManifestFixture();
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.programs.resourcePath,
    );
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.trainingOfferings.resourcePath,
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.centers.resourcePath,
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.jobOffers.resourcePath,
    );
    expect(
      screen.getByRole("link", { name: "Buscar otra ocupación" }),
    ).toHaveAttribute("href", "/desde-ocupacion");
  });

  it("explains when no reviewed training route is available", async () => {
    installFetch({ relationshipLinks: [] });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(
        "Aún no hay una ruta formativa revisada para esta ocupación.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        /Esto no significa que no exista formación relacionada/i,
      ),
    ).toBeVisible();
  });

  it("orders explained routes without scores and shows real offering coverage", async () => {
    installFetch();
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: occupation.preferredLabel }),
    ).toBeVisible();
    expect(screen.getByText(/Ocupación que quieres/)).toHaveTextContent(
      /FP que te lleva a ella/,
    );
    const routeSummary = screen.getByLabelText("Resumen de rutas formativas");
    expect(routeSummary).toHaveTextContent(/FP relacionadas2/);
    expect(routeSummary).toHaveTextContent(/Centros3/);
    expect(routeSummary).toHaveTextContent(/Provincias3/);
    const cards = screen.getAllByTestId("training-route-card");
    expect(
      within(cards[0]).getByText("Salida profesional oficial"),
    ).toBeVisible();
    expect(within(cards[1]).getByText("Relación revisada")).toBeVisible();
    expect(
      within(cards[0]).getByText("2 opciones de centro y modalidad publicadas"),
    ).toBeVisible();
    expect(within(cards[0]).getByText("Ávila y Valladolid")).toBeVisible();
    expect(
      within(cards[0]).getByText("A distancia y Presencial"),
    ).toBeVisible();
    expect(within(cards[0]).getByText("Grado superior · IFC03S")).toBeVisible();
    expect(
      within(cards[1]).getByText("Curso de especialización · IFC03SD"),
    ).toBeVisible();
    expect(
      screen.queryByText(/mejor|puntuación|compatibilidad|%/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/DRAFT/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Esta relación no puede mostrarse."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Esta relación rechazada no puede mostrarse."),
    ).not.toBeInTheDocument();
  });

  it("discloses exact provenance and links to the existing centers route", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );
    const cards = await screen.findAllByTestId("training-route-card");
    await user.click(within(cards[0]).getByText("Ver cita exacta"));
    expect(
      within(cards[0]).getByText(
        "Desarrollador de aplicaciones en entornos Web.",
      ),
    ).toBeVisible();
    expect(
      within(cards[0]).getByText(
        "Revisión de la relación: 4 de agosto de 2026",
      ),
    ).toBeVisible();
    expect(
      within(cards[0]).getByText("Versión de la relación: 1.0.0"),
    ).toBeVisible();
    expect(
      within(cards[0]).getByRole("link", { name: /Abrir fuente oficial/ }),
    ).toHaveAttribute("href", links[1].sourceUrl);
    expect(
      within(cards[0]).getByRole("link", { name: "Ver dónde estudiarlo" }),
    ).toHaveAttribute("href", "/formacion/IFC03S");
  });

  it("shows the source behind every route summary metric", async () => {
    installFetch();
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Qué rutas hemos podido comprobar",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Fuente: relación FP-ocupación" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Fuente: oferta FP JCyL" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Fuente: catálogo CNO-11" }),
    ).toHaveAttribute("target", "_blank");
  });

  it("warns when the official training snapshot is stale", async () => {
    installFetch({ stale: true });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(
        /No se han podido actualizar los datos formativos/i,
      ),
    ).toBeVisible();
  });

  it("shows exact SEPE evidence before the reviewed FP routes", async () => {
    installFetch({ sepeResource: [sepeRecord] });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    const panel = await screen.findByRole("region", {
      name: "Mercado laboral de esta ocupación",
    });
    expect(panel).toHaveTextContent(
      "Registros oficiales del SEPE para CNO-11 2713",
    );
    await within(panel).findByText("julio de 2026");
    expect(panel).toHaveTextContent("julio de 2026");
    expect(panel).toHaveTextContent("Contratos registrados");
    expect(panel).toHaveTextContent("116");
    expect(panel).toHaveTextContent("Personas contratadas");
    expect(panel).toHaveTextContent("115");
    expect(panel).toHaveTextContent("Paro registrado");
    expect(panel).toHaveTextContent("2478");
    expect(panel).toHaveTextContent("−4,92 %");
    expect(panel).toHaveTextContent("17,5 %");
    expect(panel).toHaveTextContent("No publicado");
    expect(
      within(panel).getByRole("link", { name: /Fuente oficial SEPE/i }),
    ).toHaveAttribute("href", sepeRecord.source.url);
    const provinceTable = within(panel).getByRole("table");
    expect(within(provinceTable).getAllByRole("row")).toHaveLength(10);
    for (const province of SEPE_CYL_PROVINCES) {
      expect(within(provinceTable).getByText(province)).toBeVisible();
    }
  });

  it("keeps the FP route usable when SEPE loading fails", async () => {
    installFetch({ sepeResource: [{ invalid: true }] });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "No hemos podido cargar los datos del mercado laboral del SEPE.",
      ),
    ).toBeVisible();
    expect(await screen.findAllByTestId("training-route-card")).toHaveLength(2);
  });

  it("renders SEPE evidence without a reviewed FP route and does not reload the manifest", async () => {
    installFetch({ relationshipLinks: [], sepeResource: [sepeRecord] });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("region", {
        name: "Mercado laboral de esta ocupación",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Aún no hay una ruta formativa revisada para esta ocupación.",
      ),
    ).toBeVisible();
    const manifestRequests = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([request]) => String(request) === "/data/v1/manifest.json",
      );
    expect(manifestRequests).toHaveLength(1);
    for (const [request, init] of vi.mocked(fetch).mock.calls) {
      const method = request instanceof Request ? request.method : init?.method;
      expect(method ?? "GET").toBe("GET");
    }
  });

  it("explains an unavailable SEPE resource without blocking the result page", async () => {
    installFetch();
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "El recurso de mercado laboral del SEPE no está disponible para esta copia de datos.",
      ),
    ).toBeVisible();
    expect(await screen.findAllByTestId("training-route-card")).toHaveLength(2);
  });

  it("warns only about a stale SEPE resource", async () => {
    installFetch({ sepeResource: [sepeRecord], sepeStale: true });
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "La copia del mercado laboral del SEPE puede estar desactualizada.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText(/datos formativos.*última copia/i),
    ).not.toBeInTheDocument();
  });

  it("keeps results interaction to static reads without browser-state writes", async () => {
    installFetch();
    const storageWriteSpies = [
      vi.spyOn(Storage.prototype, "setItem"),
      vi.spyOn(Storage.prototype, "removeItem"),
      vi.spyOn(Storage.prototype, "clear"),
    ];
    const cookieSpy = vi.spyOn(Document.prototype, "cookie", "set");
    const sendBeaconSpy = vi.fn();
    const previousBeacon = Object.getOwnPropertyDescriptor(
      window.navigator,
      "sendBeacon",
    );
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconSpy,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[`/desde-ocupacion/${occupation.occupationId}`]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: occupation.preferredLabel });
    await user.click(screen.getAllByText("Ver cita exacta")[0]);
    for (const storageWriteSpy of storageWriteSpies) {
      expect(storageWriteSpy).not.toHaveBeenCalled();
    }
    expect(cookieSpy).not.toHaveBeenCalled();
    expect(sendBeaconSpy).not.toHaveBeenCalled();
    const requests = vi.mocked(fetch).mock.calls;
    expect(requests.length).toBeGreaterThan(0);
    for (const [request, init] of requests) {
      const url = typeof request === "string" ? request : request.toString();
      const method = request instanceof Request ? request.method : init?.method;
      expect(url).toMatch(/^\/data\/v1\//u);
      expect(method ?? "GET").toBe("GET");
    }

    if (previousBeacon === undefined) {
      Reflect.deleteProperty(window.navigator, "sendBeacon");
    } else {
      Object.defineProperty(window.navigator, "sendBeacon", previousBeacon);
    }
  });
});
