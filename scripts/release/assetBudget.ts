import { lstat, readdir, realpath } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ASSET_BUDGET = {
  // Calibrated once from the final Tasks 5–7 build (1,747,363 total;
  // 543,624 JS; 78,753 CSS; 1,124,963 images). Category caps round up in
  // fixed 10k/5k/50k buckets. Total uses the next 50k bucket after 1.75 MB,
  // because 1.75 MB would leave only 2,637 bytes (0.15%) of aggregate drift.
  totalBytes: 1_800_000,
  javascriptBytes: 550_000,
  stylesheetBytes: 80_000,
  imageBytes: 1_150_000,
} as const;

export const DEFAULT_ASSET_DIRECTORY = "dist";

export type AssetCategory = "javascript" | "stylesheet" | "image" | "other";

export type AssetFile = {
  path: string;
  bytes: number;
  category: AssetCategory;
};

export type AssetBudgetReport = {
  totalBytes: number;
  categoryBytes: Record<AssetCategory, number>;
  files: AssetFile[];
};

export type AssetInventoryRoot = {
  path: string;
  recursive: boolean;
};

/**
 * The final-build inventory intentionally excludes dist/data/** and the root
 * index.html. Generated data has its own distribution budget, and HTML is not
 * a static asset budget input.
 */
export const ASSET_INVENTORY: readonly AssetInventoryRoot[] = [
  { path: "assets", recursive: true },
  { path: "robots.txt", recursive: false },
  { path: "salida-cyl-icon.png", recursive: false },
  { path: "salida-cyl-social.png", recursive: false },
];

const CATEGORY_BY_EXTENSION: Record<string, AssetCategory> = {
  ".avif": "image",
  ".cjs": "javascript",
  ".css": "stylesheet",
  ".gif": "image",
  ".jpeg": "image",
  ".jpg": "image",
  ".js": "javascript",
  ".mjs": "javascript",
  ".png": "image",
  ".svg": "image",
  ".webp": "image",
};

type CollectedAssetFile = {
  path: string;
  physicalPath: string;
  bytes: number;
};

type ResolvedInventoryRoot = AssetInventoryRoot & {
  absolutePath: string;
  physicalPath: string;
};

function comparePaths(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isMissingPath(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isWithinDirectory(directory: string, candidate: string): boolean {
  return candidate === directory || candidate.startsWith(`${directory}${sep}`);
}

function isOverlappingPath(left: string, right: string): boolean {
  return (
    left === right ||
    right.startsWith(`${left}${sep}`) ||
    left.startsWith(`${right}${sep}`)
  );
}

function normalizeRelativePath(path: string): string {
  return path.split(sep).join("/");
}

function relativeInventoryPath(
  rootDirectory: string,
  absolutePath: string,
): string {
  const path = normalizeRelativePath(relative(rootDirectory, absolutePath));
  return path === "" ? "." : path;
}

function symbolicLinkError(path: string): Error {
  return new Error(`Asset inventory rejects symbolic link: ${path}.`);
}

async function assertNoSymlinkComponents(
  rootDirectory: string,
  candidate: string,
  displayPath: string,
): Promise<boolean> {
  const rootDetails = await lstat(rootDirectory);
  if (rootDetails.isSymbolicLink()) {
    throw symbolicLinkError(displayPath);
  }

  const relativePath = relative(rootDirectory, candidate);
  if (relativePath === "") return true;

  let currentPath = rootDirectory;
  for (const component of relativePath.split(sep)) {
    currentPath = join(currentPath, component);
    let details;
    try {
      details = await lstat(currentPath);
    } catch (error) {
      if (isMissingPath(error)) return false;
      throw error;
    }
    if (details.isSymbolicLink()) {
      throw symbolicLinkError(displayPath);
    }
  }

  return true;
}

async function resolveInventoryRoots(
  rootDirectory: string,
  inventory: readonly AssetInventoryRoot[],
): Promise<ResolvedInventoryRoot[]> {
  const orderedInventory = [...inventory].sort((left, right) =>
    comparePaths(left.path, right.path),
  );
  const roots: ResolvedInventoryRoot[] = [];

  for (const root of orderedInventory) {
    const absolutePath = resolve(rootDirectory, root.path);
    if (!isWithinDirectory(rootDirectory, absolutePath)) {
      throw new Error(`Asset inventory path escapes dist: ${root.path}.`);
    }

    const pathExists = await assertNoSymlinkComponents(
      rootDirectory,
      absolutePath,
      root.path,
    );
    if (!pathExists) {
      if (!root.recursive) continue;
      throw new Error(`Asset inventory root is missing: ${root.path}.`);
    }

    const details = await lstat(absolutePath);
    if (root.recursive && !details.isDirectory()) {
      throw new Error(`Asset inventory root is not a directory: ${root.path}.`);
    }
    if (!root.recursive && !details.isFile()) {
      throw new Error(
        `Asset inventory root is not a regular file: ${root.path}.`,
      );
    }

    const physicalPath = await realpath(absolutePath);
    roots.push({ ...root, absolutePath, physicalPath });
  }

  for (let index = 0; index < roots.length; index += 1) {
    for (
      let otherIndex = index + 1;
      otherIndex < roots.length;
      otherIndex += 1
    ) {
      const left = roots[index]!;
      const right = roots[otherIndex]!;
      if (isOverlappingPath(left.physicalPath, right.physicalPath)) {
        const paths = [left.path, right.path].sort(comparePaths);
        throw new Error(
          `Asset inventory roots overlap: ${paths[0]} and ${paths[1]}.`,
        );
      }
    }
  }

  return roots;
}

async function collectDirectoryFiles(
  directory: string,
  rootDirectory: string,
  relativeDirectory: string,
  visitedDirectories: Map<string, string>,
  files: CollectedAssetFile[],
): Promise<void> {
  const physicalDirectory = await realpath(directory);
  const previousPath = visitedDirectories.get(physicalDirectory);
  if (previousPath !== undefined) {
    const paths = [previousPath, relativeDirectory || "."].sort(comparePaths);
    throw new Error(
      `Asset inventory directories overlap: ${paths[0]} and ${paths[1]}.`,
    );
  }
  visitedDirectories.set(physicalDirectory, relativeDirectory || ".");

  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => comparePaths(left.name, right.name));

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    const path = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name;
    const details = await lstat(absolutePath);

    if (details.isSymbolicLink()) {
      throw symbolicLinkError(path);
    }

    if (details.isDirectory()) {
      await collectDirectoryFiles(
        absolutePath,
        rootDirectory,
        path,
        visitedDirectories,
        files,
      );
      continue;
    }

    if (!details.isFile()) {
      throw new Error(`Asset inventory entry is not a regular file: ${path}.`);
    }

    files.push({
      path: relativeInventoryPath(rootDirectory, absolutePath),
      physicalPath: await realpath(absolutePath),
      bytes: details.size,
    });
  }
}

function legacyInventoryDirectory(
  assetDirectory: string,
  inventory: readonly AssetInventoryRoot[],
): string | undefined {
  if (inventory !== ASSET_INVENTORY) return undefined;
  const resolvedDirectory = resolve(assetDirectory);
  return basename(resolvedDirectory) === "assets"
    ? resolvedDirectory
    : undefined;
}

async function collectInventoryFiles(
  assetDirectory: string,
  inventory: readonly AssetInventoryRoot[],
): Promise<CollectedAssetFile[]> {
  const legacyDirectory = legacyInventoryDirectory(assetDirectory, inventory);
  const rootDirectory = resolve(legacyDirectory ?? assetDirectory);
  const roots = await resolveInventoryRoots(
    rootDirectory,
    legacyDirectory === undefined
      ? inventory
      : [{ path: ".", recursive: true }],
  );
  const visitedDirectories = new Map<string, string>();
  const files: CollectedAssetFile[] = [];

  for (const root of roots) {
    const relativeRootPath = root.path === "." ? "" : root.path;
    if (root.recursive) {
      await collectDirectoryFiles(
        root.absolutePath,
        rootDirectory,
        relativeRootPath,
        visitedDirectories,
        files,
      );
      continue;
    }

    files.push({
      path: normalizeRelativePath(root.path),
      physicalPath: root.physicalPath,
      bytes: (await lstat(root.absolutePath)).size,
    });
  }

  const orderedFiles = files.sort(
    (left, right) =>
      comparePaths(left.physicalPath, right.physicalPath) ||
      comparePaths(left.path, right.path),
  );
  for (let index = 1; index < orderedFiles.length; index += 1) {
    const previous = orderedFiles[index - 1]!;
    const current = orderedFiles[index]!;
    if (previous.physicalPath === current.physicalPath) {
      const paths = [previous.path, current.path].sort(comparePaths);
      throw new Error(
        `Asset inventory includes duplicate physical path: ${paths[0]} and ${paths[1]}.`,
      );
    }
  }

  return orderedFiles.sort((left, right) =>
    comparePaths(left.path, right.path),
  );
}

export async function collectAssetBudget(
  assetDirectory: string,
  inventory: readonly AssetInventoryRoot[] = ASSET_INVENTORY,
): Promise<AssetBudgetReport> {
  const files = (await collectInventoryFiles(assetDirectory, inventory)).map(
    ({ path, bytes }) => {
      const category =
        CATEGORY_BY_EXTENSION[extname(path).toLowerCase()] ?? "other";
      return { path, bytes, category };
    },
  );
  const categoryBytes: Record<AssetCategory, number> = {
    image: 0,
    javascript: 0,
    other: 0,
    stylesheet: 0,
  };

  for (const file of files) {
    categoryBytes[file.category] += file.bytes;
  }

  return {
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    categoryBytes,
    files,
  };
}

export async function assertAssetBudget(
  assetDirectory: string,
  inventory: readonly AssetInventoryRoot[] = ASSET_INVENTORY,
): Promise<AssetBudgetReport> {
  const report = await collectAssetBudget(assetDirectory, inventory);
  const violations = [
    ["total", report.totalBytes, ASSET_BUDGET.totalBytes],
    [
      "javascript",
      report.categoryBytes.javascript,
      ASSET_BUDGET.javascriptBytes,
    ],
    [
      "stylesheet",
      report.categoryBytes.stylesheet,
      ASSET_BUDGET.stylesheetBytes,
    ],
    ["image", report.categoryBytes.image, ASSET_BUDGET.imageBytes],
  ].filter(([, actual, maximum]) => actual > maximum);

  if (violations.length > 0) {
    const details = violations
      .map(
        ([category, actual, maximum]) =>
          `${category} ${actual}/${maximum} bytes`,
      )
      .join(", ");
    throw new Error(`Asset budget exceeded: ${details}`);
  }

  return report;
}

async function main(): Promise<void> {
  const assetDirectory = resolve(process.argv[2] ?? DEFAULT_ASSET_DIRECTORY);
  const report = await assertAssetBudget(assetDirectory);
  console.log(
    `Asset budget OK: ${report.totalBytes}/${ASSET_BUDGET.totalBytes} raw bytes in ${report.files.length} files.`,
  );
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
