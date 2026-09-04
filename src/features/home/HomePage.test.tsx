import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { HomePage } from "./HomePage";

const program = {
  programKey: "ADG02S",
  programTitle: "Administración y Finanzas",
  level: "higher",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
} as const;

const occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/eli/es/rd/2010/11/26/1591",
  reviewedAt: "2026-08-11",
  catalogVersion: "2.0.0",
} as const;

const accountingOccupation = {
  occupationId: "occupation:cno11:4111",
  preferredLabel: "Empleados de contabilidad",
  confirmationLabel: "Contabilidad",
  classificationSystem: "CNO-11",
  classificationCode: "4111",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/eli/es/rd/2010/11/26/1591",
  reviewedAt: "2026-08-11",
  catalogVersion: "2.0.0",
} as const;

const center = {
  centerCode: "5000001",
  centerName: "CIFP EJEMPLO",
  centerOwnership: "education",
  address: "C/ Ejemplo 1",
  email: "x@example.es",
  locality: "Zaragoza",
  phone: "000 000 000",
  province: "Zaragoza",
  website: null,
};

const offering = {
  centerCode: "5000001",
  centerName: "CIFP EJEMPLO",
  centerOwnership: "education",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
  level: "higher",
  locality: "Zaragoza",
  modality: "on_site",
  offeringId: "ADG02S:5000001:on_site:public:education",
  programKey: "ADG02S",
  programTitle: "Administración y Finanzas",
  province: "Zaragoza",
  teachingType: "public",
};

const graphRow = {
  trainingProgramKey: "ADG02S",
  occupationId: "occupation:cno11:4111",
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl:
    "https://www.todofp.es/que-estudiar/familias-profesionales/adg/administracion-y-finanzas.html",
  sourceQuote: "Administrativa / administrativo contable.",
  reviewedAt: "2026-08-12",
  mappingVersion: "1.0.0",
  reviewNote: "Relación oficial revisada contra TodoFP.",
};

const offerEvidenceFixture = {
  schemaVersion: "1.0.0",
  snapshotId: "20260830120000000-8c6c79fbd2a1",
  baseSnapshotId: "build-1",
  generatedAt: "2026-08-04T10:00:00.000Z",
  reviewVersion: "1.0.0",
  sourceSnapshots: [
    {
      snapshotId: "offers",
      sourceUrl: "https://example.es/offers",
      recordCount: 1,
      sha256:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
  ],
  counts: {
    offerCount: 1,
    offersWithPublishedRequirements: 0,
    requirementCount: 0,
    classifiedRequirementCount: 0,
    unclassifiedRequirementCount: 0,
    offersWithReviewedFpRelationship: 1,
    reviewedRelationCount: 1,
    offersWithAlternativePathway: 0,
    offersWithAmbiguity: 0,
  },
  notes: ["Nota de prueba"],
  records: [
    {
      offerId: "1285665634571",
      title: "EMPLEADOS ADMINISTRATIVOS DE CONTABILIDAD, EN GENERAL",
      occupationLabel: "Empleados administrativos de contabilidad, en general",
      province: "Zamora",
      locality: "Zamora",
      sourceName: "ECYL",
      employer: null,
      status: "published_in_snapshot",
      publishedAt: "2026-07-23T00:00:00.000Z",
      sourceDate: "2026-07-23T00:00:00.000Z",
      freshnessDate: "2026-07-23T00:00:00.000Z",
      sourceUrl: "https://example.es/offers",
      originalUrl: "https://empleo.jcyl.es/oferta/1285665634571",
      evidenceStatus: "reviewed_fp_relationship",
      hasAmbiguousRequirements: false,
      requirements: [],
      relations: [
        {
          programKey: "ADG02S",
          programTitle: "Administración y Finanzas",
          occupationId: "occupation:cno11:4111",
          occupationLabel: "Empleados de contabilidad",
          relationshipType: "official_output",
          matchRule: "reviewed_title_alias_exact",
          sourceUrl: "https://www.todofp.es/adg/administracion-y-finanzas.html",
          sourceQuote: "Administrativa / administrativo contable.",
          reviewedAt: "2026-08-12",
          mappingVersion: "1.0.0",
        },
      ],
      nextActions: [
        {
          actionType: "open_original_offer",
          targetKind: "external",
          label: "Abrir la oferta original",
          href: "https://empleo.jcyl.es/oferta/1285665634571",
          reason: "Comprueba la publicación.",
        },
      ],
    },
  ],
};

function relationshipAwareManifest() {
  const base = currentManifestFixture();
  const snapshot = base.resourceSnapshots.programs;
  return {
    ...base,
    resourceSnapshots: {
      ...base.resourceSnapshots,
      occupations: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/occupations.json",
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
      derivedFpOccupationGraph: {
        ...snapshot,
        resourcePath:
          "/data/v1/snapshots/build-1/derived-fp-occupation-graph.json",
      },
      offerEvidence: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/offer-evidence.json",
      },
    },
  };
}

function installHomeFetch({
  manifest = relationshipAwareManifest(),
  coverage = [] as unknown[],
  programs = [program],
  occupations = [occupation, accountingOccupation] as unknown[],
  aliases = [] as unknown[],
  links = [graphRow] as unknown[],
  centers = [center] as unknown[],
  offerings = [offering] as unknown[],
  evidence = offerEvidenceFixture as unknown,
  omitEvidence = false,
}: {
  manifest?: { resourceSnapshots: Record<string, { resourcePath: string }> };
  coverage?: unknown[];
  programs?: unknown[];
  occupations?: unknown[];
  aliases?: unknown[];
  links?: unknown[];
  centers?: unknown[];
  offerings?: unknown[];
  evidence?: unknown;
  omitEvidence?: boolean;
} = {}) {
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, programs],
    [manifest.resourceSnapshots.centers.resourcePath, centers],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, offerings],
    [manifest.resourceSnapshots.occupations.resourcePath, occupations],
    [manifest.resourceSnapshots.occupationAliases.resourcePath, aliases],
    [manifest.resourceSnapshots.trainingOccupationLinks.resourcePath, links],
  ]);
  const snapshots = manifest.resourceSnapshots as Record<
    string,
    { resourcePath: string }
  >;
  if (snapshots.mappingCoverage?.resourcePath !== undefined) {
    resources.set(snapshots.mappingCoverage.resourcePath, coverage);
  }
  if (!omitEvidence) {
    resources.set(snapshots.offerEvidence.resourcePath, evidence);
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

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("HomePage task selector", () => {
  it("starts on the FP tab and navigates after choosing an official cycle", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    const tablist = screen.getByRole("tablist", {
      name: "Elige tu punto de partida",
    });
    const fpTab = within(tablist).getByRole("tab", { name: "Tengo una FP" });
    expect(fpTab).toHaveAttribute("aria-selected", "true");
    expect(
      within(tablist).getByRole("tab", { name: "Busco una profesión" }),
    ).toHaveAttribute("aria-selected", "false");

    const combobox = await screen.findByRole("combobox", {
      name: "Busca tu ciclo",
    });
    expect(combobox).toHaveAttribute("aria-autocomplete", "list");

    await user.type(combobox, "ADG02S");
    const option = await screen.findByRole("option", {
      name: /Administración y Finanzas/u,
    });
    await user.click(option);
    await user.click(screen.getByRole("button", { name: "Ver mis salidas" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-fp/ADG02S?query=Administraci%C3%B3n+y+Finanzas",
    );
  });

  it("moves between intentions with Arrow keys (roving tabindex)", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const tablist = screen.getByRole("tablist", {
      name: "Elige tu punto de partida",
    });
    const fpTab = within(tablist).getByRole("tab", { name: "Tengo una FP" });
    const occupationTab = within(tablist).getByRole("tab", {
      name: "Busco una profesión",
    });
    const offerTab = within(tablist).getByRole("tab", {
      name: "Estoy mirando una oferta",
    });

    await user.click(fpTab);
    expect(fpTab).toHaveAttribute("aria-selected", "true");
    expect(occupationTab).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(occupationTab).toHaveAttribute("aria-selected", "true"),
    );
    expect(fpTab).toHaveAttribute("aria-selected", "false");
    expect(fpTab).toHaveAttribute("tabindex", "-1");
    expect(occupationTab).toHaveAttribute("tabindex", "0");
    expect(occupationTab).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(offerTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    await waitFor(() => expect(fpTab).toHaveAttribute("aria-selected", "true"));
    expect(fpTab).toHaveFocus();
  });

  it("reaches the occupation route from the profession journey", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("tab", { name: "Busco una profesión" }));
    const combobox = await screen.findByRole("combobox", {
      name: "Busca una profesión",
    });
    await user.type(combobox, "programación web");
    const option = await screen.findByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/u,
    });
    await user.click(option);
    await user.click(screen.getByRole("button", { name: "Buscar profesión" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-ocupacion/occupation%3Acno11%3A2713?query=Analistas%2C+programadores+y+dise%C3%B1adores+web+y+multimedia",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/data/v1/snapshots/build-1/occupations.json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("uses free text to reach the offer explorer", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("tab", { name: "Estoy mirando una oferta" }),
    );
    const query = await screen.findByRole("searchbox", {
      name: "Pega el título de la oferta",
    });
    await user.type(query, "cocina");
    await user.click(
      screen.getByRole("button", { name: "Analizar la oferta" }),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-oferta?query=cocina",
    );
  });
});

describe("HomePage proof rail (runtime derived)", () => {
  it("derives ciclos, centros and reviewed offers from the runtime snapshot", async () => {
    installHomeFetch();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const rail = await screen.findByRole("region", {
      name: "Datos y actualización de la copia activa",
    });
    expect(within(rail).getByText("ciclos oficiales")).toBeVisible();
    await waitFor(() =>
      expect(
        within(rail).getByText("ofertas con relación FP revisada"),
      ).toBeVisible(),
    );
    expect(within(rail).getByText("centros")).toBeVisible();
    // every value comes from the fixture runtime, never a hardcoded 187/138/229
    await waitFor(() => expect(within(rail).getAllByText("1")).toHaveLength(3));
    // audit closure: each counter exposes its own dataset date instead of one
    // global "copia activa" date that reads as the data date.
    await waitFor(() =>
      expect(within(rail).getAllByText(/fuente consultada el/u)).toHaveLength(
        2,
      ),
    );
    expect(within(rail).getByText(/evidencia generada el/u)).toBeVisible();
    expect(within(rail).getAllByText("4 de agosto de 2026")).toHaveLength(3);
    expect(
      screen.getByText(/Copia activa generada el 4 de agosto de 2026/u),
    ).toBeVisible();
    expect(
      screen.getByText(/cada cifra indica la fecha de su propia fuente/iu),
    ).toBeVisible();
  });
  it("marks the reviewed-offer stat as busy while the evidence loads", async () => {
    const manifest = relationshipAwareManifest();
    let resolveEvidence!: (response: Response) => void;
    const evidenceResponse = new Promise<Response>((resolve) => {
      resolveEvidence = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = typeof input === "string" ? input : input.toString();
        if (path.endsWith("/offer-evidence.json")) {
          return evidenceResponse;
        }
        const payload = new Map<string, unknown>([
          ["/data/v1/manifest.json", manifest],
          [manifest.resourceSnapshots.programs.resourcePath, [program]],
          [manifest.resourceSnapshots.centers.resourcePath, [center]],
          [
            manifest.resourceSnapshots.trainingOfferings.resourcePath,
            [offering],
          ],
          [
            manifest.resourceSnapshots.occupations.resourcePath,
            [occupation, accountingOccupation],
          ],
          [manifest.resourceSnapshots.occupationAliases.resourcePath, []],
          [
            manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
            [graphRow],
          ],
          [manifest.resourceSnapshots.mappingCoverage.resourcePath, []],
        ]).get(path);
        return Promise.resolve(
          payload === undefined
            ? new Response(null, { status: 404 })
            : new Response(JSON.stringify(payload), { status: 200 }),
        );
      }),
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const rail = screen.getByRole("region", {
      name: "Datos y actualización de la copia activa",
    });
    expect(within(rail).getAllByText("…")).toHaveLength(3);
    resolveEvidence(
      new Response(JSON.stringify(offerEvidenceFixture), { status: 200 }),
    );
    await waitFor(() =>
      expect(within(rail).queryAllByText("…")).toHaveLength(0),
    );
    expect(
      within(rail).getByText("ofertas con relación FP revisada"),
    ).toBeVisible();
  });
});

describe("HomePage real example (approved only)", () => {
  it("shows the approved ADG02S example derived from runtime data", async () => {
    installHomeFetch();

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const section = await screen.findByRole("region", {
      name: "Comprueba cómo funciona",
    });
    expect(
      await within(section).findByRole("heading", {
        name: "Administración y Finanzas",
      }),
    ).toBeVisible();
    expect(
      within(section).getByText("Empleados de contabilidad"),
    ).toBeVisible();
    expect(
      await within(section).findByText(
        "EMPLEADOS ADMINISTRATIVOS DE CONTABILIDAD, EN GENERAL",
      ),
    ).toBeVisible();
    expect(
      within(section).getByRole("link", { name: "Ver el ejemplo completo" }),
    ).toHaveAttribute("href", "/desde-fp/ADG02S");
  });

  it("hides the example when the approved relationship is not in the runtime copy", async () => {
    installHomeFetch({ links: [] });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("region", { name: "Comprueba cómo funciona" }),
      ).not.toBeInTheDocument();
    });
  });
});

describe("HomePage freshness and lifecycle", () => {
  it("presents the reviewed-relationship freshness", async () => {
    installHomeFetch({
      coverage: [
        {
          scope: "program",
          programKey: "ADG02S",
          programTitle: "Administración y Finanzas",
          familyCode: "ADG",
          familyName: "Administración y Gestión",
          approvedMappings: 1,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Incluye relaciones ocupacionales revisadas y citadas.",
        },
      ],
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("region", {
        name: "Fecha de relaciones revisadas",
      }),
    ).toHaveTextContent(
      "Relaciones revisadas · fuente actualizada el 31 de julio de 2026",
    );
  });

  it("labels legacy freshness with the job-offer fallback scope", async () => {
    const baseManifest = relationshipAwareManifest();
    const legacyResourceSnapshots = Object.fromEntries(
      Object.entries(baseManifest.resourceSnapshots).filter(
        ([key]) => key !== "mappingCoverage",
      ),
    );
    const legacyManifest = {
      ...baseManifest,
      resourceSnapshots: legacyResourceSnapshots,
    };
    installHomeFetch({ manifest: legacyManifest });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const freshness = await screen.findByRole("region", {
      name: "Fecha de ofertas laborales",
    });
    expect(freshness).toHaveTextContent(
      "Ofertas laborales · fuente actualizada el 31 de julio de 2026",
    );
  });

  it("announces a pending manifest before rendering the reviewed-relationship date", async () => {
    let resolveManifest!: (response: Response) => void;
    const manifestResponse = new Promise<Response>((resolve) => {
      resolveManifest = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => manifestResponse),
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const freshness = screen.getByRole("region", {
      name: "Fecha de relaciones revisadas",
    });
    expect(freshness).toHaveAttribute("aria-busy", "true");
    expect(within(freshness).getByText("Comprobando fecha…")).toBeVisible();

    resolveManifest(
      new Response(JSON.stringify(relationshipAwareManifest()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() =>
      expect(freshness).toHaveAttribute("aria-busy", "false"),
    );
    expect(
      within(freshness).queryByText("Comprobando fecha…"),
    ).not.toBeInTheDocument();
  });

  it("requests the manifest once per mount", async () => {
    const manifest = relationshipAwareManifest();
    const isManifestRequest = (input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      return path.endsWith("/data/v1/manifest.json");
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      return Promise.resolve(
        isManifestRequest(input)
          ? new Response(JSON.stringify(manifest), { status: 200 })
          : new Response(null, { status: 404 }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input]) => isManifestRequest(input)),
      ).toHaveLength(1),
    );
  });

  it("aborts pending generated-data work when Home unmounts", async () => {
    const manifest = relationshipAwareManifest();
    let programSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const path = typeof input === "string" ? input : input.toString();
        if (path.endsWith("/data/v1/manifest.json")) {
          return Promise.resolve(
            new Response(JSON.stringify(manifest), { status: 200 }),
          );
        }
        if (path.endsWith(manifest.resourceSnapshots.programs.resourcePath)) {
          programSignal = init?.signal ?? undefined;
        }
        return new Promise<Response>(() => undefined);
      }),
    );

    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(programSignal).toBeDefined());
    unmount();
    expect(programSignal).toHaveProperty("aborted", true);
  });
});
