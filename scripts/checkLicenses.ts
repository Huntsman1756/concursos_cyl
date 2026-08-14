import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ALLOWED_LICENSES = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "MPL-2.0",
  "0BSD",
  "BlueOak-1.0.0",
  "CC-BY-4.0",
  "CC0-1.0",
  "MIT-0",
  "Unlicense",
]);

export interface LockedPackageLicense {
  name: string;
  version?: string;
  license?: string;
}

function licenseTokens(expression: string): string[] {
  return expression
    .split(/\s+(?:AND|OR)\s+|[()]/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function assertAllowedLicenses(packages: LockedPackageLicense[]): void {
  const failures = packages.flatMap((pkg) => {
    const expression = pkg.license?.trim() ?? "";
    const tokens = licenseTokens(expression);
    return tokens.length > 0 &&
      tokens.every((token) => ALLOWED_LICENSES.has(token))
      ? []
      : [
          `${pkg.name}@${pkg.version ?? "unknown"}: ${expression || "missing license"}`,
        ];
  });
  if (failures.length > 0) {
    throw new Error(
      `Disallowed or missing package licenses:\n${failures.join("\n")}`,
    );
  }
}

export async function readLockedLicenses(
  lockPath = join(process.cwd(), "package-lock.json"),
): Promise<LockedPackageLicense[]> {
  const lock = JSON.parse(await readFile(lockPath, "utf8")) as {
    packages?: Record<
      string,
      { name?: string; version?: string; license?: string }
    >;
  };
  return Object.entries(lock.packages ?? {}).map(([path, pkg]) => ({
    name: pkg.name ?? (path || "root"),
    version: pkg.version,
    license: pkg.license,
  }));
}

if (process.argv[1] && process.argv[1].endsWith("checkLicenses.ts")) {
  assertAllowedLicenses(await readLockedLicenses());
  console.log("License policy passed for the locked dependency graph.");
}
