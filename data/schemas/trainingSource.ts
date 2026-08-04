import { z } from "zod";

const nullableText = z.string().nullable();

/**
 * Shape received from the Junta de Castilla y León vocational-training dataset.
 * Extra fields are retained so the fetch layer can preserve upstream responses.
 */
export const TrainingSourceRecordSchema = z
  .object({
    clave_ciclo: nullableText,
    ciclo_formativo_curso_de_especializacion: nullableText,
    nivel_educativo: nullableText,
    familia_profesional: nullableText,
    codigo_familia: nullableText,
    codigo_centro: nullableText,
    centro_educativo: nullableText,
    provincia: nullableText,
    localidad: nullableText,
    modalidad: nullableText,
    titularidad_centro: nullableText.optional(),
    direccion_centro: nullableText.optional(),
    telefono: nullableText.optional(),
    e_mail: nullableText.optional(),
    web: nullableText.optional(),
  })
  .passthrough();

export type TrainingSourceRecord = z.infer<typeof TrainingSourceRecordSchema>;
