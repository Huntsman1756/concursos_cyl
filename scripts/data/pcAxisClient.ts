import { fetchJson, type FetchLike } from "./fetchJson";

export interface PcAxisMetadata {
  id: string[];
  size: number[];
  dimension: Record<
    string,
    {
      category: {
        index: Record<string, number> | string[];
        label?: Record<string, string>;
      };
    }
  >;
}

export interface PcAxisQuery {
  query: Array<{
    code: string;
    selection: { filter: "item"; values: string[] };
  }>;
  response: { format: "json-stat2" };
}

export interface PcAxisDataset {
  sourceId: string;
  scope: string;
  dimensions: string[];
  size: number[];
  dimension: Record<string, unknown>;
  value: Array<number | null>;
}

const keyToDimension: Record<string, string[]> = {
  cohort: ["cohorte", "cohort"],
  period: ["periodo", "period"],
  measure: ["medida", "measure"],
};

function categoryValues(metadata: PcAxisMetadata, code: string): string[] {
  const index = metadata.dimension[code]?.category.index;
  return Array.isArray(index) ? index : Object.keys(index ?? {});
}

function dimensionForKey(metadata: PcAxisMetadata, key: string): string {
  const normalized = key.toLocaleLowerCase("es");
  const code = metadata.id.find((candidate) =>
    (keyToDimension[normalized] ?? [normalized]).includes(
      candidate.toLocaleLowerCase("es"),
    ),
  );
  if (!code) throw new Error(`Unknown PC-Axis dimension: ${key}`);
  return code;
}

export function buildPcAxisQuery(
  metadata: PcAxisMetadata,
  selection: Record<string, string[]>,
): PcAxisQuery {
  const query = Object.entries(selection).map(([key, values]) => {
    const code = dimensionForKey(metadata, key);
    const available = categoryValues(metadata, code);
    for (const value of values) {
      if (!available.includes(value)) {
        throw new Error(`Unknown dimension value for ${code}: ${value}`);
      }
    }
    return {
      code,
      selection: { filter: "item" as const, values },
    };
  });
  return { query, response: { format: "json-stat2" } };
}

function validateResponse(
  source: { id: string; scope: string },
  metadata: PcAxisMetadata,
  response: unknown,
): PcAxisDataset {
  const value = response as {
    id?: unknown;
    size?: unknown;
    dimension?: Record<string, unknown>;
    value?: unknown;
  };
  if (
    !Array.isArray(value.id) ||
    value.id.some((item) => typeof item !== "string") ||
    value.id.join("|") !== metadata.id.join("|")
  ) {
    throw new Error(`PC-Axis response dimensions changed for ${source.id}`);
  }
  if (
    !Array.isArray(value.size) ||
    value.size.some((item) => !Number.isInteger(item))
  ) {
    throw new Error(`Invalid PC-Axis response size for ${source.id}`);
  }
  const size = value.size as number[];
  const cellCount = size.reduce((total, item) => total * item, 1);
  if (cellCount > 100_000) {
    throw new Error(`PC-Axis response exceeds cell limit for ${source.id}`);
  }
  if (!Array.isArray(value.value) || value.value.length !== cellCount) {
    throw new Error(`Invalid PC-Axis values for ${source.id}`);
  }
  return {
    sourceId: source.id,
    scope: source.scope,
    dimensions: value.id,
    size,
    dimension: (value.dimension ?? {}) as Record<string, unknown>,
    value: value.value as Array<number | null>,
  };
}

export async function fetchPcAxisTable(
  source: { id: string; apiUrl: string; scope: string },
  selection: Record<string, string[]>,
  fetchImpl: FetchLike = fetch,
): Promise<PcAxisDataset> {
  const metadata = await fetchJson<PcAxisMetadata>(source.apiUrl, fetchImpl);
  const query = buildPcAxisQuery(metadata, selection);
  const response = await fetchImpl(source.apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${source.id}`);
  return validateResponse(source, metadata, await response.json());
}
