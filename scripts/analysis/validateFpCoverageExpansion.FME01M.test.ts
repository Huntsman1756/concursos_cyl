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
  validateExpansionAttemptData,
} from "./validateFpCoverageExpansion";

const rootDirectory = resolve(import.meta.dirname, "../..");

const FME01M_OUTPUT_LABELS = [
  "Ajustador operario de máquinas herramientas.",
  "Pulidor de metales y afilador de herramientas.",
  "Operador de máquinas para trabajar metales.",
  "Operador de máquinas herramientas.",
  "Operador de robots industriales.",
  "Trabajadores de la fabricación de herramientas, mecánicos y ajustadores, modelistas matriceros y asimilados.",
  "Tornero, fresador y mandrinador.",
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

async function loadFME01MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("FME01M expansion slot", () => {
  it("publishes exactly the three approved FME01M relations", async () => {
    const manifest = await readJson<{
      resourceSnapshots: { trainingOccupationLinks: { resourcePath: string } };
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
            link.trainingProgramKey === "FME01M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual([
      "occupation:cno11:7322",
      "occupation:cno11:7323",
      "occupation:cno11:7324",
    ]);
  });

  it("validates completed state with exhaustive BOE reviews and audited missing seed", async () => {
    const programKey = "FME01M";
    const snapshotId = await loadFME01MSnapshotId();
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey,
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys: [
        relationKey({ programKey, occupationId: "occupation:cno11:7322" }),
        relationKey({ programKey, occupationId: "occupation:cno11:7323" }),
        relationKey({ programKey, occupationId: "occupation:cno11:7324" }),
      ],
    });
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/FME01M.json"),
    );
    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      FME01M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(FME01M_OUTPUT_LABELS);
    expect(attempt.seedReconciliations).toBeUndefined();
    expect(attempt.unmatchedSeedReviews).toEqual([
      expect.objectContaining({
        seedLabel: "Mecánico de mecanizado",
        disposition: "not_in_authoritative_inventory",
      }),
    ]);
    // snapshot identity provenance must equal computed values
    expect(attempt.snapshotId).toBe(snapshotId);
    expect(attempt.snapshotHash).toBe(snapshotHash);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "FME01M|occupation:cno11:7322",
        "FME01M|occupation:cno11:7323",
        "FME01M|occupation:cno11:7324",
      ],
      rejectedRelationKeys: ["FME01M|occupation:cno11:3139"],
    });
    // Accepted audit relations: only 7322, 7323 and 7324 are published.
    expect(attempt.acceptedRelations).toHaveLength(3);
    const acceptedOccupancies = (attempt.acceptedRelations ?? []).map(
      (r) => r.occupationId,
    );
    expect(acceptedOccupancies).toContain("occupation:cno11:7322");
    expect(acceptedOccupancies).toContain("occupation:cno11:7323");
    expect(acceptedOccupancies).toContain("occupation:cno11:7324");
    // Rejected: 3139 only
    expect(attempt.rejectedRelations).toHaveLength(1);
    const rejectedOccupancies = (attempt.rejectedRelations ?? []).map(
      (r) => r.occupationId,
    );
    expect(rejectedOccupancies).toContain("occupation:cno11:3139");
  });

  it("accepts completed FME01M against the rebuilt public snapshot", async () => {
    const programKey = "FME01M";
    const snapshotId = await loadFME01MSnapshotId();
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey,
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys: [
        relationKey({ programKey, occupationId: "occupation:cno11:7322" }),
        relationKey({ programKey, occupationId: "occupation:cno11:7323" }),
        relationKey({ programKey, occupationId: "occupation:cno11:7324" }),
      ],
    });
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/FME01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "FME01M") as FpExpansionCandidate;

    expect(
      validateExpansionAttemptData({
        attempt,
        candidate,
        computed: {
          baselineMatchIds: [],
          currentMatchIds: [],
          newlyReachedOfferIdsByProgram: { FME01M: [] },
          newlyReachedOfferUnionIds: [],
          snapshotId: attempt.snapshotId,
          snapshotHash,
        },
        publicRelationSet: {
          manifestAddressed: true as const,
          relationKeys: [
            "FME01M|occupation:cno11:7322",
            "FME01M|occupation:cno11:7323",
            "FME01M|occupation:cno11:7324",
          ],
          resourcePaths: ["/data/v1/manifest.json"],
        },
        reviewedCommitAt: attempt.reviewedCommitAt,
        publicationPending: false,
      }),
    ).toMatchObject({
      programKey: "FME01M",
      state: "completed",
    });
  });
});
