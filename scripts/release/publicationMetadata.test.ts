import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  publicationMetadata,
  renderPublicationHead,
  type PublicationMetadata,
} from "./publicationMetadata";

const CANONICAL_URL = "https://salida-cyl.157-90-22-40.sslip.io/";
const FALLBACK_URL = "https://huntsman1756.github.io/concursos_cyl/";
const FIXTURE_CANONICAL_URL = "https://fixture.example.test/publication/";
const DESCRIPTION =
  "Explora relaciones revisadas entre formación profesional y ocupaciones en Castilla y León con datos abiertos.";

interface PublicationFixtureOptions {
  canonicalRootUrl?: string;
  fallbackRootUrl?: string;
}

async function withPublicationFixture<T>(
  callback: (rootDir: string) => Promise<T>,
  options: PublicationFixtureOptions = {},
): Promise<T> {
  const rootDir = await mkdtemp(join(tmpdir(), "salida-cyl-publication-"));
  try {
    await mkdir(join(rootDir, "config"), { recursive: true });
    await writeFile(
      join(rootDir, "config", "publication.json"),
      `${JSON.stringify({
        schemaVersion: "1.0.0",
        canonicalRootUrl: options.canonicalRootUrl ?? FIXTURE_CANONICAL_URL,
        fallbackRootUrl: options.fallbackRootUrl ?? FALLBACK_URL,
      })}\n`,
      "utf8",
    );
    return await callback(rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function metadataFixture(
  overrides: Partial<PublicationMetadata> = {},
): PublicationMetadata {
  return {
    canonicalUrl: CANONICAL_URL,
    title: "SALIDA CyL",
    description: DESCRIPTION,
    socialImageUrl: `${CANONICAL_URL}salida-cyl-social.png`,
    faviconUrl: "/salida-cyl-icon.png",
    themeColor: "#7f1734",
    ...overrides,
  };
}

describe("publication metadata", () => {
  it("derives canonical and social URLs from a non-production fixture config", async () => {
    await withPublicationFixture(async (rootDir) => {
      expect(publicationMetadata(rootDir)).toEqual({
        canonicalUrl: FIXTURE_CANONICAL_URL,
        title: "SALIDA CyL",
        description: DESCRIPTION,
        socialImageUrl: `${FIXTURE_CANONICAL_URL}salida-cyl-social.png`,
        faviconUrl: "/salida-cyl-icon.png",
        themeColor: "#7f1734",
      });
    });
  });

  it("keeps the favicon inside the configured Pages base path", async () => {
    await withPublicationFixture(async (rootDir) => {
      expect(publicationMetadata(rootDir, "/concursos_cyl/").faviconUrl).toBe(
        "/concursos_cyl/salida-cyl-icon.png",
      );
    });
  });

  it("renders one escaped declaration for every owned head field", () => {
    const result = renderPublicationHead(
      "<!doctype html><html><head>\n<!-- salida-publication-metadata -->\n</head><body></body></html>",
      metadataFixture(),
    );

    expect(result).toContain("<title>SALIDA CyL</title>");
    expect(result).toContain(
      `<meta name="description" content="${DESCRIPTION}">`,
    );
    expect(result).toContain(`<link rel="canonical" href="${CANONICAL_URL}">`);
    expect(result).toContain(
      `<meta property="og:image" content="${CANONICAL_URL}salida-cyl-social.png">`,
    );
    expect(result).toContain(
      `<meta name="twitter:card" content="summary_large_image">`,
    );
    expect(result).toContain(
      `<link rel="icon" type="image/png" href="/salida-cyl-icon.png">`,
    );
    expect(result).toContain(`<meta name="theme-color" content="#7f1734">`);

    const ownedFields = [
      "<title>",
      '<meta name="description"',
      '<link rel="canonical"',
      '<meta property="og:title"',
      '<meta property="og:description"',
      '<meta property="og:type"',
      '<meta property="og:url"',
      '<meta property="og:image"',
      '<meta name="twitter:card"',
      '<meta name="twitter:title"',
      '<meta name="twitter:description"',
      '<meta name="twitter:image"',
      '<link rel="icon"',
      '<meta name="theme-color"',
    ];

    for (const field of ownedFields) {
      expect(countOccurrences(result, field), field).toBe(1);
    }
    expect(countOccurrences(result, "salida-publication-metadata")).toBe(0);
  });

  it("escapes metadata attribute and title text", () => {
    const result = renderPublicationHead(
      "<head><!-- salida-publication-metadata --></head>",
      metadataFixture({
        description: `Descripción & <tag> "comillas" y 'apóstrofe'`,
        canonicalUrl: "https://example.test/?q=one&v=two",
        socialImageUrl: "https://example.test/social.png?a=one&v=two",
      }),
    );

    expect(result).toContain(
      '<meta name="description" content="Descripción &amp; &lt;tag&gt; &quot;comillas&quot; y &#39;apóstrofe&#39;">',
    );
    expect(result).toContain(
      '<link rel="canonical" href="https://example.test/?q=one&amp;v=two">',
    );
    expect(result).toContain(
      '<meta property="og:image" content="https://example.test/social.png?a=one&amp;v=two">',
    );
    expect(result).toContain(
      '<meta property="og:description" content="Descripción &amp; &lt;tag&gt; &quot;comillas&quot; y &#39;apóstrofe&#39;">',
    );
    expect(result).toContain(
      '<meta name="twitter:description" content="Descripción &amp; &lt;tag&gt; &quot;comillas&quot; y &#39;apóstrofe&#39;">',
    );
    expect(result).toContain(
      '<meta name="twitter:image" content="https://example.test/social.png?a=one&amp;v=two">',
    );
  });

  it("keeps the configured VPS URL for a fallback-shaped build", async () => {
    await withPublicationFixture(
      async (rootDir) => {
        const metadata = publicationMetadata(rootDir);
        const pagesShapedHtml =
          "<html><head><!-- salida-publication-metadata --></head></html>";
        const result = renderPublicationHead(pagesShapedHtml, metadata);

        expect(result).toContain(
          `<link rel="canonical" href="${CANONICAL_URL}">`,
        );
        expect(result).toContain(
          `<meta property="og:image" content="${CANONICAL_URL}salida-cyl-social.png">`,
        );
        expect(result).not.toContain(FALLBACK_URL);
      },
      { canonicalRootUrl: CANONICAL_URL },
    );
  });

  it("does not interpret replacement tokens in escaped metadata", () => {
    const specialDescription = "Token $& and $` and $'";
    const result = renderPublicationHead(
      "<head><!-- salida-publication-metadata --></head>",
      metadataFixture({ description: specialDescription }),
    );

    const escapedDescription = "Token $&amp; and $` and $&#39;";
    expect(result).toContain(
      `<meta name="description" content="${escapedDescription}">`,
    );
    expect(result).toContain(
      `<meta property="og:description" content="${escapedDescription}">`,
    );
    expect(result).toContain(
      `<meta name="twitter:description" content="${escapedDescription}">`,
    );
    expect(countOccurrences(result, "<head>")).toBe(1);
    expect(countOccurrences(result, "</head>")).toBe(1);
  });

  it("exposes one Vite transform plugin for the source marker", async () => {
    const sourceIndex = await readFile(
      join(process.cwd(), "index.html"),
      "utf8",
    );
    expect(
      countOccurrences(sourceIndex, "<!-- salida-publication-metadata -->"),
    ).toBe(1);

    const { default: viteConfig } = await import("../../vite.config");
    const metadataPlugin = viteConfig.plugins?.find(
      (plugin) =>
        typeof plugin === "object" &&
        plugin !== null &&
        "transformIndexHtml" in plugin &&
        "name" in plugin &&
        plugin.name === "salida-publication-metadata",
    );
    expect(metadataPlugin).toBeDefined();

    const transformIndexHtml = (
      metadataPlugin as
        | { transformIndexHtml?: (html: string) => string | Promise<string> }
        | undefined
    )?.transformIndexHtml;
    expect(transformIndexHtml).toEqual(expect.any(Function));
    if (typeof transformIndexHtml !== "function") {
      throw new Error("Vite metadata transform hook is missing.");
    }

    const transformed = await transformIndexHtml(sourceIndex);
    expect(transformed).not.toContain("<!-- salida-publication-metadata -->");
    expect(transformed).toContain(
      `<link rel="canonical" href="${CANONICAL_URL}">`,
    );
    expect(transformed).toContain(
      `<meta property="og:image" content="${CANONICAL_URL}salida-cyl-social.png">`,
    );
    for (const declaration of [
      "<title>SALIDA CyL</title>",
      `<meta name="description" content="${DESCRIPTION}">`,
      `<link rel="canonical" href="${CANONICAL_URL}">`,
      `<meta property="og:title" content="SALIDA CyL">`,
      `<meta property="og:description" content="${DESCRIPTION}">`,
      '<meta property="og:type" content="website">',
      `<meta property="og:url" content="${CANONICAL_URL}">`,
      `<meta property="og:image" content="${CANONICAL_URL}salida-cyl-social.png">`,
      '<meta name="twitter:card" content="summary_large_image">',
      '<meta name="twitter:title" content="SALIDA CyL">',
      `<meta name="twitter:description" content="${DESCRIPTION}">`,
      `<meta name="twitter:image" content="${CANONICAL_URL}salida-cyl-social.png">`,
      '<link rel="icon" type="image/png" href="/salida-cyl-icon.png">',
      '<meta name="theme-color" content="#7f1734">',
    ]) {
      expect(transformed).toContain(declaration);
    }
    expect(countOccurrences(transformed, '<meta name="description"')).toBe(1);
    expect(countOccurrences(transformed, '<link rel="canonical"')).toBe(1);
    expect(countOccurrences(transformed, '<meta name="theme-color"')).toBe(1);
  });

  it.each([
    ["missing", "<head></head>", /exactly one.*marker|missing.*marker/iu],
    [
      "duplicate",
      "<head><!-- salida-publication-metadata --><!-- salida-publication-metadata --></head>",
      /exactly one.*marker|duplicate.*marker/iu,
    ],
  ])("fails closed for a %s metadata marker", (_label, html, error) => {
    expect(() => renderPublicationHead(html, metadataFixture())).toThrow(error);
  });
});
