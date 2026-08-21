import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { verifyPagesDeployment } from "./verifyPagesDeployment";

type FetchImpl = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

const baseUrl = "https://example.github.io/concursos_cyl/";
const expectedCommit = "a".repeat(40);
const manifest = JSON.parse(
  readFileSync("public/data/v1/manifest.json", "utf8"),
) as {
  schemaVersion: string;
  resourceSnapshots: Record<string, { resourcePath: string; [key: string]: unknown }>;
  [key: string]: unknown;
};
const snapshotId = manifest.resourceSnapshots.programs!.resourcePath.split(
  "/",
)[4]!;

function cloneManifest() {
  return JSON.parse(JSON.stringify(manifest)) as typeof manifest;
}

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

    const requestedPaths = fetchImpl.mock.calls.map(([input]) =>
      new URL(input).pathname,
    );
    expect(requestedPaths.slice(0, 3)).toEqual([
      "/concursos_cyl/",
      "/concursos_cyl/version.json",
      "/concursos_cyl/data/v1/manifest.json",
    ]);
    const expectedResourcePaths = Object.values(manifest.resourceSnapshots).map(
      ({ resourcePath }) => `/concursos_cyl${resourcePath}`,
    );
    expect(requestedPaths.slice(3, -1)).toHaveLength(
      expectedResourcePaths.length,
    );
    expect(new Set(requestedPaths.slice(3, -1))).toEqual(
      new Set(expectedResourcePaths),
    );
    expect(requestedPaths.at(-1)).toBe("/concursos_cyl/comparar");
    expect(fetchImpl.mock.calls.every(([, init]) => init?.redirect === "error")).toBe(
      true,
    );
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
    const invalidManifest = cloneManifest();
    invalidManifest.schemaVersion = "2.0.0";
    const fetchImpl = successfulFetch({
      "/concursos_cyl/data/v1/manifest.json": responseFor("manifest.json", {
        body: JSON.stringify(invalidManifest),
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

  it("rejects a manifest that omits a required resource key", async () => {
    const invalidManifest = cloneManifest();
    delete invalidManifest.resourceSnapshots.programs;
    const fetchImpl = successfulFetch({
      "/concursos_cyl/data/v1/manifest.json": responseFor("manifest.json", {
        body: JSON.stringify(invalidManifest),
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
    ).rejects.toThrow(/required resource key|programs/iu);
  });

  it.each([
    ["wrong filename", (candidate: typeof manifest) => {
      candidate.resourceSnapshots.programs!.resourcePath =
        candidate.resourceSnapshots.jobOffers!.resourcePath;
    }],
    ["duplicate resource path", (candidate: typeof manifest) => {
      candidate.resourceSnapshots.jobOffers!.resourcePath =
        candidate.resourceSnapshots.programs!.resourcePath;
    }],
    ["invalid metadata", (candidate: typeof manifest) => {
      candidate.resourceSnapshots.programs!.sha256 = "not-a-sha256";
    }],
  ] as const)("rejects a manifest with %s", async (_name, mutate) => {
    const invalidManifest = cloneManifest();
    mutate(invalidManifest);
    const fetchImpl = successfulFetch({
      "/concursos_cyl/data/v1/manifest.json": responseFor("manifest.json", {
        body: JSON.stringify(invalidManifest),
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
    ).rejects.toThrow(/manifest|resource|sha256|duplicate|filename/iu);
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

  it("rejects an HTML body served for a manifest resource", async () => {
    const resourcePath = manifest.resourceSnapshots.programs!.resourcePath;
    const fetchImpl = successfulFetch({
      [`/concursos_cyl${resourcePath}`]: responseFor("programs.json", {
        body: "<!doctype html><html>not JSON</html>",
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
    ).rejects.toThrow(/resource.*JSON/iu);
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

  it("times out a hung request and keeps the timeout within the full-check retry", async () => {
    let firstRequest = true;
    const fetchImpl: FetchImpl = async (input) => {
      if (firstRequest) {
        firstRequest = false;
        return new Promise<Response>(() => undefined);
      }
      return successfulFetch()(input);
    };

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
        requestTimeoutMs: 5,
      }),
    ).rejects.toThrow(/timed out|timeout/iu);
  });

  it("times out a hung response body read", async () => {
    const response = responseFor("index.html", {
      body: '<!doctype html><html><head><title>SALIDA CyL</title></head><body><div id="root"></div></body></html>',
    });
    const cancel = vi.fn(() => new Promise<void>(() => undefined));
    let aborted = false;
    const fetchImpl: FetchImpl = async (_input, init) => {
      init?.signal?.addEventListener("abort", () => {
        aborted = true;
      });
      Object.defineProperty(response, "body", {
        configurable: true,
        value: { cancel },
      });
      return response;
    };
    Object.defineProperty(response, "text", {
      value: () => new Promise<string>(() => undefined),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
        requestTimeoutMs: 5,
      }),
    ).rejects.toThrow(/root response body.*timed out/iu);
    expect(aborted).toBe(true);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("rejects an escaped final response URL", async () => {
    const fetchImpl = successfulFetch({
      "/concursos_cyl/": (() => {
        const response = responseFor("index.html", {
          body: '<!doctype html><html><head><title>SALIDA CyL</title></head><body><div id="root"></div></body></html>',
        });
        Object.defineProperty(response, "url", {
          value: "https://evil.example/redirected",
        });
        return response;
      })(),
    });

    await expect(
      verifyPagesDeployment({
        baseUrl,
        expectedCommit,
        fetchImpl,
        attempts: 1,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/same-origin|redirect/iu);
  });

  it("retries while cleaning up a late response from a signal-ignoring fetch", async () => {
    const lateCancel = vi.fn(async () => undefined);
    let rootCalls = 0;
    const fetchImpl: FetchImpl = async (input) => {
      const path = new URL(input).pathname;
      if (path === "/concursos_cyl/" && rootCalls++ === 0) {
        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            const response = responseFor("index.html", {
              body: '<!doctype html><html><head><title>SALIDA CyL</title></head><body><div id="root"></div></body></html>',
            });
            Object.defineProperty(response, "body", {
              configurable: true,
              value: { cancel: lateCancel },
            });
            resolve(response);
          }, 20);
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
        retryDelayMs: 0,
        requestTimeoutMs: 5,
      }),
    ).resolves.toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(lateCancel).toHaveBeenCalledOnce();
  });
});
