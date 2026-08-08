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
  it("presents two truthful entry journeys and reviewed partial coverage", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Elige tu camino y actúa con información oficial",
      }),
    ).toBeVisible();
    const coverage = screen.getByRole("region", { name: "Disponible ahora" });
    expect(coverage).toHaveTextContent("Desarrollo de Aplicaciones Web");
    expect(coverage).toHaveTextContent("presencial y distancia");
    expect(coverage).toHaveTextContent("1 ocupación CNO revisada");
    expect(screen.queryByText(/Cuidados Auxiliares/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Administración/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/educación infantil/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/soldadura/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Junta de Castilla y León/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explorar salidas laborales" }),
    ).toHaveAttribute("href", "/desde-fp");
    expect(
      screen.getByRole("link", { name: "Buscar ciclos que te preparan" }),
    ).toHaveAttribute("href", "/desde-ocupacion");
    expect(
      screen.getByRole("region", { name: "Sobre la cobertura" }),
    ).toHaveTextContent(
      /relaciones formativas se incorporan de forma progresiva/i,
    );
    expect(
      screen.getByRole("link", { name: "Saber más sobre los datos" }),
    ).toHaveAttribute("href", "/metodologia");
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
