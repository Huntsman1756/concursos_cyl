import { describe, expect, it, vi } from "vitest";
import { fetchAllRecords } from "./fetchAllRecords";
import { fetchJson } from "./fetchJson";
import { z } from "zod";

const itemSchema = z.object({ id: z.number() });

describe("fetchAllRecords", () => {
  it("fetches pages until total_count is reached and validates records", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        total_count: 3,
        results: [{ id: 1 }, { id: 2 }],
      })
      .mockResolvedValueOnce({ total_count: 3, results: [{ id: 3 }] });

    await expect(
      fetchAllRecords("https://example.test/records", itemSchema, fetchPage, 2),
    ).resolves.toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("rejects duplicate upstream pages", async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      total_count: 4,
      results: [{ id: 1 }, { id: 2 }],
    });

    await expect(
      fetchAllRecords("https://example.test/records", itemSchema, fetchPage, 2),
    ).rejects.toThrow(/duplicate page/i);
  });
});

describe("fetchJson", () => {
  it("retries transient failures and does not retry a client error", async () => {
    const response = (status: number, body: unknown): Response =>
      ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
      }) as Response;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(503, {}))
      .mockResolvedValueOnce(response(200, { ok: true }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      fetchJson("https://example.test/data", fetchImpl, sleep),
    ).resolves.toEqual({
      ok: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(250);

    const clientError = vi.fn().mockResolvedValue(response(404, {}));
    await expect(
      fetchJson("https://example.test/missing", clientError, sleep),
    ).rejects.toThrow("HTTP 404");
    expect(clientError).toHaveBeenCalledTimes(1);
  });
});
