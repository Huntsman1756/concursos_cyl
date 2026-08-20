import { z } from "zod";

const nullableText = z.string().min(1).nullable();
const nullableCoordinate = z.number().finite().nullable();

export const EducationCenterDirectorySourceRecordSchema = z.object({
  curso_academico: z.string().regex(/^\d{4}$/u),
  codigo: z.string().regex(/^\d{8}$/u),
  situacion: z.literal("ALTA"),
  naturaleza: z.enum(["PÚBLICO", "PRIVADO"]),
  denominacion_generica: z.string().min(1),
  denominacion_especifica: z.string().min(1),
  provincia: z.string().min(1),
  municipio: z.string().min(1),
  localidad: z.string().min(1),
  c_postal: z.number().int().nonnegative().nullable(),
  correo_electronico: nullableText,
  web: nullableText,
  coord_longitud: nullableCoordinate,
  coord_latitud: nullableCoordinate,
  internado: z.enum(["S", "N"]),
  comedor: z.enum(["S", "N"]),
  transporte: z.enum(["S", "N"]),
});

export const EducationCenterDirectoryRecordSchema = z
  .object({
    academicYear: z.string().regex(/^\d{4}$/u),
    centerCode: z.string().regex(/^\d{8}$/u),
    ownership: z.enum(["public", "private"]),
    centerType: z.string().min(1),
    centerName: z.string().min(1),
    province: z.string().min(1),
    municipality: z.string().min(1),
    locality: z.string().min(1),
    postalCode: z
      .string()
      .regex(/^\d{5}$/u)
      .nullable(),
    email: nullableText,
    website: nullableText,
    latitude: nullableCoordinate,
    longitude: nullableCoordinate,
    hasBoarding: z.boolean(),
    hasCanteen: z.boolean(),
    hasTransport: z.boolean(),
  })
  .strict();

export const EducationCenterDirectoryResourceSchema = z
  .array(EducationCenterDirectoryRecordSchema)
  .superRefine((records, context) => {
    const codes = new Set<string>();
    records.forEach((record, index) => {
      if (codes.has(record.centerCode)) {
        context.addIssue({
          code: "custom",
          path: [index, "centerCode"],
          message: `Duplicate education center code: ${record.centerCode}.`,
        });
      }
      codes.add(record.centerCode);
      if ((record.latitude === null) !== (record.longitude === null)) {
        context.addIssue({
          code: "custom",
          path: [index, "latitude"],
          message:
            "Education center coordinates must be both present or both null.",
        });
      }
    });
  });

export type EducationCenterDirectorySourceRecord = z.infer<
  typeof EducationCenterDirectorySourceRecordSchema
>;
export type EducationCenterDirectoryRecord = z.infer<
  typeof EducationCenterDirectoryRecordSchema
>;
