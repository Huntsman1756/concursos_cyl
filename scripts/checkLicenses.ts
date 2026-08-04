import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  evaluateDependencyLicenses,
  type DependencyLicense,
} from "./licensePolicy";

interface LockPackage {
  name?: unknown;
  license?: unknown;
}

interface PackageLock {
  packages?: Record<string, LockPackage>;
}

function packageNameFromLockPath(path: string, metadata: LockPackage): string {
  if (path.length === 0) {
    return typeof metadata.name === "string" ? metadata.name : "(project)";
  }
  const name = path.split("node_modules/").at(-1);
  if (name === undefined || name.length === 0) {
    throw new Error(`Cannot derive package name from lock path: ${path}.`);
  }
  return name;
}

function dependencyLicenses(lock: PackageLock): DependencyLicense[] {
  if (lock.packages === undefined) {
    throw new Error("package-lock.json does not expose a packages table.");
  }

  return Object.entries(lock.packages)
    .map(([path, metadata]) => ({
      name: packageNameFromLockPath(path, metadata),
      license: typeof metadata.license === "string" ? metadata.license : null,
    }))
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        String(left.license).localeCompare(String(right.license)),
    );
}

export async function checkDependencyLicenses(
  rootDirectory = process.cwd(),
): Promise<void> {
  const lock = JSON.parse(
    await readFile(resolve(rootDirectory, "package-lock.json"), "utf8"),
  ) as PackageLock;
  const dependencies = dependencyLicenses(lock);
  const violations = evaluateDependencyLicenses(dependencies);
  if (violations.length > 0) {
    throw new Error(
      `Dependency license policy failed:\n${violations
        .map((violation) => `- ${violation}`)
        .join("\n")}`,
    );
  }
  console.info(
    `Dependency license policy passed for ${dependencies.length} locked package entries.`,
  );
}

const invokedPath = process.argv[1];
if (
  invokedPath !== undefined &&
  pathToFileURL(resolve(invokedPath)).href === import.meta.url
) {
  await checkDependencyLicenses();
}
