import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  GeneratedDataError,
  loadGeneratedResource,
} from "./generatedDataClient";

const manifestSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  qualityStatus: z.enum(["passed", "stale"]),
});

function response(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("loadGeneratedResource", () => {
  it("validates a stale manifest instead of silently rejecting it", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        response(200, { schemaVersion: "1.0.0", qualityStatus: "stale" }),
      );

    await expect(
      loadGeneratedResource(
        "/data/v1/manifest.json",
        manifestSchema,
        fetchImpl,
      ),
    ).resolves.toEqual({ schemaVersion: "1.0.0", qualityStatus: "stale" });
  });

  it.each([
    [404, "missing"],
    [500, "network"],
  ] as const)("classifies HTTP %s as %s", async (status, code) => {
    await expect(
      loadGeneratedResource(
        "/data/v1/manifest.json",
        manifestSchema,
        vi.fn().mockResolvedValue(response(status, {})),
      ),
    ).rejects.toMatchObject({
      code,
    } satisfies Partial<GeneratedDataError>);
  });

  it("classifies malformed JSON and schema data", async () => {
    const invalidJson = vi.fn().mockResolvedValue({
      ...response(200, {}),
      json: async () => {
        throw new Error("invalid");
      },
    });
    await expect(
      loadGeneratedResource(
        "/data/v1/manifest.json",
        manifestSchema,
        invalidJson,
      ),
    ).rejects.toMatchObject({ code: "schema" });

    await expect(
      loadGeneratedResource(
        "/data/v1/manifest.json",
        manifestSchema,
        vi.fn().mockResolvedValue(response(200, { schemaVersion: "0.0.0" })),
      ),
    ).rejects.toMatchObject({ code: "schema" });
  });
});
