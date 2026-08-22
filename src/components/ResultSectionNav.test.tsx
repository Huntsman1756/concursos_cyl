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
      name: "Secciones del resultado",
    });
    expect(navigation).toBeVisible();
    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "href",
      "#resumen",
    );
    expect(screen.getByRole("link", { name: "Centros" })).toHaveAttribute(
      "href",
      "#centros",
    );
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
});
