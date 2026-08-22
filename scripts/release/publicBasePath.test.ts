import { describe, expect, it } from "vitest";
import { normalizePublicBasePath, readRuntimeBasePath } from "./publicBasePath";

function documentWithBasePath(content?: string): Document {
  const meta = content === undefined ? null : { content };
  return {
    querySelector: (selector: string) => {
      if (selector !== 'meta[name="salida-public-base-path"]') {
        throw new Error(`Unexpected runtime base path selector: ${selector}`);
      }
      return meta;
    },
  } as unknown as Document;
}

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

describe("readRuntimeBasePath", () => {
  it.each(["/", "/concursos_cyl/"])(
    "reads the strict runtime base path %s",
    (value) => {
      expect(readRuntimeBasePath(documentWithBasePath(` ${value} `))).toBe(
        value,
      );
    },
  );

  it.each([undefined, "", "/concursos_cyl", "/other/"])(
    "rejects missing or invalid runtime base metadata %s",
    (value) => {
      expect(() => readRuntimeBasePath(documentWithBasePath(value))).toThrow(
        /Missing or invalid SALIDA public base path metadata/u,
      );
    },
  );
});
