import { z } from "zod";
import { SourceGeoPointSchema } from "./sourceCoordinate";

const nullableText = z.string().nullable();

/** Exact 2026-08-04 Junta employment-offer record signature. */
export const OfferSourceRecordSchema = z
  .object({
    titulo: z.string(),
    provincia: z.string(),
    fecha_publicacion: z.string(),
    descripcion: z.string(),
    provinciaalternativa: nullableText,
    fuentecontenido: z.string(),
    idlocalidad: nullableText,
    localidad: nullableText,
    latitud: nullableText,
    longitud: nullableText,
    codigo_localidad: nullableText,
    identificador: z.string(),
    actualizacionmetadatos: z.string(),
    enlace_al_contenido: z.string(),
    posicion: SourceGeoPointSchema.nullable(),
  })
  .strict();

export type OfferSourceRecord = z.infer<typeof OfferSourceRecordSchema>;
