import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import results from "../../analysis/fp_official_alias_pass_results.json";
import manifest from "../../public/data/v1/manifest.json";
import {
  assertRenderedFpOfficialAliasPassReport,
  renderFpOfficialAliasPassReport,
} from "./renderFpOfficialAliasPassReport";

describe("renderFpOfficialAliasPassReport", () => {
  it("renders the exact controlled result", async () => {
    const report = renderFpOfficialAliasPassReport(results, manifest);
    const checkedIn = await readFile(
      resolve(process.cwd(), "analysis", "fp_official_alias_pass_results.md"),
      "utf8",
    );

    expect(checkedIn).toBe(report);
    expect(report.endsWith("\n")).toBe(true);
    expect(report).toContain("20260808215403108-add4c517860c");
    expect(report).toContain("Alias aceptados: 10; rechazados: 44.");
    expect(report).toContain("- EOC01M: 0 → 0.");
    expect(report).toContain("- HOT01M: 0 → 0.");
    expect(report).toContain("- SSC01M: 0 → 0.");
    expect(report.indexOf("EOC01M")).toBeLessThan(report.indexOf("HOT01M"));
    expect(report.indexOf("HOT01M")).toBeLessThan(report.indexOf("SSC01M"));
    expect(report).toContain("Unión de ofertas nuevas: 0.");
    expect(report).toContain("20260808234300480-2764dd0a085e");
    expect(manifest.resourceSnapshots.programs.recordCount).toBe(187);
    expect(manifest.resourceSnapshots.occupations.recordCount).toBe(11);
    expect(manifest.resourceSnapshots.occupationAliases.recordCount).toBe(20);
    expect(manifest.resourceSnapshots.trainingOccupationLinks.recordCount).toBe(
      12,
    );
    expect(report).toContain("no estiman el empleo total");
    expect(report).toContain(
      "La pasada oficial acotada no aumenta las ofertas alcanzadas; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia.",
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
  });
});
