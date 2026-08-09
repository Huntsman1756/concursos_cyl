import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  EDUCABASE_INCOME_SOURCES,
  EDUCABASE_INCOME_TABLE_IDS,
} from "./educabaseIncomeSources";
import { loadEducabaseIncomeBundle } from "./loadEducabaseIncome";

const directory = join(process.cwd(), "tests/fixtures/educabase-income");

describe("loadEducabaseIncomeBundle", () => {
  it("loads four reconciled tables in source order and CSV/PX artifact order", async () => {
    const request = async (url: string): Promise<Response> => {
      const table = EDUCABASE_INCOME_TABLE_IDS.find((id) => url.includes(id));
      if (!table) throw new Error(`Unexpected URL ${url}`);
      const extension = url.includes("/csv_") ? "csv" : "px";
      const bytes = await readFile(join(directory, `${table}.${extension}`));
      const response = new Response(bytes, {
        headers: {
          "content-type":
            extension === "csv"
              ? "text/plain;charset=ISO-8859-15"
              : "application/pc-axis;charset=ISO-8859-15",
        },
      });
      Object.defineProperty(response, "url", { value: url });
      return response;
    };
    const bundle = await loadEducabaseIncomeBundle({
      fetchedAt: "2026-08-09T00:00:00.000Z",
      request,
      sleep: async () => undefined,
    });
    expect(bundle.tables.map((verified) => verified.table.tableId)).toEqual(
      EDUCABASE_INCOME_TABLE_IDS,
    );
    expect(
      bundle.artifacts.map(
        (artifact) => `${artifact.tableId}:${artifact.format}`,
      ),
    ).toEqual(
      EDUCABASE_INCOME_TABLE_IDS.flatMap((id) => [`${id}:csv`, `${id}:px`]),
    );
    expect(
      bundle.tables.every(
        (verified) =>
          verified.artifacts[0].format === "csv" &&
          verified.artifacts[1].format === "px",
      ),
    ).toBe(true);
  });

  it("fails the complete bundle when one source fails", async () => {
    await expect(
      loadEducabaseIncomeBundle({
        request: async (url) => {
          if (url === EDUCABASE_INCOME_SOURCES.ccaa_3_07.pxUrl)
            return new Response("missing", { status: 404 });
          return new Response(new Uint8Array([0xef, 0xbb, 0xbf, 0x78]));
        },
        sleep: async () => undefined,
      }),
    ).rejects.toThrow(/404|UTF-8|empty/i);
  });

  it("names fixture files only as a test helper", () => {
    expect(basename(join(directory, "famprof_2_08.csv"))).toBe(
      "famprof_2_08.csv",
    );
  });
});
