import {
  EducationCenterSchema,
  JobOfferSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type EducationCenter,
  type JobOffer,
  type TrainingOffering,
  type TrainingProgram,
} from "../../data/schemas/generated";

export interface SnapshotCounts {
  programs: number;
  centers: number;
  offerings: number;
  offers: number;
}

export interface SnapshotCandidate {
  programs: TrainingProgram[];
  centers: EducationCenter[];
  offerings: TrainingOffering[];
  offers: JobOffer[];
}

export interface QualityReport {
  counts: SnapshotCounts;
  nullRates: {
    offerProvince: number;
    offerLocality: number;
    offerDescription: number;
  };
}

type CandidateInput = SnapshotCandidate | SnapshotCounts;

function isCandidate(value: CandidateInput): value is SnapshotCandidate {
  return Array.isArray((value as SnapshotCandidate).programs);
}

function countRecords(candidate: CandidateInput): SnapshotCounts {
  return isCandidate(candidate)
    ? {
        programs: candidate.programs.length,
        centers: candidate.centers.length,
        offerings: candidate.offerings.length,
        offers: candidate.offers.length,
      }
    : candidate;
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate ${label} identifiers`);
  }
}

function validateCandidate(candidate: SnapshotCandidate): void {
  const programs = candidate.programs.map((item) =>
    TrainingProgramSchema.parse(item),
  );
  const centers = candidate.centers.map((item) =>
    EducationCenterSchema.parse(item),
  );
  const offerings = candidate.offerings.map((item) =>
    TrainingOfferingSchema.parse(item),
  );
  const offers = candidate.offers.map((item) => JobOfferSchema.parse(item));

  assertUnique(
    programs.map((item) => item.programKey),
    "program",
  );
  assertUnique(
    centers.map((item) => item.centerCode),
    "center",
  );
  assertUnique(
    offers.map((item) => item.id),
    "offer",
  );

  const programKeys = new Set(programs.map((item) => item.programKey));
  const centerCodes = new Set(centers.map((item) => item.centerCode));
  for (const offering of offerings) {
    if (!programKeys.has(offering.programKey)) {
      throw new Error(
        `Offering references missing program ${offering.programKey}`,
      );
    }
    if (!centerCodes.has(offering.centerCode)) {
      throw new Error(
        `Offering references missing center ${offering.centerCode}`,
      );
    }
  }
}

function assertNoUnexpectedLoss(
  current: SnapshotCounts,
  previous: SnapshotCounts | undefined,
): void {
  if (!previous) return;

  for (const key of Object.keys(current) as (keyof SnapshotCounts)[]) {
    const previousCount = previous[key];
    const currentCount = current[key];
    if (previousCount > 0 && currentCount < previousCount * 0.75) {
      throw new Error(
        `Unexpected record loss in ${key}: ${currentCount} from ${previousCount}`,
      );
    }
  }
}

export function runQualityGates(
  candidate: CandidateInput,
  previous?: SnapshotCounts | SnapshotCandidate,
): QualityReport {
  if (isCandidate(candidate)) {
    validateCandidate(candidate);
  }

  const counts = countRecords(candidate);
  assertNoUnexpectedLoss(counts, previous ? countRecords(previous) : undefined);

  if (!isCandidate(candidate)) {
    return {
      counts,
      nullRates: {
        offerProvince: 0,
        offerLocality: 0,
        offerDescription: 0,
      },
    };
  }

  const totalOffers = candidate.offers.length || 1;
  return {
    counts,
    nullRates: {
      offerProvince:
        candidate.offers.filter((offer) => offer.province === null).length /
        totalOffers,
      offerLocality:
        candidate.offers.filter((offer) => offer.locality === null).length /
        totalOffers,
      offerDescription:
        candidate.offers.filter(
          (offer) => offer.descriptionText.trim().length === 0,
        ).length / totalOffers,
    },
  };
}
