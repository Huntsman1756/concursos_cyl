import { createHash } from "node:crypto";

import {
  JobOfferSchema,
  SourceSnapshotSchema,
  type JobOffer,
  type SourceSnapshot,
} from "../../data/schemas/generated";
import type { OfferSourceRecord } from "../../data/schemas/offerSource";
import { SOURCE_CONFIG } from "./sourceConfig";
import { sanitizeOfferHtml } from "./sanitizeOfferHtml";

const spanishCollator = new Intl.Collator("es");

export interface NormalizeOffersOptions {
  sourceSnapshot?: SourceSnapshot;
}

function requiredText(
  value: string | number | null | undefined,
  field: string,
): string {
  const normalized = String(value ?? "").trim();

  if (normalized.length === 0) {
    throw new Error(`Official ${field} must not be blank.`);
  }

  return normalized;
}

function nullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length === 0 ? null : normalized;
}

function normalizeDate(value: unknown, field: string): string {
  const dateText = requiredText(
    typeof value === "string" || typeof value === "number" ? value : null,
    field,
  );
  const normalizedDateText = /^\d{4}-\d{2}-\d{2}$/u.test(dateText)
    ? `${dateText}T00:00:00.000Z`
    : dateText;
  const date = new Date(normalizedDateText);

  if (Number.isNaN(date.valueOf())) {
    throw new Error(`Official ${field} must be a valid date: ${dateText}.`);
  }

  return date.toISOString();
}

function nullableDate(value: unknown, field: string): string | null {
  if (
    value === null ||
    value === undefined ||
    String(value).trim().length === 0
  ) {
    return null;
  }

  return normalizeDate(value, field);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sourceSnapshotForRecord(
  record: OfferSourceRecord,
  publishedAt: string,
): SourceSnapshot {
  const sourceUpdatedAt = nullableDate(
    record.fecha_actualizacion,
    "fecha_actualizacion",
  );

  return SourceSnapshotSchema.parse({
    sourceId: SOURCE_CONFIG.offers.id,
    sourceUrl: SOURCE_CONFIG.offers.recordsUrl,
    sourceUpdatedAt,
    snapshotFetchedAt: sourceUpdatedAt ?? publishedAt,
    schemaVersion: "1.0.0",
    recordCount: 1,
    sha256: createHash("sha256").update(stableJson(record)).digest("hex"),
    qualityStatus: "passed",
  });
}

function normalizeRecord(
  record: OfferSourceRecord,
  options: NormalizeOffersOptions,
): JobOffer {
  const publishedAt = normalizeDate(
    record.fecha_publicacion,
    "fecha_publicacion",
  );
  const description = sanitizeOfferHtml(record.descripcion ?? "");
  const sourceSnapshot =
    options.sourceSnapshot === undefined
      ? sourceSnapshotForRecord(record, publishedAt)
      : SourceSnapshotSchema.parse(options.sourceSnapshot);

  return JobOfferSchema.parse({
    id: requiredText(record.identificador, "identificador"),
    title: requiredText(record.titulo, "titulo"),
    province: nullableText(record.provincia),
    locality: nullableText(record.localidad),
    publishedAt,
    sourceName: nullableText(record.fuente) ?? "ECYL",
    descriptionText: description.plainText,
    descriptionSections: description.sections,
    originalUrl: requiredText(
      record.enlace_al_contenido,
      "enlace_al_contenido",
    ),
    sourceSnapshot,
  });
}

/**
 * Converts validated official ECYL offer records into schema-validated public
 * contracts with sanitized, structured descriptions.
 */
export function normalizeOffers(
  records: readonly OfferSourceRecord[],
  options: NormalizeOffersOptions = {},
): JobOffer[] {
  const offersById = new Map<string, JobOffer>();
  const normalized = records
    .map((record) => normalizeRecord(record, options))
    .sort((left, right) => {
      return (
        spanishCollator.compare(left.title, right.title) ||
        left.id.localeCompare(right.id) ||
        stableJson(left).localeCompare(stableJson(right))
      );
    });

  for (const offer of normalized) {
    if (!offersById.has(offer.id)) {
      offersById.set(offer.id, offer);
    }
  }

  return [...offersById.values()];
}
