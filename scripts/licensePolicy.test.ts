import { describe, expect, it } from "vitest";

import { evaluateDependencyLicenses } from "./licensePolicy";

describe("dependency license policy", () => {
  it("accepts approved software licenses and reviewed open-content exceptions", () => {
    expect(
      evaluateDependencyLicenses([
        { name: "react", license: "MIT" },
        { name: "typescript", license: "Apache-2.0" },
        { name: "axe-core", license: "MPL-2.0" },
        { name: "caniuse-lite", license: "CC-BY-4.0" },
        { name: "mdn-data", license: "CC0-1.0" },
        { name: "lru-cache", license: "BlueOak-1.0.0" },
        { name: "minimatch", license: "BlueOak-1.0.0" },
      ]),
    ).toEqual([]);
  });

  it("rejects proprietary, missing, and unreviewed exception licenses", () => {
    expect(
      evaluateDependencyLicenses([
        { name: "closed-package", license: "Proprietary" },
        { name: "missing-license", license: null },
        { name: "unreviewed-content", license: "CC-BY-4.0" },
        { name: "unreviewed-blueoak", license: "BlueOak-1.0.0" },
      ]),
    ).toEqual([
      "closed-package: unsupported license Proprietary",
      "missing-license: missing license metadata",
      "unreviewed-content: CC-BY-4.0 is allowed only for caniuse-lite",
      "unreviewed-blueoak: unreviewed BlueOak-1.0.0 package",
    ]);
  });
});
