import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrintButton } from "./PrintButton";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrintButton", () => {
  it("prints once without changing the current URL", async () => {
    const beforeUrl = window.location.href;
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const fetch = vi.spyOn(globalThis, "fetch");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<PrintButton />);

    const button = screen.getByRole("button", {
      name: "Imprimir esta orientación",
    });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("print-control");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");

    await userEvent.setup().click(button);

    expect(print).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(beforeUrl);
    expect(fetch).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("merges an optional class with its print contract class", () => {
    render(<PrintButton className="secondary-button" />);

    expect(
      screen.getByRole("button", { name: "Imprimir esta orientación" }),
    ).toHaveClass("print-control", "secondary-button");
  });
});
