import { describe, expect, it } from "vitest";

import {
  assertRenderedPilotReport,
  renderFpCoveragePilotReport,
} from "./renderFpCoveragePilotReport";
import { validateFpCoveragePilotResultsFile } from "./validateFpCoveragePilot";
import coverage from "../../public/data/v1/snapshots/20260808213621985-add4c517860c/mapping-coverage.json";
import type { MappingCoverage } from "../../data/schemas/curatedMappings";

describe("renderFpCoveragePilotReport", () => {
  it("rejects a stale checked-in report", () => {
    expect(() => assertRenderedPilotReport("stale", "rendered")).toThrow(
      /not the validated rendered/i,
    );
  });

  it("rejects every leading, trailing, and final-newline difference", () => {
    for (const actual of [" rendered", "rendered ", "rendered\n\n"]) {
      expect(() => assertRenderedPilotReport(actual, "rendered\n")).toThrow(
        /not the validated rendered/i,
      );
    }
  });

  it("rejects terminal pilot states that disagree with public coverage", async () => {
    const results = await validateFpCoveragePilotResultsFile();
    const completedUnreviewed = structuredClone(coverage) as MappingCoverage[];
    const sanCoverage = completedUnreviewed.find(
      (row) => row.scope === "program" && row.programKey === "SAN21",
    ) as Extract<MappingCoverage, { scope: "program" }>;
    sanCoverage.coverageStatus = "uncovered";
    expect(() =>
      renderFpCoveragePilotReport(results, completedUnreviewed),
    ).toThrow(/terminal pilot states/i);
    const deferredReviewed = structuredClone(coverage) as MappingCoverage[];
    const comCoverage = deferredReviewed.find(
      (row) => row.scope === "program" && row.programKey === "COM01M",
    ) as Extract<MappingCoverage, { scope: "program" }>;
    comCoverage.coverageStatus = "reviewed";
    expect(() =>
      renderFpCoveragePilotReport(results, deferredReviewed),
    ).toThrow(/terminal pilot states|Public coverage/i);
  });
  it("renders validated terminal counts, separate time measures, and the zero-match bottleneck", async () => {
    const results = await validateFpCoveragePilotResultsFile();
    const report = renderFpCoveragePilotReport(
      results,
      coverage as MappingCoverage[],
    );

    expect(report).toContain("4/5 programas completados");
    expect(report).toContain("68 minutos de trabajo activo modelado");
    expect(report).toContain("43 ofertas marginales");
    expect(report).toContain("HOT01M, SSC01M y EOC01M");
    expect(report).toContain("0 ofertas marginales");
    expect(report).toContain("COM01M permanece diferido");
    expect(report).toContain(
      "excluye este endurecimiento integral posterior a la agregación, iniciado el 2026-08-08T21:17:46.2354891Z",
    );
  });
});
