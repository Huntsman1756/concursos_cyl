import { createHash } from "node:crypto";

import type { EducabaseIncomeSource } from "./educabaseIncomeSources";
import {
  assertExpectedIncomeDimensions,
  type ParsedIncomeCell,
  type ParsedIncomeTable,
} from "./parseEducabaseIncomeCsv";

type Token =
  | { kind: "bare"; value: string }
  | { kind: "string"; value: string }
  | { kind: "punctuation"; value: "(" | ")" | "=" | "," | ";" };

const DATA_TOKEN = /^(?:\.\.|[0-9]+(?:\.[0-9]+)?)$/u;
const ALLOWED_METADATA = new Set([
  "AXIS-VERSION",
  "CREATION-DATE",
  "CHARSET",
  "SUBJECT-AREA",
  "SUBJECT-CODE",
  "MATRIX",
  "TITLE",
  "CONTENTS",
  "CODEPAGE",
  "DESCRIPTION",
  "COPYRIGHT",
  "NOTE",
  "DECIMALS",
  "SHOWDECIMALS",
  "SOURCE",
  "UNITS",
  "STUB",
  "HEADING",
  "VALUES",
  "DATA",
]);
const EXPECTED_SOURCE =
  "\u00a0S.G. de Estadística y Estudios del Ministerio de Educación,  Formación Profesional  y Deportes";
const EXPECTED_UNITS = "\u00a0Euros";
const NOTE_HASHES = {
  famprof_2_08:
    "aec68e41822b32b81a03ea364ba42f4fc9c99da88b7e07d5a04aabccdd169fcc",
  famprof_3_08:
    "1ddba36926ae0918ca5fdf4d3090343fa77e4ed83fdfc86889e14254eb10599e",
  ccaa_2_07: "878d22bb31b04287852c4ea82868ff9244ae3b7a4c534f1b65e228b7d548390c",
  ccaa_3_07: "5a17e47ad31a102aa51f7beb1cd2bbe5339c79afd7605ba371644dc25dc90fb8",
} as const;

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (let index = 0; index < text.length;) {
    const character = text[index] as string;
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }
    if ("()=,;".includes(character)) {
      tokens.push({
        kind: "punctuation",
        value: character as "(" | ")" | "=" | "," | ";",
      });
      index += 1;
      continue;
    }
    if (character === '"') {
      let value = "";
      index += 1;
      let closed = false;
      while (index < text.length) {
        const next = text[index] as string;
        if (next === '"') {
          if (text[index + 1] === '"') {
            value += '"';
            index += 2;
            continue;
          }
          index += 1;
          closed = true;
          break;
        }
        value += next;
        index += 1;
      }
      if (!closed)
        throw new Error("Educabase PX has an unterminated quoted string");
      tokens.push({ kind: "string", value });
      continue;
    }
    let value = "";
    while (
      index < text.length &&
      !/\s/u.test(text[index] as string) &&
      !'()=,;"'.includes(text[index] as string)
    ) {
      value += text[index] as string;
      index += 1;
    }
    if (!value) throw new Error("Educabase PX has an unsupported token");
    tokens.push({ kind: "bare", value });
  }
  return tokens;
}

function takePunctuation(
  tokens: readonly Token[],
  position: { value: number },
  expected: Token["value"],
): void {
  const token = tokens[position.value];
  if (token?.kind !== "punctuation" || token.value !== expected) {
    throw new Error(`Educabase PX expected '${expected}'`);
  }
  position.value += 1;
}

function takeString(
  tokens: readonly Token[],
  position: { value: number },
): string {
  const token = tokens[position.value];
  if (token?.kind !== "string")
    throw new Error("Educabase PX expected a quoted string");
  position.value += 1;
  return token.value;
}

function parseStringList(
  tokens: readonly Token[],
  position: { value: number },
  permitConcatenation = false,
): string[] {
  const values = [takeString(tokens, position)];
  while (true) {
    const next = tokens[position.value];
    if (next?.kind === "punctuation" && next.value === ",") {
      position.value += 1;
      values.push(takeString(tokens, position));
      continue;
    }
    if (permitConcatenation && next?.kind === "string") {
      values[values.length - 1] =
        `${values.at(-1) as string}${takeString(tokens, position)}`;
      continue;
    }
    break;
  }
  return values;
}

function productLength(
  dimensions: readonly { values: readonly string[] }[],
): number {
  return dimensions.reduce(
    (total, dimension) => total * dimension.values.length,
    1,
  );
}

function assertMetadata(
  metadata: ReadonlyMap<string, readonly string[]>,
): void {
  if (metadata.get("AXIS-VERSION")?.[0] !== "2006")
    throw new Error('Educabase PX requires AXIS-VERSION="2006"');
  if (metadata.get("CHARSET")?.[0] !== "ANSI")
    throw new Error('Educabase PX requires CHARSET="ANSI"');
  if (metadata.get("CODEPAGE")?.[0] !== "iso-8859-15")
    throw new Error('Educabase PX requires CODEPAGE="iso-8859-15"');
  if (metadata.get("UNITS")?.[0] !== EXPECTED_UNITS)
    throw new Error(`Educabase PX requires UNITS="${EXPECTED_UNITS}"`);
  if (metadata.get("SOURCE")?.[0] !== EXPECTED_SOURCE)
    throw new Error(
      "Educabase PX SOURCE does not match the approved source contract",
    );
  if (metadata.get("DECIMALS")?.[0] !== "2")
    throw new Error('Educabase PX requires DECIMALS="2"');
  if (metadata.get("SHOWDECIMALS")?.[0] !== "0")
    throw new Error('Educabase PX requires SHOWDECIMALS="0"');
}

export function parseEducabaseIncomePx(
  source: EducabaseIncomeSource,
  bytes: Uint8Array,
): ParsedIncomeTable {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    throw new Error("Educabase PX must not contain a UTF-8 BOM");
  }
  let text: string;
  try {
    text = new TextDecoder("iso-8859-15", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error("Educabase PX is not valid ISO-8859-15", { cause: error });
  }
  const tokens = tokenize(text);
  const position = { value: 0 };
  const metadata = new Map<string, string[]>();
  const values = new Map<string, string[]>();
  let stub: string[] | undefined;
  let heading: string[] | undefined;
  let rawData: string[] | undefined;
  while (position.value < tokens.length) {
    const keyToken = tokens[position.value];
    if (keyToken?.kind !== "bare" || !ALLOWED_METADATA.has(keyToken.value)) {
      throw new Error(
        "Educabase PX has an unknown keyword in a structural position",
      );
    }
    const key = keyToken.value;
    position.value += 1;
    let valueName: string | undefined;
    if (key === "VALUES") {
      takePunctuation(tokens, position, "(");
      valueName = takeString(tokens, position);
      takePunctuation(tokens, position, ")");
    }
    takePunctuation(tokens, position, "=");
    if (key === "DATA") {
      if (rawData)
        throw new Error("Educabase PX has duplicate DATA declarations");
      const tokensForData: string[] = [];
      while (
        tokens[position.value]?.kind !== "punctuation" ||
        (tokens[position.value] as Token).value !== ";"
      ) {
        const token = tokens[position.value];
        if (!token)
          throw new Error("Educabase PX DATA is missing its terminator");
        if (token.kind === "punctuation")
          throw new Error("Educabase PX DATA has an invalid separator");
        if (!DATA_TOKEN.test(token.value))
          throw new Error("Educabase PX has an invalid DATA token");
        tokensForData.push(token.value);
        position.value += 1;
      }
      takePunctuation(tokens, position, ";");
      rawData = tokensForData;
      continue;
    }
    const next = tokens[position.value];
    let parsed: string[];
    if (next?.kind === "string") {
      parsed = parseStringList(tokens, position, key === "NOTE");
    } else if (next?.kind === "bare") {
      parsed = [next.value];
      position.value += 1;
    } else {
      throw new Error(`Educabase PX ${key} has no value`);
    }
    takePunctuation(tokens, position, ";");
    if (key === "VALUES") {
      if (!valueName || values.has(valueName))
        throw new Error("Educabase PX has duplicate VALUES dimensions");
      values.set(valueName, parsed);
    } else if (key === "STUB") {
      if (stub) throw new Error("Educabase PX has duplicate STUB declarations");
      stub = parsed;
    } else if (key === "HEADING") {
      if (heading)
        throw new Error("Educabase PX has duplicate HEADING declarations");
      heading = parsed;
    } else {
      if (metadata.has(key))
        throw new Error(`Educabase PX has duplicate ${key} declarations`);
      metadata.set(key, parsed);
    }
  }
  assertMetadata(metadata);
  if (!stub || !heading || !rawData)
    throw new Error("Educabase PX lacks STUB, HEADING, or DATA");
  const dimensionNames = [...stub, ...heading];
  const expectedStubLength = source.scope === "spain_cycle_group" ? 3 : 2;
  if (
    stub.length !== expectedStubLength ||
    heading.length !== dimensionNames.length - expectedStubLength
  ) {
    throw new Error(
      `Educabase PX STUB/HEADING placement does not match ${source.tableId}`,
    );
  }
  const expectedNames = source.expectedCsvHeader.slice(0, -1);
  if (
    dimensionNames.length !== expectedNames.length ||
    dimensionNames.some((name, index) => name !== expectedNames[index])
  ) {
    throw new Error(`Educabase PX dimensions do not match ${source.tableId}`);
  }
  const dimensions = dimensionNames.map((name) => {
    const dimensionValues = values.get(name);
    if (!dimensionValues?.length)
      throw new Error(`Educabase PX has no VALUES for ${name}`);
    return { name, values: dimensionValues };
  });
  if (values.size !== dimensionNames.length) {
    throw new Error(
      `Educabase PX VALUES keys do not exactly match ${source.tableId}`,
    );
  }
  for (const dimension of dimensions) {
    if (new Set(dimension.values).size !== dimension.values.length) {
      throw new Error(`Educabase PX has duplicate labels in ${dimension.name}`);
    }
  }
  assertExpectedIncomeDimensions(source, dimensions);
  const cardinality = productLength(dimensions);
  if (
    cardinality !== source.expectedCellCount ||
    rawData.length !== cardinality
  ) {
    throw new Error(
      `Educabase PX DATA cardinality for ${source.tableId} must be ${source.expectedCellCount}`,
    );
  }
  const cells: ParsedIncomeCell[] = rawData.map((rawValue, cellIndex) => {
    let remainder = cellIndex;
    const coordinate = new Array<string>(dimensions.length);
    for (let index = dimensions.length - 1; index >= 0; index -= 1) {
      const dimension = dimensions[index] as {
        name: string;
        values: readonly string[];
      };
      coordinate[index] = dimension.values[
        remainder % dimension.values.length
      ] as string;
      remainder = Math.floor(remainder / dimension.values.length);
    }
    return {
      dimensions: Object.fromEntries(
        dimensionNames.map((name, index) => [
          name,
          coordinate[index] as string,
        ]),
      ),
      rawValue,
    };
  });
  const note = metadata.get("NOTE")?.join("") ?? "";
  if (
    createHash("sha256").update(note).digest("hex") !==
    NOTE_HASHES[source.tableId]
  ) {
    throw new Error(
      `Educabase PX note does not match the approved contract for ${source.tableId}`,
    );
  }
  return { tableId: source.tableId, dimensions, note, cells };
}
