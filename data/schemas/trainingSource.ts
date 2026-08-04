import { z } from "zod";

const nullableText = z.string().nullable();

/**
 * Shape received from the Junta de Castilla y León vocational-training dataset.
 * Extra fields are retained so the fetch layer can preserve upstream responses.
 */
export const TrainingSourceRecordSchema = z
  .object({
    clave_ciclo: nullableText,
    denominacion_ciclo: nullableText,
    nivel: nullableText,
    familia_profesional: nullableText,
    codigo_centro: nullableText,
    nombre_centro: nullableText,
    provincia: nullableText,
    localidad: nullableText,
    modalidad: nullableText,
    titularidad: nullableText.optional(),
    direccion: nullableText.optional(),
    telefono: nullableText.optional(),
    email: nullableText.optional(),
    web: nullableText.optional(),
  })
  .passthrough();

export type TrainingSourceRecord = z.infer<typeof TrainingSourceRecordSchema>;
