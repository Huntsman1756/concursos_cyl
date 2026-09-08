import { describe, expect, it } from "vitest";

import { formatOutcomeLabel } from "./outcomePresentation";

describe("formatOutcomeLabel", () => {
  it("normalizes source casing while preserving known acronyms", () => {
    expect(formatOutcomeLabel("ACTIVIDADES FÍSICAS Y DEPORTIVAS")).toBe(
      "Actividades físicas y deportivas",
    );
    expect(formatOutcomeLabel("CUIDADOS AUXILIARES (LOGSE)")).toBe(
      "Cuidados auxiliares (LOGSE)",
    );
  });

  it("corrects known source-table orthography defects for display", () => {
    expect(formatOutcomeLabel("Anatomía patológica y citodiagnostico")).toBe(
      "Anatomía patológica y citodiagnóstico",
    );
    expect(formatOutcomeLabel("Laboratorio clinico y biomédico")).toBe(
      "Laboratorio clínico y biomédico",
    );
    expect(
      formatOutcomeLabel(
        "Química industrial - Fabricación de Productos Farmaceuticos - Industrias de proceso de pasta y papel",
      ),
    ).toBe(
      "Química industrial - fabricación de productos farmacéuticos - industrias de proceso de pasta y papel",
    );
    expect(formatOutcomeLabel("Radioterampia y dosimetría")).toBe(
      "Radioterapia y dosimetría",
    );
  });
});
