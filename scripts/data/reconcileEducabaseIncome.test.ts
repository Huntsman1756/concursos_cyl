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
      /famprof_2_08.*cell 500.*csv.*px/iu,
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
});
