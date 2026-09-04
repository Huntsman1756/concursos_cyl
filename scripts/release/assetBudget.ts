import { lstat, readdir, realpath } from "node:fs/promises";
import { basename, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ASSET_BUDGET = {
  // Redesign build calibration (measured on the SALIDA visual system build).
  //
  // A. CORE APPLICATION BUNDLE — JS + CSS + fonts + icons + qa policy artifact.
  //    javascript 605,009 measured → 610k bucket + 10k reserve (Home rewrite,
  //    InfoButton/EditorialImage, center catalog domain).
  //    stylesheet 146,596 measured → 150k bucket + 5k reserve (salida.css:
  //    the approved prototype style layer ported 1:1 into the runtime).
  //    155,123 measured after the UX-audit closure pass (stable hero panel
  //    grid, per-stat proof dates, offer-card action column) → 156k bucket.
  //    fonts 100,912 measured (Public Sans latin 400/600/700 woff2 + OFL).
  // B. EDITORIAL DISTRIBUTION — every AVIF/WebP variant of the editorial
  //    photography (1,568,030 measured under images/editorial/). srcset
  //    downloads ONE variant per viewport; the distribution gate keeps all
  //    variants under control instead of excluding them silently.
  // C. INITIAL PAGE TRANSFER (estimated) — what a first visit to / downloads
  //    before interaction: CSS + JS + fonts + the eager hero image
  //    (images/editorial/hero-career-guidance-960.avif; 884,901 measured).
  //    Everything else is lazy.
  // The aggregate cap covers the full raw distribution incl. the pre-existing
  // root social/icon PNGs (1,032,395 measured — optimization follow-up).
  totalBytes: 3_600_000,
  javascriptBytes: 620_000,
  stylesheetBytes: 156_000,
  fontBytes: 110_000,
  editorialImageBytes: 1_700_000,
  initialTransferBytes: 950_000,
} as const;

export const INITIAL_TRANSFER_REFERENCE_ASSET =
  "images/editorial/hero-career-guidance-960.avif";

export const DEFAULT_ASSET_DIRECTORY = "dist";

export type AssetCategory =
  "javascript" | "stylesheet" | "image" | "font" | "other";

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
 * a static asset budget input. Fonts, editorial images and the qa overlay are
 * REQUIRED inventory roots: hiding them from QA is exactly what this gate
 * must prevent.
 */
export const ASSET_INVENTORY: readonly AssetInventoryRoot[] = [
  { path: "assets", recursive: true },
  { path: "fonts", recursive: true },
  { path: "images", recursive: true },
  { path: "qa", recursive: true },
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
  ".woff": "font",
  ".woff2": "font",
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
    if (!pathExists) continue;

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
    font: 0,
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
  const violations: Array<[string, number, number]> = [
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
    ["font", report.categoryBytes.font, ASSET_BUDGET.fontBytes],
    [
      "editorial images",
      report.files
        .filter(
          (file) =>
            file.category === "image" && file.path.startsWith("images/"),
        )
        .reduce((total, file) => total + file.bytes, 0),
      ASSET_BUDGET.editorialImageBytes,
    ],
  ];

  // QA honesty gate: the editorial distribution and the dated qa overlay must
  // be present in the build — they may never be silently excluded.
  for (const requiredRoot of ["fonts", "images", "qa"] as const) {
    const present = report.files.some((file) =>
      file.path.startsWith(`${requiredRoot}/`),
    );
    if (!present) {
      violations.push([`required ${requiredRoot}/ distribution missing`, 1, 0]);
    }
  }

  // Gate C: estimated initial page transfer (Home critical set).
  const heroFile = report.files.find(
    (file) => file.path === INITIAL_TRANSFER_REFERENCE_ASSET,
  );
  if (heroFile === undefined) {
    violations.push([
      `initial transfer reference asset missing (expected ${INITIAL_TRANSFER_REFERENCE_ASSET})`,
      1,
      0,
    ]);
  } else {
    const initialTransfer =
      report.categoryBytes.javascript +
      report.categoryBytes.stylesheet +
      report.categoryBytes.font +
      heroFile.bytes;
    violations.push([
      "initial transfer (css+js+fonts+eager hero)",
      initialTransfer,
      ASSET_BUDGET.initialTransferBytes,
    ]);
  }

  const realViolations = violations.filter(([, actual, maximum]) => {
    if (maximum === 0 && actual === 1) return true;
    return actual > maximum;
  });

  if (realViolations.length > 0) {
    const details = realViolations
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
