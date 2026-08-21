import type { TrainingProgram } from "../../../data/schemas/generated";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import {
  formatOutcomeLabel,
  formatOutcomeSnapshotDate,
  outcomeMetricLabel,
  outcomeObservationLabel,
  selectTrainingOutcomeView,
  TRAINING_OUTCOME_COHORT,
  TRAINING_OUTCOME_YEAR,
  type TrainingOutcomeState,
} from "./trainingOutcome";

function UnavailableOutcome({ children }: { children: string }) {
  return (
    <section className="training-outcome training-outcome--unavailable">
      <h2>Ingresos observados tras titularse</h2>
      <p>{children}</p>
    </section>
  );
}

export function TrainingOutcomeEvidence({
  program,
  outcome,
}: {
  program: TrainingProgram;
  outcome: TrainingOutcomeState;
}) {
  if (outcome.status === "unavailable") {
    return (
      <UnavailableOutcome>
        Esta copia no incluye datos de ingresos observados.
      </UnavailableOutcome>
    );
  }
  if (outcome.status === "invalid") {
    return (
      <UnavailableOutcome>
        No se han podido validar los datos de ingresos observados.
      </UnavailableOutcome>
    );
  }

  const view = selectTrainingOutcomeView(program, outcome.index);
  if (view === null) {
    return (
      <UnavailableOutcome>
        La fuente solo publica referencias para Grado Medio y Grado Superior.
      </UnavailableOutcome>
    );
  }

  const headingId = `training-outcome-${program.programKey.toLowerCase()}`;
  const nationalLabel = outcomeMetricLabel(view.groupMatch);
  const nationalName =
    view.groupMatch === null
      ? null
      : formatOutcomeLabel(view.groupMatch.group.officialLabel);
  const distribution = view.national ?? view.regional;
  const distributionLabel = view.national
    ? "Distribución publicada del grupo nacional"
    : "Distribución publicada de la referencia regional";

  return (
    <section className="training-outcome" aria-labelledby={headingId}>
      <header className="training-outcome__header">
        <div>
          <h2 id={headingId}>Ingresos observados tras titularse</h2>
          <p>
            Base de cotización anualizada · empleo por cuenta ajena a jornada
            completa. No es una predicción salarial personal.
          </p>
        </div>
      </header>

      <div
        className={`training-outcome__metrics${view.national === null ? " training-outcome__metrics--single" : ""}`}
      >
        {view.national !== null && nationalLabel !== null && (
          <div className="training-outcome__metric training-outcome__metric--national">
            <p>{nationalLabel}</p>
            <strong>{outcomeObservationLabel(view.national.mean)}</strong>
            <span>{nationalName}</span>
          </div>
        )}
        <div className="training-outcome__metric">
          <p>Castilla y León · {trainingLevelLabel(view.trainingLevel)}</p>
          <strong>{outcomeObservationLabel(view.regional.mean)}</strong>
          <span>Referencia conjunta del nivel formativo</span>
        </div>
      </div>

      <div className="training-outcome__distribution">
        <p>{distributionLabel}</p>
        <dl>
          <div>
            <dt>20 de cada 100 quedan por debajo</dt>
            <dd>{outcomeObservationLabel(distribution.lower)}</dd>
          </div>
          <div>
            <dt>80 de cada 100 quedan por debajo</dt>
            <dd>{outcomeObservationLabel(distribution.upper)}</dd>
          </div>
        </dl>
      </div>

      {view.national === null && (
        <p className="training-outcome__note">
          No hay un grupo nacional identificable para este ciclo en esta copia.
        </p>
      )}

      <footer className="training-outcome__source">
        <span>
          Cohorte {TRAINING_OUTCOME_COHORT}, año {TRAINING_OUTCOME_YEAR}. Copia
          del {formatOutcomeSnapshotDate(outcome.snapshot.snapshotFetchedAt)}.
        </span>
        <a href={outcome.snapshot.sourceUrl} target="_blank" rel="noreferrer">
          Fuente: EDUCAbase
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </footer>
    </section>
  );
}
