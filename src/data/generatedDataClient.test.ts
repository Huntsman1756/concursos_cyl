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
        programs: snapshot,
        centers: snapshot,
        trainingOfferings: snapshot,
        jobOffers: snapshot,
      },
    });

    await expect(loadManifest()).resolves.toMatchObject({
      qualityStatus: "stale",
    });
  });

  it("throws the missing code for an absent generated asset", async () => {
    mockFetchJson({ message: "not found" }, 404);

    await expect(
      loadGeneratedResource("/data/v1/programs.json", z.array(z.string())),
    ).rejects.toMatchObject({ code: "missing" });
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
