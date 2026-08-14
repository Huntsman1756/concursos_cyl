import {
  EducationCenterSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type EducationCenter,
  type Modality,
  type TrainingLevel,
  type TrainingOffering,
  type TrainingProgram,
} from "../../data/schemas/generated";
import {
  type TrainingSourceRecord,
  TrainingSourceRecordSchema,
} from "../../data/schemas/trainingSource";

export interface NormalizedTraining {
  programs: TrainingProgram[];
  centers: EducationCenter[];
  offerings: TrainingOffering[];
}

const levelMap: Record<string, TrainingLevel> = {
  basico: "basic",
  "grado basico": "basic",
  "formacion profesional basica": "basic",
  medio: "intermediate",
  "grado medio": "intermediate",
  superior: "higher",
  "grado superior": "higher",
  especializacion: "specialization",
  "curso especializacion": "specialization",
  "curso de especializacion": "specialization",
};

const modalityMap: Record<string, Modality> = {
  presencial: "on_site",
  "a distancia": "distance",
  distancia: "distance",
  mixta: "mixed",
  mixto: "mixed",
};

const spanishCollator = new Intl.Collator("es", { sensitivity: "base" });

function normalizedKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mapLevel(value: string): TrainingLevel {
  const level = levelMap[normalizedKey(value)];
  if (!level) {
    throw new Error(`Unsupported training level: ${value}`);
  }
  return level;
}

function mapModality(value: string): Modality {
  return modalityMap[normalizedKey(value)] ?? "unknown";
}

function validEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

function validWebsite(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  try {
    const url = new URL(normalized);
    return /^https?:$/i.test(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function sortByLabel<T>(
  items: T[],
  label: (item: T) => string,
  id: (item: T) => string,
) {
  return items.sort((left, right) => {
    const labelOrder = spanishCollator.compare(label(left), label(right));
    return labelOrder || id(left).localeCompare(id(right));
  });
}

export function normalizeTraining(
  records: TrainingSourceRecord[],
): NormalizedTraining {
  const programs = new Map<string, TrainingProgram>();
  const centers = new Map<string, EducationCenter>();
  const offerings = new Map<string, TrainingOffering>();

  for (const rawRecord of records) {
    const record = TrainingSourceRecordSchema.parse(rawRecord);
    const programKey = record.clave_ciclo.trim();
    const centerCode = record.codigo_centro.trim();
    const level = mapLevel(record.nivel_educativo);
    const modality = mapModality(record.modalidad);

    const program = TrainingProgramSchema.parse({
      programKey,
      programTitle: record.ciclo_formativo_curso_de_especializacion.trim(),
      level,
      familyCode: record.codigo_familia.trim(),
      familyName: record.familia_profesional.trim(),
    });
    programs.set(programKey, programs.get(programKey) ?? program);

    const center = EducationCenterSchema.parse({
      centerCode,
      centerName: record.centro_educativo.trim(),
      province: record.provincia.trim(),
      locality: record.localidad.trim(),
      address: record.direccion_centro?.trim() || null,
      phone: record.telefono?.trim() || null,
      email: validEmail(record.e_mail),
      website: validWebsite(record.web),
    });
    centers.set(centerCode, centers.get(centerCode) ?? center);

    const offering = TrainingOfferingSchema.parse({
      ...program,
      centerCode,
      province: record.provincia.trim(),
      locality: record.localidad.trim(),
      modality,
    });
    const offeringKey = `${programKey}:${centerCode}:${modality}`;
    offerings.set(offeringKey, offerings.get(offeringKey) ?? offering);
  }

  return {
    programs: sortByLabel(
      [...programs.values()],
      (item) => item.programTitle,
      (item) => item.programKey,
    ),
    centers: sortByLabel(
      [...centers.values()],
      (item) => item.centerName,
      (item) => item.centerCode,
    ),
    offerings: sortByLabel(
      [...offerings.values()],
      (item) => item.programTitle,
      (item) => `${item.programKey}:${item.centerCode}:${item.modality}`,
    ),
  };
}
