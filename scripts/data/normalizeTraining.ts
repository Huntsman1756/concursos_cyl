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
    const level = mapLevel(record.nivel);
    const modality = mapModality(record.modalidad);

    const program = TrainingProgramSchema.parse({
      programKey,
      programTitle: record.nombre_ciclo.trim(),
      level,
      familyCode: record.familia_profesional_codigo.trim(),
      familyName: record.familia_profesional_nombre.trim(),
    });
    programs.set(programKey, programs.get(programKey) ?? program);

    const center = EducationCenterSchema.parse({
      centerCode,
      centerName: record.nombre_centro.trim(),
      province: record.provincia.trim(),
      locality: record.localidad.trim(),
      address: null,
      phone: null,
      email: null,
      website: null,
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
