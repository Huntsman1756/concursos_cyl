import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANDIDATE_RESOURCE_KEYS } from "../../data/schemas/candidateResourceAllowlist";
import {
  validateCandidateBoundary,
  type CandidateBoundaryOptions,
} from "./validateCandidateBoundary";

const ROOT = process.cwd();

const DOCUMENT_PATHS = [
  "docs/contest/claim-ledger.json",
  "docs/contest/application-summary.md",
  "docs/contest/technical-evidence.md",
  "docs/contest/jury-memo.md",
  "docs/contest/submission-checklist.md",
  "docs/contest/source-ledger.md",
  "docs/contest/limitations.md",
  "docs/contest/coverage-freeze.json",
  "docs/contest/evidence-capture.json",
  "docs/contest/release-evidence.json",
  "DATA_LICENSE.md",
] as const;

async function currentCandidateOptions(): Promise<CandidateBoundaryOptions> {
  const manifest = JSON.parse(
    await readFile(join(ROOT, "public/data/v1/manifest.json"), "utf8"),
  ) as {
    resourceSnapshots: {
      sepeOccupationMarket: { resourcePath: string };
    };
  };
  return {
    rootDir: ROOT,
    manifestPath: "public/data/v1/manifest.json",
    sepeResourcePath: join(
      ROOT,
      "public",
      manifest.resourceSnapshots.sepeOccupationMarket.resourcePath.slice(1),
    ),
    documentPaths: DOCUMENT_PATHS,
    bundleRoots: ["dist"],
  };
}

describe("candidate data boundary", () => {
  it("retains the canonical SEPE runtime evidence", async () => {
    await expect(
      validateCandidateBoundary(await currentCandidateOptions()),
    ).resolves.toMatchObject({ resourceCount: 21, sepeRecordCount: 116 });
  }, 30_000);

  it("rejects a stale one-record SEPE payload", async () => {
    const options = await currentCandidateOptions();
    await expect(
      validateCandidateBoundary({
        ...options,
        sepeResourcePath: join(
          ROOT,
          "public/data/v1/snapshots/20260822021233066-9d8fa948959b/sepe-occupation-market.json",
        ),
      }),
    ).rejects.toThrow(/canonical.*116|sepeOccupationMarket/iu);
  }, 30_000);

  it("compares the candidate set with the generated manifest", async () => {
    const options = await currentCandidateOptions();
    const result = await validateCandidateBoundary(options);

    expect(result.resourceKeys).toEqual([...CANDIDATE_RESOURCE_KEYS]);
  }, 30_000);
});
