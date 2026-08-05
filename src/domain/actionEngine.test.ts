import { describe, expect, it } from "vitest";

import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import curatedProcedureCatalog from "../../data/curated/official-procedures.json";
import type { JobOffer } from "../../data/schemas/generated";
import {
  OfficialProcedureCatalogSchema,
  ReliableActionPayloadSchema,
  ReliableActionSchema,
  deriveActions,
  officialProcedureIdentity,
  type ActionContext,
  type ReliableAction,
} from "./actionEngine";
import {
  publishedRequirementId,
  type PublishedRequirement,
} from "./requirements";

function jobOffer(id = "offer:1"): JobOffer {
  return {
    id,
    title: "Oferta revisada",
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
    originalUrl: `https://empleo.jcyl.es/oferta/${id.replace("offer:", "")}`,
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
}

function requirement(
  offerId: string,
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
    id: publishedRequirementId(offerId, category, sourceQuote),
    category,
    normalizedValue,
    sourceQuote,
    parserRule,
    parserVersion: "1.0.0",
  } as PublishedRequirement;
}

const offer = jobOffer();
const publishedExperience = requirement(
  offer.id,
  "experience",
  12,
  "experience.months",
);
const baseContext: ActionContext = {
  offer,
  evidenceState: "explicit_fit",
  requirements: [publishedExperience],
  answers: {},
  selectedProvince: null,
  isSelectedProvinceSuitable: null,
};

function declaredGap(gap: PublishedRequirement): ActionContext {
  return {
    ...baseContext,
    evidenceState: "declared_explicit_gap",
    requirements: [gap],
    answers: { [gap.id]: "lacks" },
  };
}

function findAction<T extends ReliableAction["actionType"]>(
  actions: ReliableAction[],
  actionType: T,
): Extract<ReliableAction, { actionType: T }> {
  const action = actions.find(
    (candidate) => candidate.actionType === actionType,
  );
  if (!action) throw new Error(`Missing ${actionType}`);
  return action as Extract<ReliableAction, { actionType: T }>;
}

describe("closed trusted action contract", () => {
  it("produces and validates all seven action members from exact triggers", () => {
    const onSite = requirement(
      offer.id,
      "mobility_or_work_mode",
      "on_site",
      "work_mode.on_site",
    );
    const daw = requirement(
      offer.id,
      "qualification_or_specialization",
      "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      "qualification.official_title",
    );
    const drivingB = requirement(
      offer.id,
      "driving_license_or_vehicle",
      "B",
      "license.driving_b",
    );
    const foodHandler = requirement(
      offer.id,
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    const actions = [
      ...deriveActions(baseContext),
      ...deriveActions({
        ...baseContext,
        evidenceState: "occupational_relationship_incomplete",
      }),
      ...deriveActions({
        ...baseContext,
        requirements: [onSite],
        selectedProvince: "Valladolid",
        isSelectedProvinceSuitable: false,
      }),
      ...deriveActions(declaredGap(publishedExperience)),
      ...deriveActions(declaredGap(daw)),
      ...deriveActions(declaredGap(drivingB)),
      ...deriveActions(declaredGap(foodHandler)),
    ];
    const produced = new Set(
      actions.map((action) => ReliableActionSchema.parse(action).actionType),
    );
    expect([...produced].sort()).toEqual(
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

  it("parses the one static DGT procedure with its deterministic full-payload ID", () => {
    const catalog = OfficialProcedureCatalogSchema.parse(
      curatedProcedureCatalog,
    );
    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toMatchObject({
      requirementCategory: "driving_license_or_vehicle",
      normalizedValue: "B",
      title: "Solicitud examen teórico por libre",
      href: "https://sede.dgt.gob.es/es/permisos-de-conducir/obtencion-y-gestion-de-permisos/solicitud-de-prueba-de-aptitud-de-examen/",
    });
    expect(catalog[0].id).toBe(officialProcedureIdentity(catalog[0]));
  });

  it.each([
    "id",
    "requirementCategory",
    "normalizedValue",
    "href",
    "sourceNote",
  ])("rejects a procedure action with forged %s", (field) => {
    const drivingB = requirement(
      offer.id,
      "driving_license_or_vehicle",
      "B",
      "license.driving_b",
    );
    const action = findAction(
      deriveActions(declaredGap(drivingB)),
      "open_official_procedure",
    );
    const forged = structuredClone(action);
    Object.assign(forged.procedureAudit, {
      [field]: field === "normalizedValue" ? "C" : "forged",
    });
    expect(ReliableActionPayloadSchema.safeParse(forged).success).toBe(false);
  });

  it("rejects invalid target pairings and extra target fields", () => {
    const open = findAction(deriveActions(baseContext), "open_original_offer");
    expect(
      ReliableActionPayloadSchema.safeParse({
        ...open,
        targetKind: "regulated_training",
        datasetKey: "oferta-de-formacion-profesional",
        programKeys: ["IFC03S"],
      }).success,
    ).toBe(false);
  });

  it("rejects a forged program key on an otherwise valid training action", () => {
    const daw = requirement(
      offer.id,
      "qualification_or_specialization",
      "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      "qualification.official_title",
    );
    const action = findAction(
      deriveActions(declaredGap(daw)),
      "view_regulated_training_route",
    );
    expect(
      ReliableActionPayloadSchema.safeParse({
        ...action,
        programKeys: ["ADG01M"],
      }).success,
    ).toBe(false);
  });

  it("separates a valid payload from an engine-issued action", () => {
    const drivingB = requirement(
      offer.id,
      "driving_license_or_vehicle",
      "B",
      "license.driving_b",
    );
    const issued = findAction(
      deriveActions(declaredGap(drivingB)),
      "open_official_procedure",
    );
    const clone = structuredClone(issued);
    expect(ReliableActionPayloadSchema.safeParse(clone).success).toBe(true);
    expect(ReliableActionSchema.safeParse(clone).success).toBe(false);
    expect(ReliableActionSchema.parse(issued)).toBe(issued);
  });

  it("rejects exact DGT reconstructions and cross-offer requoting as unissued", () => {
    const drivingB = requirement(
      offer.id,
      "driving_license_or_vehicle",
      "B",
      "license.driving_b",
    );
    const issued = findAction(
      deriveActions(declaredGap(drivingB)),
      "open_official_procedure",
    );
    const exactReconstruction = JSON.parse(JSON.stringify(issued));
    expect(
      ReliableActionPayloadSchema.safeParse(exactReconstruction).success,
    ).toBe(true);
    expect(ReliableActionSchema.safeParse(exactReconstruction).success).toBe(
      false,
    );

    const fabricatedOfferId = "offer:fabricated";
    const fabricatedQuote = "Requisito B inventado";
    const crossOffer = {
      ...exactReconstruction,
      offerId: fabricatedOfferId,
      requirementAudit: {
        ...exactReconstruction.requirementAudit,
        requirementId: publishedRequirementId(
          fabricatedOfferId,
          "driving_license_or_vehicle",
          fabricatedQuote,
        ),
        sourceQuote: fabricatedQuote,
      },
    };
    expect(ReliableActionPayloadSchema.safeParse(crossOffer).success).toBe(
      true,
    );
    expect(ReliableActionSchema.safeParse(crossOffer).success).toBe(false);
  });

  it("deep-freezes issued actions and all nested evidence", () => {
    const food = requirement(
      offer.id,
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    const action = findAction(
      deriveActions(declaredGap(food)),
      "add_session_check",
    );
    expect(Object.isFrozen(action)).toBe(true);
    expect(Object.isFrozen(action.requirementAudit)).toBe(true);
    expect(Object.isFrozen(action.checklistItem)).toBe(true);
    expect(() => {
      (action.requirementAudit as { sourceQuote: string }).sourceQuote =
        "Mutación";
    }).toThrow(TypeError);
    expect(() => {
      (action.checklistItem as { label: string }).label = "Mutación";
    }).toThrow(TypeError);
    expect(ReliableActionSchema.parse(action)).toBe(action);

    const daw = requirement(
      offer.id,
      "qualification_or_specialization",
      "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      "qualification.official_title",
    );
    const training = findAction(
      deriveActions(declaredGap(daw)),
      "view_regulated_training_route",
    );
    expect(Object.isFrozen(training.programKeys)).toBe(true);
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

  it("verifies an empty publication even when the occupational fit is exact", () => {
    expect(
      deriveActions({ ...baseContext, requirements: [] })[0],
    ).toMatchObject({
      actionType: "verify_offer_requirements",
      reason: "requirements_not_published",
      href: offer.originalUrl,
    });
  });

  it("verifies incomplete and all-unclassified publication evidence", () => {
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
      requirementAudit: { requirementId: unclassified.id, sourceQuote },
    });
  });

  it("resolves a DAW qualification only through approved reviewed links", () => {
    const daw = requirement(
      offer.id,
      "qualification_or_specialization",
      "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      "qualification.official_title",
    );
    expect(
      findAction(
        deriveActions(declaredGap(daw)),
        "view_regulated_training_route",
      ),
    ).toMatchObject({
      datasetKey: "oferta-de-formacion-profesional",
      programKeys: ["IFC03S", "IFC03SD"],
    });
  });

  it.each([
    ["Grado en Derecho", "IFC03S"],
    ["Grado en Enfermería", "ADG01M"],
    ["Técnico en Cuidados Auxiliares de Enfermería", "IFC03SD"],
  ])(
    "does not copy a wrong input program for unlinked qualification %s",
    (label, wrongProgram) => {
      expect(
        REVIEWED_QUALIFICATIONS.some(
          ({ canonicalLabel }) => canonicalLabel === label,
        ),
      ).toBe(true);
      const gap = requirement(
        offer.id,
        "qualification_or_specialization",
        label,
        "qualification.official_title",
      );
      const forgedLegacyContext = {
        ...declaredGap(gap),
        programKey: wrongProgram,
      } as unknown as ActionContext;
      expect(
        deriveActions(forgedLegacyContext).map(({ actionType }) => actionType),
      ).toEqual(["add_session_check", "open_original_offer"]);
    },
  );

  it("uses the static exact DGT route for an explicit missing driving B requirement", () => {
    const drivingB = requirement(
      offer.id,
      "driving_license_or_vehicle",
      "B",
      "license.driving_b",
    );
    const action = findAction(
      deriveActions(declaredGap(drivingB)),
      "open_official_procedure",
    );
    expect(action.procedureAudit).toMatchObject({
      requirementCategory: "driving_license_or_vehicle",
      normalizedValue: "B",
      title: "Solicitud examen teórico por libre",
      reviewedAt: "2026-08-05",
      catalogVersion: "1.0.0",
    });
    expect(action.href).toBe(action.procedureAudit.href);
  });

  it("falls back when no exact static procedure exists", () => {
    const credential = requirement(
      offer.id,
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    expect(
      deriveActions(declaredGap(credential)).map(
        ({ actionType }) => actionType,
      ),
    ).toEqual(["add_session_check", "open_original_offer"]);
  });

  it("ignores a caller-injected procedure catalog", () => {
    const credential = requirement(
      offer.id,
      "certificate_or_regulated_license",
      "food_handler",
      "certificate.food_handler",
    );
    const payload = {
      requirementCategory: "certificate_or_regulated_license" as const,
      normalizedValue: "food_handler",
      title: "Ruta inyectada",
      href: "https://example.com/forged",
      reviewedAt: "2026-08-05",
      sourceNote:
        "Contenido externo que no pertenece al catálogo estático revisado.",
      catalogVersion: "1.0.0",
    };
    const injected = {
      ...payload,
      id: officialProcedureIdentity(payload),
    };
    const legacyInjectedContext = {
      ...declaredGap(credential),
      officialProcedures: [injected],
    } as unknown as ActionContext;
    expect(
      deriveActions(legacyInjectedContext).map(({ actionType }) => actionType),
    ).toEqual(["add_session_check", "open_original_offer"]);
  });

  it.each([
    ["experience", 12, "experience.months"],
    ["language", "inglés:B2", "language.cefr"],
    ["schedule_availability", "weekends", "schedule.weekends"],
    ["mobility_or_work_mode", "travel", "mobility.travel"],
  ] as const)(
    "routes a declared %s gap only to offers where it is not published",
    (category, normalizedValue, parserRule) => {
      const gap = requirement(offer.id, category, normalizedValue, parserRule);
      expect(
        findAction(
          deriveActions(declaredGap(gap)),
          "explore_unpublished_requirement",
        ),
      ).toMatchObject({
        label: "Ver ofertas relacionadas donde no se publica este requisito",
        filter: {
          publicationState: "not_published",
          category,
          normalizedValue,
        },
      });
    },
  );

  it("ignores stale answer IDs", () => {
    expect(
      deriveActions({
        ...baseContext,
        evidenceState: "declared_explicit_gap",
        answers: { [`requirement:${"a".repeat(64)}`]: "lacks" },
      }).map(({ actionType }) => actionType),
    ).toEqual(["add_session_check", "open_original_offer"]);
  });

  it.each(["remote", "hybrid"] as const)(
    "suppresses location adjustment for explicit %s evidence",
    (mode) => {
      const mobility = requirement(
        offer.id,
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
        }).map(({ actionType }) => actionType),
      ).not.toContain("adjust_search_area");
    },
  );

  it("adjusts location only from exact on-site evidence", () => {
    const onSite = requirement(
      offer.id,
      "mobility_or_work_mode",
      "on_site",
      "work_mode.on_site",
    );
    expect(
      findAction(
        deriveActions({
          ...baseContext,
          requirements: [onSite],
          selectedProvince: "Valladolid",
          isSelectedProvinceSuitable: false,
        }),
        "adjust_search_area",
      ),
    ).toMatchObject({
      selectedProvince: "Valladolid",
      mobilityRequirementAudit: { requirementId: onSite.id },
    });
  });

  it("deduplicates and orders actions deterministically", () => {
    const context = {
      ...declaredGap(publishedExperience),
      requirements: [publishedExperience, publishedExperience],
    };
    expect(deriveActions(context)).toEqual(deriveActions(context));
    expect(deriveActions(context).map(({ actionType }) => actionType)).toEqual([
      "explore_unpublished_requirement",
      "open_original_offer",
    ]);
  });
});
