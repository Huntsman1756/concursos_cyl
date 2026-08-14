import { JobOfferSchema, type JobOffer } from "../../data/schemas/generated";
import {
  type OfferSourceRecord,
  OfferSourceRecordSchema,
} from "../../data/schemas/offerSource";
import { SOURCE_CONFIG } from "./sourceConfig";
import { sanitizeOfferHtml } from "./sanitizeOfferHtml";
import { extractPublishedRequirements } from "../../src/domain/requirements";

export interface NormalizeOffersOptions {
  snapshotFetchedAt?: string;
}

function nullableText(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toIsoDate(value: string | null | undefined): string | null {
  const normalized = nullableText(value);
  if (!normalized) return null;
  const date = new Date(
    normalized.includes("T") ? normalized : `${normalized}T00:00:00Z`,
  );
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function normalizeOffers(
  records: OfferSourceRecord[],
  options: NormalizeOffersOptions = {},
): JobOffer[] {
  const snapshotFetchedAt =
    options.snapshotFetchedAt ?? new Date().toISOString();

  return records
    .map((rawRecord) => {
      const record = OfferSourceRecordSchema.parse(rawRecord);
      const description = sanitizeOfferHtml(record.descripcion ?? "");
      const descriptionText =
        description.plainText || "Descripción no publicada.";

      return JobOfferSchema.parse({
        id: record.identificador.trim(),
        title: record.titulo.trim(),
        province: nullableText(record.provincia),
        locality: nullableText(record.localidad),
        publishedAt: toIsoDate(record.fecha_publicacion),
        updatedAt: toIsoDate(record.actualizacionmetadatos),
        sourceName: nullableText(record.fuentecontenido) ?? "ECYL",
        descriptionText,
        descriptionSections: description.sections,
        publishedRequirements: extractPublishedRequirements(
          record.identificador,
          {
            sections: description.sections,
          },
        ),
        originalUrl: record.enlace_al_contenido,
        snapshot: {
          sourceId: SOURCE_CONFIG.offers.id,
          snapshotFetchedAt,
        },
      });
    })
    .sort((left, right) => {
      const titleOrder = left.title.localeCompare(right.title, "es", {
        sensitivity: "base",
      });
      return titleOrder || left.id.localeCompare(right.id);
    });
}
