import { describe, expect, it } from "vitest";

import {
  SEPE_CYL_PROVINCES,
  SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  SepeOccupationMarketSchema,
  SepeOccupationMarketResourceSchema,
  adaptSepeOccupationMarketResource,
} from "./sepeOccupationMarket";

const metric = {
  total: 116,
  monthlyVariationPercent: -4.92,
  annualVariationPercent: -17.14,
};

const validRecord = {
  period: "2026-07",
  cno: {
    code: "2721",
    label: "Diseñadores y administradores de bases de datos",
  },
  national: {
    registeredContracts: { ...metric, people: 115 },
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
  provinces: SEPE_CYL_PROVINCES.map((province, index) => ({
    province,
    registeredContracts: { ...metric, total: index },
    registeredUnemployment: {
      total: index + 1,
      monthlyVariationPercent: 0,
      annualVariationPercent: 0,
    },
  })),
  source: {
    url: "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html",
    retrievedAt: "2026-08-22T09:30:00Z",
    attribution: SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  },
};

describe("SepeOccupationMarketSchema", () => {
  it("accepts the normalized national and Castilla y León contract", () => {
    expect(SepeOccupationMarketSchema.parse(validRecord)).toEqual(validRecord);
  });

  it("keeps an absent optional characteristics section absent", () => {
    const { contractCharacteristics: _removed, ...nationalWithoutOptional } =
      validRecord.national;
    void _removed;
    const candidate = {
      ...validRecord,
      national: nationalWithoutOptional,
    };

    const parsed = SepeOccupationMarketSchema.parse(candidate);
    expect("contractCharacteristics" in parsed.national).toBe(false);
  });

  it("requires annual national variations while keeping province metrics reusable", () => {
    const { annualVariationPercent: _removed, ...contractsWithoutAnnual } =
      validRecord.national.registeredContracts;
    void _removed;
    expect(() =>
      SepeOccupationMarketSchema.parse({
        ...validRecord,
        national: {
          ...validRecord.national,
          registeredContracts: contractsWithoutAnnual,
        },
      }),
    ).toThrow(/annualVariationPercent/i);
  });

  it("requires an HTTPS SEPE source URL", () => {
    for (const protocol of ["http", "ftp"]) {
      expect(() =>
        SepeOccupationMarketSchema.parse({
          ...validRecord,
          source: {
            ...validRecord.source,
            url: `${protocol}://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion~_mensuales_2026_07_2721-Dise-adores-y-administradores-de-bases-de-datos~.html`,
          },
        }),
      ).toThrow(/https|scheme|url/i);
    }
    expect(() =>
      SepeOccupationMarketSchema.parse({
        ...validRecord,
        source: {
          ...validRecord.source,
          url: validRecord.source.url.replace(
            "www.sepe.es",
            "observatorio.sepe.es",
          ),
        },
      }),
    ).toThrow(/https|host|SEPE|url/i);
  });

  it("requires the SEPE source URL to identify the record CNO and period", () => {
    for (const sourceUrl of [
      validRecord.source.url.replace("_2721-", "_2252-"),
      validRecord.source.url.replace("_2026_07_", "_2026_06_"),
      validRecord.source.url.replace(
        "https://www.sepe.es/",
        "https://user:password@www.sepe.es/",
      ),
      validRecord.source.url.replace(
        "https://www.sepe.es/",
        "https://www.sepe.es:444/",
      ),
      "https://www.sepe.es/",
    ]) {
      expect(() =>
        SepeOccupationMarketSchema.parse({
          ...validRecord,
          source: { ...validRecord.source, url: sourceUrl },
        }),
      ).toThrow(/canonical|CNO|period|source URL/i);
    }
  });

  it("rejects a duplicate or unknown Castilla y León province", () => {
    const duplicate = validRecord.provinces.map((row, index) =>
      index === 1
        ? { ...row, province: validRecord.provinces[0].province }
        : row,
    );
    expect(() =>
      SepeOccupationMarketSchema.parse({
        ...validRecord,
        provinces: duplicate,
      }),
    ).toThrow(/duplicate/i);

    const unknown = validRecord.provinces.map((row, index) =>
      index === 1 ? { ...row, province: "Madrid" } : row,
    );
    expect(() =>
      SepeOccupationMarketSchema.parse({ ...validRecord, provinces: unknown }),
    ).toThrow(/province|Castilla/i);
  });

  it("rejects malformed periods and mismatched CNO codes", () => {
    expect(() =>
      SepeOccupationMarketSchema.parse({ ...validRecord, period: "2026-13" }),
    ).toThrow(/period/i);
    expect(() =>
      SepeOccupationMarketSchema.parse({
        ...validRecord,
        cno: { ...validRecord.cno, code: "272" },
      }),
    ).toThrow(/cno/i);
  });
});

describe("SepeOccupationMarketResourceSchema", () => {
  const resource = {
    schemaVersion: "1.1.0",
    period: "2026-07",
    records: [validRecord],
    coverage: {
      requestedCnoCodes: ["2721"],
      publishedCnoCodes: ["2721"],
      notPublishedCnoCodes: [],
      resolverEndpoint:
        "https://www.sepe.es/HomeSepe/que-es-observatorio/informacion-mt-por-ocupacion/main/04/content/resultados",
      capturedAt: "2026-08-22T09:30:00Z",
    },
  };

  it("accepts a strict versioned envelope and adapts historical arrays", () => {
    expect(SepeOccupationMarketResourceSchema.parse(resource)).toEqual(
      resource,
    );
    const adapted = adaptSepeOccupationMarketResource([validRecord]);
    expect(adapted.records).toEqual([validRecord]);
    expect(adapted.coverage).toMatchObject({
      requestedCnoCodes: ["2721"],
      publishedCnoCodes: ["2721"],
      notPublishedCnoCodes: [],
    });
  });

  it("requires sorted unique coverage and an exact published/missing union", () => {
    expect(() =>
      SepeOccupationMarketResourceSchema.parse({
        ...resource,
        coverage: {
          ...resource.coverage,
          requestedCnoCodes: ["2721", "2252", "2252"],
          publishedCnoCodes: ["2721"],
          notPublishedCnoCodes: ["2252"],
        },
      }),
    ).toThrow(/sorted|unique|coverage|union/i);
    expect(() =>
      SepeOccupationMarketResourceSchema.parse({
        ...resource,
        coverage: {
          ...resource.coverage,
          requestedCnoCodes: ["2721"],
          publishedCnoCodes: [],
          notPublishedCnoCodes: ["2721"],
        },
      }),
    ).toThrow(/record|published|coverage/i);
  });

  it("requires every record to match the envelope period and published codes", () => {
    expect(() =>
      SepeOccupationMarketResourceSchema.parse({
        ...resource,
        records: [{ ...validRecord, period: "2026-06" }],
      }),
    ).toThrow(/period/i);
    expect(() =>
      SepeOccupationMarketResourceSchema.parse({
        ...resource,
        coverage: {
          ...resource.coverage,
          requestedCnoCodes: ["2252"],
          publishedCnoCodes: ["2252"],
          notPublishedCnoCodes: [],
        },
      }),
    ).toThrow(/published|CNO|coverage/i);
  });
});
