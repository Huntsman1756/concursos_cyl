import { describe, expect, it } from "vitest";

import {
  REVIEWED_PROGRAM_QUALIFICATION_LINKS,
  ProgramQualificationLinksSchema,
  programQualificationLinkIdentity,
} from "../../data/catalogs/reviewedProgramQualifications";
import {
  REVIEWED_QUALIFICATIONS,
  type ReviewedQualification,
} from "../../data/catalogs/reviewedQualifications";
import type {
  Occupation,
  OccupationAlias,
  TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import type { JobOffer, TrainingProgram } from "../../data/schemas/generated";
import {
  OfferMatchesSchema,
  aliasEvidenceIdentity,
  createHumanConfirmation,
  humanConfirmationIdentity,
  matchOffersForProgram,
  trainingLinkEvidenceIdentity,
  type OfferMatchingData,
} from "./offerMatching";
import {
  publishedRequirementId,
  type OfferPublishedRequirements,
} from "./requirements";

const OCCUPATION_ID = "occupation:cno11:2713";
const QUALIFICATION_ID =
  "qualification:web-application-development-higher-technician";

const programs: TrainingProgram[] = [
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones WEB",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC03SD",
    programTitle: "Desarrollo de Aplicaciones WEB (distancia)",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
];

const occupation: Occupation = {
  occupationId: OCCUPATION_ID,
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
    occupationId: OCCUPATION_ID,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
  {
    alias: "programación web",
    occupationId: OCCUPATION_ID,
    reviewStatus: "approved",
    reviewedAt: "2026-08-04",
    mappingVersion: "1.0.0",
  },
];

const links: TrainingOccupationLink[] = programs.map((program) => ({
  trainingProgramKey: program.programKey,
  occupationId: OCCUPATION_ID,
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

function qualificationRequirement(
  offerId: string,
  normalizedValue = "Técnico/a Superior en Desarrollo de Aplicaciones Web",
  sourceQuote = `Se requiere ${normalizedValue}.`,
) {
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
  humanOverrides: OfferMatchingData["humanOverrides"] = [],
): OfferMatchingData {
  return {
    programs,
    qualifications: REVIEWED_QUALIFICATIONS,
    programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
    occupations: [occupation],
    aliases,
    links,
    offers,
    publishedRequirements,
    humanOverrides,
  };
}

describe("reviewed program qualification links", () => {
  it("links both live DAW keys to one reviewed qualification with primary evidence", () => {
    expect(REVIEWED_PROGRAM_QUALIFICATION_LINKS).toEqual([
      expect.objectContaining({
        programKey: "IFC03S",
        qualificationCatalogId: QUALIFICATION_ID,
        reviewStatus: "approved",
        mappingVersion: "1.0.0",
        sourceUrl: "https://www.boe.es/eli/es/rd/2010/05/20/686",
        sourceQuote:
          "El título de Técnico Superior en Desarrollo de Aplicaciones Web queda identificado por los siguientes elementos:",
      }),
      expect.objectContaining({
        programKey: "IFC03SD",
        qualificationCatalogId: QUALIFICATION_ID,
        reviewStatus: "approved",
      }),
    ]);
    for (const link of REVIEWED_PROGRAM_QUALIFICATION_LINKS) {
      expect(link.identity).toBe(programQualificationLinkIdentity(link));
    }
  });

  it("rejects duplicate program and qualification identities", () => {
    const first = REVIEWED_PROGRAM_QUALIFICATION_LINKS[0];
    expect(
      ProgramQualificationLinksSchema.safeParse([first, first]).success,
    ).toBe(false);
  });

  it("binds the program qualification identity to the complete review payload", () => {
    const first = REVIEWED_PROGRAM_QUALIFICATION_LINKS[0];
    expect(
      ProgramQualificationLinksSchema.safeParse([
        { ...first, reviewedAt: "2026-08-04" },
      ]).success,
    ).toBe(false);
  });
});

describe("matchOffersForProgram", () => {
  it("records the full approved link and alias payload with recomputed identities", () => {
    const [match] = matchOffersForProgram(
      "IFC03S",
      data([offer("offer:exact", "  DESARROLLADOR—WÉB!!! ")]),
    );

    expect(match).toMatchObject({
      offerId: "offer:exact",
      occupationId: OCCUPATION_ID,
      programKey: "IFC03S",
      matchRule: "title_alias_exact",
      relationshipType: "official_output",
      linkEvidence: { payload: links[0] },
      aliasEvidence: { payload: aliases[0] },
    });
    if (match.matchRule !== "title_alias_exact") throw new Error("Wrong rule.");
    expect(match.linkEvidence.identity).toBe(
      trainingLinkEvidenceIdentity(match.linkEvidence.payload),
    );
    expect(match.aliasEvidence.identity).toBe(
      aliasEvidenceIdentity(match.aliasEvidence.payload),
    );
  });

  it("matches a reviewed qualification despite the real source program title", () => {
    const target = offer("offer:qualification", "Perfil digital");
    const requirement = qualificationRequirement(target.id);
    const [match] = matchOffersForProgram(
      "IFC03S",
      data([target], [{ offerId: target.id, requirements: [requirement] }]),
    );

    expect(programs[0].programTitle).toBe("Desarrollo de Aplicaciones WEB");
    expect(match).toMatchObject({
      matchRule: "published_qualification_exact",
      qualificationEvidence: {
        offerId: target.id,
        requirementId: requirement.id,
        sourceQuote: requirement.sourceQuote,
        normalizedValue: requirement.normalizedValue,
        qualification: { catalogId: QUALIFICATION_ID },
        programQualificationLink: {
          payload: REVIEWED_PROGRAM_QUALIFICATION_LINKS[0],
        },
      },
    });
  });

  it.each(["missing", "draft", "wrong qualification"])(
    "does not match a qualification when its program link is %s",
    (variant) => {
      const target = offer(`offer:${variant}`, "Perfil digital");
      const requirement = qualificationRequirement(
        target.id,
        variant === "wrong qualification" ? "Grado en Derecho" : undefined,
      );
      const approved = REVIEWED_PROGRAM_QUALIFICATION_LINKS[0];
      const candidate = {
        programKey: approved.programKey,
        reviewStatus:
          variant === "draft" ? ("draft" as const) : ("approved" as const),
        qualificationCatalogId:
          variant === "wrong qualification"
            ? "qualification:law-degree"
            : approved.qualificationCatalogId,
        sourceUrl: approved.sourceUrl,
        sourceQuote: approved.sourceQuote,
        reviewedAt: approved.reviewedAt,
        mappingVersion: approved.mappingVersion,
        reviewNote:
          variant === "draft"
            ? "Pendiente de revisión documental antes de su publicación."
            : undefined,
      };
      const programQualificationLinks =
        variant === "missing"
          ? []
          : [
              {
                ...candidate,
                identity: programQualificationLinkIdentity(candidate),
              },
            ];

      expect(
        matchOffersForProgram("IFC03S", {
          ...data(
            [target],
            [{ offerId: target.id, requirements: [requirement] }],
          ),
          programQualificationLinks,
        }),
      ).toEqual([]);
    },
  );

  it("requires bounded phrases and deterministically prefers exact then longest alias", () => {
    const matches = matchOffersForProgram(
      "IFC03S",
      data([
        offer(
          "offer:phrase",
          "Buscamos desarrollador web para programación web avanzada",
        ),
        offer("offer:substring", "Equipo de desarrollador website"),
      ]),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      offerId: "offer:phrase",
      matchRule: "title_alias_phrase",
      aliasEvidence: { payload: aliases[0] },
    });
  });

  it("requires and preserves an explicit strict in-memory human confirmation", () => {
    const target = offer("offer:override", "Perfil de producto");
    const confirmation = createHumanConfirmation({
      offerId: target.id,
      occupationId: OCCUPATION_ID,
      confirmationSource: "user_in_memory",
    });
    const [match] = matchOffersForProgram(
      "IFC03S",
      data([target], [], [confirmation]),
    );

    expect(match).toMatchObject({
      matchRule: "human_override",
      confirmationEvidence: confirmation,
    });
    expect(confirmation.identity).toBe(humanConfirmationIdentity(confirmation));
  });

  it("excludes draft Gestión Administrativa mappings", () => {
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
        programQualificationLinks: [],
      }),
    ).toEqual([]);
  });

  it("rejects duplicate semantic links and conflicting overrides", () => {
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([offer("offer:duplicate-link", "Desarrollador web")]),
        links: [
          links[0],
          {
            ...links[0],
            mappingVersion: "1.0.1",
            reviewedAt: "2026-08-05",
          },
        ],
      }),
    ).toThrow(/ambiguous.*training link/i);

    const target = offer("offer:conflict", "Perfil");
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([target]),
        humanOverrides: [
          createHumanConfirmation({
            offerId: target.id,
            occupationId: OCCUPATION_ID,
            confirmationSource: "user_in_memory",
          }),
          createHumanConfirmation({
            offerId: target.id,
            occupationId: "occupation:cno11:9999",
            confirmationSource: "user_in_memory",
          }),
        ],
      }),
    ).toThrow(/conflicting/i);
  });

  it("is byte-identical across complete input permutations", () => {
    const target = offer(
      "offer:permutation",
      "Desarrollador web para programación web",
    );
    const firstRequirement = qualificationRequirement(
      target.id,
      undefined,
      "Se requiere Técnico/a Superior en Desarrollo de Aplicaciones Web.",
    );
    const secondRequirement = qualificationRequirement(
      target.id,
      undefined,
      "Titulación: Técnico/a Superior en Desarrollo de Aplicaciones Web.",
    );
    const secondOffer = offer(
      "offer:second",
      "Desarrollador web",
      "2026-08-02T08:00:00.000Z",
    );
    const base = data(
      [target, secondOffer],
      [
        {
          offerId: target.id,
          requirements: [firstRequirement, secondRequirement],
        },
      ],
    );
    const reversed: OfferMatchingData = {
      ...base,
      programs: [...base.programs].reverse(),
      qualifications: [...base.qualifications].reverse(),
      programQualificationLinks: [...base.programQualificationLinks].reverse(),
      occupations: [...base.occupations].reverse(),
      aliases: [...base.aliases].reverse(),
      links: [...base.links].reverse(),
      offers: [...base.offers].reverse(),
      publishedRequirements: base.publishedRequirements
        .map((entry) => ({
          ...entry,
          requirements: [...entry.requirements].reverse(),
        }))
        .reverse(),
      humanOverrides: [...base.humanOverrides].reverse(),
    };

    expect(JSON.stringify(matchOffersForProgram("IFC03S", reversed))).toBe(
      JSON.stringify(matchOffersForProgram("IFC03S", base)),
    );
    const [match] = matchOffersForProgram("IFC03S", base);
    expect(match.matchRule).toBe("published_qualification_exact");
    if (match.matchRule !== "published_qualification_exact") {
      throw new Error("Wrong deterministic priority.");
    }
    expect(match.qualificationEvidence.requirementId).toBe(
      [firstRequirement.id, secondRequirement.id].sort()[0],
    );
  });

  it("rejects forged link, alias, qualification and confirmation audit atoms", () => {
    const exact = matchOffersForProgram(
      "IFC03S",
      data([offer("offer:forged-alias", "Desarrollador web")]),
    )[0];
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...exact,
          linkEvidence: {
            ...exact.linkEvidence,
            identity: "training-link:forged",
          },
        },
      ]).success,
    ).toBe(false);
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...exact,
          aliasEvidence:
            "aliasEvidence" in exact
              ? { ...exact.aliasEvidence, identity: "occupation-alias:forged" }
              : undefined,
        },
      ]).success,
    ).toBe(false);

    const qualificationOffer = offer("offer:forged-qualification", "Perfil");
    const requirement = qualificationRequirement(qualificationOffer.id);
    const qualification = matchOffersForProgram(
      "IFC03S",
      data(
        [qualificationOffer],
        [{ offerId: qualificationOffer.id, requirements: [requirement] }],
      ),
    )[0];
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...qualification,
          qualificationEvidence:
            "qualificationEvidence" in qualification
              ? {
                  ...qualification.qualificationEvidence,
                  offerId: "offer:other",
                }
              : undefined,
        },
      ]).success,
    ).toBe(false);

    if (qualification.matchRule !== "published_qualification_exact") {
      throw new Error("Wrong qualification fixture.");
    }
    const wrongProgramPayload = {
      ...qualification.qualificationEvidence.programQualificationLink.payload,
      programKey: "IFC03SD",
    };
    const wrongProgramIdentity =
      programQualificationLinkIdentity(wrongProgramPayload);
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...qualification,
          qualificationEvidence: {
            ...qualification.qualificationEvidence,
            programQualificationLink: {
              identity: wrongProgramIdentity,
              payload: {
                ...wrongProgramPayload,
                identity: wrongProgramIdentity,
              },
            },
          },
        },
      ]).success,
    ).toBe(false);

    const otherOfferRequirement = qualificationRequirement("offer:other");
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...qualification,
          requirements: [otherOfferRequirement],
          qualificationEvidence: {
            ...qualification.qualificationEvidence,
            requirementId: otherOfferRequirement.id,
            sourceQuote: otherOfferRequirement.sourceQuote,
            normalizedValue: otherOfferRequirement.normalizedValue,
          },
        },
      ]).success,
    ).toBe(false);

    const forgedCanonicalRequirement = {
      ...requirement,
      normalizedValue: "Título superior inventado",
    };
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...qualification,
          requirements: [forgedCanonicalRequirement],
          qualificationEvidence: {
            ...qualification.qualificationEvidence,
            normalizedValue: forgedCanonicalRequirement.normalizedValue,
            qualification: {
              ...qualification.qualificationEvidence.qualification,
              canonicalLabel: forgedCanonicalRequirement.normalizedValue,
              acceptedLabels: [forgedCanonicalRequirement.normalizedValue],
            },
          },
        },
      ]).success,
    ).toBe(false);

    const overrideOffer = offer("offer:forged-confirmation", "Perfil");
    const confirmation = createHumanConfirmation({
      offerId: overrideOffer.id,
      occupationId: OCCUPATION_ID,
      confirmationSource: "user_in_memory",
    });
    const override = matchOffersForProgram(
      "IFC03S",
      data([overrideOffer], [], [confirmation]),
    )[0];
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...override,
          confirmationEvidence:
            "confirmationEvidence" in override
              ? {
                  ...override.confirmationEvidence,
                  identity: "confirmation:forged",
                }
              : undefined,
        },
      ]).success,
    ).toBe(false);
    expect(
      OfferMatchesSchema.safeParse([
        {
          ...override,
          confirmationEvidence: undefined,
        },
      ]).success,
    ).toBe(false);
  });

  it("rejects an unreviewed qualification catalog and missing live program keys", () => {
    const unreviewed: ReviewedQualification = {
      catalogId: "qualification:unreviewed",
      canonicalLabel: "Título sin revisar",
      acceptedLabels: ["Título sin revisar"],
      reviewedAt: "2026-08-05",
      reviewBasis: "fixture_control",
    };
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([]),
        qualifications: [unreviewed],
      }),
    ).toThrow(/qualification.*dangling/i);
    expect(() =>
      matchOffersForProgram("IFC03S", {
        ...data([]),
        programs: programs.filter(({ programKey }) => programKey !== "IFC03S"),
      }),
    ).toThrow(/program.*dangling/i);
  });
});
