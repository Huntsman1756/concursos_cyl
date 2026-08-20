import {
  MunicipalitiesResourceSchema,
  MunicipalitySourceRecordSchema,
  ProvincialContractsResourceSchema,
  RegionalContractSourceRecordSchema,
  type MunicipalityContext,
  type MunicipalitySourceRecord,
  type ProvincialContract,
  type RegionalContractSourceRecord,
} from "../../data/schemas/regionalContext";

function monthInstant(value: string): string {
  const instant = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(instant.valueOf()) ||
    instant.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`Invalid regional contract date: ${value}.`);
  }
  return instant.toISOString();
}

export function normalizeRegionalContracts(
  input: readonly RegionalContractSourceRecord[],
): ProvincialContract[] {
  const rows = input.map((candidate) => {
    const record = RegionalContractSourceRecordSchema.parse(candidate);
    return {
      month: monthInstant(record.fecha),
      provinceCode: record.codigo_territorio,
      provinceName: record.nombre_territorio.trim(),
      provinceAbbreviation: record.provincia.toUpperCase(),
      totalContracts: record.total,
      permanentContracts: record.indefinido,
      temporaryContracts: record.temporal,
      latitude: record.latitud,
      longitude: record.longitud,
    };
  });
  rows.sort(
    (left, right) =>
      left.month.localeCompare(right.month) ||
      left.provinceCode.localeCompare(right.provinceCode),
  );
  return ProvincialContractsResourceSchema.parse(rows);
}

export function normalizeMunicipalities(
  input: readonly MunicipalitySourceRecord[],
): MunicipalityContext[] {
  const rows = input.map((candidate) => {
    const record = MunicipalitySourceRecordSchema.parse(candidate);
    return {
      ineCode: String(record.cod_ine).padStart(5, "0"),
      municipalityName: record.municipio.trim(),
      provinceCode: record.cod_provincia,
      provinceName: record.provincia.trim(),
      population: record.poblacion,
      latitude: record.latitud,
      longitude: record.longitud,
    };
  });
  rows.sort((left, right) => left.ineCode.localeCompare(right.ineCode));
  return MunicipalitiesResourceSchema.parse(rows);
}
