import { randomUUID } from "node:crypto";
import { cp, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SNAPSHOT_ID_EXACT = /^\d{17}-[a-f0-9]{12}$/u;
const SNAPSHOT_RESOURCE_PATH =
  /\/data\/v1\/snapshots\/(\d{17}-[a-f0-9]{12})\/([^/?#\s"'\\]+)/gu;
const SNAPSHOT_PATH_WITHOUT_RESOURCE =
  /\/data\/v1\/snapshots\/(\d{17}-[a-f0-9]{12})(?=(?:[?#\s"'\\]|\/(?:[?#\s"'\\]|$)|$))/gu;
const TERMINAL_EVIDENCE_PATHS = [
  "docs/contest/coverage-freeze.json",
  "docs/contest/release-evidence.json",
] as const;

export interface PrepareRuntimeDataOptions {
  root: string;
  source: string;
  target: string;
}

export interface PreparedRuntimeData {
  snapshotIds: string[];
}

function assertDistinctPaths(source: string, target: string): void {
  const sourcePath = resolve(source);
  const targetPath = resolve(target);
  const targetFromSource = relative(sourcePath, targetPath);
  const sourceFromTarget = relative(targetPath, sourcePath);
  if (
    sourcePath === targetPath ||
    (!targetFromSource.startsWith("..") && targetFromSource !== "") ||
    (!sourceFromTarget.startsWith("..") && sourceFromTarget !== "")
  ) {
    throw new Error("Runtime source and target directories must be disjoint.");
  }
}

async function referencedSnapshotIds(root: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (const relativePath of TERMINAL_EVIDENCE_PATHS) {
    let content: string;
    try {
      content = await readFile(resolve(root, relativePath), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(
          `Required runtime evidence file is missing: ${relativePath}.`,
          { cause: error },
        );
      }
      throw error;
    }
    for (const match of content.matchAll(SNAPSHOT_RESOURCE_PATH)) {
      ids.add(match[1]!);
    }
    for (const match of content.matchAll(SNAPSHOT_PATH_WITHOUT_RESOURCE)) {
      throw new Error(
        `Runtime evidence path is missing a resource filename: ${match[0]}.`,
      );
    }
  }
  return ids;
}

async function activeSnapshotId(source: string): Promise<string> {
  const manifest = JSON.parse(
    await readFile(join(source, "v1", "manifest.json"), "utf8"),
  ) as {
    snapshotId?: unknown;
    resourceSnapshots?: Record<string, { resourcePath?: unknown }>;
  };
  const addressedIds = new Set(
    Object.values(manifest.resourceSnapshots ?? {}).flatMap((resource) => {
      if (typeof resource.resourcePath !== "string") return [];
      const match = /\/data\/v1\/snapshots\/(\d{17}-[a-f0-9]{12})\//u.exec(
        resource.resourcePath,
      );
      return match?.[1] ? [match[1]] : [];
    }),
  );
  if (
    typeof manifest.snapshotId === "string" &&
    SNAPSHOT_ID_EXACT.test(manifest.snapshotId)
  ) {
    addressedIds.add(manifest.snapshotId);
  }
  if (addressedIds.size !== 1) {
    throw new Error("The runtime manifest must address exactly one snapshot.");
  }
  return [...addressedIds][0]!;
}

export async function prepareRuntimeData({
  root,
  source,
  target,
}: PrepareRuntimeDataOptions): Promise<PreparedRuntimeData> {
  const sourcePath = resolve(source);
  const targetPath = resolve(target);
  assertDistinctPaths(sourcePath, targetPath);

  const snapshotsSource = join(sourcePath, "v1", "snapshots");
  const availableSnapshotIds = new Set(
    (await readdir(snapshotsSource, { withFileTypes: true }))
      .filter(
        (entry) => entry.isDirectory() && SNAPSHOT_ID_EXACT.test(entry.name),
      )
      .map((entry) => entry.name),
  );
  const active = await activeSnapshotId(sourcePath);
  if (!availableSnapshotIds.has(active)) {
    throw new Error(`Active runtime snapshot is missing: ${active}.`);
  }

  const referenced = await referencedSnapshotIds(resolve(root));
  for (const snapshotId of referenced) {
    if (!availableSnapshotIds.has(snapshotId)) {
      throw new Error(`Referenced runtime snapshot is missing: ${snapshotId}.`);
    }
  }
  const snapshotIds = [...availableSnapshotIds]
    .filter((snapshotId) => snapshotId === active || referenced.has(snapshotId))
    .sort();
  const temporaryTarget = join(
    dirname(targetPath),
    `.${basename(targetPath)}.runtime-${randomUUID()}`,
  );

  await mkdir(dirname(targetPath), { recursive: true });
  try {
    await cp(sourcePath, temporaryTarget, {
      recursive: true,
      filter: (candidate) => {
        const relativeCandidate = relative(sourcePath, candidate);
        return (
          relativeCandidate === "" ||
          (relativeCandidate !== join("v1", "snapshots") &&
            !relativeCandidate.startsWith(`${join("v1", "snapshots")}/`))
        );
      },
    });
    const snapshotsTarget = join(temporaryTarget, "v1", "snapshots");
    await mkdir(snapshotsTarget, { recursive: true });
    for (const snapshotId of snapshotIds) {
      await cp(
        join(snapshotsSource, snapshotId),
        join(snapshotsTarget, snapshotId),
        { recursive: true },
      );
    }

    await rm(targetPath, { recursive: true, force: true });
    await rename(temporaryTarget, targetPath);
  } catch (error) {
    await rm(temporaryTarget, { recursive: true, force: true });
    throw error;
  }

  return { snapshotIds };
}

async function main(): Promise<void> {
  const root = resolve(process.argv[2] ?? ".");
  const source = resolve(process.argv[3] ?? join(root, "public", "data"));
  const target = resolve(process.argv[4] ?? join(root, "dist", "data"));
  const result = await prepareRuntimeData({ root, source, target });
  console.log(
    JSON.stringify({
      check: "runtime-data",
      retainedSnapshots: result.snapshotIds.length,
      snapshotIds: result.snapshotIds,
    }),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
