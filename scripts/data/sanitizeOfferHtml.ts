import sanitizeHtml from "sanitize-html";

import type { DescriptionSections } from "../../data/schemas/generated";

export interface SanitizedOfferDescription {
  plainText: string;
  sections: DescriptionSections;
}

type DescriptionSection = keyof DescriptionSections;

const STRUCTURAL_TAG = /<\/?(?:h[1-6]|p|div|li|ul|ol|br)\b[^>]*>/gi;

function emptySections(): DescriptionSections {
  return {
    summary: [],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  };
}

function normalizeText(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[.:;]+$/u, "")
    .trim();
}

function sectionForHeading(value: string): DescriptionSection | undefined {
  const heading = normalizedHeading(value);

  if (/^(funciones|tareas|responsabilidades|cometidos?)$/u.test(heading)) {
    return "functions";
  }
  if (/^(requisitos|perfil|conocimientos?|titulacion)$/u.test(heading)) {
    return "requirements";
  }
  if (
    /^(condiciones|contrato|jornada|horario|salario|remuneracion)$/u.test(
      heading,
    )
  ) {
    return "conditions";
  }
  if (
    /^(como participar|inscripcion|solicitud|presentacion|contacto)$/u.test(
      heading,
    )
  ) {
    return "application";
  }
  if (/^(oferta|descripcion|resumen|puesto)$/u.test(heading)) {
    return "summary";
  }

  return undefined;
}

function looksLikeHeading(value: string): boolean {
  return value.length <= 80 && /[:：]$/u.test(value);
}

/**
 * Removes executable markup and exposes source-ordered text in the fixed offer
 * description section contract.
 */
export function sanitizeOfferHtml(html: string): SanitizedOfferDescription {
  const safeHtml = sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "div",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "br",
    ],
    allowedAttributes: {},
    nonTextTags: ["script", "style", "textarea", "option"],
  });
  const blocks = safeHtml
    .replace(STRUCTURAL_TAG, "\n")
    .split("\n")
    .map(normalizeText)
    .filter((block) => block.length > 0);
  const sections = emptySections();
  let currentSection: DescriptionSection = "summary";

  for (const block of blocks) {
    const section = sectionForHeading(block);
    if (section !== undefined) {
      currentSection = section;
      if (section === "summary") {
        sections.summary.push(block);
      }
      continue;
    }

    if (looksLikeHeading(block)) {
      currentSection = "other";
      continue;
    }

    sections[currentSection].push(block);
  }

  return {
    plainText: blocks.join(" "),
    sections,
  };
}

export type { DescriptionSections };
