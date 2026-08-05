import { describe, expect, it } from "vitest";

import curatedProcedureCatalog from "../../data/curated/official-procedures.json";
import type { JobOffer } from "../../data/schemas/generated";
import {
  publishedRequirementId,
  type PublishedRequirement,
} from "./requirements";
import {
  OfficialProcedureCatalogSchema,
  ReliableActionSchema,
  deriveActions,
} from "./actionEngine";

const offer: JobOffer = {
  id: "offer:1",
  title: "Administrativo",
  province: "León",
  locality: "León",
  publishedAt: "2026-08-01T00:00:00.000Z",
  sourceName: "ECYL",
  descriptionText: "Oferta oficial",
  descriptionSections: {
    summary: [],
    functions: [],
    requirements: [],
    conditions: [],
    application: [],
    other: [],
  },
  originalUrl: "https://empleo.jcyl.es/oferta/1",
  sourceSnapshot: {
    sourceId: "ofertas-de-empleo",
    sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
    sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
    snapshotFetchedAt: "2026-08-02T00:00:00.000Z",
    schemaVersion: "1.0.0",
    recordCount: 1,
    sha256: "a".repeat(64),
    qualityStatus: "passed",
  },
};

function requirement(
  category:
    | "qualification_or_specialization"
    | "experience"
    | "driving_license_or_vehicle"
    | "certificate_or_regulated_license"
    | "language"
    | "schedule_availability"
    | "mobility_or_work_mode",
  normalizedValue: string | number,
  parserRule:
    | "qualification.official_title"
    | "experience.months"
    | "license.driving_b"
    | "certificate.food_handler"
    | "language.cefr"
    | "schedule.weekends"
    | "work_mode.remote"
    | "work_mode.hybrid"
    | "work_mode.on_site"
    | "mobility.travel",
): PublishedRequirement {
  const sourceQuote = `Requisito ${String(normalizedValue)}`;
  return {
    id: publishedRequirementId(offer.id, category, sourceQuote),
    category,
    normalizedValue,
    sourceQuote,
    parserRule,
    parserVersion: "1.0.0",
  } as PublishedRequirement;
}

const baseContext = {
  offer,
  evidenceState: "explicit_fit" as const,
  requirements: [] as PublishedRequirement[],
  answers: {},
  selectedProvince: null,
  isSelectedProvinceSuitable: null,
  programKey: "ADG01M",
  officialProcedures: [],
};

describe("ReliableActionSchema", () => {
  it("validates all seven members produced from their exact triggers", () => {
    const experience = requirement("experience", 12, "experience.months");
    const qualification = requirement(
      "qualification_or_specialization",
      "Técnico en Gestión Administrativa",
      "qualification.official_title",
    );
    const credential = requirement(
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    const onSite = requirement(
      "mobility_or_work_mode",
      "on_site",
      "work_mode.on_site",
    );
    const procedureCatalog = OfficialProcedureCatalogSchema.parse([
      {
        id: "procedure:food-handler-cyl",
        requirementCategory: "certificate_or_regulated_license",
        normalizedValue: "food_handler",
        title: "Información oficial sobre manipulación de alimentos",
        href: "https://www.saludcastillayleon.es/seguridadalimentaria/es/higiene-alimentaria",
        reviewedAt: "2026-08-05",
        sourceNote: "Página oficial revisada manualmente para esta prueba.",
        catalogVersion: "1.0.0",
      },
    ]);
    const contexts = [
      baseContext,
      {
        ...baseContext,
        evidenceState: "occupational_relationship_incomplete" as const,
      },
      {
        ...baseContext,
        requirements: [onSite],
        selectedProvince: "Valladolid",
        isSelectedProvinceSuitable: false,
      },
      {
        ...baseContext,
        evidenceState: "declared_explicit_gap" as const,
        requirements: [experience],
        answers: { [experience.id]: "lacks" as const },
      },
      {
        ...baseContext,
        evidenceState: "declared_explicit_gap" as const,
        requirements: [qualification],
        answers: { [qualification.id]: "lacks" as const },
      },
      {
        ...baseContext,
        evidenceState: "declared_explicit_gap" as const,
        requirements: [credential],
        answers: { [credential.id]: "lacks" as const },
        officialProcedures: procedureCatalog,
      },
      {
        ...baseContext,
        evidenceState: "declared_explicit_gap" as const,
        requirements: [credential],
        answers: { [credential.id]: "lacks" as const },
      },
    ];
    const actions = contexts.flatMap((context) => deriveActions(context));
    const produced = new Map(
      actions.map((action) => [
        action.actionType,
        ReliableActionSchema.parse(action),
      ]),
    );
    expect([...produced.keys()].sort()).toEqual(
      [
        "open_original_offer",
        "verify_offer_requirements",
        "adjust_search_area",
        "explore_unpublished_requirement",
        "view_regulated_training_route",
        "open_official_procedure",
        "add_session_check",
      ].sort(),
    );
  });

  it("validates the deliberately empty curated catalog", () => {
    expect(
      OfficialProcedureCatalogSchema.parse(curatedProcedureCatalog),
    ).toEqual([]);
  });

  it("rejects an invalid action/target pairing and extra target fields", () => {
    const open = deriveActions(baseContext).find(
      (action) => action.actionType === "open_original_offer",
    );
    expect(
      ReliableActionSchema.safeParse({
        ...open,
        targetKind: "regulated_training",
        datasetKey: "oferta-de-formacion-profesional",
        programKey: "ADG01M",
      }).success,
    ).toBe(false);
  });
});

describe("deriveActions", () => {
  it("always opens the exact original offer", () => {
    expect(deriveActions(baseContext)).toContainEqual(
      expect.objectContaining({
        actionType: "open_original_offer",
        href: offer.originalUrl,
        offerId: offer.id,
      }),
    );
  });

  it("sends incomplete requirement verification to the original offer first", () => {
    expect(
      deriveActions({
        ...baseContext,
        evidenceState: "occupational_relationship_incomplete",
      })[0],
    ).toMatchObject({
      actionType: "verify_offer_requirements",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      href: offer.originalUrl,
    });
  });

  it("routes an unclassified published statement to exact offer verification", () => {
    const sourceQuote = "Se valorarán capacidades adecuadas.";
    const unclassified: PublishedRequirement = {
      id: publishedRequirementId(offer.id, "unclassified", sourceQuote),
      category: "unclassified",
      normalizedValue: null,
      sourceQuote,
      parserRule: "unclassified.conservative_fallback",
      parserVersion: "1.0.0",
    };
    expect(
      deriveActions({ ...baseContext, requirements: [unclassified] })[0],
    ).toMatchObject({
      actionType: "verify_offer_requirements",
      reason: "unclassified_requirement",
      href: offer.originalUrl,
      requirementAudit: { requirementId: unclassified.id, sourceQuote },
    });
  });

  it("sends a missing qualification to the official regulated FP route", () => {
    const missing = requirement(
      "qualification_or_specialization",
      "Técnico en Gestión Administrativa",
      "qualification.official_title",
    );
    expect(
      deriveActions({
        ...baseContext,
        evidenceState: "declared_explicit_gap",
        requirements: [missing],
        answers: { [missing.id]: "lacks" },
      }),
    ).toContainEqual(
      expect.objectContaining({
        actionType: "view_regulated_training_route",
        targetKind: "regulated_training",
        datasetKey: "oferta-de-formacion-profesional",
        programKey: "ADG01M",
        requirementAudit: expect.objectContaining({
          requirementId: missing.id,
          sourceQuote: missing.sourceQuote,
          parserRule: missing.parserRule,
        }),
      }),
    );
  });

  it("uses the mandatory not-published wording and filter semantics", () => {
    const experience = requirement("experience", 12, "experience.months");
    const action = deriveActions({
      ...baseContext,
      evidenceState: "declared_explicit_gap",
      requirements: [experience],
      answers: { [experience.id]: "lacks" },
    }).find(
      (candidate) => candidate.actionType === "explore_unpublished_requirement",
    );
    expect(action).toMatchObject({
      label: "Ver ofertas relacionadas donde no se publica este requisito",
      filter: {
        publicationState: "not_published",
        category: "experience",
        normalizedValue: 12,
      },
    });
  });

  it.each([
    ["experience", 12, "experience.months"],
    ["language", "inglés:B2", "language.cefr"],
    ["schedule_availability", "weekends", "schedule.weekends"],
    ["mobility_or_work_mode", "travel", "mobility.travel"],
  ] as const)(
    "routes a declared %s gap to offers where that requirement is not published",
    (category, normalizedValue, parserRule) => {
      const gap = requirement(category, normalizedValue, parserRule);
      expect(
        deriveActions({
          ...baseContext,
          evidenceState: "declared_explicit_gap",
          requirements: [gap],
          answers: { [gap.id]: "lacks" },
        }),
      ).toContainEqual(
        expect.objectContaining({
          actionType: "explore_unpublished_requirement",
          filter: {
            publicationState: "not_published",
            category,
            normalizedValue,
          },
        }),
      );
    },
  );

  it.each([
    ["driving_license_or_vehicle", "B", "license.driving_b"],
    [
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    ],
  ] as const)(
    "falls back safely for an unmapped exact %s requirement",
    (category, normalizedValue, parserRule) => {
      const gap = requirement(category, normalizedValue, parserRule);
      expect(
        deriveActions({
          ...baseContext,
          evidenceState: "declared_explicit_gap",
          requirements: [gap],
          answers: { [gap.id]: "lacks" },
        }).map((action) => action.actionType),
      ).toEqual(["add_session_check", "open_original_offer"]);
    },
  );

  it("requires an exact curated procedure match and preserves its review evidence", () => {
    const credential = requirement(
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    const procedures = OfficialProcedureCatalogSchema.parse([
      {
        id: "procedure:food-handler-cyl",
        requirementCategory: "certificate_or_regulated_license",
        normalizedValue: "food_handler",
        title: "Información oficial sobre manipulación de alimentos",
        href: "https://www.saludcastillayleon.es/seguridadalimentaria/es/higiene-alimentaria",
        reviewedAt: "2026-08-05",
        sourceNote:
          "Página oficial de la Junta de Castilla y León revisada manualmente.",
        catalogVersion: "1.0.0",
      },
    ]);
    const action = deriveActions({
      ...baseContext,
      evidenceState: "declared_explicit_gap",
      requirements: [credential],
      answers: { [credential.id]: "lacks" },
      officialProcedures: procedures,
    }).find((candidate) => candidate.actionType === "open_official_procedure");
    expect(action).toMatchObject({
      procedureAudit: {
        procedureId: "procedure:food-handler-cyl",
        reviewedAt: "2026-08-05",
        catalogVersion: "1.0.0",
        sourceNote: expect.any(String),
      },
    });
  });

  it("falls back to a session check when no exact procedure is reviewed", () => {
    const credential = requirement(
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    expect(
      deriveActions({
        ...baseContext,
        evidenceState: "declared_explicit_gap",
        requirements: [credential],
        answers: { [credential.id]: "lacks" },
      }),
    ).toContainEqual(
      expect.objectContaining({
        actionType: "add_session_check",
        explanation: "No hay una acción automática fiable disponible.",
      }),
    );
  });

  it("ignores stale answer IDs when deriving targeted actions", () => {
    expect(
      deriveActions({
        ...baseContext,
        evidenceState: "declared_explicit_gap",
        answers: {
          [`requirement:${"a".repeat(64)}`]: "lacks",
        },
      }).map((action) => action.actionType),
    ).toEqual(["add_session_check", "open_original_offer"]);
  });

  it.each(["remote", "hybrid"] as const)(
    "suppresses a location action for explicit %s evidence",
    (mode) => {
      const mobility = requirement(
        "mobility_or_work_mode",
        mode,
        mode === "remote" ? "work_mode.remote" : "work_mode.hybrid",
      );
      expect(
        deriveActions({
          ...baseContext,
          requirements: [mobility],
          selectedProvince: "Valladolid",
          isSelectedProvinceSuitable: false,
        }).map((action) => action.actionType),
      ).not.toContain("adjust_search_area");
    },
  );

  it("creates a location action only from exact on-site evidence", () => {
    const onSite = requirement(
      "mobility_or_work_mode",
      "on_site",
      "work_mode.on_site",
    );
    expect(
      deriveActions({
        ...baseContext,
        requirements: [onSite],
        selectedProvince: "Valladolid",
        isSelectedProvinceSuitable: false,
      }),
    ).toContainEqual(
      expect.objectContaining({
        actionType: "adjust_search_area",
        selectedProvince: "Valladolid",
        mobilityRequirementAudit: expect.objectContaining({
          requirementId: onSite.id,
        }),
      }),
    );
  });

  it("does not infer location suitability when modality is unknown", () => {
    const actions = deriveActions({
      ...baseContext,
      selectedProvince: "Valladolid",
      isSelectedProvinceSuitable: false,
    });
    expect(actions.map((action) => action.actionType)).not.toContain(
      "adjust_search_area",
    );
    expect(actions.map((action) => action.actionType)).toContain(
      "verify_offer_requirements",
    );
  });

  it("deduplicates actions and applies the closed priority deterministically", () => {
    const first = requirement("experience", 12, "experience.months");
    const second = requirement("experience", 12, "experience.months");
    const context = {
      ...baseContext,
      evidenceState: "declared_explicit_gap" as const,
      requirements: [first, second],
      answers: { [first.id]: "lacks" as const },
    };
    expect(deriveActions(context)).toEqual(deriveActions(context));
    expect(deriveActions(context).map((action) => action.actionType)).toEqual([
      "explore_unpublished_requirement",
      "open_original_offer",
    ]);
  });
});
