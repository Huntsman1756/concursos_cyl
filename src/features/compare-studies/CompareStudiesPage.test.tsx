import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  OutcomeIndicator,
  TrainingProgram,
} from "../../../data/schemas/generated";
import { CompareStudiesPage } from "./CompareStudiesPage";

const program: TrainingProgram = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};

const indicators: OutcomeIndicator[] = [
  {
    indicatorId: "national-mean",
    trainingProgramKey: "IFC03S",
    officialProgramGroupLabel: "Desarrollo de Aplicaciones Web",
    trainingLevel: "higher",
    scope: "spain_program_group",
    cohort: "2022",
    postGraduationYear: 1,
    measure: "mean",
    value: 24500,
    unit: "eur_annualized_contribution_base",
    suppressionState: "published",
    sourceId: "educabase-test",
  },
  {
    indicatorId: "regional-mean",
    trainingProgramKey: "IFC03S",
    officialProgramGroupLabel: null,
    trainingLevel: "higher",
    scope: "castilla_leon_training_level",
    cohort: "2022",
    postGraduationYear: 1,
    measure: "mean",
    value: 23800,
    unit: "eur_annualized_contribution_base",
    suppressionState: "published",
    sourceId: "educabase-test",
  },
];

describe("CompareStudiesPage", () => {
  it("keeps national and regional income references separate", () => {
    render(
      <MemoryRouter>
        <CompareStudiesPage data={{ programs: [program], indicators }} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /ciclo o grupo en españa/i }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: /grado superior en castilla y león/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        /no existe una estadística oficial de ingresos por ciclo formativo en castilla y león/i,
      ),
    ).toBeVisible();
    expect(screen.queryByText(/salario esperado/i)).not.toBeInTheDocument();
  });
});
