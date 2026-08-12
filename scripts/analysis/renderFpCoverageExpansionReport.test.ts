import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FpCoverageExpansionReportSchema,
  assertRenderedFpCoverageExpansionReport,
  buildFpCoverageExpansionReport,
  loadFpCoverageExpansionInputs,
  reportCandidate,
  renderFpCoverageExpansionReport,
} from "./renderFpCoverageExpansionReport";
import { validateExpansionAttemptData } from "./validateFpCoverageExpansion";

const root = process.cwd();

async function report() {
  return buildFpCoverageExpansionReport(root);
}

describe("renderFpCoverageExpansionReport", () => {
  it("reconciles exact terminal counts, zero gap, and zero offer union", async () => {
    const result = await report();

    expect(result.counts).toMatchObject({
      completed: 8,
      deferred: 6,
      discarded: 0,
      terminal: 14,
      primaryAttempted: 7,
      reserveAttempted: 7,
      totalAttempted: 14,
      primaryUnattempted: 0,
      reserveUnattempted: 0,
    });
    expect(result.coverage).toMatchObject({
      baselineReviewedQualifications: [
        "qualification:EOC01M",
        "qualification:HOT01M",
        "qualification:IFC03S",
        "qualification:SAN21",
        "qualification:SSC01M",
      ],
      terminalDistinctQualificationTotal: 13,
      targetDistinctQualifications: 12,
      remainingGap: 0,
      publicationStatus: "published_task_a2_12",
    });
    expect(result.offerDeltas).toEqual({
      byProgram: {
        ADG01M: [],
        AGA03M: [],
        COM02M: [],
        ELE01M: [],
        FME01M: [],
        FME02M: [],
        IMA02M: [],
        IMA03M: [],
        MAM01M: [],
        TMV02M: [],
        ELE03S: [],
        AGA01M: [],
        TMV01M: [],
        COM01B: [],
      },
      union: [],
    });
    expect(result.coverage.modalityDoubleCount).toBe(false);
    expect(result.time).toEqual({
      totalModeledActiveMinutes: 259,
      totalWallClockMinutes: 421.65,
      totalReviewerMinutes: 18,
      reviewerMinutesExcluded: true,
    });
    expect(
      result.candidates.find((candidate) => candidate.programKey === "COM02M"),
    ).toMatchObject({
      offerDeltaIds: [],
      reviewerMinutes: 0,
    });
  });

  it("keeps attempted and unattempted lanes explicit", async () => {
    const result = await report();
    const attempted = result.candidates.filter(
      (candidate) => candidate.attempted,
    );
    const unattempted = result.candidates.filter(
      (candidate) => !candidate.attempted,
    );

    expect(attempted).toHaveLength(14);
    expect(unattempted).toHaveLength(0);
    expect(
      attempted.find((candidate) => candidate.programKey === "MAM01M"),
    ).toMatchObject({
      lane: "reserve",
      rank: 8,
      state: "deferred",
    });
    expect(unattempted.map((candidate) => candidate.programKey)).toEqual([]);
  });

  it("renders the checked markdown byte-for-byte", async () => {
    const result = await report();
    const rendered = renderFpCoverageExpansionReport(result);
    const checked = await readFile(
      resolve(root, "analysis/fp_coverage_expansion_results.md"),
      "utf8",
    );
    expect(rendered).toBe(checked);
    expect(() =>
      assertRenderedFpCoverageExpansionReport(checked, rendered),
    ).not.toThrow();
  });

  it("rejects duplicate canonical bases and tampered report counts", async () => {
    const result = await report();
    const duplicate = structuredClone(result);
    duplicate.candidates[1]!.baseQualificationIdentity =
      duplicate.candidates[0]!.baseQualificationIdentity;
    expect(() => FpCoverageExpansionReportSchema.parse(duplicate)).toThrow(
      /duplicate|canonical/i,
    );

    const tampered = structuredClone(result);
    tampered.counts.completed += 1;
    expect(() => FpCoverageExpansionReportSchema.parse(tampered)).toThrow(
      /count|completed/i,
    );
  });

  it("rejects a tampered snapshot hash against independent current resources", async () => {
    const inputs = await loadFpCoverageExpansionInputs(root);
    const attempt = inputs.attempts.get("COM02M")!;
    const candidate = [
      ...inputs.ranking.primaryCandidates,
      ...inputs.ranking.reserveCandidates,
    ].find((entry) => entry.programKey === "COM02M")!;
    const recomputed = inputs.independentlyComputed.get("COM02M")!;
    expect(recomputed.computed.snapshotHash).toBe(attempt.snapshotHash);
    const tampered = structuredClone(attempt);
    tampered.snapshotHash = "0".repeat(64);
    expect(() =>
      validateExpansionAttemptData({
        attempt: tampered,
        candidate,
        computed: recomputed.computed,
        publicRelationSet: recomputed.publicRelationSet,
        publicationPending: false,
        reviewedCommitAt: tampered.reviewedCommitAt,
      }),
    ).toThrow(/snapshot/i);
  });

  it("does not copy relation evidence or public parity from an attempt", async () => {
    const inputs = await loadFpCoverageExpansionInputs(root);
    const attempt = inputs.attempts.get("COM02M")!;
    const candidate = inputs.ranking.primaryCandidates.find(
      (entry) => entry.programKey === "COM02M",
    )!;
    const recomputed = inputs.independentlyComputed.get("COM02M")!;
    const tampered = structuredClone(attempt);
    tampered.acceptedRelations = [];
    tampered.rejectedRelations = [];
    tampered.publicParity = {
      publishedRelationKeys: ["COM02M|occupation:cno11:9999"],
      rejectedRelationKeys: [],
    };

    const result = reportCandidate(candidate, tampered, "primary", recomputed);

    expect(result.acceptedRelationKeys).toEqual(
      recomputed.relationKeys.accepted,
    );
    expect(result.rejectedRelationKeys).toEqual(
      recomputed.relationKeys.rejected,
    );
    expect(result.publicParity).toEqual({
      publishedRelationKeys: recomputed.publicRelationSet.relationKeys,
      rejectedRelationKeys: recomputed.relationKeys.rejected,
    });
  });

  it("requires exact public parity for a completed attempt", async () => {
    const inputs = await loadFpCoverageExpansionInputs(root);
    const attempt = inputs.attempts.get("COM02M")!;
    const candidate = inputs.ranking.primaryCandidates.find(
      (entry) => entry.programKey === "COM02M",
    )!;
    const recomputed = inputs.independentlyComputed.get("COM02M")!;

    expect(() =>
      validateExpansionAttemptData({
        attempt,
        candidate,
        computed: recomputed.computed,
        publicRelationSet: {
          ...recomputed.publicRelationSet,
          relationKeys: recomputed.publicRelationSet.relationKeys.slice(0, 1),
        },
        publicationPending: false,
        reviewedCommitAt: attempt.reviewedCommitAt,
      }),
    ).toThrow(/public parity|missing|equal/i);
  });
});
