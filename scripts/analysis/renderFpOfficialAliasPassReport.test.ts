import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import eocReview from "../../analysis/fp_official_alias_pass/EOC01M.json";
import hotReview from "../../analysis/fp_official_alias_pass/HOT01M.json";
import sscReview from "../../analysis/fp_official_alias_pass/SSC01M.json";
import results from "../../analysis/fp_official_alias_pass_results.json";
import { FpOfficialAliasPassResultsSchema } from "../../data/schemas/fpOfficialAliasPass";
import manifest from "../../public/data/v1/manifest.json";
import {
  assertRenderedFpOfficialAliasPassReport,
  renderFpOfficialAliasPassReport,
} from "./renderFpOfficialAliasPassReport";

describe("renderFpOfficialAliasPassReport", () => {
  it("renders the exact controlled result", async () => {
    const audits = [eocReview, hotReview, sscReview];
    const report = renderFpOfficialAliasPassReport(results, manifest, audits);
    const checkedIn = await readFile(
      resolve(process.cwd(), "analysis", "fp_official_alias_pass_results.md"),
      "utf8",
    );

    expect(checkedIn).toBe(report);
    expect(report.endsWith("\n")).toBe(true);
    expect(report).toContain("20260808215403108-add4c517860c");
    expect(report).toContain(
      manifest.resourceSnapshots.programs.resourcePath.split("/")[4],
    );
    expect(report).toContain("Alias aceptados: 11; rechazados: 44.");
    expect(report).toContain("## Alias aceptados y rechazados");
    expect(report).toContain("- EOC01M: 5 aceptados; 21 rechazados.");
    expect(report).toContain("- HOT01M: 4 aceptados; 9 rechazados.");
    expect(report).toContain("- SSC01M: 2 aceptados; 14 rechazados.");
    expect(report).toContain("- EOC01M: 0 → 0.");
    expect(report).toContain("- HOT01M: 0 → 0.");
    expect(report).toContain("- SSC01M: 0 → 1.");
    expect(report.indexOf("EOC01M")).toBeLessThan(report.indexOf("HOT01M"));
    expect(report.indexOf("HOT01M")).toBeLessThan(report.indexOf("SSC01M"));
    expect(report).toContain("Unión de ofertas nuevas: 1.");
    expect(manifest.resourceSnapshots.programs.recordCount).toBe(187);
    expect(manifest.resourceSnapshots.occupations.recordCount).toBe(36);
    expect(manifest.resourceSnapshots.occupationAliases.recordCount).toBe(22);
    expect(manifest.resourceSnapshots.trainingOccupationLinks.recordCount).toBe(
      41,
    );
    expect(report).toContain("no estiman el empleo total");
    expect(report).toContain(
      "La pasada oficial acotada aumenta en 1 las ofertas alcanzadas mediante los alias validados; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia.",
    );
    expect(() =>
      assertRenderedFpOfficialAliasPassReport("stale", report),
    ).toThrow(/validated rendered/i);
    expect(() =>
      assertRenderedFpOfficialAliasPassReport(
        report.replace(/\n/gu, "\r\n"),
        report,
      ),
    ).toThrow(/validated rendered/i);
    expect(() =>
      assertRenderedFpOfficialAliasPassReport(`${report}\n`, report),
    ).toThrow(/validated rendered/i);

    expect(() =>
      renderFpOfficialAliasPassReport(
        { ...results, acceptedAliasCount: 9 },
        manifest,
        audits,
      ),
    ).toThrow(/aggregate|audit/i);
  });

  it("does not claim no increase for a positive schema-valid result", () => {
    const positive = FpOfficialAliasPassResultsSchema.parse(
      structuredClone(results),
    );
    positive.programs[0]!.afterOfferCount = 1;
    positive.programs[0]!.newlyReachedOfferIds = ["offer:test"];
    positive.newlyReachedOfferUnionCount = 1;
    positive.newlyReachedOfferUnionIds = ["offer:test"];

    expect(
      renderFpOfficialAliasPassReport(positive, manifest, [
        eocReview,
        hotReview,
        sscReview,
      ]),
    ).not.toContain(
      "La pasada oficial acotada no aumenta las ofertas alcanzadas",
    );
  });
});
