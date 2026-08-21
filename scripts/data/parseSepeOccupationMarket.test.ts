import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  parseSepeOccupationMarket,
  type SepeOccupationMarketParseOptions,
} from "./parseSepeOccupationMarket";

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/sepe-occupation-market/cno-2721-2026-07.html",
);

const options: SepeOccupationMarketParseOptions = {
  expectedCnoCode: "2721",
  sourceUrl:
    "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Diseñadores-~.html",
  retrievedAt: "2026-08-22T09:30:00Z",
};

async function fixture(): Promise<string> {
  return readFile(fixturePath, "utf8");
}

describe("parseSepeOccupationMarket", () => {
  it("normalizes the official period, CNO, national metrics and nine CyL provinces", async () => {
    const parsed = parseSepeOccupationMarket(await fixture(), options);

    expect(parsed).toMatchObject({
      period: "2026-07",
      cno: {
        code: "2721",
        label: "Diseñadores y administradores de bases de datos",
      },
      national: {
        registeredContracts: {
          total: 116,
          people: 115,
          monthlyVariationPercent: -4.92,
          annualVariationPercent: -17.14,
        },
        registeredUnemployment: {
          total: 2478,
          monthlyVariationPercent: 2.65,
          annualVariationPercent: 17.5,
        },
        contractCharacteristics: {
          lastTwelveMonthsTotal: 1352,
          indefinite: 91,
          fullTime: 106,
          rotationIndex: 1.01,
        },
      },
      source: {
        url: options.sourceUrl,
        retrievedAt: options.retrievedAt,
      },
    });
    expect(parsed.provinces).toHaveLength(9);
    expect(parsed.provinces.map((row) => row.province)).toEqual([
      "Ávila",
      "Burgos",
      "León",
      "Palencia",
      "Salamanca",
      "Segovia",
      "Soria",
      "Valladolid",
      "Zamora",
    ]);
    expect(parsed.provinces.find((row) => row.province === "Ávila")).toEqual(
      expect.objectContaining({
        registeredContracts: {
          total: 0,
          monthlyVariationPercent: 0,
          annualVariationPercent: -100,
        },
        registeredUnemployment: {
          total: 4,
          monthlyVariationPercent: 33.33,
          annualVariationPercent: -20,
        },
      }),
    );
  });

  it("does not invent an optional contract-characteristics section", async () => {
    const html = (await fixture())
      .replace(
        /<h4>Cifras mensuales de contratos<\/h4>[\s\S]*?<\/section>/u,
        "",
      )
      .replace(
        /<section class="contract-characteristics">[\s\S]*?<\/section>/u,
        "",
      );
    const parsed = parseSepeOccupationMarket(html, options);

    expect("contractCharacteristics" in parsed.national).toBe(false);
  });

  it("fails closed for CNO mismatch, malformed period, duplicate and unknown province", async () => {
    const html = await fixture();
    expect(() =>
      parseSepeOccupationMarket(html, { ...options, expectedCnoCode: "3812" }),
    ).toThrow(/CNO/i);
    expect(() =>
      parseSepeOccupationMarket(
        html.replace("Julio 2026", "Juli 2026"),
        options,
      ),
    ).toThrow(/period/i);
    expect(() =>
      parseSepeOccupationMarket(html.replaceAll("Burgos", "Ávila"), options),
    ).toThrow(/duplicate|province/i);
    expect(() =>
      parseSepeOccupationMarket(html.replaceAll("Ávila", "Madrid"), options),
    ).toThrow(/unknown|province|Castilla/i);
  });

  it("uses supplied provenance and never performs a network request", async () => {
    const parsed = parseSepeOccupationMarket(await fixture(), options);
    expect(parsed.source).toEqual({
      url: options.sourceUrl,
      retrievedAt: options.retrievedAt,
      attribution:
        "Elaborado por el Observatorio de las Ocupaciones del SEPE a partir de los datos del SISPE.",
    });
  });
});
