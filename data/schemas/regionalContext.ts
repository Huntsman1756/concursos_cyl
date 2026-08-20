import { z } from "zod";

import { SourceGeoPointSchema } from "./sourceCoordinate";

const latitude = z.number().finite().min(-90).max(90);
const longitude = z.number().finite().min(-180).max(180);
const provinceCode = z.string().regex(/^\d{2}$/u);

export const RegionalContractSourceRecordSchema = z
  .object({
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
    codigo_territorio: provinceCode,
    nombre_territorio: z.string().min(1),
    longitud: longitude,
    latitud: latitude,
    total: z.number().int().nonnegative(),
    indefinido: z.number().int().nonnegative(),
    temporal: z.number().int().nonnegative(),
    posicion: SourceGeoPointSchema,
    provincia: z.string().min(2).max(2),
  })
  .strict();

export const MunicipalitySourceRecordSchema = z
  .object({
    municipio: z.string().min(1),
    cod_municipio: z.string().min(1),
    provincia: z.string().min(1),
    cod_provincia: provinceCode,
    cod_ine: z.number().int().nonnegative().max(99999),
    poblacion: z.number().int().nonnegative(),
    mancomunidades: z.string().nullable(),
    entidades_locales_menores: z.string().nullable(),
    comarca: z.string().nullable(),
    longitud: longitude,
    latitud: latitude,
    coordenadax: z.number().finite(),
    coordenaday: z.number().finite(),
    posicion: SourceGeoPointSchema,
    presencia_de_comercio: z.string(),
  })
  .strict();

export const ProvincialContractSchema = z
  .object({
    month: z.string().datetime(),
    provinceCode,
    provinceName: z.string().min(1),
    provinceAbbreviation: z.string().min(2).max(2),
    totalContracts: z.number().int().nonnegative(),
    permanentContracts: z.number().int().nonnegative(),
    temporaryContracts: z.number().int().nonnegative(),
    latitude,
    longitude,
  })
  .strict()
  .superRefine((row, context) => {
    if (
      row.totalContracts !==
      row.permanentContracts + row.temporaryContracts
    ) {
      context.addIssue({
        code: "custom",
        path: ["totalContracts"],
        message:
          "Total contracts must equal permanent plus temporary contracts.",
      });
    }
  });

export const MunicipalityContextSchema = z
  .object({
    ineCode: z.string().regex(/^\d{5}$/u),
    municipalityName: z.string().min(1),
    provinceCode,
    provinceName: z.string().min(1),
    population: z.number().int().nonnegative(),
    latitude,
    longitude,
  })
  .strict();

export const ProvincialContractsResourceSchema = z
  .array(ProvincialContractSchema)
  .superRefine((rows, context) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      const key = `${row.month}|${row.provinceCode}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: `Duplicate monthly province grain: ${key}.`,
        });
      }
      seen.add(key);
    });
  });

export const MunicipalitiesResourceSchema = z
  .array(MunicipalityContextSchema)
  .superRefine((rows, context) => {
    const seen = new Set<string>();
    rows.forEach((row, index) => {
      if (seen.has(row.ineCode)) {
        context.addIssue({
          code: "custom",
          path: [index, "ineCode"],
          message: `Duplicate INE code: ${row.ineCode}.`,
        });
      }
      seen.add(row.ineCode);
    });
  });

export type RegionalContractSourceRecord = z.infer<
  typeof RegionalContractSourceRecordSchema
>;
export type MunicipalitySourceRecord = z.infer<
  typeof MunicipalitySourceRecordSchema
>;
export type ProvincialContract = z.infer<typeof ProvincialContractSchema>;
export type MunicipalityContext = z.infer<typeof MunicipalityContextSchema>;
