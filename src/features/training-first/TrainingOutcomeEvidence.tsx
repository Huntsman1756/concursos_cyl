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
  type TrainingOutcomeSnapshot,
  type TrainingOutcomeState,
} from "./trainingOutcome";

type OutcomeSourceData = Pick<
  TrainingOutcomeSnapshot,
  "sourceUrl" | "snapshotFetchedAt"
> & {
  stale?: boolean;
};

function OutcomeSource({ snapshot }: { snapshot: OutcomeSourceData }) {
  return (
    <footer className="training-outcome__source">
      <span>
        Cohorte {TRAINING_OUTCOME_COHORT}, año {TRAINING_OUTCOME_YEAR}. Copia
        del {formatOutcomeSnapshotDate(snapshot.snapshotFetchedAt)}.
      </span>
      <ExternalLink href={snapshot.sourceUrl}>Fuente: EDUCAbase</ExternalLink>
      {snapshot.stale && <span>Esta copia puede estar desactualizada.</span>}
    </footer>
  );
}

function OutcomeHeader() {
  return (
    <header className="training-outcome__header">
      <div>
        <h2 id="base-cotizacion-observada-heading">
          Base de cotización observada de titulados
        </h2>
        <p>
          Base de cotización anualizada · empleo por cuenta ajena a jornada
          completa.
        </p>
        <p>No es salario personal ni una predicción.</p>
      </div>
    </header>
  );
}

function UnavailableOutcome({
  children,
  source,
  onRetry,
}: {
  children: string;
  source?: OutcomeSourceData;
  onRetry?: () => void;
}) {
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
      {source !== undefined && <OutcomeSource snapshot={source} />}
      {onRetry !== undefined && (
        <button className="secondary-button" type="button" onClick={onRetry}>
          Reintentar datos de ingresos observados
        </button>
      )}
    </section>
  );
}

function DeferredOutcome({
  source,
  outcome,
  onRequestLoad,
}: {
  source?: OutcomeSourceData;
  outcome: Extract<
    TrainingOutcomeState,
    { status: "not-requested" | "loading" }
  >;
  onRequestLoad?: () => void;
}) {
  const loading = outcome.status === "loading";
  return (
    <section
      id="base-cotizacion-observada"
      tabIndex={-1}
      className="training-outcome training-outcome--unavailable"
      aria-labelledby="base-cotizacion-observada-heading"
      aria-busy={loading}
    >
      <OutcomeHeader />
      <p role={loading ? "status" : undefined} aria-live="polite">
        {loading
          ? "Cargando datos de ingresos observados…"
          : "Los datos de ingresos observados se cargan solo cuando los solicitas."}
      </p>
      {source !== undefined && <OutcomeSource snapshot={source} />}
      {!loading && onRequestLoad !== undefined && (
        <button
          className="primary-button"
          type="button"
          onClick={onRequestLoad}
        >
          Cargar datos de ingresos observados
        </button>
      )}
    </section>
  );
}

export function TrainingOutcomeEvidence({
  program,
  outcome,
  outcomeSource,
  onRequestLoad,
}: {
  program: TrainingProgram;
  outcome: TrainingOutcomeState;
  outcomeSource?: OutcomeSourceData;
  onRequestLoad?: () => void;
}) {
  if (program.level !== "intermediate" && program.level !== "higher") {
    return (
      <UnavailableOutcome>
        La fuente solo publica referencias para Grado Medio y Grado Superior.
      </UnavailableOutcome>
    );
  }
  if (outcomeSource === undefined) {
    return (
      <UnavailableOutcome>
        Esta copia no incluye datos de ingresos observados.
      </UnavailableOutcome>
    );
  }
  if (outcome.status === "not-requested" || outcome.status === "loading") {
    return (
      <DeferredOutcome
        source={outcomeSource}
        outcome={outcome}
        onRequestLoad={onRequestLoad}
      />
    );
  }
  if (outcome.status === "unavailable") {
    return (
      <UnavailableOutcome source={outcomeSource} onRetry={onRequestLoad}>
        Esta copia no incluye datos de ingresos observados.
      </UnavailableOutcome>
    );
  }
  if (outcome.status === "invalid") {
    return (
      <UnavailableOutcome source={outcomeSource} onRetry={onRequestLoad}>
        No se han podido validar los datos de ingresos observados.
      </UnavailableOutcome>
    );
  }

  const view = selectTrainingOutcomeView(program, outcome.index);
  if (view === null) {
    return (
      <UnavailableOutcome source={outcomeSource} onRetry={onRequestLoad}>
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
      <OutcomeHeader />

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

      <OutcomeSource snapshot={outcome.snapshot} />
    </section>
  );
}
