import { z } from "zod";

const GeoPointSchema = z
  .object({
    lon: z.number(),
    lat: z.number(),
  })
  .strict();

/** Exact 2026-08-04 Junta vocational-training record signature. */
export const TrainingSourceRecordSchema = z
  .object({
    provincia: z.string(),
    localidad: z.string(),
    codigo_centro: z.string(),
    centro_educativo: z.string(),
    titularidad_centro: z.string(),
    familia_profesional: z.string(),
    codigo_familia: z.string(),
    nivel_educativo: z.string(),
    clave_ciclo: z.string(),
    ciclo_formativo_curso_de_especializacion: z.string(),
    modalidad: z.string(),
    tipo_ensenanza: z.string(),
    grupos_1o: z.number(),
    grupos_2o: z.number(),
    grupos_3o: z.string().nullable(),
    direccion_centro: z.string(),
    codigo_postal: z.string(),
    telefono: z.string(),
    e_mail: z.string(),
    web: z.string(),
    localizacion: GeoPointSchema,
  })
  .strict();

export type TrainingSourceRecord = z.infer<typeof TrainingSourceRecordSchema>;
