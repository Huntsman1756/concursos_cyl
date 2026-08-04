import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "./App";

describe("App", () => {
  it("presents both approved entry points", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /he terminado fp/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /quiero trabajar de/i })).toBeVisible();
  });
});
