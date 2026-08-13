import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("keeps build-snapshot tests strict locally and resilient only on CI", async () => {
  const source = await readFile(
    resolve("scripts/data/buildSnapshots.test.ts"),
    "utf8",
  );
  expect(source).toMatch(
    /const BUILD_SNAPSHOTS_TEST_TIMEOUT\s*=\s*process\.env\.CI === "true" \? 90_000 : 30_000;/u,
  );
  expect(source).toContain(
    'describe("buildSnapshots", { timeout: BUILD_SNAPSHOTS_TEST_TIMEOUT }',
  );
  expect(source.match(/BUILD_SNAPSHOTS_TEST_TIMEOUT/gu)).toHaveLength(3);
});

it.each([
  "scripts/analysis/buildFpMentionOfferQueue.test.ts",
  "scripts/analysis/measureFpMarginalAliasImpact.test.ts",
])(
  "keeps heavy analysis strict locally and resilient on CI: %s",
  async (path) => {
    const source = await readFile(resolve(path), "utf8");
    expect(source).toMatch(
      /const HEAVY_ANALYSIS_TEST_TIMEOUT\s*=\s*process\.env\.CI === "true" \? 60_000 : 15_000;/u,
    );
    expect(source.match(/HEAVY_ANALYSIS_TEST_TIMEOUT/gu)).toHaveLength(2);
  },
);
