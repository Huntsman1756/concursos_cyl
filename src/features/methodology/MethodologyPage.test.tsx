import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "../../../scripts/data/educabaseIncomeSources";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { MethodologyPage } from "./MethodologyPage";

const TERMS_URL = "https://www.educacionyfp.gob.es/comunes/aviso-legal.html";

function manifestWithIncomeEvidence() {
  const manifest = currentManifestFixture();
  const artifacts = Object.values(EDUCABASE_INCOME_SOURCES).flatMap((source) =>
    (["csv", "px"] as const).map((format, index) => ({
      tableId: source.tableId,
      format,
      sourceUrl: format === "csv" ? source.csvUrl : source.pxUrl,
      catalogUrl: source.catalogUrl,
      fetchedAt: "2026-08-09T01:43:18.761Z",
      declaredContentType:
        format === "csv"
          ? "text/plain;charset=ISO-8859-15"
          : "application/pc-axis;charset=ISO-8859-15",
      byteLength: 10_000 + index,
      sha256: (source.tableId.endsWith("08") ? "b" : "c").repeat(64),
      effectiveEncoding: format === "csv" ? "utf-8" : "iso-8859-15",
    })),
  );
  return {
    ...manifest,
    resourceSnapshots: {
      ...manifest.resourceSnapshots,
      outcomeIndicators: {
        ...manifest.resourceSnapshots.programs,
        sourceId: "educabase-income",
        sourceUrl: TERMS_URL,
        snapshotFetchedAt: "2026-08-09T01:43:18.761Z",
        recordCount: 22_170,
        sha256: "d".repeat(64),
        resourcePath: "/data/v1/snapshots/build-1/outcome-indicators.json",
        upstreamArtifacts: artifacts,
      },
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MethodologyPage", () => {
  it("explains each income scope and its statistical limits without merging them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(manifestWithIncomeEvidence()), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );

    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
    ).toBeVisible();
    const national = screen.getByRole("article", {
      name: "Ciclos y grupos en España",
    });
    const regional = screen.getByRole("article", {
      name: "Nivel formativo en Castilla y León",
    });
    for (const card of [national, regional]) {
      for (const heading of [
        "Qué aporta",
        "Qué no permite afirmar",
        "Actualización y huella",
        "Fuente original",
      ]) {
        expect(
          within(card).getByRole("heading", { level: 3, name: heading }),
        ).toBeVisible();
      }
    }

    expect(national).toHaveTextContent(/base de cotización.*anualizada/i);
    expect(national).toHaveTextContent(/cuenta ajena.*jornada completa/i);
    expect(national).toHaveTextContent(/ciclo o grupo oficial/i);
    expect(national).toHaveTextContent(/límites inferiores.*quintiles/i);
    expect(regional).toHaveTextContent(/centro donde se obtuvo la titulación/i);
    expect(regional).toHaveTextContent(/no.*residencia.*lugar de trabajo/i);

    for (const tableId of [
      "famprof_2_08",
      "famprof_3_08",
      "ccaa_2_07",
      "ccaa_3_07",
    ]) {
      expect(screen.getByText(tableId)).toBeVisible();
    }
    expect(
      screen.getByRole("link", { name: "Aviso legal del Ministerio" }),
    ).toHaveAttribute("href", TERMS_URL);
    expect(screen.getByText("Controles técnicos de publicación")).toBeVisible();

    await waitFor(() =>
      expect(within(national).getByText(/9 de agosto de 2026/i)).toBeVisible(),
    );
    expect(within(national).getByText(/d{12}/i)).toBeVisible();
    expect(
      within(national).getByRole("link", {
        name: "Descargar evidencia normalizada",
      }),
    ).toHaveAttribute(
      "href",
      "/data/v1/snapshots/build-1/outcome-indicators.json",
    );
  });

  it("documents unavailable cells, provisional windows, and last-known-good behavior", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(manifestWithIncomeEvidence()), {
            status: 200,
          }),
        ),
      ),
    );
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/El valor «\.\.\u00bb/i)).toHaveTextContent(
      /no disponible o no representativo/i,
    );
    expect(screen.getByText(/Las ventanas observadas/i)).toHaveTextContent(
      /cuatro años.*tres.*dos/i,
    );
    expect(screen.getByText(/Si una actualización falla/i)).toHaveTextContent(
      /última copia válida/i,
    );
  });

  it("reports a historical manifest without income evidence as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(currentManifestFixture()), {
            status: 200,
          }),
        ),
      ),
    );
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findAllByText(
        /esta versión no contiene la evidencia de ingresos/i,
      ),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Descargar evidencia normalizada" }),
    ).not.toBeInTheDocument();
  });
});
