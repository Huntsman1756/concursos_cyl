import { describe, expect, it } from "vitest";

import type {
  MunicipalitySourceRecord,
  RegionalContractSourceRecord,
} from "../../data/schemas/regionalContext";
import {
  normalizeMunicipalities,
  normalizeRegionalContracts,
} from "./normalizeRegionalContext";

const contract = (
  overrides: Partial<RegionalContractSourceRecord> = {},
): RegionalContractSourceRecord => ({
  fecha: "2026-06-30",
  codigo_territorio: "09",
  nombre_territorio: "Burgos",
  longitud: -3.586,
  latitud: 42.367,
  total: 8_899,
  indefinido: 907,
  temporal: 7_992,
  posicion: { lon: -3.586, lat: 42.367 },
  provincia: "BU",
  ...overrides,
});

const municipality = (
  overrides: Partial<MunicipalitySourceRecord> = {},
): MunicipalitySourceRecord => ({
  municipio: "ALBORNOS",
  cod_municipio: "005",
  provincia: "ÁVILA",
  cod_provincia: "05",
  cod_ine: 5005,
  poblacion: 170,
  mancomunidades: null,
  entidades_locales_menores: null,
  comarca: null,
  longitud: -4.886271,
  latitud: 40.835453,
  coordenadax: 340_963.64,
  coordenaday: 4_522_203.14,
  posicion: { lon: -4.886271, lat: 40.835453 },
  presencia_de_comercio: "0",
  ...overrides,
});

describe("normalizeRegionalContracts", () => {
  it("sorts the monthly province grain deterministically", () => {
    const rows = normalizeRegionalContracts([
      contract({
        codigo_territorio: "34",
        nombre_territorio: "Palencia",
        provincia: "PA",
      }),
      contract(),
    ]);
    expect(rows.map(({ provinceCode }) => provinceCode)).toEqual(["09", "34"]);
    expect(rows[0]?.month).toBe("2026-06-30T00:00:00.000Z");
  });

  it("rejects inconsistent totals and duplicate monthly provinces", () => {
    expect(() => normalizeRegionalContracts([contract({ total: 1 })])).toThrow(
      /permanent plus temporary/i,
    );
    expect(() => normalizeRegionalContracts([contract(), contract()])).toThrow(
      /duplicate monthly province/i,
    );
  });
});

describe("normalizeMunicipalities", () => {
  it("pads INE codes and sorts them deterministically", () => {
    const rows = normalizeMunicipalities([
      municipality({ cod_ine: 5006, municipio: "OTRO" }),
      municipality(),
    ]);
    expect(rows.map(({ ineCode }) => ineCode)).toEqual(["05005", "05006"]);
  });

  it("rejects duplicate INE codes and invalid coordinates", () => {
    expect(() =>
      normalizeMunicipalities([municipality(), municipality()]),
    ).toThrow(/duplicate INE/i);
    expect(() =>
      normalizeMunicipalities([municipality({ latitud: 100 })]),
    ).toThrow();
  });
});
