import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { OrganizationsPage } from "./OrganizationsPage";

describe("OrganizationsPage", () => {
  it("states professional uses and reuse boundaries without invented claims", () => {
    render(
      <MemoryRouter>
        <OrganizationsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Para centros y administraciones",
      }),
    ).toBeVisible();
    expect(screen.getByText("Orientación")).toBeVisible();
    expect(screen.getByText("Centros de FP")).toBeVisible();
    expect(screen.getByText("Administraciones locales")).toBeVisible();
    expect(
      screen.getByText(/no sustituye la atención de un orientador/i),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Descargar datos abiertos" }),
    ).toHaveAttribute("href", "/datos-abiertos");
    expect(
      screen.getByRole("link", { name: "Ver fuentes, método y limitaciones" }),
    ).toHaveAttribute("href", "/metodologia");
  });
});
