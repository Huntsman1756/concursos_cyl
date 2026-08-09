import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

import {
  FpExpansionCandidateEvidenceSchema,
  FpExpansionCandidateSchema,
  FpExpansionRankingSchema,
  FP_EXPANSION_RANKING_CONTRACT,
  canonicalizeFpQualificationIdentity,
  type FpExpansionCandidate,
  type FpExpansionCandidateEvidence,
  type FpExpansionRanking,
} from "../../data/schemas/fpCoverageExpansion";

export type CandidateEvidence = FpExpansionCandidateEvidence;

export type RankInput = {
  candidates: readonly unknown[];
  knownProgramKeys: ReadonlySet<string> | readonly string[];
  reviewedBaseQualificationIdentities: ReadonlySet<string> | readonly string[];
};

export type RankResult = FpExpansionRanking;

const requiredFamilies = new Set([
  "Electricidad y Electrónica",
  "Instalación y Mantenimiento",
]);

function asSet(
  values: ReadonlySet<string> | readonly string[],
): ReadonlySet<string> {
  return values instanceof Set ? values : new Set(values);
}

function compareTuple(
  left: FpExpansionCandidate,
  right: FpExpansionCandidate,
): number {
  const [leftReadiness, leftCollisions, leftExact, leftFamily, leftKey] =
    left.scoreTuple;
  const [rightReadiness, rightCollisions, rightExact, rightFamily, rightKey] =
    right.scoreTuple;
  if (leftReadiness !== rightReadiness)
    return leftReadiness < rightReadiness ? -1 : 1;
  if (leftCollisions !== rightCollisions)
    return leftCollisions < rightCollisions ? -1 : 1;
  if (leftExact !== rightExact) return leftExact < rightExact ? -1 : 1;
  if (leftFamily !== rightFamily) return leftFamily < rightFamily ? -1 : 1;
  if (leftKey < rightKey) return -1;
  if (leftKey > rightKey) return 1;
  return 0;
}

function fail(message: string): never {
  throw new Error(message);
}

export function rankFpCoverageExpansionCandidates(
  input: RankInput,
): RankResult {
  if (input.candidates.length < 14) {
    fail("At least 14 candidates are required before ranking.");
  }

  const candidates = input.candidates.map((candidate) =>
    FpExpansionCandidateEvidenceSchema.parse(candidate),
  );
  const knownProgramKeys = asSet(input.knownProgramKeys);
  const reviewedBases = new Set(
    Array.from(
      asSet(input.reviewedBaseQualificationIdentities),
      canonicalizeFpQualificationIdentity,
    ),
  );
  const seenBases = new Set<string>();

  for (const candidate of candidates) {
    if (!knownProgramKeys.has(candidate.programKey)) {
      fail(`Unknown program key: ${candidate.programKey}.`);
    }
    const canonicalBase = canonicalizeFpQualificationIdentity(
      candidate.baseQualificationIdentity,
    );
    if (reviewedBases.has(canonicalBase)) {
      fail(
        `Candidate uses a reviewed or stale base: ${candidate.baseQualificationIdentity}.`,
      );
    }
    if (seenBases.has(canonicalBase)) {
      fail(
        `Duplicate base qualification identity: ${candidate.baseQualificationIdentity}.`,
      );
    }
    seenBases.add(canonicalBase);
    if (
      candidate.programKey === "COM01M" &&
      candidate.sourceReadiness === "output_only"
    ) {
      fail(
        "COM01M cannot enter the ranking without new classification evidence.",
      );
    }
  }

  for (const family of requiredFamilies) {
    if (!candidates.some((candidate) => candidate.family === family)) {
      fail(`Candidate ranking must represent ${family}.`);
    }
  }

  const ranked = candidates
    .map((candidate) =>
      FpExpansionCandidateSchema.parse({
        ...candidate,
        rank: 1,
        scoreTuple: [
          candidate.sourceReadiness === "exact_program_to_cno" ? 0 : 1,
          candidate.collisionCount,
          -candidate.exactTitleSignalCount,
          -candidate.familySignalCount,
          candidate.programKey,
        ],
      }),
    )
    .sort(compareTuple)
    .map((candidate, index) =>
      FpExpansionCandidateSchema.parse({ ...candidate, rank: index + 1 }),
    );

  return FpExpansionRankingSchema.parse({
    primaryCandidates: ranked.slice(0, 7),
    reserveCandidates: ranked.slice(7),
  });
}

export function renderFpCoverageExpansionCandidates(
  ranking: RankResult,
): string {
  const checked = FpExpansionRankingSchema.parse(ranking);
  const rows = [...checked.primaryCandidates, ...checked.reserveCandidates]
    .map(
      (candidate) =>
        `| ${candidate.rank} | ${candidate.programKey} | ${candidate.programTitle} | ${candidate.family} | ${candidate.sourceReadiness} | ${candidate.familySignalCount} | ${candidate.exactTitleSignalCount} | ${candidate.collisionCount} | [recorded source URL](${candidate.sourceUrls[0]}) |`,
    )
    .join("\n");
  return `# FP coverage expansion candidate ranking\n\nSeven primary candidates and seven reserves are frozen below. Modalities such as IFC03S and IFC03SD collapse to one base qualification identity and never increase the distinct count.\n\nSignals are local demand signals from the corrected notebook and current manifest; they are not CNO evidence or product coverage. ${FP_EXPANSION_RANKING_CONTRACT}\n\nThe ordering tuple is [readiness, collision count, -exact-title signal, -family signal, program key] with strict code-point key ordering.\n\n| Rank | Program | Title | Family | Readiness | Family signal | Exact-title signal | Collisions | Official source |\n| ---: | --- | --- | --- | --- | ---: | ---: | ---: | --- |\n${rows}\n`;
}

export async function serializeFpCoverageExpansionCandidates(
  ranking: RankResult,
): Promise<string> {
  const checked = FpExpansionRankingSchema.parse(ranking);
  return prettier.format(JSON.stringify(checked, null, 2), {
    filepath: "fp_coverage_expansion_candidates.json",
  });
}

async function serializeFpCoverageExpansionCandidatesMarkdown(
  ranking: RankResult,
): Promise<string> {
  return prettier.format(renderFpCoverageExpansionCandidates(ranking), {
    filepath: "fp_coverage_expansion_candidates.md",
  });
}

async function loadCurrentProgramKeys(
  rootDirectory: string,
): Promise<Set<string>> {
  const manifest = JSON.parse(
    await readFile(
      resolve(rootDirectory, "public/data/v1/manifest.json"),
      "utf8",
    ),
  ) as {
    resourceSnapshots: { programs: { resourcePath: string } };
  };
  const programs = JSON.parse(
    await readFile(
      resolve(
        rootDirectory,
        `public${manifest.resourceSnapshots.programs.resourcePath}`,
      ),
      "utf8",
    ),
  ) as Array<{ programKey: string }>;
  return new Set(programs.map(({ programKey }) => programKey));
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  resolve(invokedPath) === fileURLToPath(import.meta.url)
) {
  const rootDirectory = process.cwd();
  const candidateFile = resolve(
    rootDirectory,
    "analysis/fp_coverage_expansion_candidates.json",
  );
  const candidateData = JSON.parse(await readFile(candidateFile, "utf8")) as {
    candidates?: unknown[];
    primaryCandidates?: Array<Record<string, unknown>>;
    reserveCandidates?: Array<Record<string, unknown>>;
  };
  const rawCandidates =
    candidateData.candidates ??
    [
      ...(candidateData.primaryCandidates ?? []),
      ...(candidateData.reserveCandidates ?? []),
    ].map((entry) => {
      const { rank: _rank, scoreTuple: _scoreTuple, ...candidate } = entry;
      void _rank;
      void _scoreTuple;
      return candidate;
    });
  const ranking = rankFpCoverageExpansionCandidates({
    candidates: rawCandidates,
    knownProgramKeys: await loadCurrentProgramKeys(rootDirectory),
    reviewedBaseQualificationIdentities: [
      "qualification:IFC03S",
      "qualification:SAN21",
      "qualification:HOT01M",
      "qualification:SSC01M",
      "qualification:EOC01M",
    ],
  });
  await writeFile(
    resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    await serializeFpCoverageExpansionCandidates(ranking),
  );
  await writeFile(
    resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.md"),
    await serializeFpCoverageExpansionCandidatesMarkdown(ranking),
  );
  console.info("FP coverage expansion candidates ranked.");
}
