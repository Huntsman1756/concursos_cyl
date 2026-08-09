import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";
import { parseEducabaseIncomeCsv } from "./parseEducabaseIncomeCsv";

const fixture = (name: string) =>
  readFile(join(process.cwd(), "tests/fixtures/educabase-income", name));

describe("parseEducabaseIncomeCsv", () => {
  it("parses the full national and regional CSV responses with exact dimensions", async () => {
    const national = parseEducabaseIncomeCsv(
      EDUCABASE_INCOME_SOURCES.famprof_2_08,
      await fixture("famprof_2_08.csv"),
    );
    const regional = parseEducabaseIncomeCsv(
      EDUCABASE_INCOME_SOURCES.ccaa_2_07,
      await fixture("ccaa_2_07.csv"),
    );
    expect(national.cells).toHaveLength(8160);
    expect(
      national.dimensions
        .map((dimension) => dimension.values)
        .map((values) => values.length),
    ).toEqual([12, 4, 5, 34]);
    expect(regional.cells).toHaveLength(13680);
    expect(
      regional.dimensions
        .map((dimension) => dimension.values)
        .map((values) => values.length),
    ).toEqual([12, 19, 3, 4, 5]);
    expect(national.cells.some((cell) => cell.rawValue === "..")).toBe(true);
    expect(national.cells[0]?.dimensions).toMatchObject({
      Cohorte: "2011-2012",
    });
  });

  it("requires one UTF-8 BOM, exact source header and strict values", async () => {
    const bytes = await fixture("famprof_2_08.csv");
    expect(() =>
      parseEducabaseIncomeCsv(
        EDUCABASE_INCOME_SOURCES.famprof_2_08,
        bytes.subarray(3),
      ),
    ).toThrow(/BOM/i);
    const wrongHeader = Buffer.from(bytes);
    wrongHeader.set(Buffer.from("Xohorte", "utf8"), 3);
    expect(() =>
      parseEducabaseIncomeCsv(
        EDUCABASE_INCOME_SOURCES.famprof_2_08,
        wrongHeader,
      ),
    ).toThrow(/header/i);
    const invalidToken = Buffer.from(bytes);
    invalidToken.set(
      Buffer.from("x1", "utf8"),
      invalidToken.indexOf(Buffer.from("..", "utf8")),
    );
    expect(() =>
      parseEducabaseIncomeCsv(
        EDUCABASE_INCOME_SOURCES.famprof_2_08,
        invalidToken,
      ),
    ).toThrow(/numeric token/i);
  });

  it("handles quoted delimiters and newlines but rejects malformed quotes, NULs, and duplicate coordinates", () => {
    const source = EDUCABASE_INCOME_SOURCES.famprof_2_08;
    const header =
      "Cohorte;Periodo de análisis;Medida (2);Ciclo-grupo (3);Total";
    const rows = [
      '2011-2012;Primer año;Media;"Actividades; comerciales\\ncon salto";14.369',
      '2011-2012;Primer año;Media;"Actividades; comerciales\\ncon salto";14.369',
    ].join("\n");
    const bytes = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(`${header}\n${rows}`, "utf8"),
    ]);
    expect(() => parseEducabaseIncomeCsv(source, bytes)).toThrow(/duplicate/i);
    const malformed = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(`${header}\n"bad`, "utf8"),
    ]);
    expect(() => parseEducabaseIncomeCsv(source, malformed)).toThrow(/quote/i);
    const nul = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from(`${header}\0`, "utf8"),
    ]);
    expect(() => parseEducabaseIncomeCsv(source, nul)).toThrow(/NUL/i);
  });
});
