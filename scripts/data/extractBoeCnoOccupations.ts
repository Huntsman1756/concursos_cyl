import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeHTML } from "entities";
import sanitizeHtml from "sanitize-html";

import type { Occupation } from "../../data/schemas/curatedMappings";

export const CNO_11_SOURCE_URL = "https://www.boe.es/eli/es/rd/2010/11/26/1591";
export const CNO_11_EXPECTED_PRIMARY_GROUPS = 502;

function htmlText(value: string): string {
  return decodeHTML(
    sanitizeHtml(value, {
      allowedAttributes: {},
      allowedTags: [],
      disallowedTagsMode: "discard",
    }),
  )
    .replace(/\s+/gu, " ")
    .trim();
}

export interface OfficialCnoGroup {
  classificationCode: string;
  preferredLabel: string;
}

export function extractCnoPrimaryGroups(html: string): OfficialCnoGroup[] {
  const groups = new Map<string, OfficialCnoGroup>();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu)) {
    const cells = [...row[1]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/giu)];
    if (cells.length < 2) continue;
    const classificationCode = htmlText(cells[0]![1]!);
    if (!/^\d{4}$/u.test(classificationCode)) continue;
    const preferredLabel = htmlText(cells[1]![1]!).replace(/\.\s*$/u, "");
    if (preferredLabel.length < 3) continue;
    if (groups.has(classificationCode)) {
      throw new Error(`Duplicate CNO-11 primary group: ${classificationCode}`);
    }
    groups.set(classificationCode, { classificationCode, preferredLabel });
  }
  return [...groups.values()].sort((left, right) =>
    left.classificationCode.localeCompare(right.classificationCode),
  );
}

export function buildOfficialOccupations(
  groups: readonly OfficialCnoGroup[],
  previous: readonly Occupation[],
  reviewedAt: string,
): Occupation[] {
  const confirmationByCode = new Map(
    previous.map((occupation) => [
      occupation.classificationCode,
      occupation.confirmationLabel,
    ]),
  );
  return groups.map(({ classificationCode, preferredLabel }) => ({
    occupationId: `occupation:cno11:${classificationCode}`,
    preferredLabel,
    confirmationLabel:
      confirmationByCode.get(classificationCode) ?? preferredLabel,
    classificationSystem: "CNO-11",
    classificationCode,
    reviewStatus: "approved",
    sourceUrl: CNO_11_SOURCE_URL,
    reviewedAt,
    catalogVersion: "2.0.0",
  }));
}

interface CliOptions {
  input?: string;
  output: string;
  previous: string;
  reviewedAt: string;
}

function parseCli(args: readonly string[]): CliOptions {
  const options: CliOptions = {
    output: resolve("data/curated/official-occupations.json"),
    previous: resolve("data/curated/occupations.json"),
    reviewedAt: new Date().toISOString().slice(0, 10),
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (
      !["--input", "--output", "--previous", "--reviewed-at"].includes(
        argument ?? "",
      )
    ) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = args[++index];
    if (value === undefined) throw new Error(`${argument} requires a value.`);
    if (argument === "--input") options.input = resolve(value);
    if (argument === "--output") options.output = resolve(value);
    if (argument === "--previous") options.previous = resolve(value);
    if (argument === "--reviewed-at") options.reviewedAt = value;
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const html =
    options.input === undefined
      ? await fetch(CNO_11_SOURCE_URL, {
          headers: {
            "User-Agent": "SALIDA-CyL-data-builder/1.0 (+public-source-audit)",
          },
          signal: AbortSignal.timeout(30_000),
        }).then((response) => {
          if (!response.ok) throw new Error(`BOE ${response.status}`);
          return response.text();
        })
      : await readFile(options.input, "utf8");
  const groups = extractCnoPrimaryGroups(html);
  if (groups.length !== CNO_11_EXPECTED_PRIMARY_GROUPS) {
    throw new Error(
      `Expected ${CNO_11_EXPECTED_PRIMARY_GROUPS} CNO-11 primary groups, found ${groups.length}.`,
    );
  }
  const previous = JSON.parse(
    await readFile(options.previous, "utf8"),
  ) as Occupation[];
  const occupations = buildOfficialOccupations(
    groups,
    previous,
    options.reviewedAt,
  );
  await writeFile(
    options.output,
    `${JSON.stringify(occupations, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(
    `Published ${occupations.length} official CNO-11 primary groups from ${CNO_11_SOURCE_URL}.\n`,
  );
}

const entryPath =
  process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (entryPath === fileURLToPath(import.meta.url)) await main();
