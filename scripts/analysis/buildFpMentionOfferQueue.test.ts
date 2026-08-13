import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FpMentionOfferQueueReportSchema,
  buildFpMentionOfferQueue as computeQueue,
  mentionsFp,
} from "./buildFpMentionOfferQueue";

const rootDirectory = resolve(__dirname, "../..");
const HEAVY_ANALYSIS_TEST_TIMEOUT = process.env.CI === "true" ? 60_000 : 15_000;
let result: ReturnType<typeof computeQueue> | undefined;

function buildFpMentionOfferQueue() {
  result ??= computeQueue();
  return result;
}

describe("buildFpMentionOfferQueue", () => {
  it(
    "is deterministic and validates its strict schema",
    async () => {
      const first = await buildFpMentionOfferQueue();
      const second = await computeQueue();
      expect(FpMentionOfferQueueReportSchema.parse(first.report)).toEqual(
        first.report,
      );
      expect(second).toEqual(first);
    },
    HEAVY_ANALYSIS_TEST_TIMEOUT,
  );

  it("keeps report counts internally consistent", async () => {
    const { report } = await buildFpMentionOfferQueue();
    expect(report.matchedOfferCount + report.unmatchedOfferCount).toBe(
      report.totalOffers,
    );
    expect(report.queuedOfferCount).toBe(report.entries.length);
    expect(report.requirementMentionOfferCount).toBe(
      report.entries.filter((entry) => entry.requirementQuotes.length > 0)
        .length,
    );
    expect(report.descriptionOnlyMentionOfferCount).toBe(
      report.entries.filter(
        (entry) => entry.mentionScope === "description_only_fp",
      ).length,
    );
  });

  it("keeps generic and description-only mentions separate", async () => {
    const { report } = await buildFpMentionOfferQueue();
    for (const entry of report.entries) {
      if (entry.mentionScope === "requirement_generic_fp") {
        expect(entry.requirementQuotes.length).toBeGreaterThan(0);
        expect(entry.reviewedQualificationLabels).toEqual([]);
      }
      if (entry.mentionScope === "description_only_fp") {
        expect(entry.requirementQuotes).toEqual([]);
        expect(entry.reviewedQualificationLabels).toEqual([]);
      }
      for (const quote of entry.requirementQuotes) {
        expect(mentionsFp(quote)).toBe(true);
      }
    }
  });

  it("never proposes program keys without an exact reviewed qualification", async () => {
    const { report } = await buildFpMentionOfferQueue();
    for (const entry of report.entries) {
      if (entry.candidateProgramKeys.length > 0) {
        expect(entry.mentionScope).toBe("reviewed_qualification_exact");
        expect(entry.reviewedQualificationLabels.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not mutate curated data or the manifest", async () => {
    const paths = [
      resolve(rootDirectory, "public/data/v1/manifest.json"),
      resolve(rootDirectory, "data/curated/occupation-aliases.json"),
    ];
    const before = await Promise.all(
      paths.map(async (path) => ({
        bytes: await readFile(path),
        mtimeMs: (await stat(path)).mtimeMs,
      })),
    );
    await buildFpMentionOfferQueue();
    const after = await Promise.all(
      paths.map(async (path) => ({
        bytes: await readFile(path),
        mtimeMs: (await stat(path)).mtimeMs,
      })),
    );
    expect(after).toEqual(before);
  });

  it("renders a source-linked queue and explicit non-automation limitation", async () => {
    const { markdown } = await buildFpMentionOfferQueue();
    expect(markdown).toContain("Cola de ofertas no enlazadas");
    expect(markdown).toContain("Ninguna entrada se publica automáticamente");
    expect(markdown).toMatch(/https:\/\//u);
  });
});
