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

function installFetch({
  address = center.address,
}: { address?: string | null } = {}): void {
  const manifest = currentManifestFixture();
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, [program]],
    [manifest.resourceSnapshots.centers.resourcePath, [{ ...center, address }]],
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
    const manifest = currentManifestFixture();
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.programs.resourcePath,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.centers.resourcePath,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).toHaveBeenCalledWith(
      manifest.resourceSnapshots.trainingOfferings.resourcePath,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.jobOffers.resourcePath,
      expect.anything(),
    );
    expect(screen.getByText("IES ALONSO DE MADRIGAL")).toBeVisible();
    expect(screen.getByText("Ávila · Presencial")).toBeVisible();
    expect(screen.getByText(center.address)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Web del centro/ }),
    ).toHaveAttribute("href", center.website);
    const mapsLink = screen.getByRole("link", { name: /Cómo llegar/ });
    expect(mapsLink).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=IES%20ALONSO%20DE%20MADRIGAL%2C%20C%2F%20Francisco%20de%20Vitoria%2C%20s%2Fn%2C%20%C3%81vila%2C%20%C3%81vila",
    );
    expect(mapsLink).toHaveAttribute("target", "_blank");
  });

  it("keeps the Maps action usable when the official address is not published", async () => {
    installFetch({ address: null });
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
    expect(screen.queryByText(center.address)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cómo llegar/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=IES%20ALONSO%20DE%20MADRIGAL%2C%20%C3%81vila%2C%20%C3%81vila",
    );
  });
});
