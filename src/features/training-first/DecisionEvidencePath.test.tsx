import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DecisionEvidencePath } from "./DecisionEvidencePath";

afterEach(cleanup);

describe("DecisionEvidencePath", () => {
  it("renders four evidence metrics without turning zero into a market claim", () => {
    const { container } = render(
      <DecisionEvidencePath
        programTitle="Desarrollo de Aplicaciones Web"
        professionalOutputCount={5}
        professionalOutputSourceUrl="https://todofp.es/fp/"
        professionalOutputEvidenceDate="2026-08-20T00:00:00.000Z"
        reviewedOccupationCount={1}
        reviewedOccupationSourceUrl="https://example.com/relacion"
        reviewedOccupationEvidenceDate="2026-08-08T00:00:00.000Z"
        reviewedOccupationEvidencePrefix="Revisada"
        currentOfferCount={0}
        currentOfferSourceUrl="https://example.com/ofertas"
        currentOfferEvidenceDate="2026-08-18T00:00:00.000Z"
        studyCenterCount={12}
        studyCenterSourceUrl="https://example.com/centros"
        studyCenterEvidenceDate="2026-08-20T00:00:00.000Z"
      />,
    );

    expect(container.querySelectorAll("dl > div")).toHaveLength(4);
    expect(screen.getByText("grupo CNO-11 revisado")).toBeInTheDocument();
    expect(screen.getByText("en la copia actual")).toBeInTheDocument();
    expect(
      screen.getByText(/no representa todo el mercado laboral/i),
    ).toBeInTheDocument();
    expect(
      container.querySelector('time[datetime="2026-08-18T00:00:00.000Z"]'),
    ).not.toBeNull();
  });

  it("describes missing reviewed coverage as pending publication", () => {
    render(
      <DecisionEvidencePath
        programTitle="Ciclo sin relación"
        professionalOutputCount={2}
        professionalOutputSourceUrl={undefined}
        professionalOutputEvidenceDate={null}
        reviewedOccupationCount={0}
        reviewedOccupationSourceUrl={undefined}
        reviewedOccupationEvidenceDate={null}
        reviewedOccupationEvidencePrefix="Copia"
        currentOfferCount={0}
        currentOfferSourceUrl="https://example.com/ofertas"
        currentOfferEvidenceDate={null}
        studyCenterCount={1}
        studyCenterSourceUrl="https://example.com/centros"
        studyCenterEvidenceDate={null}
      />,
    );
    expect(
      screen.getByText("Relación todavía no publicada como revisada"),
    ).toBeInTheDocument();
  });
});
