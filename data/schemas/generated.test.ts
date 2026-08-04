import { describe, expect, it } from "vitest";
import {
  GeneratedManifestSchema,
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

describe("generated data contracts", () => {
  it("accepts a normalized training offering and rejects an empty program key", () => {
    const valid = {
      programKey: "IFC03S",
      programTitle: "Desarrollo de Aplicaciones Web",
      level: "higher",
      familyCode: "IFC",
      familyName: "Informática y Comunicaciones",
      centerCode: "47000000",
      province: "Valladolid",
      locality: "Valladolid",
      modality: "on_site",
    };

    expect(TrainingOfferingSchema.safeParse(valid).success).toBe(true);
    expect(
      TrainingOfferingSchema.safeParse({ ...valid, programKey: "" }).success,
    ).toBe(false);
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
      sourceSnapshot: snapshot,
    };

    expect(JobOfferSchema.safeParse(valid).success).toBe(true);
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
});
