import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Preserve the tagged source lineage when a protected branch requires squash. */
export function assertFreezeGitBoundary(
  rootDir: string,
  sourceCommitSha: string,
  sourcePaths: readonly string[],
): void {
  const git = (...args: string[]): string =>
    execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("rev-parse", "--verify", `${sourceCommitSha}^{commit}`);
  try {
    git("merge-base", "--is-ancestor", sourceCommitSha, "HEAD");
  } catch {
    const evidence = JSON.parse(
      readFileSync(join(rootDir, "docs/contest/release-evidence.json"), "utf8"),
    ) as {
      schemaVersion?: number;
      status?: string;
      coverageSourceCommitSha?: string;
      publicationCommitSha?: string;
      deployment?: { commitSha?: string; releaseTag?: string };
      releaseDisposition?: { occurred?: boolean; tagObjectSha?: string };
    };
    const publication = evidence.publicationCommitSha;
    const tag = evidence.deployment?.releaseTag;
    if (
      evidence.schemaVersion !== 2 ||
      evidence.status !== "verified" ||
      evidence.coverageSourceCommitSha !== sourceCommitSha ||
      evidence.releaseDisposition?.occurred !== true ||
      !publication ||
      !/^[a-f0-9]{40}$/u.test(publication) ||
      evidence.deployment?.commitSha !== publication ||
      !tag ||
      !/^v[0-9][A-Za-z0-9.-]*$/u.test(tag)
    ) {
      throw new Error(
        "A squash boundary requires a verified tagged publication",
      );
    }
    const ref = `refs/tags/${tag}`;
    if (
      git("cat-file", "-t", ref) !== "tag" ||
      git("rev-parse", ref) !== evidence.releaseDisposition.tagObjectSha ||
      git("rev-parse", `${ref}^{commit}`) !== publication
    ) {
      throw new Error(
        "The annotated publication tag does not match its record",
      );
    }
    git("merge-base", "--is-ancestor", sourceCommitSha, publication);
    git("diff", "--quiet", sourceCommitSha, publication, "--", ...sourcePaths);
  }
  // Both ancestry routes must preserve the same exact data in the current tree.
  git("diff", "--quiet", sourceCommitSha, "--", ...sourcePaths);
}
