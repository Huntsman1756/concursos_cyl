import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

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
});
