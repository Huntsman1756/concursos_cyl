import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";
import { verifyCaddyContainer } from "./verifyCaddyContainer";

type MockRequest = (input: string | URL) => Promise<Response>;

describe("verifyCaddyContainer (Metadata)", () => {
  const baseUrl = "http://localhost:8080";
  const validCommit = "a".repeat(40);

  const validHeaders = {
    "content-type": "text/html",
    "content-security-policy":
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };

  it("passes on match", async () => {
    const csv = "\uFEFFprogram_key,program_title\n";
    const csvSha256 = createHash("sha256").update(csv).digest("hex");
    const sepe = JSON.stringify({
      records: Array.from({ length: 116 }, () => ({})),
    });
    const sepeSha256 = createHash("sha256").update(sepe).digest("hex");
    const request = vi.fn((input: string | URL) => {
      const path = new URL(input).pathname;
      if (path === "/version.json") {
        return Promise.resolve(
          new Response(
            JSON.stringify({ schemaVersion: "1.0.0", commit: validCommit }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
        );
      }
      if (path === "/data/v1/manifest.json") {
        return Promise.resolve(
          Response.json({
            resourceSnapshots: {
              outcomeIndicators: {
                resourcePath: "/data/v1/snapshots/abc/outcome-indicators.json",
              },
              derivedFpOccupationGraph: {
                resourcePath:
                  "/data/v1/snapshots/abc/derived-fp-occupation-graph.json",
                recordCount: 0,
              },
              sepeOccupationMarket: {
                resourcePath:
                  "/data/v1/snapshots/abc/sepe-occupation-market.json",
                recordCount: 116,
                sha256: sepeSha256,
              },
              openDataCatalog: {
                resourcePath: "/data/v1/snapshots/abc/open-data-catalog.json",
                recordCount: 1,
              },
            },
          }),
        );
      }
      if (path.endsWith("/open-data-catalog.json")) {
        return Promise.resolve(
          Response.json([
            {
              csvResourcePath:
                "/data/v1/snapshots/abc/derived-fp-occupation-graph.csv",
              csvSha256,
              recordCount: 0,
            },
          ]),
        );
      }
      if (path.endsWith("/derived-fp-occupation-graph.csv")) {
        return Promise.resolve(
          new Response(csv, { headers: { "content-type": "text/csv" } }),
        );
      }
      if (
        path.endsWith("/outcome-indicators.json") ||
        path.endsWith("/derived-fp-occupation-graph.json")
      ) {
        return Promise.resolve(Response.json([]));
      }
      if (path.endsWith("/sepe-occupation-market.json")) {
        return Promise.resolve(
          new Response(sepe, {
            headers: { "content-type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      );
    });

    await expect(
      verifyCaddyContainer(baseUrl, request as MockRequest, validCommit),
    ).resolves.not.toThrow();
  });

  it("fails on incorrect schema", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ schemaVersion: "2.0.0", commit: validCommit }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      verifyCaddyContainer(baseUrl, request as MockRequest, validCommit),
    ).rejects.toThrow(
      "version.json has an invalid 'schemaVersion'. Expected '1.0.0'.",
    );
  });

  it("fails on malformed SHA remote", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ schemaVersion: "1.0.0", commit: "too-short" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      verifyCaddyContainer(baseUrl, request as MockRequest, validCommit),
    ).rejects.toThrow(/version.json commit is not a 40-hex SHA/);
  });

  it("fails on mismatch", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ schemaVersion: "1.0.0", commit: "b".repeat(40) }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      );

    await expect(
      verifyCaddyContainer(baseUrl, request as MockRequest, validCommit),
    ).rejects.toThrow(/Version mismatch/);
  });
});
