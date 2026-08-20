import { z } from "zod";

import { TrainingLevelSchema } from "./generated";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/u);
const ImmutableCsvPathSchema = z
  .string()
  .regex(
    /^\/data\/v1\/snapshots\/[a-z\d]+(?:-[a-z\d]+)*\/derived-fp-occupation-graph\.csv$/u,
  );

export const DerivedFpOccupationRowSchema = z
  .object({
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    trainingLevel: TrainingLevelSchema,
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
    occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
    cno11Code: z.string().regex(/^\d{4}$/u),
    occupationLabel: z.string().min(3),
    relationshipType: z.enum(["official_output", "reviewed_relationship"]),
    sourceUrl: z.string().url(),
    sourceQuote: z.string().min(10).max(280),
    reviewedAt: z.string().date(),
    mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();

export const DerivedFpOccupationGraphResourceSchema = z.array(
  DerivedFpOccupationRowSchema,
);

export const OpenDataCatalogRecordSchema = z
  .object({
    datasetId: z.literal("salida-cyl-fp-occupation-graph"),
    title: z.literal("Grafo FP y ocupaciones de SALIDA CyL"),
    description: z.string().min(20),
    generatedAt: z.string().datetime(),
    licenseName: z.literal("CC BY 4.0"),
    licenseUrl: z.literal("https://creativecommons.org/licenses/by/4.0/"),
    csvResourcePath: ImmutableCsvPathSchema,
    csvSha256: Sha256Schema,
    recordCount: z.number().int().nonnegative(),
  })
  .strict();

export const OpenDataCatalogResourceSchema = z.array(
  OpenDataCatalogRecordSchema,
);

export type DerivedFpOccupationRow = z.infer<
  typeof DerivedFpOccupationRowSchema
>;
export type OpenDataCatalogRecord = z.infer<typeof OpenDataCatalogRecordSchema>;
