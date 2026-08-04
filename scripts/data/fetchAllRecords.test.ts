import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import { fetchAllRecords } from "./fetchAllRecords";
import { fetchJson } from "./fetchJson";

const ItemSchema = z.object({ id: z.number() });

describe("fetchAllRecords", () => {
  it("fetches pages until total_count is reached", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        total_count: 3,
        results: [{ id: 1 }, { id: 2 }],
      })
      .mockResolvedValueOnce({ total_count: 3, results: [{ id: 3 }] });

    await expect(
      fetchAllRecords("https://example.test/records", ItemSchema, fetchPage, 2),
    ).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);

    expect(fetchPage).toHaveBeenCalledWith(
      "https://example.test/records?limit=2&offset=0",
    );
    expect(fetchPage).toHaveBeenLastCalledWith(
      "https://example.test/records?limit=2&offset=2",
    );
  });

  it("rejects a repeated upstream page before it can loop forever", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValue({ total_count: 3, results: [{ id: 1 }, { id: 2 }] });

    await expect(
      fetchAllRecords("https://example.test/records", ItemSchema, fetchPage, 2),
    ).rejects.toThrow("repeated page");
  });

  it("rejects records that do not match the supplied schema", async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      total_count: 1,
      results: [{ id: "not-a-number" }],
    });

    await expect(
      fetchAllRecords("https://example.test/records", ItemSchema, fetchPage),
    ).rejects.toThrow();
  });
});

describe("fetchJson", () => {
  it("retries a 429 response with the bounded backoff schedule", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, json: vi.fn() })
      .mockResolvedValueOnce({ ok: false, status: 503, json: vi.fn() })
      .mockResolvedValueOnce({ ok: false, status: 500, json: vi.fn() })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ id: 1 }),
      });
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchJson("https://example.test/records", ItemSchema, request, sleep),
    ).resolves.toEqual({ id: 1 });

    expect(request).toHaveBeenCalledTimes(4);
    expect(sleep).toHaveBeenNthCalledWith(1, 250);
    expect(sleep).toHaveBeenNthCalledWith(2, 750);
    expect(sleep).toHaveBeenNthCalledWith(3, 1500);
  });

  it("does not retry non-rate-limit client responses", async () => {
    const request = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    });

    await expect(
      fetchJson("https://example.test/records", ItemSchema, request),
    ).rejects.toThrow("HTTP 404");

    expect(request).toHaveBeenCalledTimes(1);
  });
});
