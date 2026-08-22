import { describe, expect, it } from "vitest";

import {
  buildContestEvidenceMatrix,
  loadAuditedRelations,
} from "./buildContestEvidenceMatrix";

describe("contest evidence matrix", () => {
  it("projects all 248 approved relations without omission or mutation", () => {
    const source = loadAuditedRelations().filter(
      (relation: { reviewStatus: string }) =>
        relation.reviewStatus === "approved",
    );
    const matrix = buildContestEvidenceMatrix();

    expect(source).toHaveLength(248);
    expect(matrix.sourceCommitSha).toBe(
      "e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2",
    );
    expect(matrix.relations).toHaveLength(248);
    expect(
      new Set(matrix.relations.map((relation) => relation.relationKey)).size,
    ).toBe(248);

    for (const relation of matrix.relations) {
      const original = source.find(
        (candidate: { trainingProgramKey: string; occupationId: string }) =>
          `${candidate.trainingProgramKey}|${candidate.occupationId}` ===
          relation.relationKey,
      );
      expect(original).toBeDefined();
      if (original === undefined)
        throw new Error("Missing audited source relation.");
      expect(relation).toMatchObject({
        programKey: original.trainingProgramKey,
        occupationId: original.occupationId,
        relationshipType: original.relationshipType,
        sourceUrl: original.sourceUrl,
        sourceQuote: original.sourceQuote,
        reviewedAt: original.reviewedAt,
      });
    }
  });

  it("keeps the common floor and artifact discovery epistemically separate", () => {
    const matrix = buildContestEvidenceMatrix();

    expect(matrix.commonFloorFailures).toBe(0);
    expect(
      matrix.relations.every(
        (relation) =>
          relation.commonFloor.passes &&
          ["sample_pass", "not_sampled"].includes(
            relation.frontierSufficiency,
          ) &&
          relation.artifactDiscovery.limitation.includes(
            "does not by itself prove",
          ),
      ),
    ).toBe(true);
  });

  it("records the deterministic independent sample without calling it exhaustive", () => {
    const matrix = buildContestEvidenceMatrix();

    expect(matrix.sampleSummary).toMatchObject({
      population: 248,
      sampleSize: 15,
      pass: 15,
      fail: 0,
      notSampled: 233,
      exhaustive: false,
    });
    expect(
      matrix.relations.filter(
        (relation) => relation.frontierSufficiency === "sample_pass",
      ),
    ).toHaveLength(15);
    expect(
      matrix.relations.filter(
        (relation) => relation.frontierSufficiency === "not_sampled",
      ),
    ).toHaveLength(233);
  });
});
