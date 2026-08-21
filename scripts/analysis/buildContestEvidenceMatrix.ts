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

const EXPECTED_APPROVED_RELATIONS = 240;
const AUDIT_CUTOFF = "2026-08-21T18:30:00+02:00";
const SOURCE_COMMIT_SHA = "1fb9f98c1f27dbde78f87afedcc60c50a3712d08";
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

export function buildContestEvidenceMatrix(rootDirectory = resolve(".")) {
  const source = loadAuditedRelations(rootDirectory);
  const approved = source.filter(
    (relation) => relation.reviewStatus === "approved",
  );

  if (approved.length !== EXPECTED_APPROVED_RELATIONS) {
    throw new Error(
      `Expected exactly ${EXPECTED_APPROVED_RELATIONS} approved relations, found ${approved.length}.`,
    );
  }

  const relationKeys = approved.map(
    (relation) => `${relation.trainingProgramKey}|${relation.occupationId}`,
  );
  if (new Set(relationKeys).size !== EXPECTED_APPROVED_RELATIONS) {
    throw new Error("Approved relation identities are not unique.");
  }

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
        frontierSufficiency: "pending_live_sample",
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
    sourceCommitSha: SOURCE_COMMIT_SHA,
    auditCutoff: AUDIT_CUTOFF,
    relationCount: relations.length,
    commonFloorFailures,
    depthCounts,
    limitations: [
      "The common floor verifies repository fields and official-domain attribution, not the live source text.",
      "Artifact discovery is textual and must not be described as an exhaustive semantic audit.",
      "Final evidentiary sufficiency remains pending until Frontier completes the independent live sample.",
    ],
    relations,
  };
}

export function loadAuditedRelations(
  rootDirectory = resolve("."),
): CuratedRelation[] {
  return JSON.parse(
    execFileSync(
      "git",
      [
        "-C",
        rootDirectory,
        "show",
        `${SOURCE_COMMIT_SHA}:data/curated/training-occupation-links.json`,
      ],
      { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
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
    "- Veredicto de suficiencia: pendiente de muestra independiente contra fuentes vivas.",
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
  const matrix = buildContestEvidenceMatrix(rootDirectory);
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
