import {
  EducationCenterDirectoryResourceSchema,
  EducationCenterDirectorySourceRecordSchema,
  type EducationCenterDirectoryRecord,
  type EducationCenterDirectorySourceRecord,
} from "../../data/schemas/educationCenterDirectory";

function optionalText(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized === "" ? null : normalized;
}

export function normalizeEducationCenterDirectory(
  input: readonly EducationCenterDirectorySourceRecord[],
): EducationCenterDirectoryRecord[] {
  const records = input.map((candidate) => {
    const source = EducationCenterDirectorySourceRecordSchema.parse(candidate);
    return {
      academicYear: source.curso_academico,
      centerCode: source.codigo,
      ownership: source.naturaleza === "PÚBLICO" ? "public" : "private",
      centerType: source.denominacion_generica.trim(),
      centerName: source.denominacion_especifica.trim(),
      province: source.provincia.trim(),
      municipality: source.municipio.trim(),
      locality: source.localidad.trim(),
      postalCode:
        source.c_postal === null
          ? null
          : String(source.c_postal).padStart(5, "0"),
      email: optionalText(source.correo_electronico),
      website: optionalText(source.web),
      latitude: source.coord_latitud,
      longitude: source.coord_longitud,
      hasBoarding: source.internado === "S",
      hasCanteen: source.comedor === "S",
      hasTransport: source.transporte === "S",
    } as const;
  });
  records.sort((left, right) =>
    left.centerCode.localeCompare(right.centerCode),
  );
  return EducationCenterDirectoryResourceSchema.parse(records);
}
