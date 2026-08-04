import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { loadGeneratedResource, loadManifest } from "./generatedDataClient";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generated data client", () => {
  it("accepts an explicit stale manifest", async () => {
    mockFetchJson({
      schemaVersion: "1.0.0",
      generatedAt: "2026-08-04T10:00:00.000Z",
      qualityStatus: "stale",
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
