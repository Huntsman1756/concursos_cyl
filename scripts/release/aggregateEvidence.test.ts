import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const normalized = (value: string) => {
  const url = new URL(value);
  return `${url.hostname.replace(/^www\./u, "")}${url.pathname.replace(/\/$/u, "")}`;
};

describe("approved FP relationships keep contextual statistics separate", () => {
  it("does not use aggregate resource sources as the sole relationship evidence", () => {
    const manifest = readJson("public/data/v1/manifest.json");
    const contextKeys = [
      "provincialContracts",
      "municipalities",
      "outcomeIndicators",
      "sepeOccupationMarket",
    ];
    const contextualSources = new Set(
      contextKeys.map((key) =>
        normalized(manifest.resourceSnapshots[key].sourceUrl),
      ),
    );
    const approved = readJson(
      "data/curated/training-occupation-links.json",
    ).filter(
      (row: { reviewStatus: string }) => row.reviewStatus === "approved",
    );
    expect(approved.length).toBeGreaterThan(0);
    const invalid = approved.filter((row: { sourceUrl: string }) =>
      contextualSources.has(normalized(row.sourceUrl)),
    );
    expect(
      invalid,
      "Aggregate statistics provide context, not evidence of a training-to-occupation relationship",
    ).toEqual([]);
  });
});
