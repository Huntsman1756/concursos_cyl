import { describe, expect, it } from "vitest";
import { verifyCaddyContainer } from "./verifyCaddyContainer";

const headers = {
  "content-security-policy":
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
  "content-type": "text/html; charset=utf-8",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
};

function validRequest(input: string | URL): Promise<Response> {
  const path = new URL(input).pathname;
  if (path === "/data/v1/manifest.json") {
    return Promise.resolve(
      Response.json({
        resourceSnapshots: {
          outcomeIndicators: {
            resourcePath: "/data/v1/snapshots/release/outcome-indicators.json",
          },
        },
      }),
    );
  }
  if (path.endsWith("/outcome-indicators.json")) {
    return Promise.resolve(
      new Response("[]", { headers: { "content-type": "application/json" } }),
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

  it.each(["file:///srv", "//example.com", "http://user@example.com"])(
    "rejects invalid container URL %s",
    async (baseUrl) => {
      await expect(verifyCaddyContainer(baseUrl, validRequest)).rejects.toThrow(
        /HTTP\(S\) origin/iu,
      );
    },
  );
});
