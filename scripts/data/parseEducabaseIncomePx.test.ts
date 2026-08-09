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

  it("fails closed on changed notes, required metadata, dimension placement, and unused VALUES", async () => {
    const bytes = await fixture("famprof_2_08.px");
    const source = EDUCABASE_INCOME_SOURCES.famprof_2_08;
    const replaceAscii = (from: string, to: string, occurrence = 0): Buffer => {
      expect(from).toHaveLength(to.length);
      const next = Buffer.from(bytes);
      let index = -1;
      for (let current = 0; current <= occurrence; current += 1) {
        index = next.indexOf(Buffer.from(from, "ascii"), index + 1);
      }
      expect(index).toBeGreaterThanOrEqual(0);
      next.write(to, index, "ascii");
      return next;
    };
    const insertBeforeData = (): Buffer => {
      const marker = Buffer.from("DATA=", "ascii");
      const index = Buffer.from(bytes).indexOf(marker);
      return Buffer.concat([
        Buffer.from(bytes).subarray(0, index),
        Buffer.from('VALUES("Bogus")="value";\n', "ascii"),
        Buffer.from(bytes).subarray(index),
      ]);
    };
    const mutations: readonly [string, Buffer][] = [
      ["note", replaceAscii("provisionales", "xxxxxxxxxxxxx")],
      ["units", replaceAscii("Euros", "Pesos")],
      ["source", replaceAscii("S.G.", "X.G.")],
      ["decimals", replaceAscii("DECIMALS=2", "DECIMALS=1")],
      ["showdecimals", replaceAscii("SHOWDECIMALS=0", "SHOWDECIMALS=1")],
      ["title", replaceAscii("Distrib. bases", "Distrib. afili")],
      ["contents", replaceAscii("Distrib. bases", "Distrib. afili", 1)],
      ["subjectarea", replaceAscii("FP GRADO MEDIO", "FP GRADO SUPER")],
      ["subjectcode", replaceAscii("BCCFP", "BADFP")],
      ["matrix", replaceAscii('MATRIX="3"', 'MATRIX="9"')],
      ["stub", replaceAscii('STUB="Cohorte', 'STUB="Fooorte')],
      ["heading", replaceAscii('HEADING="Ciclo', 'HEADING="Cohor')],
      ["values", insertBeforeData()],
    ];
    for (const [name, mutated] of mutations) {
      expect(() => parseEducabaseIncomePx(source, mutated)).toThrow(
        new RegExp(
          name === "note"
            ? "note"
            : "(UNITS|SOURCE|DECIMALS|metadata|dimensions|VALUES)",
          "i",
        ),
      );
    }
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
