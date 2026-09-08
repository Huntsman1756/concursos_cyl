#!/usr/bin/env node
/**
 * Editorial image pipeline for SALIDA CyL.
 *
 * Converts the source editorial PNGs declared in editorial-assets.config.json
 * into responsive AVIF/WebP variants under public/images/editorial/, and
 * enforces the per-asset byte budget. Requires ImageMagick 7 (`magick`) on
 * PATH. Run once per asset change; outputs are committed, not build-time.
 *
 * Usage: node scripts/assets/generate-editorial-images.mjs [--check]
 *   --check  Verify existing outputs against the config and byte budgets
 *            without re-encoding (used by QA).
 */
import { spawnSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "editorial-assets.config.json",
);
const CHECK_ONLY = process.argv.includes("--check");

const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputDirectory = isAbsolute(config.outputDirectory)
  ? config.outputDirectory
  : join(repoRoot, config.outputDirectory);
if (!CHECK_ONLY) {
  await mkdir(outputDirectory, { recursive: true });
}

function runMagick(args) {
  const result = spawnSync("magick", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `magick ${args.join(" ")} failed (${result.status}): ${result.stderr.trim()}`,
    );
  }
}

function magickIdentify(path) {
  const result = spawnSync("magick", ["identify", "-format", "%w %h", path], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`identify failed for ${path}: ${result.stderr.trim()}`);
  }
  const [width, height] = result.stdout.trim().split(/\s+/).map(Number);
  return { width, height };
}

async function fileSize(path) {
  return (await stat(path)).size;
}

const inventory = [];
let budgetViolations = [];

for (const asset of config.assets) {
  const sourcePath = join(repoRoot, config.sourceDirectory, asset.source);
  const source = magickIdentify(sourcePath);
  if (
    source.width !== asset.native.width ||
    source.height !== asset.native.height
  ) {
    throw new Error(
      `${asset.slug}: source is ${source.width}x${source.height}, config declares ${asset.native.width}x${asset.native.height}.`,
    );
  }
  if (Math.max(...asset.widths) > source.width) {
    throw new Error(
      `${asset.slug}: requested width exceeds source width ${source.width}; upscaling is not allowed.`,
    );
  }

  for (const width of asset.widths) {
    for (const [format, settings] of Object.entries(config.formats)) {
      const outputName = `${asset.slug}-${width}.${format}`;
      const outputPath = join(outputDirectory, outputName);

      if (!CHECK_ONLY) {
        runMagick([
          sourcePath,
          "-strip",
          "-colorspace",
          "sRGB",
          "-resize",
          `${width}x`,
          "-quality",
          String(settings.quality),
          ...Object.entries(settings.defines).flatMap(([key, value]) => [
            "-define",
            `${key}=${value}`,
          ]),
          outputPath,
        ]);
      }

      const bytes = await fileSize(outputPath);
      const dimensions = magickIdentify(outputPath);
      inventory.push({
        name: outputName,
        slug: asset.slug,
        format,
        width: dimensions.width,
        height: dimensions.height,
        bytes,
      });
    }
  }

  const principal = inventory
    .filter(
      (entry) =>
        entry.slug === asset.slug && entry.width === Math.max(...asset.widths),
    )
    .sort((a, b) => b.bytes - a.bytes);
  for (const entry of principal) {
    if (entry.bytes > asset.maxBytes) {
      budgetViolations.push(
        `${entry.name}: ${entry.bytes} bytes exceeds ${asset.maxBytes}.`,
      );
    }
  }
}

const reportPath = resolve(
  dirname(CONFIG_PATH),
  "editorial-images.inventory.json",
);
await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      generatedFrom: relative(repoRoot, CONFIG_PATH),
      outputDirectory: relative(repoRoot, outputDirectory),
      totalBytes: inventory.reduce((total, entry) => total + entry.bytes, 0),
      files: inventory.sort((a, b) => a.name.localeCompare(b.name)),
    },
    null,
    2,
  )}\n`,
);

const originalBytes = await Promise.all(
  config.assets.map((asset) =>
    fileSize(join(repoRoot, config.sourceDirectory, asset.source)),
  ),
);
const totalOriginal = originalBytes.reduce((total, bytes) => total + bytes, 0);
const totalRuntime = inventory.reduce((total, entry) => total + entry.bytes, 0);

for (const entry of inventory.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(
    `${entry.name.padEnd(48)} ${entry.width}x${entry.height}  ${entry.bytes} bytes`,
  );
}
console.log(
  `Original sources: ${totalOriginal} bytes. Runtime variants: ${inventory.length} files, ${totalRuntime} bytes (ratio ${(totalOriginal / totalRuntime).toFixed(1)}x).`,
);

if (budgetViolations.length > 0) {
  console.error(`Byte budget violations:\n${budgetViolations.join("\n")}`);
  process.exitCode = 1;
}
