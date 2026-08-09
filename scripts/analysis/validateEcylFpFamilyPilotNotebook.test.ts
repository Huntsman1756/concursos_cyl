import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../..");
const NOTEBOOK = resolve(ROOT, "analysis/ecyl_fp_family_pilot_ranking.ipynb");
function runJupyter(arguments_: readonly string[]) {
  return spawnSync("jupyter", arguments_, {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, PYTHONUTF8: "1" },
    timeout: 330_000,
  });
}

describe("ECYL FP family pilot notebook", () => {
  it("executes the contamination assertions against the real snapshot", () => {
    const outputDirectory = mkdtempSync(
      resolve(tmpdir(), "ecyl-fp-family-pilot-"),
    );
    const executedName = "ecyl_fp_family_pilot_ranking.executed.ipynb";
    const executedPath = resolve(outputDirectory, executedName);

    try {
      const execution = runJupyter([
        "nbconvert",
        "--to",
        "notebook",
        "--execute",
        NOTEBOOK,
        "--output",
        executedName,
        "--output-dir",
        outputDirectory,
        "--ExecutePreprocessor.timeout=300",
      ]);

      expect(execution.error).toBeUndefined();
      expect(execution.status, execution.stderr || execution.stdout).toBe(0);

      expect(existsSync(executedPath)).toBe(true);
    } finally {
      rmSync(outputDirectory, { recursive: true, force: true });
    }
  }, 360_000);
});
