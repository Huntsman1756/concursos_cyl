import { describe, expect, it } from "vitest";

import type {
  EducationCenter,
  JobOffer,
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";
import { runQualityGates } from "./qualityGates";

const program: TrainingProgram = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};

const center: EducationCenter = {
  centerCode: "47000000",
  centerName: "IES Río Duero",
  province: "Valladolid",
  locality: "Valladolid",
  address: null,
  phone: null,
  email: null,
  website: null,
};

const offering: TrainingOffering = {
  ...program,
  centerCode: center.centerCode,
  province: center.province,
  locality: center.locality,
  modality: "on_site",
};

const offer: JobOffer = {
  id: "08-2026-12345",
  title: "Desarrollador/a web",
  province: null,
  locality: null,
  publishedAt: "2026-08-03T00:00:00.000Z",
  sourceName: "ECYL",
  descriptionText: "",
  descriptionSections: {
    summary: [],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  },
  originalUrl: "https://empleo.jcyl.es/oferta/08-2026-12345",
  sourceSnapshot: {
    sourceId: "jcyl-employment-offers",
    sourceUrl: "https://analisis.datosabiertos.jcyl.es/records",
    sourceUpdatedAt: "2026-08-03T12:00:00.000Z",
    snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
    schemaVersion: "1.0.0",
    recordCount: 1,
    sha256: "a".repeat(64),
    qualityStatus: "passed",
  },
};

function candidate() {
  return {
    programs: [program],
    centers: [center],
    trainingOfferings: [offering],
    jobOffers: [offer],
  };
}

describe("runQualityGates", () => {
  it("rejects a candidate that unexpectedly loses most records", () => {
    expect(() =>
      runQualityGates(
        { programs: 70, centers: 70, offerings: 70, offers: 70 },
        { programs: 100, centers: 100, offerings: 100, offers: 100 },
      ),
    ).toThrow(/unexpected record loss/i);
  });

  it("rejects duplicate stable identifiers in every resource family", () => {
    const valid = candidate();

    for (const duplicate of [
      { ...valid, programs: [program, program] },
      { ...valid, centers: [center, center] },
      { ...valid, trainingOfferings: [offering, offering] },
      { ...valid, jobOffers: [offer, offer] },
    ]) {
      expect(() => runQualityGates(duplicate)).toThrow(/duplicate/i);
    }
  });

  it("rejects offerings with broken program or center references", () => {
    const valid = candidate();

    expect(() =>
      runQualityGates({
        ...valid,
        trainingOfferings: [{ ...offering, programKey: "MISSING" }],
      }),
    ).toThrow(/broken reference/i);
    expect(() =>
      runQualityGates({
        ...valid,
        trainingOfferings: [{ ...offering, centerCode: "MISSING" }],
      }),
    ).toThrow(/broken reference/i);
  });

  it("rejects blank required labels and invalid URLs", () => {
    const valid = candidate();

    expect(() =>
      runQualityGates({
        ...valid,
        programs: [{ ...program, programTitle: "   " }],
      }),
    ).toThrow(/blank label/i);
    expect(() =>
      runQualityGates({
        ...valid,
        jobOffers: [{ ...offer, originalUrl: "not-a-url" }],
      }),
    ).toThrow(/invalid url/i);
  });

  it("reports documented optional-field null rates without rejecting them", () => {
    const report = runQualityGates(candidate());

    expect(report.counts).toEqual({
      programs: 1,
      centers: 1,
      offerings: 1,
      offers: 1,
    });
    expect(report.nullRates).toMatchObject({
      centerAddress: 1,
      offerProvince: 1,
      offerLocality: 1,
      offerDescription: 1,
    });
  });
});
