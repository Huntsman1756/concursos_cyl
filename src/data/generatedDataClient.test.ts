import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { LoadableGeneratedManifestSchema } from "../../data/schemas/generated";
import {
  EDUCABASE_INCOME_TABLE_IDS,
  EDUCABASE_INCOME_SOURCES,
} from "../../scripts/data/educabaseIncomeSources";
import { currentManifestFixture } from "../../tests/fixtures/generatedManifest";
import { PublishedRequirementsResourceSchema } from "../domain/requirements";

import {
  loadFoundationResourceSubset,
  loadFoundationResources,
  loadGeneratedResource,
  loadManifest,
  loadOutcomeIndicators,
  loadPublishedRequirements,
  resolveGeneratedAssetPath,
} from "./generatedDataClient";

const snapshot = {
  sourceId: "jcyl-employment-offers",
  sourceUrl: "https://analisis.datosabiertos.jcyl.es/records",
  sourceUpdatedAt: "2026-08-03T12:00:00.000Z",
  snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
  schemaVersion: "1.0.0",
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "stale",
};

const foundationProgram = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
};
const foundationCenter = {
  centerCode: "47000000",
  centerName: "IES Río Duero",
  province: "Valladolid",
  locality: "Valladolid",
  address: null,
  phone: null,
  email: null,
  website: null,
};
const foundationTrainingOffering = {
  ...foundationProgram,
  centerCode: foundationCenter.centerCode,
  province: foundationCenter.province,
  locality: foundationCenter.locality,
  modality: "on_site",
};
const foundationJobOffer = {
  id: "08-2026-12345",
  title: "Desarrollador/a web",
  province: null,
  locality: null,
  publishedAt: "2026-08-03T00:00:00.000Z",
  sourceName: "ECYL",
  descriptionText: "Oferta oficial.",
  descriptionSections: {
    summary: ["Oferta oficial."],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  },
  originalUrl: "https://empleo.jcyl.es/oferta/08-2026-12345",
  sourceSnapshot: snapshot,
};

const foundationResourceValues = {
  programs: [foundationProgram],
  centers: [foundationCenter],
  trainingOfferings: [foundationTrainingOffering],
  jobOffers: [foundationJobOffer],
};

function mockFetchJson(value: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(value), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

function mockGeneratedAssets(assets: Readonly<Record<string, unknown>>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL | Request) => {
      const path =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : new URL(input.url).pathname;
      const value = assets[path];
      return new Response(JSON.stringify(value ?? { message: "not found" }), {
        status: value === undefined ? 404 : 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

function validUpstreamArtifacts() {
  return EDUCABASE_INCOME_TABLE_IDS.flatMap((tableId) => {
    const source = EDUCABASE_INCOME_SOURCES[tableId];
    return (["csv", "px"] as const).map((format) => ({
      tableId,
      format,
      sourceUrl: format === "csv" ? source.csvUrl : source.pxUrl,
      catalogUrl: source.catalogUrl,
      fetchedAt: "2026-08-09T00:00:00.000Z",
      declaredContentType: "application/octet-stream",
      byteLength: 1,
      sha256: "b".repeat(64),
      effectiveEncoding: format === "csv" ? "utf-8" : "iso-8859-15",
    }));
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated data client", () => {
  it("treats outcome indicators as optional but validates an advertised resource", async () => {
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
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
      },
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
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    await expect(loadOutcomeIndicators(manifest)).resolves.toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();

    const advertised = LoadableGeneratedManifestSchema.parse({
      ...manifest,
      resourceSnapshots: {
        ...manifest.resourceSnapshots,
        outcomeIndicators: {
          ...snapshot,
          sourceId: "educabase-fp-income-four-table-bundle",
          resourcePath: "/data/v1/snapshots/build-1/outcome-indicators.json",
          upstreamArtifacts: validUpstreamArtifacts(),
        },
      },
    });
    mockFetchJson({ message: "not found" }, 404);
    await expect(loadOutcomeIndicators(advertised)).rejects.toMatchObject({
      code: "missing",
    });
  });

  it("resolves logical generated asset paths below the configured Vite base", () => {
    expect(
      resolveGeneratedAssetPath("/data/v1/manifest.json", "/concursos_cyl/"),
    ).toBe("/concursos_cyl/data/v1/manifest.json");
    expect(resolveGeneratedAssetPath("/data/v1/manifest.json", "/")).toBe(
      "/data/v1/manifest.json",
    );
  });

  it("loads manifest-addressed published requirements without changing offers", async () => {
    const resourcePath =
      "/data/v1/snapshots/build-1/published-requirements.json";
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
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
        reconciliationAnomalies: [],
      },
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
        publishedRequirements: { ...snapshot, resourcePath },
      },
    });
    const resource = [
      {
        offerId: foundationJobOffer.id,
        requirements: [
          {
            id: "requirement:9e7244dd63125bda17f28f86e17b4099a6fe1a14a4973c2e454059cc8a065705",
            category: "driving_license_or_vehicle",
            normalizedValue: "B",
            sourceQuote: "Permiso de conducir B.",
            parserRule: "license.driving_b",
            parserVersion: "1.0.0",
          },
        ],
      },
    ];
    mockGeneratedAssets({ [resourcePath]: resource });

    await expect(loadPublishedRequirements(manifest)).resolves.toEqual(
      resource,
    );
  });

  it("treats the additive requirements resource as absent for retained manifests", async () => {
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "stale",
      resourceSnapshots: {
        programs: snapshot,
        centers: snapshot,
        trainingOfferings: snapshot,
        jobOffers: snapshot,
      },
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(loadPublishedRequirements(manifest)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a format-valid forged requirement ID through the generated data client", async () => {
    const resourcePath =
      "/data/v1/snapshots/build-1/published-requirements.json";
    mockGeneratedAssets({
      [resourcePath]: [
        {
          offerId: foundationJobOffer.id,
          requirements: [
            {
              id: `requirement:${"f".repeat(64)}`,
              category: "driving_license_or_vehicle",
              normalizedValue: "B",
              sourceQuote: "Permiso de conducir B.",
              parserRule: "license.driving_b",
              parserVersion: "1.0.0",
            },
          ],
        },
      ],
    });

    await expect(
      loadGeneratedResource(resourcePath, PublishedRequirementsResourceSchema),
    ).rejects.toMatchObject({ code: "schema" });
  });

  it("does not fetch a sidecar for a current immutable manifest that predates it", async () => {
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
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
        reconciliationAnomalies: [],
      },
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
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(loadPublishedRequirements(manifest)).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts an explicit stale manifest", async () => {
    mockFetchJson({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "stale",
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
      },
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
    });

    await expect(loadManifest()).resolves.toMatchObject({
      qualityStatus: "stale",
    });
    expect(fetch).toHaveBeenCalledWith("/data/v1/manifest.json", {
      cache: "no-store",
    });
  });

  it("migrates a valid pre-versioned manifest to known direct resource paths", async () => {
    mockFetchJson({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "stale",
      resourceSnapshots: {
        programs: snapshot,
        centers: snapshot,
        trainingOfferings: snapshot,
        jobOffers: snapshot,
      },
    });

    await expect(loadManifest()).resolves.toMatchObject({
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

  it("loads retained flat resources after migrating a legacy manifest", async () => {
    const assets: Record<string, unknown> = {
      "/data/v1/manifest.json": {
        schemaVersion: "1.0.0",
        generatedAt: "2026-08-04T10:00:00.000Z",
        qualityStatus: "stale",
        resourceSnapshots: {
          programs: snapshot,
          centers: snapshot,
          trainingOfferings: snapshot,
          jobOffers: snapshot,
        },
      },
      "/data/v1/programs.json": foundationResourceValues.programs,
      "/data/v1/centers.json": foundationResourceValues.centers,
      "/data/v1/training-offerings.json":
        foundationResourceValues.trainingOfferings,
      "/data/v1/job-offers.json": foundationResourceValues.jobOffers,
    };
    mockGeneratedAssets(assets);

    const manifest = await loadManifest();
    await expect(loadFoundationResources(manifest)).resolves.toEqual({
      contract: "legacy",
      ...foundationResourceValues,
    });
  });

  it("tags immutable resources with the current contract discriminator", async () => {
    const immutableSnapshot = (resourcePath: string) => ({
      ...snapshot,
      resourcePath,
    });
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "passed",
      qualityReport: {
        counts: { programs: 0, centers: 0, offerings: 0, offers: 0 },
        nullRates: {
          centerAddress: 0,
          centerPhone: 0,
          centerEmail: 0,
          centerWebsite: 0,
          offerProvince: 0,
          offerLocality: 0,
          offerDescription: 0,
        },
      },
      resourceSnapshots: {
        programs: immutableSnapshot("/data/v1/snapshots/build-1/programs.json"),
        centers: immutableSnapshot("/data/v1/snapshots/build-1/centers.json"),
        trainingOfferings: immutableSnapshot(
          "/data/v1/snapshots/build-1/training-offerings.json",
        ),
        jobOffers: immutableSnapshot(
          "/data/v1/snapshots/build-1/job-offers.json",
        ),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(loadFoundationResources(manifest)).resolves.toEqual({
      contract: "current",
      programs: [],
      centers: [],
      trainingOfferings: [],
      jobOffers: [],
    });
  });

  it("loads only the requested foundation subset and identifies legacy payloads", async () => {
    const manifest = LoadableGeneratedManifestSchema.parse({
      ...currentManifestFixture(),
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
    });
    const requestedPaths: string[] = [];
    const assets: Record<string, unknown> = {
      [manifest.resourceSnapshots.programs.resourcePath]:
        foundationResourceValues.programs,
      [manifest.resourceSnapshots.trainingOfferings.resourcePath]:
        foundationResourceValues.trainingOfferings,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL | Request) => {
        const path =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.pathname
              : new URL(input.url).pathname;
        requestedPaths.push(path);
        const payload = assets[path];
        return new Response(JSON.stringify(payload), {
          status: payload === undefined ? 404 : 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );

    await expect(
      loadFoundationResourceSubset(manifest, ["programs", "trainingOfferings"]),
    ).resolves.toEqual({
      contract: "legacy",
      programs: foundationResourceValues.programs,
      trainingOfferings: foundationResourceValues.trainingOfferings,
    });
    expect(requestedPaths).toEqual([
      manifest.resourceSnapshots.programs.resourcePath,
      manifest.resourceSnapshots.trainingOfferings.resourcePath,
    ]);
  });

  it("loads retained pre-hardening payloads behind a stale immutable manifest", async () => {
    const paths = {
      programs: "/data/v1/snapshots/fixed-point/programs.json",
      centers: "/data/v1/snapshots/fixed-point/centers.json",
      trainingOfferings:
        "/data/v1/snapshots/fixed-point/training-offerings.json",
      jobOffers: "/data/v1/snapshots/fixed-point/job-offers.json",
    } as const;
    const manifest = LoadableGeneratedManifestSchema.parse({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "stale",
      qualityReport: {
        counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
        nullRates: {
          centerAddress: 1,
          centerPhone: 1,
          centerEmail: 1,
          centerWebsite: 1,
          offerProvince: 1,
          offerLocality: 1,
          offerDescription: 0,
        },
      },
      resourceSnapshots: Object.fromEntries(
        Object.entries(paths).map(([key, resourcePath]) => [
          key,
          { ...snapshot, resourcePath },
        ]),
      ),
    });
    const assets: Record<string, unknown> = {
      [paths.programs]: foundationResourceValues.programs,
      [paths.centers]: foundationResourceValues.centers,
      [paths.trainingOfferings]: foundationResourceValues.trainingOfferings,
      [paths.jobOffers]: foundationResourceValues.jobOffers,
    };
    mockGeneratedAssets(assets);

    await expect(loadFoundationResources(manifest)).resolves.toEqual({
      contract: "legacy",
      ...foundationResourceValues,
    });
  });

  it("throws the missing code for an absent generated asset", async () => {
    mockFetchJson({ message: "not found" }, 404);

    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "missing" });
  });

  it.each([
    "https://example.test/data/v1/programs.json",
    "//example.test/data/v1/programs.json",
    "data:text/plain,not-json",
    "/outside/generated.json",
    "data/v1/programs.json",
    "/data/v1/../programs.json",
    "/data/v1/%2e%2e/programs.json",
    "/data/v1/snapshots/build-1/%2E%2E/programs.json",
    "/data/v1/snapshots/build-1%2f..%2fprograms.json",
    "/data/v1/snapshots/build-1%5c..%5cprograms.json",
    "/data/v1/programs.json?cache=1",
    "/data/v1/programs.json#fragment",
    "/data/v1/unknown.json",
  ])(
    "rejects non-relative or non-generated asset path %s before fetch",
    async (path) => {
      const request = vi.fn();
      vi.stubGlobal("fetch", request);

      await expect(
        loadGeneratedResource(path, z.array(z.string())),
      ).rejects.toMatchObject({ code: "missing" });
      expect(request).not.toHaveBeenCalled();
    },
  );

  it("accepts a manifest-addressed immutable resource path", async () => {
    const path = "/data/v1/snapshots/build-1/programs.json";
    mockFetchJson(["IFC03S"]);

    await expect(
      loadGeneratedResource(path, z.array(z.string())),
    ).resolves.toEqual(["IFC03S"]);
    expect(fetch).toHaveBeenCalledWith(path);
  });

  it("accepts a future manifest-addressed kebab-case resource path", async () => {
    const path = "/data/v1/snapshots/build-1/occupation-aliases.json";
    mockFetchJson(["desarrollador web"]);

    await expect(
      loadGeneratedResource(path, z.array(z.string())),
    ).resolves.toEqual(["desarrollador web"]);
    expect(fetch).toHaveBeenCalledWith(path);
  });

  it("throws the network code for failed requests and HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "network" });

    mockFetchJson({ message: "unavailable" }, 503);
    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "network" });
  });

  it("throws the schema code for malformed JSON and invalid contracts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{", { status: 200 })),
    );
    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "schema" });

    mockFetchJson([1]);
    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "schema" });
  });
});
