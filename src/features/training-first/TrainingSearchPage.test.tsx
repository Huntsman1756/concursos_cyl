import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installFoundationFetch(programs: unknown[] = [program]): void {
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
    [
      manifest.resourceSnapshots.mappingCoverage.resourcePath,
      [
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
      ],
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
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.centers.resourcePath,
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.trainingOfferings.resourcePath,
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.jobOffers.resourcePath,
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
    await user.selectOptions(select, "COM01M");
    expect(screen.getByRole("status")).toHaveTextContent(
      /salidas oficiales disponibles.*todavía no hay una relación revisada para buscar ofertas/i,
    );
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

  it("keeps navigation disabled until an official program is selected", async () => {
    installFoundationFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Consulta salidas y ofertas relacionadas con tu FP",
      }),
    ).toBeVisible();
    const programSelect = screen.getByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    const submit = screen.getByRole("button", {
      name: "Ver salidas y ofertas",
    });
    expect(submit).toBeDisabled();

    await user.selectOptions(programSelect, "IFC03S");
    expect(submit).toBeEnabled();
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

    const select = await screen.findByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    expect(select).toHaveTextContent(
      "Desarrollo de Aplicaciones Web — Grado superior · IFC03S",
    );
    expect(select).toHaveTextContent(
      "Desarrollo de Aplicaciones Web — Grado medio · IFC03M",
    );
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
