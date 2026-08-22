import { describe, expect, it } from "vitest";
import type {
  Occupation,
  OccupationAlias,
} from "../../data/schemas/curatedMappings";
import { buildOccupationIndex } from "./occupation";

function makeOccupation(
  classificationCode: string,
  preferredLabel: string,
  confirmationLabel: string,
  reviewStatus: Occupation["reviewStatus"] = "approved",
): Occupation {
  return {
    occupationId: `occupation:cno11:${classificationCode}`,
    preferredLabel,
    confirmationLabel,
    classificationSystem: "CNO-11",
    classificationCode,
    reviewStatus,
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    reviewedAt: "2026-08-04",
    catalogVersion: "1.0.0",
    ...(reviewStatus === "draft"
      ? { reviewNote: "Pendiente de revisión de la relación oficial." }
      : {}),
  };
}

function candidate(occupation: Occupation) {
  return {
    occupationId: occupation.occupationId,
    preferredLabel: occupation.preferredLabel,
    confirmationLabel: occupation.confirmationLabel,
  };
}

const occupation: Occupation = {
  occupationId: "occupation:cno11:2713",
  preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
  confirmationLabel: "Programación y desarrollo web",
  classificationSystem: "CNO-11",
  classificationCode: "2713",
  reviewStatus: "approved",
  sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
  reviewedAt: "2026-08-04",
  catalogVersion: "1.0.0",
};

const aliases: OccupationAlias[] = [
  {
    alias: "desarrollador web",
    occupationId: occupation.occupationId,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programación web",
    occupationId: occupation.occupationId,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
];

describe("controlled occupation search corpus", () => {
  it("searches official labels, reviewed aliases, and everyday confirmation labels", () => {
    const index = buildOccupationIndex([occupation], aliases);

    expect(index.search("desarrollo")).toEqual([
      {
        occupationId: occupation.occupationId,
        preferredLabel: occupation.preferredLabel,
        confirmationLabel: occupation.confirmationLabel,
      },
    ]);
    expect(index.search("programación web")).toEqual([candidate(occupation)]);
  });

  it("normalizes accents, punctuation, spaces, and prefixes", () => {
    const index = buildOccupationIndex([occupation], aliases);

    expect(index.search("  DESARROLLO,   WEB ")).toEqual([
      candidate(occupation),
    ]);
    expect(index.search("program")).toEqual([candidate(occupation)]);
  });

  it("requires every query term to match a document token by prefix", () => {
    const index = buildOccupationIndex([occupation], aliases);

    expect(index.search("program web")).toEqual([candidate(occupation)]);
    expect(index.search("program web sanidad")).toEqual([]);
  });

  it("ranks alias evidence above confirmation and preferred labels", () => {
    const preferred = makeOccupation(
      "1001",
      "Salud y bienestar",
      "Atención general",
    );
    const confirmation = makeOccupation(
      "1002",
      "Cuidado clínico",
      "Salud comunitaria",
    );
    const alias = makeOccupation(
      "1003",
      "Gestión clínica",
      "Atención sanitaria",
    );
    const index = buildOccupationIndex(
      [preferred, confirmation, alias],
      [
        {
          alias: "salud pública",
          occupationId: alias.occupationId,
          reviewStatus: "approved",
          reviewedAt: "2026-08-04",
          mappingVersion: "1.0.0",
        },
      ],
    );

    expect(index.search("salud")).toEqual([
      candidate(alias),
      candidate(confirmation),
      candidate(preferred),
    ]);
  });

  it("uses Spanish label and occupation id as stable tie breakers", () => {
    const beta = makeOccupation("1102", "Beta común", "Confirmación beta");
    const alpha = makeOccupation("1101", "Alfa común", "Confirmación alfa");
    const index = buildOccupationIndex([beta, alpha], []);

    expect(index.search("comun")).toEqual([candidate(alpha), candidate(beta)]);
  });

  it("indexes approved occupations and approved aliases only", () => {
    const approved = makeOccupation(
      "1201",
      "Oficio visible",
      "Confirmación visible",
    );
    const draft = makeOccupation(
      "1202",
      "Oficio oculto",
      "Confirmación oculta",
      "draft",
    );
    const index = buildOccupationIndex(
      [approved, draft],
      [
        {
          alias: "alias visible",
          occupationId: approved.occupationId,
          reviewStatus: "approved",
          reviewedAt: "2026-08-04",
          mappingVersion: "1.0.0",
        },
        {
          alias: "alias descartado",
          occupationId: approved.occupationId,
          reviewStatus: "draft",
          reviewedAt: "2026-08-04",
          mappingVersion: "1.0.0",
          reviewNote: "Pendiente de revisión de la relación oficial.",
        },
        {
          alias: "alias de borrador",
          occupationId: draft.occupationId,
          reviewStatus: "approved",
          reviewedAt: "2026-08-04",
          mappingVersion: "1.0.0",
        },
      ],
    );

    expect(index.search("visible")).toEqual([candidate(approved)]);
    expect(index.search("alias visible")).toEqual([candidate(approved)]);
    expect(index.search("descartado")).toEqual([]);
    expect(index.search("borrador")).toEqual([]);
  });

  it("returns at most thirty candidates", () => {
    const occupations = Array.from({ length: 35 }, (_, index) =>
      makeOccupation(
        String(1300 + index),
        `Común ${String(index).padStart(2, "0")}`,
        `Confirmación ${String(index).padStart(2, "0")}`,
      ),
    );
    const result = buildOccupationIndex(occupations, []).search("comun");

    expect(result).toHaveLength(30);
    expect(result[0]).toEqual(candidate(occupations[0]));
  });

  it("returns no candidates for empty, punctuation-only, or unknown queries", () => {
    const index = buildOccupationIndex([occupation], aliases);

    expect(index.search("   ")).toEqual([]);
    expect(index.search("!!!")).toEqual([]);
    expect(index.search("astronauta")).toEqual([]);
  });
});
