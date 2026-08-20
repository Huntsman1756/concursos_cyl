import { decodeHTML } from "entities";

import {
  PublicEmploymentCallsResourceSchema,
  PublicEmploymentCallSourceRecordSchema,
  type PublicEmploymentCall,
  type PublicEmploymentCallSourceRecord,
} from "../../data/schemas/publicEmployment";

function plainText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const text = decodeHTML(value)
    .replace(/<br\s*\/?\s*>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return text.length > 0 ? text : null;
}

function dateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/u.exec(value.trim());
  if (match == null || Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    return null;
  }
  return match[1];
}

function accessType(
  classifier: string | null | undefined,
): PublicEmploymentCall["accessType"] {
  const value = plainText(classifier)?.toLocaleLowerCase("es-ES") ?? "";
  const internal = value.includes("promoción interna");
  const open = value.includes("turno libre") || value.includes("ingreso libre");
  if (internal && open) return "mixed";
  if (internal) return "internal";
  if (open) return "open";
  return "unknown";
}

export function normalizePublicEmploymentCalls(
  input: readonly PublicEmploymentCallSourceRecord[],
): PublicEmploymentCall[] {
  const calls = input.map((candidate) => {
    const record = PublicEmploymentCallSourceRecordSchema.parse(candidate);
    return {
      id: String(record.identificador),
      title: record.titulo.trim(),
      organization: plainText(record.organismo_gestor),
      places:
        record.numeroplazas != null &&
        Number.isInteger(record.numeroplazas) &&
        record.numeroplazas > 0
          ? record.numeroplazas
          : null,
      municipality: plainText(record.municipio),
      applicationStart: dateOnly(record.fecha_de_inicio),
      applicationDeadline: dateOnly(record.fechafinalizacion),
      requirements: plainText(record.requisitos_necesarios),
      deadlineCopy: plainText(record.plazo_de_presentacion),
      accessType: accessType(record.clasificador),
      applicationUrl: plainText(record.urlenlaceaplicacion),
      officialUrl: record.enlace_al_contenido,
      sourceUpdatedAt: dateOnly(record.actualizacionmetadatos),
    };
  });
  calls.sort(
    (left, right) =>
      (right.applicationDeadline ?? "").localeCompare(
        left.applicationDeadline ?? "",
      ) || left.title.localeCompare(right.title, "es"),
  );
  return PublicEmploymentCallsResourceSchema.parse(calls);
}
