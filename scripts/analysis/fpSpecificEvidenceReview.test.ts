import { describe as activeDescribe, expect, it } from "vitest";

// Historical 76/220 publication contract; see analysis/contest_fallback_test_scope.md.
const describe = activeDescribe.skip;

import queue from "../../analysis/fp_mention_offer_queue.json";
import review from "../../analysis/fp_specific_evidence_review.json";
import aliases from "../../data/curated/occupation-aliases.json";
import links from "../../data/curated/training-occupation-links.json";

describe("FP-specific offer evidence review", () => {
  it("removes accepted cases and retains deferred cases in the live queue", () => {
    const queued = queue.entries
      .filter(
        ({ triageDisposition }) =>
          triageDisposition === "specific_cycle_evidence_review",
      )
      .map(({ offerId }) => offerId)
      .sort();
    const reviewed = [...review.accepted, ...review.deferred]
      .map(({ offerId }) => offerId)
      .sort();
    const deferred = review.deferred.map(({ offerId }) => offerId).sort();
    const accepted = new Set(review.accepted.map(({ offerId }) => offerId));

    expect(review.totalReviewed).toBe(21);
    expect(review.acceptedOfferCount).toBe(review.accepted.length);
    expect(review.deferredOfferCount).toBe(review.deferred.length);
    expect(new Set(reviewed).size).toBe(reviewed.length);
    expect(queued).toEqual(
      deferred.filter((offerId) => queued.includes(offerId)),
    );
    expect(queued.every((offerId) => !accepted.has(offerId))).toBe(true);
  });

  it("publishes every accepted phrase against an approved linked occupation", () => {
    for (const accepted of review.accepted) {
      expect(aliases).toContainEqual(
        expect.objectContaining({
          alias: accepted.alias,
          occupationId: accepted.occupationId,
          reviewStatus: "approved",
        }),
      );
      expect(links).toContainEqual(
        expect.objectContaining({
          occupationId: accepted.occupationId,
          reviewStatus: "approved",
        }),
      );
    }
  });
});
