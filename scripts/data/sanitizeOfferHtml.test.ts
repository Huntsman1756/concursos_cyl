import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { sanitizeOfferHtml } from "./sanitizeOfferHtml";

describe("sanitizeOfferHtml", () => {
  it("removes scripts while preserving requirement list text", () => {
    const result = sanitizeOfferHtml(
      "<script>alert(1)</script><strong>Requisitos:</strong><ul><li>Carné B</li></ul>",
    );

    expect(result.plainText).toContain("Requisitos: Carné B");
    expect(result.plainText).not.toContain("alert");
    expect(result.sections.requirements).toEqual(["Carné B"]);
  });

  it("assigns normalized source-order blocks to the fixed section contract", () => {
    const html = readFileSync(
      resolve(process.cwd(), "tests/fixtures/offer-description.html"),
      "utf8",
    );

    expect(sanitizeOfferHtml(html)).toEqual({
      plainText:
        "Oferta de empleo Atención al público en Burgos. Funciones: Informar a las personas usuarias. Gestionar citas. Requisitos: Experiencia de un año. Manejo de ofimática. Condiciones: Contrato indefinido. Jornada completa. Cómo participar: Envíe su CV antes del 30 de septiembre. Información adicional: Incorporación inmediata.",
      sections: {
        summary: ["Oferta de empleo", "Atención al público en Burgos."],
        functions: ["Informar a las personas usuarias.", "Gestionar citas."],
        requirements: ["Experiencia de un año.", "Manejo de ofimática."],
        conditions: ["Contrato indefinido.", "Jornada completa."],
        application: ["Envíe su CV antes del 30 de septiembre."],
        other: ["Incorporación inmediata."],
      },
    });
  });
});
