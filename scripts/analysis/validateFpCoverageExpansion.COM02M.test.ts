import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import type {
  FpExpansionCandidate,
  FpExpansionRanking,
} from "../../data/schemas/fpCoverageExpansion";
import { matchOffersForProgram } from "../../src/domain/offerMatching";
import {
  type FpExpansionAttempt,
  validateExpansionAttempt,
  validateExpansionAttemptData,
} from "./validateFpCoverageExpansion";

const rootDirectory = resolve(import.meta.dirname, "../..");

const COM02M_OUTPUT_LABELS = [
  "Responsable/encargado de establecimiento alimentario.",
  "Responsable/encargado de sección/sala/departamento de tienda de alimentación.",
  "Gestor/a de pequeño comercio alimentario.",
  "Responsable/encargado de comercios alimentarios online.",
  "Asesor/a comercial de productos alimentarios.",
  "Vendedor/a de productos alimentarios.",
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

async function computeCom02mOverlay() {
  const manifest = await readJson<{
    resourceSnapshots: Record<string, { resourcePath: string }>;
  }>(resolve(rootDirectory, "public/data/v1/manifest.json"));
  const resourcePath = (key: string) =>
    resolve(
      rootDirectory,
      "public",
      manifest.resourceSnapshots[key]!.resourcePath.slice(1),
    );
  const [programs, occupations, aliases, links, offers, publishedRequirements] =
    await Promise.all([
      readJson<unknown[]>(resourcePath("programs")),
      readJson<unknown[]>(resourcePath("occupations")),
      readJson<unknown[]>(resourcePath("occupationAliases")),
      readJson<unknown[]>(resourcePath("trainingOccupationLinks")),
      readJson<unknown[]>(resourcePath("jobOffers")),
      readJson<unknown[]>(resourcePath("publishedRequirements")),
    ]);
  const curatedOccupations = await readJson<
    { occupationId: string; reviewStatus: string; [key: string]: unknown }[]
  >(resolve(rootDirectory, "data/curated/occupations.json"));
  const curatedLinks = await readJson<
    {
      trainingProgramKey: string;
      occupationId: string;
      reviewStatus: string;
      [key: string]: unknown;
    }[]
  >(resolve(rootDirectory, "data/curated/training-occupation-links.json"));
  const approvedOccupationIds = new Set([
    "occupation:cno11:5210",
    "occupation:cno11:5220",
  ]);
  const baselineLinks = links.filter((link) => {
    if (typeof link !== "object" || link === null) return true;
    const candidate = link as {
      trainingProgramKey?: string;
      reviewStatus?: string;
    };
    return !(
      candidate.trainingProgramKey === "COM02M" &&
      candidate.reviewStatus === "approved"
    );
  });
  const overlayOccupations = [
    ...occupations.filter(
      (occupation) =>
        typeof occupation === "object" &&
        occupation !== null &&
        !approvedOccupationIds.has(
          (occupation as { occupationId?: string }).occupationId ?? "",
        ),
    ),
    ...curatedOccupations
      .filter(
        (occupation) =>
          approvedOccupationIds.has(occupation.occupationId) &&
          occupation.reviewStatus === "approved",
      )
      .map((occupation) => ({ ...occupation, reviewStatus: "approved" })),
  ];
  const base = {
    programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations,
    aliases,
    links: baselineLinks,
    offers,
    publishedRequirements,
    humanOverrides: [],
  };
  const overlay = {
    ...base,
    occupations: overlayOccupations,
    links: [
      ...baselineLinks,
      ...curatedLinks.filter(
        (link) =>
          link.trainingProgramKey === "COM02M" &&
          link.reviewStatus === "approved",
      ),
    ],
  };
  return {
    snapshotId:
      manifest.resourceSnapshots.programs!.resourcePath.split("/")[4]!,
    baselineMatchIds: matchOffersForProgram(
      "COM02M",
      base as Parameters<typeof matchOffersForProgram>[1],
    ).map((match) => match.offerId),
    currentMatchIds: matchOffersForProgram(
      "COM02M",
      overlay as Parameters<typeof matchOffersForProgram>[1],
    ).map((match) => match.offerId),
  };
}

describe("COM02M expansion slot", () => {
  it("proves the published snapshot contains exactly COM02M's accepted relations", async () => {
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
            link.trainingProgramKey === "COM02M" &&
            link.reviewStatus === "approved",
        )
        .map((link) => `${link.trainingProgramKey}|${link.occupationId}`)
        .sort(),
    ).toEqual(["COM02M|occupation:cno11:5210", "COM02M|occupation:cno11:5220"]);
  });

  it("validates the completed attempt against the in-memory curated overlay", async () => {
    const attempt = await readJson<FpExpansionAttempt>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion/COM02M.json"),
    );
    const ranking = await readJson<FpExpansionRanking>(
      resolve(rootDirectory, "analysis/fp_coverage_expansion_candidates.json"),
    );
    const candidate = [
      ...ranking.primaryCandidates,
      ...ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "COM02M") as FpExpansionCandidate;
    expect(attempt.officialOutputInventory?.labels).toEqual(
      COM02M_OUTPUT_LABELS,
    );
    expect(
      attempt.officialOutputReviews?.map(
        (review) => review.officialOutputLabel,
      ),
    ).toEqual(COM02M_OUTPUT_LABELS);
    const overlay = await computeCom02mOverlay();
    const acceptedRelationKeys = attempt.acceptedRelations!.map(relationKey);
    const snapshotHash = expansionSnapshotHash({
      snapshotId: overlay.snapshotId,
      programKey: "COM02M",
      baselineMatchIds: overlay.baselineMatchIds,
      currentMatchIds: overlay.currentMatchIds,
      acceptedRelationKeys,
    });
    expect(attempt.snapshotHash).toBe(snapshotHash);
    expect(
      validateExpansionAttemptData({
        attempt,
        candidate,
        computed: {
          ...overlay,
          newlyReachedOfferIdsByProgram: { COM02M: [] },
          newlyReachedOfferUnionIds: [],
          snapshotHash,
        },
        publicRelationSet: {
          manifestAddressed: true,
          relationKeys: acceptedRelationKeys,
          resourcePaths: ["/data/v1/manifest.json"],
        },
        reviewedCommitAt: attempt.reviewedCommitAt,
      }),
    ).toMatchObject({
      programKey: "COM02M",
      state: "completed",
      acceptedRelations: [
        { occupationId: "occupation:cno11:5210" },
        { occupationId: "occupation:cno11:5220" },
      ],
      newlyReachedOfferUnionIds: [],
    });
    await expect(
      validateExpansionAttempt(rootDirectory, "COM02M", {
        compute: async (_root, candidateAttempt) => ({
          ...overlay,
          newlyReachedOfferIdsByProgram: { COM02M: [] },
          newlyReachedOfferUnionIds: [],
          snapshotHash: expansionSnapshotHash({
            snapshotId: overlay.snapshotId,
            programKey: "COM02M",
            baselineMatchIds: overlay.baselineMatchIds,
            currentMatchIds: overlay.currentMatchIds,
            acceptedRelationKeys: (
              candidateAttempt as {
                acceptedRelations: Array<{
                  programKey: string;
                  occupationId: string;
                  alias?: string;
                }>;
              }
            ).acceptedRelations.map(relationKey),
          }),
        }),
        publicRelationSet: async () => ({
          manifestAddressed: true,
          relationKeys: acceptedRelationKeys,
          resourcePaths: ["/data/v1/manifest.json"],
        }),
      }),
    ).resolves.toMatchObject({ state: "completed" });
  });
});
