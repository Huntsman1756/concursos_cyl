import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";
import { parseEducabaseIncomePx } from "./parseEducabaseIncomePx";

const fixture = (name: string) =>
  readFile(join(process.cwd(), "tests/fixtures/educabase-income", name));

describe("parseEducabaseIncomePx", () => {
  it("parses the approved full PC-Axis subset with exact dimensions and data cardinality", async () => {
    const parsed = parseEducabaseIncomePx(
      EDUCABASE_INCOME_SOURCES.famprof_3_08,
      await fixture("famprof_3_08.px"),
    );
    expect(parsed.cells).toHaveLength(14880);
    expect(
      parsed.dimensions.map((dimension) => dimension.values.length),
    ).toEqual([12, 4, 5, 62]);
    expect(parsed.note).toContain("2021-2022");
    expect(parsed.note).toContain("2022-2023");
    expect(parsed.cells.some((cell) => cell.rawValue === "..")).toBe(true);
  });

  it("requires the exact PC-Axis encoding and structural declarations", async () => {
    const bytes = await fixture("famprof_2_08.px");
    const bom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), bytes]);
    expect(() =>
      parseEducabaseIncomePx(EDUCABASE_INCOME_SOURCES.famprof_2_08, bom),
    ).toThrow(/BOM/i);
    const wrongCodepage = Buffer.from(bytes)
      .toString("latin1")
      .replace('CODEPAGE="iso-8859-15"', 'CODEPAGE="utf-8"');
    expect(() =>
      parseEducabaseIncomePx(
        EDUCABASE_INCOME_SOURCES.famprof_2_08,
        Buffer.from(wrongCodepage, "latin1"),
      ),
    ).toThrow(/CODEPAGE/i);
    const missingTerminator = Buffer.from(bytes).subarray(0, -1);
    expect(() =>
      parseEducabaseIncomePx(
        EDUCABASE_INCOME_SOURCES.famprof_2_08,
        missingTerminator,
      ),
    ).toThrow(/terminator/i);
  });

  it("rejects invalid data, invalid concatenation, and cardinality changes", () => {
    const text = [
      'AXIS-VERSION="2006";',
      'CHARSET="ANSI";',
      'CODEPAGE="iso-8859-15";',
      'NOTE="2021-2022" "2022-2023";',
      'STUB="Cohorte","Periodo de análisis","Medida (2)";',
      'HEADING="Ciclo-grupo (3)";',
      'VALUES("Cohorte")="2011-2012";',
      'VALUES("Periodo de análisis")="Primer año";',
      'VALUES("Medida (2)")="Media";',
      'VALUES("Ciclo-grupo (3)")="Grupo";',
      'DATA="bad";',
    ].join("\n");
    const bytes = Buffer.from(text, "latin1");
    expect(() =>
      parseEducabaseIncomePx(EDUCABASE_INCOME_SOURCES.famprof_2_08, bytes),
    ).toThrow(/data token/i);
  });
});
