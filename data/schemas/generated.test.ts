import { describe, expect, it } from "vitest";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingOfferingSchema,
} from "./generated";

const validOffering = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
  centerCode: "47000000",
  province: "Valladolid",
  locality: "Valladolid",
  modality: "on_site",
} as const;

const validSnapshot = {
  sourceId: "jcyl-vocational-training-offer",
  sourceUrl:
    "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records",
  sourceUpdatedAt: "2026-08-14T09:00:00.000Z",
  snapshotFetchedAt: "2026-08-14T10:00:00.000Z",
  schemaVersion: "1.0.0",
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "passed",
};

describe("generated data contracts", () => {
  it("accepts a normalized training offering and rejects an empty program key", () => {
    expect(TrainingOfferingSchema.safeParse(validOffering).success).toBe(true);
    expect(
      TrainingOfferingSchema.safeParse({ ...validOffering, programKey: "" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid provenance URLs, dates and hashes", () => {
    expect(
      GeneratedManifestSchema.safeParse({
        schemaVersion: "1.0.0",
        generatedAt: "not-a-date",
        qualityStatus: "passed",
        sources: { training: validSnapshot, offers: validSnapshot },
        counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
      }).success,
    ).toBe(false);

    expect(
      GeneratedManifestSchema.safeParse({
        schemaVersion: "1.0.0",
        generatedAt: "2026-08-14T10:00:00.000Z",
        qualityStatus: "passed",
        sources: {
          training: { ...validSnapshot, sourceUrl: "not-a-url" },
          offers: { ...validSnapshot, sha256: "not-a-hash" },
        },
        counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
      }).success,
    ).toBe(false);
  });

  it("requires sanitized offer text and a traceable original URL", () => {
    const offer = {
      id: "offer-1",
      title: "Desarrollador web",
      province: "Valladolid",
      locality: "Valladolid",
      publishedAt: "2026-08-14T08:00:00.000Z",
      sourceName: "ECYL",
      descriptionText: "Requisitos: experiencia y permiso de conducir",
      descriptionSections: {
        summary: [],
        functions: [],
        requirements: ["permiso de conducir"],
        conditions: [],
        application: [],
        other: [],
      },
      publishedRequirements: [],
      originalUrl: "https://empleo.jcyl.es/oferta/offer-1",
      snapshot: {
        sourceId: "jcyl-employment-offers",
        snapshotFetchedAt: "2026-08-14T10:00:00.000Z",
      },
    };

    expect(JobOfferSchema.safeParse(offer).success).toBe(true);
    expect(
      JobOfferSchema.safeParse({ ...offer, originalUrl: "javascript:alert(1)" })
        .success,
    ).toBe(false);
  });
});
