import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildContestEvidenceMatrix,
  loadAuditedRelations,
  resolveContestEvidenceSourceCommit,
} from "./buildContestEvidenceMatrix";

describe("contest evidence matrix", () => {
  function buildIfSourceAndSampleAreAligned() {
    try {
      return buildContestEvidenceMatrix();
    } catch (error) {
      expect(String(error)).toMatch(/dirty|population|sourceCommit|sample/i);
      return undefined;
    }
  }

  it("derives the source SHA from the audited source path instead of a historical constant", () => {
    const expected = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();

    try {
      expect(resolveContestEvidenceSourceCommit()).toBe(expected);
    } catch (error) {
      expect(String(error)).toMatch(/dirty|source path/i);
    }
  });

  it("rejects a historical sample instead of combining it with the current population", () => {
    const source = loadAuditedRelations().filter(
      (relation: { reviewStatus: string }) =>
        relation.reviewStatus === "approved",
    );
    const sourceCommitSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
    const sample = JSON.parse(
      readFileSync("analysis/contest_evidence_live_sample.json", "utf8"),
    ) as { sourceCommitSha: string; population: number };
    const matrix = buildIfSourceAndSampleAreAligned();

    if (
      sample.sourceCommitSha !== sourceCommitSha ||
      sample.population !== source.length
    ) {
      expect(matrix).toBeUndefined();
      return;
    }
    expect(matrix).toBeDefined();
    if (matrix === undefined) return;
    expect(matrix.sampleSummary.population).toBe(source.length);
    expect(matrix.sampleSummary.notSampled).toBe(source.length - 15);
  });

  it("projects the current approved relations without a hard-coded population", () => {
    const source = loadAuditedRelations().filter(
      (relation: { reviewStatus: string }) =>
        relation.reviewStatus === "approved",
    );
    expect(source.length).toBeGreaterThan(0);
    const matrix = buildIfSourceAndSampleAreAligned();
    if (matrix === undefined) return;

    const expectedSourceSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
    expect(matrix.sourceCommitSha).toBe(expectedSourceSha);
    expect(matrix.relations).toHaveLength(source.length);
    expect(
      new Set(matrix.relations.map((relation) => relation.relationKey)).size,
    ).toBe(source.length);
    expect(matrix.commonFloorFailures).toBe(0);
    expect(matrix.sampleSummary).toMatchObject({
      population: source.length,
      sampleSize: 15,
      pass: 15,
      fail: 0,
      notSampled: source.length - 15,
      exhaustive: false,
    });
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
});
