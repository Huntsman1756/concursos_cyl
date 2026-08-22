import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { AppRoutes } from "../../app/routes";

const program = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
} as const;

const administrationProgram = {
  programKey: "ADG01S",
  programTitle: "Administración y Finanzas",
  level: "higher",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
} as const;

const healthProgram = {
  programKey: "SAN01M",
  programTitle: "Cuidados Auxiliares de Enfermería",
  level: "intermediate",
  familyCode: "SAN",
  familyName: "Sanidad",
} as const;

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const defaultCoverage = [
  {
    scope: "program",
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
    approvedMappings: 1,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageStatus: "reviewed",
    coverageNote: "Revisada.",
  },
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
    coverageNote: "No disponible.",
  },
];

function installFoundationFetch(
  programs: unknown[] = [program],
  coverage: unknown[] = defaultCoverage,
): void {
  const baseManifest = currentManifestFixture();
  const manifest = {
    ...baseManifest,
    resourceSnapshots: {
      ...baseManifest.resourceSnapshots,
      mappingCoverage: {
        ...baseManifest.resourceSnapshots.programs,
        resourcePath: "/data/v1/snapshots/build-1/mapping-coverage.json",
      },
    },
  };
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, programs],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, []],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
    [manifest.resourceSnapshots.mappingCoverage.resourcePath, coverage],
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
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("training-first search", () => {
  it("loads only programs from the foundation for search", async () => {
    installFoundationFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    const manifest = currentManifestFixture();
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
  });

  it("shows reviewed and unavailable coverage before submitting an official program", async () => {
    installFoundationFetch([
      program,
      {
        ...program,
        programKey: "COM01M",
        programTitle: "Actividades Comerciales",
      },
    ]);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    const select = await screen.findByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    await user.type(select, "COM01M");
    await user.keyboard("{ArrowDown}{Enter}");
    const unavailableStatus = screen.getByText(
      /salidas oficiales disponibles.*todavía no hay una relación revisada para buscar ofertas/i,
    );
    expect(unavailableStatus).toHaveAttribute("role", "status");
    expect(unavailableStatus).toHaveAttribute("aria-live", "polite");
    const catalogScope = screen.getByRole("region", {
      name: "Alcance del catálogo de FP",
    });
    expect(catalogScope).toHaveTextContent("2 ciclos oficiales");
    expect(catalogScope).toHaveTextContent(
      "1 ciclo o modalidad con esa relación revisada",
    );
    expect(
      within(catalogScope).getByRole("link", {
        name: "Cómo funciona la cobertura de FP",
      }),
    ).toHaveAttribute("href", "/metodologia#fp-catalogo");
    expect(
      screen.getByRole("button", { name: "Ver salidas y ofertas" }),
    ).toBeEnabled();
  });

  it.each([
    [1, "Relaciones revisadas con 1 grupo de ocupación."],
    [2, "Relaciones revisadas con 2 grupos de ocupación."],
  ])(
    "uses singular/plural coverage copy for %s reviewed occupation groups",
    async (approvedMappings, expectedCopy) => {
      installFoundationFetch(
        [program],
        [
          {
            ...defaultCoverage[0],
            approvedMappings,
          },
        ],
      );
      const user = userEvent.setup();
      render(
        <MemoryRouter initialEntries={["/desde-fp"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      const programCombobox = await screen.findByRole("combobox", {
        name: "Ciclo de Formación Profesional",
      });
      await user.type(programCombobox, "IFC03S");
      await user.keyboard("{ArrowDown}{Enter}");

      const status = await screen.findByText(expectedCopy);
      expect(status).toBeVisible();
      expect(status).toHaveAttribute("role", "status");
    },
  );

  it("announces loading while the official programs are pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const loading = screen.getByText("Preparando los ciclos oficiales…");
    expect(loading).toBeVisible();
    expect(loading.closest("section")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps navigation disabled until an official program is confirmed", async () => {
    installFoundationFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const heading = await screen.findByRole("heading", {
      name: "Consulta salidas y ofertas relacionadas con tu FP",
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute("id", "training-search-heading");
    expect(heading.closest("section")).toHaveAttribute(
      "aria-labelledby",
      "training-search-heading",
    );
    const programCombobox = screen.getByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    const submit = screen.getByRole("button", {
      name: "Ver salidas y ofertas",
    });
    expect(submit).toBeDisabled();

    await user.type(programCombobox, "IFC03S");
    expect(submit).toBeDisabled();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(submit).toBeEnabled();
  });

  it("filters the in-memory catalogue and clears a confirmation hidden by a filter", async () => {
    installFoundationFetch([program, administrationProgram, healthProgram]);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const levelFilter = await screen.findByRole("combobox", {
      name: "Filtrar por nivel",
    });
    const familyFilter = screen.getByRole("combobox", {
      name: "Filtrar por familia profesional",
    });
    const programCombobox = screen.getByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    const submit = screen.getByRole("button", { name: /ver salidas/i });

    await user.selectOptions(levelFilter, "higher");
    await user.selectOptions(familyFilter, "IFC");
    await user.type(programCombobox, "IFC03S");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(submit).toBeEnabled();

    await user.selectOptions(familyFilter, "ADG");
    expect(submit).toBeDisabled();
    expect(programCombobox).toHaveValue("");
  });

  it("confirms a filtered program and exposes exactly the reviewed guided examples in the catalogue", async () => {
    installFoundationFetch(
      [program, administrationProgram, healthProgram],
      [
        ...defaultCoverage.filter((row) => row.programKey !== "COM01M"),
        {
          scope: "program",
          programKey: "ADG01S",
          programTitle: "Administración y Finanzas",
          familyCode: "ADG",
          familyName: "Administración y Gestión",
          approvedMappings: 1,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Revisada.",
        },
        {
          scope: "program",
          programKey: "SAN01M",
          programTitle: "Cuidados Auxiliares de Enfermería",
          familyCode: "SAN",
          familyName: "Sanidad",
          approvedMappings: 1,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Revisada.",
        },
        {
          scope: "program",
          programKey: "COM01M",
          programTitle: "Zeta comercial no publicada",
          familyCode: "COM",
          familyName: "Comercio y Marketing",
          approvedMappings: 1,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Revisada.",
        },
      ],
    );

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const examples = await screen.findByRole("region", {
      name: "Ejemplos guiados de ciclos",
    });
    expect(examples).toHaveTextContent(
      "Ejemplos de ciclos con relaciones revisadas; no es el catálogo completo.",
    );
    const guidedLinks = within(examples).getAllByRole("link");
    expect(guidedLinks).toHaveLength(3);
    expect(guidedLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/desde-fp/ADG01S",
      "/desde-fp/SAN01M",
      "/desde-fp/IFC03S",
    ]);
    expect(
      within(examples).queryByRole("link", { name: /zeta comercial/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the exact province context copy and preserves the encoded route", async () => {
    installFoundationFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>,
    );

    const programCombobox = await screen.findByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    await user.type(programCombobox, "IFC03S");
    await user.keyboard("{ArrowDown}{Enter}");
    const province = screen.getByRole("combobox", {
      name: "Provincia para el contexto (opcional)",
    });
    expect(province).toHaveAttribute(
      "aria-describedby",
      "training-province-hint",
    );
    expect(
      screen.getByText(
        "Se usa solo para mostrar contexto provincial; no filtra los centros publicados.",
      ),
    ).toHaveAttribute("id", "training-province-hint");
    await user.selectOptions(province, "León");
    await user.click(screen.getByRole("button", { name: /ver salidas/i }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-fp/IFC03S?province=Le%C3%B3n",
    );
  });

  it("announces readiness once and moves focus to main after the catalog is ready", async () => {
    installFoundationFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("distinguishes homonymous official programs by level and key", async () => {
    installFoundationFetch([
      program,
      {
        ...program,
        programKey: "IFC03M",
        level: "intermediate",
      },
    ]);
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    const combobox = await screen.findByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    await user.type(combobox, "Desarrollo de Aplicaciones Web");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.textContent)).toEqual([
      expect.stringContaining(
        "Grado medio · Informática y Comunicaciones · IFC03M",
      ),
      expect.stringContaining(
        "Grado superior · Informática y Comunicaciones · IFC03S",
      ),
    ]);
  });

  it("rejects an unknown program key with a useful path back", async () => {
    installFoundationFetch();

    render(
      <MemoryRouter initialEntries={["/desde-fp/UNKNOWN"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Ciclo no encontrado" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Elegir otro ciclo" }),
    ).toHaveAttribute("href", "/desde-fp");
  });

  it("shows a recoverable error when official data cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "No hemos podido cargar los ciclos",
      }),
    ).toBeVisible();
  });
});
