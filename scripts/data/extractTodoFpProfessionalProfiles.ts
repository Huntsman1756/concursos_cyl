import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { decodeHTML } from "entities";
import sanitizeHtml from "sanitize-html";

const TODO_FP_ORIGIN = "https://www.todofp.es";
const TODO_FP_INDEX = `${TODO_FP_ORIGIN}/que-estudiar/familias-profesionales.html`;
const PROGRAM_PATH =
  /^\/que-estudiar\/(?:familias-profesionales|logse)\/([^/]+)\/([^/]+)\.html$/iu;
const FAMILY_PATH = /^\/que-estudiar\/familias-profesionales\/([^/]+)\.html$/iu;

export interface TrainingProgramInput {
  familyCode: string;
  familyName: string;
  level: "basic" | "intermediate" | "higher" | "specialization";
  programKey: string;
  programTitle: string;
}

export interface TodoFpPage {
  url: string;
  html: string;
}

export interface ProfessionalProfile {
  profileId: string;
  programKey: string;
  programTitle: string;
  officialTitle: string;
  familyCode: string;
  familyName: string;
  level: TrainingProgramInput["level"];
  outputLabel: string;
  sourceSystem: "TodoFP";
  sourceUrl: string;
  sourceQuote: string;
}

export interface ExtractionResult {
  profiles: ProfessionalProfile[];
  coveredProgramKeys: string[];
  unresolvedProgramKeys: string[];
  unmatchedOfficialPages: Array<{ title: string; url: string }>;
  pagesWithoutOutputs: Array<{ title: string; url: string }>;
}

export function htmlText(value: string): string {
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

function absoluteTodoFpUrl(href: string): string | undefined {
  try {
    const url = new URL(href, TODO_FP_ORIGIN);
    if (url.hostname !== "www.todofp.es" && url.hostname !== "todofp.es") {
      return undefined;
    }
    url.protocol = "https:";
    url.hostname = "www.todofp.es";
    url.hash = "";
    url.search = "";
    return url.href;
  } catch {
    return undefined;
  }
}

export function discoverLinks(html: string): {
  familyUrls: string[];
  programUrls: string[];
} {
  const familyUrls = new Set<string>();
  const programUrls = new Set<string>();
  const linkPattern = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>/giu;
  for (const match of html.matchAll(linkPattern)) {
    const value = absoluteTodoFpUrl(match[1]!);
    if (value === undefined) continue;
    const path = new URL(value).pathname;
    if (PROGRAM_PATH.test(path)) programUrls.add(value);
    else if (FAMILY_PATH.test(path)) familyUrls.add(value);
  }
  return {
    familyUrls: [...familyUrls].sort(),
    programUrls: [...programUrls].sort(),
  };
}

export function normalizeProgramTitle(value: string): string {
  return value
    .replace(/\s*\((?:distancia|online|virtual|acceso\s+g[ms])\)\s*$/iu, "")
    .replace(
      /^(?:t[ií]tulo\s+profesional\s+b[aá]sico|t[eé]cnico\s+superior|t[eé]cnico|curso\s+de\s+especializaci[oó]n)\s+(?:en\s+)?/iu,
      "",
    )
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function titleFingerprint(value: string): string {
  return normalizeProgramTitle(value)
    .split(" ")
    .filter(
      (token) => !["de", "del", "el", "en", "la", "las", "los"].includes(token),
    )
    .join(" ");
}

function headingText(html: string, level: number): string | undefined {
  const match = new RegExp(
    `<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`,
    "iu",
  ).exec(html);
  return match === null ? undefined : htmlText(match[1]!);
}

export function extractOfficialOutputs(html: string): {
  officialTitle: string;
  outputs: string[];
} {
  const officialTitle = headingText(html, 1) ?? "";
  const sectionPattern =
    /<h([2-4])\b[^>]*>[\s\S]*?salidas\s+profesionales[\s\S]*?<\/h\1>/iu;
  const section = sectionPattern.exec(html);
  if (section === null) return { officialTitle, outputs: [] };

  const afterHeading = html.slice(section.index + section[0].length);
  const nextHeading = /<h[2-4]\b/iu.exec(afterHeading);
  const sectionHtml = afterHeading.slice(0, nextHeading?.index);
  const workMarker = /trabajar(?:\s+como|\s+en)?\s*:/iu.exec(
    htmlText(sectionHtml),
  );
  if (workMarker === null) return { officialTitle, outputs: [] };

  const outputs = [...sectionHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/giu)]
    .map((match) => htmlText(match[1]!))
    .filter((value) => value.length >= 3);
  return { officialTitle, outputs: [...new Set(outputs)] };
}

function profileId(
  programKey: string,
  sourceUrl: string,
  quote: string,
): string {
  const digest = createHash("sha256")
    .update(`${programKey}\u0000${sourceUrl}\u0000${quote}`, "utf8")
    .digest("hex");
  return `professional-profile:${digest}`;
}

export function buildProfessionalProfiles(
  programs: readonly TrainingProgramInput[],
  pages: readonly TodoFpPage[],
): ExtractionResult {
  const programsByTitle = new Map<string, TrainingProgramInput[]>();
  const programsByFingerprint = new Map<string, TrainingProgramInput[]>();
  for (const program of programs) {
    const key = normalizeProgramTitle(program.programTitle);
    programsByTitle.set(key, [...(programsByTitle.get(key) ?? []), program]);
    const fingerprint = titleFingerprint(program.programTitle);
    programsByFingerprint.set(fingerprint, [
      ...(programsByFingerprint.get(fingerprint) ?? []),
      program,
    ]);
  }

  const profiles: ProfessionalProfile[] = [];
  const matchedKeys = new Set<string>();
  const unmatchedOfficialPages: ExtractionResult["unmatchedOfficialPages"] = [];
  const pagesWithoutOutputs: ExtractionResult["pagesWithoutOutputs"] = [];

  for (const page of [...pages].sort((left, right) =>
    left.url.localeCompare(right.url),
  )) {
    const url = absoluteTodoFpUrl(page.url);
    if (url === undefined || !PROGRAM_PATH.test(new URL(url).pathname)) {
      throw new Error(`TodoFP program URL required: ${page.url}`);
    }
    const extracted = extractOfficialOutputs(page.html);
    const normalizedOfficialTitle = normalizeProgramTitle(
      extracted.officialTitle,
    );
    const matches =
      programsByTitle.get(normalizedOfficialTitle) ??
      programsByFingerprint.get(titleFingerprint(extracted.officialTitle)) ??
      [];
    if (matches.length === 0) {
      unmatchedOfficialPages.push({ title: extracted.officialTitle, url });
      continue;
    }
    if (extracted.outputs.length === 0) {
      pagesWithoutOutputs.push({ title: extracted.officialTitle, url });
      continue;
    }
    for (const program of matches) {
      matchedKeys.add(program.programKey);
      for (const output of extracted.outputs) {
        profiles.push({
          profileId: profileId(program.programKey, url, output),
          programKey: program.programKey,
          programTitle: program.programTitle,
          officialTitle: extracted.officialTitle,
          familyCode: program.familyCode,
          familyName: program.familyName,
          level: program.level,
          outputLabel: output,
          sourceSystem: "TodoFP",
          sourceUrl: url,
          sourceQuote: output,
        });
      }
    }
  }

  const profileTemplatesByProgram = new Map<string, ProfessionalProfile[]>();
  for (const profile of profiles) {
    profileTemplatesByProgram.set(profile.programKey, [
      ...(profileTemplatesByProgram.get(profile.programKey) ?? []),
      profile,
    ]);
  }
  for (const program of programs) {
    if (
      matchedKeys.has(program.programKey) ||
      !/[dD]$/u.test(program.programKey)
    ) {
      continue;
    }
    const baseProgramKey = program.programKey.slice(0, -1);
    const templates = profileTemplatesByProgram.get(baseProgramKey) ?? [];
    for (const template of templates) {
      profiles.push({
        ...template,
        profileId: profileId(
          program.programKey,
          template.sourceUrl,
          template.sourceQuote,
        ),
        programKey: program.programKey,
        programTitle: program.programTitle,
        familyCode: program.familyCode,
        familyName: program.familyName,
        level: program.level,
      });
      matchedKeys.add(program.programKey);
    }
  }

  profiles.sort((left, right) =>
    `${left.programKey}\u0000${left.outputLabel}`.localeCompare(
      `${right.programKey}\u0000${right.outputLabel}`,
      "es",
    ),
  );
  const allKeys = programs.map(({ programKey }) => programKey).sort();
  return {
    profiles,
    coveredProgramKeys: allKeys.filter((key) => matchedKeys.has(key)),
    unresolvedProgramKeys: allKeys.filter((key) => !matchedKeys.has(key)),
    unmatchedOfficialPages,
    pagesWithoutOutputs,
  };
}

async function fetchTodoFp(url: string): Promise<TodoFpPage> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SALIDA-CyL-data-builder/1.0 (+public-source-audit)",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`TodoFP ${response.status}: ${url}`);
  return { url, html: await response.text() };
}

async function mapConcurrent<T, U>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<U>,
): Promise<U[]> {
  const results = new Array<U>(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await mapper(values[index]!);
      }
    }),
  );
  return results;
}

export async function downloadTodoFpProgramPages(): Promise<TodoFpPage[]> {
  const index = await fetchTodoFp(TODO_FP_INDEX);
  const indexLinks = discoverLinks(index.html);
  const familyPages = await mapConcurrent(
    indexLinks.familyUrls,
    6,
    fetchTodoFp,
  );
  const programUrls = new Set(indexLinks.programUrls);
  for (const familyPage of familyPages) {
    for (const url of discoverLinks(familyPage.html).programUrls)
      programUrls.add(url);
  }
  return mapConcurrent([...programUrls].sort(), 6, fetchTodoFp);
}

interface CliOptions {
  output?: string;
  pagesFixture?: string;
  programs: string;
  profilesOnly: boolean;
  requireComplete: boolean;
}

function parseCli(args: readonly string[]): CliOptions {
  const options: CliOptions = {
    programs: resolve("public/data/v1/programs.json"),
    profilesOnly: false,
    requireComplete: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--require-complete") options.requireComplete = true;
    else if (argument === "--profiles-only") options.profilesOnly = true;
    else if (
      ["--output", "--pages-fixture", "--programs"].includes(argument ?? "")
    ) {
      const value = args[++index];
      if (value === undefined) throw new Error(`${argument} requires a path.`);
      if (argument === "--output") options.output = resolve(value);
      if (argument === "--pages-fixture") options.pagesFixture = resolve(value);
      if (argument === "--programs") options.programs = resolve(value);
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const programs = JSON.parse(
    await readFile(options.programs, "utf8"),
  ) as TrainingProgramInput[];
  const pages =
    options.pagesFixture === undefined
      ? await downloadTodoFpProgramPages()
      : (JSON.parse(
          await readFile(options.pagesFixture, "utf8"),
        ) as TodoFpPage[]);
  const result = buildProfessionalProfiles(programs, pages);
  const document = {
    schemaVersion: "1.0.0",
    sourceId: "todofp-official-professional-outputs",
    sourceUrl: TODO_FP_INDEX,
    counts: {
      programs: programs.length,
      coveredPrograms: result.coveredProgramKeys.length,
      profiles: result.profiles.length,
      unresolvedPrograms: result.unresolvedProgramKeys.length,
    },
    ...result,
  };
  const outputValue = options.profilesOnly ? result.profiles : document;
  if (options.output === undefined)
    process.stdout.write(`${JSON.stringify(outputValue, null, 2)}\n`);
  else {
    await mkdir(dirname(options.output), { recursive: true });
    await writeFile(
      options.output,
      `${JSON.stringify(outputValue, null, 2)}\n`,
      "utf8",
    );
  }
  if (options.requireComplete && result.unresolvedProgramKeys.length > 0)
    process.exitCode = 1;
}

const entryPath =
  process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (entryPath === fileURLToPath(import.meta.url)) {
  await main();
}
