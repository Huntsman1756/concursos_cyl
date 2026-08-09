import { describe, expect, it } from "vitest";
import { normalizePublicBasePath } from "./publicBasePath";

describe("normalizePublicBasePath", () => {
  it.each([
    [undefined, "/"],
    ["/", "/"],
    ["/concursos_cyl", "/concursos_cyl/"],
    ["/concursos_cyl/", "/concursos_cyl/"],
  ])("normalizes %s", (value, expected) => {
    expect(normalizePublicBasePath(value)).toBe(expected);
  });

  it.each([
    "https://example.com/app/",
    "//example.com/app/",
    "app/",
    "/app/../other/",
    "/app?next=/",
    "/app#fragment",
    "/app\\child/",
    "/app/%2e%2e/",
  ])("rejects external or ambiguous base %s", (value) => {
    expect(() => normalizePublicBasePath(value)).toThrow(
      /same-origin absolute path/iu,
    );
  });
});
