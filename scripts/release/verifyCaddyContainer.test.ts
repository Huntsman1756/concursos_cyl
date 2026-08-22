import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";
import { verifyCaddyContainer } from "./verifyCaddyContainer";

const headers = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  "content-type": "text/html; charset=utf-8",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
};
const csvBytes = "\uFEFFprogram_key,program_title\n";
const csvSha256 = createHash("sha256").update(csvBytes).digest("hex");
const sepeBytes = JSON.stringify({
  records: Array.from({ length: 116 }, () => ({})),
});
const sepeSha256 = createHash("sha256").update(sepeBytes).digest("hex");

function validRequest(input: string | URL): Promise<Response> {
  const path = new URL(input).pathname;
  if (path === "/data/v1/manifest.json") {
    return Promise.resolve(
      Response.json({
        resourceSnapshots: {
          outcomeIndicators: {
            resourcePath: "/data/v1/snapshots/release/outcome-indicators.json",
          },
          derivedFpOccupationGraph: {
            resourcePath:
              "/data/v1/snapshots/release/derived-fp-occupation-graph.json",
            recordCount: 0,
          },
          sepeOccupationMarket: {
            resourcePath:
              "/data/v1/snapshots/release/sepe-occupation-market.json",
            recordCount: 116,
            sha256: sepeSha256,
          },
          openDataCatalog: {
            resourcePath: "/data/v1/snapshots/release/open-data-catalog.json",
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
            "/data/v1/snapshots/release/derived-fp-occupation-graph.csv",
          csvSha256,
          recordCount: 0,
        },
      ]),
    );
  }
  if (path.endsWith("/derived-fp-occupation-graph.csv")) {
    return Promise.resolve(
      new Response(csvBytes, { headers: { "content-type": "text/csv" } }),
    );
  }
  if (path.endsWith("/derived-fp-occupation-graph.json")) {
    return Promise.resolve(Response.json([]));
  }
  if (path.endsWith("/outcome-indicators.json")) {
    return Promise.resolve(
      new Response("[]", { headers: { "content-type": "application/json" } }),
    );
  }
  if (path.endsWith("/sepe-occupation-market.json")) {
    return Promise.resolve(
      new Response(sepeBytes, {
        headers: { "content-type": "application/json" },
      }),
    );
  }
  return Promise.resolve(new Response('<div id="root"></div>', { headers }));
}

describe("verifyCaddyContainer", () => {
  it("checks Caddy headers, SPA deep links, and manifest-addressed evidence", async () => {
    await expect(
      verifyCaddyContainer("http://127.0.0.1:8080", validRequest),
    ).resolves.toBeUndefined();
  });

  it("rejects a release response without the Caddy CSP", async () => {
    const withoutCsp = (input: string | URL) => {
      const response = validRequest(input);
      if (new URL(input).pathname !== "/") return response;
      return Promise.resolve(
        new Response('<div id="root"></div>', {
          headers: { ...headers, "content-security-policy": "" },
        }),
      );
    };
    await expect(
      verifyCaddyContainer("http://127.0.0.1:8080", withoutCsp),
    ).rejects.toThrow(/Caddy Content-Security-Policy/iu);
  });

  it("requires the manifest-addressed SEPE resource on the VPS", async () => {
    const withoutSepe = (input: string | URL) => {
      if (new URL(input).pathname !== "/data/v1/manifest.json") {
        return validRequest(input);
      }
      return Promise.resolve(
        Response.json({
          resourceSnapshots: {
            outcomeIndicators: {
              resourcePath:
                "/data/v1/snapshots/release/outcome-indicators.json",
            },
            derivedFpOccupationGraph: {
              resourcePath:
                "/data/v1/snapshots/release/derived-fp-occupation-graph.json",
              recordCount: 0,
            },
            openDataCatalog: {
              resourcePath: "/data/v1/snapshots/release/open-data-catalog.json",
              recordCount: 1,
            },
          },
        }),
      );
    };

    await expect(
      verifyCaddyContainer("http://127.0.0.1:8080", withoutSepe),
    ).rejects.toThrow(/SEPE|sepeOccupationMarket/i);
  });

  it("rejects an unsafe SEPE snapshot identifier", async () => {
    const unsafe = (input: string | URL) => {
      if (new URL(input).pathname !== "/data/v1/manifest.json") {
        return validRequest(input);
      }
      return Promise.resolve(
        Response.json({
          resourceSnapshots: {
            sepeOccupationMarket: {
              resourcePath:
                "/data/v1/snapshots/../release/sepe-occupation-market.json",
              recordCount: 116,
              sha256: sepeSha256,
            },
          },
        }),
      );
    };

    await expect(
      verifyCaddyContainer("http://127.0.0.1:8080", unsafe),
    ).rejects.toThrow(/SEPE|snapshot|resource/i);
  });

  it.each(["file:///srv", "//example.com", "http://user@example.com"])(
    "rejects invalid container URL %s",
    async (baseUrl) => {
      await expect(verifyCaddyContainer(baseUrl, validRequest)).rejects.toThrow(
        /HTTP\(S\) origin/iu,
      );
    },
  );
});
