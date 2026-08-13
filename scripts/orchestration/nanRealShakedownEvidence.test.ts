import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

const Hash = z.string().regex(/^[a-f0-9]{64}$/u);
const Commit = z.string().regex(/^[a-f0-9]{40}$/u);
const Evidence = z
  .object({
    schemaVersion: z.literal("sanitized-worker-telemetry-v1"),
    evidenceClass: z.literal("repository-sanitized-copy"),
    simulated: z.literal(false),
    selectedModel: z.enum(["nan/qwen3.6", "nan/mimo-v2.5"]),
    nativeSessionId: z.string().regex(/^ses_[A-Za-z0-9]+$/u),
    status: z.literal("COMPLETE"),
    baseSha: Commit,
    resultCommitSha: Commit,
    changedPaths: z.array(z.string().min(1)).min(1),
    tokensUsage: z.object({ total: z.number().int().positive() }).passthrough(),
    validationExitCode: z.literal(0),
    frontierDecision: z.literal("ACCEPT"),
    contractHash: Hash,
    planHash: Hash,
    sourceTelemetrySha256: Hash,
    candidatePatchSha256: Hash,
    decisionHash: Hash,
    authorityEvidenceHash: Hash,
    hostSigned: z.literal(false),
    provenanceEnforcement: z.literal("DISABLED"),
  })
  .passthrough();

const root = resolve(import.meta.dirname, "../..");
const evidenceDirectory = resolve(
  root,
  "docs/evidence/nan-shakedown-2026-08-13",
);

describe("real NAN shakedown evidence", () => {
  const files = readdirSync(evidenceDirectory)
    .filter((fileName) => fileName.endsWith(".worker-telemetry.json"))
    .sort();

  it("retains exactly three non-simulated accepted worker records", () => {
    expect(files).toHaveLength(3);
    const records = files.map((fileName) =>
      Evidence.parse(
        JSON.parse(readFileSync(resolve(evidenceDirectory, fileName), "utf8")),
      ),
    );
    expect(
      records.reduce((total, record) => total + record.tokensUsage.total, 0),
    ).toBe(480382);
  });

  it.each(files)(
    "binds %s to commits that contain every declared path",
    (fileName) => {
      const record = Evidence.parse(
        JSON.parse(readFileSync(resolve(evidenceDirectory, fileName), "utf8")),
      );
      execFileSync("git", ["cat-file", "-e", `${record.baseSha}^{commit}`], {
        cwd: root,
      });
      const changedPaths = execFileSync(
        "git",
        [
          "diff-tree",
          "--no-commit-id",
          "--name-only",
          "-r",
          record.resultCommitSha,
        ],
        { cwd: root, encoding: "utf8" },
      )
        .trim()
        .split(/\r?\n/u);
      expect(changedPaths).toEqual(expect.arrayContaining(record.changedPaths));
    },
  );
});
