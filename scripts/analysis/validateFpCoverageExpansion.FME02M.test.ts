import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type {
  FpExpansionCandidate,
  FpExpansionRanking,
} from "../../data/schemas/fpCoverageExpansion";
import {
  type FpExpansionAttempt,
  validateExpansionAttempt,
  validateExpansionAttemptData,
} from "./validateFpCoverageExpansion";

const rootDirectory = resolve(import.meta.dirname, "../..");

const FME02M_OUTPUT_LABELS = [
  "Soldadores y oxicortadores.",
  "Operadores de proyección térmica.",
  "Chapistas y caldereros.",
  "Montadores de estructuras metálicas.",
  "Carpintero metálico.",
  "Tubero industrial de industria pesada.",
] as const;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function relationKey(relation: {
  programKey: string;
  occupationId: string;
  alias?: string;
}): string {
  return `${relation.programKey}|${relation.occupationId}${relation.alias ? `|${relation.alias}` : ""}`;
}

function expansionSnapshotHash(input: {
  snapshotId: string;
  programKey: string;
  baselineMatchIds: string[];
  currentMatchIds: string[];
  acceptedRelationKeys: string[];
}): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function loadFME02MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("FME02M expansion slot", () => {
  it("publishes exactly the four reviewed FME02M relations", async () => {
    const manifest = await readJson<{
      resourceSnapshots: {
        trainingOccupationLinks: { resourcePath: string };
      };
    }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
    const links = await readJson<
      {
        trainingProgramKey: string;
        occupationId: string;
        reviewStatus: string;
      }[]
    >(
      resolve(
        rootDirectory,
        "public",
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
          1,
        ),
      ),
    );
    expect(
      links
        .filter(
          (link) =>
            link.trainingProgramKey === "FME02M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual([
      "occupation:cno11:7132",
      "occupation:cno11:7312",
      "occupation:cno11:7313",
      "occupation:cno11:7314",
    ]);
  });

  it("validates exhaustive BOE reviews, seed reconciliation and completed parity", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/FME02M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "FME02M") as FpExpansionCandidate;

    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      FME02M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(FME02M_OUTPUT_LABELS);
    expect(attempt.officialOutputReviews).toHaveLength(
      FME02M_OUTPUT_LABELS.length,
    );
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe("Soldador");
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Soldadores y oxicortadores.",
    );
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "FME02M|occupation:cno11:7132",
        "FME02M|occupation:cno11:7312",
        "FME02M|occupation:cno11:7313",
        "FME02M|occupation:cno11:7314",
      ],
      rejectedRelationKeys: [
        "FME02M|occupation:cno11:7221",
        "FME02M|occupation:cno11:8122",
      ],
    });
    const snapshotId = await loadFME02MSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "FME02M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { FME02M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "FME02M|occupation:cno11:7132",
        "FME02M|occupation:cno11:7312",
        "FME02M|occupation:cno11:7313",
        "FME02M|occupation:cno11:7314",
      ],
      resourcePaths: ["/data/v1/manifest.json"],
    };
    expect(
      validateExpansionAttemptData({
        attempt,
        candidate,
        computed,
        publicRelationSet,
        reviewedCommitAt: attempt.reviewedCommitAt,
      }),
    ).toMatchObject({
      programKey: "FME02M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:7132" },
        { occupationId: "occupation:cno11:7312" },
        { occupationId: "occupation:cno11:7313" },
        { occupationId: "occupation:cno11:7314" },
      ],
      rejectedRelations: [
        { occupationId: "occupation:cno11:7221" },
        { occupationId: "occupation:cno11:8122" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "FME02M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
