import { z } from "zod";

export const OfferSourceRecordSchema = z
  .object({
    identificador: z.string().trim().min(1),
    titulo: z.string().trim().min(1),
    provincia: z.string().trim().nullable().optional(),
    localidad: z.string().trim().nullable().optional(),
    fecha_publicacion: z.string().trim().min(1).nullable().optional(),
    actualizacionmetadatos: z.string().trim().min(1).nullable().optional(),
    fuentecontenido: z.string().trim().min(1).nullable().optional(),
    descripcion: z.string().nullable().optional(),
    enlace_al_contenido: z.string().url(),
  })
  .passthrough();

export type OfferSourceRecord = z.infer<typeof OfferSourceRecordSchema>;
