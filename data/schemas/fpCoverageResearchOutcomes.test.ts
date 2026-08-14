import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FpCoverageResearchOutcomesSchema,
  FpCoverageResearchOutcomeEntrySchema,
} from "./fpCoverageResearchOutcomes";

const repoRoot = resolve(__dirname, "../..");
const outcomesPath = resolve(
  repoRoot,
  "data/curated/fp-coverage-research-outcomes.json",
);

const EXPECTED_KEYS = [
  "SAN06S",
  "COM01S",
  "SAN01M",
  "SAN32",
  "EOC01S",
  "INA01M",
  "IMS01M",
  "HOT01E",
  "AGA01S",
] as const;

const EXPECTED_HASH =
  "f77079a15d7246c04b44889c733fda7fc9bade892c9d78c79607fcb1c3e21e90";

describe("fp-coverage-research-outcomes.json", () => {
  const raw = readFileSync(outcomesPath, "utf-8");
  const document = JSON.parse(raw);

  it("parses against the container schema with strict unknown rejection", () => {
    expect(() =>
      FpCoverageResearchOutcomesSchema.parse(document),
    ).not.toThrow();
    // Verify strict: adding an unknown top-level key must fail
    expect(() =>
      FpCoverageResearchOutcomesSchema.parse({ ...document, extra: true }),
    ).toThrow();
    // Verify strict on entries: adding an unknown entry key must fail
    const extraFieldEntry = { ...document.outcomes[0], extra: true };
    expect(() =>
      FpCoverageResearchOutcomeEntrySchema.parse(extraFieldEntry),
    ).toThrow();
  });

  it("contains exactly the nine expected baseProgramKey values", () => {
    const keys = document.outcomes.map(
      (entry: { baseProgramKey: string }) => entry.baseProgramKey,
    );
    expect(keys).toHaveLength(9);
    expect(keys).toEqual([...EXPECTED_KEYS]);
  });

  it("assigns three outcomes to batch 2 (2026-08-13) and six to batch 3 (2026-08-14)", () => {
    const dateMap = new Map<string, number>();
    for (const entry of document.outcomes) {
      dateMap.set(entry.reviewedAt, (dateMap.get(entry.reviewedAt) ?? 0) + 1);
    }
    expect(dateMap.get("2026-08-13")).toBe(3);
    expect(dateMap.get("2026-08-14")).toBe(6);
    expect(dateMap.size).toBe(2);
  });

  it("uses the approved occupations catalog SHA-256 for every entry", () => {
    for (const entry of document.outcomes) {
      expect(entry.occupationCatalogSha256).toBe(EXPECTED_HASH);
    }
  });

  it("rejects duplicate baseProgramKey values", () => {
    const duplicateDoc = {
      schemaVersion: 1,
      outcomes: [document.outcomes[0], document.outcomes[0]],
    };
    expect(() =>
      FpCoverageResearchOutcomesSchema.parse(duplicateDoc),
    ).toThrow();
  });

  it("all sourcePath, proposalPath, and frontierReviewPath files exist on disk", () => {
    for (const entry of document.outcomes) {
      for (const field of [
        "sourcePath",
        "proposalPath",
        "frontierReviewPath",
      ] as const) {
        const absolute = resolve(repoRoot, entry[field]);
        expect(existsSync(absolute), `${field} missing: ${entry[field]}`).toBe(
          true,
        );
      }
    }
  });

  it("every entry has status reviewed-no-publishable-match", () => {
    for (const entry of document.outcomes) {
      expect(entry.status).toBe("reviewed-no-publishable-match");
    }
  });

  it("no note claims absence of professional outputs or salidas", () => {
    const forbidden = [
      "no hay salidas",
      "no existen salidas",
      "sin salidas",
      "no professional output",
      "no output",
    ];
    for (const entry of document.outcomes) {
      const lower = entry.note.toLowerCase();
      for (const phrase of forbidden) {
        expect(lower).not.toContain(phrase);
      }
    }
  });
});
