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
const outputLabels = [
  "Instalador-mantenedor electricista.",
  "Electricista de construcción.",
  "Electricista industrial.",
  "Electricista de mantenimiento.",
  "Instalador-mantenedor de sistemas domóticos.",
  "Instalador-mantenedor de antenas.",
  "Instalador de telecomunicaciones en edificios de viviendas.",
  "Instalador-mantenedor de equipos e instalaciones telefónicas.",
  "Montador de instalaciones de energía solar fotovoltaica.",
] as const;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function relationKey(relation: {
  programKey: string;
  occupationId: string;
}): string {
  return `${relation.programKey}|${relation.occupationId}`;
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

describe("ELE01M expansion slot", () => {
  it("proves the frozen public baseline has no approved ELE01M relation", async () => {
    const manifest = await readJson<{
      resourceSnapshots: { trainingOccupationLinks: { resourcePath: string } };
    }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
    const links = await readJson<
      { trainingProgramKey: string; reviewStatus: string }[]
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
      links.filter(
        (link) =>
          link.trainingProgramKey === "ELE01M" &&
          link.reviewStatus === "approved",
      ),
    ).toEqual([]);
  });

  it("validates the deferred attempt with exhaustive BOE outputs and no publication", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/ELE01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "ELE01M") as FpExpansionCandidate;
    const programKey = "ELE01M";
    const snapshotId = attempt.snapshotId!;
    const acceptedRelationKeys = (attempt.acceptedRelations ?? []).map((r) =>
      relationKey(r),
    );
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey,
      baselineMatchIds: attempt.baselineMatchIds ?? [],
      currentMatchIds: attempt.currentMatchIds ?? [],
      acceptedRelationKeys,
    });
    expect(attempt.state).toBe("deferred");
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.officialOutputReviews).toHaveLength(outputLabels.length);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [],
      rejectedRelationKeys: [
        "ELE01M|occupation:cno11:7294",
        "ELE01M|occupation:cno11:7510",
        "ELE01M|occupation:cno11:7521",
        "ELE01M|occupation:cno11:7533",
      ],
    });
    expect(attempt.snapshotId).toBe(snapshotId);
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { ELE01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [],
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
      programKey: "ELE01M",
      state: "deferred",
      acceptedRelations: [],
      rejectedRelations: [
        { occupationId: "occupation:cno11:7294" },
        { occupationId: "occupation:cno11:7510" },
        { occupationId: "occupation:cno11:7521" },
        { occupationId: "occupation:cno11:7533" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "ELE01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "deferred" });
  });
});
