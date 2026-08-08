import { describe, expect, it } from "vitest";

import { renderFpCoveragePilotReport } from "./renderFpCoveragePilotReport";
import { validateFpCoveragePilotResultsFile } from "./validateFpCoveragePilot";
import coverage from "../../public/data/v1/snapshots/20260808191640155-bdbc9a4458a4/mapping-coverage.json";

describe("renderFpCoveragePilotReport", () => {
  it("renders validated terminal counts, separate time measures, and the zero-match bottleneck", async () => {
    const results = await validateFpCoveragePilotResultsFile();
    const report = renderFpCoveragePilotReport(results, coverage);

    expect(report).toContain("4/5 programas completados");
    expect(report).toContain("68 minutos de trabajo activo modelado");
    expect(report).toContain("43 ofertas marginales");
    expect(report).toContain("HOT01M, SSC01M y EOC01M");
    expect(report).toContain("0 ofertas marginales");
    expect(report).toContain("COM01M permanece diferido");
  });
});
