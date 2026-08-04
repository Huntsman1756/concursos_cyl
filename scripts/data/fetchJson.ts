import { z } from "zod";

const RETRY_DELAYS_MS = [250, 750, 1500] as const;

type FetchResponse = Pick<Response, "json" | "ok" | "status">;

export type JsonRequest = (url: string) => Promise<FetchResponse>;
export type Sleep = (delayMs: number) => Promise<void>;

const wait: Sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const requestJson: JsonRequest = (url) => globalThis.fetch(url);

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function httpError(status: number): Error {
  return new Error(`Official dataset request failed with HTTP ${status}`);
}

/**
 * Fetches and schema-validates JSON from an official source.
 * Network failures and temporary HTTP responses are retried at most three times.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  request: JsonRequest = requestJson,
  sleep: Sleep = wait,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    let response: FetchResponse;

    try {
      response = await request(url);
    } catch (error) {
      lastError = error;

      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      throw error;
    }

    if (response.ok) {
      return schema.parse(await response.json());
    }

    const error = httpError(response.status);
    if (!isRetryableStatus(response.status)) {
      throw error;
    }

    lastError = error;
    if (attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Official dataset request failed after retries");
}
