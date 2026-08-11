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

// Only the 9 curated labels from professional-profiles.json
const curatedCanonicalLabels = [
  "Agricultor ecológico / agricultora ecológica.",
  "Apicultor ecológico / apicultora ecológica.",
  "Avicultor ecológico / avicultora ecológica.",
  "Criador / criadora de ganado ecológico.",
  "Operador / operadora de maquinaria agrícola y ganadera.",
  "Productor / productora de huevos ecológicos.",
  "Productor / productora de leche ecológica.",
  "Trabajador cualificado / trabajadora cualificada por cuenta propia o ajena en cultivos y ganadería ecológica.",
  "Viverista ecológico.",
] as const;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function loadCuratedAgA01MLabels(): Promise<string[]> {
  const profiles = await readJson<
    Array<{ programKey: string; outputLabel: string }>
  >(resolve(rootDirectory, "data", "curated", "professional-profiles.json"));
  return profiles
    .filter((entry) => entry.programKey === "AGA01M")
    .map((entry) => entry.outputLabel);
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

async function loadAGA01MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("AGA01M expansion slot", () => {
  it("publishes exactly the five reviewed AGA01M relations", async () => {
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
            link.trainingProgramKey === "AGA01M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId)
        .sort(),
    ).toEqual([
      "occupation:cno11:6110",
      "occupation:cno11:6120",
      "occupation:cno11:6204",
      "occupation:cno11:6205",
      "occupation:cno11:8321",
    ]);
  });

  it("validates exhaustive BOE reviews, seed reconciliation, four rejected and completed parity", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/AGA01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "AGA01M") as FpExpansionCandidate;

    expect(attempt.state).toBe("completed");

    // Read curated labels at runtime from professional-profiles.json
    // and assert exact 9 labels in canonical order
    const curatedLabels = await loadCuratedAgA01MLabels();
    expect(curatedLabels).toHaveLength(9);
    expect(curatedLabels).toEqual([...curatedCanonicalLabels]);

    // Assert the 9 canonical curated output inventory
    expect(attempt.officialOutputInventory?.labels).toEqual([
      ...curatedCanonicalLabels,
    ]);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual([...curatedCanonicalLabels]);
    expect(attempt.officialOutputReviews).toHaveLength(
      curatedCanonicalLabels.length,
    );
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe(
      "Trabajador agropecuario",
    );
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Agricultor ecológico / agricultora ecológica.",
    );
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "AGA01M|occupation:cno11:6110",
        "AGA01M|occupation:cno11:6120",
        "AGA01M|occupation:cno11:6204",
        "AGA01M|occupation:cno11:6205",
        "AGA01M|occupation:cno11:8321",
      ],
      rejectedRelationKeys: [
        "AGA01M|occupation:cno11:6201",
        "AGA01M|occupation:cno11:6202",
        "AGA01M|occupation:cno11:6203",
        "AGA01M|occupation:cno11:6209",
      ],
    });
    const snapshotId = await loadAGA01MSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "AGA01M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { AGA01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "AGA01M|occupation:cno11:6110",
        "AGA01M|occupation:cno11:6120",
        "AGA01M|occupation:cno11:6204",
        "AGA01M|occupation:cno11:6205",
        "AGA01M|occupation:cno11:8321",
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
      programKey: "AGA01M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:6110" },
        { occupationId: "occupation:cno11:6120" },
        { occupationId: "occupation:cno11:6204" },
        { occupationId: "occupation:cno11:6205" },
        { occupationId: "occupation:cno11:8321" },
      ],
      rejectedRelations: [
        { occupationId: "occupation:cno11:6201" },
        { occupationId: "occupation:cno11:6202" },
        { occupationId: "occupation:cno11:6203" },
        { occupationId: "occupation:cno11:6209" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "AGA01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
