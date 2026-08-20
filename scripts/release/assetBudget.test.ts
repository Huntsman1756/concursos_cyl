import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  ASSET_BUDGET,
  assertAssetBudget,
  collectAssetBudget,
} from "./assetBudget";

async function createAssetDirectory(
  files: Record<string, number>,
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "salida-cyl-assets-"));

  await Promise.all(
    Object.entries(files).map(async ([relativePath, bytes]) => {
      const filePath = join(directory, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, Buffer.alloc(bytes));
    }),
  );

  return directory;
}

describe("asset budget", () => {
  it("reports raw bytes by category without depending on build hashes", async () => {
    const directory = await createAssetDirectory({
      "nested/app.js": 12,
      "styles.css": 8,
      "hero.webp": 20,
      "font.woff2": 5,
    });

    try {
      await expect(collectAssetBudget(directory)).resolves.toMatchObject({
        totalBytes: 45,
        categoryBytes: {
          javascript: 12,
          stylesheet: 8,
          image: 20,
          other: 5,
        },
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects a category that exceeds its deterministic budget", async () => {
    const directory = await createAssetDirectory({
      "oversized.js": ASSET_BUDGET.javascriptBytes + 1,
    });

    try {
      await expect(assertAssetBudget(directory)).rejects.toThrow(
        /javascript/iu,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
