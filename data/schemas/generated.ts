import { z } from "zod";

import {
  GENERATED_RESOURCE_CATALOG,
  GENERATED_FOUNDATION_RESOURCE_KEYS,
  generatedResourceFileNameForKey,
  isImmutableGeneratedResourceFilePath,
  isGenericImmutableGeneratedResourcePath,
  legacyGeneratedResourcePath,
  type GeneratedFoundationResourceKey,
  type GeneratedResourceKey,
} from "./generatedResourceCatalog";
import { OutcomeSourceTableIdSchema } from "./outcomes";
import { trainingOfferingIdentity } from "./trainingOfferingIdentity";
import { EDUCABASE_INCOME_SOURCES } from "../../scripts/data/educabaseIncomeSources";

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

export const TeachingTypeSchema = z.enum(["public", "concerted", "private"]);

export const CenterOwnershipSchema = z.enum([
  "agriculture",
  "municipality",
  "education",
  "private",
]);

export const SourceSnapshotSchema = z
  .object({
    sourceId: z.string().min(1),
    sourceUrl: z.string().url(),
    sourceUpdatedAt: z.string().datetime().nullable(),
    snapshotFetchedAt: z.string().datetime(),
    schemaVersion: z.literal("1.0.0"),
    recordCount: z.number().int().nonnegative(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    qualityStatus: z.enum(["passed", "stale"]),
  })
  .strict();

export const TrainingProgramSchema = z
  .object({
    programKey: z.string().min(1),
    programTitle: z.string().min(1),
    level: TrainingLevelSchema,
    familyCode: z.string().min(1),
    familyName: z.string().min(1),
  })
  .strict();

const LegacyEducationCenterBaseSchema = z
  .object({
    centerCode: z.string().min(1),
    centerName: z.string().min(1),
    province: z.string().min(1),
    locality: z.string().min(1),
    address: z.string().min(1).nullable(),
    phone: z.string().min(1).nullable(),
    email: z.string().email().nullable(),
    website: z.string().url().nullable(),
  })
  .strict();

export const LegacyEducationCenterSchema = LegacyEducationCenterBaseSchema;

export const EducationCenterSchema = LegacyEducationCenterBaseSchema.extend({
  centerOwnership: CenterOwnershipSchema,
}).strict();

const LegacyTrainingOfferingBaseSchema = TrainingProgramSchema.extend({
  centerCode: z.string().min(1),
  province: z.string().min(1),
  locality: z.string().min(1),
  modality: ModalitySchema,
}).strict();

export const LegacyTrainingOfferingSchema = LegacyTrainingOfferingBaseSchema;

export const TrainingOfferingSchema = LegacyTrainingOfferingBaseSchema.extend({
  offeringId: z.string().min(1),
  centerName: z.string().min(1),
  teachingType: TeachingTypeSchema,
  centerOwnership: CenterOwnershipSchema,
})
  .strict()
  .superRefine((offering, context) => {
    if (offering.offeringId !== trainingOfferingIdentity(offering)) {
      context.addIssue({
        code: "custom",
        path: ["offeringId"],
        message: "Offering ID must encode every official differentiator.",
      });
    }
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
    sourceSnapshot: SourceSnapshotSchema.extend({
      sourceUpdatedAt: z.string().datetime(),
    }).strict(),
  })
  .strict();

// Published requirement evidence intentionally remains a separate additive
// resource. Keeping this fixed-point schema strict preserves retained v1
// JobOffer payloads and clients that validate them.

export const UpstreamArtifactSchema = z
  .object({
    tableId: OutcomeSourceTableIdSchema,
    format: z.enum(["csv", "px"]),
    sourceUrl: z.string().url(),
    catalogUrl: z.string().url(),
    fetchedAt: z.string().datetime(),
    declaredContentType: z.string().min(1),
    byteLength: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
    sha256: z.string().regex(/^[a-f0-9]{64}$/u),
    effectiveEncoding: z.enum(["utf-8", "iso-8859-15"]),
  })
  .strict()
  .superRefine((artifact, context) => {
    const source = EDUCABASE_INCOME_SOURCES[artifact.tableId];
    const expectedUrl =
      artifact.format === "csv" ? source.csvUrl : source.pxUrl;
    if (artifact.sourceUrl !== expectedUrl) {
      context.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Upstream artifact URL is outside the EDUCAbase allowlist.",
      });
    }
    if (artifact.catalogUrl !== source.catalogUrl) {
      context.addIssue({
        code: "custom",
        path: ["catalogUrl"],
        message: "Upstream artifact catalog URL does not match its table.",
      });
    }
    const expectedEncoding =
      artifact.format === "csv" ? "utf-8" : "iso-8859-15";
    if (artifact.effectiveEncoding !== expectedEncoding) {
      context.addIssue({
        code: "custom",
        path: ["effectiveEncoding"],
        message: "Upstream artifact encoding does not match its format.",
      });
    }
  });

const UpstreamArtifactsSchema = z
  .array(UpstreamArtifactSchema)
  .length(8)
  .superRefine((artifacts, context) => {
    const expected = Object.keys(EDUCABASE_INCOME_SOURCES).flatMap(
      (tableId) => [`${tableId}:csv`, `${tableId}:px`],
    );
    const expectedSet = new Set(expected);
    const seen = new Set<string>();
    for (const [index, artifact] of artifacts.entries()) {
      const key = `${artifact.tableId}:${artifact.format}`;
      if (key !== expected[index] || !expectedSet.has(key) || seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message:
            "Upstream artifacts must contain every approved table-format pair once in source order.",
        });
      }
      seen.add(key);
    }
    if (
      seen.size !== expected.length ||
      expected.some((key) => !seen.has(key))
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Upstream artifacts must contain every approved table-format pair once in source order.",
      });
    }
  });

const GeneratedResourceSnapshotSchema = SourceSnapshotSchema.extend({
  resourcePath: z.string().refine(isGenericImmutableGeneratedResourcePath, {
    message: "Resource path must be an immutable kebab-case JSON asset.",
  }),
  upstreamArtifacts: UpstreamArtifactsSchema.optional(),
}).strict();

const requiredResourceSnapshotShape = Object.fromEntries(
  GENERATED_FOUNDATION_RESOURCE_KEYS.map((key) => [
    key,
    GeneratedResourceSnapshotSchema,
  ]),
) as Record<
  GeneratedFoundationResourceKey,
  typeof GeneratedResourceSnapshotSchema
>;

export const GeneratedResourceSnapshotsSchema = z
  .object(requiredResourceSnapshotShape)
  .catchall(GeneratedResourceSnapshotSchema)
  .superRefine((snapshots, context) => {
    const seenPaths = new Set<string>();
    for (const [key, snapshot] of Object.entries(snapshots)) {
      const fileName =
        key in GENERATED_RESOURCE_CATALOG
          ? GENERATED_RESOURCE_CATALOG[key as GeneratedResourceKey].fileName
          : generatedResourceFileNameForKey(key);
      if (
        fileName === null ||
        !isImmutableGeneratedResourceFilePath(fileName, snapshot.resourcePath)
      ) {
        context.addIssue({
          code: "custom",
          path: [key, "resourcePath"],
          message: `Resource path does not match manifest key ${key}.`,
        });
      }
      if (seenPaths.has(snapshot.resourcePath)) {
        context.addIssue({
          code: "custom",
          path: [key, "resourcePath"],
          message: "Resource paths must be unique.",
        });
      }
      seenPaths.add(snapshot.resourcePath);
      if (key === "outcomeIndicators") {
        if (snapshot.upstreamArtifacts === undefined) {
          context.addIssue({
            code: "custom",
            path: [key, "upstreamArtifacts"],
            message:
              "Outcome indicators require every verified upstream artifact.",
          });
        }
      } else if (snapshot.upstreamArtifacts !== undefined) {
        context.addIssue({
          code: "custom",
          path: [key, "upstreamArtifacts"],
          message: "Only outcome indicators may record EDUCAbase artifacts.",
        });
      }
    }
  });

export const ReconciliationCandidateSchema = z
  .object({
    value: z.string().nullable(),
    count: z.number().int().positive(),
  })
  .strict();

export const ReconciliationAnomalySchema = z
  .object({
    entityType: z.enum(["program", "center"]),
    entityId: z.string().min(1),
    field: z.enum([
      "programTitle",
      "level",
      "familyCode",
      "familyName",
      "centerName",
      "province",
      "locality",
      "address",
      "phone",
      "email",
      "website",
      "centerOwnership",
    ]),
    selectedValue: z.string().nullable(),
    candidates: z.array(ReconciliationCandidateSchema).min(2),
  })
  .strict();

export const GeneratedQualityReportSchema = z
  .object({
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
    reconciliationAnomalies: z.array(ReconciliationAnomalySchema).default([]),
  })
  .strict();

export const GeneratedManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    generatedAt: z.string().datetime(),
    qualityStatus: z.enum(["passed", "stale"]),
    resourceSnapshots: GeneratedResourceSnapshotsSchema,
    qualityReport: GeneratedQualityReportSchema,
  })
  .strict();

const LegacyGeneratedManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    generatedAt: z.string().datetime(),
    qualityStatus: z.enum(["passed", "stale"]),
    resourceSnapshots: z
      .object({
        programs: SourceSnapshotSchema,
        centers: SourceSnapshotSchema,
        trainingOfferings: SourceSnapshotSchema,
        jobOffers: SourceSnapshotSchema,
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
export type TeachingType = z.infer<typeof TeachingTypeSchema>;
export type CenterOwnership = z.infer<typeof CenterOwnershipSchema>;
export type SourceSnapshot = z.infer<typeof SourceSnapshotSchema>;
export type TrainingProgram = z.infer<typeof TrainingProgramSchema>;
export type TrainingOffering = z.infer<typeof TrainingOfferingSchema>;
export type EducationCenter = z.infer<typeof EducationCenterSchema>;
export type LegacyEducationCenter = z.infer<typeof LegacyEducationCenterSchema>;
export type LegacyTrainingOffering = z.infer<
  typeof LegacyTrainingOfferingSchema
>;
export type DescriptionSections = z.infer<typeof DescriptionSectionsSchema>;
export type GeneratedResourceSnapshots = z.infer<
  typeof GeneratedResourceSnapshotsSchema
>;
export type ReconciliationAnomaly = z.infer<typeof ReconciliationAnomalySchema>;
export type GeneratedQualityReport = z.infer<
  typeof GeneratedQualityReportSchema
>;
export type JobOffer = z.infer<typeof JobOfferSchema>;
export type GeneratedManifest = z.infer<typeof GeneratedManifestSchema>;
export type LoadableGeneratedManifest = z.infer<
  typeof LoadableGeneratedManifestSchema
>;
