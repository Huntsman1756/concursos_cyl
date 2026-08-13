import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { format as formatWithPrettier } from "prettier";
import { z } from "zod";

import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
} from "../../data/schemas/curatedMappings";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingProgramSchema,
  type GeneratedManifest,
} from "../../data/schemas/generated";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import {
  REVIEWED_QUALIFICATIONS,
  reviewedQualificationLabel,
} from "../../data/catalogs/reviewedQualifications";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";

const MentionScopeSchema = z.enum([
  "reviewed_qualification_exact",
  "requirement_generic_fp",
  "description_only_fp",
]);

export const FpMentionOfferQueueEntrySchema = z
  .object({
    offerId: z.string().min(1),
    title: z.string().min(1),
    province: z.string().nullable(),
    sourceName: z.string().min(1),
    originalUrl: z.string().url(),
    mentionScope: MentionScopeSchema,
    reviewedQualificationLabels: z.array(z.string().min(1)),
    candidateProgramKeys: z.array(z.string().min(1)),
    requirementQuotes: z.array(z.string().min(1)),
  })
  .strict();

export const FpMentionOfferQueueReportSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    snapshotId: z.string().min(1),
    totalOffers: z.number().int().positive(),
    matchedOfferCount: z.number().int().nonnegative(),
    unmatchedOfferCount: z.number().int().nonnegative(),
    queuedOfferCount: z.number().int().nonnegative(),
    requirementMentionOfferCount: z.number().int().nonnegative(),
    descriptionOnlyMentionOfferCount: z.number().int().nonnegative(),
    reviewedQualificationExactOfferCount: z.number().int().nonnegative(),
    entries: z.array(FpMentionOfferQueueEntrySchema),
    limitations: z.array(z.string().min(5)),
  })
  .strict();

type LoadedResources = Awaited<ReturnType<typeof loadResources>>;
export type FpMentionOfferQueueReport = z.infer<
  typeof FpMentionOfferQueueReportSchema
>;

function normalizedText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

const FP_MENTION_PATTERN =
  /\b(?:formacion profesional|f p|fp(?:\s*(?:i{1,2}|1|2))?)\b/iu;

export function mentionsFp(value: string): boolean {
  return FP_MENTION_PATTERN.test(normalizedText(value));
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function resourcePath(root: string, manifestPath: string): string {
  return resolve(root, "public", manifestPath.slice(1));
}

async function loadResources(manifestPath: string) {
  const root = process.cwd();
  const manifest = GeneratedManifestSchema.parse(await readJson(manifestPath));
  const snapshots = manifest.resourceSnapshots;
  const [programs, occupations, aliases, links, offers, requirements] =
    await Promise.all([
      readJson(resourcePath(root, snapshots.programs.resourcePath)),
      readJson(resourcePath(root, snapshots.occupations.resourcePath)),
      readJson(resourcePath(root, snapshots.occupationAliases.resourcePath)),
      readJson(
        resourcePath(root, snapshots.trainingOccupationLinks.resourcePath),
      ),
      readJson(resourcePath(root, snapshots.jobOffers.resourcePath)),
      readJson(
        resourcePath(root, snapshots.publishedRequirements.resourcePath),
      ),
    ]);

  return {
    manifest,
    programs: z.array(TrainingProgramSchema).parse(programs),
    occupations: OccupationsSchema.parse(occupations),
    aliases: OccupationAliasesSchema.parse(aliases),
    links: TrainingOccupationLinksSchema.parse(links),
    offers: z.array(JobOfferSchema).parse(offers),
    requirements: PublishedRequirementsResourceSchema.parse(requirements),
  };
}

function collectMatchedOfferIds(resources: LoadedResources): Set<string> {
  const matchedOfferIds = new Set<string>();
  for (const program of resources.programs) {
    let matches;
    try {
      matches = matchOffersForProgram(program.programKey, {
        programs: resources.programs,
        qualifications: REVIEWED_QUALIFICATIONS,
        programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
        occupations: resources.occupations,
        aliases: resources.aliases,
        links: resources.links,
        offers: resources.offers,
        publishedRequirements: resources.requirements,
        humanOverrides: [],
      });
    } catch (error) {
      throw new Error(
        `No se pudieron calcular ofertas para ${program.programKey}.`,
        { cause: error },
      );
    }
    for (const match of matches) matchedOfferIds.add(match.offerId);
  }
  return matchedOfferIds;
}

function snapshotId(manifest: GeneratedManifest): string {
  return (
    manifest.resourceSnapshots.jobOffers.resourcePath.split("/").at(-2) ?? ""
  );
}

export async function buildFpMentionOfferQueue(
  manifestPath = resolve(process.cwd(), "public/data/v1/manifest.json"),
): Promise<{ report: FpMentionOfferQueueReport; markdown: string }> {
  const resources = await loadResources(manifestPath);
  const matchedOfferIds = collectMatchedOfferIds(resources);
  const requirementsByOffer = new Map(
    resources.requirements.map((entry) => [entry.offerId, entry.requirements]),
  );
  const programsByQualification = new Map<string, string[]>();
  for (const link of REVIEWED_PROGRAM_QUALIFICATION_LINKS) {
    if (link.reviewStatus !== "approved") continue;
    const programKeys =
      programsByQualification.get(link.qualificationCatalogId) ?? [];
    programKeys.push(link.programKey);
    programsByQualification.set(link.qualificationCatalogId, programKeys);
  }

  const entries = resources.offers
    .filter((offer) => !matchedOfferIds.has(offer.id))
    .flatMap((offer) => {
      const publishedRequirements = requirementsByOffer.get(offer.id) ?? [];
      const requirementQuotes = [
        ...offer.descriptionSections.requirements,
        ...publishedRequirements.map((requirement) => requirement.sourceQuote),
      ].filter(mentionsFp);
      const reviewedLabels = new Set<string>();
      const candidateProgramKeys = new Set<string>();

      for (const requirement of publishedRequirements) {
        if (requirement.category !== "qualification_or_specialization") {
          continue;
        }
        const reviewedLabel =
          reviewedQualificationLabel(requirement.sourceQuote) ??
          reviewedQualificationLabel(requirement.normalizedValue);
        if (!reviewedLabel) continue;
        reviewedLabels.add(reviewedLabel);
        const qualification = REVIEWED_QUALIFICATIONS.find(
          (entry) => entry.canonicalLabel === reviewedLabel,
        );
        if (!qualification) continue;
        for (const programKey of programsByQualification.get(
          qualification.catalogId,
        ) ?? []) {
          candidateProgramKeys.add(programKey);
        }
      }

      const descriptionMention = mentionsFp(offer.descriptionText);
      if (
        reviewedLabels.size === 0 &&
        requirementQuotes.length === 0 &&
        !descriptionMention
      ) {
        return [];
      }

      const mentionScope =
        reviewedLabels.size > 0
          ? "reviewed_qualification_exact"
          : requirementQuotes.length > 0
            ? "requirement_generic_fp"
            : "description_only_fp";

      return [
        {
          offerId: offer.id,
          title: offer.title,
          province: offer.province,
          sourceName: offer.sourceName,
          originalUrl: offer.originalUrl,
          mentionScope,
          reviewedQualificationLabels: [...reviewedLabels].toSorted(),
          candidateProgramKeys: [...candidateProgramKeys].toSorted(),
          requirementQuotes: [...new Set(requirementQuotes)].toSorted(),
        },
      ];
    })
    .sort(
      (left, right) =>
        left.mentionScope.localeCompare(right.mentionScope) ||
        left.title.localeCompare(right.title, "es") ||
        left.offerId.localeCompare(right.offerId),
    );

  const report = FpMentionOfferQueueReportSchema.parse({
    schemaVersion: "1.0.0",
    snapshotId: snapshotId(resources.manifest),
    totalOffers: resources.offers.length,
    matchedOfferCount: matchedOfferIds.size,
    unmatchedOfferCount: resources.offers.length - matchedOfferIds.size,
    queuedOfferCount: entries.length,
    requirementMentionOfferCount: entries.filter(
      (entry) => entry.requirementQuotes.length > 0,
    ).length,
    descriptionOnlyMentionOfferCount: entries.filter(
      (entry) => entry.mentionScope === "description_only_fp",
    ).length,
    reviewedQualificationExactOfferCount: entries.filter(
      (entry) => entry.mentionScope === "reviewed_qualification_exact",
    ).length,
    entries,
    limitations: [
      "La cola solo prioriza ofertas no enlazadas de la instantánea publicada.",
      "Una mención genérica a FP no demuestra por sí sola una relación con un ciclo concreto.",
      "Solo las titulaciones del catálogo cerrado revisado se marcan como coincidencia exacta.",
      "Ninguna entrada se publica automáticamente como relación o alias.",
    ],
  });

  const markdown = renderMarkdown(report);
  return { report, markdown };
}

function renderMarkdown(report: FpMentionOfferQueueReport): string {
  const lines = [
    "# Cola de ofertas no enlazadas con mención a FP",
    "",
    `- Snapshot: \`${report.snapshotId}\``,
    `- Ofertas: ${report.totalOffers}`,
    `- Ofertas enlazadas: ${report.matchedOfferCount}`,
    `- Ofertas no enlazadas: ${report.unmatchedOfferCount}`,
    `- Cola FP: ${report.queuedOfferCount}`,
    `- Mención en requisitos: ${report.requirementMentionOfferCount}`,
    `- Solo mención en descripción: ${report.descriptionOnlyMentionOfferCount}`,
    `- Titulación revisada exacta: ${report.reviewedQualificationExactOfferCount}`,
    "",
    "| Prioridad | Oferta | Provincia | Titulación revisada | Ciclos candidatos |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const entry of report.entries) {
    lines.push(
      `| ${entry.mentionScope} | [${entry.title}](${entry.originalUrl}) (\`${entry.offerId}\`) | ${entry.province ?? "—"} | ${entry.reviewedQualificationLabels.join(", ") || "—"} | ${entry.candidateProgramKeys.join(", ") || "—"} |`,
    );
  }
  lines.push("", "## Limitaciones", "");
  for (const limitation of report.limitations) lines.push(`- ${limitation}`);
  lines.push(
    "",
    "Los recuentos corresponden únicamente a la instantánea controlada y no incluyen marcas de tiempo.",
  );
  return lines.join("\n");
}

async function run(): Promise<void> {
  const { report, markdown } = await buildFpMentionOfferQueue();
  await writeFile(
    resolve(process.cwd(), "analysis/fp_mention_offer_queue.json"),
    await formatWithPrettier(`${JSON.stringify(report)}\n`, {
      parser: "json",
    }),
    "utf8",
  );
  await writeFile(
    resolve(process.cwd(), "analysis/fp_mention_offer_queue.md"),
    await formatWithPrettier(`${markdown}\n`, { parser: "markdown" }),
    "utf8",
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run();
}
