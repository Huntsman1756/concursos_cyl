import { describe, expect, it } from "vitest";
import results from "../../analysis/fp_official_alias_pass_results.json";
import manifest from "../../public/data/v1/manifest.json";
import { assertRenderedFpOfficialAliasPassReport, renderFpOfficialAliasPassReport } from "./renderFpOfficialAliasPassReport";

describe("renderFpOfficialAliasPassReport", () => {
  it("renders the exact controlled result", () => {
    const report = renderFpOfficialAliasPassReport(results, manifest);
    expect(report).toContain("20260808215403108-add4c517860c");
    expect(report).toContain("HOT01M: 0 → 0");
    expect(report).toContain("20260808234300480-2764dd0a085e");
    expect(() => assertRenderedFpOfficialAliasPassReport("stale", report)).toThrow(/validated rendered/i);
  });
});
