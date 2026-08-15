import { describe, it, expect } from "vitest";
import { writeVersionMetadata } from "./writeVersionMetadata";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("writeVersionMetadata", () => {
  const testDist = join(tmpdir(), `test-dist-${Date.now()}`);

  it("should create version.json with correct content", async () => {
    mkdirSync(testDist, { recursive: true });
    const commit = "abcdef1234567890abcdef1234567890abcdef12";
    await writeVersionMetadata(testDist, commit);

    const filePath = join(testDist, "version.json");
    expect(existsSync(filePath)).toBe(true);

    const content = JSON.parse(readFileSync(filePath, "utf-8"));
    expect(content).toEqual({
      schemaVersion: "1.0.0",
      commit: commit,
    });

    rmSync(testDist, { recursive: true, force: true });
  });

  it("should throw error if commit is invalid", async () => {
    mkdirSync(testDist, { recursive: true });
    await expect(writeVersionMetadata(testDist, "short")).rejects.toThrow(
      /Invalid commit SHA format/,
    );
  });

  it("should throw error if dist does not exist", async () => {
    const nonExistent = join(testDist, "does-not-exist");
    await expect(
      writeVersionMetadata(
        nonExistent,
        "abcdef1234567890abcdef1234567890abcdef12",
      ),
    ).rejects.toThrow(/Target directory does not exist/);
  });
});
