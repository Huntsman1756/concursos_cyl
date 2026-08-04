import {
  EducationCenterSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type CenterOwnership,
  type EducationCenter,
  type Modality,
  type ReconciliationAnomaly,
  type TeachingType,
  type TrainingLevel,
  type TrainingOffering,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { trainingOfferingIdentity } from "../../data/schemas/trainingOfferingIdentity";
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

const TEACHING_TYPE_BY_OFFICIAL_LABEL: Record<string, TeachingType> = {
  publica: "public",
  concertada: "concerted",
  privada: "private",
};

const CENTER_OWNERSHIP_BY_OFFICIAL_LABEL: Record<string, CenterOwnership> = {
  agricultura: "agriculture",
  ayuntamiento: "municipality",
  educacion: "education",
  privada: "private",
};

export interface TrainingNormalizationResult {
  programs: TrainingProgram[];
  centers: EducationCenter[];
  offerings: TrainingOffering[];
  reconciliationAnomalies: ReconciliationAnomaly[];
}

interface NormalizedSourceRow {
  programKey: string;
  program: TrainingProgram;
  centerCode: string;
  center: EducationCenter;
  modality: Modality;
  teachingType: TeachingType;
}

function normalizeLookupKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeDisplayText(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim();
}

function requiredText(value: string | null | undefined, field: string): string {
  const normalized = normalizeDisplayText(value ?? "");
  if (normalized.length === 0) {
    throw new Error(`Official ${field} must not be blank.`);
  }
  return normalized;
}

function requiredIdentifier(
  value: string | null | undefined,
  field: string,
): string {
  return requiredText(value, field).toLocaleUpperCase("es-ES");
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = normalizeDisplayText(value ?? "");
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

function normalizeLevel(value: string): TrainingLevel {
  const level = TRAINING_LEVEL_BY_OFFICIAL_LABEL[normalizeLookupKey(value)];
  if (level === undefined) {
    throw new Error(`Unsupported official training level: ${value}.`);
  }
  return level;
}

function normalizeModality(value: string): Modality {
  return MODALITY_BY_OFFICIAL_LABEL[normalizeLookupKey(value)] ?? "unknown";
}

function normalizeTeachingType(value: string): TeachingType {
  const teachingType =
    TEACHING_TYPE_BY_OFFICIAL_LABEL[normalizeLookupKey(value)];
  if (teachingType === undefined) {
    throw new Error(`Unsupported official teaching type: ${value}.`);
  }
  return teachingType;
}

function normalizeCenterOwnership(value: string): CenterOwnership {
  const ownership =
    CENTER_OWNERSHIP_BY_OFFICIAL_LABEL[normalizeLookupKey(value)];
  if (ownership === undefined) {
    throw new Error(`Unsupported official center ownership: ${value}.`);
  }
  return ownership;
}

function compareStableValues(
  left: string | null,
  right: string | null,
): number {
  if (left === null) return 1;
  if (right === null) return -1;
  return (
    spanishCollator.compare(left, right) || left.localeCompare(right, "es")
  );
}

function materialValueKey(
  value: string | null,
  field: ReconciliationAnomaly["field"],
): string {
  if (value === null) return "\u0000";
  const normalized = normalizeDisplayText(value).toLocaleLowerCase("es-ES");
  return field === "phone" ? normalized.replace(/\s/gu, "") : normalized;
}

function reconcileValue(
  values: readonly (string | null)[],
  entityType: ReconciliationAnomaly["entityType"],
  entityId: string,
  field: ReconciliationAnomaly["field"],
  anomalies: ReconciliationAnomaly[],
): string | null {
  const materialGroups = new Map<
    string,
    { count: number; representatives: Map<string | null, number> }
  >();

  for (const rawValue of values) {
    const value = rawValue === null ? null : normalizeDisplayText(rawValue);
    const key = materialValueKey(value, field);
    const group = materialGroups.get(key) ?? {
      count: 0,
      representatives: new Map<string | null, number>(),
    };
    group.count += 1;
    group.representatives.set(
      value,
      (group.representatives.get(value) ?? 0) + 1,
    );
    materialGroups.set(key, group);
  }

  const rankedGroups = [...materialGroups.values()]
    .map((group) => {
      const representative = [...group.representatives.entries()].sort(
        ([leftValue, leftCount], [rightValue, rightCount]) =>
          rightCount - leftCount || compareStableValues(leftValue, rightValue),
      )[0]?.[0];
      if (representative === undefined) {
        throw new Error(
          `No canonical value candidates for ${entityId}.${field}.`,
        );
      }
      return { value: representative, count: group.count };
    })
    .sort(
      (left, right) =>
        right.count - left.count ||
        compareStableValues(left.value, right.value),
    );

  const selected = rankedGroups[0];
  if (selected === undefined) {
    throw new Error(`No canonical value candidates for ${entityId}.${field}.`);
  }
  if (rankedGroups.length > 1) {
    anomalies.push({
      entityType,
      entityId,
      field,
      selectedValue: selected.value,
      candidates: rankedGroups,
    });
  }
  return selected.value;
}

function normalizeRecord(record: TrainingSourceRecord): NormalizedSourceRow {
  const programKey = requiredIdentifier(record.clave_ciclo, "clave_ciclo");
  const centerCode = requiredIdentifier(record.codigo_centro, "codigo_centro");
  const program = TrainingProgramSchema.parse({
    programKey,
    programTitle: requiredText(
      record.ciclo_formativo_curso_de_especializacion,
      "ciclo_formativo_curso_de_especializacion",
    ),
    level: normalizeLevel(record.nivel_educativo),
    familyCode: requiredIdentifier(record.codigo_familia, "codigo_familia"),
    familyName: requiredText(record.familia_profesional, "familia_profesional"),
  });
  const center = EducationCenterSchema.parse({
    centerCode,
    centerName: requiredText(record.centro_educativo, "centro_educativo"),
    province: requiredText(record.provincia, "provincia"),
    locality: requiredText(record.localidad, "localidad"),
    address: optionalText(record.direccion_centro),
    phone: optionalText(record.telefono),
    email: optionalText(record.e_mail),
    website: optionalUrl(record.web),
    centerOwnership: normalizeCenterOwnership(record.titularidad_centro),
  });

  return {
    programKey,
    program,
    centerCode,
    center,
    modality: normalizeModality(record.modalidad),
    teachingType: normalizeTeachingType(record.tipo_ensenanza),
  };
}

function canonicalProgram(
  programKey: string,
  rows: readonly NormalizedSourceRow[],
  anomalies: ReconciliationAnomaly[],
): TrainingProgram {
  const required = (field: ReconciliationAnomaly["field"]): string => {
    const value = reconcileValue(
      rows.map((row) => String(row.program[field as keyof TrainingProgram])),
      "program",
      programKey,
      field,
      anomalies,
    );
    if (value === null) throw new Error(`Canonical ${field} must not be null.`);
    return value;
  };

  return TrainingProgramSchema.parse({
    programKey,
    programTitle: required("programTitle"),
    level: required("level"),
    familyCode: required("familyCode"),
    familyName: required("familyName"),
  });
}

function canonicalCenter(
  centerCode: string,
  rows: readonly NormalizedSourceRow[],
  anomalies: ReconciliationAnomaly[],
): EducationCenter {
  const value = (
    field: Exclude<
      ReconciliationAnomaly["field"],
      "programTitle" | "level" | "familyCode" | "familyName"
    >,
  ): string | null =>
    reconcileValue(
      rows.map((row) => row.center[field]),
      "center",
      centerCode,
      field,
      anomalies,
    );
  const required = (
    field: "centerName" | "province" | "locality" | "centerOwnership",
  ): string => {
    const selected = value(field);
    if (selected === null) {
      throw new Error(`Canonical ${field} must not be null.`);
    }
    return selected;
  };

  return EducationCenterSchema.parse({
    centerCode,
    centerName: required("centerName"),
    province: required("province"),
    locality: required("locality"),
    address: value("address"),
    phone: value("phone"),
    email: value("email"),
    website: value("website"),
    centerOwnership: required("centerOwnership"),
  });
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

/**
 * Reconciles official vocational-training metadata and emits one stable public
 * offering for every distinct evidence-backed source identity.
 */
export function normalizeTraining(
  records: readonly TrainingSourceRecord[],
): TrainingNormalizationResult {
  const rows = records.map(normalizeRecord);
  const anomalies: ReconciliationAnomaly[] = [];
  const rowsByProgram = new Map<string, NormalizedSourceRow[]>();
  const rowsByCenter = new Map<string, NormalizedSourceRow[]>();

  for (const row of rows) {
    rowsByProgram.set(row.programKey, [
      ...(rowsByProgram.get(row.programKey) ?? []),
      row,
    ]);
    rowsByCenter.set(row.centerCode, [
      ...(rowsByCenter.get(row.centerCode) ?? []),
      row,
    ]);
  }

  const programByKey = new Map(
    [...rowsByProgram.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, groupedRows]) => [
        key,
        canonicalProgram(key, groupedRows, anomalies),
      ]),
  );
  const centerByCode = new Map(
    [...rowsByCenter.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([code, groupedRows]) => [
        code,
        canonicalCenter(code, groupedRows, anomalies),
      ]),
  );
  const offeringById = new Map<string, TrainingOffering>();

  for (const row of rows) {
    const program = programByKey.get(row.programKey);
    const center = centerByCode.get(row.centerCode);
    if (program === undefined || center === undefined) {
      throw new Error("Canonical training reference is missing.");
    }
    const identityParts = {
      programKey: program.programKey,
      centerCode: center.centerCode,
      modality: row.modality,
      teachingType: row.teachingType,
      centerOwnership: center.centerOwnership,
    };
    const offering = TrainingOfferingSchema.parse({
      offeringId: trainingOfferingIdentity(identityParts),
      ...program,
      centerCode: center.centerCode,
      centerName: center.centerName,
      province: center.province,
      locality: center.locality,
      modality: row.modality,
      teachingType: row.teachingType,
      centerOwnership: center.centerOwnership,
    });
    offeringById.set(offering.offeringId, offering);
  }

  return {
    programs: [...programByKey.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        { label: left.programTitle, identifier: left.programKey },
        { label: right.programTitle, identifier: right.programKey },
      ),
    ),
    centers: [...centerByCode.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        { label: left.centerName, identifier: left.centerCode },
        { label: right.centerName, identifier: right.centerCode },
      ),
    ),
    offerings: [...offeringById.values()].sort((left, right) =>
      compareByLabelAndIdentifier(
        { label: left.programTitle, identifier: left.offeringId },
        { label: right.programTitle, identifier: right.offeringId },
      ),
    ),
    reconciliationAnomalies: anomalies.sort(
      (left, right) =>
        left.entityType.localeCompare(right.entityType) ||
        left.entityId.localeCompare(right.entityId) ||
        left.field.localeCompare(right.field),
    ),
  };
}
