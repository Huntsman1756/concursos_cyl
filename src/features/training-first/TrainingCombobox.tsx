import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { TrainingProgram } from "../../../data/schemas/generated";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import "./TrainingCombobox.css";

export interface TrainingComboboxProps {
  id: string;
  programs: readonly TrainingProgram[];
  confirmedProgram: TrainingProgram | null;
  onConfirm(program: TrainingProgram): void;
  onClear(): void;
  label: string;
  hint: string;
}

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .trim();
}

function resultCountMessage(count: number): string {
  return count === 1
    ? "1 ciclo oficial encontrado"
    : `${count} ciclos oficiales encontrados`;
}

function searchableText(program: TrainingProgram): string {
  return normalized(
    [
      program.programTitle,
      program.familyName,
      program.programKey,
      trainingLevelLabel(program.level),
    ].join(" "),
  );
}

export function TrainingCombobox({
  id,
  programs,
  confirmedProgram,
  onConfirm,
  onClear,
  label,
  hint,
}: TrainingComboboxProps): JSX.Element {
  const [query, setQuery] = useState(confirmedProgram?.programTitle ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [confirmedProgramKey, setConfirmedProgramKey] = useState<string | null>(
    confirmedProgram?.programKey ?? null,
  );
  const results = useMemo(() => {
    const search = normalized(query);
    if (search === "") return [];
    return [...programs]
      .filter((program) => searchableText(program).includes(search))
      .sort(
        (left, right) =>
          left.programTitle.localeCompare(right.programTitle, "es", {
            sensitivity: "base",
          }) || left.programKey.localeCompare(right.programKey),
      );
  }, [programs, query]);

  function optionId(programKey: string): string {
    return `${id}-option-${programKey.replace(/[^a-z\d]+/giu, "-")}`;
  }

  function selectProgram(program: TrainingProgram): void {
    setQuery(program.programTitle);
    setConfirmedProgramKey(program.programKey);
    setOpen(false);
    setActiveIndex(-1);
    onConfirm(program);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? results.length - 1 : current - 1,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const result = results[activeIndex];
      if (result !== undefined) selectProgram(result);
    }
  }

  const showResults = open && query.trim() !== "";
  const hasListbox = showResults && results.length > 0;
  const listboxId = `${id}-listbox`;

  return (
    <div className="training-combobox">
      <label htmlFor={id}>{label}</label>
      <p className="training-combobox__hint" id={`${id}-hint`}>
        {hint}
      </p>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={hasListbox}
        aria-controls={hasListbox ? listboxId : undefined}
        aria-describedby={`${id}-hint`}
        aria-activedescendant={
          hasListbox && activeIndex >= 0 && results[activeIndex] !== undefined
            ? optionId(results[activeIndex].programKey)
            : undefined
        }
        placeholder="Ej.: informática"
        value={query}
        onChange={(event) => {
          if (confirmedProgramKey !== null && event.target.value !== query) {
            onClear();
            setConfirmedProgramKey(null);
          }
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query.trim() !== "") setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="training-combobox__announcement" aria-live="polite">
        {showResults ? resultCountMessage(results.length) : ""}
      </div>
      {showResults && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="training-combobox__options"
        >
          {results.map((program, resultIndex) => (
            <li
              id={optionId(program.programKey)}
              key={program.programKey}
              role="option"
              aria-selected={activeIndex === resultIndex}
              className="training-combobox__option"
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(resultIndex)}
              onClick={() => selectProgram(program)}
            >
              <span>{program.programTitle}</span>
              <small>
                {trainingLevelLabel(program.level)} · {program.familyName} ·{" "}
                {program.programKey}
              </small>
            </li>
          ))}
        </ul>
      )}
      {showResults && results.length === 0 && (
        <p className="training-combobox__message">
          No encontramos un ciclo oficial con ese nombre.
        </p>
      )}
    </div>
  );
}
