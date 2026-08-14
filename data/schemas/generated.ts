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

export const RequirementCategorySchema = z.enum([
  "qualification_or_specialization",
  "experience",
  "driving_license_or_vehicle",
  "certificate_or_regulated_license",
  "language",
  "schedule_availability",
  "mobility_or_work_mode",
  "unclassified",
]);

export const PublishedRequirementSchema = z.object({
  id: z.string().trim().min(1),
  category: RequirementCategorySchema,
  normalizedValue: z.union([z.string(), z.number(), z.null()]),
  sourceQuote: z.string().trim().min(1),
  parserRule: z.string().trim().min(1),
  parserVersion: z.literal("1.0.0"),
});

export const OutcomeIndicatorSchema = z.object({
  indicatorId: z.string().trim().min(1),
  trainingProgramKey: z.string().trim().min(1).nullable(),
  officialProgramGroupLabel: z.string().trim().min(1).nullable(),
  trainingLevel: z.enum(["basic", "intermediate", "higher"]),
  scope: z.enum([
    "spain_program_group",
    "castilla_leon_professional_family",
    "castilla_leon_training_level",
  ]),
  cohort: z.string().trim().min(1),
  postGraduationYear: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  measure: z.enum([
    "affiliation_rate",
    "mean",
    "quintile_1",
    "quintile_2",
    "quintile_3",
    "quintile_4",
  ]),
  value: z.number().nullable(),
  unit: z.enum(["eur_annualized_contribution_base", "percent"]),
  suppressionState: z.enum([
    "published",
    "not_published",
    "not_applicable",
    "provisional",
  ]),
  sourceId: z.string().trim().min(1),
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
  publishedRequirements: z.array(PublishedRequirementSchema),
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
    outcomes: SourceSnapshotSchema.optional(),
  }),
  counts: z.object({
    programs: z.number().int().nonnegative(),
    centers: z.number().int().nonnegative(),
    offerings: z.number().int().nonnegative(),
    offers: z.number().int().nonnegative(),
  }),
});

export const TrainingProgramsSchema = z.array(TrainingProgramSchema);
export const EducationCentersSchema = z.array(EducationCenterSchema);
export const TrainingOfferingsSchema = z.array(TrainingOfferingSchema);
export const JobOffersSchema = z.array(JobOfferSchema);
export const OutcomeIndicatorsSchema = z.array(OutcomeIndicatorSchema);

export type TrainingLevel = z.infer<typeof TrainingLevelSchema>;
export type Modality = z.infer<typeof ModalitySchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type EducationCenter = z.infer<typeof EducationCenterSchema>;
export type TrainingOffering = z.infer<typeof TrainingOfferingSchema>;
export type DescriptionSections = z.infer<typeof DescriptionSectionsSchema>;
export type RequirementCategory = z.infer<typeof RequirementCategorySchema>;
export type PublishedRequirement = z.infer<typeof PublishedRequirementSchema>;
export type OutcomeIndicator = z.infer<typeof OutcomeIndicatorSchema>;
export type JobOffer = z.infer<typeof JobOfferSchema>;
export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;
export type GeneratedManifest = z.infer<typeof GeneratedManifestSchema>;
