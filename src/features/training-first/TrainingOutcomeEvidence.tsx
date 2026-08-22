import type { TrainingProgram } from "../../../data/schemas/generated";
import { ExternalLink } from "../../components/ExternalLink";
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
    <section
      id="base-cotizacion-observada"
      tabIndex={-1}
      className="training-outcome training-outcome--unavailable"
      aria-labelledby="base-cotizacion-observada-heading"
    >
      <h2 id="base-cotizacion-observada-heading">
        Base de cotización observada de titulados
      </h2>
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

  const headingId = "base-cotizacion-observada-heading";
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
    <section
      id="base-cotizacion-observada"
      tabIndex={-1}
      className="training-outcome"
      aria-labelledby={headingId}
    >
      <header className="training-outcome__header">
        <div>
          <h2 id={headingId}>Base de cotización observada de titulados</h2>
          <p>
            Base de cotización anualizada · empleo por cuenta ajena a jornada
            completa.
          </p>
          <p>No es salario personal ni una predicción.</p>
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
        <ExternalLink href={outcome.snapshot.sourceUrl}>
          Fuente: EDUCAbase
        </ExternalLink>
      </footer>
    </section>
  );
}
