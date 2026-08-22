import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoadableGeneratedManifestSchema } from "../../../data/schemas/generated";
import {
  SEPE_CYL_PROVINCES,
  SEPE_OCCUPATION_MARKET_ATTRIBUTION,
} from "../../../data/schemas/sepeOccupationMarket";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { OccupationMarketEvidence } from "./OccupationMarketEvidence";

const resourcePath = "/data/v1/snapshots/build-1/sepe-occupation-market.json";

const record = {
  period: "2026-07",
  cno: { code: "2713", label: "Analistas, programadores y diseñadores web" },
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
      monthlyVariationPercent: 0,
      annualVariationPercent: 0,
    },
    ...(index === 1
      ? {}
      : {
          registeredUnemployment: {
            total: index + 10,
            monthlyVariationPercent: 0,
            annualVariationPercent: 0,
          },
        }),
  })),
  source: {
    url: "https://www.sepe.es/HomeSepe/occupation/2713",
    retrievedAt: "2026-08-22T09:30:00Z",
    attribution: SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  },
} as const;

function manifestWithResource({
  qualityStatus = "passed",
}: { qualityStatus?: "passed" | "stale" } = {}) {
  const base = currentManifestFixture();
  return LoadableGeneratedManifestSchema.parse({
    ...base,
    resourceSnapshots: {
      ...base.resourceSnapshots,
      sepeOccupationMarket: {
        ...base.resourceSnapshots.programs,
        sourceId: "sepe-occupation-market",
        sourceUrl: record.source.url,
        resourcePath,
        recordCount: 1,
        qualityStatus,
      },
    },
  });
}

function installResource(payload: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const path =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : new URL(input.url).pathname;
      return Promise.resolve(
        new Response(JSON.stringify(path === resourcePath ? payload : null), {
          status: path === resourcePath ? 200 : 404,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OccupationMarketEvidence", () => {
  it("renders exact CNO evidence, provenance and every Castilla y León province", async () => {
    installResource([record]);
    render(
      <OccupationMarketEvidence
        manifest={manifestWithResource()}
        cnoCode="2713"
      />,
    );

    const panel = await screen.findByRole("region", {
      name: "Mercado laboral de esta ocupación",
    });
    expect(panel).toHaveTextContent("julio de 2026");
    expect(panel).toHaveTextContent("116");
    expect(panel).toHaveTextContent("115");
    expect(panel).toHaveTextContent("2478");
    expect(panel).toHaveTextContent("−4,92 %");
    expect(panel).toHaveTextContent("17,5 %");
    expect(
      within(panel).getByRole("link", { name: /Fuente oficial SEPE/i }),
    ).toHaveAttribute("target", "_blank");
    expect(
      within(panel).getByRole("link", { name: /Fuente oficial SEPE/i }),
    ).toHaveAttribute("rel", "noreferrer");
    expect(panel).toHaveTextContent(SEPE_OCCUPATION_MARKET_ATTRIBUTION);
    const table = within(panel).getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(10);
    for (const province of SEPE_CYL_PROVINCES) {
      expect(within(table).getByText(province)).toBeVisible();
    }
  });

  it("does not reuse a record for a different CNO code", async () => {
    installResource([record]);
    render(
      <OccupationMarketEvidence
        manifest={manifestWithResource()}
        cnoCode="2721"
      />,
    );

    expect(
      await screen.findByText(
        "No hay un registro SEPE publicado para CNO-11 2721.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("2478")).not.toBeInTheDocument();
  });

  it("prints observed zero and keeps an unpublished optional value explicit", async () => {
    const zeroRecord = {
      ...record,
      national: {
        ...record.national,
        registeredContracts: {
          ...record.national.registeredContracts,
          total: 0,
          people: undefined,
        },
      },
    };
    installResource([zeroRecord]);
    render(
      <OccupationMarketEvidence
        manifest={manifestWithResource()}
        cnoCode="2713"
      />,
    );

    const summary = await screen.findByLabelText("Resumen del mercado laboral");
    expect(summary).toHaveTextContent("0");
    expect(summary).toHaveTextContent("No publicado");
  });

  it("separates absent, validation-error and stale resource states", async () => {
    render(
      <OccupationMarketEvidence
        manifest={LoadableGeneratedManifestSchema.parse(
          currentManifestFixture(),
        )}
        cnoCode="2713"
      />,
    );
    expect(
      await screen.findByText(
        "El recurso de mercado laboral del SEPE no está disponible para esta copia de datos.",
      ),
    ).toBeVisible();

    cleanup();
    installResource([{ invalid: true }]);
    render(
      <OccupationMarketEvidence
        manifest={manifestWithResource()}
        cnoCode="2713"
      />,
    );
    expect(
      await screen.findByText(
        "No hemos podido cargar los datos del mercado laboral del SEPE.",
      ),
    ).toBeVisible();

    cleanup();
    installResource([record]);
    render(
      <OccupationMarketEvidence
        manifest={manifestWithResource({ qualityStatus: "stale" })}
        cnoCode="2713"
      />,
    );
    expect(
      await screen.findByText(
        "La copia del mercado laboral del SEPE puede estar desactualizada.",
      ),
    ).toBeVisible();
  });
});
