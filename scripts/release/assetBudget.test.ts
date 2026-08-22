import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  ASSET_BUDGET,
  DEFAULT_ASSET_DIRECTORY,
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
  it("inventories build assets and root static files while excluding data and index", async () => {
    const directory = await createAssetDirectory({
      "assets/nested/app.js": 12,
      "assets/styles.css": 8,
      "assets/hero.webp": 20,
      "assets/font.woff2": 5,
      "salida-cyl-social.png": 7,
      "salida-cyl-icon.png": 3,
      "robots.txt": 4,
      "data/v1/manifest.json": 100,
      "index.html": 200,
    });

    try {
      await expect(collectAssetBudget(directory)).resolves.toMatchObject({
        totalBytes: 59,
        categoryBytes: {
          javascript: 12,
          stylesheet: 8,
          image: 30,
          other: 9,
        },
        files: [
          { path: "assets/font.woff2", bytes: 5, category: "other" },
          { path: "assets/hero.webp", bytes: 20, category: "image" },
          { path: "assets/nested/app.js", bytes: 12, category: "javascript" },
          { path: "assets/styles.css", bytes: 8, category: "stylesheet" },
          { path: "robots.txt", bytes: 4, category: "other" },
          { path: "salida-cyl-icon.png", bytes: 3, category: "image" },
          { path: "salida-cyl-social.png", bytes: 7, category: "image" },
        ],
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("uses the dist root as the safe CLI default", () => {
    expect(DEFAULT_ASSET_DIRECTORY).toBe("dist");
  });

  it("keeps deliberately rounded caps for the measured final static build", () => {
    expect(ASSET_BUDGET).toEqual({
      totalBytes: 1_800_000,
      javascriptBytes: 550_000,
      stylesheetBytes: 80_000,
      imageBytes: 1_150_000,
    });
  });

  it("keeps an explicit assets-directory CLI argument compatible", async () => {
    const directory = await createAssetDirectory({
      "assets/nested/app.js": 12,
    });

    try {
      await expect(
        collectAssetBudget(join(directory, "assets")),
      ).resolves.toMatchObject({
        totalBytes: 12,
        files: [{ path: "nested/app.js", bytes: 12, category: "javascript" }],
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects duplicate physical inclusion across inventory roots", async () => {
    const directory = await createAssetDirectory({
      "assets/shared.js": 12,
    });

    try {
      await expect(
        collectAssetBudget(directory, [
          { path: "assets/shared.js", recursive: false },
          { path: "assets/shared.js", recursive: false },
        ]),
      ).rejects.toThrow(/duplicate|overlap|physical/iu);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects a directory symlink before following it", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": 12,
    });
    const externalDirectory = await mkdtemp(
      join(tmpdir(), "salida-cyl-external-assets-"),
    );
    await symlink(externalDirectory, join(directory, "assets", "external"));

    try {
      await expect(collectAssetBudget(directory)).rejects.toThrow(
        "Asset inventory rejects symbolic link: assets/external.",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
      await rm(externalDirectory, { force: true, recursive: true });
    }
  });

  it("rejects a symlinked inventory input directory", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": 12,
    });
    const inputParent = await mkdtemp(
      join(tmpdir(), "salida-cyl-input-parent-"),
    );
    const inputAlias = join(inputParent, "dist");
    await symlink(directory, inputAlias, "dir");

    try {
      await expect(collectAssetBudget(inputAlias)).rejects.toThrow(
        "Asset inventory rejects symbolic link: assets.",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
      await rm(inputParent, { force: true, recursive: true });
    }
  });

  it("rejects a symlink from assets into excluded data", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": 12,
      "data/ignored.js": 20,
    });
    await symlink(
      join(directory, "data", "ignored.js"),
      join(directory, "assets", "into-data.js"),
    );

    try {
      await expect(collectAssetBudget(directory)).rejects.toThrow(
        "Asset inventory rejects symbolic link: assets/into-data.js.",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects external and dangling symlinks at optional root asset paths", async () => {
    for (const target of ["external.png", "missing.png"]) {
      const directory = await createAssetDirectory({
        "assets/app.js": 12,
      });
      const externalDirectory = await mkdtemp(
        join(tmpdir(), "salida-cyl-external-root-"),
      );
      const targetPath = join(externalDirectory, target);
      if (target === "external.png") {
        await writeFile(targetPath, Buffer.alloc(5));
      }
      await symlink(targetPath, join(directory, "salida-cyl-social.png"));

      try {
        await expect(collectAssetBudget(directory)).rejects.toThrow(
          "Asset inventory rejects symbolic link: salida-cyl-social.png.",
        );
      } finally {
        await rm(directory, { force: true, recursive: true });
        await rm(externalDirectory, { force: true, recursive: true });
      }
    }
  });

  it("allows a missing optional root asset without counting it", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": 12,
    });

    try {
      await expect(collectAssetBudget(directory)).resolves.toMatchObject({
        totalBytes: 12,
        files: [{ path: "assets/app.js", bytes: 12, category: "javascript" }],
      });
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects overlapping inventory roots in deterministic path order", async () => {
    const directory = await createAssetDirectory({
      "assets/nested/app.js": 12,
    });

    try {
      await expect(
        collectAssetBudget(directory, [
          { path: "assets/nested", recursive: true },
          { path: "assets", recursive: true },
        ]),
      ).rejects.toThrow(/roots overlap: assets and assets\/nested/iu);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("rejects a category that exceeds its deterministic budget", async () => {
    const directory = await createAssetDirectory({
      "assets/oversized.js": ASSET_BUDGET.javascriptBytes + 1,
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
