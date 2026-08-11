import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { FpExpansionAttempt } from "./validateFpCoverageExpansion";
import {
  validateExpansionAttempt,
  validateExpansionAttemptData,
} from "./validateFpCoverageExpansion";
import type {
  FpExpansionCandidate,
  FpExpansionRanking,
} from "../../data/schemas/fpCoverageExpansion";

const rootDirectory = resolve(import.meta.dirname, "../..");
const outputLabels = [
  "Electronicista de vehículos.",
  "Electricista electrónico de mantenimiento y reparación en automoción.",
  "Mecánico de automóviles.",
  "Electricista de automóviles.",
  "Electromecánico de automóviles.",
  "Mecánico de motores y sus sistemas auxiliares de automóviles y motocicletas.",
  "Reparador sistemas neumáticos e hidráulicos.",
  "Reparador sistemas de transmisión y frenos.",
  "Reparador sistemas de dirección y suspensión.",
  "Operario de ITV.",
  "Instalador de accesorios en vehículos.",
  "Operario de empresas dedicadas a la fabricación de recambios.",
  "Electromecánico de motocicletas.",
  "Vendedor/distribuidor de recambios y equipos de diagnosis.",
] as const;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function expansionSnapshotHash() {
  return createHash("sha256")
    .update(
      JSON.stringify({
        snapshotId: "20260811222221076-727a2dfa2791",
        programKey: "TMV02M",
        baselineMatchIds: [],
        currentMatchIds: [],
        acceptedRelationKeys: [],
      }),
    )
    .digest("hex");
}

describe("TMV02M expansion slot", () => {
  it("proves the frozen public baseline has no approved TMV02M relation", async () => {
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
          link.trainingProgramKey === "TMV02M" &&
          link.reviewStatus === "approved",
      ),
    ).toEqual([]);
  });

  it("validates the deferred attempt with exhaustive BOE outputs and no publication", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/TMV02M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "TMV02M") as FpExpansionCandidate;
    expect(attempt.state).toBe("deferred");
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [],
      rejectedRelationKeys: ["TMV02M|occupation:cno11:7401"],
    });
    expect(attempt.snapshotHash).toBe(expansionSnapshotHash());
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { TMV02M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId: "20260811222221076-727a2dfa2791",
      snapshotHash:
        "4b6afb7104a72748e1eb1057b1dda53a8376e337e2498147b93cd82ccf0a6df0",
    };
    const publicRelationSet = {
      manifestAddressed: true as const,
      relationKeys: [],
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
      programKey: "TMV02M",
      state: "deferred",
      acceptedRelations: [],
      rejectedRelations: [{ occupationId: "occupation:cno11:7401" }],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "TMV02M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "deferred" });
  });
});
