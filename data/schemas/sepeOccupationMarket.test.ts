import { describe, expect, it } from "vitest";

import {
  SEPE_CYL_PROVINCES,
  SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  SepeOccupationMarketSchema,
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
    url: "https://www.sepe.es/HomeSepe/occupation/2721",
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
