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
const IMA03M_OUTPUT_LABELS = [
  "Mecánico de mantenimiento.",
  "Montador industrial.",
  "Montador de equipos eléctricos.",
  "Montador de equipos electrónicos.",
  "Mantenedor de línea automatizada.",
  "Montador de bienes de equipo.",
  "Montador de automatismos neumáticos e hidráulicos.",
  "Instalador electricista industrial.",
  "Electricista de mantenimiento y reparación de equipos de control, medida y precisión.",
] as const;
const IMA03M_REJECTED_KEYS = [
  "IMA03M|occupation:cno11:7403",
  "IMA03M|occupation:cno11:7510",
  "IMA03M|occupation:cno11:7521",
  "IMA03M|occupation:cno11:7531",
  "IMA03M|occupation:cno11:8201",
  "IMA03M|occupation:cno11:8202",
];

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function snapshotHash(snapshotId: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        snapshotId,
        programKey: "IMA03M",
        baselineMatchIds: [],
        currentMatchIds: [],
        acceptedRelationKeys: [],
      }),
    )
    .digest("hex");
}

describe("IMA03M expansion slot", () => {
  it("retains the historical deferred audit after batch 6 supersedes it", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/IMA03M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "IMA03M") as FpExpansionCandidate;
    if (attempt.snapshotId === undefined)
      throw new Error("Missing historical snapshot ID.");
    const snapshotId = attempt.snapshotId;
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { IMA03M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash: snapshotHash(snapshotId),
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [],
      resourcePaths: ["/data/v1/manifest.json"],
    };
    expect(attempt.state).toBe("deferred");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      IMA03M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(IMA03M_OUTPUT_LABELS);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [],
      rejectedRelationKeys: IMA03M_REJECTED_KEYS,
    });
    expect(attempt.snapshotHash).toBe(computed.snapshotHash);
    expect(
      validateExpansionAttemptData({
        attempt,
        candidate,
        computed,
        publicRelationSet,
        reviewedCommitAt: attempt.reviewedCommitAt,
      }),
    ).toMatchObject({
      programKey: "IMA03M",
      state: "deferred",
      acceptedRelations: [],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "IMA03M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "deferred" });
  });
});
