import { decodeHTML } from "entities";

import {
  EcylCourseSchema,
  ProfessionalCertificateSchema,
  type EcylCourse,
  type EcylCourseSourceRecord,
  type ProfessionalCertificate,
  type ProfessionalCertificateSourceRecord,
} from "../../data/schemas/ecylResources";

function plainText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const text = decodeHTML(value)
    .replace(/<br\s*\/?\s*>/giu, " · ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .replace(/(?:\s·)+\s*$/u, "")
    .trim();
  return text.length > 0 ? text : null;
}

function dateOnly(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  const match = /^(\d{4}-\d{2}-\d{2})/u.exec(value.trim());
  if (match == null || Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    return null;
  }
  return match[1];
}

function positiveInteger(value: number | null | undefined): number | null {
  return value != null && Number.isInteger(value) && value > 0 ? value : null;
}

function hours(value: string | null | undefined): number | null {
  const match = value == null ? null : /\d+/u.exec(value.replace(/\./gu, ""));
  return match == null ? null : positiveInteger(Number(match[0]));
}

export function normalizeEcylCourses(
  records: readonly EcylCourseSourceRecord[],
): EcylCourse[] {
  return records
    .map((record) =>
      EcylCourseSchema.parse({
        id: String(record.identificador),
        title: plainText(record.titulo),
        modality: plainText(record.tipo_formacion),
        locality: plainText(record.idlocalidad),
        applicationDeadline: dateOnly(
          record.fecha_limite_de_presentacion_de_candidaturas,
        ),
        startDate: dateOnly(record.fecha_de_inicio),
        endDate: dateOnly(record.fecha_de_finalizacion),
        durationHours: hours(record.duracion),
        subject: plainText(record.materia),
        audience: (Array.isArray(record.colectivo_destinatario)
          ? record.colectivo_destinatario
          : record.colectivo_destinatario == null
            ? []
            : [record.colectivo_destinatario]
        )
          .map((value) => plainText(value))
          .filter((value): value is string => value != null),
        requirements: plainText(record.requisitos_necesarios),
        registration: plainText(record.forma_inscripcion),
        venue: plainText(record.lugar_de_celebracion),
        places: positiveInteger(record.plazas),
        officialUrl: record.enlace_al_contenido,
      }),
    )
    .sort((left, right) =>
      left.title.localeCompare(right.title, "es", { sensitivity: "base" }),
    );
}

export function normalizeProfessionalCertificates(
  records: readonly ProfessionalCertificateSourceRecord[],
): ProfessionalCertificate[] {
  return records
    .map((record) =>
      ProfessionalCertificateSchema.parse({
        code: record.codigo.trim(),
        title: record.denominacion.trim(),
        familyCode: record.familia.trim(),
        level: record.nivel_cp,
        totalHours: positiveInteger(record.horas_totales_certificado),
        classroomHours: record.horas_presenciales ?? null,
        onlineHours: record.horas_teleformacion ?? null,
        practiceHours: record.horas_modulo_praticas ?? null,
        fullyOnline:
          record.completa_en_teleformacion == null
            ? null
            : record.completa_en_teleformacion
                .trim()
                .toLocaleLowerCase("es-ES") === "completa",
        structureUrl: record.consultar_estructura,
        programUrl: record.consultar_programa_real_decreto,
      }),
    )
    .sort((left, right) => left.code.localeCompare(right.code));
}
