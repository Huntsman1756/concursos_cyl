import {
  EDUCABASE_INCOME_SOURCES,
  EDUCABASE_INCOME_TABLE_IDS,
  type EducabaseIncomeFormat,
  type EducabaseIncomeSource,
} from "./educabaseIncomeSources";
import {
  fetchOfficialBinary,
  type BinaryRequest,
  type RawArtifactProvenance,
  type Sleep,
} from "./fetchOfficialBinary";
import {
  parseEducabaseIncomeCsv,
  type ParsedIncomeTable,
} from "./parseEducabaseIncomeCsv";
import { parseEducabaseIncomePx } from "./parseEducabaseIncomePx";
import { assertEquivalentIncomeTables } from "./reconcileEducabaseIncome";

export interface VerifiedIncomeTable {
  table: ParsedIncomeTable;
  artifacts: readonly [RawArtifactProvenance, RawArtifactProvenance];
}

export interface EducabaseIncomeBundle {
  tables: readonly VerifiedIncomeTable[];
  artifacts: readonly RawArtifactProvenance[];
}

interface DownloadedArtifact {
  source: EducabaseIncomeSource;
  format: EducabaseIncomeFormat;
  bytes: Uint8Array;
  provenance: RawArtifactProvenance;
}

async function boundedMap<T, Result>(
  values: readonly T[],
  limit: number,
  map: (value: T) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(values.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (true) {
      const index = next;
      next += 1;
      if (index >= values.length) return;
      results[index] = await map(values[index] as T);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return results;
}

/** Downloads and cross-verifies every allowlisted official income table. */
export async function loadEducabaseIncomeBundle(
  options: {
    fetchedAt?: string;
    request?: BinaryRequest;
    sleep?: Sleep;
  } = {},
): Promise<EducabaseIncomeBundle> {
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const tasks = EDUCABASE_INCOME_TABLE_IDS.flatMap((tableId) => {
    const source = EDUCABASE_INCOME_SOURCES[tableId];
    return (["csv", "px"] as const).map((format) => ({ source, format }));
  });
  const downloaded = await boundedMap(
    tasks,
    4,
    async ({ source, format }): Promise<DownloadedArtifact> => {
      const result = await fetchOfficialBinary(
        source,
        format,
        fetchedAt,
        options.request,
        options.sleep,
      );
      return { source, format, ...result };
    },
  );
  const tables = EDUCABASE_INCOME_TABLE_IDS.map((tableId) => {
    const csv = downloaded.find(
      (artifact) =>
        artifact.source.tableId === tableId && artifact.format === "csv",
    );
    const px = downloaded.find(
      (artifact) =>
        artifact.source.tableId === tableId && artifact.format === "px",
    );
    if (!csv || !px)
      throw new Error(`Educabase income bundle is incomplete for ${tableId}`);
    const parsedCsv = parseEducabaseIncomeCsv(csv.source, csv.bytes);
    const parsedPx = parseEducabaseIncomePx(px.source, px.bytes);
    assertEquivalentIncomeTables(parsedCsv, parsedPx);
    return {
      table: { ...parsedCsv, note: parsedPx.note },
      artifacts: [csv.provenance, px.provenance] as const,
    };
  });
  return { tables, artifacts: tables.flatMap((table) => table.artifacts) };
}
