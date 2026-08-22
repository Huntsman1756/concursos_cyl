import type { ReconciliationAnomaly } from "../../data/schemas/generated";

interface CurrentManifestFixtureOptions {
  sourceUpdatedAt?: string | null;
  snapshotFetchedAt?: string;
}

export function currentManifestFixture({
  sourceUpdatedAt = "2026-07-31T00:00:00.000Z",
  snapshotFetchedAt = "2026-08-04T10:00:00.000Z",
}: CurrentManifestFixtureOptions = {}) {
  const snapshot = {
    sourceId: "jcyl-employment-offers",
    sourceUrl: "https://analisis.datosabiertos.jcyl.es/records",
    sourceUpdatedAt,
    snapshotFetchedAt,
    schemaVersion: "1.0.0",
    recordCount: 1,
    sha256: "a".repeat(64),
    qualityStatus: "passed",
  } as const;

  return {
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
      mappingCoverage: {
        ...snapshot,
        sourceId: "todofp-boe-reviewed-training-occupation-links",
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales.html",
        resourcePath: "/data/v1/snapshots/build-1/mapping-coverage.json",
      },
    },
    qualityReport: {
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
      reconciliationAnomalies: [] as ReconciliationAnomaly[],
    },
  } as const;
}
