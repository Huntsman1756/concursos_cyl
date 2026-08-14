import { z } from "zod";

export const TrainingSourceRecordSchema = z
  .object({
    clave_ciclo: z.string().trim().min(1),
    nombre_ciclo: z.string().trim().min(1),
    nivel: z.string().trim().min(1),
    familia_profesional_codigo: z.string().trim().min(1),
    familia_profesional_nombre: z.string().trim().min(1),
    codigo_centro: z.string().trim().min(1),
    nombre_centro: z.string().trim().min(1),
    provincia: z.string().trim().min(1),
    localidad: z.string().trim().min(1),
    modalidad: z.string().trim().min(1),
  })
  .passthrough();

export type TrainingSourceRecord = z.infer<typeof TrainingSourceRecordSchema>;
