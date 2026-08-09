import { beforeAll, describe, expect, it } from "vitest";

import {
  loadAndValidateContestFreeze,
  type ContestFreeze,
} from "./validateContestFreeze";
import {
  renderContestSubmission,
  validateRenderedContestSubmission,
} from "./renderContestSubmission";

describe("contest submission renderer", () => {
  let freeze: ContestFreeze;

  beforeAll(() => {
    freeze = loadAndValidateContestFreeze();
  }, 30_000);

  it("renders the four final documents from the frozen values", () => {
    const rendered = renderContestSubmission(freeze);

    expect(Object.keys(rendered)).toEqual([
      "application-summary.md",
      "technical-evidence.md",
      "limitations.md",
      "submission-checklist.md",
    ]);
    expect(rendered["application-summary.md"]).toContain(
      "20260809185438334-65ce4d3c4e14",
    );
    expect(rendered["application-summary.md"]).toContain("6 cualificaciones");
    expect(rendered["application-summary.md"]).toContain("46 ofertas");
    expect(rendered["submission-checklist.md"]).toContain(
      "https://huntsman1756.github.io/concursos_cyl/",
    );
    expect(rendered["submission-checklist.md"]).toContain(
      "PENDIENTE DE APROBACIÓN HUMANA",
    );
  });

  it("is byte-stable and rejects forbidden or stale claims", () => {
    const first = renderContestSubmission(freeze);
    const second = renderContestSubmission(freeze);

    expect(second).toEqual(first);
    expect(() => validateRenderedContestSubmission(first)).not.toThrow();
    for (const content of Object.values(first)) {
      expect(content.endsWith("\n")).toBe(true);
      expect(content).not.toContain("12 cualificaciones");
      expect(content).not.toMatch(/salario esperado|tasa de empleo/iu);
    }
  });
});
