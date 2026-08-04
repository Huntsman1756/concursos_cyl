import {
  JobOfferSchema,
  type JobOffer,
  type SourceSnapshot,
} from "./generated";

/** Internal provenance keeps record metadata distinct from dataset evidence. */
export interface JobOfferProvenance {
  datasetSnapshot: SourceSnapshot;
  recordUpdatedAt: string;
}

/**
 * The published v1 offer shape has no separate record timestamp field. Preserve
 * that contract by serializing the record timestamp into its existing nested
 * sourceUpdatedAt slot while retaining the rest of the dataset snapshot.
 */
export function serializeJobOfferProvenanceForV1({
  datasetSnapshot,
  recordUpdatedAt,
}: JobOfferProvenance): JobOffer["sourceSnapshot"] {
  return JobOfferSchema.shape.sourceSnapshot.parse({
    ...datasetSnapshot,
    sourceUpdatedAt: recordUpdatedAt,
  });
}
