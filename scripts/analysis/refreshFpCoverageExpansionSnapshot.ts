import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import prettier from "prettier";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import { FpExpansionAttemptSchema } from "./validateFpCoverageExpansion";

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].toSorted();
}

async function main(): Promise<void> {
  const root = process.cwd();
  const manifest = GeneratedManifestSchema.parse(
    JSON.parse(
      await readFile(resolve(root, "public/data/v1/manifest.json"), "utf8"),
    ),
  );
  const snapshotId =
    manifest.resourceSnapshots.programs.resourcePath.split("/")[4];
  if (snapshotId === undefined)
    throw new Error("Manifest has no program snapshot ID.");

  const attemptsDirectory = resolve(root, "analysis/fp_coverage_expansion");
  const fileNames = (await readdir(attemptsDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .toSorted();

  for (const fileName of fileNames) {
    const path = resolve(attemptsDirectory, fileName);
    const attempt = FpExpansionAttemptSchema.parse(
      JSON.parse(await readFile(path, "utf8")),
    );
    const acceptedRelationKeys = sortedUnique(
      (attempt.officialOutputReviews ?? [])
        .filter((review) => review.disposition === "accepted")
        .flatMap((review) => review.acceptedOccupationIds ?? [])
        .map((occupationId) => `${attempt.programKey}|${occupationId}`),
    );
    const snapshotHash = createHash("sha256")
      .update(
        JSON.stringify({
          snapshotId,
          programKey: attempt.programKey,
          baselineMatchIds: attempt.baselineMatchIds ?? [],
          currentMatchIds: attempt.currentMatchIds ?? [],
          acceptedRelationKeys,
        }),
      )
      .digest("hex");
    const refreshed = { ...attempt, snapshotId, snapshotHash };
    await writeFile(
      path,
      await prettier.format(JSON.stringify(refreshed), { parser: "json" }),
      "utf8",
    );
  }
}

await main();
