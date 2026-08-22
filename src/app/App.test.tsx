import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Link, MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { AppShell } from "./AppShell";

describe("App", () => {
  it("presents both approved starting-point choices", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("region", { name: "¿Cuál es tu punto de partida?" }),
    ).toBeVisible();
    expect(
      screen.getByRole("radio", { name: /Tengo un título de FP/u }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Tengo un empleo en mente/u }),
    ).not.toBeChecked();
  });

  it("uses the compact product shell and identifies the project independently", () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "SALIDA CyL" })).toBeVisible();
    expect(screen.getByText("FP y empleo con datos públicos")).toBeVisible();
    expect(
      within(
        screen.getByRole("navigation", { name: "Principal" }),
      ).getAllByRole("link"),
    ).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Comparar estudios" }),
    ).toHaveAttribute("href", "/comparar");
    expect(screen.getByRole("link", { name: "Más formación" })).toHaveAttribute(
      "href",
      "/recursos",
    );
    expect(
      within(screen.getByRole("navigation", { name: "Principal" })).getByRole(
        "link",
        { name: "Metodología" },
      ),
    ).toHaveAttribute("href", "/metodologia");
    expect(
      screen.queryByRole("link", { name: "Datos verificables" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Datos abiertos" }),
    ).toHaveAttribute("href", "/datos-abiertos");
    expect(
      screen.getByRole("link", { name: "Para organizaciones" }),
    ).toHaveAttribute("href", "/para-organizaciones");
    expect(screen.getByRole("link", { name: "Accesibilidad" })).toHaveAttribute(
      "href",
      "/accesibilidad",
    );
    expect(
      screen.getByRole("main", { name: "Contenido principal" }),
    ).toBeVisible();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /Proyecto independiente basado en datos públicos/i,
    );
  });

  it.each([
    ["/", "Inicio · SALIDA CyL"],
    ["/desde-fp", "Desde FP · SALIDA CyL"],
    ["/desde-fp/IFC03S", "Resultados desde FP · SALIDA CyL"],
    ["/formacion/IFC03S", "Dónde estudiar · SALIDA CyL"],
    ["/desde-ocupacion", "Desde ocupación · SALIDA CyL"],
    [
      "/desde-ocupacion/occupation%3Acno11%3A2713",
      "Resultados desde ocupación · SALIDA CyL",
    ],
    ["/comparar", "Comparar estudios · SALIDA CyL"],
    ["/recursos", "Más formación · SALIDA CyL"],
    ["/datos-abiertos", "Datos abiertos · SALIDA CyL"],
    ["/accesibilidad", "Accesibilidad · SALIDA CyL"],
    ["/para-organizaciones", "Para organizaciones · SALIDA CyL"],
    ["/metodologia", "Metodología y fuentes · SALIDA CyL"],
    ["/no-existe", "Página no encontrada · SALIDA CyL"],
  ])("sets a route-specific document title for %s", (pathname, title) => {
    cleanup();
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <AppShell>
          <p>Contenido</p>
        </AppShell>
      </MemoryRouter>,
    );

    expect(document.title).toBe(title);
  });

  it("updates the document title when navigation changes pathname", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppShell>
          <Link to="/metodologia">Metodología</Link>
        </AppShell>
      </MemoryRouter>,
    );

    await user.click(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Metodología",
      }),
    );

    expect(document.title).toBe("Metodología y fuentes · SALIDA CyL");
  });

  it("announces static routes and repeats the announcement after returning", async () => {
    cleanup();
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/accesibilidad"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Accesibilidad" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();

    const footer = screen.getByRole("contentinfo");
    await user.click(
      within(footer).getByRole("link", { name: "Para organizaciones" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Para centros y administraciones",
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();

    await user.click(
      within(screen.getByRole("contentinfo")).getByRole("link", {
        name: "Accesibilidad",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Accesibilidad" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();
  });

  it("routes the comparison navigation to the income-only page", async () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/comparar"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Ingresos observados",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Empleo e ingresos/u)).not.toBeInTheDocument();
  });
});
