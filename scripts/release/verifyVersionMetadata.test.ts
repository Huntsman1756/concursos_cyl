import { describe, expect, it, vi } from "vitest";
import { verifyCaddyContainer } from "./verifyCaddyContainer";

type MockRequest = (input: string | URL) => Promise<Response>;

describe("verifyCaddyContainer (Metadata)", () => {
  const baseUrl = "http://localhost:8080";
  const validCommit = "a".repeat(40);

  const validHeaders = {
    "content-type": "text/html",
    "content-security-policy":
      "default-src 'self'; object-src 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };

  it("passes on match", async () => {
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
          JSON.stringify({ schemaVersion: "1.0.0", commit: validCommit }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      )
      .mockResolvedValueOnce(
        new Response('<html><div id="root"></div></html>', {
          status: 200,
          headers: validHeaders,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            resourceSnapshots: {
              outcomeIndicators: {
                resourcePath: "/data/v1/snapshots/abc/outcome-indicators.json",
              },
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

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
