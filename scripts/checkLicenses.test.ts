import { describe, expect, it } from "vitest";
import { assertAllowedLicenses } from "./checkLicenses";

describe("license policy", () => {
  it("rejects a dependency license outside the allowlist", () => {
    expect(() =>
      assertAllowedLicenses([
        { name: "bad-package", version: "1.0.0", license: "BUSL-1.1" },
      ]),
    ).toThrow(/bad-package.*BUSL-1.1/i);
  });

  it("accepts compatible dual expressions", () => {
    expect(() =>
      assertAllowedLicenses([
        { name: "good-package", license: "MIT OR Apache-2.0" },
      ]),
    ).not.toThrow();
  });
});
