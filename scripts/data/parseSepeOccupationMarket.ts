import { decodeHTML } from "entities";

import {
  SEPE_CYL_PROVINCES,
  SEPE_OCCUPATION_MARKET_ATTRIBUTION,
  SepeOccupationMarketSchema,
  type SepeContractCharacteristics,
  type SepeOccupationMarket,
  type SepeOccupationNationalMetric,
  type SepeOccupationMetric,
} from "../../data/schemas/sepeOccupationMarket";

export interface SepeOccupationMarketParseOptions {
  expectedCnoCode: string;
  sourceUrl: string;
  retrievedAt: string;
}

const MONTHS = new Map([
  ["enero", "01"],
  ["febrero", "02"],
  ["marzo", "03"],
  ["abril", "04"],
  ["mayo", "05"],
  ["junio", "06"],
  ["julio", "07"],
  ["agosto", "08"],
  ["septiembre", "09"],
  ["octubre", "10"],
  ["noviembre", "11"],
  ["diciembre", "12"],
]);

type ProvinceMetrics = {
  registeredContracts?: SepeOccupationMetric;
  registeredUnemployment?: SepeOccupationMetric;
};

type ProvinceTableScope = "national" | "castilla-y-leon";

type TableRows = {
  rows: string[][];
  scope: ProvinceTableScope;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function htmlText(value: string): string {
  return normalizeWhitespace(
    decodeHTML(
      value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
        .replace(/<[^>]+>/gu, " "),
    ),
  );
}

function tagBodies(html: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "giu");
  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function normalizedKey(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es-ES");
}

function provinceName(
  value: string,
): (typeof SEPE_CYL_PROVINCES)[number] | undefined {
  const canonical = normalizeWhitespace(value);
  return SEPE_CYL_PROVINCES.find((province) => province === canonical);
}

function parsePeriod(value: string): string {
  const match = /^(\p{L}+)\s+(\d{4})$/u.exec(normalizeWhitespace(value));
  if (match === null) {
    throw new Error(`SEPE occupation market period is malformed: ${value}`);
  }
  const month = MONTHS.get(normalizedKey(match[1] ?? ""));
  if (month === undefined) {
    throw new Error(
      `SEPE occupation market period has an unknown month: ${value}`,
    );
  }
  return `${match[2]}-${month}`;
}

function parseCount(value: string): number | undefined {
  const normalized = normalizeWhitespace(value).replace(/\s/gu, "");
  if (normalized === "" || normalized === "-" || normalized === "—") {
    return undefined;
  }
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)$/u.test(normalized)) {
    throw new Error(`SEPE occupation market count is malformed: ${value}`);
  }
  const parsed = Number(normalized.replace(/\./gu, ""));
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`SEPE occupation market count is out of range: ${value}`);
  }
  return parsed;
}

function parseDecimal(value: string): number | undefined {
  const normalized = normalizeWhitespace(value);
  if (normalized === "" || normalized === "-" || normalized === "—") {
    return undefined;
  }
  const numberText =
    /^-?(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?|\d+\.\d+)(?:\s*%?)(?:\s*\(\d+\))?$/u.exec(
      normalized,
    )?.[0];
  if (numberText === undefined) {
    throw new Error(`SEPE occupation market decimal is malformed: ${value}`);
  }
  const numericPart =
    /^(-?(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?|\d+\.\d+))/u.exec(
      numberText,
    )?.[1];
  if (numericPart === undefined) {
    throw new Error(`SEPE occupation market decimal is malformed: ${value}`);
  }
  const isGroupedInteger = /^-?\d{1,3}(?:\.\d{3})+$/u.test(numericPart);
  const parsed = Number(
    numericPart.includes(",")
      ? numericPart.replace(/\./gu, "").replace(",", ".")
      : isGroupedInteger
        ? numericPart.replace(/\./gu, "")
        : numericPart,
  );
  if (!Number.isFinite(parsed)) {
    throw new Error(`SEPE occupation market decimal is malformed: ${value}`);
  }
  return parsed;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function bannerBlock(html: string, heading: RegExp): string {
  const pattern = new RegExp(
    `<h4\\b[^>]*>[\\s\\S]*?${heading.source}[\\s\\S]*?</h4>([\\s\\S]*?)(?=<h4\\b|<table\\b|</section>|$)`,
    "iu",
  );
  const match = pattern.exec(html);
  if (match === null) {
    throw new Error(
      `SEPE occupation market is missing banner ${heading.source}`,
    );
  }
  return match[1] ?? "";
}

function classValues(block: string, className: string): string[] {
  const pattern = new RegExp(
    `<[^>]+class=["'][^"']*${escapeRegex(className)}[^"']*["'][^>]*>([\\s\\S]*?)</[^>]+>`,
    "giu",
  );
  return [...block.matchAll(pattern)].map((match) => htmlText(match[1] ?? ""));
}

function bannerMetric(
  html: string,
  heading: RegExp,
  includePeople: boolean,
): SepeOccupationMetric & { people?: number } {
  const block = bannerBlock(html, heading);
  const digits = classValues(block, "se-databanner--digit");
  const total = parseCount(digits[0] ?? "");
  const monthlyVariationPercent = parseDecimal(
    classValues(block, "se-databanner--variation")[0] ?? "",
  );
  if (total === undefined || monthlyVariationPercent === undefined) {
    throw new Error(
      `SEPE occupation market banner ${heading.source} is incomplete`,
    );
  }
  const result: SepeOccupationMetric & { people?: number } = {
    total,
    monthlyVariationPercent,
  };
  if (includePeople) {
    const people = parseCount(digits[1] ?? "");
    if (people !== undefined) result.people = people;
  }
  return result;
}

function tableRows(html: string, caption: RegExp): TableRows | undefined {
  const tables = /<table\b[^>]*>[\s\S]*?<\/table>/giu;
  for (const tableMatch of html.matchAll(tables)) {
    const table = tableMatch[0] ?? "";
    const captionText = htmlText(
      /<caption\b[^>]*>([\s\S]*?)<\/caption>/iu.exec(table)?.[1] ?? "",
    );
    if (!caption.test(captionText)) continue;
    const scopeValue =
      /data-scope=["']([^"']+)["']/iu.exec(table)?.[1]?.trim() ?? "national";
    if (scopeValue !== "national" && scopeValue !== "castilla-y-leon") {
      throw new Error(
        `SEPE occupation market has an unsupported province table scope: ${scopeValue}`,
      );
    }
    const body =
      /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/iu.exec(table)?.[1] ?? table;
    const rows = /<tr\b[^>]*>([\s\S]*?)<\/tr>/giu;
    return {
      rows: [...body.matchAll(rows)].map((rowMatch) => {
        const cells = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/giu;
        return [...(rowMatch[1] ?? "").matchAll(cells)].map((cellMatch) =>
          htmlText(cellMatch[1] ?? ""),
        );
      }),
      scope: scopeValue,
    };
  }
  return undefined;
}

function metricFromCells(
  cells: readonly string[],
): SepeOccupationMetric | undefined {
  if (cells.length < 4) return undefined;
  const total = parseCount(cells[1] ?? "");
  const monthlyVariationPercent = parseDecimal(cells[2] ?? "");
  const annualVariationPercent = parseDecimal(cells[3] ?? "");
  if (total === undefined || monthlyVariationPercent === undefined)
    return undefined;
  const metric: SepeOccupationMetric = { total, monthlyVariationPercent };
  if (annualVariationPercent !== undefined) {
    metric.annualVariationPercent = annualVariationPercent;
  }
  return metric;
}

function totalMetricFromTable(
  table: TableRows | undefined,
): SepeOccupationMetric | undefined {
  const totalRow = table?.rows.find(
    (row) => normalizedKey(row[0] ?? "") === "total",
  );
  return totalRow === undefined ? undefined : metricFromCells(totalRow);
}

function mergeAnnualVariation(
  metric: SepeOccupationMetric & { people?: number },
  annualVariationPercent: number | undefined,
  metricName: string,
): SepeOccupationNationalMetric & { people?: number } {
  if (annualVariationPercent === undefined) {
    throw new Error(
      `SEPE occupation market is missing annual variation for ${metricName}`,
    );
  }
  return { ...metric, annualVariationPercent };
}

function provincialMetrics(
  html: string,
  caption: RegExp,
  field: keyof ProvinceMetrics,
): Map<string, ProvinceMetrics> {
  const table = tableRows(html, caption);
  if (table === undefined) {
    return new Map();
  }
  const rows = table.rows;
  const dataRows = rows.filter(
    (row) =>
      row.length >= 2 &&
      normalizedKey(row[0] ?? "") !== "provincia" &&
      normalizedKey(row[0] ?? "") !== "total",
  );
  const seen = new Set<string>();
  const result = new Map<string, ProvinceMetrics>();
  for (const row of dataRows) {
    const rawName = normalizeWhitespace(row[0] ?? "");
    const canonicalName = provinceName(rawName);
    if (canonicalName === undefined) {
      if (table.scope === "castilla-y-leon") {
        throw new Error(
          `Unknown province in the Castilla y León subset: ${rawName}`,
        );
      }
      continue;
    }
    if (seen.has(canonicalName)) {
      throw new Error(
        `Duplicate province in the Castilla y León subset: ${canonicalName}`,
      );
    }
    seen.add(canonicalName);
    const metric = metricFromCells(row);
    const current = result.get(canonicalName) ?? {};
    if (metric !== undefined) current[field] = metric;
    result.set(canonicalName, current);
  }
  return result;
}

function contractCharacteristicsSection(html: string): string | undefined {
  const start = /<h4\b[^>]*>\s*Cifras mensuales de contratos\s*<\/h4>/iu.exec(
    html,
  );
  if (start === null || start.index === undefined) return undefined;
  const sectionStart = start.index + start[0].length;
  const remainder = html.slice(sectionStart);
  const boundaries = [
    /<h4\b[^>]*>\s*Las actividades económicas\b[\s\S]*?<\/h4>/iu,
    /<div\b[^>]*role=["']tabpanel["']/iu,
    /<\/section>/iu,
  ];
  const boundaryIndexes = boundaries
    .map((boundary) => boundary.exec(remainder)?.index)
    .filter((index): index is number => index !== undefined);
  if (boundaryIndexes.length === 0) {
    throw new Error(
      "SEPE occupation market contract-characteristics section has no boundary",
    );
  }
  const sectionEnd = Math.min(...boundaryIndexes);
  return remainder.slice(0, sectionEnd);
}

function characteristicsFromPage(
  html: string,
): SepeContractCharacteristics | undefined {
  const section = contractCharacteristicsSection(html);
  if (section === undefined) return undefined;
  const text = htmlText(section);
  const characteristics: SepeContractCharacteristics = {};
  const lastTwelveMonths =
    /Durante los últimos doce meses(?: del año)? se registran\s+([^\s]+)\s+contratos/iu.exec(
      text,
    );
  const indefinite = /(\d[\d.]*)\s+han sido de duración\s+Indefinido/iu.exec(
    text,
  );
  const fullTime = /(\d[\d.]*)\s+han sido de jornada\s+Completa/iu.exec(text);
  const partTime = /(\d[\d.]*)\s+han sido de jornada\s+Parcial/iu.exec(text);
  const rotation =
    /([\d.,]+)\s+es el índice de rotación de los contratos/iu.exec(text);
  const lastTwelveMonthsTotal = parseCount(lastTwelveMonths?.[1] ?? "");
  const indefiniteTotal = parseCount(indefinite?.[1] ?? "");
  const fullTimeTotal = parseCount(fullTime?.[1] ?? "");
  const partTimeTotal = parseCount(partTime?.[1] ?? "");
  const rotationIndex = parseDecimal(rotation?.[1] ?? "");
  if (lastTwelveMonthsTotal !== undefined) {
    characteristics.lastTwelveMonthsTotal = lastTwelveMonthsTotal;
  }
  if (indefiniteTotal !== undefined)
    characteristics.indefinite = indefiniteTotal;
  if (fullTimeTotal !== undefined) characteristics.fullTime = fullTimeTotal;
  if (partTimeTotal !== undefined) characteristics.partTime = partTimeTotal;
  if (rotationIndex !== undefined)
    characteristics.rotationIndex = rotationIndex;
  return Object.keys(characteristics).length === 0
    ? undefined
    : characteristics;
}

function parseHeading(html: string): {
  code: string;
  label: string;
  period: string;
} {
  const heading = tagBodies(html, "h2").find((body) =>
    /CNO\s*-/iu.test(htmlText(body)),
  );
  if (heading === undefined) {
    throw new Error("SEPE occupation market heading is missing");
  }
  const spans = tagBodies(heading, "span").map(htmlText);
  const headingText = htmlText(heading);
  const cnoText =
    spans.find((value) => /^CNO\s*-/iu.test(value)) ?? headingText;
  const cnoMatch = /^CNO\s*-\s*(\d{4})\s*:\s*(.+)$/iu.exec(cnoText);
  if (cnoMatch === null) {
    throw new Error("SEPE occupation market CNO code or label is malformed");
  }
  const periodCandidate =
    spans.find((value) => /^\p{L}+\s+\d{4}$/u.test(value)) ??
    /(?:^|\s)(\p{L}+\s+\d{4})(?:$|\s)/u.exec(headingText)?.[1];
  if (periodCandidate === undefined) {
    throw new Error("SEPE occupation market period is missing or malformed");
  }
  return {
    code: cnoMatch[1] as string,
    label: normalizeWhitespace(cnoMatch[2] as string),
    period: parsePeriod(periodCandidate),
  };
}

export function parseSepeOccupationMarket(
  html: string,
  options: SepeOccupationMarketParseOptions,
): SepeOccupationMarket {
  const heading = parseHeading(html);
  if (heading.code !== options.expectedCnoCode) {
    throw new Error(
      `SEPE occupation market CNO mismatch: expected ${options.expectedCnoCode}, got ${heading.code}`,
    );
  }

  const unemploymentBanner = bannerMetric(
    html,
    /Parados[^<]*en esta ocupación/iu,
    false,
  );
  const contractBanner = bannerMetric(
    html,
    /Contratos en esta ocupación/iu,
    true,
  );
  const unemploymentTable = totalMetricFromTable(
    tableRows(html, /Parados según sexo y edad/iu),
  );
  const contractsTable = totalMetricFromTable(
    tableRows(html, /Contratos según sexo y edad/iu),
  );
  const registeredUnemployment = mergeAnnualVariation(
    unemploymentBanner,
    unemploymentTable?.annualVariationPercent,
    "registered unemployment",
  );
  const registeredContracts = mergeAnnualVariation(
    contractBanner,
    contractsTable?.annualVariationPercent,
    "registered contracts",
  );
  const unemploymentByProvince = provincialMetrics(
    html,
    /Distribución geográfica de parados/iu,
    "registeredUnemployment",
  );
  const contractsByProvince = provincialMetrics(
    html,
    /Distribución geográfica de contratos/iu,
    "registeredContracts",
  );
  const provinceRows = SEPE_CYL_PROVINCES.map((province) => {
    const metrics = {
      province,
      ...(contractsByProvince.get(province) ?? {}),
      ...(unemploymentByProvince.get(province) ?? {}),
    };
    return metrics;
  });
  const missingProvinces = provinceRows
    .filter(
      (row) =>
        row.registeredContracts === undefined &&
        row.registeredUnemployment === undefined,
    )
    .map((row) => row.province);
  if (missingProvinces.length > 0) {
    throw new Error(
      `SEPE occupation market is missing Castilla y León province rows: ${missingProvinces.join(", ")}`,
    );
  }

  const national: SepeOccupationMarket["national"] = {
    registeredContracts,
    registeredUnemployment,
  };
  const contractCharacteristics = characteristicsFromPage(html);
  if (contractCharacteristics !== undefined) {
    national.contractCharacteristics = contractCharacteristics;
  }

  return SepeOccupationMarketSchema.parse({
    period: heading.period,
    cno: { code: heading.code, label: heading.label },
    national,
    provinces: provinceRows,
    source: {
      url: options.sourceUrl,
      retrievedAt: options.retrievedAt,
      attribution: SEPE_OCCUPATION_MARKET_ATTRIBUTION,
    },
  });
}
