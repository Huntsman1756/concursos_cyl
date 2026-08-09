import { createHash } from "node:crypto";

import type {
  EducabaseIncomeFormat,
  EducabaseIncomeSource,
  EducabaseIncomeTableId,
} from "./educabaseIncomeSources";
import { EDUCABASE_INCOME_SOURCES } from "./educabaseIncomeSources";

const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const RETRY_DELAYS_MS = [250, 750, 1500] as const;
const OFFICIAL_HOST = "estadisticas.educacion.gob.es";

export type BinaryRequest = (
  input: string,
  init: RequestInit,
) => Promise<Response>;
export type Sleep = (delayMs: number) => Promise<void>;

export interface RawArtifactProvenance {
  tableId: EducabaseIncomeTableId;
  format: EducabaseIncomeFormat;
  sourceUrl: string;
  catalogUrl: string;
  fetchedAt: string;
  declaredContentType: string;
  byteLength: number;
  sha256: string;
  effectiveEncoding: "utf-8" | "iso-8859-15";
}

const wait: Sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

function selectedUrl(
  source: EducabaseIncomeSource,
  format: EducabaseIncomeFormat,
): string {
  return format === "csv" ? source.csvUrl : source.pxUrl;
}

function assertAllowlistedUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== OFFICIAL_HOST) {
    throw new Error(
      `Official income source must use HTTPS on ${OFFICIAL_HOST}`,
    );
  }
  if (
    parsed.search !== "?nocab=1" ||
    parsed.hash ||
    !parsed.pathname.includes("/files/_px/es/")
  ) {
    throw new Error(
      `Official income source URL is not an exact allowlisted download: ${url}`,
    );
  }
  return parsed;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function looksLikeHtml(bytes: Uint8Array): boolean {
  const prefix = new TextDecoder("ascii", { fatal: false })
    .decode(bytes.subarray(0, Math.min(bytes.byteLength, 512)))
    .replace(/^\s+/u, "")
    .toLowerCase();
  return (
    prefix.startsWith("<!doctype html") ||
    prefix.startsWith("<html") ||
    prefix.startsWith("<head")
  );
}

async function readBoundedBody(response: Response): Promise<Uint8Array> {
  if (!response.body)
    throw new Error("Official income response has an empty body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      byteLength += value.byteLength;
      if (byteLength > MAX_BYTES) {
        await reader.cancel("Income response exceeds 5 MiB");
        throw new Error("Official income response exceeds the 5 MiB limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (byteLength === 0)
    throw new Error("Official income response has an empty body");
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function assertFinalUrl(response: Response, sourceUrl: string): void {
  const finalUrl = response.url || sourceUrl;
  const selected = assertAllowlistedUrl(sourceUrl);
  const final = assertAllowlistedUrl(finalUrl);
  if (final.href !== selected.href) {
    throw new Error(
      `Official income response final URL does not match allowlisted URL: ${final.href}`,
    );
  }
}

/** Fetches raw, bounded official bytes without trusting server-provided decoding. */
export async function fetchOfficialBinary(
  source: EducabaseIncomeSource,
  format: EducabaseIncomeFormat,
  fetchedAt: string,
  request: BinaryRequest = globalThis.fetch,
  sleep: Sleep = wait,
): Promise<{ bytes: Uint8Array; provenance: RawArtifactProvenance }> {
  const sourceUrl = selectedUrl(source, format);
  assertAllowlistedUrl(sourceUrl);
  const approvedSource = EDUCABASE_INCOME_SOURCES[source.tableId];
  if (
    sourceUrl !== selectedUrl(approvedSource, format) ||
    source.catalogUrl !== approvedSource.catalogUrl
  ) {
    throw new Error(
      `Official income source URL does not match the closed allowlist for ${source.tableId}`,
    );
  }
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await request(sourceUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(
          `Official income request failed with HTTP ${response.status}`,
        );
        if (!isRetryableStatus(response.status)) throw error;
        lastError = error;
      } else {
        assertFinalUrl(response, sourceUrl);
        const bytes = await readBoundedBody(response);
        if (
          looksLikeHtml(bytes) ||
          response.headers
            .get("content-type")
            ?.toLowerCase()
            .includes("text/html")
        ) {
          throw new Error(
            "Official income response unexpectedly contains HTML",
          );
        }
        return {
          bytes,
          provenance: {
            tableId: source.tableId,
            format,
            sourceUrl,
            catalogUrl: source.catalogUrl,
            fetchedAt,
            declaredContentType:
              response.headers.get("content-type") ?? "unknown",
            byteLength: bytes.byteLength,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            effectiveEncoding: format === "csv" ? "utf-8" : "iso-8859-15",
          },
        };
      }
    } catch (error) {
      lastError = error;
      if (
        error instanceof Error &&
        !/^Official income request failed with HTTP (429|5\d\d)$/u.test(
          error.message,
        )
      ) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
    if (attempt === RETRY_DELAYS_MS.length) break;
    await sleep(RETRY_DELAYS_MS[attempt]);
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Official income request failed after retries");
}
