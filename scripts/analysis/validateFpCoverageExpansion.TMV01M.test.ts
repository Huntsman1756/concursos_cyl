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

/** Read curated professional profiles at runtime, filter by TMV01M, order by source appearance. */
async function loadTMV01MOutputLabels(): Promise<string[]> {
  const profiles = await readJson<
    { programKey: string; outputLabel: string }[]
  >(resolve(rootDirectory, "data/curated/professional-profiles.json"));
  return profiles
    .filter((p) => p.programKey === "TMV01M")
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

async function loadTMV01MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("TMV01M expansion slot", () => {
  it("publishes exactly the two reviewed TMV01M relations", async () => {
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
        "public/data/v1/snapshots",
        manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.slice(
          "/data/v1/snapshots/".length,
        ),
      ),
    );
    expect(
      links
        .filter(
          (link) =>
            link.trainingProgramKey === "TMV01M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId)
        .sort(),
    ).toEqual(["occupation:cno11:7232", "occupation:cno11:7313"]);
  });

  it("validates exhaustive BOE reviews, seed reconciliation, two rejected and completed parity", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/TMV01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "TMV01M") as FpExpansionCandidate;
    const outputLabels = await loadTMV01MOutputLabels();

    expect(attempt.state).toBe("completed");
    expect(outputLabels).toHaveLength(3);
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.officialOutputReviews).toHaveLength(3);
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe(
      "Reparador de carrocerías",
    );
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Chapista reparador / reparadora de carrocería de automóviles, vehículos pesados, tractores, maquinaria agrícola, de industrias extractivas, de construcción y obras públicas y material ferroviario.",
    );

    // 7211 must remain rejected for TMV01M
    const rejected7211 = attempt.rejectedRelations!.find(
      (r) => r.occupationId === "occupation:cno11:7211",
    );
    expect(rejected7211).toBeDefined();

    // 7401 must remain rejected for TMV01M
    const rejected7401 = attempt.rejectedRelations!.find(
      (r) => r.occupationId === "occupation:cno11:7401",
    );
    expect(rejected7401).toBeDefined();

    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "TMV01M|occupation:cno11:7232",
        "TMV01M|occupation:cno11:7313",
      ],
      rejectedRelationKeys: [
        "TMV01M|occupation:cno11:7211",
        "TMV01M|occupation:cno11:7401",
      ],
    });
    const snapshotId = await loadTMV01MSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "TMV01M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { TMV01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "TMV01M|occupation:cno11:7232",
        "TMV01M|occupation:cno11:7313",
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
      programKey: "TMV01M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:7232" },
        { occupationId: "occupation:cno11:7313" },
      ],
      rejectedRelations: [
        { occupationId: "occupation:cno11:7211" },
        { occupationId: "occupation:cno11:7401" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "TMV01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
