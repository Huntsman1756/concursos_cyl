import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultSectionNav } from "./ResultSectionNav";

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

  it.each([{ links: [] }, { links: [{ href: "#resumen", label: "Resumen" }] }])(
    "does not render navigation for fewer than two sections",
    ({ links }) => {
      const { container } = render(<ResultSectionNav links={links} />);

      expect(container).toBeEmptyDOMElement();
    },
  );
});
