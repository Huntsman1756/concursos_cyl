import type {
  EducationCenter,
  JobOffer,
  ReconciliationAnomaly,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";
import { ReconciliationAnomalySchema } from "../../data/schemas/generated";
import { trainingOfferingIdentity } from "../../data/schemas/trainingOfferingIdentity";

export interface SnapshotCounts {
  programs: number;
  centers: number;
  offerings: number;
  offers: number;
}

export interface SnapshotCandidate {
  programs: readonly TrainingProgram[];
  centers: readonly EducationCenter[];
  trainingOfferings: readonly TrainingOffering[];
  jobOffers: readonly JobOffer[];
}

export interface LegacySnapshotCandidate {
  programs: readonly TrainingProgram[];
  centers: readonly Omit<EducationCenter, "centerOwnership">[];
  trainingOfferings: readonly Omit<
    TrainingOffering,
    "offeringId" | "centerName" | "teachingType" | "centerOwnership"
  >[];
  jobOffers: readonly Omit<JobOffer, "sourceRecordUpdatedAt">[];
}

export interface QualityNullRates {
  centerAddress: number;
  centerPhone: number;
  centerEmail: number;
  centerWebsite: number;
  offerProvince: number;
  offerLocality: number;
  offerDescription: number;
}

export interface QualityReport {
  counts: SnapshotCounts;
  nullRates: QualityNullRates;
  reconciliationAnomalies: ReconciliationAnomaly[];
}

type QualityGateInput = SnapshotCandidate | SnapshotCounts;

function isCandidate(input: QualityGateInput): input is SnapshotCandidate {
  return Array.isArray(input.programs);
}

function countsFor(input: QualityGateInput): SnapshotCounts {
  if (!isCandidate(input)) {
    return input;
  }

  return {
    programs: input.programs.length,
    centers: input.centers.length,
    offerings: input.trainingOfferings.length,
    offers: input.jobOffers.length,
  };
}

function assertNoUnexpectedLoss(
  candidate: SnapshotCounts,
  previous: SnapshotCounts | undefined,
): void {
  if (previous === undefined) {
    return;
  }

  for (const family of Object.keys(candidate) as (keyof SnapshotCounts)[]) {
    const previousCount = previous[family];
    if (previousCount > 0 && candidate[family] < previousCount * 0.75) {
      throw new Error(
        `Unexpected record loss in ${family}: ${candidate[family]} replaced ${previousCount}.`,
      );
    }
  }
}

function assertUnique<T>(
  records: readonly T[],
  identifier: (record: T) => string,
  family: string,
): void {
  const seen = new Set<string>();

  for (const record of records) {
    const id = identifier(record);
    if (seen.has(id)) {
      throw new Error(`Duplicate ${family} identifier: ${id}.`);
    }
    seen.add(id);
  }
}

function assertLabel(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Blank label in ${field}.`);
  }
}

function assertUrl(value: string, field: string): void {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(`Invalid URL in ${field}: ${value}.`);
  }
}

function nullRate<T>(
  records: readonly T[],
  isNull: (record: T) => boolean,
): number {
  if (records.length === 0) {
    return 0;
  }
  return records.filter(isNull).length / records.length;
}

function validateCandidate(candidate: SnapshotCandidate): QualityNullRates {
  assertUnique(candidate.programs, (item) => item.programKey, "program");
  assertUnique(candidate.centers, (item) => item.centerCode, "center");
  assertUnique(
    candidate.trainingOfferings,
    (item) => item.offeringId,
    "training offering",
  );
  assertUnique(candidate.jobOffers, (item) => item.id, "job offer");

  const programKeys = new Set(
    candidate.programs.map((item) => item.programKey),
  );
  const centerCodes = new Set(candidate.centers.map((item) => item.centerCode));
  const programsByKey = new Map(
    candidate.programs.map((item) => [item.programKey, item]),
  );
  const centersByCode = new Map(
    candidate.centers.map((item) => [item.centerCode, item]),
  );

  for (const item of candidate.programs) {
    assertLabel(item.programKey, "program.programKey");
    assertLabel(item.programTitle, "program.programTitle");
    assertLabel(item.familyCode, "program.familyCode");
    assertLabel(item.familyName, "program.familyName");
  }

  for (const item of candidate.centers) {
    assertLabel(item.centerCode, "center.centerCode");
    assertLabel(item.centerName, "center.centerName");
    assertLabel(item.province, "center.province");
    assertLabel(item.locality, "center.locality");
    assertLabel(item.centerOwnership, "center.centerOwnership");
    if (item.website !== null) {
      assertUrl(item.website, "center.website");
    }
  }

  for (const item of candidate.trainingOfferings) {
    if (!programKeys.has(item.programKey)) {
      throw new Error(
        `Broken reference from training offering to program ${item.programKey}.`,
      );
    }
    if (!centerCodes.has(item.centerCode)) {
      throw new Error(
        `Broken reference from training offering to center ${item.centerCode}.`,
      );
    }
    assertLabel(item.programTitle, "trainingOffering.programTitle");
    assertLabel(item.familyCode, "trainingOffering.familyCode");
    assertLabel(item.familyName, "trainingOffering.familyName");
    assertLabel(item.centerName, "trainingOffering.centerName");
    assertLabel(item.province, "trainingOffering.province");
    assertLabel(item.locality, "trainingOffering.locality");
    const program = programsByKey.get(item.programKey)!;
    const center = centersByCode.get(item.centerCode)!;
    for (const field of [
      "programTitle",
      "level",
      "familyCode",
      "familyName",
    ] as const) {
      if (item[field] !== program[field]) {
        throw new Error(
          `Canonical program mismatch in training offering ${item.offeringId}: ${field}.`,
        );
      }
    }
    for (const field of [
      "centerName",
      "province",
      "locality",
      "centerOwnership",
    ] as const) {
      if (item[field] !== center[field]) {
        throw new Error(
          `Canonical center mismatch in training offering ${item.offeringId}: ${field}.`,
        );
      }
    }
    if (item.offeringId !== trainingOfferingIdentity(item)) {
      throw new Error(
        `Training offering identity does not encode every differentiator: ${item.offeringId}.`,
      );
    }
  }

  for (const item of candidate.jobOffers) {
    assertLabel(item.id, "jobOffer.id");
    assertLabel(item.title, "jobOffer.title");
    assertLabel(item.sourceName, "jobOffer.sourceName");
    assertUrl(item.originalUrl, "jobOffer.originalUrl");
    assertUrl(
      item.sourceSnapshot.sourceUrl,
      "jobOffer.sourceSnapshot.sourceUrl",
    );
  }

  return {
    centerAddress: nullRate(candidate.centers, (item) => item.address === null),
    centerPhone: nullRate(candidate.centers, (item) => item.phone === null),
    centerEmail: nullRate(candidate.centers, (item) => item.email === null),
    centerWebsite: nullRate(candidate.centers, (item) => item.website === null),
    offerProvince: nullRate(
      candidate.jobOffers,
      (item) => item.province === null,
    ),
    offerLocality: nullRate(
      candidate.jobOffers,
      (item) => item.locality === null,
    ),
    offerDescription: nullRate(
      candidate.jobOffers,
      (item) => item.descriptionText.trim().length === 0,
    ),
  };
}

function validateLegacyCandidate(
  candidate: LegacySnapshotCandidate,
): QualityNullRates {
  assertUnique(candidate.programs, (item) => item.programKey, "program");
  assertUnique(candidate.centers, (item) => item.centerCode, "center");
  assertUnique(
    candidate.trainingOfferings,
    (item) => `${item.programKey}:${item.centerCode}:${item.modality}`,
    "training offering",
  );
  assertUnique(candidate.jobOffers, (item) => item.id, "job offer");

  const programKeys = new Set(
    candidate.programs.map((item) => item.programKey),
  );
  const centerCodes = new Set(candidate.centers.map((item) => item.centerCode));
  for (const item of candidate.programs) {
    assertLabel(item.programKey, "program.programKey");
    assertLabel(item.programTitle, "program.programTitle");
    assertLabel(item.familyCode, "program.familyCode");
    assertLabel(item.familyName, "program.familyName");
  }
  for (const item of candidate.centers) {
    assertLabel(item.centerCode, "center.centerCode");
    assertLabel(item.centerName, "center.centerName");
    assertLabel(item.province, "center.province");
    assertLabel(item.locality, "center.locality");
    if (item.website !== null) {
      assertUrl(item.website, "center.website");
    }
  }
  for (const item of candidate.trainingOfferings) {
    if (!programKeys.has(item.programKey)) {
      throw new Error(
        `Broken reference from training offering to program ${item.programKey}.`,
      );
    }
    if (!centerCodes.has(item.centerCode)) {
      throw new Error(
        `Broken reference from training offering to center ${item.centerCode}.`,
      );
    }
    assertLabel(item.programTitle, "trainingOffering.programTitle");
    assertLabel(item.familyName, "trainingOffering.familyName");
    assertLabel(item.province, "trainingOffering.province");
    assertLabel(item.locality, "trainingOffering.locality");
  }
  for (const item of candidate.jobOffers) {
    assertLabel(item.id, "jobOffer.id");
    assertLabel(item.title, "jobOffer.title");
    assertLabel(item.sourceName, "jobOffer.sourceName");
    assertUrl(item.originalUrl, "jobOffer.originalUrl");
    assertUrl(
      item.sourceSnapshot.sourceUrl,
      "jobOffer.sourceSnapshot.sourceUrl",
    );
  }

  return {
    centerAddress: nullRate(candidate.centers, (item) => item.address === null),
    centerPhone: nullRate(candidate.centers, (item) => item.phone === null),
    centerEmail: nullRate(candidate.centers, (item) => item.email === null),
    centerWebsite: nullRate(candidate.centers, (item) => item.website === null),
    offerProvince: nullRate(
      candidate.jobOffers,
      (item) => item.province === null,
    ),
    offerLocality: nullRate(
      candidate.jobOffers,
      (item) => item.locality === null,
    ),
    offerDescription: nullRate(
      candidate.jobOffers,
      (item) => item.descriptionText.trim().length === 0,
    ),
  };
}

const emptyNullRates: QualityNullRates = {
  centerAddress: 0,
  centerPhone: 0,
  centerEmail: 0,
  centerWebsite: 0,
  offerProvince: 0,
  offerLocality: 0,
  offerDescription: 0,
};

function compareNullableText(
  left: string | null,
  right: string | null,
): number {
  if (left === null) return 1;
  if (right === null) return -1;
  return left.localeCompare(right);
}

function normalizedAnomalies(
  anomalies: readonly ReconciliationAnomaly[],
): ReconciliationAnomaly[] {
  return anomalies
    .map((anomaly) => {
      const parsed = ReconciliationAnomalySchema.parse(anomaly);
      const candidates = [...parsed.candidates].sort(
        (left, right) =>
          right.count - left.count ||
          compareNullableText(left.value, right.value),
      );
      if (candidates[0]?.value !== parsed.selectedValue) {
        throw new Error(
          `Reconciliation anomaly selection lacks majority evidence: ${parsed.entityType}.${parsed.entityId}.${parsed.field}.`,
        );
      }
      return { ...parsed, candidates };
    })
    .sort(
      (left, right) =>
        left.entityType.localeCompare(right.entityType) ||
        left.entityId.localeCompare(right.entityId) ||
        left.field.localeCompare(right.field),
    );
}

/** Validates cross-resource integrity, monitored nulls, and count regressions. */
export function runQualityGates(
  candidate: QualityGateInput,
  previous?: QualityGateInput,
  reconciliationAnomalies: readonly ReconciliationAnomaly[] = [],
): QualityReport {
  const counts = countsFor(candidate);
  assertNoUnexpectedLoss(counts, previous && countsFor(previous));

  return {
    counts,
    nullRates: isCandidate(candidate)
      ? validateCandidate(candidate)
      : emptyNullRates,
    reconciliationAnomalies: normalizedAnomalies(reconciliationAnomalies),
  };
}

/** Validates only pre-hardening v1 resources while they remain last-known-good. */
export function runLegacyQualityGates(
  candidate: LegacySnapshotCandidate,
): QualityReport {
  return {
    counts: {
      programs: candidate.programs.length,
      centers: candidate.centers.length,
      offerings: candidate.trainingOfferings.length,
      offers: candidate.jobOffers.length,
    },
    nullRates: validateLegacyCandidate(candidate),
    reconciliationAnomalies: [],
  };
}
