import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("removes consecutive duplicate labels and marks the current page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: "Inicio", to: "/" },
            { label: "Aceites de Oliva y Vinos", to: "/desde-fp/INA02M" },
            { label: "Dónde estudiar", to: "/donde-estudiar/INA02M" },
            { label: "Dónde estudiar" },
          ]}
        />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Ruta de navegación",
    });
    expect(
      within(navigation)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Inicio", "Aceites de Oliva y Vinos", "Dónde estudiar"]);
    expect(within(navigation).getByText("Dónde estudiar")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(navigation).getByRole("link", {
        name: "Aceites de Oliva y Vinos",
      }),
    ).toHaveAttribute("href", "/desde-fp/INA02M");
  });
});
