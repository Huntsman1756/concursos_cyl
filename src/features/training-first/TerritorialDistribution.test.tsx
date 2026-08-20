import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TerritorialDistribution } from "./TerritorialDistribution";

const sourceUrl =
  "https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-centros-docentes/";

afterEach(cleanup);

describe("TerritorialDistribution", () => {
  it("renders official center points with a complete territorial summary", () => {
    const { container } = render(
      <TerritorialDistribution
        points={[
          {
            centerCode: "05009923",
            centerName: "CIFP Las Ferrerías",
            locality: "Arenas de San Pedro",
            province: "Ávila",
            latitude: 40.21005,
            longitude: -5.08499,
          },
          {
            centerCode: "47000001",
            centerName: "IES Río Duero",
            locality: "Valladolid",
            province: "Valladolid",
            latitude: 41.6523,
            longitude: -4.7245,
          },
        ]}
        sourceUrl={sourceUrl}
        academicYear="2025"
      />,
    );

    expect(screen.getByRole("img")).toHaveAccessibleName(
      "Distribución territorial de los centros",
    );
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(screen.getByText(/Ávila, Valladolid/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Directorio de Centros/ }),
    ).toHaveAttribute("href", sourceUrl);
  });

  it("does not render a misleading plot without coordinates", () => {
    render(
      <TerritorialDistribution
        points={[]}
        sourceUrl={sourceUrl}
        academicYear={null}
      />,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText(/No hay coordenadas oficiales/),
    ).toBeInTheDocument();
  });
});
