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
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
} as const;

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installHomeFetch(): void {
  const manifest = currentManifestFixture();
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, [program]],
    [manifest.resourceSnapshots.mappingCoverage.resourcePath, []],
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("uses a searchable FP combobox and navigates only after official confirmation", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    const combobox = await screen.findByRole("combobox", {
      name: /título de formación/i,
    });
    expect(combobox).toHaveAttribute("aria-autocomplete", "list");
    expect(screen.queryAllByRole("option")).toHaveLength(0);

    const submit = screen.getByRole("button", {
      name: /ver las salidas de este título/i,
    });
    await user.type(combobox, "IFC03S");
    expect(submit).toBeDisabled();

    await user.keyboard("{ArrowDown}{Enter}");
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-fp/IFC03S",
    );
  });

  it("presents manifest-addressed reviewed coverage and excludes unsupported programs", async () => {
    const baseManifest = currentManifestFixture();
    const manifest = {
      ...baseManifest,
      resourceSnapshots: {
        ...baseManifest.resourceSnapshots,
        mappingCoverage: {
          ...baseManifest.resourceSnapshots.programs,
          resourcePath: "/data/v1/snapshots/build-1/mapping-coverage.json",
        },
        occupations: {
          ...baseManifest.resourceSnapshots.programs,
          resourcePath: "/data/v1/snapshots/build-1/occupations.json",
        },
        occupationAliases: {
          ...baseManifest.resourceSnapshots.programs,
          resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
        },
        trainingOccupationLinks: {
          ...baseManifest.resourceSnapshots.programs,
          resourcePath:
            "/data/v1/snapshots/build-1/training-occupation-links.json",
        },
      },
    };
    const coverage = [
      {
        scope: "program",
        programKey: "IFC03S",
        programTitle: "Desarrollo de Aplicaciones WEB",
        familyCode: "IFC",
        familyName: "Informática y Comunicaciones",
        approvedMappings: 1,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 0,
        coverageStatus: "reviewed",
        coverageNote: "Incluye relaciones ocupacionales revisadas y citadas.",
      },
      {
        scope: "program",
        programKey: "IFC03SD",
        programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
        familyCode: "IFC",
        familyName: "Informática y Comunicaciones",
        approvedMappings: 1,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 0,
        coverageStatus: "reviewed",
        coverageNote: "Incluye relaciones ocupacionales revisadas y citadas.",
      },
      ...["SAN21", "HOT01M", "SSC01M", "EOC01M"].map((programKey) => ({
        scope: "program" as const,
        programKey,
        programTitle: programKey,
        familyCode: "PILOT",
        familyName: "Pilot",
        approvedMappings: 1,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 0,
        coverageStatus: "reviewed" as const,
        coverageNote: "Incluye relaciones ocupacionales revisadas y citadas.",
      })),
      {
        scope: "program",
        programKey: "COM01M",
        programTitle: "Actividades Comerciales",
        familyCode: "COM",
        familyName: "Comercio y Marketing",
        approvedMappings: 0,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 1,
        coverageStatus: "uncovered",
        coverageNote: "Aún no hay una relación ocupacional aprobada.",
      },
    ];
    const program = {
      programKey: "IFC03S",
      programTitle: "Desarrollo de Aplicaciones Web",
      level: "higher",
      familyCode: "IFC",
      familyName: "Informática y Comunicaciones",
    };
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
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = typeof input === "string" ? input : input.toString();
        const payload =
          path === "/data/v1/manifest.json"
            ? manifest
            : path === manifest.resourceSnapshots.mappingCoverage.resourcePath
              ? coverage
              : path === manifest.resourceSnapshots.programs.resourcePath
                ? [program]
                : path === manifest.resourceSnapshots.centers.resourcePath ||
                    path ===
                      manifest.resourceSnapshots.trainingOfferings
                        .resourcePath ||
                    path ===
                      manifest.resourceSnapshots.jobOffers.resourcePath ||
                    path ===
                      manifest.resourceSnapshots.occupationAliases
                        .resourcePath ||
                    path ===
                      manifest.resourceSnapshots.trainingOccupationLinks
                        .resourcePath
                  ? []
                  : path === manifest.resourceSnapshots.occupations.resourcePath
                    ? [occupation]
                    : undefined;
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

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /De tu FP a tu\s*siguiente paso/i,
      }),
    ).toBeVisible();
    const coveragePanel = screen.getByRole("region", {
      name: "Cobertura revisada",
    });
    await waitFor(() =>
      expect(
        within(coveragePanel).getByRole("list", {
          name: "Ciclos revisados destacados",
        }),
      ).toBeVisible(),
    );
    expect(
      screen.getByRole("region", { name: "Fecha de relaciones revisadas" }),
    ).toHaveTextContent("Relaciones revisadas: copia del 31/07/2026");
    expect(
      screen.queryByText("Actualizado: 31/07/2026"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Ejemplos de ciclos con relaciones revisadas; no es el catálogo completo.",
      ),
    ).toBeVisible();
    expect(within(coveragePanel).getAllByRole("listitem")).toHaveLength(2);
    expect(coveragePanel).toHaveTextContent("Desarrollo de Aplicaciones WEB");
    expect(coveragePanel).toHaveTextContent(/EOC01M|HOT01M|SAN21|SSC01M/);
    expect(coveragePanel).not.toHaveTextContent("IFC03SD");
    expect(coveragePanel).not.toHaveTextContent("COM01M");
    expect(screen.queryByText(/Administración/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/educación infantil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/soldadura/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Junta de Castilla y León/i),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByLabelText("Título de Formación Profesional"),
    ).toBeVisible();
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.programs.resourcePath,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.centers.resourcePath,
      expect.anything(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.trainingOfferings.resourcePath,
      expect.anything(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.jobOffers.resourcePath,
      expect.anything(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.occupationAliases.resourcePath,
      expect.anything(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
      expect.anything(),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.occupations.resourcePath,
      expect.anything(),
    );
    expect(
      screen.queryByRole("combobox", { name: "Ocupación que te interesa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Ver las salidas de este título",
      }),
    ).toBeDisabled();
    expect(screen.getByText("Tu título de FP")).toBeVisible();
    expect(screen.getByText("Elige un título.")).toBeVisible();
    expect(
      screen.getByText(
        "Dime en qué puedo trabajar con lo que ya he estudiado.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Dime qué FP me lleva hasta esa ocupación."),
    ).toBeVisible();

    const user = userEvent.setup();
    const fpMode = screen.getByRole("radio", {
      name: /Tengo un título de FP/i,
    });
    fpMode.focus();
    await user.keyboard("{ArrowRight}");
    expect(
      screen.getByRole("radio", { name: /Tengo un empleo en mente/i }),
    ).toHaveFocus();
    expect(
      screen.queryByLabelText("Título de Formación Profesional"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Ocupación que te interesa" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        manifest.resourceSnapshots.occupationAliases.resourcePath,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(fetch).toHaveBeenCalledWith(
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(fetch).toHaveBeenCalledWith(
        manifest.resourceSnapshots.occupations.resourcePath,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
    expect(
      screen.getByRole("button", {
        name: "Ver cómo llegar a esta ocupación",
      }),
    ).toBeDisabled();
    expect(screen.getByText("Elige una ocupación de la lista.")).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: "Ver las salidas de este título",
      }),
    ).not.toBeInTheDocument();
    expect(window.localStorage.getItem("salida-cyl:home-search-mode")).toBe(
      "occupation",
    );
    expect(
      screen.getByRole("link", { name: "Método y límites" }),
    ).toHaveAttribute("href", "/metodologia");
    const commitments = screen.getByRole("region", {
      name: "Compromisos del proyecto",
    });
    expect(commitments).toHaveTextContent(
      "Fuentes públicasRelaciones revisadasSin cuentas ni cookiesMétodo y límites",
    );
    expect(
      screen.getByRole("link", { name: /Comparar ingresos/u }),
    ).toHaveAttribute("href", "/comparar");
    expect(
      screen.queryByRole("link", { name: /Buscar por tu título/u }),
    ).not.toBeInTheDocument();
    expect(commitments).not.toHaveTextContent(
      /Datos de administraciones|Vínculos publicados|Sin registro/i,
    );
  });

  it("restores a valid saved search mode and ignores invalid values", () => {
    window.localStorage.setItem("salida-cyl:home-search-mode", "occupation");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    const { unmount } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("radio", { name: /Tengo un empleo en mente/i }),
    ).toBeChecked();
    expect(screen.getByText("Ocupación que quieres")).toBeVisible();

    unmount();
    window.localStorage.setItem("salida-cyl:home-search-mode", "invalid");
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("radio", { name: /Tengo un título de FP/i }),
    ).toBeChecked();
  });

  it("requests the manifest once per mount", async () => {
    const manifest = currentManifestFixture();
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

  it("labels legacy freshness with the job-offer fallback scope", async () => {
    const currentManifest = currentManifestFixture();
    const legacyResourceSnapshots = Object.fromEntries(
      Object.entries(currentManifest.resourceSnapshots).filter(
        ([key]) => key !== "mappingCoverage",
      ),
    );
    const legacyManifest = {
      ...currentManifest,
      resourceSnapshots: legacyResourceSnapshots,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const path = typeof input === "string" ? input : input.toString();
        return Promise.resolve(
          path.endsWith("/data/v1/manifest.json")
            ? new Response(JSON.stringify(legacyManifest), { status: 200 })
            : new Response(null, { status: 404 }),
        );
      }),
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const freshness = await screen.findByRole("region", {
      name: "Fecha de ofertas laborales",
    });
    expect(freshness).toHaveTextContent(
      "Ofertas laborales: copia del 31/07/2026",
    );
    expect(
      screen.queryByText("Relaciones revisadas: copia del 31/07/2026"),
    ).not.toBeInTheDocument();
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
      new Response(JSON.stringify(currentManifestFixture()), {
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
    expect(within(freshness).getByText("31/07/2026")).toBeVisible();
  });

  it("aborts pending generated-data work when Home unmounts", async () => {
    const manifest = currentManifestFixture();
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
