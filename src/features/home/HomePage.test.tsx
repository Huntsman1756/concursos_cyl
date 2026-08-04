import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { HomePage } from "./HomePage";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HomePage", () => {
  it("describes two different outcomes without decorative icon text", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Título → ofertas → requisitos → acciones"),
    ).toBeVisible();
    expect(
      screen.getByText("Ocupación → ciclos y centros de CyL"),
    ).toBeVisible();
    expect(screen.getAllByRole("link")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          textContent: expect.stringMatching(/He terminado FP/),
        }),
        expect.objectContaining({
          textContent: expect.stringMatching(/Quiero trabajar de/),
        }),
      ]),
    );
  });

  it("announces a pending manifest before rendering the validated update date", async () => {
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
      name: "Actualización de datos",
    });
    expect(freshness).toHaveAttribute("aria-busy", "true");
    expect(
      within(freshness).getByText("Comprobando la fecha de los datos…"),
    ).toBeVisible();

    resolveManifest(
      new Response(JSON.stringify(currentManifestFixture()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() =>
      expect(freshness).toHaveAttribute("aria-busy", "false"),
    );
    expect(
      within(freshness).queryByText("Comprobando la fecha de los datos…"),
    ).not.toBeInTheDocument();
    expect(within(freshness).getByText("31 de julio de 2026")).toBeVisible();
  });
});
