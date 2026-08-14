import { z } from "zod";

export const TrainingSourceRecordSchema = z
  .object({
    clave_ciclo: z.string().trim().min(1),
    nivel_educativo: z.string().trim().min(1),
    codigo_familia: z.string().trim().min(1),
    familia_profesional: z.string().trim().min(1),
    codigo_centro: z.string().trim().min(1),
    centro_educativo: z.string().trim().min(1),
    provincia: z.string().trim().min(1),
    localidad: z.string().trim().min(1),
    modalidad: z.string().trim().min(1),
    direccion_centro: z.string().trim().nullable().optional(),
    telefono: z.string().trim().nullable().optional(),
    e_mail: z.string().trim().nullable().optional(),
    web: z.string().trim().nullable().optional(),
    ciclo_formativo_curso_de_especializacion: z.string().trim().min(1),
  })
  .passthrough();

export type TrainingSourceRecord = z.infer<typeof TrainingSourceRecordSchema>;
