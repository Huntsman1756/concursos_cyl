import { randomUUID } from "node:crypto";
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";

const SNAPSHOT_ID_EXACT = /^\d{17}-[a-f0-9]{12}$/u;
const SNAPSHOT_RESOURCE_PATH =
  /^\/data\/v1\/snapshots\/(\d{17}-[a-f0-9]{12})\/([^/?#\s"'\\]+)$/u;
const SNAPSHOT_PATH_WITHOUT_RESOURCE =
  /^\/data\/v1\/snapshots\/\d{17}-[a-f0-9]{12}$/u;
const SNAPSHOT_PATH_MARKER = "/data/v1/snapshots/";
const SNAPSHOT_PATH_MARKER_ENCODED =
  /(?:%2f|\/)data(?:%2f|\/)v1(?:%2f|\/)snapshots(?:%2f|\/)/iu;
const SAFE_RESOURCE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const TERMINAL_EVIDENCE_PATHS = [
  "docs/contest/coverage-freeze.json",
  "docs/contest/release-evidence.json",
] as const;

interface SnapshotReference {
  resourceName: string;
  snapshotId: string;
}

export interface PrepareRuntimeDataOptions {
  root: string;
  source: string;
  target: string;
}

interface PrepareRuntimeDataDependencies {
  rename: typeof rename;
}

export interface PreparedRuntimeData {
  snapshotIds: string[];
}

async function resolveExistingAncestor(path: string): Promise<string> {
  const missingSegments: string[] = [];
  let candidate = resolve(path);
  while (true) {
    try {
      const physicalCandidate = await realpath(candidate);
      return join(physicalCandidate, ...missingSegments);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = dirname(candidate);
      if (parent === candidate) throw error;
      missingSegments.unshift(basename(candidate));
      candidate = parent;
    }
  }
}

async function assertDistinctPaths(
  source: string,
  target: string,
): Promise<{ sourcePath: string; targetPath: string }> {
  const sourcePath = await realpath(resolve(source));
  const targetPath = resolve(target);
  const physicalTargetPath = await resolveExistingAncestor(targetPath);
  const physicalTargetParent = await resolveExistingAncestor(
    dirname(targetPath),
  );
  const isWithinOrSame = (root: string, candidate: string): boolean => {
    const pathFromRoot = relative(root, candidate);
    return (
      pathFromRoot === "" ||
      (!isAbsolute(pathFromRoot) &&
        pathFromRoot !== ".." &&
        !pathFromRoot.startsWith(`..${sep}`))
    );
  };
  if (
    isWithinOrSame(sourcePath, physicalTargetPath) ||
    isWithinOrSame(physicalTargetPath, sourcePath) ||
    isWithinOrSame(sourcePath, physicalTargetParent)
  ) {
    throw new Error("Runtime source and target directories must be disjoint.");
  }
  return { sourcePath, targetPath };
}

export function shouldCopyRuntimeCandidate(relativeCandidate: string): boolean {
  const components = relativeCandidate.split(/[\\/]+/u).filter(Boolean);
  return !(components[0] === "v1" && components[1] === "snapshots");
}

async function assertSafeTree(
  root: string,
  description: string,
  skipDirectory?: string,
): Promise<void> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`${description} contains a symbolic link: ${path}.`);
    }
    if (entry.isDirectory()) {
      if (skipDirectory !== undefined && resolve(path) === skipDirectory) {
        continue;
      }
      await assertSafeTree(path, description, skipDirectory);
      continue;
    }
    if (!entry.isFile()) {
      throw new Error(`${description} contains a non-regular entry: ${path}.`);
    }
  }
}

function snapshotReferenceFromString(
  value: string,
  evidencePath: string,
): SnapshotReference | undefined {
  const hasEncodedMarker = SNAPSHOT_PATH_MARKER_ENCODED.test(value);
  if (!value.includes(SNAPSHOT_PATH_MARKER)) {
    if (hasEncodedMarker) {
      throw new Error(
        `Malformed runtime snapshot resource path in ${evidencePath}: ${value}.`,
      );
    }
    return undefined;
  }
  if (/(?:^|\/)\.\.?(?:\/|$)|\\|%2e|%2f|%5c/iu.test(value)) {
    throw new Error(
      `Malformed runtime snapshot resource path in ${evidencePath}: ${value}.`,
    );
  }

  let path = value;
  if (!value.startsWith("/")) {
    let url: URL;
    try {
      url = new URL(value);
    } catch (error) {
      throw new Error(
        `Malformed runtime snapshot resource path in ${evidencePath}: ${value}.`,
        { cause: error },
      );
    }
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username !== "" ||
      url.password !== "" ||
      url.search !== "" ||
      url.hash !== "" ||
      value.includes("?") ||
      value.includes("#")
    ) {
      throw new Error(
        `Malformed runtime snapshot resource path in ${evidencePath}: ${value}.`,
      );
    }
    path = url.pathname;
  }

  if (SNAPSHOT_PATH_WITHOUT_RESOURCE.test(path)) {
    throw new Error(
      `Runtime evidence path is missing a resource filename: ${value}.`,
    );
  }
  const match = SNAPSHOT_RESOURCE_PATH.exec(path);
  if (!match || !SAFE_RESOURCE_FILENAME.test(match[2]!)) {
    throw new Error(
      `Malformed runtime snapshot resource path in ${evidencePath}: ${value}.`,
    );
  }
  return { resourceName: match[2]!, snapshotId: match[1]! };
}

function collectSnapshotReferences(
  value: unknown,
  evidencePath: string,
  references: SnapshotReference[],
): void {
  if (typeof value === "string") {
    const reference = snapshotReferenceFromString(value, evidencePath);
    if (reference) references.push(reference);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectSnapshotReferences(item, evidencePath, references);
    }
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectSnapshotReferences(item, evidencePath, references);
    }
  }
}

async function referencedSnapshotResources(
  root: string,
): Promise<SnapshotReference[]> {
  const references: SnapshotReference[] = [];
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
    let document: unknown;
    try {
      document = JSON.parse(content) as unknown;
    } catch (error) {
      throw new Error(`Invalid runtime evidence JSON: ${relativePath}.`, {
        cause: error,
      });
    }
    collectSnapshotReferences(document, relativePath, references);
  }
  return references;
}

async function assertReferencedResource(
  snapshotsSource: string,
  reference: SnapshotReference,
): Promise<void> {
  const snapshotDirectory = resolve(snapshotsSource, reference.snapshotId);
  const resourcePath = resolve(snapshotDirectory, reference.resourceName);
  const pathFromSnapshot = relative(snapshotDirectory, resourcePath);
  if (
    pathFromSnapshot === "" ||
    pathFromSnapshot.startsWith("..") ||
    isAbsolute(pathFromSnapshot)
  ) {
    throw new Error(
      `Unsafe runtime snapshot resource path: /data/v1/snapshots/${reference.snapshotId}/${reference.resourceName}.`,
    );
  }
  let resourceStat;
  try {
    resourceStat = await lstat(resourcePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Referenced runtime resource is missing: /data/v1/snapshots/${reference.snapshotId}/${reference.resourceName}.`,
        { cause: error },
      );
    }
    throw error;
  }
  if (!resourceStat.isFile()) {
    throw new Error(
      `Referenced runtime resource is not a regular file: /data/v1/snapshots/${reference.snapshotId}/${reference.resourceName}.`,
    );
  }
}

async function activeSnapshotId(
  source: string,
): Promise<{ references: SnapshotReference[]; snapshotId: string }> {
  const manifest = JSON.parse(
    await readFile(join(source, "v1", "manifest.json"), "utf8"),
  ) as {
    snapshotId?: unknown;
    resourceSnapshots?: unknown;
  };
  const addressedIds = new Set<string>();
  const references: SnapshotReference[] = [];
  if (manifest.snapshotId !== undefined) {
    if (
      typeof manifest.snapshotId !== "string" ||
      !SNAPSHOT_ID_EXACT.test(manifest.snapshotId)
    ) {
      throw new Error("The runtime manifest snapshotId is invalid.");
    }
    addressedIds.add(manifest.snapshotId);
  }
  if (manifest.resourceSnapshots !== undefined) {
    if (
      typeof manifest.resourceSnapshots !== "object" ||
      manifest.resourceSnapshots === null ||
      Array.isArray(manifest.resourceSnapshots)
    ) {
      throw new Error("The runtime manifest resourceSnapshots are invalid.");
    }
    for (const [key, resource] of Object.entries(manifest.resourceSnapshots)) {
      if (
        typeof resource !== "object" ||
        resource === null ||
        Array.isArray(resource) ||
        typeof (resource as { resourcePath?: unknown }).resourcePath !==
          "string"
      ) {
        throw new Error(
          `The runtime manifest resourceSnapshots.${key}.resourcePath is invalid.`,
        );
      }
      const resourcePath = (resource as { resourcePath: string }).resourcePath;
      if (!resourcePath.startsWith("/")) {
        throw new Error(
          `The runtime manifest resourceSnapshots.${key}.resourcePath is not a local resource path.`,
        );
      }
      const reference = snapshotReferenceFromString(
        resourcePath,
        "public/data/v1/manifest.json",
      );
      if (!reference) {
        throw new Error(
          `The runtime manifest resourceSnapshots.${key}.resourcePath is invalid.`,
        );
      }
      references.push(reference);
      addressedIds.add(reference.snapshotId);
    }
  }
  if (addressedIds.size !== 1) {
    throw new Error("The runtime manifest must address exactly one snapshot.");
  }
  return { references, snapshotId: [...addressedIds][0]! };
}

async function lstatIfPresent(path: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function atomicallyReplaceRuntimeTarget(
  temporaryTarget: string,
  targetPath: string,
  renameOperation: typeof rename,
): Promise<void> {
  const backupPath = join(
    dirname(targetPath),
    `.${basename(targetPath)}.runtime-backup-${randomUUID()}`,
  );
  let targetBackedUp = false;

  try {
    const targetStat = await lstatIfPresent(targetPath);
    if (targetStat?.isSymbolicLink()) {
      throw new Error(
        `Runtime target must not be a symbolic link: ${targetPath}.`,
      );
    }
    if (await lstatIfPresent(backupPath)) {
      throw new Error(
        `Runtime target backup path already exists: ${backupPath}.`,
      );
    }

    if (targetStat) {
      await renameOperation(targetPath, backupPath);
      targetBackedUp = true;
    }

    try {
      await renameOperation(temporaryTarget, targetPath);
    } catch (error) {
      if (targetBackedUp) {
        try {
          await renameOperation(backupPath, targetPath);
          targetBackedUp = false;
        } catch (restoreError) {
          throw new AggregateError(
            [error, restoreError],
            "Failed to install runtime data and restore the previous target.",
            { cause: restoreError },
          );
        }
      }
      throw error;
    }

    if (targetBackedUp) {
      await rm(backupPath, { recursive: true, force: true });
      targetBackedUp = false;
    }
  } finally {
    if (!targetBackedUp) {
      await rm(backupPath, { recursive: true, force: true });
    }
  }
}

export async function prepareRuntimeData(
  { root, source, target }: PrepareRuntimeDataOptions,
  { rename: renameOperation = rename }: PrepareRuntimeDataDependencies = {
    rename,
  },
): Promise<PreparedRuntimeData> {
  const { sourcePath, targetPath } = await assertDistinctPaths(source, target);

  const snapshotsSource = join(sourcePath, "v1", "snapshots");
  const availableSnapshotIds = new Set(
    (await readdir(snapshotsSource, { withFileTypes: true }))
      .filter(
        (entry) => entry.isDirectory() && SNAPSHOT_ID_EXACT.test(entry.name),
      )
      .map((entry) => entry.name),
  );
  const { references: activeManifestReferences, snapshotId: active } =
    await activeSnapshotId(sourcePath);
  if (!availableSnapshotIds.has(active)) {
    throw new Error(`Active runtime snapshot is missing: ${active}.`);
  }

  const referencedResources = await referencedSnapshotResources(resolve(root));
  const allReferencedResources = [
    ...activeManifestReferences,
    ...referencedResources,
  ];
  const referenced = new Set(
    allReferencedResources.map((reference) => reference.snapshotId),
  );
  for (const reference of allReferencedResources) {
    if (!availableSnapshotIds.has(reference.snapshotId)) {
      throw new Error(
        `Referenced runtime snapshot is missing: ${reference.snapshotId}.`,
      );
    }
    await assertReferencedResource(snapshotsSource, reference);
  }
  const snapshotIds = [...availableSnapshotIds]
    .filter((snapshotId) => snapshotId === active || referenced.has(snapshotId))
    .sort();
  await assertSafeTree(sourcePath, "runtime source", resolve(snapshotsSource));
  for (const snapshotId of snapshotIds) {
    await assertSafeTree(
      join(snapshotsSource, snapshotId),
      `runtime snapshot ${snapshotId}`,
    );
  }
  const temporaryTarget = join(
    dirname(targetPath),
    `.${basename(targetPath)}.runtime-${randomUUID()}`,
  );

  await mkdir(dirname(targetPath), { recursive: true });
  const targetStat = await lstatIfPresent(targetPath);
  if (targetStat?.isSymbolicLink()) {
    throw new Error(
      `Runtime target must not be a symbolic link: ${targetPath}.`,
    );
  }
  try {
    await cp(sourcePath, temporaryTarget, {
      recursive: true,
      filter: (candidate) => {
        const relativeCandidate = relative(sourcePath, candidate);
        return shouldCopyRuntimeCandidate(relativeCandidate);
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

    await atomicallyReplaceRuntimeTarget(
      temporaryTarget,
      targetPath,
      renameOperation,
    );
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
