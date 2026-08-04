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

/** Fetches a generated static asset and enforces its runtime contract. */
export async function loadGeneratedResource<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path);
  } catch (error) {
    throw new GeneratedDataError(
      "network",
      `Could not fetch generated resource: ${path}.`,
      error,
    );
  }

  if (!response.ok) {
    const code = response.status === 404 ? "missing" : "network";
    throw new GeneratedDataError(
      code,
      `Generated resource request failed with HTTP ${response.status}: ${path}.`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource is not valid JSON: ${path}.`,
      error,
    );
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource failed schema validation: ${path}.`,
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
