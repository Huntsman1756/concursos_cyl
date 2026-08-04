import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { LoadableGeneratedManifestSchema } from "../../data/schemas/generated";

import {
  loadFoundationResources,
  loadGeneratedResource,
  loadManifest,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated data client", () => {
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
