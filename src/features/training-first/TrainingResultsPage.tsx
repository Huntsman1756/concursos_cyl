import { Link } from "react-router-dom";
import { deriveActions } from "../../domain/actionEngine";
import { deriveEvidenceState } from "../../domain/evidence";
import { matchOffersForProgram } from "../../domain/offerMatching";
import { useDecisionSession } from "../../domain/session";
import { OfferEvidenceCard } from "./OfferEvidenceCard";
import type { TrainingFeatureData } from "./trainingData";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function TrainingResultsPage({
  programKey,
  data,
}: {
  programKey: string;
  data: TrainingFeatureData;
}) {
  const session = useDecisionSession();
  const program = data.programs.find((item) => item.programKey === programKey);
  const matches = program ? matchOffersForProgram(programKey, data) : [];
  const hasApprovedRelationship = data.links.some(
    (link) =>
      link.trainingProgramKey === programKey &&
      link.reviewStatus === "approved",
  );

  if (!program) {
    return (
      <div className="journey-page">
        <h1>Ciclo no encontrado</h1>
        <Link to="/desde-fp">Volver a buscar un ciclo</Link>
      </div>
    );
  }

  return (
    <div className="journey-page">
      <Link to="/desde-fp">Cambiar ciclo</Link>
      <p className="eyebrow">Resultado desde FP</p>
      <h1>{program.programTitle}</h1>
      {data.manifest.qualityStatus === "stale" ? (
        <p role="status">
          Estos datos necesitan revisión. Fecha del snapshot:{" "}
          {formatDate(data.manifest.generatedAt)}.
        </p>
      ) : null}
      {!hasApprovedRelationship ? (
        <p>
          Aún no hay una relación revisada para este ciclo.{" "}
          <Link to="/desde-fp">Volver a buscar</Link>
        </p>
      ) : matches.length === 0 ? (
        <p>
          No hay ofertas relacionadas en la instantánea del{" "}
          {formatDate(data.manifest.generatedAt)}.
        </p>
      ) : (
        <div className="evidence-list">
          {matches.map((match) => {
            const state = deriveEvidenceState(match, session.answers);
            const actions = deriveActions({
              evidenceState: state,
              offer: match.offer,
              publishedRequirements: match.publishedRequirements,
              programKey,
            });
            return (
              <OfferEvidenceCard
                key={match.offerId}
                match={match}
                state={state}
                answers={session.answers}
                actions={actions}
                onAnswer={(requirementId, answer) =>
                  session.answerRequirement(requirementId, answer)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
