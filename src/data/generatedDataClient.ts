import type { z } from "zod";

import {
  GeneratedManifestSchema,
  type GeneratedManifest,
} from "../../data/schemas/generated";

export type GeneratedDataErrorCode = "network" | "schema" | "missing";

export class GeneratedDataError extends Error {
  readonly code: GeneratedDataErrorCode;

  constructor(code: GeneratedDataErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GeneratedDataError";
    this.code = code;
  }
}

function validatedGeneratedAssetPath(path: string): string {
  if (
    path.trim().length === 0 ||
    /^[a-z][a-z\d+.-]*:/iu.test(path) ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    throw new GeneratedDataError(
      "missing",
      `Generated resource path must be same-origin and relative: ${path}.`,
    );
  }

  const origin = globalThis.location?.origin ?? "http://localhost";
  const url = new URL(path, `${origin}/`);
  if (
    url.origin !== origin ||
    !url.pathname.startsWith("/data/v1/") ||
    url.search.length > 0 ||
    url.hash.length > 0
  ) {
    throw new GeneratedDataError(
      "missing",
      `Generated resource path is outside /data/v1: ${path}.`,
    );
  }

  return url.pathname;
}

/** Fetches a generated static asset and enforces its runtime contract. */
export async function loadGeneratedResource<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const assetPath = validatedGeneratedAssetPath(path);
  let response: Response;

  try {
    response = await fetch(assetPath);
  } catch (error) {
    throw new GeneratedDataError(
      "network",
      `Could not fetch generated resource: ${assetPath}.`,
      error,
    );
  }

  if (!response.ok) {
    const code = response.status === 404 ? "missing" : "network";
    throw new GeneratedDataError(
      code,
      `Generated resource request failed with HTTP ${response.status}: ${assetPath}.`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource is not valid JSON: ${assetPath}.`,
      error,
    );
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource failed schema validation: ${assetPath}.`,
      result.error,
    );
  }

  return result.data;
}

export function loadManifest(): Promise<GeneratedManifest> {
  return loadGeneratedResource(
    "/data/v1/manifest.json",
    GeneratedManifestSchema,
  );
}
