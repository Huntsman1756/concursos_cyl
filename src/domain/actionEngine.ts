import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { z } from "zod";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import curatedProcedureCatalog from "../../data/curated/official-procedures.json";
import { JobOfferSchema } from "../../data/schemas/generated";
import { EvidenceStateSchema, SessionAnswersSchema } from "./evidence";
import {
  PublishedRequirementSchema,
  RequirementCategorySchema,
  publishedRequirementId,
  type PublishedRequirement,
} from "./requirements";

const NonBlankStringSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, "Value must not be blank.");

const RequirementAuditSchema = z
  .object({
    requirementId: z.string().regex(/^requirement:[a-f0-9]{64}$/u),
    category: RequirementCategorySchema,
    normalizedValue: z.union([
      NonBlankStringSchema,
      z.number().positive(),
      z.null(),
    ]),
    sourceQuote: NonBlankStringSchema,
    parserRule: NonBlankStringSchema,
    parserVersion: z.literal("1.0.0"),
  })
  .strict()
  .superRefine((audit, context) => {
    const requirement = PublishedRequirementSchema.safeParse({
      id: audit.requirementId,
      category: audit.category,
      normalizedValue: audit.normalizedValue,
      sourceQuote: audit.sourceQuote,
      parserRule: audit.parserRule,
      parserVersion: audit.parserVersion,
    });
    if (!requirement.success) {
      context.addIssue({
        code: "custom",
        message:
          "Requirement audit must preserve a valid published requirement.",
      });
    }
  });

const procedureIdSchema = z.string().regex(/^procedure:[a-f0-9]{64}$/u);
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Review date must be a real calendar date.");

const OfficialProcedureIdentityInputSchema = z
  .object({
    requirementCategory: z.enum([
      "driving_license_or_vehicle",
      "certificate_or_regulated_license",
    ]),
    normalizedValue: z.union([NonBlankStringSchema, z.number().positive()]),
    title: NonBlankStringSchema,
    href: z
      .string()
      .url()
      .refine(
        (value) => value.startsWith("https://"),
        "Procedure URL must use HTTPS.",
      ),
    reviewedAt: dateOnlySchema,
    sourceNote: NonBlankStringSchema,
    catalogVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();

type OfficialProcedureIdentityInput = z.infer<
  typeof OfficialProcedureIdentityInputSchema
>;

export function officialProcedureIdentity(
  input: OfficialProcedureIdentityInput,
): string {
  const procedure = OfficialProcedureIdentityInputSchema.parse({
    requirementCategory: input.requirementCategory,
    normalizedValue: input.normalizedValue,
    title: input.title,
    href: input.href,
    reviewedAt: input.reviewedAt,
    sourceNote: input.sourceNote,
    catalogVersion: input.catalogVersion,
  });
  return shaIdentity("procedure", [
    procedure.requirementCategory,
    String(procedure.normalizedValue),
    procedure.title,
    procedure.href,
    procedure.reviewedAt,
    procedure.sourceNote,
    procedure.catalogVersion,
  ]);
}

export const OfficialProcedureSchema =
  OfficialProcedureIdentityInputSchema.safeExtend({
    id: procedureIdSchema,
  }).superRefine((procedure, context) => {
    const identityInput = OfficialProcedureIdentityInputSchema.safeParse({
      requirementCategory: procedure.requirementCategory,
      normalizedValue: procedure.normalizedValue,
      title: procedure.title,
      href: procedure.href,
      reviewedAt: procedure.reviewedAt,
      sourceNote: procedure.sourceNote,
      catalogVersion: procedure.catalogVersion,
    });
    if (
      identityInput.success &&
      procedure.id !== officialProcedureIdentity(identityInput.data)
    ) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: "Procedure identity must match its complete payload.",
      });
    }
  });

export const OfficialProcedureCatalogSchema = z
  .array(OfficialProcedureSchema)
  .superRefine((entries, context) => {
    const identities = new Set<string>();
    const matches = new Set<string>();
    entries.forEach((entry, index) => {
      if (identities.has(entry.id)) {
        context.addIssue({
          code: "custom",
          path: [index, "id"],
          message: "Procedure identities must be unique.",
        });
      }
      identities.add(entry.id);
      const matchKey = `${entry.requirementCategory}\u0000${String(entry.normalizedValue)}`;
      if (matches.has(matchKey)) {
        context.addIssue({
          code: "custom",
          path: [index, "normalizedValue"],
          message: "Procedure category and value matches must be unique.",
        });
      }
      matches.add(matchKey);
    });
  });

const OFFICIAL_PROCEDURES: readonly OfficialProcedure[] = Object.freeze(
  OfficialProcedureCatalogSchema.parse(curatedProcedureCatalog).map(
    (procedure) => Object.freeze(procedure),
  ),
);

function procedurePayload(procedure: OfficialProcedure): string {
  return JSON.stringify(procedure);
}

function isExactStaticProcedure(procedure: OfficialProcedure): boolean {
  return OFFICIAL_PROCEDURES.some(
    (candidate) => procedurePayload(candidate) === procedurePayload(procedure),
  );
}

const actionBase = {
  offerId: NonBlankStringSchema,
} as const;

const OpenOriginalOfferActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("open_original_offer"),
    targetKind: z.literal("external_offer"),
    datasetKey: z.literal("ofertas-de-empleo"),
    label: z.literal("Abrir oferta original"),
    href: z.string().url(),
  })
  .strict();

const VerifyOfferRequirementsActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("verify_offer_requirements"),
    targetKind: z.literal("external_offer"),
    datasetKey: z.literal("ofertas-de-empleo"),
    label: z.literal("Comprobar requisitos en la oferta"),
    href: z.string().url(),
    reason: z.enum([
      "requirements_not_published",
      "requirements_incomplete",
      "unclassified_requirement",
      "work_mode_unknown",
    ]),
    requirementAudit: RequirementAuditSchema.optional(),
  })
  .strict();

const AdjustSearchAreaActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("adjust_search_area"),
    targetKind: z.literal("internal_filter"),
    datasetKey: z.literal("ofertas-de-empleo"),
    label: z.literal("Cambiar zona de búsqueda"),
    selectedProvince: NonBlankStringSchema,
    filter: z
      .object({
        provinceOperation: z.literal("change"),
        workModeEvidence: z.literal("on_site_or_geographic"),
      })
      .strict(),
    mobilityRequirementAudit: RequirementAuditSchema,
  })
  .strict();

const ExploreUnpublishedRequirementActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("explore_unpublished_requirement"),
    targetKind: z.literal("internal_offer_search"),
    datasetKey: z.literal("ofertas-de-empleo"),
    label: z.literal(
      "Ver ofertas relacionadas donde no se publica este requisito",
    ),
    filter: z
      .object({
        publicationState: z.literal("not_published"),
        category: RequirementCategorySchema.exclude(["unclassified"]),
        normalizedValue: z.union([NonBlankStringSchema, z.number().positive()]),
      })
      .strict(),
    requirementAudit: RequirementAuditSchema,
  })
  .strict();

const ViewRegulatedTrainingRouteActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("view_regulated_training_route"),
    targetKind: z.literal("regulated_training"),
    datasetKey: z.literal("oferta-de-formacion-profesional"),
    label: z.literal("Ver ruta formativa y centros"),
    programKeys: z
      .array(NonBlankStringSchema)
      .min(1)
      .superRefine((keys, context) => {
        if (
          new Set(keys).size !== keys.length ||
          [...keys]
            .sort((left, right) => left.localeCompare(right, "es"))
            .join("\u0000") !== keys.join("\u0000")
        ) {
          context.addIssue({
            code: "custom",
            message: "Training program keys must be unique and sorted.",
          });
        }
      }),
    requirementAudit: RequirementAuditSchema,
  })
  .strict()
  .superRefine((action, context) => {
    const requirement = publishedRequirementFromAudit(action.requirementAudit);
    const expectedProgramKeys = requirement
      ? exactReviewedProgramKeys(requirement)
      : [];
    if (
      requirement === undefined ||
      requirement.id !==
        publishedRequirementId(
          action.offerId,
          requirement.category,
          requirement.sourceQuote,
        ) ||
      expectedProgramKeys.join("\u0000") !== action.programKeys.join("\u0000")
    ) {
      context.addIssue({
        code: "custom",
        path: ["programKeys"],
        message:
          "Training route must match the exact approved qualification links.",
      });
    }
  });

const OpenOfficialProcedureActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("open_official_procedure"),
    targetKind: z.literal("official_procedure"),
    datasetKey: z.literal("official-procedures"),
    label: z.literal("Consultar trámite oficial"),
    title: NonBlankStringSchema,
    href: z.string().url(),
    requirementAudit: RequirementAuditSchema,
    procedureAudit: OfficialProcedureSchema,
  })
  .strict()
  .superRefine((action, context) => {
    if (
      !isExactStaticProcedure(action.procedureAudit) ||
      action.href !== action.procedureAudit.href ||
      action.title !== action.procedureAudit.title
    ) {
      context.addIssue({
        code: "custom",
        path: ["procedureAudit"],
        message: "Procedure action must be an exact static catalog member.",
      });
    }
    if (
      action.requirementAudit.requirementId !==
        publishedRequirementId(
          action.offerId,
          action.requirementAudit.category,
          action.requirementAudit.sourceQuote,
        ) ||
      action.requirementAudit.category !==
        action.procedureAudit.requirementCategory ||
      action.requirementAudit.normalizedValue !==
        action.procedureAudit.normalizedValue
    ) {
      context.addIssue({
        code: "custom",
        path: ["requirementAudit"],
        message: "Procedure action must match its exact offer requirement.",
      });
    }
  });

const SessionChecklistItemSchema = z
  .object({
    id: z.string().regex(/^check:[a-f0-9]{64}$/u),
    offerId: NonBlankStringSchema,
    requirementId: z
      .string()
      .regex(/^requirement:[a-f0-9]{64}$/u)
      .optional(),
    sourceActionType: z.literal("add_session_check"),
    label: NonBlankStringSchema,
  })
  .strict();

const AddSessionCheckActionSchema = z
  .object({
    ...actionBase,
    actionType: z.literal("add_session_check"),
    targetKind: z.literal("in_memory_checklist"),
    datasetKey: z.literal("browser-memory"),
    label: z.literal("Añadir a comprobaciones de esta sesión"),
    explanation: z.literal("No hay una acción automática fiable disponible."),
    checklistItem: SessionChecklistItemSchema,
    requirementAudit: RequirementAuditSchema.optional(),
  })
  .strict()
  .superRefine((action, context) => {
    const expected = sessionChecklistId(
      action.offerId,
      action.requirementAudit?.requirementId,
    );
    if (
      action.checklistItem.id !== expected ||
      action.checklistItem.offerId !== action.offerId ||
      action.checklistItem.requirementId !==
        action.requirementAudit?.requirementId
    ) {
      context.addIssue({
        code: "custom",
        path: ["checklistItem"],
        message: "Checklist identity must match its public action evidence.",
      });
    }
    const expectedLabel = action.requirementAudit
      ? `Comprobar «${action.requirementAudit.sourceQuote}» en la oferta oficial`
      : "Comprobar manualmente la oferta oficial";
    if (action.checklistItem.label !== expectedLabel) {
      context.addIssue({
        code: "custom",
        path: ["checklistItem", "label"],
        message: "Checklist label must be the source-backed action copy.",
      });
    }
  });

export const ReliableActionPayloadSchema = z.discriminatedUnion("actionType", [
  OpenOriginalOfferActionSchema,
  VerifyOfferRequirementsActionSchema,
  AdjustSearchAreaActionSchema,
  ExploreUnpublishedRequirementActionSchema,
  ViewRegulatedTrainingRouteActionSchema,
  OpenOfficialProcedureActionSchema,
  AddSessionCheckActionSchema,
]);

const ReliableActionPayloadsSchema = z.array(ReliableActionPayloadSchema);

export type OfficialProcedure = z.infer<typeof OfficialProcedureSchema>;
export type ReliableActionPayload = z.infer<typeof ReliableActionPayloadSchema>;
declare const engineIssuedActionBrand: unique symbol;
type EngineIssuedActionBrand = {
  readonly [engineIssuedActionBrand]: "engine-issued-reliable-action";
};
export type ReliableAction = ReliableActionPayload & EngineIssuedActionBrand;
type AddSessionCheckActionPayload = z.infer<typeof AddSessionCheckActionSchema>;
export type AddSessionCheckAction = AddSessionCheckActionPayload &
  EngineIssuedActionBrand;
export type SessionChecklistItem = z.infer<typeof SessionChecklistItemSchema>;

const issuedActionFingerprints = new WeakMap<object, string>();

function canonicalPayload(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalPayload(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalPayload(record[key])}`)
    .join(",")}}`;
}

function actionFingerprint(action: ReliableActionPayload): string {
  return shaIdentity("issued-action", [canonicalPayload(action)]);
}

function isIssuedReliableAction(value: unknown): value is ReliableAction {
  if (typeof value !== "object" || value === null) return false;
  const expectedFingerprint = issuedActionFingerprints.get(value);
  if (expectedFingerprint === undefined) return false;
  const payload = ReliableActionPayloadSchema.safeParse(value);
  return (
    payload.success &&
    Object.isFrozen(value) &&
    actionFingerprint(payload.data) === expectedFingerprint
  );
}

export const ReliableActionSchema = z.custom<ReliableAction>(
  isIssuedReliableAction,
  "Action must be an intact engine-issued object.",
);

export const ReliableActionsSchema = z.array(ReliableActionSchema);

export interface ActionContext {
  offer: z.infer<typeof JobOfferSchema>;
  evidenceState: z.infer<typeof EvidenceStateSchema>;
  requirements: readonly PublishedRequirement[];
  answers: Readonly<
    Record<string, z.infer<typeof SessionAnswersSchema>[string]>
  >;
  selectedProvince?: string | null;
  isSelectedProvinceSuitable?: boolean | null;
}

function shaIdentity(namespace: string, values: readonly string[]): string {
  const payload = values.join("\u0000");
  return `${namespace}:${bytesToHex(sha256(utf8ToBytes(payload)))}`;
}

export function sessionChecklistId(
  offerId: string,
  requirementId?: string,
): string {
  return shaIdentity("check", [
    offerId,
    requirementId ?? "no-requirement",
    "add_session_check",
  ]);
}

function auditRequirement(requirement: PublishedRequirement) {
  return {
    requirementId: requirement.id,
    category: requirement.category,
    normalizedValue: requirement.normalizedValue,
    sourceQuote: requirement.sourceQuote,
    parserRule: requirement.parserRule,
    parserVersion: requirement.parserVersion,
  };
}

function publishedRequirementFromAudit(
  audit: z.infer<typeof RequirementAuditSchema>,
): PublishedRequirement | undefined {
  const result = PublishedRequirementSchema.safeParse({
    id: audit.requirementId,
    category: audit.category,
    normalizedValue: audit.normalizedValue,
    sourceQuote: audit.sourceQuote,
    parserRule: audit.parserRule,
    parserVersion: audit.parserVersion,
  });
  return result.success ? result.data : undefined;
}

function isCanonicalRequirement(
  offerId: string,
  requirement: PublishedRequirement,
): boolean {
  return (
    requirement.id ===
    publishedRequirementId(
      offerId,
      requirement.category,
      requirement.sourceQuote,
    )
  );
}

function exactProcedure(
  requirement: PublishedRequirement,
): OfficialProcedure | undefined {
  return OFFICIAL_PROCEDURES.find(
    (procedure) =>
      procedure.requirementCategory === requirement.category &&
      procedure.normalizedValue === requirement.normalizedValue,
  );
}

function exactReviewedProgramKeys(requirement: PublishedRequirement): string[] {
  if (requirement.category !== "qualification_or_specialization") return [];
  const qualification = REVIEWED_QUALIFICATIONS.find(
    ({ canonicalLabel }) => canonicalLabel === requirement.normalizedValue,
  );
  if (!qualification) return [];
  return REVIEWED_PROGRAM_QUALIFICATION_LINKS.filter(
    (link) =>
      link.reviewStatus === "approved" &&
      link.qualificationCatalogId === qualification.catalogId,
  )
    .map(({ programKey }) => programKey)
    .sort((left, right) => left.localeCompare(right, "es"));
}

function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return value;
  const prototype = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    throw new TypeError("Issued action payloads must contain only plain data.");
  }
  seen.add(value);
  for (const key of Object.keys(value)) {
    deepFreeze((value as Record<string, unknown>)[key], seen);
  }
  return Object.freeze(value);
}

export function isEngineIssuedSessionCheck(
  value: unknown,
): value is AddSessionCheckAction {
  return (
    isIssuedReliableAction(value) && value.actionType === "add_session_check"
  );
}

function addSessionCheck(
  offerId: string,
  requirement?: PublishedRequirement,
): AddSessionCheckActionPayload {
  const requirementAudit = requirement
    ? auditRequirement(requirement)
    : undefined;
  return AddSessionCheckActionSchema.parse({
    actionType: "add_session_check",
    targetKind: "in_memory_checklist",
    datasetKey: "browser-memory",
    label: "Añadir a comprobaciones de esta sesión",
    explanation: "No hay una acción automática fiable disponible.",
    offerId,
    checklistItem: {
      id: sessionChecklistId(offerId, requirement?.id),
      offerId,
      ...(requirement ? { requirementId: requirement.id } : {}),
      sourceActionType: "add_session_check",
      label: requirement
        ? `Comprobar «${requirement.sourceQuote}» en la oferta oficial`
        : "Comprobar manualmente la oferta oficial",
    },
    ...(requirementAudit ? { requirementAudit } : {}),
  });
}

const actionPriority: Record<ReliableActionPayload["actionType"], number> = {
  verify_offer_requirements: 0,
  open_official_procedure: 1,
  view_regulated_training_route: 2,
  explore_unpublished_requirement: 3,
  adjust_search_area: 4,
  add_session_check: 5,
  open_original_offer: 6,
};

function actionIdentity(action: ReliableActionPayload): string {
  switch (action.actionType) {
    case "open_original_offer":
      return `${action.actionType}\u0000${action.offerId}`;
    case "verify_offer_requirements":
      return `${action.actionType}\u0000${action.offerId}\u0000${action.reason}`;
    case "adjust_search_area":
      return `${action.actionType}\u0000${action.offerId}\u0000${action.selectedProvince}`;
    case "explore_unpublished_requirement":
    case "view_regulated_training_route":
    case "open_official_procedure":
      return `${action.actionType}\u0000${action.requirementAudit.requirementId}`;
    case "add_session_check":
      return `${action.actionType}\u0000${action.checklistItem.id}`;
  }
}

/** Derives only source-backed actions from exact offer and requirement evidence. */
export function deriveActions(input: ActionContext): ReliableAction[] {
  const offer = JobOfferSchema.parse(input.offer);
  const evidenceState = EvidenceStateSchema.parse(input.evidenceState);
  const answers = SessionAnswersSchema.parse(input.answers);
  const requirements = Array.from(
    new Map(
      input.requirements
        .map((requirement) => PublishedRequirementSchema.parse(requirement))
        .filter((requirement) => isCanonicalRequirement(offer.id, requirement))
        .map((requirement) => [requirement.id, requirement]),
    ).values(),
  );
  const actions: ReliableActionPayload[] = [];

  const unclassified = requirements.find(
    (requirement) => requirement.category === "unclassified",
  );
  if (
    requirements.length === 0 ||
    evidenceState === "occupational_relationship_incomplete" ||
    unclassified
  ) {
    actions.push({
      actionType: "verify_offer_requirements",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      label: "Comprobar requisitos en la oferta",
      offerId: offer.id,
      href: offer.originalUrl,
      reason: unclassified
        ? "unclassified_requirement"
        : requirements.length === 0
          ? "requirements_not_published"
          : "requirements_incomplete",
      ...(unclassified
        ? { requirementAudit: auditRequirement(unclassified) }
        : {}),
    });
  }

  const hasRemoteOrHybrid = requirements.some(
    (requirement) =>
      requirement.category === "mobility_or_work_mode" &&
      (requirement.normalizedValue === "remote" ||
        requirement.normalizedValue === "hybrid"),
  );
  const presenceRequirement = requirements.find(
    (requirement) =>
      requirement.category === "mobility_or_work_mode" &&
      (requirement.normalizedValue === "on_site" ||
        requirement.normalizedValue === "geographic_mobility"),
  );
  if (
    input.isSelectedProvinceSuitable === false &&
    input.selectedProvince &&
    !hasRemoteOrHybrid &&
    presenceRequirement
  ) {
    actions.push({
      actionType: "adjust_search_area",
      targetKind: "internal_filter",
      datasetKey: "ofertas-de-empleo",
      label: "Cambiar zona de búsqueda",
      offerId: offer.id,
      selectedProvince: input.selectedProvince,
      filter: {
        provinceOperation: "change",
        workModeEvidence: "on_site_or_geographic",
      },
      mobilityRequirementAudit: auditRequirement(presenceRequirement),
    });
  } else if (
    input.isSelectedProvinceSuitable === false &&
    input.selectedProvince &&
    !hasRemoteOrHybrid &&
    !presenceRequirement &&
    !actions.some((action) => action.actionType === "verify_offer_requirements")
  ) {
    actions.push({
      actionType: "verify_offer_requirements",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      label: "Comprobar requisitos en la oferta",
      offerId: offer.id,
      href: offer.originalUrl,
      reason: "work_mode_unknown",
    });
  }

  if (evidenceState === "declared_explicit_gap") {
    const gaps = requirements.filter(
      (requirement) => answers[requirement.id] === "lacks",
    );
    for (const requirement of gaps) {
      const audit = auditRequirement(requirement);
      if (requirement.category === "qualification_or_specialization") {
        const programKeys = exactReviewedProgramKeys(requirement);
        actions.push(
          programKeys.length > 0
            ? {
                actionType: "view_regulated_training_route",
                targetKind: "regulated_training",
                datasetKey: "oferta-de-formacion-profesional",
                label: "Ver ruta formativa y centros",
                offerId: offer.id,
                programKeys,
                requirementAudit: audit,
              }
            : addSessionCheck(offer.id, requirement),
        );
        continue;
      }
      if (
        requirement.category === "certificate_or_regulated_license" ||
        requirement.category === "driving_license_or_vehicle"
      ) {
        const procedure = exactProcedure(requirement);
        actions.push(
          procedure
            ? {
                actionType: "open_official_procedure",
                targetKind: "official_procedure",
                datasetKey: "official-procedures",
                label: "Consultar trámite oficial",
                offerId: offer.id,
                title: procedure.title,
                href: procedure.href,
                requirementAudit: audit,
                procedureAudit: procedure,
              }
            : addSessionCheck(offer.id, requirement),
        );
        continue;
      }
      if (
        requirement.category !== "unclassified" &&
        requirement.normalizedValue !== null
      ) {
        actions.push({
          actionType: "explore_unpublished_requirement",
          targetKind: "internal_offer_search",
          datasetKey: "ofertas-de-empleo",
          label: "Ver ofertas relacionadas donde no se publica este requisito",
          offerId: offer.id,
          filter: {
            publicationState: "not_published",
            category: requirement.category,
            normalizedValue: requirement.normalizedValue,
          },
          requirementAudit: audit,
        });
      }
    }
    if (gaps.length === 0) actions.push(addSessionCheck(offer.id));
  }

  actions.push({
    actionType: "open_original_offer",
    targetKind: "external_offer",
    datasetKey: "ofertas-de-empleo",
    label: "Abrir oferta original",
    offerId: offer.id,
    href: offer.originalUrl,
  });

  const deduplicated = [
    ...new Map(
      actions.map((action) => [actionIdentity(action), action]),
    ).values(),
  ];
  deduplicated.sort((left, right) => {
    const priority =
      actionPriority[left.actionType] - actionPriority[right.actionType];
    return priority !== 0
      ? priority
      : actionIdentity(left).localeCompare(actionIdentity(right), "en");
  });
  const parsed = ReliableActionPayloadsSchema.parse(deduplicated);
  const frozen = deepFreeze(parsed);
  for (const action of frozen) {
    issuedActionFingerprints.set(action, actionFingerprint(action));
  }
  return frozen as unknown as ReliableAction[];
}
