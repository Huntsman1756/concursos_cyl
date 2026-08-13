import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { format as formatWithPrettier } from "prettier";
import { z } from "zod";

import curatedAliasesJson from "../../data/curated/occupation-aliases.json";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import { FpMarginalAliasReviewSchema } from "../../data/schemas/fpMarginalAliasReview";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type OccupationAlias,
} from "../../data/schemas/curatedMappings";
import {
  GeneratedManifestSchema,
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";

const ProgramDeltaSchema = z
  .object({
    programKey: z.string().min(1),
    beforeOfferCount: z.number().int().nonnegative(),
    afterOfferCount: z.number().int().nonnegative(),
    marginalOfferIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const FpMarginalAliasImpactSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    snapshotId: z.string().min(1),
    baselineMatchedOfferCount: z.number().int().nonnegative(),
    proposedMatchedOfferCount: z.number().int().nonnegative(),
    marginalOfferCount: z.number().int().nonnegative(),
    marginalOfferIds: z.array(z.string().min(1)),
    expectedAcceptedOfferCount: z.number().int().nonnegative(),
    expectedAcceptedOfferIds: z.array(z.string().min(1)),
    missingExpectedOfferIds: z.array(z.string().min(1)),
    unexpectedOfferIds: z.array(z.string().min(1)),
    programDeltas: z.array(ProgramDeltaSchema),
  })
  .strict();

type Resources = Awaited<ReturnType<typeof loadResources>>;
type MatchMap = Map<string, Set<string>>;

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function resourcePath(root: string, path: string, snapshotId: string): string {
  const addressedPath = path.replace(
    /\/snapshots\/[^/]+\//u,
    `/snapshots/${snapshotId}/`,
  );
  return resolve(root, "public", addressedPath.slice(1));
}

async function loadResources(manifestPath: string, pinnedSnapshotId: string) {
  const root = process.cwd();
  const manifest = GeneratedManifestSchema.parse(await readJson(manifestPath));
  const snapshots = manifest.resourceSnapshots;
  const [programs, occupations, aliases, links, offers, requirements] =
    await Promise.all([
      readJson(
        resourcePath(root, snapshots.programs.resourcePath, pinnedSnapshotId),
      ),
      readJson(
        resourcePath(
          root,
          snapshots.occupations.resourcePath,
          pinnedSnapshotId,
        ),
      ),
      readJson(
        resourcePath(
          root,
          snapshots.occupationAliases.resourcePath,
          pinnedSnapshotId,
        ),
      ),
      readJson(
        resourcePath(
          root,
          snapshots.trainingOccupationLinks.resourcePath,
          pinnedSnapshotId,
        ),
      ),
      readJson(
        resourcePath(root, snapshots.jobOffers.resourcePath, pinnedSnapshotId),
      ),
      readJson(
        resourcePath(
          root,
          snapshots.publishedRequirements.resourcePath,
          pinnedSnapshotId,
        ),
      ),
    ]);
  return {
    pinnedSnapshotId,
    programs: z.array(TrainingProgramSchema).parse(programs),
    occupations: OccupationsSchema.parse(occupations),
    baselineAliases: OccupationAliasesSchema.parse(aliases),
    links: TrainingOccupationLinksSchema.parse(links),
    offers: z.array(JobOfferSchema).parse(offers),
    requirements: PublishedRequirementsResourceSchema.parse(requirements),
  };
}

function matchesByProgram(
  resources: Resources,
  aliases: readonly OccupationAlias[],
): MatchMap {
  const result = new Map<string, Set<string>>();
  for (const program of resources.programs) {
    const matches = matchOffersForProgram(program.programKey, {
      programs: resources.programs,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      occupations: resources.occupations,
      aliases,
      links: resources.links,
      offers: resources.offers,
      publishedRequirements: resources.requirements,
      humanOverrides: [],
    });
    result.set(
      program.programKey,
      new Set(matches.map((match) => match.offerId)),
    );
  }
  return result;
}

function unionOfferIds(matches: MatchMap): Set<string> {
  return new Set([...matches.values()].flatMap((offerIds) => [...offerIds]));
}

export async function measureFpMarginalAliasImpact(
  manifestPath = resolve(process.cwd(), "public/data/v1/manifest.json"),
) {
  const review = FpMarginalAliasReviewSchema.parse(
    await readJson(
      resolve(process.cwd(), "analysis/fp_marginal_alias_review.json"),
    ),
  );
  const resources = await loadResources(manifestPath, review.snapshotId);
  const proposedAliases = OccupationAliasesSchema.parse(curatedAliasesJson);

  const baseline = matchesByProgram(resources, resources.baselineAliases);
  const proposed = matchesByProgram(resources, proposedAliases);
  const baselineUnion = unionOfferIds(baseline);
  const proposedUnion = unionOfferIds(proposed);
  const marginalOfferIds = [...proposedUnion]
    .filter((offerId) => !baselineUnion.has(offerId))
    .sort();
  const expectedAcceptedOfferIds = [
    ...new Set(
      review.rows
        .filter((row) => row.disposition === "accepted")
        .flatMap((row) => row.marginalOfferIds),
    ),
  ].sort();
  const expected = new Set(expectedAcceptedOfferIds);
  const actual = new Set(marginalOfferIds);

  const programDeltas = resources.programs
    .flatMap((program) => {
      const before = baseline.get(program.programKey) ?? new Set<string>();
      const after = proposed.get(program.programKey) ?? new Set<string>();
      const delta = [...after].filter((offerId) => !before.has(offerId)).sort();
      return delta.length === 0
        ? []
        : [
            {
              programKey: program.programKey,
              beforeOfferCount: before.size,
              afterOfferCount: after.size,
              marginalOfferIds: delta,
            },
          ];
    })
    .sort((left, right) => left.programKey.localeCompare(right.programKey));

  const report = FpMarginalAliasImpactSchema.parse({
    schemaVersion: "1.0.0",
    snapshotId: resources.pinnedSnapshotId,
    baselineMatchedOfferCount: baselineUnion.size,
    proposedMatchedOfferCount: proposedUnion.size,
    marginalOfferCount: marginalOfferIds.length,
    marginalOfferIds,
    expectedAcceptedOfferCount: expectedAcceptedOfferIds.length,
    expectedAcceptedOfferIds,
    missingExpectedOfferIds: expectedAcceptedOfferIds.filter(
      (offerId) => !actual.has(offerId),
    ),
    unexpectedOfferIds: marginalOfferIds.filter(
      (offerId) => !expected.has(offerId),
    ),
    programDeltas,
  });
  return { report, markdown: renderMarkdown(report) };
}

function renderMarkdown(
  report: z.infer<typeof FpMarginalAliasImpactSchema>,
): string {
  const lines = [
    "# Impacto de alias FP marginales",
    "",
    `- Snapshot: \`${report.snapshotId}\``,
    `- Ofertas enlazadas antes: ${report.baselineMatchedOfferCount}`,
    `- Ofertas enlazadas después: ${report.proposedMatchedOfferCount}`,
    `- Ganancia marginal: ${report.marginalOfferCount}`,
    `- Ofertas inesperadas: ${report.unexpectedOfferIds.length}`,
    `- Ofertas esperadas ausentes: ${report.missingExpectedOfferIds.length}`,
    "",
    "| Programa | Antes | Después | Ofertas marginales |",
    "| --- | ---: | ---: | --- |",
  ];
  for (const delta of report.programDeltas) {
    lines.push(
      `| ${delta.programKey} | ${delta.beforeOfferCount} | ${delta.afterOfferCount} | ${delta.marginalOfferIds.join(", ")} |`,
    );
  }
  lines.push(
    "",
    "La comparación usa la misma instantánea congelada para el antes y el después.",
  );
  return lines.join("\n");
}

async function run(): Promise<void> {
  const { report, markdown } = await measureFpMarginalAliasImpact();
  await writeFile(
    resolve(process.cwd(), "analysis/fp_marginal_alias_impact.json"),
    await formatWithPrettier(`${JSON.stringify(report)}\n`, { parser: "json" }),
    "utf8",
  );
  await writeFile(
    resolve(process.cwd(), "analysis/fp_marginal_alias_impact.md"),
    await formatWithPrettier(`${markdown}\n`, { parser: "markdown" }),
    "utf8",
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await run();
}
