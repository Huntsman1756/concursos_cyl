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

// Load ELE03S source output labels from the curated profiles
async function loadELE03SLabels(): Promise<string[]> {
  const raw = await readFile(
    resolve(rootDirectory, "data/curated/professional-profiles.json"),
    "utf8",
  );
  const entries = JSON.parse(raw) as Array<{
    programKey: string;
    outputLabel: string;
  }>;
  return entries
    .filter((e) => e.programKey === "ELE03S")
    .map((e) => e.outputLabel);
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

async function loadELE03SSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: {
      trainingOccupationLinks: { resourcePath: string };
    };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.trainingOccupationLinks.resourcePath.split(
    "/",
  )[4]!;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

describe("ELE03S expansion slot", () => {
  it("publishes exactly the one reviewed ELE03S relation", async () => {
    const manifest = await readJson<{
      resourceSnapshots: {
        trainingOccupationLinks: { resourcePath: string };
      };
    }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
    const snapshotId = await loadELE03SSnapshotId();
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
        snapshotId,
        "training-occupation-links.json",
      ),
    );
    expect(
      links
        .filter(
          (link) =>
            link.trainingProgramKey === "ELE03S" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual(["occupation:cno11:7531"]);
  });

  it("validates exhaustive BOE reviews, seed reconciliation and completed parity", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/ELE03S.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "ELE03S") as FpExpansionCandidate;

    // Load expected ELE03S source labels from the curated profiles file
    const expectedLabels = await loadELE03SLabels();

    expect(attempt.state).toBe("completed");
    expect(expectedLabels).toHaveLength(9);
    expect(
      attempt.programmeProfileEvidence!.todoFp.sourceUrl,
    ).toContain("mantenimiento-electronico.html");
    expect(attempt.officialOutputInventory?.labels).toEqual(expectedLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(expectedLabels);
    expect(attempt.officialOutputReviews).toHaveLength(
      expectedLabels.length,
    );
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe(
      "Técnico de mantenimiento electrónico",
    );
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Técnica / técnico en reparación y mantenimiento de equipos de redes locales y sistemas telemáticos.",
    );
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "ELE03S|occupation:cno11:7531",
      ],
      rejectedRelationKeys: [],
    });
    const snapshotId = await loadELE03SSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "ELE03S",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { ELE03S: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: ["ELE03S|occupation:cno11:7531"],
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
      programKey: "ELE03S",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:7531" },
      ],
      rejectedRelations: [],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "ELE03S", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});