import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type {
  OutcomeCohortWindow,
  OutcomeTrainingLevel,
} from "../../../data/schemas/outcomes";
import {
  loadManifest,
  loadOutcomeIndicators,
} from "../../data/generatedDataClient";
import {
  getIncomeComparison,
  indexIncomeOutcomes,
  type IncomeComparison,
  type IncomeOutcomeIndex,
} from "../../domain/outcomes";
import { IncomeComparisonForm } from "./IncomeComparisonForm";
import { IncomeEvidenceCard } from "./IncomeEvidenceCard";
import "./compareStudies.css";

type PageState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "invalid" }
  | { status: "ready"; index: IncomeOutcomeIndex; stale: boolean };

const LATEST_COHORT = "2022-2023";

function findWindow(
  index: IncomeOutcomeIndex,
  trainingLevel: OutcomeTrainingLevel | null,
  cohort: string,
): OutcomeCohortWindow | null {
  if (!trainingLevel) return null;
  return (
    index.windowsByLevelAndCohort.get(`${trainingLevel}\0${cohort}`) ?? null
  );
}

function scopeHeading(trainingLevel: OutcomeTrainingLevel): string {
  return `Referencia de titulados de ${
    trainingLevel === "intermediate" ? "Grado Medio" : "Grado Superior"
  } en Castilla y León`;
}

/** Loads only manifest-addressed evidence and keeps both official scopes separate. */
export function CompareStudiesPage() {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [trainingLevel, setTrainingLevel] =
    useState<OutcomeTrainingLevel | null>(null);
  const [groupKeys, setGroupKeys] = useState<readonly string[]>([]);
  const [cohort, setCohort] = useState(LATEST_COHORT);
  const [postGraduationYear, setPostGraduationYear] = useState<1 | 2 | 3 | 4>(
    1,
  );

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const records = await loadOutcomeIndicators(manifest);
        if (!active) return;
        if (records === null) {
          setState({ status: "unavailable" });
          return;
        }
        const outcomeSnapshot = (
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Record<string, { qualityStatus: "passed" | "stale" } | undefined>
        ).outcomeIndicators;
        setState({
          status: "ready",
          index: indexIncomeOutcomes(records),
          stale:
            manifest.qualityStatus === "stale" ||
            outcomeSnapshot?.qualityStatus === "stale",
        });
      })
      .catch(() => {
        if (active) setState({ status: "invalid" });
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    if (state.status !== "ready" || !trainingLevel) return [];
    return [...state.index.groupsByKey.values()]
      .filter((group) => group.trainingLevel === trainingLevel)
      .sort((left, right) =>
        left.officialLabel.localeCompare(right.officialLabel, "es"),
      );
  }, [state, trainingLevel]);
  const cohortWindow =
    state.status === "ready"
      ? findWindow(state.index, trainingLevel, cohort)
      : null;
  const cohortWindows = useMemo(() => {
    if (state.status !== "ready" || !trainingLevel) return [];
    return [...state.index.windowsByLevelAndCohort.values()]
      .filter((window) => window.trainingLevel === trainingLevel)
      .sort((left, right) => left.cohort.localeCompare(right.cohort));
  }, [state, trainingLevel]);
  const comparison: IncomeComparison | null = useMemo(() => {
    if (state.status !== "ready" || !trainingLevel || groupKeys.length === 0) {
      return null;
    }
    try {
      return getIncomeComparison(state.index, {
        trainingLevel,
        groupKeys: groupKeys as [string, ...string[]],
        cohort,
        postGraduationYear,
      });
    } catch {
      return null;
    }
  }, [state, trainingLevel, groupKeys, cohort, postGraduationYear]);

  function chooseTrainingLevel(level: OutcomeTrainingLevel) {
    setTrainingLevel(level);
    setGroupKeys([]);
    setCohort(LATEST_COHORT);
    setPostGraduationYear(1);
  }

  function chooseCohort(nextCohort: string) {
    setCohort(nextCohort);
    const window =
      state.status === "ready"
        ? findWindow(state.index, trainingLevel, nextCohort)
        : null;
    if (window && postGraduationYear > window.maxObservedPostGraduationYear) {
      setPostGraduationYear(window.maxObservedPostGraduationYear);
    }
  }

  if (state.status === "loading") {
    return (
      <section className="compare-page compare-page--status" aria-live="polite">
        <h1>Ingresos observados</h1>
        <p role="status">Cargando la comparación oficial…</p>
      </section>
    );
  }
  if (state.status === "unavailable") {
    return (
      <section className="compare-page compare-page--status" aria-live="polite">
        <h1>Ingresos observados</h1>
        <p>
          La comparación oficial no está disponible en esta versión de los
          datos.
        </p>
        <p>
          <Link to="/metodologia">Consultar la metodología y las fuentes</Link>
        </p>
      </section>
    );
  }
  if (state.status === "invalid") {
    return (
      <section className="compare-page compare-page--status" aria-live="polite">
        <h1>Ingresos observados</h1>
        <p>No se ha podido comprobar la comparación oficial.</p>
        <p>Prueba de nuevo más tarde o consulta la metodología.</p>
      </section>
    );
  }

  const groupLabels = new Map(
    comparison?.groups.map((group) => [group.groupKey, group.officialLabel]),
  );
  return (
    <section className="compare-page" aria-labelledby="compare-heading">
      <header className="compare-page__intro">
        <p className="compare-page__eyebrow">Comparar estudios</p>
        <h1 id="compare-heading">Ingresos observados</h1>
        <p>
          Consulta la base de cotización anualizada publicada para una cohorte,
          sin convertirla en una predicción personal.
        </p>
      </header>

      {state.stale ? (
        <p className="stale-warning" role="status">
          No se han podido actualizar estos datos. Mostramos la última copia
          disponible.
        </p>
      ) : null}

      <IncomeComparisonForm
        trainingLevel={trainingLevel}
        groups={groups}
        selectedGroupKeys={groupKeys}
        cohort={cohort}
        cohortWindow={cohortWindow}
        cohortWindows={cohortWindows}
        postGraduationYear={postGraduationYear}
        onTrainingLevelChange={chooseTrainingLevel}
        onGroupKeysChange={setGroupKeys}
        onCohortChange={chooseCohort}
        onPostGraduationYearChange={setPostGraduationYear}
      />

      {comparison ? (
        <section
          className="income-results"
          aria-live="polite"
          aria-label="Evidencia seleccionada"
        >
          <header className="income-results__summary">
            <p>
              Cohorte {comparison.selection.cohort}
              {comparison.cohortWindow.provisional ? " · provisional" : ""}
              {` · año ${comparison.selection.postGraduationYear} tras titularse`}
            </p>
          </header>
          <div className="income-evidence-grid">
            <IncomeEvidenceCard
              heading="Ingresos observados del ciclo o grupo en España"
              scopeLabel="Base de cotización anualizada · jornada completa · España"
              observations={comparison.national}
              groupLabels={groupLabels}
            />
            <IncomeEvidenceCard
              heading={scopeHeading(comparison.selection.trainingLevel)}
              scopeLabel="Base de cotización anualizada · jornada completa · Castilla y León · comunidad del centro de titulación"
              detail="La comunidad se refiere al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo."
              observations={comparison.regional}
            />
          </div>
          <p className="income-limitation">
            Mostramos ambas referencias por separado porque no existe una
            estadística oficial de ingresos por ciclo formativo en Castilla y
            León.
          </p>
        </section>
      ) : null}
    </section>
  );
}
