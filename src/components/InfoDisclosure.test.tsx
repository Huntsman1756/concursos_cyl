import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { InfoDisclosure } from "./InfoDisclosure";

describe("InfoDisclosure", () => {
  it("opens from the labelled control and restores focus after Escape", async () => {
    const user = userEvent.setup();
    render(
      <InfoDisclosure label="Ver trazabilidad">
        <p>Fuente y fecha de revisión.</p>
      </InfoDisclosure>,
    );

    const summary = screen.getByLabelText("Ver trazabilidad");
    expect(summary).toHaveAttribute("aria-expanded", "false");
    await user.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(summary.parentElement).toHaveAttribute("open");

    await user.keyboard("{Escape}");

    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(summary.parentElement).not.toHaveAttribute("open");
    expect(document.activeElement).toBe(summary);
  });

  it("renders a visible text trigger while keeping the accessible name and behaviour", async () => {
    const user = userEvent.setup();
    render(
      <InfoDisclosure
        label="Fuente y revisión de la relación"
        trigger="Fuente y revisión"
      >
        <p>Texto de la fuente.</p>
      </InfoDisclosure>,
    );

    const summary = screen.getByLabelText("Fuente y revisión de la relación");
    // Visible text on the control: no isolated icon-only row.
    expect(summary).toHaveTextContent("Fuente y revisión");
    expect(summary).toHaveAttribute("aria-expanded", "false");
    await user.click(summary);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Texto de la fuente.")).toBeVisible();

    await user.keyboard("{Escape}");
    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(summary);
  });
});
