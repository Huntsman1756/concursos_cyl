import { z } from "zod";

import { fetchJson } from "./fetchJson";

const DEFAULT_PAGE_SIZE = 100;

const OpenDataSoftPageSchema = z
  .object({
    total_count: z.number().int().nonnegative(),
    results: z.array(z.unknown()),
  })
  .passthrough();

export type FetchPage = (url: string) => Promise<unknown>;

function pageUrl(recordsUrl: string, limit: number, offset: number): string {
  const url = new URL(recordsUrl);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "undefined";
}

function pageFingerprint(results: unknown[]): string {
  return results.map(canonicalJson).sort().join("\n");
}

/**
 * Fetches every page exposed by an OpenDataSoft records endpoint.
 */
export async function fetchAllRecords<T>(
  recordsUrl: string,
  schema: z.ZodType<T>,
  fetchPage: FetchPage = (url) => fetchJson(url, OpenDataSoftPageSchema),
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error("OpenDataSoft page size must be a positive integer");
  }

  const records: T[] = [];
  const seenPages = new Set<string>();
  let totalCount: number | undefined;

  while (totalCount === undefined || records.length < totalCount) {
    const page = OpenDataSoftPageSchema.parse(
      await fetchPage(pageUrl(recordsUrl, pageSize, records.length)),
    );

    if (totalCount === undefined) {
      totalCount = page.total_count;
    } else if (page.total_count !== totalCount) {
      throw new Error("Official dataset total_count changed during pagination");
    }

    const fingerprint = pageFingerprint(page.results);
    if (seenPages.has(fingerprint)) {
      throw new Error("Official dataset returned a repeated page");
    }
    seenPages.add(fingerprint);

    if (page.results.length === 0 && records.length < totalCount) {
      throw new Error(
        "Official dataset returned an empty page before total_count",
      );
    }

    records.push(...page.results.map((record) => schema.parse(record)));

    if (records.length > totalCount) {
      throw new Error(
        "Official dataset returned more records than total_count",
      );
    }
  }

  return records;
}
