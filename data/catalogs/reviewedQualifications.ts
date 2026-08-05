import { z } from "zod";

export const QualificationReviewBasisSchema = z.enum([
  "fixture_control",
  "live_official_title_label",
  "statutory_equivalence",
]);

export const ReviewedQualificationSchema = z
  .object({
    catalogId: z.string().regex(/^qualification:[a-z0-9-]+$/u),
    canonicalLabel: z.string().trim().min(1),
    acceptedLabels: z.array(z.string().trim().min(1)).min(1).readonly(),
    reviewedAt: z.string().date(),
    reviewBasis: QualificationReviewBasisSchema,
  })
  .strict();

export function qualificationCatalogKey(value: string): string {
  return value
    .trim()
    .replace(/^[•·▪◦*-]+\s*/u, "")
    .replace(/[.;:]+$/u, "")
    .trim()
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/gu, " ");
}

export const ReviewedQualificationsCatalogSchema = z
  .array(ReviewedQualificationSchema)
  .min(1)
  .readonly()
  .superRefine((entries, context) => {
    const ids = new Set<string>();
    const labels = new Set<string>();
    const canonicalLabels = new Set<string>();
    for (const [entryIndex, entry] of entries.entries()) {
      if (ids.has(entry.catalogId)) {
        context.addIssue({
          code: "custom",
          path: [entryIndex, "catalogId"],
          message: "Qualification catalog IDs must be unique.",
        });
      }
      ids.add(entry.catalogId);

      const canonicalKey = qualificationCatalogKey(entry.canonicalLabel);
      if (canonicalLabels.has(canonicalKey)) {
        context.addIssue({
          code: "custom",
          path: [entryIndex, "canonicalLabel"],
          message: "Normalized canonical labels must be unique.",
        });
      }
      canonicalLabels.add(canonicalKey);

      const entryLabels = new Set<string>();
      for (const [labelIndex, label] of entry.acceptedLabels.entries()) {
        const key = qualificationCatalogKey(label);
        entryLabels.add(key);
        if (labels.has(key)) {
          context.addIssue({
            code: "custom",
            path: [entryIndex, "acceptedLabels", labelIndex],
            message: "Normalized qualification labels must be unique.",
          });
        }
        labels.add(key);
      }
      if (!entryLabels.has(canonicalKey)) {
        context.addIssue({
          code: "custom",
          path: [entryIndex, "canonicalLabel"],
          message:
            "Canonical label must be included in accepted labels after normalization.",
        });
      }
    }
  });

/**
 * Closed, manually reviewed labels only. Entries are admitted when they are a
 * fixture/demo control, an exact official title label observed in the live
 * corpus, or the two statutory school-level equivalence expressions. Free-form
 * title tails and employer-defined equivalences are intentionally excluded.
 */
export const REVIEWED_QUALIFICATIONS =
  ReviewedQualificationsCatalogSchema.parse([
    {
      catalogId: "qualification:bachiller-equivalent",
      canonicalLabel: "Bachiller o equivalente",
      acceptedLabels: ["Bachiller o equivalente"],
      reviewedAt: "2026-08-05",
      reviewBasis: "statutory_equivalence",
    },
    {
      catalogId: "qualification:eso-equivalent",
      canonicalLabel: "Graduado en ESO o equivalente",
      acceptedLabels: [
        "Graduado en ESO o equivalente",
        "Graduada en ESO o equivalente",
      ],
      reviewedAt: "2026-08-05",
      reviewBasis: "statutory_equivalence",
    },
    {
      catalogId: "qualification:web-application-development-higher-technician",
      canonicalLabel: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      acceptedLabels: ["Técnico/a Superior en Desarrollo de Aplicaciones Web"],
      reviewedAt: "2026-08-05",
      reviewBasis: "fixture_control",
    },
    {
      catalogId: "qualification:law-degree",
      canonicalLabel: "Grado en Derecho",
      acceptedLabels: ["Grado en Derecho"],
      reviewedAt: "2026-08-05",
      reviewBasis: "fixture_control",
    },
    {
      catalogId: "qualification:nursing-care-assistant-technician",
      canonicalLabel: "Técnico en Cuidados Auxiliares de Enfermería",
      acceptedLabels: ["Técnico en Cuidados Auxiliares de Enfermería"],
      reviewedAt: "2026-08-05",
      reviewBasis: "live_official_title_label",
    },
    {
      catalogId: "qualification:cooking-and-gastronomy-technician",
      canonicalLabel: "Técnico en Cocina y Gastronomía",
      acceptedLabels: ["Técnico en Cocina y Gastronomía"],
      reviewedAt: "2026-08-05",
      reviewBasis: "live_official_title_label",
    },
    {
      catalogId: "qualification:nursing-degree",
      canonicalLabel: "Grado en Enfermería",
      acceptedLabels: ["Grado en Enfermería"],
      reviewedAt: "2026-08-05",
      reviewBasis: "live_official_title_label",
    },
    {
      catalogId: "qualification:physiotherapy-degree",
      canonicalLabel: "Grado en Fisioterapia",
      acceptedLabels: ["Grado en Fisioterapia"],
      reviewedAt: "2026-08-05",
      reviewBasis: "live_official_title_label",
    },
    {
      catalogId: "qualification:occupational-therapy-degree",
      canonicalLabel: "Grado en Terapia Ocupacional",
      acceptedLabels: ["Grado en Terapia Ocupacional"],
      reviewedAt: "2026-08-05",
      reviewBasis: "live_official_title_label",
    },
  ]);

const qualificationByLabel = new Map(
  REVIEWED_QUALIFICATIONS.flatMap((entry) =>
    entry.acceptedLabels.map(
      (label) =>
        [qualificationCatalogKey(label), entry.canonicalLabel] as const,
    ),
  ),
);

export function reviewedQualificationLabel(
  sourceQuote: string,
): string | undefined {
  return qualificationByLabel.get(qualificationCatalogKey(sourceQuote));
}
