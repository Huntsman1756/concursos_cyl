import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AccessibilityPage } from "./AccessibilityPage";

describe("AccessibilityPage", () => {
  it("publishes a bounded and actionable accessibility commitment", () => {
    render(
      <MemoryRouter>
        <AccessibilityPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Accesibilidad" }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(/no equivalen a una auditoría formal/i),
    ).toBeVisible();
    expect(screen.getByText(/proyecto independiente/i)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Abrir una incidencia/i }),
    ).toHaveAttribute("href", expect.stringContaining("github.com"));
    expect(
      screen.getByRole("link", { name: "Consultar metodología y fuentes" }),
    ).toHaveAttribute("href", "/metodologia");
  });
});
