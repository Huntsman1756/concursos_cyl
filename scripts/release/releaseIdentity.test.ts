import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadPublicationConfig,
  parseDeploymentEnvelopeIdentity,
  parsePublicationConfig,
  parseReleaseIdentity,
  type ReleaseIdentity,
} from "./releaseIdentity";

const ROOT = resolve(process.cwd());

function validIdentity(
  overrides: Partial<ReleaseIdentity> = {},
): ReleaseIdentity {
  return {
    schemaVersion: "1.0.0",
    releaseId: "release-1",
    sourceCommitSha: "a".repeat(40),
    snapshotId: "20260822085631889-7bbe69380f6d",
    manifestSha256: "b".repeat(64),
    artifactSha256: "c".repeat(64),
    ...overrides,
  };
}

describe("publication configuration", () => {
  it("loads the only production publication URLs", () => {
    expect(loadPublicationConfig(ROOT)).toEqual({
      schemaVersion: "1.0.0",
      canonicalRootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
      fallbackRootUrl: "https://huntsman1756.github.io/concursos_cyl/",
    });
  });

  it.each([
    ["canonicalRootUrl", "http://salida-cyl.example/"],
    ["canonicalRootUrl", "https://user:password@salida-cyl.example/"],
    ["canonicalRootUrl", " https://salida-cyl.157-90-22-40.sslip.io/ "],
    [
      "fallbackRootUrl",
      "https://huntsman1756.github.io/concursos_cyl/?source=qa",
    ],
    ["fallbackRootUrl", "https://huntsman1756.github.io/concursos_cyl/#qa"],
    ["fallbackRootUrl", "not-a-url"],
  ])(
    "rejects invalid publication URL in %s to keep publication fail-closed",
    (key, value) => {
      expect(() =>
        parsePublicationConfig({
          schemaVersion: "1.0.0",
          canonicalRootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
          fallbackRootUrl: "https://huntsman1756.github.io/concursos_cyl/",
          [key]: value,
        }),
      ).toThrow(/HTTPS URL without credentials, query, or fragment/u);
    },
  );

  it("rejects extra publication config keys to preserve the exact envelope shape", () => {
    expect(() =>
      parsePublicationConfig({
        schemaVersion: "1.0.0",
        canonicalRootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
        fallbackRootUrl: "https://huntsman1756.github.io/concursos_cyl/",
        deployment: "pages",
      }),
    ).toThrow(/exact keys/u);
  });
});

describe("release identity", () => {
  it.each(["../release", "release/one", " release-1", "release-1 "])(
    "rejects unsafe releaseId %s",
    (releaseId) => {
      expect(() => parseReleaseIdentity(validIdentity({ releaseId }))).toThrow(
        /releaseId/u,
      );
    },
  );

  it("accepts a release identity with exact keys", () => {
    expect(parseReleaseIdentity(validIdentity())).toEqual(validIdentity());
  });

  it("rejects unknown release identity keys", () => {
    expect(() =>
      parseReleaseIdentity({ ...validIdentity(), extra: true }),
    ).toThrow(/exact keys|unexpected|extra/u);
  });

  it("rejects malformed commit and artifact digests", () => {
    expect(() =>
      parseReleaseIdentity(validIdentity({ sourceCommitSha: "a".repeat(39) })),
    ).toThrow(/sourceCommitSha/u);
    expect(() =>
      parseReleaseIdentity(
        validIdentity({ manifestSha256: `${"b".repeat(63)}g` }),
      ),
    ).toThrow(/manifestSha256/u);
  });

  it("requires a deployment-specific envelope digest", () => {
    expect(
      parseDeploymentEnvelopeIdentity({
        ...validIdentity(),
        deployment: "pages",
        envelopeSha256: "b".repeat(64),
      }),
    ).toMatchObject({ deployment: "pages" });
  });

  it("rejects an envelope without its deployment digest", () => {
    expect(() =>
      parseDeploymentEnvelopeIdentity({
        ...validIdentity(),
        deployment: "vps",
      }),
    ).toThrow(/envelopeSha256/u);
  });

  it.each(["github-pages", "PAGES", ""])(
    "rejects invalid deployment %s instead of permitting an unknown target",
    (deployment) => {
      expect(() =>
        parseDeploymentEnvelopeIdentity({
          ...validIdentity(),
          deployment,
          envelopeSha256: "b".repeat(64),
        }),
      ).toThrow(/deployment must be "pages" or "vps"/u);
    },
  );

  it.each([
    "",
    "b".repeat(63),
    `${"b".repeat(63)}g`,
    "B".repeat(64),
    "b".repeat(65),
  ])(
    "rejects malformed envelopeSha256 %s rather than accepting an invalid digest",
    (envelopeSha256) => {
      expect(() =>
        parseDeploymentEnvelopeIdentity({
          ...validIdentity(),
          deployment: "pages",
          envelopeSha256,
        }),
      ).toThrow(/envelopeSha256.*64-hexadecimal digest/u);
    },
  );
});
