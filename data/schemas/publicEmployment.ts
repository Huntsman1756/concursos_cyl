import { z } from "zod";

const NullableText = z.string().nullable().optional();
const NullableNumber = z.number().nullable().optional();

export const PublicEmploymentCallSourceRecordSchema = z
  .object({
    identificador: z.union([z.string(), z.number()]),
    titulo: z.string(),
    clasificador: NullableText,
    organismo_gestor: NullableText,
    numeroplazas: NullableNumber,
    municipio: NullableText,
    fecha_de_inicio: NullableText,
    fechafinalizacion: NullableText,
    requisitos_necesarios: NullableText,
    plazo_de_presentacion: NullableText,
    urlenlaceaplicacion: NullableText,
    actualizacionmetadatos: NullableText,
    enlace_al_contenido: z.string(),
  })
  .passthrough();

export const PublicEmploymentCallSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    organization: z.string().min(1).nullable(),
    places: z.number().int().positive().nullable(),
    municipality: z.string().min(1).nullable(),
    applicationStart: z.string().date().nullable(),
    applicationDeadline: z.string().date().nullable(),
    requirements: z.string().min(1).nullable(),
    deadlineCopy: z.string().min(1).nullable(),
    accessType: z.enum(["open", "internal", "mixed", "unknown"]),
    applicationUrl: z.string().url().nullable(),
    officialUrl: z.string().url(),
    sourceUpdatedAt: z.string().date().nullable(),
  })
  .strict();

export const PublicEmploymentCallsResourceSchema = z.array(
  PublicEmploymentCallSchema,
);

export type PublicEmploymentCallSourceRecord = z.infer<
  typeof PublicEmploymentCallSourceRecordSchema
>;
export type PublicEmploymentCall = z.infer<typeof PublicEmploymentCallSchema>;
