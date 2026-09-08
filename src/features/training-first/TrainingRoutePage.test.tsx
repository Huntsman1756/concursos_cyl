import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
  centers,
}: {
  address?: string | null;
  programOverride?: Record<string, unknown>;
  offerings?: readonly Record<string, unknown>[];
  centerOverride?: Record<string, unknown>;
  centers?: readonly Record<string, unknown>[];
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
    [
      manifest.resourceSnapshots.centers.resourcePath,
      centers ?? [centerRecord],
    ],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, offerings],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
    // Serve the real dated CTA policy artifact (presentation layer, /qa/)
    [
      "/qa/center-link-policy.json",
      JSON.parse(
        readFileSync(
          join(process.cwd(), "public", "qa", "center-link-policy.json"),
          "utf8",
        ),
      ),
    ],
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

function LocationEcho() {
  const location = useLocation();
  return <output aria-label="Ubicación actual">{location.search}</output>;
}

function centerCatalogRecords(count: number): {
  centers: Array<Record<string, unknown>>;
  offerings: Array<Record<string, unknown>>;
} {
  const centers = Array.from({ length: count }, (_, index) => {
    const centerCode = String(index + 1).padStart(8, "0");
    return {
      ...center,
      centerCode,
      centerName: `Centro de prueba ${String(index + 1).padStart(2, "0")}`,
    };
  });
  return {
    centers,
    offerings: centers.map((candidate, index) => ({
      ...offering,
      centerCode: candidate.centerCode,
      centerName: candidate.centerName,
      offeringId: `IFC03S:${String(index + 1).padStart(8, "0")}:on_site:public:education`,
    })),
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TrainingRoutePage", () => {
  it("paginates only the global center catalog and preserves URL state", async () => {
    const records = centerCatalogRecords(55);
    installFetch(records);
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/donde-estudiar"]}>
        <AppRoutes />
        <LocationEcho />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("1–25 de 55 combinaciones de centro y ciclo"),
    ).toBeVisible();
    const pagination = screen.getByRole("navigation", {
      name: "Paginación de opciones formativas",
    });
    expect(pagination).toHaveAttribute("aria-controls", "center-results-table");
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      26,
    );
    expect(
      screen.getByRole("button", { name: "Página anterior" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(
      screen.getByText("26–50 de 55 combinaciones de centro y ciclo"),
    ).toBeVisible();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      26,
    );
    expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent(
      "?page=2",
    );

    await user.click(screen.getByRole("button", { name: "Página siguiente" }));

    expect(
      screen.getByText("51–55 de 55 combinaciones de centro y ciclo"),
    ).toBeVisible();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      6,
    );
    expect(
      screen.getByRole("button", { name: "Página siguiente" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent(
      "?page=3",
    );
  });

  it("keeps small contextual center results unpaginated", async () => {
    const records = centerCatalogRecords(12);
    installFetch(records);

    render(
      <MemoryRouter initialEntries={["/donde-estudiar/IFC03S?page=2"]}>
        <AppRoutes />
        <LocationEcho />
      </MemoryRouter>,
    );

    expect(await screen.findByText("12 centros publicados")).toBeVisible();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      13,
    );
    expect(
      screen.queryByRole("navigation", {
        name: "Paginación de opciones formativas",
      }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Ubicación actual")).toHaveTextContent(
        /^$/u,
      );
    });
  });

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
    expect(
      screen.getAllByText("IES ALONSO DE MADRIGAL").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ávila · Ávila/u).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Presencial").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/C\/ Francisco de Vitoria/u).length,
    ).toBeGreaterThan(0);
    const websiteLink = screen.getAllByRole("link", {
      name: /Web del centro/,
    })[0]!;
    expect(websiteLink).toHaveAttribute("href", center.website);
    const mapsLink = screen.getAllByRole("link", { name: /Cómo llegar/ })[0]!;
    expect(mapsLink).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=IES%20ALONSO%20DE%20MADRIGAL%2C%20C%2F%20Francisco%20de%20Vitoria%2C%20s%2Fn%2C%20%C3%81vila%2C%20%C3%81vila",
    );
    expect(mapsLink).toHaveAttribute("target", "_blank");
    expect(websiteLink.closest(".table-actions")).toContainElement(mapsLink);
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
    expect(screen.getAllByText("CIFP SAN GABRIEL").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Centro privado").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/La Aguilera · Burgos/u).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Presencial").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Web del centro/u })[0],
    ).toHaveAttribute("href", sanGabriel.website);
    expect(
      screen.getAllByRole("link", { name: /Cómo llegar/u })[0],
    ).toHaveAttribute(
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
    expect(
      screen.getAllByRole("link", { name: /Cómo llegar/ })[0],
    ).toHaveAttribute(
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
    expect(screen.getByText("1 centro publicado")).toBeVisible();
    expect(
      screen.queryByText(/ofertas? en la copia activa/u),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Oferta formativa · copia del/u)).toBeVisible();
  });
});
