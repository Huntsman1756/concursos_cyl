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

const IMA02M_OUTPUT_LABELS = [
  "Instalador frigorista en instalaciones comerciales.",
  "Mantenedor frigorista en instalaciones comerciales.",
  "Instalador frigorista en procesos industriales.",
  "Mantenedor frigorista en procesos industriales.",
  "Instalador/Montador de equipos de climatización, ventilación-extracción, redes de distribución y equipos terminales.",
  "Mantenedor/Reparador de equipos de climatización, ventilación-extracción, redes de distribución y equipos terminales.",
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

async function loadIMA02MSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("IMA02M expansion slot", () => {
  it("publishes exactly the reviewed IMA02M relation", async () => {
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
            link.trainingProgramKey === "IMA02M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual(["occupation:cno11:7250"]);
  });

  it("validates exhaustive BOE reviews, seed reconciliation and completed parity", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/IMA02M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "IMA02M") as FpExpansionCandidate;

    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      IMA02M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(IMA02M_OUTPUT_LABELS);
    expect(attempt.officialOutputReviews).toHaveLength(
      IMA02M_OUTPUT_LABELS.length,
    );
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe(
      "Instalador frigorista",
    );
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Instalador frigorista en instalaciones comerciales.",
    );
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: ["IMA02M|occupation:cno11:7250"],
      rejectedRelationKeys: [],
    });
    const snapshotId = await loadIMA02MSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "IMA02M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { IMA02M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: ["IMA02M|occupation:cno11:7250"],
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
      programKey: "IMA02M",
      state: "completed",
      acceptedRelations: [{ occupationId: "occupation:cno11:7250" }],
      rejectedRelations: [],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "IMA02M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
