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
    [manifest.resourceSnapshots.occupations.resourcePath, [occupation]],
    [manifest.resourceSnapshots.occupationAliases.resourcePath, [alias]],
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
    const submit = screen.getByRole("button", { name: "Ver rutas formativas" });
    await user.type(input, "desarrollador web");

    const option = screen.getByRole("option", {
      name: /Analistas, programadores y diseñadores web y multimedia/i,
    });
    expect(option).toHaveTextContent("Coincide con: desarrollador web");
    expect(submit).toBeDisabled();
    await user.click(option);
    expect(
      screen.getByText(/Ocupación confirmada/i).closest("div"),
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
    expect(screen.getByText("1 ocupación revisada encontrada")).toBeVisible();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(
      screen.getByRole("button", { name: "Ver rutas formativas" }),
    ).toBeEnabled();
  });

  it("does not silently replace confirmation when the text is edited", async () => {
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
      screen.getByText(/Ocupación confirmada/i).closest("div"),
    ).toHaveTextContent(occupation.preferredLabel);
    expect(
      screen.getByRole("button", { name: "Ver rutas formativas" }),
    ).toBeEnabled();
    expect(
      screen.getByText("No encontramos una ocupación revisada con ese nombre."),
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

    expect(screen.queryByText(/Ocupación confirmada/i)).not.toBeInTheDocument();
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
});
