import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";
import { parseEducabaseIncomeCsv } from "./parseEducabaseIncomeCsv";
import { parseEducabaseIncomePx } from "./parseEducabaseIncomePx";
import { assertEquivalentIncomeTables } from "./reconcileEducabaseIncome";

async function fixturePair() {
  const directory = join(process.cwd(), "tests/fixtures/educabase-income");
  const source = EDUCABASE_INCOME_SOURCES.famprof_2_08;
  const [csv, px] = await Promise.all([
    readFile(join(directory, "famprof_2_08.csv")),
    readFile(join(directory, "famprof_2_08.px")),
  ]);
  return {
    csv: parseEducabaseIncomeCsv(source, csv),
    px: parseEducabaseIncomePx(source, px),
  };
}

describe("assertEquivalentIncomeTables", () => {
  it("accepts semantically equivalent complete official formats", async () => {
    const { csv, px } = await fixturePair();
    expect(() => assertEquivalentIncomeTables(csv, px)).not.toThrow();
  });

  it("rejects changed cells, dimensions, labels, notes and unavailable values", async () => {
    const { csv, px } = await fixturePair();
    const changed = structuredClone(px);
    changed.cells[500]!.rawValue = "19.999";
    expect(() => assertEquivalentIncomeTables(csv, changed)).toThrow(
      /numeric/i,
    );

    const label = structuredClone(px);
    (label.dimensions[0]!.values as string[])[0] = "2011-2012\u00a0";
    expect(() => assertEquivalentIncomeTables(csv, label)).toThrow(
      /dimension/i,
    );

    const unavailable = structuredClone(px);
    unavailable.cells[0]!.rawValue =
      unavailable.cells[0]!.rawValue === ".." ? "0" : "..";
    expect(() => assertEquivalentIncomeTables(csv, unavailable)).toThrow(
      /cell 0/i,
    );

    const note = structuredClone(px);
    note.note = "other observation window";
    expect(() => assertEquivalentIncomeTables(csv, note)).toThrow(/note/i);
  });

  it("rejects fractional, negative, blank and non-numeric PX values without rounding", async () => {
    const { csv, px } = await fixturePair();
    for (const rawValue of ["14385.49", "-1", "", "NaN"]) {
      const changed = structuredClone(px);
      changed.cells[500]!.rawValue = rawValue;
      expect(() => assertEquivalentIncomeTables(csv, changed)).toThrow(
        /numeric|cell 500/i,
      );
    }
  });

  it("uses exact integer cents and the official half-up display boundary", async () => {
    const { csv, px } = await fixturePair();
    const validCsv = structuredClone(csv);
    const validPx = structuredClone(px);
    validCsv.cells[500]!.rawValue = "14.385";
    validPx.cells[500]!.rawValue = "14384.50";
    expect(() => assertEquivalentIncomeTables(validCsv, validPx)).not.toThrow();

    const below = structuredClone(validPx);
    below.cells[500]!.rawValue = "14384.49";
    expect(() => assertEquivalentIncomeTables(validCsv, below)).toThrow(
      /cell 500/i,
    );

    const above = structuredClone(validPx);
    above.cells[500]!.rawValue = "14385.50";
    expect(() => assertEquivalentIncomeTables(validCsv, above)).toThrow(
      /cell 500/i,
    );
  });

  it("has no binary-number parsing or floating-point arithmetic in reconciliation", async () => {
    const source = await readFile(
      join(process.cwd(), "scripts/data/reconcileEducabaseIncome.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/Number\.parse|Math\.floor|Math\.round/u);
  });
});
