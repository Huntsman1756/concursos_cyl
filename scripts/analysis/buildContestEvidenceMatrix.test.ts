import { describe, expect, it } from "vitest";

import {
  buildContestEvidenceMatrix,
  loadAuditedRelations,
} from "./buildContestEvidenceMatrix";

describe("contest evidence matrix", () => {
  it("projects all 240 approved relations without omission or mutation", () => {
    const source = loadAuditedRelations().filter(
      (relation: { reviewStatus: string }) =>
        relation.reviewStatus === "approved",
    );
    const matrix = buildContestEvidenceMatrix();

    expect(source).toHaveLength(240);
    expect(matrix.relations).toHaveLength(240);
    expect(
      new Set(matrix.relations.map((relation) => relation.relationKey)).size,
    ).toBe(240);

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
          relation.frontierSufficiency === "pending_live_sample" &&
          relation.artifactDiscovery.limitation.includes(
            "does not by itself prove",
          ),
      ),
    ).toBe(true);
  });
});
