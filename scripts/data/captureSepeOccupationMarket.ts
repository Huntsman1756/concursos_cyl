import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  isCanonicalSepeOccupationMarketUrl,
  SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
  SepeOccupationMarketResourceSchema,
  type SepeOccupationMarket,
  type SepeOccupationMarketResource,
} from "../../data/schemas/sepeOccupationMarket";
import { parseSepeOccupationMarket } from "./parseSepeOccupationMarket";
import {
  resolveSepeOccupationMarketPage,
  type SepeOccupationMarketResolution,
} from "./resolveSepeOccupationMarketUrl";

const PERIOD_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/u;
const CNO_PATTERN = /^\d{4}$/u;

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
  resolvePage?: (request: {
    cnoCode: string;
    period: string;
  }) => Promise<SepeOccupationMarketResolution>;
  resolverEndpoint?: string;
  retrievedAt?: string | (() => string);
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
    if (result.url !== "" && result.url !== context.sourceUrl) {
      throw new Error(
        `SEPE occupation market page redirected away from the resolver URL for CNO ${context.occupation.code}.`,
      );
    }
    return {
      html: await result.text(),
      sourceUrl: context.sourceUrl,
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
  if (
    result.sourceUrl !== undefined &&
    result.sourceUrl !== context.sourceUrl
  ) {
    throw new Error(
      `SEPE occupation market fetch provenance does not match the resolver URL for CNO ${context.occupation.code}.`,
    );
  }
  return {
    html: result.html,
    sourceUrl: context.sourceUrl,
    retrievedAt: result.retrievedAt,
  };
}

async function writeValidatedCandidate(
  outputPath: string,
  resource: SepeOccupationMarketResource,
): Promise<void> {
  const temporaryPath = `${outputPath}.tmp-${process.pid}-${randomUUID()}`;
  const contents = `${JSON.stringify(resource, null, 2)}\n`;
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
  const recordsByCode = new Map<string, SepeOccupationMarket>();
  const notPublishedCodes = new Set<string>();
  const resolvePage =
    options.resolvePage ??
    ((request: { cnoCode: string; period: string }) =>
      resolveSepeOccupationMarketPage(request, {
        endpoint:
          options.resolverEndpoint ?? SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
      }));

  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      const occupation = catalogue[index];
      if (occupation === undefined) return;

      let resolution: SepeOccupationMarketResolution;
      try {
        resolution = await resolvePage({
          cnoCode: occupation.code,
          period: options.period,
        });
      } catch (error) {
        throw new Error(
          `SEPE occupation market capture failed resolving CNO ${occupation.code}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      if (resolution.status === "not-published") {
        notPublishedCodes.add(occupation.code);
        continue;
      }

      const sourceUrl = resolution.sourceUrl;
      if (
        !isCanonicalSepeOccupationMarketUrl(sourceUrl, {
          cnoCode: occupation.code,
          period: options.period,
        })
      ) {
        throw new Error(
          `SEPE occupation market resolver returned a noncanonical URL for CNO ${occupation.code}.`,
        );
      }
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
        recordsByCode.set(record.cno.code, record);
      } catch (error) {
        throw new Error(
          `SEPE occupation market capture failed for CNO ${occupation.code}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(4, catalogue.length) }, () => worker()),
  );

  const records = [...recordsByCode.values()].sort((left, right) =>
    left.cno.code.localeCompare(right.cno.code),
  );
  const requestedCnoCodes = catalogue
    .map((occupation) => occupation.code)
    .sort();
  const publishedCnoCodes = records.map((record) => record.cno.code);
  const notPublishedCnoCodeList = [...notPublishedCodes].sort();
  const validated = SepeOccupationMarketResourceSchema.parse({
    schemaVersion: "1.1.0",
    period: options.period,
    records,
    coverage: {
      requestedCnoCodes,
      publishedCnoCodes,
      notPublishedCnoCodes: notPublishedCnoCodeList,
      resolverEndpoint:
        options.resolverEndpoint ?? SEPE_OCCUPATION_MARKET_RESOLVER_ENDPOINT,
      capturedAt: retrieveAt,
    },
  });

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeValidatedCandidate(resolve(options.outputPath), validated);
  return validated.records;
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
