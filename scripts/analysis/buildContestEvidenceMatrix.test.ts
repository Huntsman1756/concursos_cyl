import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildContestEvidenceMatrix,
  resolveContestEvidenceSourceCommit,
} from "./buildContestEvidenceMatrix";

type Fixture = {
  root: string;
  sourceCommitSha: string;
  samplePath: string;
  relationCount: number;
};

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function createFixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), "contest-matrix-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], {
    cwd: root,
  });
  execFileSync("git", ["config", "user.name", "Contest Test"], {
    cwd: root,
  });

  const relations = Array.from({ length: 15 }, (_, index) => ({
    trainingProgramKey: `P${String(index + 1).padStart(2, "0")}`,
    occupationId: `occupation:cno11:${1000 + index}`,
    relationshipType: "reviewed",
    reviewStatus: "approved",
    sourceUrl: `https://boe.es/source/${index}`,
    sourceQuote: `Fuente oficial con evidencia suficiente ${index}.`,
    reviewedAt: "2026-08-22T04:13:28+02:00",
  }));
  const curatedPath = join(
    root,
    "data",
    "curated",
    "training-occupation-links.json",
  );
  const samplePath = join(
    root,
    "analysis",
    "contest_evidence_live_sample.json",
  );
  mkdirSync(join(root, "data", "curated"), { recursive: true });
  mkdirSync(join(root, "analysis"), { recursive: true });
  writeFileSync(curatedPath, `${JSON.stringify(relations, null, 2)}\n`, "utf8");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "source"], { cwd: root });
  const sourceCommitSha = git(root, ["rev-parse", "HEAD"]);
  const seed = "fixture-seed";
  const relationKey = (relation: (typeof relations)[number]) =>
    `${relation.trainingProgramKey}|${relation.occupationId}`;
  const digest = (key: string) =>
    createHash("sha256").update(`${seed}|${key}`).digest("hex");
  const sampleRelations = [...relations]
    .sort((left, right) =>
      digest(relationKey(left)).localeCompare(digest(relationKey(right))),
    )
    .map((relation) => ({
      relationKey: relationKey(relation),
      status: "sample_pass",
      auditStatus: "pass",
      sourceUrl: relation.sourceUrl,
      sourceQuote: relation.sourceQuote,
    }));
  writeFileSync(
    samplePath,
    `${JSON.stringify(
      {
        sourceCommitSha,
        population: relations.length,
        sampleSize: relations.length,
        seed,
        auditedAt: "2026-08-22T04:13:28+02:00",
        independentlyAudited: true,
        exhaustive: false,
        summary: {
          pass: relations.length,
          fail: 0,
          samplePass: relations.length,
          notSampled: 0,
          exhaustive: false,
        },
        relations: sampleRelations,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  writeFileSync(
    join(root, "analysis", "contest_evidence_matrix.json"),
    "{}\n",
    "utf8",
  );
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-qm", "sample"], { cwd: root });
  return { root, sourceCommitSha, samplePath, relationCount: relations.length };
}

function withFixture<T>(callback: (fixture: Fixture) => T): T {
  const fixture = createFixture();
  try {
    return callback(fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
}

describe("contest evidence matrix", () => {
  it("resolves a clean source boundary from HEAD in a Git repository", () => {
    withFixture((fixture) => {
      expect(resolveContestEvidenceSourceCommit(fixture.root)).toBe(
        git(fixture.root, ["rev-parse", "HEAD"]),
      );
    });
  });

  it("builds a complete matrix from an explicit source commit and aligned sample", () => {
    withFixture((fixture) => {
      const matrix = buildContestEvidenceMatrix(fixture.root, {
        sourceCommitSha: fixture.sourceCommitSha,
      });

      expect(matrix.sourceCommitSha).toBe(fixture.sourceCommitSha);
      expect(matrix.relationCount).toBe(fixture.relationCount);
      expect(matrix.relations).toHaveLength(fixture.relationCount);
      expect(matrix.sampleSummary).toMatchObject({
        population: fixture.relationCount,
        sampleSize: fixture.relationCount,
        pass: fixture.relationCount,
        fail: 0,
        notSampled: 0,
        exhaustive: false,
      });
    });
  });

  it("rejects a dirty analysis input before combining it with the source", () => {
    withFixture((fixture) => {
      writeFileSync(
        join(fixture.root, "analysis", "consumed-review.md"),
        "dirty input\n",
        "utf8",
      );

      expect(() => resolveContestEvidenceSourceCommit(fixture.root)).toThrow(
        /dirty|analysis/i,
      );
    });
  });

  it("allows its tracked generated output to be dirty during a check", () => {
    withFixture((fixture) => {
      writeFileSync(
        join(fixture.root, "analysis", "contest_evidence_matrix.json"),
        '{"generated":true}\n',
        "utf8",
      );

      expect(
        resolveContestEvidenceSourceCommit(
          fixture.root,
          fixture.sourceCommitSha,
        ),
      ).toBe(fixture.sourceCommitSha);
    });
  });

  it("rejects a sample population drift even when the drift is committed", () => {
    withFixture((fixture) => {
      const sample = JSON.parse(readFileSync(fixture.samplePath, "utf8")) as {
        population: number;
        summary: { notSampled: number };
      };
      sample.population -= 1;
      sample.summary.notSampled += 1;
      writeFileSync(fixture.samplePath, `${JSON.stringify(sample)}\n`, "utf8");
      execFileSync("git", ["add", "."], { cwd: fixture.root });
      execFileSync("git", ["commit", "-qm", "drift"], { cwd: fixture.root });

      expect(() =>
        buildContestEvidenceMatrix(fixture.root, {
          sourceCommitSha: fixture.sourceCommitSha,
        }),
      ).toThrow(/population|sample/i);
    });
  });
});
