import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrainingProgram } from "../../../data/schemas/generated";
import { TrainingOutcomeEvidence } from "./TrainingOutcomeEvidence";

const higherProgram: TrainingProgram = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};

afterEach(cleanup);

describe("TrainingOutcomeEvidence", () => {
  it("does not offer a load action for levels outside the published outcome scope", () => {
    const onRequestLoad = vi.fn();
    render(
      <TrainingOutcomeEvidence
        program={{ ...higherProgram, level: "basic" }}
        outcome={{ status: "not-requested" }}
        onRequestLoad={onRequestLoad}
      />,
    );

    expect(
      screen.getByText(
        "La fuente solo publica referencias para Grado Medio y Grado Superior.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: "Cargar datos de ingresos observados",
      }),
    ).not.toBeInTheDocument();
    expect(onRequestLoad).not.toHaveBeenCalled();
  });

  it("does not offer a load action when the manifest has no outcome snapshot", () => {
    const onRequestLoad = vi.fn();
    render(
      <TrainingOutcomeEvidence
        program={higherProgram}
        outcome={{ status: "not-requested" }}
        onRequestLoad={onRequestLoad}
      />,
    );

    expect(
      screen.getByText("Esta copia no incluye datos de ingresos observados."),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", {
        name: "Cargar datos de ingresos observados",
      }),
    ).not.toBeInTheDocument();
    expect(onRequestLoad).not.toHaveBeenCalled();
  });
});
