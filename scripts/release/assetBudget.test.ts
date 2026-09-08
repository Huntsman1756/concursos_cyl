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
  it("inventories build assets, fonts, editorial images, qa artifacts and root static files while excluding data and index", async () => {
    const directory = await createAssetDirectory({
      "assets/nested/app.js": 12,
      "assets/styles.css": 8,
      "fonts/font.woff2": 5,
      "images/hero-career-guidance-960.avif": 9,
      "images/path-training-640.webp": 11,
      "qa/center-link-policy.json": 6,
      "salida-cyl-social.png": 7,
      "salida-cyl-icon.png": 3,
      "robots.txt": 4,
      "data/v1/manifest.json": 100,
      "index.html": 200,
    });

    try {
      await expect(collectAssetBudget(directory)).resolves.toMatchObject({
        totalBytes: 65,
        categoryBytes: {
          javascript: 12,
          stylesheet: 8,
          image: 30,
          font: 5,
          other: 10,
        },
        files: [
          { path: "assets/nested/app.js", bytes: 12, category: "javascript" },
          { path: "assets/styles.css", bytes: 8, category: "stylesheet" },
          { path: "fonts/font.woff2", bytes: 5, category: "font" },
          {
            path: "images/hero-career-guidance-960.avif",
            bytes: 9,
            category: "image",
          },
          {
            path: "images/path-training-640.webp",
            bytes: 11,
            category: "image",
          },
          { path: "qa/center-link-policy.json", bytes: 6, category: "other" },
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

  it("keeps deliberately rounded caps for the redesign build (three documented gates)", () => {
    expect(ASSET_BUDGET).toEqual({
      totalBytes: 3_600_000,
      javascriptBytes: 623_000,
      stylesheetBytes: 158_000,
      fontBytes: 110_000,
      editorialImageBytes: 1_700_000,
      initialTransferBytes: 950_000,
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
      "fonts/font.woff2": 5,
      "images/hero-career-guidance-960.avif": 9,
      "qa/policy.json": 6,
    });

    try {
      await expect(assertAssetBudget(directory)).rejects.toThrow(
        /javascript/iu,
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("bounds the Pages path reserve without relaxing the root budget", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": ASSET_BUDGET.javascriptBytes + 26,
      "fonts/font.woff2": 5,
      "images/editorial/hero-career-guidance-960.avif": 9,
      "qa/policy.json": 6,
    });
    try {
      await expect(assertAssetBudget(directory)).rejects.toThrow(/javascript/u);
      await expect(
        assertAssetBudget(directory, undefined, "/concursos_cyl/"),
      ).resolves.toBeDefined();
      await writeFile(
        join(directory, "assets/app.js"),
        Buffer.alloc(ASSET_BUDGET.javascriptBytes + 101),
      );
      await expect(
        assertAssetBudget(directory, undefined, "/concursos_cyl/"),
      ).rejects.toThrow(/javascript/u);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("fails loudly when the editorial distribution is missing from the build", async () => {
    const directory = await createAssetDirectory({
      "assets/app.js": 12,
    });

    try {
      await expect(assertAssetBudget(directory)).rejects.toThrow(/images/u);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });
});
