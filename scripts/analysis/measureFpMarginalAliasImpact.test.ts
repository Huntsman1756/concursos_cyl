import { describe, expect, it } from "vitest";

import {
  FpMarginalAliasImpactSchema,
  measureFpMarginalAliasImpact,
} from "./measureFpMarginalAliasImpact";

const HEAVY_ANALYSIS_TEST_TIMEOUT = process.env.CI === "true" ? 60_000 : 15_000;
let impact: ReturnType<typeof measureFpMarginalAliasImpact> | undefined;

function measuredImpact() {
  impact ??= measureFpMarginalAliasImpact();
  return impact;
}

describe("measureFpMarginalAliasImpact", () => {
  it(
    "matches the accepted review exactly without lateral offers",
    async () => {
      const { report } = await measuredImpact();
      expect(FpMarginalAliasImpactSchema.parse(report)).toEqual(report);
      expect(report.baselineMatchedOfferCount).toBe(46);
      expect(report.proposedMatchedOfferCount).toBe(70);
      expect(report.marginalOfferCount).toBe(24);
      expect(report.marginalOfferIds).toEqual(report.expectedAcceptedOfferIds);
      expect(report.missingExpectedOfferIds).toEqual([]);
      expect(report.unexpectedOfferIds).toEqual([]);
    },
    HEAVY_ANALYSIS_TEST_TIMEOUT,
  );

  it("limits deltas to the reviewed programs", async () => {
    const { report } = await measuredImpact();
    expect(report.programDeltas.map((delta) => delta.programKey)).toEqual([
      "AFD01S",
      "AFD01SD",
      "COM01M",
      "FME02M",
      "IFC01M",
      "IFC01MD",
      "IFC01S",
      "IFC01SD",
      "IMP01B",
      "IMP02M",
      "SSC03S",
      "SSC03SD",
      "TMV01B",
      "TMV01M",
      "TMV02M",
    ]);
    for (const delta of report.programDeltas) {
      expect(delta.afterOfferCount).toBeGreaterThan(delta.beforeOfferCount);
    }
  });

  it("renders a frozen-snapshot before/after report", async () => {
    const { markdown } = await measuredImpact();
    expect(markdown).toContain("Ofertas enlazadas antes: 46");
    expect(markdown).toContain("Ofertas enlazadas después: 70");
    expect(markdown).toContain("misma instantánea congelada");
  });
});
