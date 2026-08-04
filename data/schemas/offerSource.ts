import { z } from "zod";

const nullableText = z.string().nullable();

/**
 * Shape received from the Junta de Castilla y León employment-offers dataset.
 * Description HTML remains an upstream concern and is never part of the output contract.
 */
export const OfferSourceRecordSchema = z
  .object({
    identificador: z.string(),
    titulo: nullableText,
    provincia: nullableText,
    localidad: nullableText,
    fecha_publicacion: nullableText,
    fuentecontenido: nullableText,
    actualizacionmetadatos: nullableText,
    descripcion: nullableText,
    enlace_al_contenido: nullableText,
  })
  .passthrough();

export type OfferSourceRecord = z.infer<typeof OfferSourceRecordSchema>;
