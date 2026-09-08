import type { TrainingProgram } from "../../data/schemas/generated";

/**
 * Central citizen-facing display formatting. Raw and canonical source values
 * are never mutated; every correction here is presentation-only.
 */

type DateInput = string | number | Date;

/** Parses a date safely; returns null instead of throwing on bad input. */
export function parseDateValue(value: DateInput): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? new Date(value) : null;
  }
  if (typeof value !== "string" || value.trim() === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const longDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Standard citizen-facing date: "22 de agosto de 2026".
 * Returns "" for values that cannot be parsed.
 */
export function longDate(value: DateInput): string {
  const date = parseDateValue(value);
  return date === null ? "" : longDateFormatter.format(date);
}

/**
 * Citizen-facing label for a bare calendar day ("2026-08-22" style source
 * values must not shift with the local time zone).
 */
export function longDateFromCalendarDay(value: string | null): string | null {
  if (value === null) return null;
  const date = parseDateDateOnly(value);
  return date === null ? null : longDateFormatter.format(date);
}

/**
 * Citizen-facing month label ("agosto de 2026") for bare month values like
 * "2026-08".
 */
export function monthYearLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})$/u.exec(value.trim());
  if (match !== null) {
    return monthYearFormatter.format(
      new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)),
    );
  }
  const date = parseDateValue(value);
  return date === null ? "" : monthYearFormatter.format(date);
}

function parseDateDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value.trim());
  if (match === null) return parseDateValue(value);
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Removes whitespace before punctuation produced by template composition. */
export function tidyPunctuation(text: string): string {
  return text
    .replace(/[ \t\u00a0]+([;:,.])/gu, "$1")
    .replace(/[ \t\u00a0]{2,}/gu, " ")
    .trim();
}

/**
 * Educational levels in sentence-style casing, as used across the interface.
 * Capitalize only when grammar requires it at the start of a sentence.
 */
const levelLabels: Record<TrainingProgram["level"], string> = {
  basic: "grado básico",
  intermediate: "grado medio",
  higher: "grado superior",
  specialization: "curso de especialización",
};

export function formatEducationalLevel(
  level: TrainingProgram["level"],
): string {
  return levelLabels[level];
}

/** Uppercases only the first letter, leaving acronyms and the rest intact. */
export function capitalizeFirst(text: string): string {
  if (text === "") return text;
  return text[0]!.toLocaleUpperCase("es-ES") + text.slice(1);
}

/**
 * Citizen-facing occupation labels follow the sentence-style capitalization
 * already used by the curated catalog ("diseñadores web y multimedia"). The
 * official CNO-11 catalog occasionally capitalizes the generic common noun
 * ("Web"); the correction is presentation-only: canonical data and search
 * matching keep the raw official value.
 */
export function formatOccupationLabel(value: string): string {
  return value.replace(/\bWeb\b/gu, "web");
}

/**
 * Display form for offer titles inherited from source datasets. ALL-CAPS
 * source titles become readable without destroying acronyms (ATS/DUE, FP,
 * HTML…) or official abbreviations ("Ayto."); mixed-case titles are returned
 * untouched. Raw literals are preserved for provenance and matching.
 */
export function formatOfferTitle(value: string): string {
  return readableOfficialTitle(value);
}

const OFFICIAL_TITLE_STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "las",
  "los",
  "el",
  "y",
  "e",
  "o",
  "u",
  "a",
  "en",
  "con",
  "para",
  "por",
  "al",
]);

/** Known acronyms that must survive title-casing of ALL-CAPS source titles. */
const OFFICIAL_TITLE_ACRONYMS = new Set([
  "ats",
  "due",
  "sepe",
  "fp",
  "ssk",
  "html",
  "css",
  "sql",
  "xml",
  "cno",
  "boe",
]);

/**
 * Title-cases an ALL-CAPS official title without destroying acronyms:
 * known acronyms and very short tokens keep their casing; longer words
 * become capitalized words. Mixed-case titles are returned untouched.
 */
export function readableOfficialTitle(value: string): string {
  if (value !== value.toLocaleUpperCase("es-ES")) return value;
  return value.replace(/\p{Letter}[\p{Letter}'’-]*/gu, (word) => {
    const lower = word.toLocaleLowerCase("es-ES");
    if (OFFICIAL_TITLE_ACRONYMS.has(lower)) return word;
    if (OFFICIAL_TITLE_STOPWORDS.has(lower)) return lower;
    if (word.length <= 3 && !OFFICIAL_TITLE_STOPWORDS.has(lower)) return word;
    return capitalizeFirst(lower);
  });
}
