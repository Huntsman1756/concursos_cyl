import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GeneratedManifestSchema,
  type SourceSnapshot,
} from "../../data/schemas/generated";
import { TrainingSourceRecordSchema } from "../../data/schemas/trainingSource";
import { OfferSourceRecordSchema } from "../../data/schemas/offerSource";
import { fetchAllRecords } from "./fetchAllRecords";
import { sha256Text } from "./hashFile";
import { normalizeOffers } from "./normalizeOffers";
import { normalizeTraining } from "./normalizeTraining";
import { runQualityGates } from "./qualityGates";
import { SOURCE_CONFIG } from "./sourceConfig";
import { validateCuratedMappings } from "./validateCuratedMappings";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(scriptPath), "../..");
const targetDirectory = join(repoRoot, "public", "data", "v1");

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sourceSnapshot(
  sourceId: string,
  sourceUrl: string,
  fetchedAt: string,
  recordCount: number,
  hash: string,
): SourceSnapshot {
  return {
    sourceId,
    sourceUrl,
    sourceUpdatedAt: null,
    snapshotFetchedAt: fetchedAt,
    schemaVersion: "1.0.0",
    recordCount,
    sha256: hash,
    qualityStatus: "passed",
  };
}

async function readPreviousCounts() {
  try {
    const manifest = JSON.parse(
      await readFile(join(targetDirectory, "manifest.json"), "utf8"),
    ) as {
      counts?: {
        programs: number;
        centers: number;
        offerings: number;
        offers: number;
      };
    };
    return manifest.counts;
  } catch {
    return undefined;
  }
}

async function readCuratedFile(name: string): Promise<unknown[]> {
  return JSON.parse(
    await readFile(join(repoRoot, "data", "curated", name), "utf8"),
  ) as unknown[];
}

async function replaceDirectory(candidateDirectory: string): Promise<void> {
  await mkdir(dirname(targetDirectory), { recursive: true });
  const backupDirectory = `${targetDirectory}.previous`;
  await rm(backupDirectory, { recursive: true, force: true });

  try {
    await rename(targetDirectory, backupDirectory);
  } catch {
    // There is no previous snapshot on the first build.
  }

  try {
    await rename(candidateDirectory, targetDirectory);
  } catch (error) {
    try {
      await rename(backupDirectory, targetDirectory);
    } catch {
      // Preserve the original failure; recovery is best effort.
    }
    throw error;
  }

  await rm(backupDirectory, { recursive: true, force: true });
}

export async function buildSnapshots(): Promise<void> {
  const fetchedAt = new Date().toISOString();
  const [trainingRecords, offerRecords] = await Promise.all([
    fetchAllRecords(
      SOURCE_CONFIG.training.recordsUrl,
      TrainingSourceRecordSchema,
    ),
    fetchAllRecords(SOURCE_CONFIG.offers.recordsUrl, OfferSourceRecordSchema),
  ]);
  const training = normalizeTraining(trainingRecords);
  const offers = normalizeOffers(offerRecords, {
    snapshotFetchedAt: fetchedAt,
  });
  const curated = validateCuratedMappings(
    {
      occupations: await readCuratedFile("occupations.json"),
      aliases: await readCuratedFile("occupation-aliases.json"),
      links: await readCuratedFile("training-occupation-links.json"),
    },
    training.programs.map((program) => program.programKey),
  );
  const candidate = {
    ...training,
    offers,
  };
  const quality = runQualityGates(candidate, await readPreviousCounts());
  const candidateDirectory = join(
    repoRoot,
    ".codex-tmp",
    `data-build-${Date.now()}`,
  );
  await mkdir(candidateDirectory, { recursive: true });

  const resourceTexts = {
    programs: jsonText(training.programs),
    centers: jsonText(training.centers),
    "training-offerings": jsonText(training.offerings),
    "job-offers": jsonText(offers),
    occupations: jsonText(curated.occupations),
    "occupation-aliases": jsonText(curated.aliases),
    "training-occupation-links": jsonText(curated.links),
    "mapping-coverage": jsonText(curated.coverage),
  };
  const trainingHash = sha256Text(
    `${resourceTexts.programs}${resourceTexts.centers}${resourceTexts["training-offerings"]}`,
  );
  const offerHash = sha256Text(resourceTexts["job-offers"]);
  const manifest = GeneratedManifestSchema.parse({
    schemaVersion: "1.0.0",
    generatedAt: fetchedAt,
    qualityStatus: "passed",
    sources: {
      training: sourceSnapshot(
        SOURCE_CONFIG.training.id,
        SOURCE_CONFIG.training.recordsUrl,
        fetchedAt,
        training.offerings.length,
        trainingHash,
      ),
      offers: sourceSnapshot(
        SOURCE_CONFIG.offers.id,
        SOURCE_CONFIG.offers.recordsUrl,
        fetchedAt,
        offers.length,
        offerHash,
      ),
    },
    counts: quality.counts,
  });

  await Promise.all(
    Object.entries({
      ...resourceTexts,
      manifest: jsonText(manifest),
    }).map(([name, text]) =>
      writeFile(join(candidateDirectory, `${name}.json`), text),
    ),
  );
  await replaceDirectory(candidateDirectory);
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  await buildSnapshots();
}
