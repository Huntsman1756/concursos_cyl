import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { AppRoutes } from "../../app/routes";

const occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
} as const;

const alias = {
  alias: "desarrollador web",
  occupationId: occupation.occupationId,
  reviewStatus: "approved",
  reviewedAt: "2026-08-04",
  mappingVersion: "1.0.0",
} as const;

const rejectedOccupation = {
  ...occupation,
  occupationId: "occupation:cno11:9999",
  preferredLabel: "Ocupación rechazada de prueba",
  confirmationLabel: "Equivalencia no aprobada",
  classificationCode: "9999",
  reviewStatus: "rejected",
} as const;

const rejectedAlias = {
  ...alias,
  alias: "equivalencia inventada",
  occupationId: rejectedOccupation.occupationId,
  reviewStatus: "rejected",
} as const;

function installFetch(options: { fail?: boolean } = {}): void {
  if (options.fail) {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    return;
  }
  const baseManifest = currentManifestFixture();
  const manifest = {
    ...baseManifest,
    resourceSnapshots: {
      ...baseManifest.resourceSnapshots,
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
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, []],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, []],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
    [
      manifest.resourceSnapshots.occupations.resourcePath,
      [occupation, rejectedOccupation],
    ],
    [
      manifest.resourceSnapshots.occupationAliases.resourcePath,
      [alias, rejectedAlias],
    ],
    [manifest.resourceSnapshots.trainingOccupationLinks.resourcePath, []],
  ]);
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("occupation-first search", () => {
  it("requires explicit confirmation of an alias-backed official occupation", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    const heading = screen.getByRole("heading", {
      name: "Consulta qué ciclos de FP están relacionados con una ocupación",
    });
    expect(heading).toHaveAttribute("id", "occupation-search-heading");
    expect(heading.closest("section")).toHaveAttribute(
      "aria-labelledby",
      "occupation-search-heading",
    );
    const manifest = currentManifestFixture();
    expect(fetch).not.toHaveBeenCalledWith(
      manifest.resourceSnapshots.programs.resourcePath,
      expect.anything(),
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
    const submit = screen.getByRole("button", { name: "Ver rutas formativas" });
    await user.type(input, "desarrollador web");

    const option = screen.getByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/i,
    });
    expect(option).toHaveTextContent("Coincide con: desarrollador web");
    expect(submit).toBeDisabled();
    await user.click(option);
    expect(
      screen.getByText(/Ocupación seleccionada/i).closest("div"),
    ).toHaveTextContent(occupation.preferredLabel);
    expect(submit).toBeEnabled();
  });

  it("supports preferred-label search and keyboard selection", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    await user.type(input, "analistas programadores");
    expect(screen.getByText("1 ocupación oficial encontrada")).toBeVisible();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(
      screen.getByRole("button", { name: "Ver rutas formativas" }),
    ).toBeEnabled();
  });

  it("never exposes a rejected occupation or alias", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    await user.type(input, rejectedAlias.alias);

    expect(
      screen.getByText("No encontramos una ocupación oficial con ese nombre."),
    ).toBeVisible();
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-controls");
    expect(input).not.toHaveAttribute("aria-activedescendant");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.queryByText(rejectedOccupation.preferredLabel),
    ).not.toBeInTheDocument();
  });

  it("clears a stale confirmation when the text is edited", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    await user.type(input, "desarrollador web");
    await user.click(screen.getByRole("option"));
    await user.clear(input);
    await user.type(input, "otra cosa");

    expect(
      screen.queryByText(/Ocupación seleccionada/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver rutas formativas" }),
    ).toBeDisabled();
    expect(
      screen.getByText("No encontramos una ocupación oficial con ese nombre."),
    ).toBeVisible();
  });

  it("clears the confirmed occupation for a new search", async () => {
    installFetch();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    await user.type(input, "desarrollador web");
    await user.click(screen.getByRole("option"));
    await user.click(screen.getByRole("button", { name: "Nueva búsqueda" }));

    expect(
      screen.queryByText(/Ocupación seleccionada/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver rutas formativas" }),
    ).toBeDisabled();
    expect(input).toHaveValue("");
  });

  it("shows a recoverable load error", async () => {
    installFetch({ fail: true });
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", {
        name: "No hemos podido cargar las ocupaciones",
      }),
    ).toBeVisible();
  });

  it("keeps search interaction to static reads without browser-state writes", async () => {
    installFetch();
    const storageWriteSpies = [
      vi.spyOn(Storage.prototype, "setItem"),
      vi.spyOn(Storage.prototype, "removeItem"),
      vi.spyOn(Storage.prototype, "clear"),
    ];
    const cookieSpy = vi.spyOn(Document.prototype, "cookie", "set");
    const sendBeaconSpy = vi.fn();
    const previousBeacon = Object.getOwnPropertyDescriptor(
      window.navigator,
      "sendBeacon",
    );
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeaconSpy,
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/desde-ocupacion"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const input = await screen.findByRole("combobox", { name: /ocupación/i });
    await user.type(input, alias.alias);
    await user.click(screen.getByRole("option"));

    for (const storageWriteSpy of storageWriteSpies) {
      expect(storageWriteSpy).not.toHaveBeenCalled();
    }
    expect(cookieSpy).not.toHaveBeenCalled();
    expect(sendBeaconSpy).not.toHaveBeenCalled();
    const requests = vi.mocked(fetch).mock.calls;
    expect(requests.length).toBeGreaterThan(0);
    for (const [request, init] of requests) {
      const url = typeof request === "string" ? request : request.toString();
      const method = request instanceof Request ? request.method : init?.method;
      expect(url).toMatch(/^\/data\/v1\//u);
      expect(method ?? "GET").toBe("GET");
    }

    if (previousBeacon === undefined) {
      Reflect.deleteProperty(window.navigator, "sendBeacon");
    } else {
      Object.defineProperty(window.navigator, "sendBeacon", previousBeacon);
    }
  });
});
