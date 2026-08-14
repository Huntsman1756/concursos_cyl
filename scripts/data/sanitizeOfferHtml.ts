import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
];

export type OfferDescriptionSection =
  | "summary"
  | "functions"
  | "requirements"
  | "conditions"
  | "application"
  | "other";

export interface SanitizedOfferDescription {
  plainText: string;
  sections: Record<OfferDescriptionSection, string[]>;
}

function emptySections(): Record<OfferDescriptionSection, string[]> {
  return {
    summary: [],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  };
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function textFromMarkup(markup: string): string {
  return decodeEntities(markup.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function sectionForHeading(text: string): OfferDescriptionSection | null {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("requisit")) return "requirements";
  if (normalized.includes("titulacion") || normalized.includes("permiso")) {
    return "requirements";
  }
  if (normalized.includes("plazo") || normalized.includes("solicitud")) {
    return "application";
  }
  if (
    normalized.includes("observacion") ||
    normalized.includes("informacion") ||
    normalized.includes("enlaces")
  ) {
    return "other";
  }
  if (normalized.includes("funcion")) return "functions";
  if (normalized.includes("condicion")) return "conditions";
  if (normalized.includes("solicitud") || normalized.includes("inscripcion")) {
    return "application";
  }
  if (normalized.includes("resumen") || normalized.includes("puesto")) {
    return "summary";
  }
  return null;
}

function textFragmentsFromMarkup(markup: string): string[] {
  const rawText = decodeEntities(markup.replace(/<[^>]*>/g, " "))
    .replace(/\r?\n/g, " ")
    .replace(
      /(?=(?:funciones|condiciones|requisitos|titulacion|titulación|permisos? de conducir|plazo|solicitud)\s*:)/gi,
      "\n",
    );
  return rawText
    .split(/\n+/)
    .map((fragment) => fragment.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function sanitizeOfferHtml(html: string): SanitizedOfferDescription {
  const safeHtml = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
  const sections = emptySections();
  const blocks =
    safeHtml.match(
      /<(h[1-4]|p|li|strong|em)\b[^>]*>[\s\S]*?<\/\1>|<br\s*\/?\s*>/gi,
    ) ?? [];
  let currentSection: OfferDescriptionSection = "other";
  const plainBlocks: string[] = [];

  for (const block of blocks) {
    for (const text of textFragmentsFromMarkup(block)) {
      const headingSection = sectionForHeading(text.replace(/:$/, ""));
      if (headingSection) {
        currentSection = headingSection;
      }
      if (!/^<br/i.test(block)) {
        sections[currentSection].push(text);
        plainBlocks.push(text);
      }
    }
  }

  if (plainBlocks.length === 0) {
    const fallbackText = textFromMarkup(safeHtml);
    if (fallbackText) {
      sections.other.push(fallbackText);
      plainBlocks.push(fallbackText);
    }
  }

  return {
    plainText: plainBlocks.join(" ").replace(/\s+/g, " ").trim(),
    sections,
  };
}
