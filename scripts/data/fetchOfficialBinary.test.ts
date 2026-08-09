import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";
import { fetchOfficialBinary } from "./fetchOfficialBinary";

const source = EDUCABASE_INCOME_SOURCES.famprof_2_08;
const csv = source.csvUrl;

function response(
  body: BodyInit | null,
  init: ResponseInit & { url?: string } = {},
): Response {
  const result = new Response(body, init);
  Object.defineProperty(result, "url", { value: init.url ?? csv });
  return result;
}

describe("fetchOfficialBinary", () => {
  it("returns raw bytes and auditable provenance for an allowlisted response", async () => {
    const bytes = new TextEncoder().encode("official bytes");
    const request = vi.fn(async () =>
      response(bytes, {
        headers: { "content-type": "text/plain;charset=ISO-8859-15" },
      }),
    );

    const result = await fetchOfficialBinary(
      source,
      "csv",
      "2026-08-09T00:00:00.000Z",
      request,
    );
    expect([...result.bytes]).toEqual([...bytes]);
    expect(result.provenance).toEqual({
      tableId: "famprof_2_08",
      format: "csv",
      sourceUrl: csv,
      catalogUrl: source.catalogUrl,
      fetchedAt: "2026-08-09T00:00:00.000Z",
      declaredContentType: "text/plain;charset=ISO-8859-15",
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      effectiveEncoding: "utf-8",
    });
    expect(request).toHaveBeenCalledWith(
      csv,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects non-HTTPS, wrong final URL, empty and HTML responses", async () => {
    await expect(
      fetchOfficialBinary(
        { ...source, csvUrl: source.csvUrl.replace("https:", "http:") },
        "csv",
        "2026-08-09T00:00:00.000Z",
      ),
    ).rejects.toThrow(/https/i);
    await expect(
      fetchOfficialBinary(
        {
          ...source,
          csvUrl: source.csvUrl.replace("famprof_2_08", "famprof_2_99"),
        },
        "csv",
        "2026-08-09T00:00:00.000Z",
      ),
    ).rejects.toThrow(/closed allowlist/i);
    await expect(
      fetchOfficialBinary(source, "csv", "2026-08-09T00:00:00.000Z", async () =>
        response("content", { url: source.pxUrl }),
      ),
    ).rejects.toThrow(/final URL/i);
    await expect(
      fetchOfficialBinary(source, "csv", "2026-08-09T00:00:00.000Z", async () =>
        response(null),
      ),
    ).rejects.toThrow(/empty/i);
    await expect(
      fetchOfficialBinary(source, "csv", "2026-08-09T00:00:00.000Z", async () =>
        response("<html>failure</html>", {
          headers: { "content-type": "text/html" },
        }),
      ),
    ).rejects.toThrow(/HTML/i);
  });

  it("bounds streaming bodies, retries transient failures, and fails 404 immediately", async () => {
    await expect(
      fetchOfficialBinary(source, "csv", "2026-08-09T00:00:00.000Z", async () =>
        response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(5 * 1024 * 1024 + 1));
              controller.close();
            },
          }),
        ),
      ),
    ).rejects.toThrow(/5 MiB/i);

    const request = vi
      .fn()
      .mockResolvedValueOnce(response("busy", { status: 429 }))
      .mockResolvedValueOnce(response("ok"));
    const sleep = vi.fn(async () => undefined);
    await fetchOfficialBinary(
      source,
      "csv",
      "2026-08-09T00:00:00.000Z",
      request,
      sleep,
    );
    expect(request).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);

    const missing = vi.fn(async () => response("missing", { status: 404 }));
    await expect(
      fetchOfficialBinary(
        source,
        "csv",
        "2026-08-09T00:00:00.000Z",
        missing,
        sleep,
      ),
    ).rejects.toThrow(/404/);
    expect(missing).toHaveBeenCalledOnce();
  });
});
