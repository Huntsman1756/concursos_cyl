import type { JobOffer } from "../../../data/schemas/generated";
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
    return "Has indicado una brecha concreta.";
  if (state === "explicit_fit")
    return "Hay un encaje explícito en la evidencia publicada.";
  return "La relación ocupacional existe, pero debes comprobar los requisitos.";
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
        <h2 id={headingId}>{props.offer.title}</h2>
        <p>{props.offer.sourceName}</p>
      </header>
      <div className="evidence-step">
        <h3>Por qué aparece</h3>
        <p>{relationshipCopy(props.match)}</p>
        <EvidenceDisclosure
          quote={link.sourceQuote}
          sourceUrl={link.sourceUrl}
        />
      </div>
      <div className="evidence-step">
        <h3>Qué publica la vacante</h3>
        {props.match.requirements.length === 0 ? (
          <p>La vacante no publica requisitos estructurados.</p>
        ) : (
          <ul className="requirement-list">
            {props.match.requirements.map((requirement) => (
              <li className="requirement-row" key={requirement.id}>
                <p className="requirement-row__label">
                  {publishedRequirementLabel(requirement)}
                </p>
                <EvidenceDisclosure quote={requirement.sourceQuote} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="evidence-step">
        <h3>Tu comprobación</h3>
        <p aria-live="polite">{evidenceCopy(props.evidenceState)}</p>
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
      <div className="evidence-step">
        <h3>Siguiente acción</h3>
        <ActionPanel
          actions={props.actions}
          checklist={props.checklist}
          onAddChecklist={props.onAddChecklist}
          onRemoveChecklist={props.onRemoveChecklist}
        />
      </div>
    </article>
  );
}
