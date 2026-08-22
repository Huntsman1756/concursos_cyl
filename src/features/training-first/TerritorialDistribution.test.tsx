import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TerritorialDistribution } from "./TerritorialDistribution";

const sourceUrl =
  "https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-centros-docentes/";

afterEach(cleanup);

describe("TerritorialDistribution", () => {
  it("renders an evidence-first table and grouped center lists", () => {
    const { container } = render(
      <TerritorialDistribution
        centers={[
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
            latitude: null,
            longitude: null,
          },
        ]}
        sourceUrl={sourceUrl}
        academicYear="2025"
        sourceUpdatedAt="2026-08-20T00:00:00.000Z"
        snapshotFetchedAt="2026-08-21T00:00:00.000Z"
      />,
    );

    const region = screen.getByRole("region", {
      name: "Distribución de centros",
    });
    const table = within(region).getByRole("table", {
      name: "Centros por provincia",
    });
    expect(table).toBeVisible();
    expect(within(table).getByText("Ávila")).toBeVisible();
    expect(within(table).getByText("Valladolid")).toBeVisible();
    expect(
      within(region).getByRole("list", { name: "Centros en Ávila" }),
    ).toHaveTextContent("CIFP Las Ferrerías");
    expect(
      within(region).getByRole("list", { name: "Centros en Valladolid" }),
    ).toHaveTextContent("IES Río Duero");
    expect(
      within(region).getByText("1 centro sin coordenadas oficiales"),
    ).toBeVisible();
    expect(within(region).getByText(/Curso académico: 2025/u)).toBeVisible();
    expect(
      within(region).getByText("20 de agosto de 2026", { exact: true }),
    ).toBeVisible();
    expect(
      within(region).getByText("21 de agosto de 2026", { exact: true }),
    ).toBeVisible();
    expect(
      within(region).getByRole("link", { name: /Directorio de Centros/u }),
    ).toHaveAttribute("href", sourceUrl);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("renders the technical coordinate disclosure separately from the distribution", () => {
    render(
      <TerritorialDistribution
        centers={[
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
            latitude: null,
            longitude: null,
          },
        ]}
        sourceUrl={sourceUrl}
        academicYear="2025"
        sourceUpdatedAt={null}
        snapshotFetchedAt="2026-08-21T00:00:00.000Z"
      />,
    );

    const details = screen
      .getByText("Ver coordenadas oficiales publicadas", { exact: true })
      .closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(details).toHaveTextContent("CIFP Las Ferrerías");
    expect(details).not.toHaveTextContent("IES Río Duero");
    expect(details).toHaveTextContent(
      "Información técnica complementaria. No es un mapa y no calcula distancias, rutas ni tiempos de desplazamiento.",
    );
  });

  it("explains when the current cycle has no published centers", () => {
    render(
      <TerritorialDistribution
        centers={[]}
        sourceUrl={sourceUrl}
        academicYear={null}
        sourceUpdatedAt={null}
        snapshotFetchedAt="2026-08-21T00:00:00.000Z"
      />,
    );

    expect(
      screen.getByText(
        "No hay centros publicados para este ciclo en la copia actual.",
      ),
    ).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
