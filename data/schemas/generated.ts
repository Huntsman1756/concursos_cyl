import { z } from "zod";

export const SchemaVersion = "1.0.0" as const;

const HttpUrlSchema = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), "HTTP(S) URL required");

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

export const TrainingProgramSchema = z.object({
  programKey: z.string().trim().min(1),
  programTitle: z.string().trim().min(1),
  level: TrainingLevelSchema,
  familyCode: z.string().trim().min(1),
  familyName: z.string().trim().min(1),
});

export const EducationCenterSchema = z.object({
  centerCode: z.string().trim().min(1),
  centerName: z.string().trim().min(1),
  province: z.string().trim().min(1),
  locality: z.string().trim().min(1),
  address: z.string().trim().min(1).nullable().default(null),
  phone: z.string().trim().min(1).nullable().default(null),
  email: z.string().email().nullable().default(null),
  website: HttpUrlSchema.nullable().default(null),
});

export const TrainingOfferingSchema = z.object({
  programKey: z.string().trim().min(1),
  programTitle: z.string().trim().min(1),
  level: TrainingLevelSchema,
  familyCode: z.string().trim().min(1),
  familyName: z.string().trim().min(1),
  centerCode: z.string().trim().min(1),
  province: z.string().trim().min(1),
  locality: z.string().trim().min(1),
  modality: ModalitySchema,
});

export const DescriptionSectionsSchema = z.object({
  summary: z.array(z.string().trim().min(1)),
  functions: z.array(z.string().trim().min(1)),
  requirements: z.array(z.string().trim().min(1)),
  conditions: z.array(z.string().trim().min(1)),
  application: z.array(z.string().trim().min(1)),
  other: z.array(z.string().trim().min(1)),
});

export const JobOfferSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  province: z.string().trim().min(1).nullable(),
  locality: z.string().trim().min(1).nullable(),
  publishedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable().default(null),
  sourceName: z.string().trim().min(1),
  descriptionText: z.string().trim().min(1),
  descriptionSections: DescriptionSectionsSchema,
  originalUrl: HttpUrlSchema,
  snapshot: z.object({
    sourceId: z.string().trim().min(1),
    snapshotFetchedAt: z.string().datetime(),
  }),
});

export const SourceSnapshotSchema = z.object({
  sourceId: z.string().trim().min(1),
  sourceUrl: HttpUrlSchema,
  sourceUpdatedAt: z.string().datetime().nullable(),
  snapshotFetchedAt: z.string().datetime(),
  schemaVersion: z.literal(SchemaVersion),
  recordCount: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  qualityStatus: z.enum(["passed", "stale"]),
});

export const GeneratedManifestSchema = z.object({
  schemaVersion: z.literal(SchemaVersion),
  generatedAt: z.string().datetime(),
  qualityStatus: z.enum(["passed", "stale"]),
  sources: z.object({
    training: SourceSnapshotSchema,
    offers: SourceSnapshotSchema,
  }),
  counts: z.object({
    programs: z.number().int().nonnegative(),
    centers: z.number().int().nonnegative(),
    offerings: z.number().int().nonnegative(),
    offers: z.number().int().nonnegative(),
  }),
});

export type TrainingLevel = z.infer<typeof TrainingLevelSchema>;
export type Modality = z.infer<typeof ModalitySchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type EducationCenter = z.infer<typeof EducationCenterSchema>;
export type TrainingOffering = z.infer<typeof TrainingOfferingSchema>;
export type DescriptionSections = z.infer<typeof DescriptionSectionsSchema>;
export type JobOffer = z.infer<typeof JobOfferSchema>;
export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;
export type GeneratedManifest = z.infer<typeof GeneratedManifestSchema>;
