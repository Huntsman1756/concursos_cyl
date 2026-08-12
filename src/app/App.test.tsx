import { cleanup, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";
import { AppShell } from "./AppShell";

describe("App", () => {
  it("presents both approved entry points", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "He terminado FP" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Quiero trabajar de…" }),
    ).toBeVisible();
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
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /Proyecto independiente basado en datos públicos/i,
    );
  });

  it("routes the comparison navigation to the income-only page", () => {
    cleanup();
    render(
      <MemoryRouter initialEntries={["/comparar"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Ingresos observados" }),
    ).toBeVisible();
    expect(screen.queryByText(/Empleo e ingresos/u)).not.toBeInTheDocument();
  });
});
