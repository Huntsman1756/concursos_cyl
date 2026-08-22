import { loadPublicationConfig } from "./releaseIdentity.ts";
import { normalizePublicBasePath } from "./publicBasePath.ts";

const PUBLICATION_METADATA_MARKER = "<!-- salida-publication-metadata -->";
const PUBLICATION_TITLE = "SALIDA CyL" as const;
const PUBLICATION_DESCRIPTION =
  "Explora relaciones revisadas entre formación profesional y ocupaciones en Castilla y León con datos abiertos.";
const PUBLICATION_THEME_COLOR = "#7f1734" as const;

export interface PublicationMetadata {
  canonicalUrl: string;
  title: "SALIDA CyL";
  description: string;
  socialImageUrl: string;
  faviconUrl: string;
  themeColor: "#7f1734";
}

export function publicationMetadata(
  rootDir: string,
  publicBasePath = process.env.VITE_PUBLIC_BASE_PATH,
): PublicationMetadata {
  const publication = loadPublicationConfig(rootDir);
  const normalizedPublicBasePath = normalizePublicBasePath(publicBasePath);

  return {
    canonicalUrl: publication.canonicalRootUrl,
    title: PUBLICATION_TITLE,
    description: PUBLICATION_DESCRIPTION,
    socialImageUrl: new URL(
      "salida-cyl-social.png",
      publication.canonicalRootUrl,
    ).toString(),
    faviconUrl: `${normalizedPublicBasePath}salida-cyl-icon.png`,
    themeColor: PUBLICATION_THEME_COLOR,
  };
}

function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function publicationHead(metadata: PublicationMetadata): string {
  const title = escapeAttribute(metadata.title);
  const description = escapeAttribute(metadata.description);
  const canonicalUrl = escapeAttribute(metadata.canonicalUrl);
  const socialImageUrl = escapeAttribute(metadata.socialImageUrl);
  const faviconUrl = escapeAttribute(metadata.faviconUrl);
  const themeColor = escapeAttribute(metadata.themeColor);

  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    `<meta property="og:image" content="${socialImageUrl}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${socialImageUrl}">`,
    `<link rel="icon" type="image/png" href="${faviconUrl}">`,
    `<meta name="theme-color" content="${themeColor}">`,
  ].join("\n    ");
}

export function renderPublicationHead(
  html: string,
  metadata: PublicationMetadata,
): string {
  const markerCount = html.split(PUBLICATION_METADATA_MARKER).length - 1;
  if (markerCount !== 1) {
    throw new Error(
      `Publication metadata requires exactly one marker; found ${markerCount}.`,
    );
  }

  return html.replace(PUBLICATION_METADATA_MARKER, () =>
    publicationHead(metadata),
  );
}
