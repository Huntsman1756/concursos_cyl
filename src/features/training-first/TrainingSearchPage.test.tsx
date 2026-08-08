import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function installFoundationFetch(): void {
  const manifest = currentManifestFixture();
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [manifest.resourceSnapshots.programs.resourcePath, [program]],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, []],
    [manifest.resourceSnapshots.jobOffers.resourcePath, []],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      return Promise.resolve(
        payload === undefined
          ? new Response(null, { status: 404 })
          : responseFor(payload),
      );
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("training-first search", () => {
  it("announces loading while the official programs are pending", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined)),
    );

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const loading = screen.getByText("Preparando los ciclos oficiales…");
    expect(loading).toBeVisible();
    expect(loading.closest("section")).toHaveAttribute("aria-busy", "true");
  });

  it("keeps navigation disabled until an official program is selected", async () => {
    installFoundationFetch();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Encuentra ofertas relacionadas con tu FP",
      }),
    ).toBeVisible();
    const programSelect = screen.getByRole("combobox", {
      name: "Ciclo de Formación Profesional",
    });
    const submit = screen.getByRole("button", { name: "Ver ofertas" });
    expect(submit).toBeDisabled();

    await user.selectOptions(programSelect, "IFC03S");
    expect(submit).toBeEnabled();
  });

  it("rejects an unknown program key with a useful path back", async () => {
    installFoundationFetch();

    render(
      <MemoryRouter initialEntries={["/desde-fp/UNKNOWN"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Ciclo no encontrado" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Elegir otro ciclo" }),
    ).toHaveAttribute("href", "/desde-fp");
  });

  it("shows a recoverable error when official data cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    render(
      <MemoryRouter initialEntries={["/desde-fp"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "No hemos podido cargar los ciclos",
      }),
    ).toBeVisible();
  });
});
