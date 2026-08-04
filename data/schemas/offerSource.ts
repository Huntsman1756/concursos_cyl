import { z } from "zod";

const nullableText = z.string().nullable();
const GeoPointSchema = z
  .object({
    lon: z.number(),
    lat: z.number(),
  })
  .strict();

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
    posicion: GeoPointSchema.nullable(),
  })
  .strict();

export type OfferSourceRecord = z.infer<typeof OfferSourceRecordSchema>;
