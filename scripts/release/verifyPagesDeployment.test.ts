import { describe, expect, it, vi } from "vitest";
import { verifyPagesDeployment } from "./verifyPagesDeployment";

type FetchImpl = (input: string | URL) => Promise<Response>;

const baseUrl = "https://example.github.io/concursos_cyl/";
const expectedCommit = "a".repeat(40);
const snapshotId = "20260821162954121-087e3c5155c6";

const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: "2026-08-21T16:29:54.121Z",
  qualityStatus: "passed",
  resourceSnapshots: {
    programs: {
      resourcePath: `/data/v1/snapshots/${snapshotId}/programs.json`,
    },
    jobOffers: {
      resourcePath: `/data/v1/snapshots/${snapshotId}/job-offers.json`,
    },
  },
};

function responseFor(
  path: string,
  options: { status?: number; body?: string } = {},
): Response {
  const status = options.status ?? 200;
  const body = options.body ?? "";
  if (path.endsWith(".json")) {
    return new Response(body, {
      status,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(body, {
    status,
    headers: { "content-type": "text/html" },
  });
}

function successfulFetch(
  overrides: Partial<Record<string, Response>> = {},
): FetchImpl {
  return async (input) => {
    const url = new URL(input);
    const path = url.pathname;
    if (overrides[path]) return overrides[path]!;
    if (path === "/concursos_cyl/" || path === "/concursos_cyl") {
      return responseFor(path, {
        body: '<!doctype html><html><head><title>SALIDA CyL</title></head><body><div id="root"></div></body></html>',
      });
    }
    if (path === "/concursos_cyl/version.json") {
      return responseFor(path, {
        body: JSON.stringify({
          schemaVersion: "1.0.0",
          commit: expectedCommit,
        }),
      });
    }
    if (path === "/concursos_cyl/data/v1/manifest.json") {
      return responseFor(path, { body: JSON.stringify(manifest) });
    }
    if (path.startsWith(`/concursos_cyl/data/v1/snapshots/${snapshotId}/`)) {
      return responseFor(path, { body: "[]" });
    }
    if (path === "/concursos_cyl/comparar") {
      return responseFor(path, {
        status: 404,
        body: '<!doctype html><html><head><title>SALIDA CyL</title></head><body><div id="root"></div></body></html>',
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
}

describe("verifyPagesDeployment", () => {
  it("verifies the root, version, manifest, every active resource, and comparar", async () => {
    const fetchImpl = vi.fn(successfulFetch());

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).resolves.toBeUndefined();

    expect(
      fetchImpl.mock.calls.map(([input]) => new URL(input).pathname),
    ).toEqual([
      "/concursos_cyl/",
      "/concursos_cyl/version.json",
      "/concursos_cyl/data/v1/manifest.json",
      "/concursos_cyl/data/v1/snapshots/20260821162954121-087e3c5155c6/programs.json",
      "/concursos_cyl/data/v1/snapshots/20260821162954121-087e3c5155c6/job-offers.json",
      "/concursos_cyl/comparar",
    ]);
  });

  it("rejects a version commit that differs from the expected commit", async () => {
    const fetchImpl = successfulFetch({
      "/concursos_cyl/version.json": responseFor("version.json", {
        body: JSON.stringify({
          schemaVersion: "1.0.0",
          commit: "b".repeat(40),
        }),
      }),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/version\.json commit mismatch/iu);
  });

  it("rejects an invalid manifest", async () => {
    const fetchImpl = successfulFetch({
      "/concursos_cyl/data/v1/manifest.json": responseFor("manifest.json", {
        body: JSON.stringify({ ...manifest, schemaVersion: "2.0.0" }),
      }),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/manifest.*schemaVersion/iu);
  });

  it("rejects a missing active resource", async () => {
    const fetchImpl = successfulFetch({
      [`/concursos_cyl/data/v1/snapshots/${snapshotId}/job-offers.json`]:
        responseFor("job-offers.json", { status: 404, body: "missing" }),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/job-offers\.json.*404/iu);
  });

  it("rejects a root response with the wrong application title", async () => {
    const fetchImpl = successfulFetch({
      "/concursos_cyl/": responseFor("index.html", {
        body: '<!doctype html><html><head><title>Wrong app</title></head><body><div id="root"></div></body></html>',
      }),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/SALIDA CyL/iu);
  });

  it("rejects a deep link body that is not the application fallback", async () => {
    const fetchImpl = successfulFetch({
      "/concursos_cyl/comparar": responseFor("comparar", {
        status: 404,
        body: "Not found",
      }),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/comparar.*fallback/iu);
  });

  it("retries the complete check after a transient failure", async () => {
    let calls = 0;
    const delay = vi.fn(async () => undefined);
    const fetchImpl: FetchImpl = async (input) => {
      calls += 1;
      if (calls === 1) {
        return responseFor("index.html", {
          body: '<!doctype html><html><head><title>Wrong app</title></head><body><div id="root"></div></body></html>',
        });
      }
      return successfulFetch()(input);
    };

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 2,
        retryDelayMs: 50,
        delayImpl: delay,
      }),
    ).resolves.toBeUndefined();

    expect(delay).toHaveBeenCalledWith(50);
    expect(calls).toBeGreaterThan(6);
  });
});
