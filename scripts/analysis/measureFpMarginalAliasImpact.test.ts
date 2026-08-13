import { describe, expect, it } from "vitest";

import {
  FpMarginalAliasImpactSchema,
  measureFpMarginalAliasImpact,
} from "./measureFpMarginalAliasImpact";

let impact: ReturnType<typeof measureFpMarginalAliasImpact> | undefined;

function measuredImpact() {
  impact ??= measureFpMarginalAliasImpact();
  return impact;
}

describe("measureFpMarginalAliasImpact", () => {
  it("matches the accepted review exactly without lateral offers", async () => {
    const { report } = await measuredImpact();
    expect(FpMarginalAliasImpactSchema.parse(report)).toEqual(report);
    expect(report.baselineMatchedOfferCount).toBe(46);
    expect(report.proposedMatchedOfferCount).toBe(50);
    expect(report.marginalOfferCount).toBe(4);
    expect(report.marginalOfferIds).toEqual(report.expectedAcceptedOfferIds);
    expect(report.missingExpectedOfferIds).toEqual([]);
    expect(report.unexpectedOfferIds).toEqual([]);
  }, 15_000);

  it("limits deltas to the reviewed programs", async () => {
    const { report } = await measuredImpact();
    expect(report.programDeltas.map((delta) => delta.programKey)).toEqual([
      "AFD01S",
      "AFD01SD",
      "COM01M",
      "SSC03S",
      "SSC03SD",
    ]);
    for (const delta of report.programDeltas) {
      expect(delta.afterOfferCount).toBeGreaterThan(delta.beforeOfferCount);
    }
  });

  it("renders a frozen-snapshot before/after report", async () => {
    const { markdown } = await measuredImpact();
    expect(markdown).toContain("Ofertas enlazadas antes: 46");
    expect(markdown).toContain("Ofertas enlazadas después: 50");
    expect(markdown).toContain("misma instantánea congelada");
  });
});
