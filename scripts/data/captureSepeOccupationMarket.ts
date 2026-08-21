import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  SepeOccupationMarketResourceSchema,
  type SepeOccupationMarket,
} from "../../data/schemas/sepeOccupationMarket";
import { parseSepeOccupationMarket } from "./parseSepeOccupationMarket";

const PERIOD_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/u;
const CNO_PATTERN = /^\d{4}$/u;
const SEPE_MARKET_PAGE_BASE =
  "https://www.sepe.es/HomeSepe/es/que-es-observatorio/informacion-mt-por-ocupacion/informacion-mercado-trabajo-por-ocupacion";

export interface SepeOccupationMarketCatalogueEntry {
  code: string;
  label: string;
}

export interface SepeOccupationMarketCatalogueRecord {
  classificationCode: string;
  preferredLabel: string;
  confirmationLabel?: string;
}

export interface SepeOccupationMarketFetchContext {
  occupation: SepeOccupationMarketCatalogueEntry;
  period: string;
  sourceUrl: string;
}

export type SepeOccupationMarketFetchResult =
  | string
  | Response
  | {
      html: string;
      sourceUrl?: string;
      retrievedAt?: string;
    };

export interface CaptureSepeOccupationMarketOptions {
  period: string;
  catalogue: readonly (
    SepeOccupationMarketCatalogueEntry | SepeOccupationMarketCatalogueRecord
  )[];
  outputPath: string;
  fetchPage: (
    context: SepeOccupationMarketFetchContext,
  ) => Promise<SepeOccupationMarketFetchResult>;
  retrievedAt?: string | (() => string);
  sourceUrlFor?: (
    occupation: SepeOccupationMarketCatalogueEntry,
    period: string,
  ) => string;
}

export type SepeOccupationMarketCaptureOptions =
  CaptureSepeOccupationMarketOptions;

interface NormalizedPage {
  html: string;
  sourceUrl: string;
  retrievedAt?: string;
}

function normalizeCatalogueEntry(
  value:
    SepeOccupationMarketCatalogueEntry | SepeOccupationMarketCatalogueRecord,
  index: number,
): SepeOccupationMarketCatalogueEntry {
  const candidate = value as Partial<
    SepeOccupationMarketCatalogueEntry & SepeOccupationMarketCatalogueRecord
  >;
  const code = candidate.code ?? candidate.classificationCode;
  const label =
    candidate.label ?? candidate.preferredLabel ?? candidate.confirmationLabel;
  if (code === undefined || !CNO_PATTERN.test(code)) {
    throw new Error(
      `SEPE occupation market catalogue entry ${index + 1} has an invalid CNO code.`,
    );
  }
  if (label === undefined || label.trim().length === 0) {
    throw new Error(
      `SEPE occupation market catalogue entry ${code} has no occupation label.`,
    );
  }
  return { code, label: label.trim() };
}

function validatePeriod(period: string): void {
  if (!PERIOD_PATTERN.test(period)) {
    throw new Error(`SEPE occupation market period is invalid: ${period}.`);
  }
}

function defaultSourceUrl(
  occupation: SepeOccupationMarketCatalogueEntry,
  period: string,
): string {
  const [year, month] = period.split("-") as [string, string];
  const slug = occupation.label
    .replace(/ñ/giu, "-")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return `${SEPE_MARKET_PAGE_BASE}~_mensuales_${year}_${month}_${occupation.code}-${slug}~.html`;
}

function resolvedRetrievedAt(
  retrievedAt: CaptureSepeOccupationMarketOptions["retrievedAt"],
): string {
  const value =
    typeof retrievedAt === "function"
      ? retrievedAt()
      : (retrievedAt ?? new Date().toISOString());
  if (Number.isNaN(Date.parse(value))) {
    throw new Error("SEPE occupation market retrieval timestamp is invalid.");
  }
  return value;
}

async function normalizeFetchedPage(
  result: SepeOccupationMarketFetchResult,
  context: SepeOccupationMarketFetchContext,
): Promise<NormalizedPage> {
  if (typeof result === "string") {
    return { html: result, sourceUrl: context.sourceUrl };
  }
  if (result instanceof Response) {
    if (!result.ok) {
      throw new Error(
        `SEPE occupation market page unavailable for CNO ${context.occupation.code}: HTTP ${result.status}.`,
      );
    }
    return {
      html: await result.text(),
      sourceUrl: result.url || context.sourceUrl,
    };
  }
  if (result === null || typeof result !== "object") {
    throw new Error(
      `SEPE occupation market fetch returned no page for CNO ${context.occupation.code}.`,
    );
  }
  if (typeof result.html !== "string") {
    throw new Error(
      `SEPE occupation market fetch returned malformed HTML for CNO ${context.occupation.code}.`,
    );
  }
  return {
    html: result.html,
    sourceUrl: result.sourceUrl ?? context.sourceUrl,
    retrievedAt: result.retrievedAt,
  };
}

async function writeValidatedCandidate(
  outputPath: string,
  records: readonly SepeOccupationMarket[],
): Promise<void> {
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${randomUUID()}`;
  const contents = `${JSON.stringify(records, null, 2)}\n`;
  try {
    const handle = await open(temporaryPath, "wx");
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    const written = JSON.parse(
      await readFile(temporaryPath, "utf8"),
    ) as unknown;
    SepeOccupationMarketResourceSchema.parse(written);
    await rename(temporaryPath, outputPath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

export async function captureSepeOccupationMarket(
  options: CaptureSepeOccupationMarketOptions,
): Promise<SepeOccupationMarket[]> {
  validatePeriod(options.period);
  if (!isAbsolute(options.outputPath)) {
    throw new Error("SEPE occupation market output path must be absolute.");
  }
  const catalogue = options.catalogue.map(normalizeCatalogueEntry);
  if (catalogue.length === 0) {
    throw new Error("SEPE occupation market catalogue must not be empty.");
  }
  const seenCodes = new Set<string>();
  for (const occupation of catalogue) {
    if (seenCodes.has(occupation.code)) {
      throw new Error(
        `SEPE occupation market catalogue contains duplicate CNO ${occupation.code}.`,
      );
    }
    seenCodes.add(occupation.code);
  }

  const retrieveAt = resolvedRetrievedAt(options.retrievedAt);
  const sourceUrlFor = options.sourceUrlFor ?? defaultSourceUrl;
  const records: SepeOccupationMarket[] = [];
  for (const occupation of catalogue) {
    const sourceUrl = sourceUrlFor(occupation, options.period);
    let fetched: SepeOccupationMarketFetchResult;
    try {
      fetched = await options.fetchPage({
        occupation,
        period: options.period,
        sourceUrl,
      });
    } catch (error) {
      throw new Error(
        `SEPE occupation market capture failed for CNO ${occupation.code}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    let page: NormalizedPage;
    try {
      page = await normalizeFetchedPage(fetched, {
        occupation,
        period: options.period,
        sourceUrl,
      });
    } catch (error) {
      throw new Error(
        `SEPE occupation market capture failed for CNO ${occupation.code}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
    try {
      const record = parseSepeOccupationMarket(page.html, {
        expectedCnoCode: occupation.code,
        sourceUrl: page.sourceUrl,
        retrievedAt: page.retrievedAt ?? retrieveAt,
      });
      if (record.period !== options.period) {
        throw new Error(
          `SEPE occupation market page period ${record.period} does not match requested period ${options.period}.`,
        );
      }
      records.push(record);
    } catch (error) {
      throw new Error(
        `SEPE occupation market capture failed for CNO ${occupation.code}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }

  records.sort((left, right) => left.cno.code.localeCompare(right.cno.code));
  const validated = SepeOccupationMarketResourceSchema.parse(records);
  const candidateCodes = new Set(validated.map((record) => record.cno.code));
  const missingCodes = catalogue
    .map((occupation) => occupation.code)
    .filter((code) => !candidateCodes.has(code));
  if (missingCodes.length > 0) {
    throw new Error(
      `SEPE occupation market capture has incomplete CNO coverage: ${missingCodes.join(", ")}.`,
    );
  }

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeValidatedCandidate(resolve(options.outputPath), validated);
  return validated;
}

interface CliArguments {
  period: string;
  cataloguePath: string;
  outputPath: string;
}

function cliArguments(argv: readonly string[]): CliArguments {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument?.startsWith("--")) {
      throw new Error(`Unknown argument: ${argument ?? ""}.`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${argument}.`);
    }
    values.set(argument.slice(2), value);
    index += 1;
  }
  const period = values.get("period");
  const cataloguePath = values.get("catalogue");
  if (period === undefined || cataloguePath === undefined) {
    throw new Error(
      "Usage: captureSepeOccupationMarket --period YYYY-MM --catalogue path [--output path].",
    );
  }
  return {
    period,
    cataloguePath: resolve(cataloguePath),
    outputPath: resolve(
      values.get("output") ?? "data/curated/sepe-occupation-market.json",
    ),
  };
}

async function runCli(argv: readonly string[]): Promise<void> {
  const args = cliArguments(argv);
  const catalogue = JSON.parse(
    await readFile(args.cataloguePath, "utf8"),
  ) as unknown;
  if (!Array.isArray(catalogue)) {
    throw new Error("SEPE occupation market catalogue must be a JSON array.");
  }
  await captureSepeOccupationMarket({
    period: args.period,
    catalogue: catalogue as SepeOccupationMarketCatalogueRecord[],
    outputPath: args.outputPath,
    fetchPage: async ({ sourceUrl }) => {
      const response = await fetch(sourceUrl);
      return response;
    },
  });
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  await runCli(process.argv.slice(2));
}
