import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DecisionEvidencePath } from "./DecisionEvidencePath";

afterEach(cleanup);

describe("DecisionEvidencePath", () => {
  it("renders the four evidence stages without turning zero into a market claim", () => {
    const { container } = render(
      <DecisionEvidencePath
        programTitle="Desarrollo de Aplicaciones Web"
        professionalOutputCount={5}
        reviewedOccupationCount={1}
        currentOfferCount={0}
        studyCenterCount={12}
        offerEvidenceDate="2026-08-18T00:00:00.000Z"
      />,
    );

    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
    expect(screen.getByText("1 grupo CNO-11 revisado")).toBeInTheDocument();
    expect(screen.getByText("0 ofertas relacionadas")).toBeInTheDocument();
    expect(
      screen.getByText(/no representa todo el mercado laboral/i),
    ).toBeInTheDocument();
    expect(container.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-08-18T00:00:00.000Z",
    );
  });

  it("describes missing reviewed coverage as pending publication", () => {
    render(
      <DecisionEvidencePath
        programTitle="Ciclo sin relación"
        professionalOutputCount={2}
        reviewedOccupationCount={0}
        currentOfferCount={0}
        studyCenterCount={1}
        offerEvidenceDate={null}
      />,
    );
    expect(
      screen.getByText("Relación todavía no publicada como revisada"),
    ).toBeInTheDocument();
  });
});
