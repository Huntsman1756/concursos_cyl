import { z } from "zod";

export type GeneratedDataErrorCode = "network" | "schema" | "missing";

export class GeneratedDataError extends Error {
  constructor(
    public readonly code: GeneratedDataErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GeneratedDataError";
  }
}

export async function loadGeneratedResource<T>(
  path: string,
  schema: z.ZodType<T>,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(path, {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new GeneratedDataError(
      "network",
      `Could not load generated resource ${path}`,
      { cause: error },
    );
  }

  if (response.status === 404) {
    throw new GeneratedDataError(
      "missing",
      `Generated resource is missing: ${path}`,
    );
  }
  if (!response.ok) {
    throw new GeneratedDataError(
      "network",
      `Generated resource returned HTTP ${response.status}: ${path}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource is not valid JSON: ${path}`,
      { cause: error },
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource does not match its schema: ${path}`,
      { cause: parsed.error },
    );
  }
  return parsed.data;
}
