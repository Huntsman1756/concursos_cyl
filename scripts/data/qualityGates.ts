import type {
  EducationCenter,
  JobOffer,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";

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

/** Validates cross-resource integrity, monitored nulls, and count regressions. */
export function runQualityGates(
  candidate: QualityGateInput,
  previous?: QualityGateInput,
): QualityReport {
  const counts = countsFor(candidate);
  assertNoUnexpectedLoss(counts, previous && countsFor(previous));

  return {
    counts,
    nullRates: isCandidate(candidate)
      ? validateCandidate(candidate)
      : emptyNullRates,
  };
}
