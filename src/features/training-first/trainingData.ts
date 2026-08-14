import { z } from "zod";
import {
  GeneratedManifestSchema,
  EducationCentersSchema,
  JobOffersSchema,
  TrainingOfferingsSchema,
  TrainingProgramsSchema,
  type GeneratedManifest,
  type EducationCenter,
  type JobOffer,
  type TrainingProgram,
  type TrainingOffering,
} from "../../../data/schemas/generated";
import {
  OccupationAliasSchema,
  OccupationSchema,
  TrainingOccupationLinkSchema,
  type Occupation,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../../data/schemas/curatedMappings";
import { loadGeneratedResource } from "../../data/generatedDataClient";

const OccupationsSchema = z.array(OccupationSchema);
const OccupationAliasesSchema = z.array(OccupationAliasSchema);
const TrainingOccupationLinksSchema = z.array(TrainingOccupationLinkSchema);

export interface TrainingFeatureData {
  programs: TrainingProgram[];
  centers: EducationCenter[];
  offerings: TrainingOffering[];
  offers: JobOffer[];
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
  manifest: GeneratedManifest;
}

export async function loadTrainingData(): Promise<TrainingFeatureData> {
  const [
    programs,
    centers,
    offerings,
    offers,
    occupations,
    aliases,
    links,
    manifest,
  ] = await Promise.all([
    loadGeneratedResource("/data/v1/programs.json", TrainingProgramsSchema),
    loadGeneratedResource("/data/v1/centers.json", EducationCentersSchema),
    loadGeneratedResource(
      "/data/v1/training-offerings.json",
      TrainingOfferingsSchema,
    ),
    loadGeneratedResource("/data/v1/job-offers.json", JobOffersSchema),
    loadGeneratedResource("/data/v1/occupations.json", OccupationsSchema),
    loadGeneratedResource(
      "/data/v1/occupation-aliases.json",
      OccupationAliasesSchema,
    ),
    loadGeneratedResource(
      "/data/v1/training-occupation-links.json",
      TrainingOccupationLinksSchema,
    ),
    loadGeneratedResource("/data/v1/manifest.json", GeneratedManifestSchema),
  ]);
  return {
    programs,
    centers,
    offerings,
    offers,
    occupations,
    aliases,
    links,
    manifest,
  };
}

export function emptyTrainingFeatureData(): TrainingFeatureData {
  return {
    programs: [],
    centers: [],
    offerings: [],
    offers: [],
    occupations: [],
    aliases: [],
    links: [],
    manifest: {
      schemaVersion: "1.0.0",
      generatedAt: "1970-01-01T00:00:00.000Z",
      qualityStatus: "stale",
      sources: {
        training: {
          sourceId: "empty",
          sourceUrl: "https://example.test/training",
          sourceUpdatedAt: null,
          snapshotFetchedAt: "1970-01-01T00:00:00.000Z",
          schemaVersion: "1.0.0",
          recordCount: 0,
          sha256: "0".repeat(64),
          qualityStatus: "stale",
        },
        offers: {
          sourceId: "empty",
          sourceUrl: "https://example.test/offers",
          sourceUpdatedAt: null,
          snapshotFetchedAt: "1970-01-01T00:00:00.000Z",
          schemaVersion: "1.0.0",
          recordCount: 0,
          sha256: "0".repeat(64),
          qualityStatus: "stale",
        },
      },
      counts: { programs: 0, centers: 0, offerings: 0, offers: 0 },
    },
  };
}
