import type {
  JobOffer,
  TrainingProgram,
} from "../../../data/schemas/generated";
import { ActionPanel } from "../../components/ActionPanel";
import { EvidenceDisclosure } from "../../components/EvidenceDisclosure";
import { RequirementRow } from "../../components/RequirementRow";
import type { ReliableAction } from "../../domain/actionEngine";
import type {
  EvidenceState,
  SessionAnswerValue,
  SessionAnswers,
} from "../../domain/evidence";
import type { OfferMatch } from "../../domain/offerMatching";
import { publishedRequirementLabel } from "../../domain/requirementPresentation";
import type { PublishedRequirement } from "../../domain/requirements";
import type { DecisionSession } from "../../domain/session";

export interface OfferEvidenceCardProps {
  programs: readonly TrainingProgram[];
  offer: JobOffer;
  match: OfferMatch;
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

function relationshipCopy(match: OfferMatch): string {
  switch (match.matchRule) {
    case "title_alias_exact":
      return "El título coincide con una ocupación relacionada y revisada.";
    case "title_alias_phrase":
      return "El título contiene una ocupación relacionada y revisada.";
    case "published_qualification_exact":
      return "La vacante publica una titulación vinculada de forma revisada a tu ciclo.";
    case "human_override":
      return "La relación entre la vacante y la ocupación fue confirmada en esta sesión.";
  }
}

function evidenceCopy(state: EvidenceState): string {
  if (state === "declared_explicit_gap")
    return "Has indicado que no cumples este requisito.";
  if (state === "explicit_fit")
    return "Lo que has indicado coincide con los requisitos publicados.";
  return "Hay una relación revisada entre el ciclo y la ocupación, pero debes comprobar los requisitos.";
}

export function OfferEvidenceCard(props: OfferEvidenceCardProps) {
  const headingId = `offer-${props.offer.id.replace(/[^a-z0-9]+/giu, "-")}`;
  const link = props.match.linkEvidence.payload;
  return (
    <article className="offer-card" aria-labelledby={headingId}>
      <header className="offer-card__header">
        <p>
          {[props.offer.locality, props.offer.province]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h3 id={headingId}>{props.offer.title}</h3>
        <p>{props.offer.sourceName}</p>
      </header>
      <details className="offer-card__evidence">
        <summary>Ver evidencia y requisitos</summary>
        <div className="evidence-step">
          <h4>Por qué aparece</h4>
          <p>{relationshipCopy(props.match)}</p>
          <EvidenceDisclosure
            quote={link.sourceQuote}
            sourceUrl={link.sourceUrl}
            reviewedAt={link.reviewedAt}
            mappingVersion={link.mappingVersion}
          />
        </div>
        <div className="evidence-step">
          <h4>Qué publica la vacante</h4>
          {props.match.requirements.length === 0 ? (
            <div className="requirement-state requirement-state--unpublished">
              <strong>Requisito no publicado</strong>
              <p>
                No hemos podido extraer requisitos concretos del texto
                publicado. Compruébalos en la oferta original.
              </p>
            </div>
          ) : (
            <ul className="requirement-list">
              {props.match.requirements.map((requirement) => (
                <li className="requirement-row" key={requirement.id}>
                  <p className="requirement-row__label">
                    {publishedRequirementLabel(requirement)}
                  </p>
                  <EvidenceDisclosure
                    quote={requirement.sourceQuote}
                    sourceUrl={props.offer.sourceSnapshot.sourceUrl}
                    sourceLabel="Abrir fuente de la vacante"
                    sourceDate={props.offer.sourceSnapshot.sourceUpdatedAt}
                    parserRule={requirement.parserRule}
                    parserVersion={requirement.parserVersion}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="evidence-step">
          <h4>Tu comprobación</h4>
          <div
            className={`evidence-state${props.evidenceState === "declared_explicit_gap" ? " evidence-state--gap" : ""}`}
          >
            {props.evidenceState === "declared_explicit_gap" && (
              <strong>Requisito no cumplido</strong>
            )}
            <p aria-live="polite">{evidenceCopy(props.evidenceState)}</p>
          </div>
          {props.match.requirements.length > 0 && (
            <ul className="requirement-list">
              {props.match.requirements.map((requirement) => (
                <RequirementRow
                  key={requirement.id}
                  requirement={requirement}
                  answer={props.answers[requirement.id]}
                  onAnswer={props.onAnswer}
                />
              ))}
            </ul>
          )}
        </div>
      </details>
      <div className="evidence-step">
        <h4>Siguiente acción</h4>
        <ActionPanel
          programs={props.programs}
          actions={props.actions}
          checklist={props.checklist}
          onAddChecklist={props.onAddChecklist}
          onRemoveChecklist={props.onRemoveChecklist}
          onExploreUnpublishedRequirement={
            props.onExploreUnpublishedRequirement
          }
        />
      </div>
    </article>
  );
}
