import { describe, expect, it } from "vitest";

import {
  buildContestEvidenceMatrix,
  loadAuditedRelations,
} from "./buildContestEvidenceMatrix";

describe("contest evidence matrix", () => {
  it("projects all 265 approved relations without omission or mutation", () => {
    const source = loadAuditedRelations().filter(
      (relation: { reviewStatus: string }) =>
        relation.reviewStatus === "approved",
    );
    const matrix = buildContestEvidenceMatrix();

    expect(source).toHaveLength(265);
    expect(matrix.sourceCommitSha).toBe(
      "e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2",
    );
    expect(matrix.relations).toHaveLength(265);
    expect(
      new Set(matrix.relations.map((relation) => relation.relationKey)).size,
    ).toBe(265);

    const expectedWaveKeys = [
      "IMS01S|occupation:cno11:2484",
      "IMS01S|occupation:cno11:2713",
      "AGA02S|occupation:cno11:6120",
      "COM01E|occupation:cno11:2651",
      "ELE01E|occupation:cno11:2729",
      "EOC01B|occupation:cno11:7121",
      "EOC01B|occupation:cno11:7191",
      "EOC01B|occupation:cno11:7211",
      "EOC01B|occupation:cno11:7231",
      "EOC01B|occupation:cno11:7240",
      "EOC01B|occupation:cno11:9602",
      "EOC02M|occupation:cno11:7211",
      "EOC02M|occupation:cno11:7231",
      "EOC02M|occupation:cno11:7240",
      "FME01E|occupation:cno11:2482",
      "IMA02S|occupation:cno11:7250",
      "IMS04S|occupation:cno11:3831",
    ];
    expect(
      expectedWaveKeys.filter(
        (key) =>
          !matrix.relations.some((relation) => relation.relationKey === key),
      ),
    ).toEqual([]);

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
      population: 265,
      sampleSize: 15,
      pass: 15,
      fail: 0,
      notSampled: 250,
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
    ).toHaveLength(250);
  });
});
