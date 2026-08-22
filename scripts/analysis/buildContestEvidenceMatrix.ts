import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const AUDIT_CUTOFF = "2026-08-22T04:13:28+02:00";
const CURATED_RELATIONS_PATH = "data/curated/training-occupation-links.json";
const MATRIX_GENERATED_PATHS = new Set([
  "analysis/contest_evidence_matrix.json",
  "analysis/contest_evidence_matrix.md",
  "analysis/contest_evidence_matrix_base.json",
]);
export const CONTEST_EVIDENCE_MATRIX_INPUT_PATHS = [
  CURATED_RELATIONS_PATH,
  "analysis",
] as const;
const TEXT_EXTENSIONS = new Set([".json", ".md", ".txt"]);
const OFFICIAL_DOMAINS = [
  "boe.es",
  "todofp.es",
  "ine.es",
  "sepe.es",
  "jcyl.es",
];

interface CuratedRelation {
  trainingProgramKey: string;
  occupationId: string;
  relationshipType: string;
  reviewStatus: string;
  sourceUrl: string;
  sourceQuote: string;
  reviewedAt: string;
}

interface ArtifactText {
  path: string;
  text: string;
}

interface IndependentSampleRelation {
  relationKey: string;
  status: string;
  auditStatus: string;
  sourceUrl: string;
  sourceQuote: string;
}

interface IndependentSampleDocument {
  sourceCommitSha: string;
  population: number;
  sampleSize: number;
  seed: string;
  auditedAt: string;
  independentlyAudited: boolean;
  exhaustive: boolean;
  summary: {
    pass: number;
    fail: number;
    samplePass: number;
    notSampled: number;
    exhaustive: boolean;
  };
  relations: IndependentSampleRelation[];
}

function gitText(rootDirectory: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: rootDirectory,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
}

export function getDirtyContestEvidenceMatrixInputPaths(
  rootDirectory = resolve("."),
): string[] {
  const status = execFileSync(
    "git",
    [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      ...CONTEST_EVIDENCE_MATRIX_INPUT_PATHS,
    ],
    {
      cwd: rootDirectory,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  return status
    .split(/\r?\n/u)
    .map((line) => ({
      raw: line,
      changedPath: line.slice(3).split(" -> ").at(-1) ?? "",
    }))
    .filter(({ raw }) => raw.trim() !== "")
    .filter(({ changedPath }) => {
      return !MATRIX_GENERATED_PATHS.has(changedPath);
    })
    .map(({ raw }) => raw.trim());
}

/**
 * Resolves the immutable source boundary for the matrix. By default this is
 * the checked-out HEAD (the future S commit); callers may pass S explicitly
 * when checking generated artifacts after a later documentation commit.
 * A matrix must never silently pair a checked-in sample with a dirty source.
 */
export function resolveContestEvidenceSourceCommit(
  rootDirectory = resolve("."),
  requestedSourceCommitSha?: string,
): string {
  const dirty = getDirtyContestEvidenceMatrixInputPaths(rootDirectory);
  if (dirty.length > 0) {
    throw new Error(
      `Contest evidence inputs are dirty: ${dirty.join("; ")}. Commit the source before building the matrix.`,
    );
  }
  const sourceCommitSha =
    requestedSourceCommitSha ?? gitText(rootDirectory, ["rev-parse", "HEAD"]);
  if (!/^[a-f0-9]{40}$/u.test(sourceCommitSha)) {
    throw new Error(
      `Could not resolve a commit boundary for ${CURATED_RELATIONS_PATH}.`,
    );
  }
  try {
    gitText(rootDirectory, [
      "rev-parse",
      "--verify",
      `${sourceCommitSha}^{commit}`,
    ]);
    gitText(rootDirectory, [
      "show",
      `${sourceCommitSha}:${CURATED_RELATIONS_PATH}`,
    ]);
  } catch {
    throw new Error(
      `Source commit ${sourceCommitSha} does not contain ${CURATED_RELATIONS_PATH}.`,
    );
  }
  try {
    execFileSync(
      "git",
      ["merge-base", "--is-ancestor", sourceCommitSha, "HEAD"],
      { cwd: rootDirectory, stdio: "pipe" },
    );
  } catch {
    throw new Error(
      `Source commit ${sourceCommitSha} is not an ancestor of the current HEAD.`,
    );
  }
  try {
    gitText(rootDirectory, [
      "diff",
      "--quiet",
      sourceCommitSha,
      "--",
      CURATED_RELATIONS_PATH,
    ]);
  } catch {
    throw new Error(
      `Contest evidence source changed after source commit ${sourceCommitSha}.`,
    );
  }
  return sourceCommitSha;
}

function sampleDigest(seed: string, relationKey: string): string {
  return createHash("sha256").update(`${seed}|${relationKey}`).digest("hex");
}

function loadIndependentSample(
  rootDirectory: string,
  approved: readonly CuratedRelation[],
  sourceCommitSha: string,
): IndependentSampleDocument {
  const sample = JSON.parse(
    readFileSync(
      resolve(rootDirectory, "analysis/contest_evidence_live_sample.json"),
      "utf8",
    ),
  ) as IndependentSampleDocument;
  const sampleSource = JSON.parse(
    execFileSync(
      "git",
      [
        "-C",
        rootDirectory,
        "show",
        `${sample.sourceCommitSha}:data/curated/training-occupation-links.json`,
      ],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
    ),
  ) as CuratedRelation[];
  const samplePopulation = sampleSource.filter(
    (relation) => relation.reviewStatus === "approved",
  );
  if (
    sample.sourceCommitSha !== sourceCommitSha ||
    sample.population !== samplePopulation.length ||
    sample.population !== approved.length ||
    sample.sampleSize !== 15 ||
    sample.relations.length !== sample.sampleSize ||
    sample.independentlyAudited !== true ||
    sample.exhaustive !== false ||
    sample.summary.pass !== 15 ||
    sample.summary.fail !== 0 ||
    sample.summary.samplePass !== 15 ||
    sample.summary.notSampled !== sample.population - sample.sampleSize ||
    sample.summary.exhaustive !== false
  ) {
    throw new Error(
      "Independent evidence sample must record 15 PASS, 0 FAIL, and a non-exhaustive audit.",
    );
  }

  const approvedByKey = new Map(
    approved.map((relation) => [
      `${relation.trainingProgramKey}|${relation.occupationId}`,
      relation,
    ]),
  );
  const expectedKeys = samplePopulation
    .map(
      (relation) => `${relation.trainingProgramKey}|${relation.occupationId}`,
    )
    .sort((left, right) =>
      sampleDigest(sample.seed, left).localeCompare(
        sampleDigest(sample.seed, right),
      ),
    )
    .slice(0, sample.sampleSize);
  const actualKeys = sample.relations.map((relation) => relation.relationKey);
  if (
    new Set(actualKeys).size !== sample.sampleSize ||
    JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)
  ) {
    throw new Error(
      "Independent evidence sample does not match its deterministic selection.",
    );
  }
  for (const relation of sample.relations) {
    const source = approvedByKey.get(relation.relationKey);
    if (
      source === undefined ||
      relation.status !== "sample_pass" ||
      relation.auditStatus !== "pass" ||
      relation.sourceUrl !== source.sourceUrl ||
      relation.sourceQuote !== source.sourceQuote
    ) {
      throw new Error(
        `Independent evidence sample does not match approved source data for ${relation.relationKey}.`,
      );
    }
  }
  return sample;
}

function isOfficialSource(sourceUrl: string): boolean {
  try {
    const hostname = new URL(sourceUrl).hostname.toLocaleLowerCase("en-US");
    return OFFICIAL_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function collectArtifactTexts(rootDirectory: string): ArtifactText[] {
  const analysisDirectory = resolve(rootDirectory, "analysis");
  const excluded = new Set([
    "contest_evidence_live_sample.json",
    "contest_evidence_matrix.json",
    "contest_evidence_matrix.md",
    "contest_evidence_matrix_base.json",
  ]);
  const paths: string[] = [];

  function walk(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (
        TEXT_EXTENSIONS.has(extname(entry.name).toLocaleLowerCase("en-US")) &&
        !excluded.has(entry.name) &&
        statSync(absolutePath).size <= 10 * 1024 * 1024
      ) {
        paths.push(absolutePath);
      }
    }
  }

  walk(analysisDirectory);
  return paths
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((absolutePath) => ({
      path: relative(rootDirectory, absolutePath).replaceAll("\\", "/"),
      text: readFileSync(absolutePath, "utf8"),
    }));
}

export type BuildContestEvidenceMatrixOptions = {
  sourceCommitSha?: string;
};

export function buildContestEvidenceMatrix(
  rootDirectory = resolve("."),
  options: BuildContestEvidenceMatrixOptions = {},
) {
  const sourceCommitSha = resolveContestEvidenceSourceCommit(
    rootDirectory,
    options.sourceCommitSha,
  );
  const source = loadAuditedRelations(rootDirectory);
  const approved = source.filter(
    (relation) => relation.reviewStatus === "approved",
  );

  const relationKeys = approved.map(
    (relation) => `${relation.trainingProgramKey}|${relation.occupationId}`,
  );
  if (new Set(relationKeys).size !== approved.length) {
    throw new Error("Approved relation identities are not unique.");
  }

  const sample = loadIndependentSample(
    rootDirectory,
    approved,
    sourceCommitSha,
  );
  const sampleKeys = new Set(
    sample.relations.map((relation) => relation.relationKey),
  );

  const artifacts = collectArtifactTexts(rootDirectory);
  const relations = approved
    .map((relation) => {
      const relationKey = `${relation.trainingProgramKey}|${relation.occupationId}`;
      const relationArtifacts = artifacts
        .filter(
          (artifact) =>
            artifact.text.includes(relation.trainingProgramKey) &&
            artifact.text.includes(relation.occupationId),
        )
        .map((artifact) => artifact.path);
      const programArtifacts = artifacts
        .filter(
          (artifact) =>
            artifact.text.includes(relation.trainingProgramKey) &&
            !relationArtifacts.includes(artifact.path),
        )
        .map((artifact) => artifact.path);
      const officialSource = isOfficialSource(relation.sourceUrl);
      const quotedEvidence = relation.sourceQuote.trim().length >= 10;

      return {
        relationKey,
        programKey: relation.trainingProgramKey,
        occupationId: relation.occupationId,
        relationshipType: relation.relationshipType,
        sourceUrl: relation.sourceUrl,
        sourceQuote: relation.sourceQuote,
        reviewedAt: relation.reviewedAt,
        commonFloor: {
          officialSource,
          quotedEvidence,
          passes: officialSource && quotedEvidence,
        },
        artifactDiscovery: {
          relationCooccurrencePaths: relationArtifacts,
          programMentionPaths: programArtifacts,
          limitation:
            "Textual co-occurrence locates review material; it does not by itself prove semantic sufficiency.",
        },
        evidenceDepth:
          relationArtifacts.length > 0
            ? "relation_artifact_discovered"
            : programArtifacts.length > 0
              ? "program_artifact_discovered"
              : "common_validator_only",
        frontierSufficiency: sampleKeys.has(relationKey)
          ? "sample_pass"
          : "not_sampled",
      };
    })
    .sort((left, right) =>
      left.relationKey.localeCompare(right.relationKey, "en"),
    );

  const commonFloorFailures = relations.filter(
    (relation) => !relation.commonFloor.passes,
  ).length;
  const depthCounts = Object.fromEntries(
    [
      "relation_artifact_discovered",
      "program_artifact_discovered",
      "common_validator_only",
    ].map((depth) => [
      depth,
      relations.filter((relation) => relation.evidenceDepth === depth).length,
    ]),
  );

  return {
    schemaVersion: 1,
    sourcePath: "data/curated/training-occupation-links.json",
    sourceCommitSha,
    auditCutoff: AUDIT_CUTOFF,
    relationCount: relations.length,
    commonFloorFailures,
    depthCounts,
    sampleSummary: {
      sourcePath: "analysis/contest_evidence_live_sample.json",
      sourceCommitSha: sample.sourceCommitSha,
      auditedAt: sample.auditedAt,
      population: approved.length,
      sampleSize: sample.sampleSize,
      pass: sample.summary.pass,
      fail: sample.summary.fail,
      notSampled: approved.length - sample.sampleSize,
      exhaustive: sample.exhaustive,
      decision: `The deterministic 15-relation sample passed independently; the remaining ${approved.length - sample.sampleSize} approved relations are not sampled here. This is not an exhaustive audit.`,
    },
    limitations: [
      "The common floor verifies repository fields and official-domain attribution, not the live source text.",
      "Artifact discovery is textual and must not be described as an exhaustive semantic audit.",
      `The independent sample records 15 PASS and 0 FAIL; ${approved.length - sample.sampleSize} approved relations remain not_sampled, so this is not an exhaustive audit.`,
    ],
    relations,
  };
}

export function loadAuditedRelations(
  rootDirectory = resolve("."),
): CuratedRelation[] {
  return JSON.parse(
    readFileSync(
      resolve(rootDirectory, "data/curated/training-occupation-links.json"),
      "utf8",
    ),
  ) as CuratedRelation[];
}

function renderMarkdown(
  matrix: ReturnType<typeof buildContestEvidenceMatrix>,
): string {
  const rows = Object.entries(matrix.depthCounts)
    .map(([depth, count]) => `| ${depth} | ${count} |`)
    .join("\n");
  return [
    "# Matriz de evidencia de cobertura",
    "",
    `- Corte: ${matrix.auditCutoff}`,
    `- Relaciones aprobadas: ${matrix.relationCount}`,
    `- Fallos del suelo común: ${matrix.commonFloorFailures}`,
    `- Muestra independiente: ${matrix.sampleSummary.pass} PASS / ${matrix.sampleSummary.fail} FAIL / ${matrix.sampleSummary.notSampled} no muestreadas.`,
    "- Alcance: auditoría independiente delimitada; no es exhaustiva.",
    "",
    "| Profundidad documental localizada | Relaciones |",
    "| --- | ---: |",
    rows,
    "",
    "La coaparición textual de una clave de programa y una ocupación solo localiza material de revisión. No demuestra por sí sola que la relación sea semánticamente suficiente.",
    "",
  ].join("\n");
}

function runCli(): void {
  const rootDirectory = resolve(".");
  const sourceCommitArgument = process.argv.find((argument) =>
    argument.startsWith("--source-commit="),
  );
  const sourceCommitIndex = process.argv.indexOf("--source-commit");
  const sourceCommitSha =
    sourceCommitArgument?.slice("--source-commit=".length) ??
    (sourceCommitIndex >= 0 ? process.argv[sourceCommitIndex + 1] : undefined);
  if (sourceCommitIndex >= 0 && sourceCommitSha === undefined) {
    throw new Error("--source-commit requires a commit SHA");
  }
  const matrix = buildContestEvidenceMatrix(rootDirectory, {
    sourceCommitSha,
  });
  const json = `${JSON.stringify(matrix, null, 2)}\n`;
  const markdown = renderMarkdown(matrix);
  const jsonPath = resolve(
    rootDirectory,
    "analysis/contest_evidence_matrix.json",
  );
  const markdownPath = resolve(
    rootDirectory,
    "analysis/contest_evidence_matrix.md",
  );

  if (process.argv.includes("--check")) {
    if (
      !existsSync(jsonPath) ||
      !existsSync(markdownPath) ||
      readFileSync(jsonPath, "utf8") !== json ||
      readFileSync(markdownPath, "utf8") !== markdown
    ) {
      throw new Error("Contest evidence matrix outputs are missing or stale.");
    }
    return;
  }

  writeFileSync(jsonPath, json, "utf8");
  writeFileSync(markdownPath, markdown, "utf8");
}

const invokedPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : "";
if (invokedPath === import.meta.url) runCli();
