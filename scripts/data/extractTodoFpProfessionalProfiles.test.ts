import { describe, expect, it } from "vitest";

import {
  buildProfessionalProfiles,
  discoverLinks,
  extractOfficialOutputs,
  htmlText,
  normalizeProgramTitle,
  type TrainingProgramInput,
} from "./extractTodoFpProfessionalProfiles";

const program: TrainingProgramInput = {
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
  level: "higher",
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones WEB",
};

const pageHtml = `<!doctype html><html><body>
  <h1>Técnico Superior en Desarrollo de Aplicaciones Web</h1>
  <h2>Salidas profesionales</h2>
  <p>Trabajar como:</p>
  <ul>
    <li>Programador web.</li>
    <li>Desarrollador de aplicaciones en entornos Web.</li>
  </ul>
  <h2>Seguir estudiando</h2><ul><li>Un grado universitario.</li></ul>
</body></html>`;

describe("TodoFP professional profile extraction", () => {
  it("decodes literal source text without carrying markup", () => {
    expect(
      htmlText(
        "<strong>Técnico &amp; programador</strong>&nbsp;de digitalizaci&oacute;n",
      ),
    ).toBe("Técnico & programador de digitalización");
  });

  it("normalizes official prefixes and delivery qualifiers", () => {
    expect(
      normalizeProgramTitle(
        "Técnico Superior en Desarrollo de Aplicaciones Web",
      ),
    ).toBe("desarrollo de aplicaciones web");
    expect(
      normalizeProgramTitle("Desarrollo de Aplicaciones WEB (distancia)"),
    ).toBe("desarrollo de aplicaciones web");
    expect(
      normalizeProgramTitle(
        "Curso de Especialización en Inteligencia Artificial y Big Data (Acceso GS)",
      ),
    ).toBe("inteligencia artificial y big data");
    expect(
      normalizeProgramTitle(
        "Modelado de la información de la construcción (BIM)",
      ),
    ).toBe("modelado de la informacion de la construccion bim");
  });

  it("discovers only internal TodoFP family and program links", () => {
    const links = discoverLinks(`
      <a href="/que-estudiar/familias-profesionales/informatica-comunicaciones.html">IFC</a>
      <a href="/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html">DAW</a>
      <a href="https://example.com/que-estudiar/familias-profesionales/x/y.html">external</a>
    `);
    expect(links.familyUrls).toEqual([
      "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones.html",
    ]);
    expect(links.programUrls).toEqual([
      "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
    ]);
  });

  it("extracts only literal list items from the professional section", () => {
    expect(extractOfficialOutputs(pageHtml)).toEqual({
      officialTitle: "Técnico Superior en Desarrollo de Aplicaciones Web",
      outputs: [
        "Programador web.",
        "Desarrollador de aplicaciones en entornos Web.",
      ],
    });
  });

  it("does not treat later study options as professional outputs", () => {
    expect(extractOfficialOutputs(pageHtml).outputs).not.toContain(
      "Un grado universitario.",
    );
  });

  it("returns no outputs when TodoFP does not publish Trabajar como", () => {
    expect(
      extractOfficialOutputs(
        "<h1>Título Profesional Básico en Informática</h1><h2>Salidas profesionales</h2><ul><li>Módulo formativo</li></ul>",
      ).outputs,
    ).toEqual([]);
  });

  it("accepts the literal TodoFP heading Trabajar", () => {
    expect(
      extractOfficialOutputs(pageHtml.replace("Trabajar como:", "Trabajar:")),
    ).toMatchObject({
      outputs: [
        "Programador web.",
        "Desarrollador de aplicaciones en entornos Web.",
      ],
    });
  });

  it("reuses one official profile for every matching delivery mode", () => {
    const distance = {
      ...program,
      programKey: "IFC03Sd",
      programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
    };
    const result = buildProfessionalProfiles(
      [program, distance],
      [
        {
          url: "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
          html: pageHtml,
        },
      ],
    );
    expect(result.coveredProgramKeys).toEqual(["IFC03S", "IFC03Sd"]);
    expect(result.profiles).toHaveLength(4);
    expect(
      new Set(result.profiles.map(({ sourceQuote }) => sourceQuote)),
    ).toEqual(
      new Set([
        "Programador web.",
        "Desarrollador de aplicaciones en entornos Web.",
      ]),
    );
  });

  it("supports the official catalog's uppercase distance suffix", () => {
    const distance = {
      ...program,
      programKey: "IFC03SD",
      programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
    };
    const result = buildProfessionalProfiles(
      [program, distance],
      [
        {
          url: "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
          html: pageHtml,
        },
      ],
    );
    expect(result.unresolvedProgramKeys).toEqual([]);
    expect(result.coveredProgramKeys).toEqual(["IFC03S", "IFC03SD"]);
  });

  it("reports unmatched pages and programs without fabricating a relation", () => {
    const result = buildProfessionalProfiles(
      [program],
      [
        {
          url: "https://www.todofp.es/que-estudiar/familias-profesionales/agraria/forestal.html",
          html: pageHtml.replaceAll(
            "Desarrollo de Aplicaciones Web",
            "Gestión Forestal",
          ),
        },
      ],
    );
    expect(result.profiles).toEqual([]);
    expect(result.unresolvedProgramKeys).toEqual(["IFC03S"]);
    expect(result.unmatchedOfficialPages[0]?.title).toBe(
      "Técnico Superior en Gestión Forestal",
    );
  });
});
