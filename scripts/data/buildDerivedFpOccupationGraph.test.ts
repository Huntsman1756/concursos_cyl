import { describe, expect, it } from "vitest";

import {
  buildDerivedFpOccupationGraph,
  serializeDerivedFpOccupationGraphCsv,
  sha256Text,
} from "./buildDerivedFpOccupationGraph";

describe("derived FP occupation graph", () => {
  it("enriches approved links and serializes a deterministic spreadsheet-safe CSV", () => {
    const rows = buildDerivedFpOccupationGraph(
      [
        {
          programKey: "IFC03S",
          programTitle: "Desarrollo de Aplicaciones Web",
          level: "higher",
          familyCode: "IFC",
          familyName: "Informática y Comunicaciones",
        },
      ],
      [
        {
          occupationId: "occupation:cno11:3820",
          preferredLabel: "Programadores informáticos",
          confirmationLabel: "Programación informática",
          classificationSystem: "CNO-11",
          classificationCode: "3820",
          reviewStatus: "approved",
          sourceUrl: "https://www.ine.es/",
          reviewedAt: "2026-08-20",
          catalogVersion: "1.0.0",
        },
      ],
      [
        {
          trainingProgramKey: "IFC03S",
          occupationId: "occupation:cno11:3820",
          relationshipType: "official_output",
          reviewStatus: "approved",
          sourceUrl: "https://www.boe.es/eli/es/rd/2023/01/01/1",
          sourceQuote: "Programador web y profesional de aplicaciones.",
          reviewedAt: "2026-08-20",
          mappingVersion: "1.0.0",
        },
      ],
    );

    expect(rows).toEqual([
      expect.objectContaining({
        programKey: "IFC03S",
        cno11Code: "3820",
        occupationLabel: "Programadores informáticos",
      }),
    ]);
    const csv = serializeDerivedFpOccupationGraphCsv(rows);
    expect(csv.startsWith("\uFEFFprogram_key,program_title")).toBe(true);
    expect(csv).toContain('"Desarrollo de Aplicaciones Web"');
    expect(sha256Text(csv)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("neutralizes spreadsheet formulas in exported cells", () => {
    const csv = serializeDerivedFpOccupationGraphCsv([
      {
        programKey: "IFC03S",
        programTitle: '=HYPERLINK("https://example.test")',
        trainingLevel: "higher",
        familyCode: "IFC",
        familyName: "Informática",
        occupationId: "occupation:cno11:3820",
        cno11Code: "3820",
        occupationLabel: "Programadores informáticos",
        relationshipType: "official_output",
        sourceUrl: "https://www.boe.es/",
        sourceQuote: "Programador web y profesional de aplicaciones.",
        reviewedAt: "2026-08-20",
        mappingVersion: "1.0.0",
      },
    ]);

    expect(csv).toContain('"\'=HYPERLINK(""https://example.test"")"');
  });
});
