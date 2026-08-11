import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OccupationsSchema } from "../../data/schemas/curatedMappings";
import { GeneratedManifestSchema } from "../../data/schemas/generated";
import { CNO_11_SOURCE_URL } from "./extractBoeCnoOccupations";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function serialize(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

export function officialOccupationSnapshot(
  resourcePath: string,
  contents: string,
  recordCount: number,
  fetchedAt: string,
) {
  return {
    sourceId: "boe-cno11-complete-occupation-catalog",
    sourceUrl: CNO_11_SOURCE_URL,
    sourceUpdatedAt: "2010-12-17T00:00:00.000Z",
    snapshotFetchedAt: fetchedAt,
    schemaVersion: "1.0.0" as const,
    recordCount,
    sha256: createHash("sha256").update(contents, "utf8").digest("hex"),
    qualityStatus: "passed" as const,
    resourcePath,
  };
}

interface CliOptions {
  catalog: string;
  manifest: string;
  fetchedAt: string;
}

function parseCli(args: readonly string[]): CliOptions {
  const options: CliOptions = {
    catalog: resolve("data/curated/official-occupations.json"),
    manifest: resolve("public/data/v1/manifest.json"),
    fetchedAt: new Date().toISOString(),
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!["--catalog", "--manifest", "--fetched-at"].includes(argument ?? "")) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = args[++index];
    if (value === undefined) throw new Error(`${argument} requires a value.`);
    if (argument === "--catalog") options.catalog = resolve(value);
    if (argument === "--manifest") options.manifest = resolve(value);
    if (argument === "--fetched-at") options.fetchedAt = value;
  }
  return options;
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const occupations = OccupationsSchema.parse(
    JSON.parse(await readFile(options.catalog, "utf8")),
  );
  const manifest = GeneratedManifestSchema.parse(
    JSON.parse(await readFile(options.manifest, "utf8")),
  );
  const programPath = manifest.resourceSnapshots.programs.resourcePath;
  const snapshotId = basename(dirname(programPath));
  if (!/^\d{17}-[a-f\d]{12}$/u.test(snapshotId)) {
    throw new Error(
      "The active manifest does not address an immutable snapshot.",
    );
  }
  const resourcePath = `/data/v1/snapshots/${snapshotId}/official-occupations.json`;
  const contents = serialize(occupations);
  const filePath = resolve(
    dirname(options.manifest),
    "snapshots",
    snapshotId,
    "official-occupations.json",
  );
  await writeFile(filePath, contents, "utf8");
  const nextManifest = GeneratedManifestSchema.parse({
    ...manifest,
    resourceSnapshots: {
      ...manifest.resourceSnapshots,
      officialOccupations: officialOccupationSnapshot(
        resourcePath,
        contents,
        occupations.length,
        options.fetchedAt,
      ),
    },
  });
  await writeFile(options.manifest, serialize(nextManifest), "utf8");
  process.stdout.write(
    `Published ${occupations.length} official occupations into ${snapshotId}.\n`,
  );
}

const entryPath =
  process.argv[1] === undefined ? undefined : resolve(process.argv[1]);
if (entryPath === fileURLToPath(import.meta.url)) await main();
