import { describe, expect, it } from "vitest";

import {
  buildFpCoverageResearchQueue,
  deriveBaseProgramKey,
} from "./buildFpCoverageResearchQueue";
import type { FpCoverageResearchOutcomeEntry } from "../../data/schemas/fpCoverageResearchOutcomes";
import type {
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";

const CATALOG_HASH =
  "f77079a15d7246c04b44889c733fda7fc9bade892c9d78c79607fcb1c3e21e90";
const STALE_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000";

function noMatchOutcome(
  baseProgramKey: string,
  catalogSha256: string,
): FpCoverageResearchOutcomeEntry {
  return {
    baseProgramKey,
    status: "reviewed-no-publishable-match",
    reviewedAt: "2026-08-14",
    occupationCatalogSha256: catalogSha256,
    sourcePath: `sources/${baseProgramKey}.txt`,
    proposalPath: `proposals/${baseProgramKey}.md`,
    frontierReviewPath: "frontier-review.md",
    note: "No match.",
  };
}

const base: TrainingProgram = {
  programKey: "AAA01S",
  programTitle: "Ciclo claro",
  familyCode: "AAA",
  familyName: "Familia A",
  level: "higher",
};
const distance: TrainingProgram = {
  ...base,
  programKey: "AAA01SD",
  programTitle: "Ciclo claro (distancia)",
};

function offering(
  program: TrainingProgram,
  id: string,
  province: string,
  centerCode: string,
): TrainingOffering {
  return {
    ...program,
    offeringId: id,
    centerCode,
    centerName: centerCode,
    province,
    locality: province,
    modality: "on_site",
    teachingType: "public",
    centerOwnership: "education",
  };
}

describe("FP coverage research queue", () => {
  it("collapses a verified distance modality but not an unrelated D key", () => {
    const unrelated = { ...base, programKey: "BBB01D" };
    const map = new Map([
      [base.programKey, base],
      [distance.programKey, distance],
      [unrelated.programKey, unrelated],
    ]);
    expect(deriveBaseProgramKey(distance, map)).toBe(base.programKey);
    expect(deriveBaseProgramKey(unrelated, map)).toBe(unrelated.programKey);
  });

  it("excludes a whole modality group when one modality is reviewed", () => {
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, distance],
      offerings: [],
      coverage: [
        {
          scope: "program",
          programKey: distance.programKey,
          programTitle: distance.programTitle,
          familyCode: distance.familyCode,
          familyName: distance.familyName,
          approvedMappings: 1,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Revisado.",
        },
      ],
      researchOutcomes: [],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.reviewedBaseCount).toBe(1);
    expect(queue.completedNoMatchBaseCount).toBe(0);
    expect(queue.candidates).toHaveLength(0);
  });

  it("orders deployment signals deterministically and marks drafts", () => {
    const second = {
      ...base,
      programKey: "BBB01M",
      programTitle: "Segundo ciclo",
      familyCode: "BBB",
      familyName: "Familia B",
      level: "intermediate" as const,
    };
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, second],
      offerings: [
        offering(second, "b-1", "León", "1"),
        offering(base, "a-1", "León", "1"),
        offering(base, "a-2", "Burgos", "2"),
      ],
      coverage: [
        {
          scope: "program",
          programKey: base.programKey,
          programTitle: base.programTitle,
          familyCode: base.familyCode,
          familyName: base.familyName,
          approvedMappings: 0,
          draftMappings: 1,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "draft",
          coverageNote: "Pendiente.",
        },
      ],
      researchOutcomes: [],
      catalogSha256: CATALOG_HASH,
    });
    expect(
      queue.candidates.map(({ baseProgramKey }) => baseProgramKey),
    ).toEqual([base.programKey, second.programKey]);
    expect(queue.candidates[0]).toMatchObject({
      offeringCount: 2,
      provinceCount: 2,
      centerCount: 2,
      priorDraft: true,
      priorityOnly: true,
    });
  });

  it("excludes a completed-no-match base when the catalog hash matches", () => {
    const second = {
      ...base,
      programKey: "BBB01S",
      familyCode: "BBB",
      familyName: "Familia B",
    };
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, second],
      offerings: [],
      coverage: [],
      researchOutcomes: [noMatchOutcome(base.programKey, CATALOG_HASH)],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.reviewedBaseCount).toBe(0);
    expect(queue.completedNoMatchBaseCount).toBe(1);
    expect(queue.pendingBaseCount).toBe(1);
    expect(queue.candidates).toHaveLength(1);
    expect(queue.candidates[0].baseProgramKey).toBe("BBB01S");
  });

  it("keeps a base pending when the catalog hash is stale", () => {
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base],
      offerings: [],
      coverage: [],
      researchOutcomes: [noMatchOutcome(base.programKey, STALE_HASH)],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.reviewedBaseCount).toBe(0);
    expect(queue.completedNoMatchBaseCount).toBe(0);
    expect(queue.pendingBaseCount).toBe(1);
    expect(queue.candidates).toHaveLength(1);
    expect(queue.candidates[0].baseProgramKey).toBe(base.programKey);
  });

  it("excludes base and distance modalities together when hash matches", () => {
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, distance],
      offerings: [],
      coverage: [],
      researchOutcomes: [noMatchOutcome(base.programKey, CATALOG_HASH)],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.reviewedBaseCount).toBe(0);
    expect(queue.completedNoMatchBaseCount).toBe(1);
    expect(queue.pendingBaseCount).toBe(0);
    expect(queue.candidates).toHaveLength(0);
  });

  it("does not inflate reviewedBaseCount when excluding completed-no-match", () => {
    const second = {
      ...base,
      programKey: "BBB01S",
      familyCode: "BBB",
      familyName: "Familia B",
    };
    const third = {
      ...base,
      programKey: "CCC01S",
      familyCode: "CCC",
      familyName: "Familia C",
    };
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, second, third],
      offerings: [],
      coverage: [
        {
          scope: "program",
          programKey: second.programKey,
          programTitle: second.programTitle,
          familyCode: second.familyCode,
          familyName: second.familyName,
          approvedMappings: 0,
          draftMappings: 0,
          rejectedMappings: 0,
          uncoveredPrograms: 0,
          coverageStatus: "reviewed",
          coverageNote: "Revisado.",
        },
      ],
      researchOutcomes: [noMatchOutcome(base.programKey, CATALOG_HASH)],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.reviewedBaseCount).toBe(1);
    expect(queue.completedNoMatchBaseCount).toBe(1);
    expect(queue.pendingBaseCount).toBe(1);
    expect(queue.candidates.map((c) => c.baseProgramKey)).toEqual(["CCC01S"]);
  });

  it("preserves deterministic ranking after excluding completed-no-match bases", () => {
    const second = {
      ...base,
      programKey: "BBB01S",
      familyCode: "BBB",
      familyName: "Familia B",
    };
    const third = {
      ...base,
      programKey: "CCC01S",
      familyCode: "CCC",
      familyName: "Familia C",
    };
    const queue = buildFpCoverageResearchQueue({
      snapshotGeneratedAt: "2026-08-12T12:32:18.779Z",
      programs: [base, second, third],
      offerings: [
        offering(third, "c-1", "Burgos", "1"),
        offering(third, "c-2", "León", "2"),
        offering(second, "b-1", "Burgos", "1"),
      ],
      coverage: [],
      researchOutcomes: [noMatchOutcome(base.programKey, CATALOG_HASH)],
      catalogSha256: CATALOG_HASH,
    });
    expect(queue.completedNoMatchBaseCount).toBe(1);
    expect(queue.candidates.map((c) => c.baseProgramKey)).toEqual([
      "CCC01S",
      "BBB01S",
    ]);
    expect(queue.candidates[0].rank).toBe(1);
    expect(queue.candidates[1].rank).toBe(2);
  });
});
