import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type {
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import { buildOccupationIndex } from "../../domain/occupation";

interface OccupationComboboxProps {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  confirmedOccupation: Occupation | null;
  onConfirm: (occupation: Occupation) => void;
  onClear: () => void;
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
    ? "1 ocupación revisada encontrada"
    : `${count} ocupaciones revisadas encontradas`;
}

export function OccupationCombobox({
  occupations,
  aliases,
  confirmedOccupation,
  onConfirm,
  onClear,
}: OccupationComboboxProps) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const index = useMemo(
    () => buildOccupationIndex(occupations, aliases),
    [aliases, occupations],
  );
  const results = useMemo(
    () => (query.trim() === "" ? [] : index.search(query)),
    [index, query],
  );

  function optionId(occupationId: string): string {
    return `${listboxId}-${occupationId.replace(/[^a-z\d]+/giu, "-")}`;
  }

  function matchedAlias(occupationId: string): string | undefined {
    const normalizedQuery = normalized(query);
    return aliases.find(
      (candidate) =>
        candidate.occupationId === occupationId &&
        candidate.reviewStatus === "approved" &&
        (normalized(candidate.alias).includes(normalizedQuery) ||
          normalizedQuery.includes(normalized(candidate.alias))),
    )?.alias;
  }

  function selectOccupation(occupationId: string): void {
    const occupation = occupations.find(
      (candidate) => candidate.occupationId === occupationId,
    );
    if (occupation === undefined || occupation.reviewStatus !== "approved") {
      return;
    }
    setQuery(occupation.preferredLabel);
    setOpen(false);
    setActiveIndex(-1);
    onConfirm(occupation);
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
      if (result !== undefined) selectOccupation(result.occupationId);
    }
  }

  function clear(): void {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    onClear();
  }

  const showResults = open && query.trim() !== "";
  return (
    <div className="occupation-combobox">
      <label htmlFor={inputId}>¿En qué ocupación quieres trabajar?</label>
      <p className="form-hint" id={`${inputId}-hint`}>
        Escribe un término habitual y confirma una ocupación oficial.
      </p>
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={listboxId}
        aria-describedby={`${inputId}-hint`}
        aria-activedescendant={
          showResults && activeIndex >= 0 && results[activeIndex] !== undefined
            ? optionId(results[activeIndex].occupationId)
            : undefined
        }
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query.trim() !== "") setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      <div className="sr-only" aria-live="polite">
        {showResults ? resultCountMessage(results.length) : ""}
      </div>
      {showResults && results.length > 0 && (
        <ul id={listboxId} role="listbox" className="occupation-options">
          {results.map((result, resultIndex) => {
            const alias = matchedAlias(result.occupationId);
            return (
              <li
                id={optionId(result.occupationId)}
                key={result.occupationId}
                role="option"
                aria-selected={activeIndex === resultIndex}
                className="occupation-option"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(resultIndex)}
                onClick={() => selectOccupation(result.occupationId)}
              >
                <span>{result.preferredLabel}</span>
                <small>
                  {alias === undefined
                    ? `CNO-11 ${result.occupationId.split(":").at(-1)}`
                    : `Coincide con: ${alias}`}
                </small>
              </li>
            );
          })}
        </ul>
      )}
      {showResults && results.length === 0 && (
        <p className="form-message">
          No encontramos una ocupación revisada con ese nombre.
        </p>
      )}
      {confirmedOccupation !== null && (
        <div className="confirmed-occupation" role="status">
          <p>
            <strong>Ocupación confirmada:</strong>{" "}
            {confirmedOccupation.preferredLabel}
          </p>
          <p>
            CNO-11 {confirmedOccupation.classificationCode}. La búsqueda solo
            usa equivalencias revisadas.
          </p>
          <button className="secondary-button" type="button" onClick={clear}>
            Nueva búsqueda
          </button>
        </div>
      )}
    </div>
  );
}
