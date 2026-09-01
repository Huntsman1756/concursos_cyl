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
});
