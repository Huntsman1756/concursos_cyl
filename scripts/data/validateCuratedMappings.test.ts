import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import type { TrainingProgram } from "../../data/schemas/generated";
import { approvedSingleTokenAuditIdentities } from "../analysis/validateFpOneWordPublicationReview";
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
  {
    programKey: "SAN21",
    programTitle: "Cuidados Auxiliares de Enfermería",
    level: "intermediate",
    familyCode: "SAN",
    familyName: "Sanidad",
  },
  {
    programKey: "HOT01M",
    programTitle: "Cocina y GastronomÃ­a",
    level: "intermediate",
    familyCode: "HOT",
    familyName: "HostelerÃ­a y Turismo",
  },
  {
    programKey: "SSC01M",
    programTitle: "Atención a Personas en Situación de Dependencia",
    level: "intermediate",
    familyCode: "SSC",
    familyName: "Servicios Socioculturales y a la Comunidad",
  },
  {
    programKey: "EOC01M",
    programTitle: "Construcción",
    level: "intermediate",
    familyCode: "EOC",
    familyName: "Edificación y Obra Civil",
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

  it("accepts a short contiguous official BOE bullet as mapping evidence", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], sourceQuote: "– Albañil." }],
      }),
    ).not.toThrow();
  });

  it("rejects a meaningless three-character official citation quote", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases,
        links: [{ ...links[0], sourceQuote: "abc" }],
      }),
    ).toThrow(/at least 10 characters/i);
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

  it("accepts the audited accepted single-token alias only with approved_single_token", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          ...occupations,
          {
            ...occupations[0],
            occupationId: "occupation:cno11:7111",
            preferredLabel:
              "Encofradores y operarios de puesta en obra de hormigÃ³n",
            confirmationLabel: "Encofrados y hormigÃ³n",
            classificationCode: "7111",
          },
        ],
        aliases: [
          {
            alias: "encofradores",
            occupationId: "occupation:cno11:7111",
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          {
            ...links[0],
            trainingProgramKey: "EOC01M",
            occupationId: "occupation:cno11:7111",
            sourceQuote: "Encofradores.",
            reviewedAt: "2026-08-09",
          },
        ],
      }),
    ).not.toThrow();
  });

  it("rejects approved_single_token when the literal form or occupation is not the audited accepted pair", () => {
    const eocOccupation = {
      ...occupations[0],
      occupationId: "occupation:cno11:7111",
      preferredLabel: "Encofradores y operarios de puesta en obra de hormigÃ³n",
      confirmationLabel: "Encofrados y hormigÃ³n",
      classificationCode: "7111",
    } as const;
    const eocLink = {
      ...links[0],
      trainingProgramKey: "EOC01M",
      occupationId: eocOccupation.occupationId,
      sourceQuote: "Encofradores.",
      reviewedAt: "2026-08-09",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, eocOccupation],
        aliases: [
          {
            alias: "Encofradores",
            occupationId: eocOccupation.occupationId,
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [...links, eocLink],
      }),
    ).toThrow(/accepted|audit|publication/i);

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [
          ...occupations,
          eocOccupation,
          {
            ...eocOccupation,
            occupationId: "occupation:cno11:7121",
            preferredLabel: "AlbaÃ±iles",
            confirmationLabel: "AlbaÃ±ilerÃ­a",
            classificationCode: "7121",
          },
        ],
        aliases: [
          {
            alias: "encofradores",
            occupationId: "occupation:cno11:7121",
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          eocLink,
          {
            ...eocLink,
            occupationId: "occupation:cno11:7121",
          },
        ],
      }),
    ).toThrow(/accepted|audit|publication/i);
  });

  it("rejects the audited single-token alias when its approved relationship uses a non-target program", () => {
    const eocOccupation = {
      ...occupations[0],
      occupationId: "occupation:cno11:7111",
      preferredLabel: "Encofradores y operarios de puesta en obra de hormigón",
      confirmationLabel: "Encofrados y hormigón",
      classificationCode: "7111",
    } as const;

    expect(() =>
      validateCuratedMappings({
        programs,
        occupations: [...occupations, eocOccupation],
        aliases: [
          {
            alias: "encofradores",
            occupationId: eocOccupation.occupationId,
            reviewStatus: "approved",
            reviewedAt: "2026-08-09",
            mappingVersion: "1.0.0",
            matchPolicy: "approved_single_token",
          },
        ],
        links: [
          ...links,
          {
            ...links[0],
            trainingProgramKey: "HOT01M",
            occupationId: eocOccupation.occupationId,
            sourceQuote: "Encofradores.",
            reviewedAt: "2026-08-09",
          },
        ],
      }),
    ).toThrow(/EOC01M|program|audit/i);
  });

  it("fails closed when terminal single-token audit evidence changes", () => {
    const artifact = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "analysis/fp_one_word_publication_reviews.json"),
        "utf8",
      ),
    );
    const reviewedRow = artifact.rows.find(
      (row: { form: string }) => row.form === "encofradores",
    );
    if (reviewedRow === undefined) throw new Error("Missing audit row.");
    reviewedRow.requirementQuotes = ["Altered terminal evidence."];

    expect(() => approvedSingleTokenAuditIdentities(artifact)).toThrow(
      /row review|evidence drift/i,
    );
  });

  it("fails closed when a rejected audit form is changed to accepted", () => {
    const artifact = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "analysis/fp_one_word_publication_reviews.json"),
        "utf8",
      ),
    );
    const rejectedRow = artifact.rows.find(
      (row: { form: string }) => row.form === "cocinero",
    );
    if (rejectedRow === undefined)
      throw new Error("Missing rejected audit row.");
    rejectedRow.disposition = "accepted";
    rejectedRow.reasonCode = "exact_occupation_title";
    rejectedRow.rationale =
      "Altered terminal audit disposition while retaining the pinned identity.";
    artifact.publicationDecision.cocinero = {
      status: "accepted",
      acceptedOfferIds: [rejectedRow.offerId],
      rejectedOfferIds: [],
      reason: "Accepted offers are eligible for publication.",
    };

    expect(() => approvedSingleTokenAuditIdentities(artifact)).toThrow(
      /row review|evidence drift/i,
    );
  });

  it("rejects unknown alias matchPolicy values", () => {
    expect(() =>
      validateCuratedMappings({
        programs,
        occupations,
        aliases: [
          {
            ...aliases[0],
            matchPolicy: "unknown_policy",
          },
        ],
        links,
      }),
    ).toThrow(/matchPolicy|invalid|unrecognized/i);
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
      [
        "2713",
        "5110",
        "5611",
        "5612",
        "5629",
        "5710",
        "7111",
        "7121",
        "7193",
        "7240",
        "7291",
      ],
    );
    expect(
      approved.links.map((item) => item.trainingProgramKey).sort(),
    ).toEqual([
      "EOC01M",
      "EOC01M",
      "EOC01M",
      "EOC01M",
      "EOC01M",
      "HOT01M",
      "IFC03S",
      "IFC03SD",
      "SAN21",
      "SAN21",
      "SSC01M",
      "SSC01M",
    ]);

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
    expect(coverage).toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "HOT01M",
        approvedMappings: 1,
        coverageStatus: "reviewed",
      }),
    );
  });

  it("publishes only EOC01M aliases accepted by the official audit", async () => {
    const curated = await loadCuratedMappingsFromDisk(process.cwd(), programs);
    const approved = loadApprovedMappings(curated);
    const eocLinks = approved.links.filter(
      (link) => link.trainingProgramKey === "EOC01M",
    );
    const eocOccupationIds = eocLinks.map((link) => link.occupationId).sort();

    expect(eocOccupationIds).toEqual([
      "occupation:cno11:7111",
      "occupation:cno11:7121",
      "occupation:cno11:7193",
      "occupation:cno11:7240",
      "occupation:cno11:7291",
    ]);
    expect(
      approved.aliases
        .filter((alias) => eocOccupationIds.includes(alias.occupationId))
        .map(({ alias, occupationId }) => ({ alias, occupationId })),
    ).toEqual([
      {
        alias: "Impermeabilizadores de terrazas",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Instaladores de materiales de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Instaladores de sistemas de impermeabilización en edificios",
        occupationId: "occupation:cno11:7193",
      },
      {
        alias: "Pavimentadores a base de hormigón",
        occupationId: "occupation:cno11:7111",
      },
      {
        alias: "encofradores",
        occupationId: "occupation:cno11:7111",
      },
      {
        alias: "Pavimentadores con adoquines",
        occupationId: "occupation:cno11:7240",
      },
    ]);
  });
});
