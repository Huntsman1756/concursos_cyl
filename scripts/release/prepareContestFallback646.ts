import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { buildMappingCoverage } from "../data/validateCuratedMappings";
import { extractPublishedRequirements } from "../data/extractRequirements";

const HISTORICAL_FREEZE_COMMIT = "111039ea2678272452169bb30c31cc680a4d436e";
const EXPECTED_RELATIONS = 14;
const EXPECTED_ALIASES = 21;

type JsonRecord = Record<string, unknown>;

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizedAliasIdentity(alias: JsonRecord): string {
  const normalized = String(alias.alias)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return `${normalized}:${String(alias.occupationId)}`;
}

function parseArguments(): { rootDirectory: string; write: boolean } {
  const rootIndex = process.argv.indexOf("--root");
  if (rootIndex < 0 || process.argv[rootIndex + 1] === undefined) {
    throw new Error(
      "Usage: prepareContestFallback646.ts --root <worktree> --write",
    );
  }
  return {
    rootDirectory: realpathSync(resolve(process.argv[rootIndex + 1])),
    write: process.argv.includes("--write"),
  };
}

function historicalFreeze(rootDirectory: string): JsonRecord {
  return JSON.parse(
    execFileSync(
      "git",
      [
        "-C",
        rootDirectory,
        "show",
        `${HISTORICAL_FREEZE_COMMIT}:docs/contest/coverage-freeze.json`,
      ],
      { encoding: "utf8" },
    ),
  ) as JsonRecord;
}

function gitShowText(rootDirectory: string, revisionPath: string): string {
  return execFileSync(
    "git",
    [
      "-C",
      rootDirectory,
      "show",
      `${HISTORICAL_FREEZE_COMMIT}:${revisionPath}`,
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function relativeResourcePath(resourcePath: string): string {
  if (!resourcePath.startsWith("/data/v1/")) {
    throw new Error(`Unexpected resource path: ${resourcePath}`);
  }
  return `public${resourcePath}`.replaceAll("/", "\\");
}

export function prepareContestFallback646(
  rootDirectory: string,
  write: boolean,
) {
  const manifestPath = resolve(rootDirectory, "public/data/v1/manifest.json");
  const manifest = readJson(manifestPath) as JsonRecord;
  const historicalManifest = JSON.parse(
    gitShowText(rootDirectory, "public/data/v1/manifest.json"),
  ) as JsonRecord;
  const resourceSnapshots = manifest.resourceSnapshots as Record<
    string,
    JsonRecord
  >;
  const historicalResourceSnapshots =
    historicalManifest.resourceSnapshots as Record<string, JsonRecord>;
  const freeze = historicalFreeze(rootDirectory);
  const coverage = freeze.coverage as JsonRecord;
  const relationKeys = new Set(coverage.approvedRelationKeys as string[]);
  const aliasKeys = new Set(coverage.approvedAliasKeys as string[]);

  const curatedLinks = readJson(
    resolve(rootDirectory, "data/curated/training-occupation-links.json"),
  ) as JsonRecord[];
  const curatedAliases = readJson(
    resolve(rootDirectory, "data/curated/occupation-aliases.json"),
  ) as JsonRecord[];
  const links = curatedLinks
    .filter(
      (link) =>
        link.reviewStatus === "approved" &&
        relationKeys.has(`${link.trainingProgramKey}|${link.occupationId}`),
    )
    .sort((left, right) =>
      `${left.trainingProgramKey}:${left.occupationId}:${left.relationshipType}`.localeCompare(
        `${right.trainingProgramKey}:${right.occupationId}:${right.relationshipType}`,
        "en",
      ),
    );
  const aliases = curatedAliases
    .filter(
      (alias) =>
        alias.reviewStatus === "approved" &&
        aliasKeys.has(`${alias.alias}|${alias.occupationId}`),
    )
    .sort((left, right) =>
      normalizedAliasIdentity(left).localeCompare(
        normalizedAliasIdentity(right),
        "en",
      ),
    );

  if (
    links.length !== EXPECTED_RELATIONS ||
    relationKeys.size !== EXPECTED_RELATIONS
  ) {
    throw new Error(
      `Fallback requires exactly ${EXPECTED_RELATIONS} approved relations.`,
    );
  }
  if (
    aliases.length !== EXPECTED_ALIASES ||
    aliasKeys.size !== EXPECTED_ALIASES
  ) {
    throw new Error(
      `Fallback requires exactly ${EXPECTED_ALIASES} approved aliases.`,
    );
  }

  const sourceTexts = new Map<string, string>();
  const sourceValues = new Map<string, unknown>();
  for (const [key, specification] of Object.entries(resourceSnapshots)) {
    const sourcePath = resolve(
      rootDirectory,
      relativeResourcePath(String(specification.resourcePath)),
    );
    const text = readFileSync(sourcePath, "utf8");
    sourceTexts.set(key, text);
    sourceValues.set(key, JSON.parse(text));
  }

  const historicalJobOffersSpecification =
    historicalResourceSnapshots.jobOffers;
  if (historicalJobOffersSpecification === undefined) {
    throw new Error("Historical manifest lacks jobOffers.");
  }
  const historicalJobOffersText = gitShowText(
    rootDirectory,
    `public${String(historicalJobOffersSpecification.resourcePath)}`,
  );
  const historicalJobOffers = JSON.parse(historicalJobOffersText) as Array<{
    id: string;
    descriptionSections: Parameters<
      typeof extractPublishedRequirements
    >[1]["sections"];
  }>;
  sourceTexts.set("jobOffers", historicalJobOffersText);
  sourceValues.set("jobOffers", historicalJobOffers);
  const publishedRequirements = historicalJobOffers.flatMap((offer) => {
    const requirements = extractPublishedRequirements(offer.id, {
      sections: offer.descriptionSections,
    });
    return requirements.length === 0
      ? []
      : [{ offerId: offer.id, requirements }];
  });
  sourceTexts.set("publishedRequirements", serialize(publishedRequirements));
  sourceValues.set("publishedRequirements", publishedRequirements);

  const programs = sourceValues.get("programs") as Parameters<
    typeof buildMappingCoverage
  >[0];
  sourceTexts.set("trainingOccupationLinks", serialize(links));
  sourceTexts.set("occupationAliases", serialize(aliases));
  sourceTexts.set(
    "mappingCoverage",
    serialize(buildMappingCoverage(programs, links as never[])),
  );

  const sourceSnapshotId = String(
    historicalResourceSnapshots.jobOffers.resourcePath,
  ).match(/\/snapshots\/([a-z0-9-]+)\//u)?.[1];
  if (sourceSnapshotId === undefined)
    throw new Error("Source snapshot ID is missing.");
  const timestamp = sourceSnapshotId.slice(0, 17);
  const contentIdentity = [...sourceTexts.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([key, text]) => `${key}:${sha256(text)}`)
    .join("\n");
  const snapshotId = `${timestamp}-${sha256(contentIdentity).slice(0, 12)}`;
  const snapshotDirectory = resolve(
    rootDirectory,
    "public/data/v1/snapshots",
    snapshotId,
  );

  const nextResourceSnapshots = Object.fromEntries(
    Object.entries(resourceSnapshots).map(([key, specification]) => {
      const text = sourceTexts.get(key);
      if (text === undefined)
        throw new Error(`Missing resource text for ${key}.`);
      const value = JSON.parse(text) as unknown;
      if (!Array.isArray(value))
        throw new Error(`${key} is not an array resource.`);
      const provenanceSpecification =
        key === "jobOffers" ? historicalResourceSnapshots[key] : specification;
      const filename = String(provenanceSpecification.resourcePath)
        .split("/")
        .at(-1);
      if (filename === undefined)
        throw new Error(`Missing filename for ${key}.`);
      if (write) {
        mkdirSync(snapshotDirectory, { recursive: true });
        writeFileSync(resolve(snapshotDirectory, filename), text, "utf8");
      }
      return [
        key,
        {
          ...provenanceSpecification,
          recordCount: value.length,
          resourcePath: `/data/v1/snapshots/${snapshotId}/${filename}`,
          sha256: sha256(text),
        },
      ];
    }),
  );
  const nextManifest = {
    ...manifest,
    generatedAt: historicalManifest.generatedAt,
    qualityReport: historicalManifest.qualityReport,
    resourceSnapshots: nextResourceSnapshots,
  };

  if (write) {
    writeFileSync(
      resolve(rootDirectory, "data/curated/training-occupation-links.json"),
      sourceTexts.get("trainingOccupationLinks")!,
      "utf8",
    );
    writeFileSync(
      resolve(rootDirectory, "data/curated/occupation-aliases.json"),
      sourceTexts.get("occupationAliases")!,
      "utf8",
    );
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, serialize(nextManifest), "utf8");
  }

  return {
    historicalFreezeCommit: HISTORICAL_FREEZE_COMMIT,
    sourceSnapshotId,
    snapshotId,
    relationCount: links.length,
    aliasCount: aliases.length,
    offerCount: (sourceValues.get("jobOffers") as unknown[]).length,
    wroteFiles: write,
  };
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const arguments_ = parseArguments();
  console.info(
    JSON.stringify(
      prepareContestFallback646(arguments_.rootDirectory, arguments_.write),
    ),
  );
}
