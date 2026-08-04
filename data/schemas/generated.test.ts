import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  DescriptionSectionsSchema,
  EducationCenterSchema,
  GeneratedManifestSchema,
  LoadableGeneratedManifestSchema,
  JobOfferSchema,
  SourceSnapshotSchema,
  TrainingOfferingSchema,
} from "./generated";

const snapshot = {
  sourceId: "jcyl-employment-offers",
  sourceUrl:
    "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records",
  sourceUpdatedAt: "2026-08-03T12:00:00.000Z",
  snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
  schemaVersion: "1.0.0",
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "passed",
};

const qualityReport = {
  counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
  nullRates: {
    centerAddress: 0,
    centerPhone: 0,
    centerEmail: 0,
    centerWebsite: 0,
    offerProvince: 0,
    offerLocality: 0,
    offerDescription: 0,
  },
};

describe("generated data contracts", () => {
  it("accepts a normalized training offering and rejects an empty program key", () => {
    const valid = {
      offeringId: "IFC03S:47000000:on_site:public:education",
      programKey: "IFC03S",
      programTitle: "Desarrollo de Aplicaciones Web",
      level: "higher",
      familyCode: "IFC",
      familyName: "Informática y Comunicaciones",
      centerCode: "47000000",
      centerName: "IES Río Duero",
      province: "Valladolid",
      locality: "Valladolid",
      modality: "on_site",
      teachingType: "public",
      centerOwnership: "education",
    };

    expect(TrainingOfferingSchema.safeParse(valid).success).toBe(true);
    expect(
      TrainingOfferingSchema.safeParse({ ...valid, programKey: "" }).success,
    ).toBe(false);
    const {
      offeringId: _offeringId,
      teachingType: _teachingType,
      centerOwnership: _centerOwnership,
      ...missingIdentityEvidence
    } = valid;
    void _offeringId;
    void _teachingType;
    void _centerOwnership;
    expect(
      TrainingOfferingSchema.safeParse(missingIdentityEvidence).success,
    ).toBe(false);
  });

  it("requires normalized center ownership in canonical center resources", () => {
    const center = {
      centerCode: "47000000",
      centerName: "IES Río Duero",
      province: "Valladolid",
      locality: "Valladolid",
      address: null,
      phone: null,
      email: null,
      website: null,
      centerOwnership: "education",
    };

    expect(EducationCenterSchema.safeParse(center).success).toBe(true);
    const { centerOwnership: _missing, ...withoutOwnership } = center;
    void _missing;
    expect(EducationCenterSchema.safeParse(withoutOwnership).success).toBe(
      false,
    );
  });

  it("accepts snapshot provenance and rejects invalid IDs, URLs, and dates", () => {
    expect(SourceSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(
      SourceSnapshotSchema.safeParse({ ...snapshot, sourceId: "" }).success,
    ).toBe(false);
    expect(
      SourceSnapshotSchema.safeParse({ ...snapshot, sourceUrl: "not-a-url" })
        .success,
    ).toBe(false);
    expect(
      SourceSnapshotSchema.safeParse({
        ...snapshot,
        snapshotFetchedAt: "2026-08-04",
      }).success,
    ).toBe(false);
  });

  it("accepts a sanitized offer and rejects raw HTML", () => {
    const valid = {
      id: "08-2026-12345",
      title: "Desarrollador/a web",
      province: "Valladolid",
      locality: "Valladolid",
      publishedAt: "2026-08-03T00:00:00.000Z",
      sourceName: "ECYL",
      descriptionText: "Se requiere carné B.",
      descriptionSections: {
        summary: [],
        functions: [],
        requirements: ["Se requiere carné B."],
        conditions: [],
        application: [],
        other: [],
      },
      originalUrl: "https://empleo.jcyl.es/oferta/08-2026-12345",
      sourceSnapshot: {
        ...snapshot,
        sourceUpdatedAt: "2026-08-03T14:30:00.000Z",
      },
    };

    expect(JobOfferSchema.safeParse(valid).success).toBe(true);
    expect(
      JobOfferSchema.safeParse({
        ...valid,
        sourceSnapshot: { ...valid.sourceSnapshot, sourceUpdatedAt: null },
      }).success,
    ).toBe(false);

    const fixedPointJobOfferSchema = z
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
        sourceSnapshot: SourceSnapshotSchema.passthrough(),
      })
      .strict();
    expect(fixedPointJobOfferSchema.safeParse(valid).success).toBe(true);
    expect(
      JobOfferSchema.safeParse({
        ...valid,
        descriptionSections: ["Se requiere carné B."],
      }).success,
    ).toBe(false);
    expect(
      JobOfferSchema.safeParse({ ...valid, rawHtml: "<p>Carné B</p>" }).success,
    ).toBe(false);
  });

  it("associates a source snapshot with every generated resource family", () => {
    const valid = {
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
      qualityReport,
      resourceSnapshots: {
        programs: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/programs.json",
        },
        centers: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/centers.json",
        },
        trainingOfferings: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/training-offerings.json",
        },
        jobOffers: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/job-offers.json",
        },
      },
    };

    expect(GeneratedManifestSchema.safeParse(valid).success).toBe(true);
    const { qualityReport: _missing, ...missingQualityReport } = valid;
    void _missing;
    expect(
      GeneratedManifestSchema.safeParse(missingQualityReport).success,
    ).toBe(false);
    expect(
      GeneratedManifestSchema.safeParse({ ...valid, schemaVersion: "2.0.0" })
        .success,
    ).toBe(false);
    expect(
      GeneratedManifestSchema.safeParse({
        ...valid,
        qualityStatus: "unknown",
      }).success,
    ).toBe(false);
    expect(
      GeneratedManifestSchema.safeParse({
        ...valid,
        resourceSnapshots: {
          programs: {
            ...snapshot,
            resourcePath: "/data/v1/snapshots/build-1/programs.json",
          },
          centers: {
            ...snapshot,
            resourcePath: "/data/v1/snapshots/build-1/centers.json",
          },
          trainingOfferings: {
            ...snapshot,
            resourcePath: "/data/v1/snapshots/build-1/training-offerings.json",
          },
        },
      }).success,
    ).toBe(false);
  });

  it("keeps the current schema immutable while explicitly migrating legacy manifests", () => {
    const legacy = {
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
      resourceSnapshots: {
        programs: snapshot,
        centers: snapshot,
        trainingOfferings: snapshot,
        jobOffers: snapshot,
      },
    };

    expect(GeneratedManifestSchema.safeParse(legacy).success).toBe(false);
    expect(LoadableGeneratedManifestSchema.parse(legacy)).toMatchObject({
      resourceSnapshots: {
        programs: { resourcePath: "/data/v1/programs.json" },
        centers: { resourcePath: "/data/v1/centers.json" },
        trainingOfferings: {
          resourcePath: "/data/v1/training-offerings.json",
        },
        jobOffers: { resourcePath: "/data/v1/job-offers.json" },
      },
    });
  });

  it("accepts additive future resource snapshots while retaining all foundation resources", () => {
    const manifest = {
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
      qualityReport,
      resourceSnapshots: {
        programs: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/programs.json",
        },
        centers: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/centers.json",
        },
        trainingOfferings: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/training-offerings.json",
        },
        jobOffers: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/job-offers.json",
        },
        occupationAliases: {
          ...snapshot,
          resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
        },
      },
    };

    expect(GeneratedManifestSchema.safeParse(manifest).success).toBe(true);
    expect(
      GeneratedManifestSchema.safeParse({
        ...manifest,
        resourceSnapshots: {
          ...manifest.resourceSnapshots,
          occupationAliases: {
            ...manifest.resourceSnapshots.occupationAliases,
            resourcePath: "/data/v1/snapshots/build-1/occupation_aliases.json",
          },
        },
      }).success,
    ).toBe(false);
    const { jobOffers: _required, ...missingRequired } =
      manifest.resourceSnapshots;
    void _required;
    expect(
      GeneratedManifestSchema.safeParse({
        ...manifest,
        resourceSnapshots: missingRequired,
      }).success,
    ).toBe(false);
  });

  it.each([
    "/data/v1/snapshots/build-1/programs.json",
    "/data/v1/snapshots/%2e%2e/programs.json",
    "/data/v1/programs.json",
  ])(
    "rejects a hybrid legacy manifest with nested resourcePath %s",
    (resourcePath) => {
      const hybrid = {
        schemaVersion: "1.0.0",
        generatedAt: "2026-08-04T10:00:00.000Z",
        qualityStatus: "stale",
        resourceSnapshots: {
          programs: { ...snapshot, resourcePath },
          centers: snapshot,
          trainingOfferings: snapshot,
          jobOffers: snapshot,
        },
      };

      expect(LoadableGeneratedManifestSchema.safeParse(hybrid).success).toBe(
        false,
      );
    },
  );
});
