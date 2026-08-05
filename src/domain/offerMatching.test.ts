import { describe, expect, it } from "vitest";

import type { JobOffer, TrainingProgram } from "../../data/schemas/generated";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  OfferMatchesSchema,
  matchOffersForProgram,
  type OfferMatchingData,
} from "./offerMatching";
import {
  publishedRequirementId,
  type OfferPublishedRequirements,
} from "./requirements";

const DAW_OCCUPATION_ID = "occupation:cno11:2713";

const programs: TrainingProgram[] = [
  {
    programKey: "IFC03S",
    programTitle: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC03SD",
    programTitle: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
];

const occupation: Occupation = {
  occupationId: DAW_OCCUPATION_ID,
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
    occupationId: DAW_OCCUPATION_ID,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programación web",
    occupationId: DAW_OCCUPATION_ID,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
];

const links: TrainingOccupationLink[] = programs.map((program) => ({
  trainingProgramKey: program.programKey,
  occupationId: DAW_OCCUPATION_ID,
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/buscar/doc.php?id=BOE-A-2010-9269&lang=es",
  sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
  reviewedAt: "2026-08-04",
  mappingVersion: "1.0.0",
}));

function offer(
  id: string,
  title: string,
  publishedAt = "2026-08-01T08:00:00.000Z",
): JobOffer {
  return {
    id,
    title,
    province: "Valladolid",
    locality: "Valladolid",
    publishedAt,
    sourceName: "ECYL",
    descriptionText: "Oferta oficial.",
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    },
    originalUrl: `https://empleo.jcyl.es/${id}`,
    sourceSnapshot: {
      sourceId: "ecyl-job-offers",
      sourceUrl: "https://datosabiertos.jcyl.es/",
      sourceUpdatedAt: "2026-08-01T08:00:00.000Z",
      snapshotFetchedAt: "2026-08-02T08:00:00.000Z",
      schemaVersion: "1.0.0",
      recordCount: 1,
      sha256: "a".repeat(64),
      qualityStatus: "passed",
    },
  };
}

function qualificationRequirement(offerId: string, normalizedValue: string) {
  const sourceQuote = `Se requiere ${normalizedValue}.`;
  return {
    id: publishedRequirementId(
      offerId,
      "qualification_or_specialization",
      sourceQuote,
    ),
    category: "qualification_or_specialization" as const,
    normalizedValue,
    sourceQuote,
    parserRule: "qualification.official_title" as const,
    parserVersion: "1.0.0" as const,
  };
}

function data(
  offers: JobOffer[],
  publishedRequirements: OfferPublishedRequirements[] = [],
  overrides: OfferMatchingData["humanOverrides"] = [],
): OfferMatchingData {
  return {
    programs,
    occupations: [occupation],
    aliases,
    links,
    offers,
    publishedRequirements,
    humanOverrides: overrides,
  };
}

describe("matchOffersForProgram", () => {
  it("matches a normalized exact reviewed alias and records every audit identity", () => {
    const [match] = matchOffersForProgram(
      "IFC03S",
      data([offer("offer:exact", "  DESARROLLADOR—WÉB!!! ")]),
    );

    expect(match).toMatchObject({
      offerId: "offer:exact",
      occupationId: DAW_OCCUPATION_ID,
      programKey: "IFC03S",
      matchRule: "title_alias_exact",
      relationshipType: "official_output",
      linkEvidence: {
        mappingVersion: "1.0.0",
        sourceQuote: "Desarrollador de aplicaciones en entornos Web.",
      },
      aliasEvidence: {
        alias: "desarrollador web",
        mappingVersion: "1.0.0",
      },
    });
    expect(match?.linkEvidence.identity).toContain("IFC03S");
    expect(
      match !== undefined && "aliasEvidence" in match
        ? match.aliasEvidence.identity
        : undefined,
    ).toContain(DAW_OCCUPATION_ID);
  });

  it("matches reviewed aliases only as complete bounded phrases", () => {
    const matches = matchOffersForProgram(
      "IFC03S",
      data([
        offer("offer:phrase", "Buscamos desarrollador web junior"),
        offer("offer:substring", "Equipo de desarrollador website"),
      ]),
    );

    expect(
      matches.map(({ offerId, matchRule }) => ({ offerId, matchRule })),
    ).toEqual([{ offerId: "offer:phrase", matchRule: "title_alias_phrase" }]);
  });

  it("requires exact normalized equality for a structured published qualification", () => {
    const exactOffer = offer("offer:qualification", "Perfil digital");
    const fuzzyOffer = offer("offer:fuzzy", "Perfil digital avanzado");
    const publishedRequirements = [
      {
        offerId: exactOffer.id,
        requirements: [
          qualificationRequirement(exactOffer.id, programs[0].programTitle),
        ],
      },
      {
        offerId: fuzzyOffer.id,
        requirements: [
          qualificationRequirement(
            fuzzyOffer.id,
            "Desarrollo de Aplicaciones Web",
          ),
        ],
      },
    ];

    const matches = matchOffersForProgram(
      "IFC03S",
      data([exactOffer, fuzzyOffer], publishedRequirements),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      offerId: exactOffer.id,
      matchRule: "published_qualification_exact",
      requirementEvidence: {
        id: publishedRequirements[0].requirements[0].id,
        sourceQuote: publishedRequirements[0].requirements[0].sourceQuote,
      },
    });
  });

  it("uses only explicit in-memory overrides tied to the offer and approved occupation", () => {
    const target = offer("offer:override", "Perfil de producto");
    const [match] = matchOffersForProgram(
      "IFC03S",
      data(
        [target],
        [],
        [
          {
            offerId: target.id,
            occupationId: DAW_OCCUPATION_ID,
            confirmed: true,
          },
        ],
      ),
    );

    expect(match).toMatchObject({
      offerId: target.id,
      occupationId: DAW_OCCUPATION_ID,
      matchRule: "human_override",
    });
  });

  it("excludes draft occupations, aliases and links including Gestión Administrativa", () => {
    const draftOccupation: Occupation = {
      ...occupation,
      occupationId: "occupation:cno11:4309",
      classificationCode: "4309",
      reviewStatus: "draft",
      reviewNote:
        "Clasificación pendiente entre 4309 y 4500; no publicable todavía.",
    };
    const draftAlias: OccupationAlias = {
      ...aliases[0],
      alias: "auxiliar administrativo",
      occupationId: draftOccupation.occupationId,
      reviewStatus: "draft",
      reviewNote:
        "Clasificación pendiente entre 4309 y 4500; no publicable todavía.",
    };
    const draftLink: TrainingOccupationLink = {
      ...links[0],
      trainingProgramKey: "ADG01M",
      occupationId: draftOccupation.occupationId,
      reviewStatus: "draft",
      reviewNote:
        "Clasificación pendiente entre 4309 y 4500; no publicable todavía.",
    };

    expect(
      matchOffersForProgram("ADG01M", {
        ...data([offer("offer:ga", "Auxiliar administrativo")]),
        programs: [
          ...programs,
          {
            ...programs[0],
            programKey: "ADG01M",
            programTitle: "Gestión Administrativa",
          },
        ],
        occupations: [occupation, draftOccupation],
        aliases: [draftAlias],
        links: [draftLink],
      }),
    ).toEqual([]);
  });

  it("rejects generic one-word aliases, dangling approved records and conflicting overrides", () => {
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:generic", "Técnico")]),
        aliases: [{ ...aliases[0], alias: "técnico" }],
      }),
    ).toThrow(/alias.*word/i);

    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:dangling", "Desarrollador web")]),
        links: [{ ...links[0], occupationId: "occupation:cno11:9999" }],
      }),
    ).toThrow(/dangling/i);

    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:conflict", "Perfil")]),
        humanOverrides: [
          {
            offerId: "offer:conflict",
            occupationId: DAW_OCCUPATION_ID,
            confirmed: true,
          },
          {
            offerId: "offer:conflict",
            occupationId: "occupation:cno11:9999",
            confirmed: true,
          },
        ],
      }),
    ).toThrow(/conflicting/i);
  });

  it("rejects duplicate curated identities instead of depending on input order", () => {
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:duplicate-alias", "Desarrollador web")]),
        aliases: [aliases[0], aliases[0]],
      }),
    ).toThrow(/alias.*unique/i);

    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:duplicate-link", "Desarrollador web")]),
        links: [links[0], links[0]],
      }),
    ).toThrow(/link.*unique/i);
  });

  it("rejects unknown rules, duplicate matches, missing provenance and contradictory evidence", () => {
    const [valid] = matchOffersForProgram(
      "IFC03S",
      data([offer("offer:valid", "Desarrollador web")]),
    );

    expect(
      OfferMatchesSchema.safeParse([{ ...valid, matchRule: "score_match" }])
        .success,
    ).toBe(false);
    expect(OfferMatchesSchema.safeParse([valid, valid]).success).toBe(false);
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...valid,
          linkEvidence: { ...valid.linkEvidence, sourceUrl: undefined },
        },
      ]).success,
    ).toBe(false);
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...valid,
          matchRule: "human_override",
          aliasEvidence:
            "aliasEvidence" in valid ? valid.aliasEvidence : undefined,
        },
      ]).success,
    ).toBe(false);
  });
});
