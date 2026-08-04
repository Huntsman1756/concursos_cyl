export interface DependencyLicense {
  name: string;
  license: string | null;
}

const APPROVED_SOFTWARE_LICENSES = new Set([
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MIT",
  "MIT-0",
  "MPL-2.0",
]);

const REVIEWED_BLUEOAK_PACKAGES = new Set(["lru-cache", "minimatch"]);

/** Returns deterministic policy violations for dependency license metadata. */
export function evaluateDependencyLicenses(
  dependencies: readonly DependencyLicense[],
): string[] {
  const violations: string[] = [];

  for (const dependency of dependencies) {
    if (dependency.license === null || dependency.license.trim().length === 0) {
      violations.push(`${dependency.name}: missing license metadata`);
      continue;
    }
    if (APPROVED_SOFTWARE_LICENSES.has(dependency.license)) {
      continue;
    }
    if (dependency.license === "CC-BY-4.0") {
      if (dependency.name !== "caniuse-lite") {
        violations.push(
          `${dependency.name}: CC-BY-4.0 is allowed only for caniuse-lite`,
        );
      }
      continue;
    }
    if (dependency.license === "CC0-1.0") {
      if (dependency.name !== "mdn-data") {
        violations.push(
          `${dependency.name}: CC0-1.0 is allowed only for mdn-data`,
        );
      }
      continue;
    }
    if (dependency.license === "BlueOak-1.0.0") {
      if (!REVIEWED_BLUEOAK_PACKAGES.has(dependency.name)) {
        violations.push(`${dependency.name}: unreviewed BlueOak-1.0.0 package`);
      }
      continue;
    }
    violations.push(
      `${dependency.name}: unsupported license ${dependency.license}`,
    );
  }

  return violations;
}
