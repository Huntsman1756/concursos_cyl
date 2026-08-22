import { describe, expect, it } from "vitest";

import {
  buildSepeOccupationCatalogue,
  type SepeOccupationMarketCatalogueRecord,
} from "./buildSepeOccupationCatalogue";

function link(code: string, reviewStatus: "approved" | "draft" = "approved") {
  return {
    trainingProgramKey: `PROGRAM-${code}`,
    occupationId: `occupation:cno11:${code}`,
    relationshipType: "official_output" as const,
    reviewStatus,
    sourceUrl: "https://www.boe.es/eli/es/rd/2010/11/26/1591",
    sourceQuote: "Una relación oficial suficientemente descrita.",
    reviewedAt: "2026-08-22",
    mappingVersion: "1.0.0",
  };
}

function occupation(
  code: string,
  label: string,
  status: "approved" | "draft" = "approved",
) {
  return {
    occupationId: `occupation:cno11:${code}`,
    preferredLabel: label,
    confirmationLabel: `Confirmación ${code}`,
    classificationSystem: "CNO-11" as const,
    classificationCode: code,
    reviewStatus: status,
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    reviewedAt: "2026-08-22",
    catalogVersion: "1.0.0",
  };
}

describe("buildSepeOccupationCatalogue", () => {
  it("uses approved relationships, joins labels, deduplicates CNO codes and sorts them", () => {
    const result = buildSepeOccupationCatalogue(
      [link("2721"), link("2252"), link("2721"), link("3812", "draft")],
      [
        occupation("2721", "Diseñadores y administradores de bases de datos"),
        occupation("2252", "Profesores de enseñanza secundaria"),
        occupation("3812", "Técnicos de operaciones"),
      ],
    );

    expect(result).toEqual<SepeOccupationMarketCatalogueRecord[]>([
      {
        classificationCode: "2252",
        preferredLabel: "Profesores de enseñanza secundaria",
        confirmationLabel: "Confirmación 2252",
      },
      {
        classificationCode: "2721",
        preferredLabel: "Diseñadores y administradores de bases de datos",
        confirmationLabel: "Confirmación 2721",
      },
    ]);
  });

  it("fails closed when an approved relationship has no approved occupation label", () => {
    expect(() =>
      buildSepeOccupationCatalogue(
        [link("2252")],
        [occupation("2252", "Profesores de enseñanza secundaria", "draft")],
      ),
    ).toThrow(/2252|label|occupation/i);

    expect(() => buildSepeOccupationCatalogue([link("2721")], [])).toThrow(
      /2721|label|occupation/i,
    );
  });
});
