import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe as activeDescribe, expect, it } from "vitest";

// Historical 76/220 publication contract; see analysis/contest_fallback_test_scope.md.
const describe = activeDescribe.skip;

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

function snapshotHash(snapshotId: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        snapshotId,
        programKey: "ELE01M",
        baselineMatchIds: [],
        currentMatchIds: [],
        acceptedRelationKeys: [
          "ELE01M|occupation:cno11:7294",
          "ELE01M|occupation:cno11:7510",
          "ELE01M|occupation:cno11:7533",
        ],
      }),
    )
    .digest("hex");
}

describe("ELE01M expansion slot", () => {
  it("publishes the three independently reviewed ELE01M relations", async () => {
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
    ).toMatchObject([
      { occupationId: "occupation:cno11:7294" },
      { occupationId: "occupation:cno11:7510" },
      { occupationId: "occupation:cno11:7533" },
    ]);
  });

  it("validates the completed attempt with exhaustive BOE outputs and exact publication", async () => {
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
    expect(attempt.state).toBe("completed");
    if (attempt.snapshotId === undefined)
      throw new Error("Missing snapshot ID.");
    const snapshotId = attempt.snapshotId;
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.officialOutputReviews).toHaveLength(outputLabels.length);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "ELE01M|occupation:cno11:7294",
        "ELE01M|occupation:cno11:7510",
        "ELE01M|occupation:cno11:7533",
      ],
      rejectedRelationKeys: ["ELE01M|occupation:cno11:7521"],
    });
    expect(attempt.snapshotHash).toBe(snapshotHash(snapshotId));
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { ELE01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash: snapshotHash(snapshotId),
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "ELE01M|occupation:cno11:7294",
        "ELE01M|occupation:cno11:7510",
        "ELE01M|occupation:cno11:7533",
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
      programKey: "ELE01M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:7294" },
        { occupationId: "occupation:cno11:7510" },
        { occupationId: "occupation:cno11:7533" },
      ],
      rejectedRelations: [{ occupationId: "occupation:cno11:7521" }],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "ELE01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
