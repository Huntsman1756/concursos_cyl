import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

import {
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type TrainingOffering,
  type TrainingProgram,
} from "../../data/schemas/generated";
import { MappingCoverageResourceSchema } from "../../data/schemas/curatedMappings";
import {
  FpCoverageResearchOutcomesSchema,
  type FpCoverageResearchOutcomeEntry,
} from "../../data/schemas/fpCoverageResearchOutcomes";
import {
  FpCoverageResearchQueueSchema,
  type FpCoverageResearchCandidate,
  type FpCoverageResearchQueue,
} from "../../data/schemas/fpCoverageResearchQueue";

const CONTRACT =
  "Training-offer signals prioritize official research only; they are not CNO evidence and never authorize publication." as const;

type ProgramCoverage = Extract<
  (typeof MappingCoverageResourceSchema)["_output"][number],
  { scope: "program" }
>;

function normalizedBaseTitle(title: string): string {
  return title.replace(/\s*\(distancia\)\s*$/iu, "").trim();
}

export function deriveBaseProgramKey(
  program: TrainingProgram,
  programsByKey: ReadonlyMap<string, TrainingProgram>,
): string {
  if (!program.programKey.endsWith("D")) return program.programKey;
  const possibleBaseKey = program.programKey.slice(0, -1);
  const possibleBase = programsByKey.get(possibleBaseKey);
  if (
    possibleBase !== undefined &&
    possibleBase.familyCode === program.familyCode &&
    possibleBase.level === program.level &&
    possibleBase.programTitle === normalizedBaseTitle(program.programTitle)
  ) {
    return possibleBaseKey;
  }
  return program.programKey;
}

function compareCandidates(
  left: Omit<FpCoverageResearchCandidate, "rank">,
  right: Omit<FpCoverageResearchCandidate, "rank">,
): number {
  return (
    right.offeringCount - left.offeringCount ||
    right.provinceCount - left.provinceCount ||
    right.centerCount - left.centerCount ||
    (left.baseProgramKey < right.baseProgramKey
      ? -1
      : left.baseProgramKey > right.baseProgramKey
        ? 1
        : 0)
  );
}

export function buildFpCoverageResearchQueue(input: {
  snapshotGeneratedAt: string;
  programs: readonly TrainingProgram[];
  offerings: readonly TrainingOffering[];
  coverage: readonly ProgramCoverage[];
  researchOutcomes: readonly FpCoverageResearchOutcomeEntry[];
  catalogSha256: string;
}): FpCoverageResearchQueue {
  const programsByKey = new Map(
    input.programs.map((program) => [program.programKey, program]),
  );
  const coverageByKey = new Map(
    input.coverage.map((row) => [row.programKey, row]),
  );
  const noMatchOutcomesByKey = new Map<
    string,
    FpCoverageResearchOutcomeEntry
  >();
  for (const entry of input.researchOutcomes) {
    if (entry.status === "reviewed-no-publishable-match") {
      noMatchOutcomesByKey.set(entry.baseProgramKey, entry);
    }
  }
  const groups = new Map<string, TrainingProgram[]>();
  for (const program of input.programs) {
    const baseKey = deriveBaseProgramKey(program, programsByKey);
    const group = groups.get(baseKey) ?? [];
    group.push(program);
    groups.set(baseKey, group);
  }

  let reviewedBaseCount = 0;
  let completedNoMatchBaseCount = 0;
  const candidates: Array<Omit<FpCoverageResearchCandidate, "rank">> = [];
  for (const [baseProgramKey, group] of groups) {
    const programKeys = group.map(({ programKey }) => programKey).toSorted();
    const rows = programKeys
      .map((key) => coverageByKey.get(key))
      .filter((row): row is ProgramCoverage => row !== undefined);
    if (
      rows.some(
        (row) => row.coverageStatus === "reviewed" || row.approvedMappings > 0,
      )
    ) {
      reviewedBaseCount += 1;
      continue;
    }
    const noMatchOutcome = noMatchOutcomesByKey.get(baseProgramKey);
    if (
      noMatchOutcome !== undefined &&
      noMatchOutcome.occupationCatalogSha256 === input.catalogSha256
    ) {
      completedNoMatchBaseCount += 1;
      continue;
    }
    const groupOfferings = input.offerings.filter((offering) =>
      programKeys.includes(offering.programKey),
    );
    const base = programsByKey.get(baseProgramKey) ?? group[0];
    candidates.push({
      baseProgramKey,
      programKeys,
      programTitle: normalizedBaseTitle(base.programTitle),
      familyCode: base.familyCode,
      familyName: base.familyName,
      level: base.level,
      offeringCount: new Set(groupOfferings.map(({ offeringId }) => offeringId))
        .size,
      provinceCount: new Set(groupOfferings.map(({ province }) => province))
        .size,
      centerCount: new Set(groupOfferings.map(({ centerCode }) => centerCode))
        .size,
      priorDraft: rows.some((row) => row.coverageStatus === "draft"),
      priorityOnly: true,
    });
  }

  const ranked = candidates
    .sort(compareCandidates)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  return FpCoverageResearchQueueSchema.parse({
    snapshotGeneratedAt: input.snapshotGeneratedAt,
    reviewedBaseCount,
    completedNoMatchBaseCount,
    pendingBaseCount: ranked.length,
    contract: CONTRACT,
    candidates: ranked,
  });
}

export function renderFpCoverageResearchQueue(
  queue: FpCoverageResearchQueue,
): string {
  const rows = queue.candidates
    .slice(0, 30)
    .map(
      (candidate) =>
        `| ${candidate.rank} | ${candidate.baseProgramKey} | ${candidate.programTitle} | ${candidate.familyName} | ${candidate.offeringCount} | ${candidate.provinceCount} | ${candidate.centerCount} | ${candidate.priorDraft ? "sí" : "no"} |`,
    )
    .join("\n");
  return `# Cola incremental de investigación FP–ocupación\n\n- Snapshot: ${queue.snapshotGeneratedAt}\n- Cualificaciones base revisadas: ${queue.reviewedBaseCount}\n- Cualificaciones base sin coincidencia publicable (completadas): ${queue.completedNoMatchBaseCount}\n- Cualificaciones base pendientes: ${queue.pendingBaseCount}\n- Contrato: ${queue.contract}\n\nLa tabla muestra las primeras 30 prioridades. La cola JSON conserva todo el universo pendiente.\n\n| Prioridad | Ciclo base | Título | Familia | Ofertas formativas | Provincias | Centros | Borrador previo |\n| ---: | --- | --- | --- | ---: | ---: | ---: | --- |\n${rows}\n`;
}

function publicResourcePath(root: string, resourcePath: string): string {
  const publicRoot = resolve(root, "public");
  const candidate = resolve(publicRoot, `.${resourcePath}`);
  if (!candidate.startsWith(`${publicRoot}${sep}`)) {
    throw new Error(`Resource path escapes public root: ${resourcePath}`);
  }
  return candidate;
}

export async function loadFpCoverageResearchQueueInputs(root: string) {
  const manifest = JSON.parse(
    await readFile(resolve(root, "public/data/v1/manifest.json"), "utf8"),
  ) as {
    generatedAt: string;
    resourceSnapshots: Record<string, { resourcePath: string }>;
  };
  const pathFor = (key: string) => {
    const resourcePath = manifest.resourceSnapshots[key]?.resourcePath;
    if (resourcePath === undefined) throw new Error(`Missing ${key} snapshot.`);
    return publicResourcePath(root, resourcePath);
  };
  const [programs, offerings, coverage, outcomesRaw, occupationsRaw] =
    await Promise.all([
      readFile(pathFor("programs"), "utf8"),
      readFile(pathFor("trainingOfferings"), "utf8"),
      readFile(pathFor("mappingCoverage"), "utf8"),
      readFile(
        resolve(root, "analysis/fp_coverage_research_outcomes.json"),
        "utf8",
      ),
      readFile(resolve(root, "data/curated/occupations.json"), "utf8"),
    ]);
  const catalogSha256 = createHash("sha256")
    .update(occupationsRaw)
    .digest("hex");
  return {
    snapshotGeneratedAt: manifest.generatedAt,
    programs: TrainingProgramSchema.array().parse(JSON.parse(programs)),
    offerings: TrainingOfferingSchema.array().parse(JSON.parse(offerings)),
    coverage: MappingCoverageResourceSchema.parse(JSON.parse(coverage)).filter(
      (row): row is ProgramCoverage => row.scope === "program",
    ),
    researchOutcomes: FpCoverageResearchOutcomesSchema.parse(
      JSON.parse(outcomesRaw),
    ).outcomes,
    catalogSha256,
  };
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  resolve(invokedPath) === fileURLToPath(import.meta.url)
) {
  const root = process.cwd();
  const queue = buildFpCoverageResearchQueue(
    await loadFpCoverageResearchQueueInputs(root),
  );
  await writeFile(
    resolve(root, "analysis/fp_coverage_research_queue.json"),
    await prettier.format(JSON.stringify(queue, null, 2), {
      filepath: "fp_coverage_research_queue.json",
    }),
  );
  await writeFile(
    resolve(root, "analysis/fp_coverage_research_queue.md"),
    await prettier.format(renderFpCoverageResearchQueue(queue), {
      filepath: "fp_coverage_research_queue.md",
    }),
  );
  console.info("FP coverage research queue generated.");
}
