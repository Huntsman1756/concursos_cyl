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
});
