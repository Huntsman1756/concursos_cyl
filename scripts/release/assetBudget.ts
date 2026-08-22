import { readdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ASSET_BUDGET = {
  totalBytes: 700_000,
  javascriptBytes: 530_000,
  stylesheetBytes: 75_000,
  imageBytes: 125_000,
} as const;

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

async function collectFiles(
  directory: string,
  relativeDirectory = "",
): Promise<Array<{ path: string; bytes: number }>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = join(directory, entry.name);
      const relativePath = relativeDirectory
        ? `${relativeDirectory}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        return collectFiles(absolutePath, relativePath);
      }

      if (!entry.isFile()) return [];

      return [{ path: relativePath, bytes: (await stat(absolutePath)).size }];
    }),
  );

  return nestedFiles.flat();
}

export async function collectAssetBudget(
  assetDirectory: string,
): Promise<AssetBudgetReport> {
  const files = (await collectFiles(assetDirectory)).map(({ path, bytes }) => {
    const category =
      CATEGORY_BY_EXTENSION[extname(path).toLowerCase()] ?? "other";
    return { path, bytes, category };
  });
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
): Promise<AssetBudgetReport> {
  const report = await collectAssetBudget(assetDirectory);
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
  const assetDirectory = resolve(process.argv[2] ?? "dist/assets");
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
