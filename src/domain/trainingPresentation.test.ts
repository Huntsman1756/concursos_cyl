import { describe, expect, it } from "vitest";
import type { MappingCoverage } from "../../data/schemas/curatedMappings";
import { featuredTrainingCoverage } from "./trainingPresentation";

const rows: MappingCoverage[] = [
  {
    scope: "program",
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
    approvedMappings: 2,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageStatus: "reviewed",
    coverageNote: "Relación revisada con evidencia oficial.",
  },
  {
    scope: "family",
    familyCode: "FAM",
    familyName: "Familia que no es un programa",
    programCount: 4,
    approvedMappings: 4,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageNote: "Cobertura agregada por familia.",
  },
  {
    scope: "program",
    programKey: "ADG02M",
    programTitle: "Gestión Administrativa",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
    approvedMappings: 1,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageStatus: "reviewed",
    coverageNote: "Relación revisada con evidencia oficial.",
  },
  {
    scope: "program",
    programKey: "SAN01M",
    programTitle: "Sanidad y Cuidados Auxiliares",
    familyCode: "SAN",
    familyName: "Sanidad",
    approvedMappings: 3,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageStatus: "reviewed",
    coverageNote: "Relación revisada con evidencia oficial.",
  },
  {
    scope: "program",
    programKey: "ADG01S",
    programTitle: "Administración y Finanzas",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
    approvedMappings: 2,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 0,
    coverageStatus: "reviewed",
    coverageNote: "Relación revisada con evidencia oficial.",
  },
  {
    scope: "program",
    programKey: "COM01M",
    programTitle: "Actividades Comerciales",
    familyCode: "COM",
    familyName: "Comercio y Marketing",
    approvedMappings: 0,
    draftMappings: 0,
    rejectedMappings: 0,
    uncoveredPrograms: 1,
    coverageStatus: "uncovered",
    coverageNote: "Todavía no hay una relación revisada.",
  },
];

describe("featuredTrainingCoverage", () => {
  it("returns at most three reviewed programs, one per family, in stable order", () => {
    const before = structuredClone(rows);

    expect(
      featuredTrainingCoverage(rows).map(({ programKey }) => programKey),
    ).toEqual(["ADG01S", "IFC03S", "SAN01M"]);
    expect(rows).toEqual(before);
  });

  it("filters uncovered programs and family-scope coverage rows", () => {
    const featured = featuredTrainingCoverage(rows);

    expect(featured.every((row) => row.scope === "program")).toBe(true);
    expect(featured.map(({ programKey }) => programKey)).not.toContain(
      "COM01M",
    );
    expect(featured.map(({ programKey }) => programKey)).not.toContain("FAM");
  });
});
