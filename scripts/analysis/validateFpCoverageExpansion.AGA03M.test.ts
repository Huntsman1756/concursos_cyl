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

const AGA03M_OUTPUT_LABELS = [
  "Trabajador de huertas, viveros y jardines.",
  "Jardinero, en general.",
  "Jardinero cuidador de campos de deporte.",
  "Trabajador de parques urbanos, jardines históricos y botánicos.",
  "Trabajador cualificado en la instalación de jardines y zonas verdes.",
  "Trabajador cualificado en mantenimiento y mejora de jardines y zonas verdes.",
  "Trabajador cualificado por cuenta propia en empresa de jardinería.",
  "Viverista.",
  "Trabajador en viveros, en general.",
  "Trabajador cualificado en propagación de plantas en viveros.",
  "Trabajador cualificado en cultivo de plantas en viveros.",
  "Trabajador especialista en recolección de semillas y frutos en altura.",
  "Trabajador cualificado en producción de semillas.",
  "Injertador.",
  "Trabajador cualificado en viveros.",
  "Florista por cuenta propia o ajena.",
  "Oficial de floristería.",
  "Vendedor de floristería.",
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

async function loadAga03mSnapshotId(): Promise<string> {
  const manifest = await readJson<{
    resourceSnapshots: { programs: { resourcePath: string } };
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  return manifest.resourceSnapshots.programs.resourcePath.split("/")[4]!;
}

describe("AGA03M expansion slot", () => {
  it("publishes exactly the two reviewed AGA03M relations", async () => {
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
            link.trainingProgramKey === "AGA03M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => link.occupationId),
    ).toEqual(["occupation:cno11:5220", "occupation:cno11:6120"]);
  });

  it("validates the completed attempt against the published snapshot", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/AGA03M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "AGA03M") as FpExpansionCandidate;
    expect(attempt.state).toBe("completed");
    expect(attempt.officialOutputInventory?.labels).toEqual(
      AGA03M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(AGA03M_OUTPUT_LABELS);
    expect(attempt.officialOutputReviews).toHaveLength(
      AGA03M_OUTPUT_LABELS.length,
    );
    expect(attempt.seedReconciliations).toHaveLength(1);
    expect(attempt.seedReconciliations?.[0]!.seedLabel).toBe("Jardinero");
    expect(attempt.seedReconciliations?.[0]!.authoritativeOutputLabel).toBe(
      "Jardinero, en general.",
    );
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [
        "AGA03M|occupation:cno11:5220",
        "AGA03M|occupation:cno11:6120",
      ],
      rejectedRelationKeys: [
        "AGA03M|occupation:cno11:3142",
        "AGA03M|occupation:cno11:6110",
      ],
    });
    const snapshotId = await loadAga03mSnapshotId();
    expect(attempt.snapshotId).toBe(snapshotId);
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId,
      programKey: "AGA03M",
      baselineMatchIds: [],
      currentMatchIds: [],
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { AGA03M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId,
      snapshotHash,
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [
        "AGA03M|occupation:cno11:5220",
        "AGA03M|occupation:cno11:6120",
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
      programKey: "AGA03M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:5220" },
        { occupationId: "occupation:cno11:6120" },
      ],
      rejectedRelations: [
        { occupationId: "occupation:cno11:3142" },
        { occupationId: "occupation:cno11:6110" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "AGA03M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
