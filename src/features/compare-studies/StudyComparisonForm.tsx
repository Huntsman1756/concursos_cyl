import type {
  TrainingProgram,
  OutcomeIndicator,
} from "../../../data/schemas/generated";

export interface StudySelection {
  programKeys: string[];
  cohort: string;
  postGraduationYear: 1 | 2 | 3 | 4;
}

function sharedCohorts(
  programs: string[],
  indicators: OutcomeIndicator[],
): string[] {
  if (programs.length === 0) return [];
  const sets = programs.map(
    (programKey) =>
      new Set(
        indicators
          .filter((indicator) => indicator.trainingProgramKey === programKey)
          .map((indicator) => indicator.cohort),
      ),
  );
  return [...sets[0]].filter((cohort) => sets.every((set) => set.has(cohort)));
}

function availableYear(
  programs: string[],
  cohort: string,
  year: number,
  indicators: OutcomeIndicator[],
): boolean {
  return programs.every((programKey) =>
    indicators.some(
      (indicator) =>
        indicator.trainingProgramKey === programKey &&
        indicator.cohort === cohort &&
        indicator.postGraduationYear === year,
    ),
  );
}

function firstAvailableYear(
  programs: string[],
  cohort: string,
  indicators: OutcomeIndicator[],
): 1 | 2 | 3 | 4 {
  return (
    ([1, 2, 3, 4] as const).find((year) =>
      availableYear(programs, cohort, year, indicators),
    ) ?? 1
  );
}

export function StudyComparisonForm({
  programs,
  indicators,
  selection,
  onChange,
}: {
  programs: TrainingProgram[];
  indicators: OutcomeIndicator[];
  selection: StudySelection;
  onChange: (selection: StudySelection) => void;
}) {
  const cohorts = sharedCohorts(selection.programKeys, indicators);
  const updateProgram = (index: number, value: string) => {
    const next = [...selection.programKeys];
    next[index] = value;
    const nextCohorts = sharedCohorts(next, indicators);
    const nextCohort = nextCohorts.includes(selection.cohort)
      ? selection.cohort
      : (nextCohorts[0] ?? "");
    onChange({
      ...selection,
      programKeys: next,
      cohort: nextCohort,
      postGraduationYear: firstAvailableYear(next, nextCohort, indicators),
    });
  };

  return (
    <form
      className="comparison-form"
      onSubmit={(event) => event.preventDefault()}
    >
      <fieldset>
        <legend>Elige de uno a tres ciclos</legend>
        {selection.programKeys.map((programKey, index) => (
          <label key={`${index}-${programKey}`}>
            Ciclo {index + 1}
            <select
              aria-label={`Ciclo ${index + 1}`}
              value={programKey}
              onChange={(event) => updateProgram(index, event.target.value)}
            >
              {programs.map((program) => (
                <option
                  key={program.programKey}
                  value={program.programKey}
                  disabled={
                    selection.programKeys.includes(program.programKey) &&
                    program.programKey !== programKey
                  }
                >
                  {program.programTitle}
                </option>
              ))}
            </select>
          </label>
        ))}
        {selection.programKeys.length < 3 ? (
          <button
            type="button"
            onClick={() => {
              const next = programs.find(
                (program) =>
                  !selection.programKeys.includes(program.programKey),
              );
              if (!next) return;
              const nextKeys = [...selection.programKeys, next.programKey];
              const nextCohorts = sharedCohorts(nextKeys, indicators);
              const nextCohort = nextCohorts.includes(selection.cohort)
                ? selection.cohort
                : (nextCohorts[0] ?? "");
              onChange({
                ...selection,
                programKeys: nextKeys,
                cohort: nextCohort,
                postGraduationYear: firstAvailableYear(
                  nextKeys,
                  nextCohort,
                  indicators,
                ),
              });
            }}
          >
            Añadir otro ciclo
          </button>
        ) : null}
      </fieldset>
      <label>
        Cohorte de graduación
        <select
          aria-label="Cohorte de graduación"
          value={selection.cohort}
          disabled={cohorts.length === 0}
          onChange={(event) =>
            onChange({
              ...selection,
              cohort: event.target.value,
              postGraduationYear: firstAvailableYear(
                selection.programKeys,
                event.target.value,
                indicators,
              ),
            })
          }
        >
          {cohorts.length === 0 ? (
            <option value="">No hay cohortes compatibles</option>
          ) : (
            cohorts.map((cohort) => (
              <option key={cohort} value={cohort}>
                {cohort}
              </option>
            ))
          )}
        </select>
      </label>
      <label>
        Año después de graduarte
        <select
          aria-label="Año después de graduarte"
          value={selection.postGraduationYear}
          onChange={(event) =>
            onChange({
              ...selection,
              postGraduationYear: Number(event.target.value) as 1 | 2 | 3 | 4,
            })
          }
        >
          {[1, 2, 3, 4].map((year) => {
            const isAvailable =
              selection.cohort.length > 0 &&
              availableYear(
                selection.programKeys,
                selection.cohort,
                year,
                indicators,
              );
            return (
              <option key={year} value={year} disabled={!isAvailable}>
                {year}º año{isAvailable ? "" : " — dato aún no observado"}
              </option>
            );
          })}
        </select>
      </label>
    </form>
  );
}
