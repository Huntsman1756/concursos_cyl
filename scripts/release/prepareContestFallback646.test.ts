import { describe, expect, it } from "vitest";

import { prepareContestFallback646 } from "./prepareContestFallback646";

describe("prepareContestFallback646", () => {
  it("reconstructs the exact historical coverage boundary without writing", () => {
    const result = prepareContestFallback646(process.cwd(), false);

    expect(result).toMatchObject({
      historicalFreezeCommit: "111039ea2678272452169bb30c31cc680a4d436e",
      sourceSnapshotId: "20260809185438334-65ce4d3c4e14",
      relationCount: 14,
      aliasCount: 21,
      offerCount: 1077,
      wroteFiles: false,
    });
    expect(result.snapshotId).toMatch(/^20260809185438334-[a-f0-9]{12}$/u);
  });
});
