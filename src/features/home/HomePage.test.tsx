import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { HomePage } from "./HomePage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
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
        name: "Elige tu camino y actúa con información oficial",
      }),
    ).toBeVisible();
    const coveragePanel = screen.getByRole("region", {
      name: "Disponible ahora",
    });
    await waitFor(() => expect(coveragePanel).toHaveTextContent("IFC03S"));
    expect(coveragePanel).toHaveTextContent(
      "El catálogo completo contiene 1 ciclo oficial",
    );
    expect(coveragePanel).toHaveTextContent(
      /Esta lista destaca solo ciclos con cobertura ocupacional revisada/i,
    );
    for (const programKey of [
      "IFC03S",
      "IFC03SD",
      "SAN21",
      "HOT01M",
      "SSC01M",
      "EOC01M",
    ]) {
      expect(coveragePanel).toHaveTextContent(programKey);
    }
    expect(coveragePanel).not.toHaveTextContent("COM01M");
    expect(screen.queryByText(/Administración/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/educación infantil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/soldadura/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Junta de Castilla y León/i),
    ).not.toBeInTheDocument();
    expect(await screen.findByLabelText("¿Qué has estudiado?")).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "¿Qué ocupación te interesa?" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Explorar salidas laborales" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Buscar ciclos que te preparan" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Selecciona cualquiera de los ciclos oficiales y consulta sus salidas profesionales.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Filtra 1 grupos de ocupación oficiales y consulta qué FP tienen una relación revisada.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Sobre la cobertura" }),
    ).toHaveTextContent(
      /Las relaciones entre ambos se incorporan de forma progresiva/i,
    );
    expect(
      screen.getByRole("link", { name: "Saber más sobre los datos" }),
    ).toHaveAttribute("href", "/metodologia");
  });

  it("announces a pending manifest before rendering the validated update date", async () => {
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
      name: "Actualización de datos",
    });
    expect(freshness).toHaveAttribute("aria-busy", "true");
    expect(
      within(freshness).getByText("Comprobando la fecha de los datos…"),
    ).toBeVisible();

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
      within(freshness).queryByText("Comprobando la fecha de los datos…"),
    ).not.toBeInTheDocument();
    expect(within(freshness).getByText("31 de julio de 2026")).toBeVisible();
  });
});
