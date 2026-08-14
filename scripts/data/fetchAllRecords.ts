import { z } from "zod";
import { fetchJson, type FetchLike } from "./fetchJson";

interface RecordsPage<T> {
  total_count: number;
  results: T[];
}

type PageFetcher = <T>(url: string, fetchImpl?: FetchLike) => Promise<T>;

function pageSignature<T>(page: RecordsPage<T>): string {
  return JSON.stringify(page.results);
}

export async function fetchAllRecords<T>(
  baseUrl: string,
  schema: z.ZodType<T>,
  fetchPage: PageFetcher = fetchJson,
  pageSize = 100,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new Error("pageSize must be a positive integer");
  }

  const records: T[] = [];
  const seenPages = new Set<string>();
  let offset = 0;
  let totalCount = Number.POSITIVE_INFINITY;

  while (offset < totalCount) {
    const url = new URL(baseUrl);
    url.searchParams.set("limit", String(pageSize));
    url.searchParams.set("offset", String(offset));

    const page = await fetchPage<RecordsPage<unknown>>(url.toString());
    if (!Number.isInteger(page.total_count) || page.total_count < 0) {
      throw new Error("Upstream page has an invalid total_count");
    }
    if (!Array.isArray(page.results)) {
      throw new Error("Upstream page has invalid results");
    }

    totalCount = page.total_count;
    const signature = pageSignature(page);
    if (seenPages.has(signature) && page.results.length > 0) {
      throw new Error(`Upstream returned a duplicate page at offset ${offset}`);
    }
    seenPages.add(signature);

    for (const record of page.results) {
      records.push(schema.parse(record));
    }

    if (page.results.length === 0 && records.length < totalCount) {
      throw new Error("Upstream ended before total_count was reached");
    }
    offset += page.results.length;

    if (page.results.length > 0 && offset >= totalCount) {
      break;
    }
  }

  return records;
}
