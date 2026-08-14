import type {
  JobOffer,
  PublishedRequirement,
} from "../../data/schemas/generated";
import type { EvidenceState } from "./evidence";

export type ReliableAction =
  | {
      actionType: "open_original_offer";
      targetKind: "external_offer";
      datasetKey: "ofertas-de-empleo";
      label: "Abrir oferta original";
      href: string;
    }
  | {
      actionType: "verify_offer_requirements";
      targetKind: "external_offer";
      datasetKey: "ofertas-de-empleo";
      label: "Comprobar requisitos en la oferta";
      href: string;
    }
  | {
      actionType: "adjust_search_area";
      targetKind: "internal_filter";
      datasetKey: "job-offers-snapshot";
      label: "Cambiar zona de búsqueda";
    }
  | {
      actionType: "explore_unpublished_requirement";
      targetKind: "internal_offer_search";
      datasetKey: "ofertas-de-empleo";
      label: "Ver ofertas relacionadas donde no se publica este requisito";
      requirementId: string;
    }
  | {
      actionType: "view_regulated_training_route";
      targetKind: "regulated_training";
      datasetKey: "oferta-de-formacion-profesional";
      label: "Ver ruta formativa y centros";
      programKey: string | null;
    }
  | {
      actionType: "open_official_procedure";
      targetKind: "official_procedure";
      datasetKey: "official-procedures";
      label: "Consultar trámite oficial";
      href: string;
    }
  | {
      actionType: "add_session_check";
      targetKind: "in_memory_checklist";
      datasetKey: "session-checklist";
      label: "Añadir a comprobaciones de esta sesión";
      requirementId: string | null;
    };

export interface ActionContext {
  evidenceState: EvidenceState;
  offer: JobOffer;
  publishedRequirements?: PublishedRequirement[];
  missingQualification?: boolean;
  programKey?: string;
  officialProcedureHref?: string;
  location?: {
    selectedProvince: string;
    offerProvince: string | null;
    remoteModePublished: boolean;
  };
}

function hasAction(
  actions: ReliableAction[],
  actionType: ReliableAction["actionType"],
): boolean {
  return actions.some((action) => action.actionType === actionType);
}

export function deriveActions(context: ActionContext): ReliableAction[] {
  const actions: ReliableAction[] = [];
  const requirements =
    context.publishedRequirements ?? context.offer.publishedRequirements;

  if (context.evidenceState === "occupational_relationship_incomplete") {
    actions.push({
      actionType: "verify_offer_requirements",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      label: "Comprobar requisitos en la oferta",
      href: context.offer.originalUrl,
    });
  }

  const missingRequirement = requirements.find(
    (requirement) => requirement.category !== "unclassified",
  );
  if (context.evidenceState === "declared_explicit_gap" && missingRequirement) {
    actions.push({
      actionType: "explore_unpublished_requirement",
      targetKind: "internal_offer_search",
      datasetKey: "ofertas-de-empleo",
      label: "Ver ofertas relacionadas donde no se publica este requisito",
      requirementId: missingRequirement.id,
    });
  }

  if (context.missingQualification) {
    actions.push({
      actionType: "view_regulated_training_route",
      targetKind: "regulated_training",
      datasetKey: "oferta-de-formacion-profesional",
      label: "Ver ruta formativa y centros",
      programKey: context.programKey ?? null,
    });
  }

  if (
    context.location &&
    context.location.offerProvince !== null &&
    context.location.offerProvince !== context.location.selectedProvince &&
    !context.location.remoteModePublished
  ) {
    actions.push({
      actionType: "adjust_search_area",
      targetKind: "internal_filter",
      datasetKey: "job-offers-snapshot",
      label: "Cambiar zona de búsqueda",
    });
  }

  if (context.officialProcedureHref) {
    actions.push({
      actionType: "open_official_procedure",
      targetKind: "official_procedure",
      datasetKey: "official-procedures",
      label: "Consultar trámite oficial",
      href: context.officialProcedureHref,
    });
  }

  if (!hasAction(actions, "open_original_offer")) {
    actions.push({
      actionType: "open_original_offer",
      targetKind: "external_offer",
      datasetKey: "ofertas-de-empleo",
      label: "Abrir oferta original",
      href: context.offer.originalUrl,
    });
  }

  if (actions.length === 1 && actions[0].actionType === "open_original_offer") {
    actions.push({
      actionType: "add_session_check",
      targetKind: "in_memory_checklist",
      datasetKey: "session-checklist",
      label: "Añadir a comprobaciones de esta sesión",
      requirementId: null,
    });
  }

  return actions;
}
