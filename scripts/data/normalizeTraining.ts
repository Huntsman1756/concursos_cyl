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
import type { TrainingSourceRecord } from "../../data/schemas/trainingSource";

const spanishCollator = new Intl.Collator("es");

const TRAINING_LEVEL_BY_OFFICIAL_LABEL: Record<string, TrainingLevel> = {
  "formacion profesional basica": "basic",
  "grado basico": "basic",
  "grado medio": "intermediate",
  "grado superior": "higher",
  "curso de especializacion": "specialization",
  "curso especializacion": "specialization",
  especializacion: "specialization",
};

const MODALITY_BY_OFFICIAL_LABEL: Record<string, Modality> = {
  presencial: "on_site",
  "a distancia": "distance",
  distancia: "distance",
  semipresencial: "mixed",
  mixta: "mixed",
};

interface TrainingNormalizationResult {
  programs: TrainingProgram[];
  centers: EducationCenter[];
  offerings: TrainingOffering[];
}

function normalizeLookupKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/\s+/gu, " ")
    .trim();
}

function requiredText(value: string | null | undefined, field: string): string {
  const normalized = value?.trim() ?? "";

  if (normalized.length === 0) {
    throw new Error(`Official ${field} must not be blank.`);
  }

  return normalized;
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length === 0 ? null : normalized;
}

function optionalUrl(value: string | null | undefined): string | null {
  const text = optionalText(value);
  if (text === null) {
    return null;
  }

  const candidate = /^www\./iu.test(text) ? `https://${text}` : text;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeLevel(value: string | null): TrainingLevel {
  const level =
    TRAINING_LEVEL_BY_OFFICIAL_LABEL[normalizeLookupKey(value ?? "")];

  if (level === undefined) {
    throw new Error(
      `Unsupported official training level: ${value ?? "(blank)"}.`,
    );
  }

  return level;
}

function normalizeModality(value: string | null): Modality {
  return (
    MODALITY_BY_OFFICIAL_LABEL[normalizeLookupKey(value ?? "")] ?? "unknown"
  );
}

function compareByLabelAndIdentifier(
  left: { label: string; identifier: string },
  right: { label: string; identifier: string },
): number {
  return (
    spanishCollator.compare(left.label, right.label) ||
    left.identifier.localeCompare(right.identifier)
  );
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeRecord(record: TrainingSourceRecord): {
  program: TrainingProgram;
  center: EducationCenter;
  offering: TrainingOffering;
} {
  const programKey = requiredText(record.clave_ciclo, "clave_ciclo");
  const centerCode = requiredText(record.codigo_centro, "codigo_centro");
  const programTitle = requiredText(
    record.ciclo_formativo_curso_de_especializacion,
    "ciclo_formativo_curso_de_especializacion",
  );
  const familyName = requiredText(
    record.familia_profesional,
    "familia_profesional",
  );
  const familyCode = requiredText(record.codigo_familia, "codigo_familia");
  const centerName = requiredText(record.centro_educativo, "centro_educativo");
  const province = requiredText(record.provincia, "provincia");
  const locality = requiredText(record.localidad, "localidad");
  const level = normalizeLevel(record.nivel_educativo);
  const modality = normalizeModality(record.modalidad);

  const program = TrainingProgramSchema.parse({
    programKey,
    programTitle,
    level,
    familyCode,
    familyName,
  });
  const center = EducationCenterSchema.parse({
    centerCode,
    centerName,
    province,
    locality,
    address: optionalText(record.direccion_centro),
    phone: optionalText(record.telefono),
    email: optionalText(record.e_mail),
    website: optionalUrl(record.web),
  });
  const offering = TrainingOfferingSchema.parse({
    ...program,
    centerCode,
    province,
    locality,
    modality,
  });

  return { program, center, offering };
}

/**
 * Converts validated official vocational-training records into the public,
 * deterministic catalog contracts.
 */
export function normalizeTraining(
  records: readonly TrainingSourceRecord[],
): TrainingNormalizationResult {
  const normalized = records.map(normalizeRecord).sort((left, right) => {
    const leftIdentity = `${left.offering.programKey}:${left.offering.centerCode}:${left.offering.modality}`;
    const rightIdentity = `${right.offering.programKey}:${right.offering.centerCode}:${right.offering.modality}`;

    return (
      leftIdentity.localeCompare(rightIdentity) ||
      stableJson(left).localeCompare(stableJson(right))
    );
  });
  const programs = new Map<string, TrainingProgram>();
  const centers = new Map<string, EducationCenter>();
  const offerings = new Map<string, TrainingOffering>();

  for (const entry of normalized) {
    if (!programs.has(entry.program.programKey)) {
      programs.set(entry.program.programKey, entry.program);
    }
    if (!centers.has(entry.center.centerCode)) {
      centers.set(entry.center.centerCode, entry.center);
    }

    const offeringIdentity = `${entry.offering.programKey}:${entry.offering.centerCode}:${entry.offering.modality}`;
    if (!offerings.has(offeringIdentity)) {
      offerings.set(offeringIdentity, entry.offering);
    }
  }

  return {
    programs: [...programs.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        { label: left.programTitle, identifier: left.programKey },
        { label: right.programTitle, identifier: right.programKey },
      ),
    ),
    centers: [...centers.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        { label: left.centerName, identifier: left.centerCode },
        { label: right.centerName, identifier: right.centerCode },
      ),
    ),
    offerings: [...offerings.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        {
          label: left.programTitle,
          identifier: `${left.programKey}:${left.centerCode}:${left.modality}`,
        },
        {
          label: right.programTitle,
          identifier: `${right.programKey}:${right.centerCode}:${right.modality}`,
        },
      ),
    ),
  };
}
