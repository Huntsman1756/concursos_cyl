import { z } from "zod";

const NullableText = z.string().nullable().optional();
const NullableNumber = z.number().nullable().optional();

export const EcylCourseSourceRecordSchema = z
  .object({
    identificador: z.union([z.string(), z.number()]),
    titulo: z.string(),
    tipo_formacion: NullableText,
    idlocalidad: NullableText,
    fecha_limite_de_presentacion_de_candidaturas: NullableText,
    fecha_de_inicio: NullableText,
    fecha_de_finalizacion: NullableText,
    duracion: NullableText,
    materia: NullableText,
    colectivo_destinatario: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional(),
    requisitos_necesarios: NullableText,
    forma_inscripcion: NullableText,
    lugar_de_celebracion: NullableText,
    plazas: NullableNumber,
    enlace_al_contenido: z.string(),
  })
  .passthrough();

export const ProfessionalCertificateSourceRecordSchema = z
  .object({
    familia: z.string(),
    codigo: z.string(),
    denominacion: z.string(),
    consultar_estructura: z.string(),
    consultar_programa_real_decreto: z.string(),
    nivel_cp: z.number(),
    horas_totales_modulos_formativos: NullableNumber,
    horas_presenciales: NullableNumber,
    horas_teleformacion: NullableNumber,
    horas_modulo_praticas: NullableNumber,
    horas_totales_certificado: NullableNumber,
    completa_en_teleformacion: NullableText,
  })
  .passthrough();

export const EcylCourseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    modality: z.string().min(1).nullable(),
    locality: z.string().min(1).nullable(),
    applicationDeadline: z.string().date().nullable(),
    startDate: z.string().date().nullable(),
    endDate: z.string().date().nullable(),
    durationHours: z.number().int().positive().nullable(),
    subject: z.string().min(1).nullable(),
    audience: z.array(z.string().min(1)),
    requirements: z.string().min(1).nullable(),
    registration: z.string().min(1).nullable(),
    venue: z.string().min(1).nullable(),
    places: z.number().int().positive().nullable(),
    officialUrl: z.string().url(),
  })
  .strict();

export const ProfessionalCertificateSchema = z
  .object({
    code: z.string().min(1),
    title: z.string().min(1),
    familyCode: z.string().min(1),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    totalHours: z.number().int().positive().nullable(),
    classroomHours: z.number().int().nonnegative().nullable(),
    onlineHours: z.number().int().nonnegative().nullable(),
    practiceHours: z.number().int().nonnegative().nullable(),
    fullyOnline: z.boolean().nullable(),
    structureUrl: z.string().url(),
    programUrl: z.string().url(),
  })
  .strict();

export const EcylCoursesResourceSchema = z.array(EcylCourseSchema);
export const ProfessionalCertificatesResourceSchema = z.array(
  ProfessionalCertificateSchema,
);

export type EcylCourseSourceRecord = z.infer<
  typeof EcylCourseSourceRecordSchema
>;
export type ProfessionalCertificateSourceRecord = z.infer<
  typeof ProfessionalCertificateSourceRecordSchema
>;
export type EcylCourse = z.infer<typeof EcylCourseSchema>;
export type ProfessionalCertificate = z.infer<
  typeof ProfessionalCertificateSchema
>;
