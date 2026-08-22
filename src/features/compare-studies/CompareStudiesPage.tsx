import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigationType, useSearchParams } from "react-router-dom";

import type { TrainingProgram } from "../../../data/schemas/generated";
import type {
  OutcomeCohortWindow,
  OutcomeTrainingLevel,
} from "../../../data/schemas/outcomes";
import {
  loadFoundationResourceSubset,
  loadManifest,
  loadOutcomeIndicators,
} from "../../data/generatedDataClient";
import {
  getIncomeComparison,
  indexIncomeOutcomes,
  type IncomeComparison,
  type IncomeOutcomeIndex,
} from "../../domain/outcomes";
import { findTrainingOutcomeGroup } from "../../domain/trainingOutcomeMatching";
import { ExternalLink } from "../../components/ExternalLink";
import { PrintButton } from "../../components/PrintButton";
import { useRouteReady } from "../../app/RouteReadyContext";
import { IncomeComparisonForm } from "./IncomeComparisonForm";
import { IncomeEvidenceCard } from "./IncomeEvidenceCard";
import { formatOutcomeLabel } from "./outcomePresentation";
import {
  parseCompareSearch,
  serializeCompareSelection,
  type CompareSelection,
} from "./compareSelection";
import "./compareStudies.css";

type PageState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "invalid" }
  | {
      status: "ready";
      index: IncomeOutcomeIndex;
      programs: readonly TrainingProgram[];
      outcomeSource?: {
        sourceUrl: string;
        snapshotFetchedAt: string;
      };
      stale: boolean;
    };

const DEFAULT_COHORT = "2019-2020";
const UNKNOWN_PROGRAM_NOTICE =
  "No se ha encontrado el ciclo oficial solicitado. Puedes elegir un ciclo manualmente.";
const AMBIGUOUS_PROGRAM_NOTICE =
  "La dirección no identifica un único ciclo oficial. Elige un ciclo manualmente.";
const UNSUPPORTED_PROGRAM_NOTICE =
  "La comparación de ingresos solo está disponible para Grado Medio y Grado Superior. Elige un ciclo compatible.";
const NO_OUTCOME_MATCH_NOTICE =
  "No hay una relación de ingresos publicada para este ciclo. Puedes elegir un grupo oficial manualmente.";
const FAMILY_MATCH_NOTICE =
  "Solo hay una referencia de familia profesional para este ciclo; elige manualmente un grupo de ciclo para comparar.";
const UNOBSERVED_PROGRAM_NOTICE =
  "Este ciclo tiene una referencia publicada, pero no hay un año observado completo para preseleccionarlo. Elige la cohorte y el año manualmente.";

export interface ProgramSelectionResolution {
  trainingLevel: OutcomeTrainingLevel | null;
  selection: CompareSelection | null;
  notice: string | null;
}

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
    trainingLevel === "intermediate" ? "grado medio" : "grado superior"
  } en Castilla y León`;
}

function formatSnapshotDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/** Resolves a program link without inventing an unobserved default selection. */
// eslint-disable-next-line react-refresh/only-export-components -- pure resolver is colocated with this route to keep Task5 paths bounded.
export function resolveProgramSelection(
  program: TrainingProgram,
  index: IncomeOutcomeIndex,
): ProgramSelectionResolution {
  if (program.level !== "intermediate" && program.level !== "higher") {
    return {
      trainingLevel: null,
      selection: null,
      notice: UNSUPPORTED_PROGRAM_NOTICE,
    };
  }

  const outcomeGroupMatch = findTrainingOutcomeGroup(program, index);
  if (outcomeGroupMatch === null) {
    return {
      trainingLevel: program.level,
      selection: null,
      notice: NO_OUTCOME_MATCH_NOTICE,
    };
  }
  if (outcomeGroupMatch.matchType !== "cycle") {
    return {
      trainingLevel: outcomeGroupMatch.group.trainingLevel,
      selection: null,
      notice: FAMILY_MATCH_NOTICE,
    };
  }

  const defaultWindow = findWindow(
    index,
    outcomeGroupMatch.group.trainingLevel,
    DEFAULT_COHORT,
  );
  if (
    defaultWindow === null ||
    defaultWindow.maxObservedPostGraduationYear < 4
  ) {
    return {
      trainingLevel: outcomeGroupMatch.group.trainingLevel,
      selection: null,
      notice: UNOBSERVED_PROGRAM_NOTICE,
    };
  }

  return {
    trainingLevel: outcomeGroupMatch.group.trainingLevel,
    selection: {
      trainingLevel: outcomeGroupMatch.group.trainingLevel,
      groupKeys: [outcomeGroupMatch.group.groupKey],
      cohort: DEFAULT_COHORT,
      postGraduationYear: 4,
    },
    notice: null,
  };
}

/** Loads only manifest-addressed evidence and keeps both official scopes separate. */
export function CompareStudiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const navigationType = useNavigationType();
  const preserveLocalFormAfterClearRef = useRef(false);
  const [state, setState] = useState<PageState>({ status: "loading" });
  useRouteReady(state.status === "ready");
  const [trainingLevel, setTrainingLevel] =
    useState<OutcomeTrainingLevel | null>(null);
  const [groupKeys, setGroupKeys] = useState<readonly string[]>([]);
  const [cohort, setCohort] = useState(DEFAULT_COHORT);
  const [postGraduationYear, setPostGraduationYear] = useState<1 | 2 | 3 | 4>(
    4,
  );
  const [notice, setNotice] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- URL state is an external source of truth. */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const [records, foundation] = await Promise.all([
          loadOutcomeIndicators(manifest, options),
          loadFoundationResourceSubset(manifest, ["programs"], options),
        ]);
        if (signal.aborted) return;
        if (records === null) {
          setState({ status: "unavailable" });
          return;
        }
        const outcomeSnapshot = (
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Record<
              string,
              | {
                  qualityStatus: "passed" | "stale";
                  sourceUrl?: string;
                  snapshotFetchedAt?: string;
                }
              | undefined
            >
        ).outcomeIndicators;
        setState({
          status: "ready",
          index: indexIncomeOutcomes(records),
          programs: foundation.programs,
          outcomeSource:
            outcomeSnapshot?.sourceUrl !== undefined &&
            outcomeSnapshot.snapshotFetchedAt !== undefined
              ? {
                  sourceUrl: outcomeSnapshot.sourceUrl,
                  snapshotFetchedAt: outcomeSnapshot.snapshotFetchedAt,
                }
              : undefined,
          stale:
            manifest.qualityStatus === "stale" ||
            outcomeSnapshot?.qualityStatus === "stale",
        });
      })
      .catch(() => {
        if (signal.aborted) return;
        setState({ status: "invalid" });
      });
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;

    const parsed = parseCompareSearch(searchParams, state.index);
    if (parsed.kind === "empty") {
      const preserveControlledClear =
        preserveLocalFormAfterClearRef.current && navigationType === "REPLACE";
      preserveLocalFormAfterClearRef.current = false;
      if (preserveControlledClear) {
        return;
      }
      setTrainingLevel(null);
      setGroupKeys([]);
      setCohort(DEFAULT_COHORT);
      setPostGraduationYear(4);
      setNotice(null);
      return;
    }
    if (parsed.kind === "invalid") {
      setTrainingLevel(null);
      setGroupKeys([]);
      setCohort(DEFAULT_COHORT);
      setPostGraduationYear(4);
      setNotice(parsed.message);
      return;
    }
    if (parsed.kind === "selection") {
      setTrainingLevel(parsed.selection.trainingLevel);
      setGroupKeys(parsed.selection.groupKeys);
      setCohort(parsed.selection.cohort);
      setPostGraduationYear(parsed.selection.postGraduationYear);
      setNotice(null);
      return;
    }

    const matchingPrograms = state.programs.filter(
      (program) => program.programKey === parsed.programKey,
    );
    if (matchingPrograms.length === 0) {
      setTrainingLevel(null);
      setGroupKeys([]);
      setNotice(UNKNOWN_PROGRAM_NOTICE);
      return;
    }
    if (matchingPrograms.length !== 1) {
      setTrainingLevel(null);
      setGroupKeys([]);
      setNotice(AMBIGUOUS_PROGRAM_NOTICE);
      return;
    }

    const program = matchingPrograms[0]!;
    const resolution = resolveProgramSelection(program, state.index);
    if (resolution.selection === null) {
      setTrainingLevel(resolution.trainingLevel);
      setGroupKeys([]);
      if (resolution.notice === UNOBSERVED_PROGRAM_NOTICE) {
        setCohort(DEFAULT_COHORT);
        setPostGraduationYear(4);
      }
      setNotice(resolution.notice);
      return;
    }

    const selection = resolution.selection;
    setTrainingLevel(selection.trainingLevel);
    setGroupKeys(selection.groupKeys);
    setCohort(selection.cohort);
    setPostGraduationYear(selection.postGraduationYear);
    setNotice(null);
    const canonical = serializeCompareSelection(selection);
    if (canonical.toString() !== searchString) {
      setSearchParams(canonical, { replace: true });
    }
  }, [navigationType, searchParams, searchString, setSearchParams, state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const groups = useMemo(() => {
    if (state.status !== "ready" || !trainingLevel) return [];
    return [...state.index.groupsByKey.values()]
      .filter((group) => group.trainingLevel === trainingLevel)
      .sort((left, right) =>
        formatOutcomeLabel(left.officialLabel).localeCompare(
          formatOutcomeLabel(right.officialLabel),
          "es",
          { sensitivity: "base" },
        ),
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
  const isNotYetObserved =
    cohortWindow !== null &&
    postGraduationYear > cohortWindow.maxObservedPostGraduationYear;
  const comparison: IncomeComparison | null = useMemo(() => {
    if (
      state.status !== "ready" ||
      !trainingLevel ||
      groupKeys.length === 0 ||
      isNotYetObserved
    ) {
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
  }, [
    state,
    trainingLevel,
    groupKeys,
    cohort,
    postGraduationYear,
    isNotYetObserved,
  ]);

  function clearQueryPreservingForm(): void {
    // The router may still notify subscribers when replacing an already-empty
    // query. Keep the controlled-clear marker for that notification, while the
    // URL effect only honors it for this component's REPLACE navigation.
    preserveLocalFormAfterClearRef.current = true;
    setSearchParams({}, { replace: true });
  }

  function replaceWithSelection(selection: CompareSelection | null): void {
    if (selection === null || selection.groupKeys.length === 0) {
      clearQueryPreservingForm();
      return;
    }
    const params = serializeCompareSelection(selection);
    if (params.toString() === "") {
      clearQueryPreservingForm();
      return;
    }
    setSearchParams(params, { replace: true });
  }

  function chooseTrainingLevel(level: OutcomeTrainingLevel) {
    setTrainingLevel(level);
    setGroupKeys([]);
    setCohort(DEFAULT_COHORT);
    setPostGraduationYear(4);
    setNotice(null);
    clearQueryPreservingForm();
  }

  function chooseGroupKeys(nextGroupKeys: readonly string[]) {
    setGroupKeys(nextGroupKeys);
    setNotice(null);
    if (
      state.status !== "ready" ||
      nextGroupKeys.length === 0 ||
      trainingLevel === null
    ) {
      replaceWithSelection(null);
      return;
    }
    const window = findWindow(state.index, trainingLevel, cohort);
    if (
      window === null ||
      postGraduationYear > window.maxObservedPostGraduationYear
    ) {
      clearQueryPreservingForm();
      return;
    }
    replaceWithSelection({
      trainingLevel,
      groupKeys: nextGroupKeys as [string, ...string[]],
      cohort,
      postGraduationYear,
    });
  }

  function chooseCohort(nextCohort: string) {
    setCohort(nextCohort);
    setNotice(null);
    if (
      state.status !== "ready" ||
      trainingLevel === null ||
      groupKeys.length === 0
    ) {
      return;
    }
    const window = findWindow(state.index, trainingLevel, nextCohort);
    if (
      window === null ||
      postGraduationYear > window.maxObservedPostGraduationYear
    ) {
      clearQueryPreservingForm();
      return;
    }
    replaceWithSelection({
      trainingLevel,
      groupKeys: groupKeys as [string, ...string[]],
      cohort: nextCohort,
      postGraduationYear,
    });
  }

  function choosePostGraduationYear(year: 1 | 2 | 3 | 4) {
    setPostGraduationYear(year);
    setNotice(null);
    if (trainingLevel === null || groupKeys.length === 0) return;
    replaceWithSelection({
      trainingLevel,
      groupKeys: groupKeys as [string, ...string[]],
      cohort,
      postGraduationYear: year,
    });
  }

  if (state.status === "loading") {
    return (
      <section
        className="compare-page compare-page--status"
        aria-live="polite"
        aria-labelledby="compare-heading"
      >
        <h1 id="compare-heading">Ingresos observados</h1>
        <p role="status" aria-live="polite">
          Cargando los datos de comparación…
        </p>
      </section>
    );
  }
  if (state.status === "unavailable") {
    return (
      <section
        className="compare-page compare-page--status"
        aria-live="polite"
        aria-labelledby="compare-heading"
      >
        <h1 id="compare-heading">Ingresos observados</h1>
        <p>Los datos de comparación no están disponibles en esta versión.</p>
        <p>
          <Link to="/metodologia">Consultar la metodología y las fuentes</Link>
        </p>
      </section>
    );
  }
  if (state.status === "invalid") {
    return (
      <section
        className="compare-page compare-page--status"
        aria-live="polite"
        aria-labelledby="compare-heading"
      >
        <h1 id="compare-heading">Ingresos observados</h1>
        <p>No se han podido cargar o validar los datos de comparación.</p>
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
          Compara la base de cotización anualizada publicada de hasta tres
          ciclos, usando la misma cohorte y el mismo año.
        </p>
        <p className="compare-page__caveat">
          No es una predicción salarial personal.
        </p>
      </header>

      {state.stale ? (
        <p className="stale-warning" role="status">
          No se han podido actualizar estos datos. Mostramos la última copia
          disponible.
        </p>
      ) : null}

      {notice !== null ? (
        <p className="compare-notice" role="alert">
          {notice}
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
        onGroupKeysChange={chooseGroupKeys}
        onCohortChange={chooseCohort}
        onPostGraduationYearChange={choosePostGraduationYear}
      />

      {isNotYetObserved && groupKeys.length > 0 ? (
        <p className="income-unobserved-state" role="status">
          Año todavía no observado para la cohorte seleccionada.
        </p>
      ) : null}

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
          <div className="income-results__guide" role="note">
            <strong>Cómo leer los cortes</strong>
            <p>
              “Corte del 20 %” significa que el 20 % de los titulados queda por
              debajo de ese importe. Los cortes del 40 %, 60 % y 80 % se leen
              del mismo modo. No son salarios mínimos ni una predicción
              personal.
            </p>
          </div>
          <div className="compare-page__actions" data-print-hidden="true">
            <PrintButton className="secondary-button" />
          </div>
          <div className="income-evidence-grid">
            <IncomeEvidenceCard
              heading="Ingresos observados del ciclo o grupo en España"
              scopeLabel="España · Jornada completa · Base de cotización anualizada"
              observations={comparison.national}
              groupLabels={groupLabels}
            />
            <IncomeEvidenceCard
              heading={scopeHeading(comparison.selection.trainingLevel)}
              scopeLabel="Castilla y León · Jornada completa · Base de cotización anualizada"
              detail="La comunidad se refiere al centro donde se obtuvo la titulación, no al lugar de residencia o de trabajo."
              observations={comparison.regional}
            />
          </div>
          <p className="income-limitation">
            Mostramos ambas referencias por separado porque la fuente consultada
            no publica ingresos por ciclo concreto en Castilla y León; solo
            ofrece una referencia conjunta para Grado Medio o Grado Superior.
          </p>
          {state.outcomeSource !== undefined ? (
            <footer className="income-results__source">
              <span>
                Copia del{" "}
                {formatSnapshotDate(state.outcomeSource.snapshotFetchedAt)}.
              </span>
              <ExternalLink href={state.outcomeSource.sourceUrl}>
                Fuente: EDUCAbase
              </ExternalLink>
            </footer>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
