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
} as const;

function relationshipAwareManifest() {
  const base = currentManifestFixture();
  const snapshot = base.resourceSnapshots.programs;
  return {
    ...base,
    resourceSnapshots: {
      ...base.resourceSnapshots,
      occupations: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/occupations.json",
      },
      occupationAliases: {
        ...snapshot,
        resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
      },
      trainingOccupationLinks: {
        ...snapshot,
        resourcePath:
          "/data/v1/snapshots/build-1/training-occupation-links.json",
      },
    },
  };
}

function installHomeFetch({
  manifest = relationshipAwareManifest(),
  coverage = [] as unknown[],
  programs = [program],
  occupations = [occupation],
  aliases = [],
  links = [],
}: {
  manifest?: { resourceSnapshots: Record<string, { resourcePath: string }> };
  coverage?: unknown[];
  programs?: unknown[];
  occupations?: unknown[];
  aliases?: unknown[];
  links?: unknown[];
} = {}) {
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, programs],
    [manifest.resourceSnapshots.occupations.resourcePath, occupations],
    [manifest.resourceSnapshots.occupationAliases.resourcePath, aliases],
    [manifest.resourceSnapshots.trainingOccupationLinks.resourcePath, links],
  ]);
  const snapshots = manifest.resourceSnapshots as Record<
    string,
    { resourcePath: string }
  >;
  if (snapshots.mappingCoverage?.resourcePath !== undefined) {
    resources.set(snapshots.mappingCoverage.resourcePath, coverage);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      return Promise.resolve(
        payload === undefined
          ? new Response(null, { status: 404 })
          : new Response(JSON.stringify(payload), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
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
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("starts with FP and navigates after choosing an official cycle", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", {
        name: /Tengo una FP y quiero saber mis salidas/u,
      }),
    ).toHaveAttribute("aria-expanded", "true");
    const combobox = await screen.findByRole("combobox", {
      name: "Busca tu ciclo",
    });
    expect(combobox).toHaveAttribute("aria-autocomplete", "list");

    await user.type(combobox, "IFC03S");
    const option = await screen.findByRole("option", {
      name: /Desarrollo de Aplicaciones Web/u,
    });
    await user.click(option);
    await user.click(screen.getByRole("button", { name: "Buscar ciclo" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-fp/IFC03S?query=Desarrollo+de+Aplicaciones+Web",
    );
  });

  it("reaches the occupation route from the profession journey", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /Quiero dedicarme a una profesión/u }),
    );
    const combobox = await screen.findByRole("combobox", {
      name: "Busca una profesión",
    });
    await user.type(combobox, "programación web");
    const option = await screen.findByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/u,
    });
    await user.click(option);
    await user.click(screen.getByRole("button", { name: "Buscar profesión" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-ocupacion/occupation%3Acno11%3A2713?query=Analistas%2C+programadores+y+dise%C3%B1adores+web+y+multimedia",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/data/v1/snapshots/build-1/occupations.json",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("uses free text to reach the offer explorer", async () => {
    installHomeFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <HomePage />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /He visto una oferta/u }),
    );
    const query = await screen.findByRole("searchbox", {
      name: "Busca una oferta",
    });
    await user.type(query, "cocina");
    await user.click(screen.getByRole("button", { name: "Buscar oferta" }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/desde-oferta?query=cocina",
    );
  });

  it("presents the reviewed-relationship freshness and a real example link", async () => {
    installHomeFetch({
      coverage: [
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
      ],
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("region", {
        name: "Fecha de relaciones revisadas",
      }),
    ).toHaveTextContent(
      "Relaciones revisadas · fuente actualizada el 31 jul 2026",
    );
    expect(
      await screen.findByRole("link", {
        name: "Desarrollo de Aplicaciones WEB",
      }),
    ).toHaveAttribute("href", "/desde-fp/IFC03S");
    expect(screen.getByText("Ejemplo:")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Auxiliares de enfermería" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Puedes probar con")).not.toBeInTheDocument();
  });

  it("labels legacy freshness with the job-offer fallback scope", async () => {
    const baseManifest = relationshipAwareManifest();
    const legacyResourceSnapshots = Object.fromEntries(
      Object.entries(baseManifest.resourceSnapshots).filter(
        ([key]) => key !== "mappingCoverage",
      ),
    );
    const legacyManifest = {
      ...baseManifest,
      resourceSnapshots: legacyResourceSnapshots,
    };
    installHomeFetch({ manifest: legacyManifest });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const freshness = await screen.findByRole("region", {
      name: "Fecha de ofertas laborales",
    });
    expect(freshness).toHaveTextContent(
      "Ofertas laborales · fuente actualizada el 31 jul 2026",
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
      new Response(JSON.stringify(relationshipAwareManifest()), {
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
  });

  it("requests the manifest once per mount", async () => {
    const manifest = relationshipAwareManifest();
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

  it("aborts pending generated-data work when Home unmounts", async () => {
    const manifest = relationshipAwareManifest();
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
