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

const MAM01M_OUTPUT_LABELS = [
  "Operador de máquinas fijas para fabricar productos de madera.",
  "Operador de prensas.",
  "Operador-armador en banco.",
  "Montador-ensamblador de elementos de carpintería.",
  "Barnizador-lacador.",
  "Responsable de sección de acabados.",
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

async function loadMAM01MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("MAM01M expansion reserve slot", () => {
  it("publishes exactly the two approved MAM01M relations", async () => {
    const manifest = await readJson<{
      resourceSnapshots: {
        trainingOccupationLinks: { resourcePath: string };
      };
    }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
    const baselineLinks = await readJson<
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
      baselineLinks
        .filter(
          (link) =>
            link.trainingProgramKey === "MAM01M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual(["occupation:cno11:7812", "occupation:cno11:8209"]);
  });

  it("validates the completed attempt with exhaustive BOE outputs and audited missing seed", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/MAM01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "MAM01M") as FpExpansionCandidate;
    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      MAM01M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(MAM01M_OUTPUT_LABELS);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "MAM01M|occupation:cno11:7812",
        "MAM01M|occupation:cno11:8209",
      ],
      rejectedRelationKeys: ["MAM01M|occupation:cno11:3206"],
    });
    const snapshotId = await loadMAM01MSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "MAM01M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { MAM01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "MAM01M|occupation:cno11:7812",
        "MAM01M|occupation:cno11:8209",
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
        publicationPending: false,
      }),
    ).toMatchObject({
      programKey: "MAM01M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:7812" },
        { occupationId: "occupation:cno11:8209" },
      ],
      rejectedRelations: [{ occupationId: "occupation:cno11:3206" }],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "MAM01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
        publicationPending: false,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
