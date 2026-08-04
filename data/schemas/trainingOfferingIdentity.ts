export interface TrainingOfferingIdentityParts {
  programKey: string;
  centerCode: string;
  modality: string;
  teachingType: string;
  centerOwnership: string;
}

/** Builds the stable public identity for one distinct official FP row. */
export function trainingOfferingIdentity(
  offering: TrainingOfferingIdentityParts,
): string {
  return [
    offering.programKey,
    offering.centerCode,
    offering.modality,
    offering.teachingType,
    offering.centerOwnership,
  ].join(":");
}
