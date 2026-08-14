import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EDUCABASE_SOURCES } from "./educabaseSources";
import {
  buildPcAxisQuery,
  fetchPcAxisTable,
  type PcAxisMetadata,
} from "./pcAxisClient";

async function fixture(name: string): Promise<unknown> {
  return JSON.parse(
    await readFile(
      join(process.cwd(), "tests", "fixtures", "educabase", name),
      "utf8",
    ),
  );
}

describe("pcAxisClient", () => {
  it("builds a bounded PC-Axis query from official dimension codes", async () => {
    const metadata = (await fixture("table-metadata.json")) as PcAxisMetadata;
    expect(
      buildPcAxisQuery(metadata, {
        cohort: ["2021-2022"],
        period: ["Año 4"],
        measure: ["Media"],
      }),
    ).toEqual({
      query: expect.arrayContaining([
        expect.objectContaining({
          code: "Cohorte",
          selection: { filter: "item", values: ["2021-2022"] },
        }),
      ]),
      response: { format: "json-stat2" },
    });
  });

  it("rejects a dimension value absent from official metadata", async () => {
    const metadata = (await fixture("table-metadata.json")) as PcAxisMetadata;
    expect(() => buildPcAxisQuery(metadata, { period: ["Año 8"] })).toThrow(
      /unknown dimension value/i,
    );
  });

  it("fetches metadata and a bounded JSON-stat2 response", async () => {
    const metadata = await fixture("table-metadata.json");
    const response = await fixture("table-response.json");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => metadata,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response,
      });

    await expect(
      fetchPcAxisTable(
        EDUCABASE_SOURCES.intermediateProgramIncome,
        {
          cohort: ["2021-2022"],
          period: ["Año 4"],
          measure: ["Media"],
        },
        fetchImpl,
      ),
    ).resolves.toMatchObject({
      sourceId: "educabase-fp-intermediate-program-income",
      value: [18450],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
