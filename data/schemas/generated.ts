import { z } from "zod";

import {
  isImmutableGeneratedResourcePath,
  legacyGeneratedResourcePath,
} from "./generatedResourceCatalog";

export const TrainingLevelSchema = z.enum([
  "basic",
  "intermediate",
  "higher",
  "specialization",
]);

export const ModalitySchema = z.enum([
  "on_site",
  "distance",
  "mixed",
  "unknown",
]);

export const SourceSnapshotSchema = z.object({
  sourceId: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceUpdatedAt: z.string().datetime().nullable(),
  snapshotFetchedAt: z.string().datetime(),
  schemaVersion: z.literal("1.0.0"),
  recordCount: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  qualityStatus: z.enum(["passed", "stale"]),
});

export const TrainingProgramSchema = z.object({
  programKey: z.string().min(1),
  programTitle: z.string().min(1),
  level: TrainingLevelSchema,
  familyCode: z.string().min(1),
  familyName: z.string().min(1),
});

export const TrainingOfferingSchema = TrainingProgramSchema.extend({
  centerCode: z.string().min(1),
  province: z.string().min(1),
  locality: z.string().min(1),
  modality: ModalitySchema,
});

export const EducationCenterSchema = z.object({
  centerCode: z.string().min(1),
  centerName: z.string().min(1),
  province: z.string().min(1),
  locality: z.string().min(1),
  address: z.string().min(1).nullable(),
  phone: z.string().min(1).nullable(),
  email: z.string().email().nullable(),
  website: z.string().url().nullable(),
});

const DescriptionSectionContentSchema = z.array(z.string().min(1));

export const DescriptionSectionsSchema = z
  .object({
    summary: DescriptionSectionContentSchema,
    functions: DescriptionSectionContentSchema,
    requirements: DescriptionSectionContentSchema,
    conditions: DescriptionSectionContentSchema,
    application: DescriptionSectionContentSchema,
    other: DescriptionSectionContentSchema,
  })
  .strict();

export const JobOfferSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    province: z.string().min(1).nullable(),
    locality: z.string().min(1).nullable(),
    publishedAt: z.string().datetime(),
    sourceName: z.string().min(1),
    descriptionText: z.string(),
    descriptionSections: DescriptionSectionsSchema,
    originalUrl: z.string().url(),
    sourceSnapshot: SourceSnapshotSchema,
  })
  .strict();

export const GeneratedResourceSnapshotsSchema = z
  .object({
    programs: SourceSnapshotSchema.extend({
      resourcePath: z
        .string()
        .refine((path) => isImmutableGeneratedResourcePath("programs", path)),
    }),
    centers: SourceSnapshotSchema.extend({
      resourcePath: z
        .string()
        .refine((path) => isImmutableGeneratedResourcePath("centers", path)),
    }),
    trainingOfferings: SourceSnapshotSchema.extend({
      resourcePath: z
        .string()
        .refine((path) =>
          isImmutableGeneratedResourcePath("trainingOfferings", path),
        ),
    }),
    jobOffers: SourceSnapshotSchema.extend({
      resourcePath: z
        .string()
        .refine((path) => isImmutableGeneratedResourcePath("jobOffers", path)),
    }),
  })
  .strict();

export const GeneratedQualityReportSchema = z.object({
  counts: z.object({
    programs: z.number().int().nonnegative(),
    centers: z.number().int().nonnegative(),
    offerings: z.number().int().nonnegative(),
    offers: z.number().int().nonnegative(),
  }),
  nullRates: z.object({
    centerAddress: z.number().min(0).max(1),
    centerPhone: z.number().min(0).max(1),
    centerEmail: z.number().min(0).max(1),
    centerWebsite: z.number().min(0).max(1),
    offerProvince: z.number().min(0).max(1),
    offerLocality: z.number().min(0).max(1),
    offerDescription: z.number().min(0).max(1),
  }),
});

export const GeneratedManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    generatedAt: z.string().datetime(),
    qualityStatus: z.enum(["passed", "stale"]),
    resourceSnapshots: GeneratedResourceSnapshotsSchema,
    qualityReport: GeneratedQualityReportSchema,
  })
  .strict();

const StrictLegacySourceSnapshotSchema = SourceSnapshotSchema.strict();

const LegacyGeneratedManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    generatedAt: z.string().datetime(),
    qualityStatus: z.enum(["passed", "stale"]),
    resourceSnapshots: z
      .object({
        programs: StrictLegacySourceSnapshotSchema,
        centers: StrictLegacySourceSnapshotSchema,
        trainingOfferings: StrictLegacySourceSnapshotSchema,
        jobOffers: StrictLegacySourceSnapshotSchema,
      })
      .strict(),
    qualityReport: GeneratedQualityReportSchema.optional(),
  })
  .strict();

export const LoadableGeneratedManifestSchema = z
  .union([GeneratedManifestSchema, LegacyGeneratedManifestSchema])
  .transform((manifest) => {
    if ("resourcePath" in manifest.resourceSnapshots.programs) {
      return GeneratedManifestSchema.parse(manifest);
    }

    return {
      ...manifest,
      resourceSnapshots: {
        programs: {
          ...manifest.resourceSnapshots.programs,
          resourcePath: legacyGeneratedResourcePath("programs"),
        },
        centers: {
          ...manifest.resourceSnapshots.centers,
          resourcePath: legacyGeneratedResourcePath("centers"),
        },
        trainingOfferings: {
          ...manifest.resourceSnapshots.trainingOfferings,
          resourcePath: legacyGeneratedResourcePath("trainingOfferings"),
        },
        jobOffers: {
          ...manifest.resourceSnapshots.jobOffers,
          resourcePath: legacyGeneratedResourcePath("jobOffers"),
        },
      },
    };
  });

export type TrainingLevel = z.infer<typeof TrainingLevelSchema>;
export type Modality = z.infer<typeof ModalitySchema>;
export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type TrainingOffering = z.infer<typeof TrainingOfferingSchema>;
export type EducationCenter = z.infer<typeof EducationCenterSchema>;
export type DescriptionSections = z.infer<typeof DescriptionSectionsSchema>;
export type GeneratedResourceSnapshots = z.infer<
  typeof GeneratedResourceSnapshotsSchema
>;
export type GeneratedQualityReport = z.infer<
  typeof GeneratedQualityReportSchema
>;
export type JobOffer = z.infer<typeof JobOfferSchema>;
export type GeneratedManifest = z.infer<typeof GeneratedManifestSchema>;
export type LoadableGeneratedManifest = z.infer<
  typeof LoadableGeneratedManifestSchema
>;
