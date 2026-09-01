import type {
  JobOffer,
  TrainingProgram,
} from "../../../data/schemas/generated";
import { ActionPanel } from "../../components/ActionPanel";
import { ExternalLink } from "../../components/ExternalLink";
import { Icon } from "../../components/Icon";
import { InfoDisclosure } from "../../components/InfoDisclosure";
import { RequirementRow } from "../../components/RequirementRow";
import type { ReliableAction } from "../../domain/actionEngine";
import type {
  EvidenceState,
  SessionAnswerValue,
  SessionAnswers,
} from "../../domain/evidence";
import type { OfferDisplayMatch } from "../../domain/offerMatching";
import { publishedRequirementLabel } from "../../domain/requirementPresentation";
import type { PublishedRequirement } from "../../domain/requirements";
import type { DecisionSession } from "../../domain/session";

export interface OfferEvidenceCardProps {
  programs: readonly TrainingProgram[];
  offer: JobOffer;
  match: OfferDisplayMatch;
  evidenceState: EvidenceState;
  answers: SessionAnswers;
  actions: ReliableAction[];
  checklist: DecisionSession["checklist"];
  onAnswer: (
    requirement: PublishedRequirement,
    answer: SessionAnswerValue,
  ) => void;
  onAddChecklist: DecisionSession["addChecklistItem"];
  onRemoveChecklist: DecisionSession["removeChecklistItem"];
  onExploreUnpublishedRequirement: (
    action: Extract<
      ReliableAction,
      { actionType: "explore_unpublished_requirement" }
    >,
  ) => void;
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function locationLabel(offer: JobOffer): string | null {
  const location = [offer.locality, offer.province]
    .filter((value): value is string => value !== null)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
  return location.length > 0 ? location : null;
}

function relationshipCopy(match: OfferDisplayMatch): string {
  switch (match.matchRule) {
    case "title_alias_exact":
      return "El título de la oferta coincide con una profesión relacionada con este ciclo.";
    case "title_alias_phrase":
      return "El título de la oferta menciona una profesión relacionada con este ciclo.";
    case "published_qualification_exact":
      return "La oferta pide una titulación vinculada a este ciclo.";
    case "reviewed_title_alias_exact":
      return "El t\u00edtulo de la oferta coincide con una salida profesional publicada y revisada para este ciclo.";
    case "reviewed_title_alias_phrase":
      return "El t\u00edtulo de la oferta menciona una salida profesional publicada y revisada para este ciclo.";
    case "reviewed_published_qualification_exact":
      return "La oferta pide una titulaci\u00f3n vinculada a este ciclo y la relaci\u00f3n est\u00e1 revisada.";
    case "reviewed_exact_program_title":
      return "El requisito publicado coincide literalmente con el t\u00edtulo oficial de este ciclo.";
    case "human_override":
      return "La relación entre la vacante y la ocupación fue confirmada en esta sesión.";
  }
}

function evidenceCopy(state: EvidenceState): string {
  if (state === "declared_explicit_gap")
    return "Has indicado que no cumples un requisito publicado.";
  if (state === "explicit_fit")
    return "Lo que has indicado coincide con los requisitos publicados.";
  return "Comprueba los requisitos antes de presentarte.";
}

function primaryRequirement(
  requirement: PublishedRequirement,
): requirement is Exclude<PublishedRequirement, { category: "unclassified" }> {
  return requirement.category !== "unclassified";
}

function TraceabilityContent({
  offer,
  match,
}: Pick<OfferEvidenceCardProps, "offer" | "match">) {
  const link =
    "sidecarEvidence" in match
      ? match.sidecarEvidence
      : match.linkEvidence.payload;

  return (
    <div className="offer-row__traceability">
      <section>
        <h4>Por qué aparece esta oferta</h4>
        <p>{relationshipCopy(match)}</p>
        <blockquote>{link.sourceQuote}</blockquote>
        <p className="offer-row__traceability-meta">
          <ExternalLink href={link.sourceUrl}>
            Fuente de la relación
          </ExternalLink>
          <span>Revisada el {shortDate(link.reviewedAt)}</span>
          <span>Versión: {link.mappingVersion}</span>
        </p>
        {link.reviewNote !== undefined && <p>{link.reviewNote}</p>}
      </section>

      <section>
        <h4>Cómo se extrajeron los requisitos</h4>
        {match.requirements.length === 0 ? (
          <p>
            No hemos podido extraer requisitos concretos. Compruébalos en la
            oferta oficial.
          </p>
        ) : (
          <ul className="offer-row__traceability-list">
            {match.requirements.map((requirement) => (
              <li key={requirement.id}>
                <p>
                  <strong>
                    {requirement.category === "unclassified"
                      ? "Texto pendiente de clasificación"
                      : publishedRequirementLabel(requirement)}
                  </strong>
                </p>
                <blockquote>{requirement.sourceQuote}</blockquote>
                <p className="offer-row__traceability-meta">
                  <ExternalLink href={offer.sourceSnapshot.sourceUrl}>
                    Fuente de la oferta
                  </ExternalLink>
                  <span>
                    Publicada el{" "}
                    {shortDate(offer.sourceSnapshot.sourceUpdatedAt)}
                  </span>
                  <span>
                    Regla: {requirement.parserRule} · v
                    {requirement.parserVersion}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function OfferEvidenceCard(props: OfferEvidenceCardProps) {
  const headingId = `offer-${props.offer.id.replace(/[^a-z0-9]+/giu, "-")}`;
  const location = locationLabel(props.offer);
  const primaryRequirements =
    props.match.requirements.filter(primaryRequirement);
  const pendingRequirementCount =
    props.match.requirements.length - primaryRequirements.length;
  const secondaryActions = props.actions.filter(
    (action) =>
      action.actionType !== "open_original_offer" &&
      action.actionType !== "verify_offer_requirements",
  );
  const hasSecondaryActions =
    secondaryActions.length > 0 || props.checklist.length > 0;
  return (
    <article className="offer-row" aria-labelledby={headingId}>
      <div className="offer-row__main">
        <div className="offer-row__heading">
          <h3 id={headingId}>{props.offer.title}</h3>
          <p className="offer-row__meta">
            {location !== null ? `${location} · ` : ""}
            {props.offer.sourceName} · publicada{" "}
            <time dateTime={props.offer.publishedAt}>
              {shortDate(props.offer.publishedAt)}
            </time>
          </p>
        </div>
        <div className="offer-row__actions">
          <ExternalLink
            className="offer-row__cta"
            href={props.offer.originalUrl}
          >
            Ver oferta oficial
            <Icon name="external-link" size={16} />
          </ExternalLink>
          <InfoDisclosure
            label={`De dónde sale esta información (${props.offer.title})`}
          >
            <TraceabilityContent offer={props.offer} match={props.match} />
          </InfoDisclosure>
        </div>
      </div>

      <details className="offer-row__more">
        <summary>
          Requisitos: ¿los cumples?
          {pendingRequirementCount > 0 && (
            <span className="offer-row__pending">
              {" "}
              · {pendingRequirementCount} sin clasificar
            </span>
          )}
        </summary>
        {primaryRequirements.length > 0 ? (
          <>
            <ul className="requirement-list">
              {primaryRequirements.map((requirement) => (
                <RequirementRow
                  key={requirement.id}
                  requirement={requirement}
                  answer={props.answers[requirement.id]}
                  onAnswer={props.onAnswer}
                />
              ))}
            </ul>
            <p
              className={`offer-row__fit-status${props.evidenceState === "declared_explicit_gap" ? " offer-row__fit-status--gap" : ""}`}
              aria-live="polite"
            >
              {evidenceCopy(props.evidenceState)}
            </p>
          </>
        ) : (
          <p>
            Esta oferta no publica requisitos que podamos resumir todavía.
            Revisa el texto completo en la oferta oficial.
          </p>
        )}
        {hasSecondaryActions && (
          <div className="offer-row__secondary-actions">
            <ActionPanel
              programs={props.programs}
              actions={secondaryActions}
              checklist={props.checklist}
              onAddChecklist={props.onAddChecklist}
              onRemoveChecklist={props.onRemoveChecklist}
              onExploreUnpublishedRequirement={
                props.onExploreUnpublishedRequirement
              }
              hideOfferAccessActions
            />
          </div>
        )}
      </details>
    </article>
  );
}
