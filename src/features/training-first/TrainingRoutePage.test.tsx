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
  programOverride = program,
  offerings = [offering],
  centerOverride = {},
}: {
  address?: string | null;
  programOverride?: Record<string, unknown>;
  offerings?: readonly Record<string, unknown>[];
  centerOverride?: Record<string, unknown>;
} = {}): void {
  const manifest = currentManifestFixture();
  const centerRecord = {
    ...center,
    ...centerOverride,
    address: centerOverride.address ?? address,
  };
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, [programOverride]],
    [manifest.resourceSnapshots.centers.resourcePath, [centerRecord]],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, offerings],
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
    expect(screen.getByText(/Ávila · Ávila/u)).toBeVisible();
    expect(screen.getByText("Presencial")).toBeVisible();
    expect(screen.getByText(/C\/ Francisco de Vitoria/u)).toBeVisible();
    const websiteLink = screen.getByRole("link", { name: /Web del centro/ });
    expect(websiteLink).toHaveAttribute("href", center.website);
    const mapsLink = screen.getByRole("link", { name: /Cómo llegar/ });
    expect(mapsLink).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=IES%20ALONSO%20DE%20MADRIGAL%2C%20C%2F%20Francisco%20de%20Vitoria%2C%20s%2Fn%2C%20%C3%81vila%2C%20%C3%81vila",
    );
    expect(mapsLink).toHaveAttribute("target", "_blank");
    expect(websiteLink.closest(".center-catalog__actions")).toContainElement(
      mapsLink,
    );
  });

  it("keeps private-center semantics and real location actions explicit", async () => {
    const sanGabriel = {
      centerCode: "09012072",
      centerName: "CIFP SAN GABRIEL",
      centerOwnership: "private",
      province: "Burgos",
      locality: "La Aguilera",
      address: "Ctra. de la Aguilera, km 6,5",
      website: "http://www.ciudaddelaeducacion.es/",
    } as const;
    const sanOffering = {
      ...offering,
      centerCode: sanGabriel.centerCode,
      centerName: sanGabriel.centerName,
      centerOwnership: sanGabriel.centerOwnership,
      province: sanGabriel.province,
      locality: sanGabriel.locality,
      offeringId: "IFC03S:09012072:on_site:public:private",
    } as const;
    installFetch({
      centerOverride: sanGabriel,
      offerings: [sanOffering],
    });
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
    expect(screen.getByText("CIFP SAN GABRIEL")).toBeVisible();
    expect(screen.getByText("Centro privado")).toBeVisible();
    expect(screen.getByText(/La Aguilera · Burgos/u)).toBeVisible();
    expect(screen.getByText("Presencial")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Web del centro/u }),
    ).toHaveAttribute("href", sanGabriel.website);
    expect(screen.getByRole("link", { name: /Cómo llegar/u })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=CIFP%20SAN%20GABRIEL%2C%20Ctra.%20de%20la%20Aguilera%2C%20km%206%2C5%2C%20La%20Aguilera%2C%20Burgos",
    );
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

  it("does not show a duplicate offering counter on a contextual center route", async () => {
    const contextualProgram = {
      ...program,
      programKey: "INA02M",
      programTitle: "Aceites de Oliva y Vinos",
    } as const;
    const contextualOfferings = [
      {
        ...offering,
        ...contextualProgram,
        modality: "on_site",
        offeringId: "INA02M:05000701:on_site:public:education",
      },
      {
        ...offering,
        ...contextualProgram,
        modality: "distance",
        offeringId: "INA02M:05000701:distance:public:education",
      },
      {
        ...offering,
        ...contextualProgram,
        modality: "mixed",
        offeringId: "INA02M:05000701:mixed:public:education",
      },
    ] as const;
    installFetch({
      programOverride: contextualProgram,
      offerings: contextualOfferings,
    });
    render(
      <MemoryRouter initialEntries={["/formacion/INA02M"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Dónde estudiar Aceites de Oliva y Vinos",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "1 centro publicado" }),
    ).toBeVisible();
    expect(
      screen.queryByText(/ofertas? en la copia actual/u),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Oferta formativa · snapshot del/u)).toBeVisible();
  });
});
