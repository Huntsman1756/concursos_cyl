import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResultSectionNav } from "./ResultSectionNav";

afterEach(cleanup);

describe("ResultSectionNav", () => {
  it("renders named fragment links when the result has multiple sections", () => {
    render(
      <ResultSectionNav
        links={[
          { href: "#resumen", label: "Resumen" },
          { href: "#centros", label: "Centros" },
        ]}
      />,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Secciones de esta página",
    });
    expect(navigation).toBeVisible();
    expect(screen.getByText("En esta página", { selector: "p" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "href",
      "#resumen",
    );
    expect(screen.getByRole("link", { name: "Centros" })).toHaveAttribute(
      "href",
      "#centros",
    );
  });

  it("does not present a fake selected tab before navigation happens", () => {
    render(
      <ResultSectionNav
        links={[
          { href: "#resumen", label: "Resumen" },
          { href: "#centros", label: "Centros" },
        ]}
      />,
    );

    const summary = screen.getByRole("link", { name: "Resumen" });
    const centers = screen.getByRole("link", { name: "Centros" });
    // Section links are not tabs: nothing is marked as the current location
    // until the reader reaches that section.
    expect(summary).not.toHaveAttribute("aria-current");
    expect(centers).not.toHaveAttribute("aria-current");

    fireEvent.click(centers);

    expect(centers).toHaveAttribute("aria-current", "location");
  });

  it("keeps native fragment navigation and focuses the destination without scrolling", () => {
    render(
      <>
        <ResultSectionNav
          links={[
            { href: "#resumen", label: "Resumen" },
            { href: "#centros", label: "Centros" },
          ]}
        />
        <section id="centros" tabIndex={-1}>
          Centros
        </section>
      </>,
    );

    const destination = document.getElementById("centros");
    if (destination === null) throw new Error("Expected fragment destination");
    const focusSpy = vi.spyOn(destination, "focus");
    const link = screen.getByRole("link", { name: "Centros" });
    fireEvent.click(link);

    expect(link).toHaveAttribute("href", "#centros");
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it.each([{ links: [] }, { links: [{ href: "#resumen", label: "Resumen" }] }])(
    "does not render navigation for fewer than two sections",
    ({ links }) => {
      const { container } = render(<ResultSectionNav links={links} />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("is never represented as a tablist", () => {
    const { container } = render(
      <ResultSectionNav
        links={[
          { href: "#resumen", label: "Resumen" },
          { href: "#centros", label: "Centros" },
        ]}
      />,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(container.querySelector("[role='tabpanel']")).toBeNull();
    // In-page jump affordance: fragment hrefs, not panel switching.
    expect(screen.getByRole("link", { name: "Centros" })).toHaveAttribute(
      "href",
      "#centros",
    );
  });
});
