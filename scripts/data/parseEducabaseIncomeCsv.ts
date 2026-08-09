import { createHash } from "node:crypto";

import type {
  EducabaseIncomeSource,
  EducabaseIncomeTableId,
} from "./educabaseIncomeSources";

export interface ParsedIncomeCell {
  dimensions: Readonly<Record<string, string>>;
  rawValue: string;
}

export interface ParsedIncomeTable {
  tableId: EducabaseIncomeTableId;
  dimensions: readonly { name: string; values: readonly string[] }[];
  note: string;
  cells: readonly ParsedIncomeCell[];
}

const UTF8_BOM = [0xef, 0xbb, 0xbf];
const VALUE_TOKEN = /^(?:\.\.|[0-9]+(?:\.[0-9]{3})*)$/u;
const COHORTS = [
  "2011-2012",
  "2012-2013",
  "2013-2014",
  "2014-2015",
  "2015-2016",
  "2016-2017",
  "2017-2018",
  "2018-2019",
  "2019-2020",
  "2020-2021",
  "2021-2022 (p)",
  "2022-2023 (p)",
] as const;
const PERIODS = [
  "Primer año",
  "Segundo año",
  "Tercer año",
  "Cuarto año",
] as const;
const MEASURES = [
  "Límite inferior segundo quintil",
  "Límite inferior tercer quintil",
  "Media",
  "Límite inferior cuarto quintil",
  "Límite inferior quinto quintil",
] as const;
const DIMENSION_VALUE_HASHES = {
  famprof_2_08:
    "2fb8018686e9ee5d8d31d7a8a1f660c9ff718ded1c3989584043d9eb71f23b94",
  famprof_3_08:
    "da713797bccf4efcf2f78d876f30634378692637df6afa4303b8525feb477dfe",
  ccaa_2_07: "b7fc82abca6c605d2e709a79b3dd8d6501810ac83dd822187f458d5307bea36e",
  ccaa_3_07: "b7fc82abca6c605d2e709a79b3dd8d6501810ac83dd822187f458d5307bea36e",
} as const;

function assertUtf8Bom(bytes: Uint8Array): Uint8Array {
  if (!UTF8_BOM.every((value, index) => bytes[index] === value)) {
    throw new Error("Educabase CSV requires exactly one UTF-8 BOM");
  }
  if (
    bytes.byteLength > 3 &&
    UTF8_BOM.every((value, index) => bytes[index + 3] === value)
  ) {
    throw new Error("Educabase CSV contains more than one UTF-8 BOM");
  }
  return bytes.subarray(3);
}

/** Parses semicolon CSV while allowing escaped quotes and quoted line breaks. */
function parseCsvRecords(text: string): string[][] {
  if (text.includes("\0")) throw new Error("Educabase CSV contains a NUL byte");
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  let afterQuote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index] as string;
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (afterQuote) {
      if (character === ";") {
        record.push(field);
        field = "";
        afterQuote = false;
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        record.push(field);
        records.push(record);
        record = [];
        field = "";
        afterQuote = false;
      } else {
        throw new Error("Educabase CSV has characters after a closing quote");
      }
      continue;
    }
    if (character === '"') {
      if (field.length !== 0)
        throw new Error("Educabase CSV has a malformed quote");
      quoted = true;
    } else if (character === ";") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("Educabase CSV has an unterminated quote");
  if (field.length > 0 || record.length > 0 || afterQuote) {
    record.push(field);
    records.push(record);
  }
  return records.filter((row) => row.length > 1 || row[0] !== "");
}

function assertExactSet(
  name: string,
  actual: readonly string[],
  expected: readonly string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some((value) => !expected.includes(value))
  ) {
    throw new Error(`Educabase CSV has unexpected ${name} dimension values`);
  }
}

export function assertExpectedIncomeDimensions(
  source: EducabaseIncomeSource,
  dimensions: readonly { name: string; values: readonly string[] }[],
): void {
  assertExactSet("cohort", dimensions[0]?.values ?? [], COHORTS);
  const periodIndex = source.scope === "spain_cycle_group" ? 1 : 3;
  const measureIndex = source.scope === "spain_cycle_group" ? 2 : 4;
  assertExactSet("period", dimensions[periodIndex]?.values ?? [], PERIODS);
  assertExactSet("measure", dimensions[measureIndex]?.values ?? [], MEASURES);
  const groupValues = dimensions.at(-1)?.values ?? [];
  if (source.scope === "spain_cycle_group") {
    if (groupValues.length !== source.expectedGroupCount) {
      throw new Error(
        `Educabase CSV has an unexpected cycle-group count for ${source.tableId}`,
      );
    }
  } else {
    if (
      (dimensions[1]?.values.length ?? 0) !== 19 ||
      (dimensions[2]?.values.length ?? 0) !== 3
    ) {
      throw new Error(
        `Educabase CSV has unexpected community or sex dimensions for ${source.tableId}`,
      );
    }
  }
  const fingerprint = createHash("sha256")
    .update(
      dimensions.map((dimension) => dimension.values.join("\0")).join("\x01"),
    )
    .digest("hex");
  if (fingerprint !== DIMENSION_VALUE_HASHES[source.tableId]) {
    throw new Error(
      `Educabase CSV has unexpected exact dimension labels for ${source.tableId}`,
    );
  }
}

export function parseEducabaseIncomeCsv(
  source: EducabaseIncomeSource,
  bytes: Uint8Array,
): ParsedIncomeTable {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      assertUtf8Bom(bytes),
    );
  } catch (error) {
    if (error instanceof Error && /BOM/u.test(error.message)) throw error;
    throw new Error("Educabase CSV is not strict UTF-8", { cause: error });
  }
  if (text.includes("\uFFFD"))
    throw new Error("Educabase CSV contains a replacement character");
  if (text.includes("\uFEFF"))
    throw new Error("Educabase CSV contains an unexpected UTF-8 BOM");
  const records = parseCsvRecords(text);
  const [header, ...rows] = records;
  if (
    !header ||
    header.length !== source.expectedCsvHeader.length ||
    header.some((value, index) => value !== source.expectedCsvHeader[index])
  ) {
    throw new Error(`Educabase CSV header does not match ${source.tableId}`);
  }
  const dimensionNames = header.slice(0, -1);
  const dimensionValues = dimensionNames.map((name) => ({
    name,
    values: [] as string[],
  }));
  const knownCoordinates = new Set<string>();
  const cells: ParsedIncomeCell[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    if (row.length !== header.length)
      throw new Error(
        `Educabase CSV row ${rowIndex + 2} has an unexpected column count`,
      );
    const values = row.slice(0, -1);
    const rawValue = row.at(-1) as string;
    if (!VALUE_TOKEN.test(rawValue)) {
      throw new Error(
        `Educabase CSV row ${rowIndex + 2} has an invalid numeric token`,
      );
    }
    const key = values.join("\0");
    if (knownCoordinates.has(key))
      throw new Error(
        `Educabase CSV has a duplicate coordinate at row ${rowIndex + 2}`,
      );
    knownCoordinates.add(key);
    const dimensions = Object.fromEntries(
      dimensionNames.map((name, index) => [name, values[index] as string]),
    );
    for (const [index, value] of values.entries()) {
      const dimension = dimensionValues[index] as {
        name: string;
        values: string[];
      };
      if (!dimension.values.includes(value as string))
        dimension.values.push(value as string);
    }
    cells.push({ dimensions, rawValue });
  }
  if (cells.length !== source.expectedCellCount) {
    throw new Error(
      `Educabase CSV cell count for ${source.tableId} must be ${source.expectedCellCount}`,
    );
  }
  assertExpectedIncomeDimensions(source, dimensionValues);
  return {
    tableId: source.tableId,
    dimensions: dimensionValues,
    note: "",
    cells,
  };
}
