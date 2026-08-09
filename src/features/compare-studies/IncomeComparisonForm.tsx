import type {
  OutcomeCohortWindow,
  OutcomeGroup,
  OutcomeTrainingLevel,
} from "../../../data/schemas/outcomes";

export interface IncomeComparisonFormProps {
  trainingLevel: OutcomeTrainingLevel | null;
  groups: readonly OutcomeGroup[];
  selectedGroupKeys: readonly string[];
  cohort: string;
  cohortWindow: OutcomeCohortWindow | null;
  cohortWindows: readonly OutcomeCohortWindow[];
  postGraduationYear: 1 | 2 | 3 | 4;
  onTrainingLevelChange: (level: OutcomeTrainingLevel) => void;
  onGroupKeysChange: (groupKeys: readonly string[]) => void;
  onCohortChange: (cohort: string) => void;
  onPostGraduationYearChange: (year: 1 | 2 | 3 | 4) => void;
}

const TRAINING_LEVELS: readonly {
  value: OutcomeTrainingLevel;
  label: string;
}[] = [
  { value: "intermediate", label: "Grado Medio" },
  { value: "higher", label: "Grado Superior" },
];

/** Collects only the user's in-memory, scope-preserving comparison selection. */
export function IncomeComparisonForm({
  trainingLevel,
  groups,
  selectedGroupKeys,
  cohort,
  cohortWindow,
  cohortWindows,
  postGraduationYear,
  onTrainingLevelChange,
  onGroupKeysChange,
  onCohortChange,
  onPostGraduationYearChange,
}: IncomeComparisonFormProps) {
  const selectedGroups = new Set(selectedGroupKeys);
  const groupsAtLimit = selectedGroupKeys.length >= 3;

  function toggleGroup(groupKey: string, checked: boolean) {
    if (checked) {
      if (groupsAtLimit) return;
      onGroupKeysChange([...selectedGroupKeys, groupKey]);
      return;
    }
    onGroupKeysChange(selectedGroupKeys.filter((value) => value !== groupKey));
  }

  return (
    <form className="income-comparison-form" aria-describedby="compare-help">
      <p id="compare-help" className="form-introduction">
        Elige un nivel y hasta tres ciclos o grupos oficiales. Todos los datos
        que se muestren compartirán la misma cohorte y el mismo año.
      </p>
      <fieldset className="income-form-fieldset">
        <legend>1. Nivel de formación</legend>
        <div className="income-choice-row">
          {TRAINING_LEVELS.map((level) => (
            <label className="income-choice" key={level.value}>
              <input
                type="radio"
                name="training-level"
                value={level.value}
                checked={trainingLevel === level.value}
                onChange={() => onTrainingLevelChange(level.value)}
              />
              <span>{level.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {trainingLevel ? (
        <>
          <fieldset className="income-form-fieldset">
            <legend>2. Ciclos o grupos oficiales</legend>
            <p className="field-hint" aria-live="polite">
              {selectedGroupKeys.length === 0
                ? "Selecciona entre uno y tres."
                : `${selectedGroupKeys.length} de 3 seleccionados.`}
            </p>
            <div className="income-group-options">
              {groups.map((group) => {
                const checked = selectedGroups.has(group.groupKey);
                return (
                  <label className="income-check" key={group.groupKey}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && groupsAtLimit}
                      onChange={(event) =>
                        toggleGroup(group.groupKey, event.target.checked)
                      }
                    />
                    <span>{group.officialLabel}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="income-form-grid">
            <label className="income-select-field">
              <span>3. Cohorte de titulación</span>
              <select
                value={cohort}
                onChange={(event) => onCohortChange(event.target.value)}
              >
                {cohortWindows.map((window) => (
                  <option key={window.cohort} value={window.cohort}>
                    {window.cohort}
                    {window.provisional ? " (provisional)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="income-form-fieldset income-year-fieldset">
              <legend>4. Año tras titularse</legend>
              <div className="income-choice-row">
                {([1, 2, 3, 4] as const).map((year) => (
                  <label
                    className="income-choice income-choice--compact"
                    key={year}
                  >
                    <input
                      type="radio"
                      name="post-graduation-year"
                      value={year}
                      checked={postGraduationYear === year}
                      disabled={
                        !cohortWindow ||
                        year > cohortWindow.maxObservedPostGraduationYear
                      }
                      onChange={() => onPostGraduationYearChange(year)}
                    />
                    <span>{year}</span>
                  </label>
                ))}
              </div>
              {cohortWindow ? (
                <p className="field-hint">
                  {cohortWindow.provisional
                    ? "Cohorte provisional."
                    : "Ventana observada completa."}
                </p>
              ) : null}
            </fieldset>
          </div>
        </>
      ) : (
        <p className="field-hint">Selecciona primero el nivel de formación.</p>
      )}
    </form>
  );
}
