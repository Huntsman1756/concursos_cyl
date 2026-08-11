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
const outputLabels = [
  "Auxiliar administrativo.",
  "Ayudante de oficina.",
  "Auxiliar administrativo de cobros y pagos",
  "Administrativo comercial.",
  "Auxiliar administrativo de gestión de personal",
  "Auxiliar administrativo de las administraciones públicas.",
  "Recepcionista.",
  "Empleado de atención al cliente.",
  "Empleado de tesorería.",
  "Empleado de medios de pago.",
] as const;

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function snapshotHash() {
  return createHash("sha256")
    .update(
      JSON.stringify({
        snapshotId: "20260811135933995-c3db7c242202",
        programKey: "ADG01M",
        baselineMatchIds: [],
        currentMatchIds: [],
        acceptedRelationKeys: [],
      }),
    )
    .digest("hex");
}

describe("ADG01M expansion slot", () => {
  it("proves the frozen public baseline has no approved ADG01M relation", async () => {
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
          link.trainingProgramKey === "ADG01M" &&
          link.reviewStatus === "approved",
      ),
    ).toEqual([]);
  });

  it("validates the deferred attempt with exhaustive BOE outputs and no publication", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/ADG01M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "ADG01M") as FpExpansionCandidate;
    expect(attempt.state).toBe("deferred");
    expect(attempt.officialOutputInventory?.labels).toEqual(outputLabels);
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(outputLabels);
    expect(attempt.officialOutputReviews).toHaveLength(outputLabels.length);
    expect(attempt.publicParity).toEqual({
      publishedRelationKeys: [],
      rejectedRelationKeys: [
        "ADG01M|occupation:cno11:4111",
        "ADG01M|occupation:cno11:4112",
        "ADG01M|occupation:cno11:4113",
        "ADG01M|occupation:cno11:4223",
        "ADG01M|occupation:cno11:4309",
        "ADG01M|occupation:cno11:4411",
        "ADG01M|occupation:cno11:4412",
        "ADG01M|occupation:cno11:4441",
        "ADG01M|occupation:cno11:4500",
      ],
    });
    expect(attempt.snapshotHash).toBe(snapshotHash());
    const computed = {
      baselineMatchIds: [],
      currentMatchIds: [],
      newlyReachedOfferIdsByProgram: { ADG01M: [] },
      newlyReachedOfferUnionIds: [],
      snapshotId: "20260811135933995-c3db7c242202",
      snapshotHash: snapshotHash(),
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
      programKey: "ADG01M",
      state: "deferred",
      acceptedRelations: [],
      rejectedRelations: [
        { occupationId: "occupation:cno11:4111" },
        { occupationId: "occupation:cno11:4112" },
        { occupationId: "occupation:cno11:4113" },
        { occupationId: "occupation:cno11:4223" },
        { occupationId: "occupation:cno11:4309" },
        { occupationId: "occupation:cno11:4411" },
        { occupationId: "occupation:cno11:4412" },
        { occupationId: "occupation:cno11:4441" },
        { occupationId: "occupation:cno11:4500" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "ADG01M", {
        compute: async () => computed,
        publicRelationSet: async () => publicRelationSet,
      }),
    ).resolves.toMatchObject({ state: "deferred" });
  });
});
