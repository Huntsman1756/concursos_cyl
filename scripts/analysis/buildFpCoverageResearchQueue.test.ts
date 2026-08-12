import { describe, expect, it } from "vitest";

import {
  buildFpCoverageResearchQueue,
  deriveBaseProgramKey,
} from "./buildFpCoverageResearchQueue";
import type {
  TrainingOffering,
  TrainingProgram,
} from "../../data/schemas/generated";

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
    });
    expect(queue.reviewedBaseCount).toBe(1);
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
});
