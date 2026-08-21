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

  it("requires both national annual variations and their source tables", async () => {
    const html = await fixture();
    const withoutContractsTable = html.replace(
      /<table>\s*<caption>\s*Contratos según sexo y edad\s*<\/caption>[\s\S]*?<\/table>/u,
      "",
    );
    expect(() =>
      parseSepeOccupationMarket(withoutContractsTable, options),
    ).toThrow(/annual variation.*contracts/i);

    const withoutUnemploymentAnnual = html.replace(
      "<td>17,50 %</td>",
      "<td></td>",
    );
    expect(() =>
      parseSepeOccupationMarket(withoutUnemploymentAnnual, options),
    ).toThrow(/annual variation.*unemployment/i);
  });

  it("rejects numeric suffixes and malformed grouping instead of accepting prefixes", async () => {
    const html = await fixture();
    expect(() =>
      parseSepeOccupationMarket(
        html.replace("2,65% (2)", "2,65garbage"),
        options,
      ),
    ).toThrow(/decimal/i);
    expect(() =>
      parseSepeOccupationMarket(
        html.replace("-4,92% (1)", "-4.92.1% (1)"),
        options,
      ),
    ).toThrow(/decimal/i);
  });

  it("scopes optional characteristics to the marked section", async () => {
    const html = await fixture();
    const withoutSection = html.replace(
      /<section class="contract-characteristics">[\s\S]*?<\/section>/u,
      "",
    );
    const unrelatedText =
      "<p>999 han sido de duración Indefinido y 9,99 es el índice de rotación de los contratos</p>";
    const parsed = parseSepeOccupationMarket(
      withoutSection.replace("</main>", `${unrelatedText}</main>`),
      options,
    );

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
    expect(() =>
      parseSepeOccupationMarket(html.replaceAll("Ávila", "Avila"), options),
    ).toThrow(/unknown|province|canonical|Castilla/i);
  });

  it("rejects unknown rows in an explicitly marked CyL subset regardless of row count", async () => {
    const html = await fixture();
    const marker =
      "<caption>\n      Distribución geográfica de parados\n    </caption>";
    const markerIndex = html.indexOf(marker);
    expect(markerIndex).toBeGreaterThanOrEqual(0);
    const before = html.slice(0, markerIndex);
    const after = html.slice(markerIndex);
    const unknownRows = ["Madrid", "Toledo", "Cuenca", "Cáceres"]
      .map(
        (province) =>
          `<tr><td>${province}</td><td>1</td><td>0,00 %</td><td>0,00 %</td></tr>`,
      )
      .join("");
    const withUnknownRows = `${before}${after.replace(
      "</tbody>",
      `${unknownRows}</tbody>`,
    )}`;

    expect(() => parseSepeOccupationMarket(withUnknownRows, options)).toThrow(
      /unknown|province|Castilla/i,
    );
  });

  it("rejects non-HTTPS provenance at parser boundaries", async () => {
    const html = await fixture();
    expect(() =>
      parseSepeOccupationMarket(html, {
        ...options,
        sourceUrl: "http://www.sepe.es/HomeSepe/occupation/2721",
      }),
    ).toThrow(/https|scheme|url/i);
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
