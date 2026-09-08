import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertFreezeGitBoundary } from "./assertFreezeGitBoundary";

describe("freeze provenance across squash integration", () => {
  let root: string;
  let source: string;
  let publication: string;
  let tagObject: string;
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const record = (overrides: Record<string, unknown> = {}) => {
    mkdirSync(join(root, "docs/contest"), { recursive: true });
    writeFileSync(
      join(root, "docs/contest/release-evidence.json"),
      JSON.stringify({
        schemaVersion: 2,
        status: "verified",
        coverageSourceCommitSha: source,
        publicationCommitSha: publication,
        deployment: { commitSha: publication, releaseTag: "v2026.09.08-test" },
        releaseDisposition: { occurred: true, tagObjectSha: tagObject },
        ...overrides,
      }),
    );
  };
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "salida-squash-boundary-"));
    git("init", "-q");
    git("config", "user.email", "test@example.invalid");
    git("config", "user.name", "Boundary Test");
    writeFileSync(join(root, "data.json"), "original\n");
    git("add", "data.json");
    git("commit", "-qm", "source");
    source = git("rev-parse", "HEAD");
    git("commit", "--allow-empty", "-qm", "publication");
    publication = git("rev-parse", "HEAD");
    git("tag", "-a", "v2026.09.08-test", "-m", "publication");
    tagObject = git("rev-parse", "refs/tags/v2026.09.08-test");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  const squash = () => {
    git("checkout", "--orphan", "squashed", "-q");
    git("commit", "-qm", "squashed publication");
    record();
  };
  it("accepts ordinary ancestry without a release record", () => {
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).not.toThrow();
  });
  it("accepts identical data after squash with the exact annotated publication tag", () => {
    squash();
    expect(() => git("merge-base", "--is-ancestor", source, "HEAD")).toThrow();
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).not.toThrow();
  });
  it("rejects changed data after squash", () => {
    squash();
    writeFileSync(join(root, "data.json"), "changed\n");
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).toThrow();
  });
  it("rejects a pending publication record", () => {
    squash();
    record({ status: "pending" });
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).toThrow();
  });
  it("rejects a moved or lightweight tag", () => {
    squash();
    git("tag", "-d", "v2026.09.08-test");
    git("tag", "v2026.09.08-test");
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).toThrow();
  });
  it("rejects a forged tag object identity", () => {
    squash();
    record({
      releaseDisposition: { occurred: true, tagObjectSha: "0".repeat(40) },
    });
    expect(() =>
      assertFreezeGitBoundary(root, source, ["data.json"]),
    ).toThrow();
  });
});
