import { useMemo, useState } from "react";

import type {
  OutcomeCohortWindow,
  OutcomeGroup,
  OutcomeTrainingLevel,
} from "../../../data/schemas/outcomes";
import { formatOutcomeLabel } from "./outcomePresentation";

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
  description: string;
}[] = [
  {
    value: "intermediate",
    label: "Grado medio",
    description: "Títulos de técnico",
  },
  {
    value: "higher",
    label: "Grado superior",
    description: "Títulos de técnico superior",
  },
];

function normalizedSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .trim();
}

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
  const [filterQuery, setFilterQuery] = useState("");
  const selectedGroups = useMemo(
    () => new Set(selectedGroupKeys),
    [selectedGroupKeys],
  );
  const groupsAtLimit = selectedGroupKeys.length >= 3;
  const normalizedQuery = normalizedSearchTerm(filterQuery);
  const queryTokens = normalizedQuery.split(/\s+/u).filter(Boolean);
  const visibleGroups = useMemo(() => {
    const selected = groups.filter((group) =>
      selectedGroups.has(group.groupKey),
    );
    const matchesQuery = (group: OutcomeGroup) =>
      queryTokens.every((token) =>
        normalizedSearchTerm(group.officialLabel).includes(token),
      );
    const matches = groups.filter(
      (group) => !selectedGroups.has(group.groupKey) && matchesQuery(group),
    );
    return {
      groups: [...selected, ...matches],
      matchingCount: selected.filter(matchesQuery).length + matches.length,
    };
  }, [groups, queryTokens, selectedGroups]);
  const currentStep =
    trainingLevel === null ? 1 : selectedGroupKeys.length === 0 ? 2 : 3;

  function toggleGroup(groupKey: string, checked: boolean) {
    if (checked) {
      if (groupsAtLimit) return;
      onGroupKeysChange([...selectedGroupKeys, groupKey]);
      return;
    }
    onGroupKeysChange(selectedGroupKeys.filter((value) => value !== groupKey));
  }

  return (
    <form
      className="income-comparison-form"
      aria-label="Seleccionar datos de comparación"
    >
      <ol className="comparison-steps" aria-label="Pasos de la comparación">
        <li
          className={trainingLevel ? "is-complete" : "is-current"}
          aria-current={currentStep === 1 ? "step" : undefined}
        >
          <span>1</span>
          <strong>Nivel</strong>
        </li>
        <li
          className={
            !trainingLevel
              ? "is-pending"
              : selectedGroupKeys.length > 0
                ? "is-complete"
                : "is-current"
          }
          aria-current={currentStep === 2 ? "step" : undefined}
        >
          <span>2</span>
          <strong>Ciclos</strong>
        </li>
        <li
          className={trainingLevel ? "is-available" : "is-pending"}
          aria-current={currentStep === 3 ? "step" : undefined}
        >
          <span>3</span>
          <strong>Cohorte</strong>
        </li>
        <li className={trainingLevel ? "is-available" : "is-pending"}>
          <span>4</span>
          <strong>Año</strong>
        </li>
      </ol>
      <fieldset className="income-form-fieldset">
        <legend>1. Nivel de formación</legend>
        <div className="income-level-options">
          {TRAINING_LEVELS.map((level) => (
            <label className="income-level-choice" key={level.value}>
              <input
                type="radio"
                name="training-level"
                value={level.value}
                aria-label={level.label}
                checked={trainingLevel === level.value}
                onChange={() => onTrainingLevelChange(level.value)}
              />
              <span>
                <strong>{level.label}</strong>
                <small>{level.description}</small>
              </span>
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
            <label className="income-filter-field">
              <span>Filtrar ciclos o grupos oficiales</span>
              <input
                type="search"
                value={filterQuery}
                onChange={(event) => setFilterQuery(event.target.value)}
                placeholder="Escribe parte del nombre"
              />
            </label>
            <p className="field-hint" aria-live="polite">
              {visibleGroups.matchingCount === 1
                ? "1 resultado disponible."
                : `${visibleGroups.matchingCount} resultados disponibles.`}
            </p>
            <div className="income-group-options">
              {visibleGroups.groups.map((group) => {
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
                    <span>{formatOutcomeLabel(group.officialLabel)}</span>
                  </label>
                );
              })}
              {visibleGroups.matchingCount === 0 ? (
                <p className="income-empty-state">
                  No hay ciclos o grupos oficiales que coincidan.
                </p>
              ) : null}
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
