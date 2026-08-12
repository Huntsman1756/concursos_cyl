import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { format as formatPrettier } from "prettier";

import {
  loadEffectiveExpansionResources,
  computeIndependentAttempt,
} from "./renderFpCoverageExpansionReport";
import {
  FpExpansionAttemptSchema,
  type FpExpansionAttempt,
} from "./validateFpCoverageExpansion";

const terminalStates = ["completed", "deferred", "discarded"] as const;
type TerminalState = (typeof terminalStates)[number];
function isTerminalAttempt(
  attempt: FpExpansionAttempt,
): attempt is FpExpansionAttempt & { state: TerminalState } {
  return terminalStates.includes(attempt.state as TerminalState);
}

async function main(): Promise<void> {
  const root = process.cwd();
  const resources = await loadEffectiveExpansionResources(root);

  const attemptsDirectory = resolve(root, "analysis/fp_coverage_expansion");
  const fileNames = (await readdir(attemptsDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .toSorted();

  for (const fileName of fileNames) {
    const path = resolve(attemptsDirectory, fileName);
    const attempt = FpExpansionAttemptSchema.parse(
      JSON.parse(await readFile(path, "utf8")),
    );
    if (!isTerminalAttempt(attempt)) continue;

    const independent = computeIndependentAttempt(attempt, resources);

    const refreshed: Record<string, unknown> = { ...attempt };

    refreshed.baselineMatchIds = independent.computed.baselineMatchIds;
    refreshed.currentMatchIds = independent.computed.currentMatchIds;
    refreshed.newlyReachedOfferIdsByProgram =
      independent.computed.newlyReachedOfferIdsByProgram;
    refreshed.newlyReachedOfferUnionIds =
      independent.computed.newlyReachedOfferUnionIds;
    refreshed.snapshotId = independent.computed.snapshotId;
    refreshed.snapshotHash = independent.computed.snapshotHash;
    refreshed.publicParity = {
      publishedRelationKeys: independent.publicRelationSet.relationKeys,
      rejectedRelationKeys: independent.relationKeys.rejected,
    };

    const formatted = await formatPrettier(JSON.stringify(refreshed), {
      parser: "json",
    });
    await writeFile(path, formatted, "utf8");
  }
}

await main();
