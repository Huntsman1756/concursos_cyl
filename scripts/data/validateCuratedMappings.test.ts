import { describe, expect, it } from "vitest";

import type { TrainingProgram } from "../../data/schemas/generated";
import {
  buildOccupationIndex,
  loadApprovedMappings,
} from "../../src/domain/occupation";
import {
  buildMappingCoverage,
  loadCuratedMappingsFromDisk,
  validateCuratedMappings,
} from "./validateCuratedMappings";

const programs: TrainingProgram[] = [
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones WEB",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "ADG01M",
    programTitle: "Gestión Administrativa",
    level: "intermediate",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "ADG02S",
    programTitle: "Administración y Finanzas",
    level: "higher",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
  {
    programKey: "IFC03SD",
    programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "ADG01MD",
    programTitle: "Gestión Administrativa (distancia)",
    level: "intermediate",
    familyCode: "ADG",
    familyName: "Administración y Gestión",
  },
];

const occupations = [
  {
    occupationId: "occupation:cno11:2713",
    preferredLabel: "Analistas, programadores y diseñadores web y multimedia",
    confirmationLabel: "Programación y desarrollo web",
    classificationSystem: "CNO-11",
    classificationCode: "2713",
    reviewStatus: "approved",
    sourceUrl: "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
    reviewedAt: "2026-08-04",
    catalogVersion: "1.0.0",
  },
] as const;

const aliases = [
  {
    alias: "desarrollador web",
    occupationId: "occupation:cno11:2713",
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programador web",
    occupationId: "occupation:cno11:2713",
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

const links = [
  {
    trainingProgramKey: "IFC03S",
    occupationId: "occupation:cno11:2713",
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269",
    sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
] as const;

describe("curated occupation mappings", () => {
  it("rejects unknown fields and malformed stable occupation identifiers", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          {
            ...occupations[0],
            occupationId: "web-development",
            hiddenScore: 0.9,
          },
        ],
        aliases,
        links,
      }),
    ).toThrow(/occupation|unrecognized|invalid/i);
  });

  it("rejects an approved relationship without a primary official citation", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [
          {
            ...links[0],
            sourceUrl: "https://example.com/generated-summary",
            sourceQuote: "",
          },
        ],
      }),
    ).toThrow(/approved mapping requires.*official source.*quote/i);
  });

  it("rejects an empty occupation confirmation label", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [{ ...occupations[0], confirmationLabel: "" }],
        aliases,
        links,
      }),
    ).toThrow(/confirmation/i);
  });

  it("rejects a generic one-word alias", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases: [{ ...aliases[0], alias: "técnico" }],
        links,
      }),
    ).toThrow(/generic/i);
  });

  it("rejects a dangling occupation relationship", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], occupationId: "occupation:cno11:9999" }],
      }),
    ).toThrow(/unknown occupation/i);
  });

  it("rejects a normalized alias assigned to different occupations", () => {
    const other = {
      ...occupations[0],
      occupationId: "occupation:cno11:4309",
      preferredLabel:
        "Empleados administrativos sin tareas de atención al público",
      confirmationLabel: "Administración de oficina",
      classificationCode: "4309",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, other],
        aliases: [
          ...aliases,
          {
            ...aliases[0],
            alias: "Desarrolladór   web",
            occupationId: other.occupationId,
          },
        ],
        links,
      }),
    ).toThrow(/duplicate normalized alias/i);
  });

  it("builds deterministic reviewed alias search without exposing a score", () => {
    const index = buildOccupationIndex(occupations, aliases);

    expect(index.search("desarrollador web")).toEqual([
      {
        occupationId: "occupation:cno11:2713",
        preferredLabel:
          "Analistas, programadores y diseñadores web y multimedia",
        confirmationLabel: "Programación y desarrollo web",
      },
    ]);
    expect(index.search("término no revisado")).toEqual([]);
  });

  it("publishes only approved occupations, aliases, and relationships", () => {
    const approved = loadApprovedMappings({
      occupations: [
        ...occupations,
        {
          ...occupations[0],
          occupationId: "occupation:cno11:3820",
          reviewStatus: "draft",
        },
      ],
      aliases: [
        ...aliases,
        { ...aliases[0], alias: "programación", reviewStatus: "rejected" },
      ],
      links: [
        ...links,
        { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "draft" },
      ],
    });

    expect(approved.occupations).toHaveLength(1);
    expect(approved.aliases).toHaveLength(2);
    expect(approved.links).toHaveLength(1);
  });

  it("reports approved, draft, rejected, and uncovered counts by program and family", () => {
    const coverage = buildMappingCoverage(programs, [
      ...links,
      { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "draft" },
      { ...links[0], trainingProgramKey: "ADG01M", reviewStatus: "rejected" },
    ]);

    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG02S",
        approvedMappings: 0,
        draftMappings: 0,
        rejectedMappings: 0,
        uncoveredPrograms: 1,
        coverageStatus: "uncovered",
      }),
    );
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "family",
        familyCode: "ADG",
        approvedMappings: 0,
        draftMappings: 1,
        rejectedMappings: 1,
        uncoveredPrograms: 2,
      }),
    );
  });

  it("keeps the unresolved Gestión Administrativa 4309/4500 choice in draft data only", async () => {
    const curated = await loadCuratedMappingsFromDisk(process.cwd(), programs);
    const approved = loadApprovedMappings(curated);
    const administrativeOccupation = curated.occupations.find(
      (occupation) => occupation.classificationCode === "4309",
    );
    const administrativeAliases = curated.aliases.filter(
      (alias) => alias.occupationId === administrativeOccupation?.occupationId,
    );
    const administrativeLinks = curated.links.filter((link) =>
      ["ADG01M", "ADG01MD"].includes(link.trainingProgramKey),
    );

    expect(administrativeOccupation).toMatchObject({
      reviewStatus: "draft",
      reviewNote: expect.stringMatching(/4309.*4500.*unresolved/i),
    });
    expect(
      administrativeAliases.every(
        (alias) =>
          alias.reviewStatus === "draft" &&
          /4309.*4500.*unresolved/i.test(alias.reviewNote ?? ""),
      ),
    ).toBe(true);
    expect(
      administrativeLinks.every(
        (link) =>
          link.reviewStatus === "draft" &&
          /4309.*4500.*unresolved/i.test(link.reviewNote ?? ""),
      ),
    ).toBe(true);
    expect(approved.occupations.map((item) => item.classificationCode)).toEqual(
      ["2713"],
    );
    expect(
      approved.links.map((item) => item.trainingProgramKey).sort(),
    ).toEqual(["IFC03S", "IFC03SD"]);

    const coverage = buildMappingCoverage(programs, curated.links);
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG01M",
        approvedMappings: 0,
        draftMappings: 1,
        coverageStatus: "draft",
      }),
    );
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG01MD",
        approvedMappings: 0,
        draftMappings: 1,
        coverageStatus: "draft",
      }),
    );
  });
});
