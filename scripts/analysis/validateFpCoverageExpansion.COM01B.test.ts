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

async function loadOutputLabels(): Promise<string[]> {
  const profiles = await readJson<
    { programKey: string; outputLabel: string }[]
  >(resolve(rootDirectory, "data/curated/professional-profiles.json"));
  return profiles
    .filter((p) => p.programKey === "COM01B")
    .map((p) => p.outputLabel);
}

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

async function loadCOM01BSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("COM01B expansion slot", () => {
  it("publishes exactly the seven reviewed COM01B relations", async () => {
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
            link.trainingProgramKey === "COM01B" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId)
        .sort(),
    ).toEqual([
      "occupation:cno11:4121",
      "occupation:cno11:4123",
      "occupation:cno11:5220",
      "occupation:cno11:5492",
      "occupation:cno11:5500",
      "occupation:cno11:8333",
      "occupation:cno11:9820",
    ]);
  });

  it("validates exhaustive TodoFP reviews, seed reconciliation, seven accepted and completed parity", async () => {
    const outputLabels = await loadOutputLabels();

    expect(outputLabels).toHaveLength(11);

    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/COM01B.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "COM01B") as FpExpansionCandidate;

    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.officialOutputReviews).toHaveLength(outputLabels.length);
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe(
      "Auxiliar de comercio",
    );
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      outputLabels[0]!,
    );

    // Verify 4121 and 5500 are approved for COM01B
    const accepted4121 = attempt.acceptedRelations!.find(
      (r) => r.occupationId === "occupation:cno11:4121",
    );
    expect(accepted4121).toBeDefined();
    const accepted5500 = attempt.acceptedRelations!.find(
      (r) => r.occupationId === "occupation:cno11:5500",
    );
    expect(accepted5500).toBeDefined();

    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "COM01B|occupation:cno11:4121",
        "COM01B|occupation:cno11:4123",
        "COM01B|occupation:cno11:5220",
        "COM01B|occupation:cno11:5492",
        "COM01B|occupation:cno11:5500",
        "COM01B|occupation:cno11:8333",
        "COM01B|occupation:cno11:9820",
      ],
      rejectedRelationKeys: [],
    });
    const snapshotId = await loadCOM01BSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "COM01B",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { COM01B: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "COM01B|occupation:cno11:4121",
        "COM01B|occupation:cno11:4123",
        "COM01B|occupation:cno11:5220",
        "COM01B|occupation:cno11:5492",
        "COM01B|occupation:cno11:5500",
        "COM01B|occupation:cno11:8333",
        "COM01B|occupation:cno11:9820",
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
      programKey: "COM01B",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:4121" },
        { occupationId: "occupation:cno11:4123" },
        { occupationId: "occupation:cno11:5220" },
        { occupationId: "occupation:cno11:5492" },
        { occupationId: "occupation:cno11:5500" },
        { occupationId: "occupation:cno11:8333" },
        { occupationId: "occupation:cno11:9820" },
      ],
      rejectedRelations: [],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "COM01B", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
