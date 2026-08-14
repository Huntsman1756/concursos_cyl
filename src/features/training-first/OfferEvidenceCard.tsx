import type { OfferMatch } from "../../domain/offerMatching";
import type { EvidenceState, SessionAnswers } from "../../domain/evidence";
import type { ReliableAction } from "../../domain/actionEngine";
import { ActionPanel } from "../../components/ActionPanel";
import { EvidenceDisclosure } from "../../components/EvidenceDisclosure";
import { RequirementRow } from "../../components/RequirementRow";

export function OfferEvidenceCard({
  match,
  state,
  answers,
  actions,
  onAnswer,
}: {
  match: OfferMatch;
  state: EvidenceState;
  answers: SessionAnswers;
  actions: ReliableAction[];
  onAnswer: (requirementId: string, value: "has" | "lacks" | "unsure") => void;
}) {
  return (
    <article className="evidence-card">
      <h2>{match.offer.title}</h2>
      <section>
        <h3>Por qué aparece</h3>
        <p>
          {match.matchRule === "title_alias_exact"
            ? `La ocupación aparece en el título mediante “${match.matchEvidence}”.`
            : `La relación revisada se apoya en: ${match.matchEvidence}.`}
        </p>
        <EvidenceDisclosure
          sourceUrl={match.sourceUrl}
          sourceDate={match.offer.snapshot.snapshotFetchedAt}
          mappingVersion="1.0.0"
        />
      </section>
      <section>
        <h3>Qué publica la vacante</h3>
        {match.publishedRequirements.length > 0 ? (
          match.publishedRequirements.map((requirement) => (
            <div key={requirement.id}>
              <RequirementRow
                requirement={requirement}
                answer={answers[requirement.id]}
                onAnswer={(answer) => onAnswer(requirement.id, answer)}
              />
              <EvidenceDisclosure
                sourceUrl={match.offer.originalUrl}
                sourceDate={match.offer.snapshot.snapshotFetchedAt}
                parserRule={requirement.parserRule}
              />
            </div>
          ))
        ) : (
          <p>La vacante no publica requisitos estructurados.</p>
        )}
      </section>
      <section>
        <h3>Tu comprobación</h3>
        <p>
          {state === "declared_explicit_gap"
            ? "Brecha declarada"
            : state === "explicit_fit"
              ? "Encaje explícito"
              : "Relación ocupacional; requisitos incompletos"}
        </p>
      </section>
      <section>
        <h3>Siguiente acción</h3>
        <ActionPanel actions={actions} />
      </section>
    </article>
  );
}
