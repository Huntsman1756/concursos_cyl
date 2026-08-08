import { cleanup, render, screen } from "@testing-library/react";
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

const center = {
  centerCode: "05000701",
  centerName: "IES ALONSO DE MADRIGAL",
  centerOwnership: "education",
  province: "Ávila",
  locality: "Ávila",
  address: "C/ Francisco de Vitoria, s/n",
  phone: "920 222185",
  email: "05000701@educa.jcyl.es",
  website: "http://iesalonsodemadrigal.centros.educa.jcyl.es/",
} as const;

const offering = {
  ...program,
  centerCode: center.centerCode,
  centerName: center.centerName,
  centerOwnership: center.centerOwnership,
  province: center.province,
  locality: center.locality,
  modality: "on_site",
  offeringId: "IFC03S:05000701:on_site:public:education",
  teachingType: "public",
} as const;

function installFetch(): void {
  const manifest = currentManifestFixture();
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, [program]],
    [manifest.resourceSnapshots.centers.resourcePath, [center]],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, [offering]],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      return Promise.resolve(
        new Response(JSON.stringify(resources.get(path)), {
          status: resources.has(path) ? 200 : 404,
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

describe("TrainingRoutePage", () => {
  it("shows the official regulated offering and its center", async () => {
    installFetch();
    render(
      <MemoryRouter initialEntries={["/formacion/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Dónde estudiar Desarrollo de Aplicaciones Web",
      }),
    ).toBeVisible();
    expect(screen.getByText("IES ALONSO DE MADRIGAL")).toBeVisible();
    expect(screen.getByText("Ávila · Presencial")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Web del centro/ }),
    ).toHaveAttribute("href", center.website);
  });
});
