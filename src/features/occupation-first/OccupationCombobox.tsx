import type { OccupationSearchResult } from "../../domain/occupation";

export function OccupationCombobox({
  query,
  results,
  confirmedOccupationId,
  onQueryChange,
  onSelect,
}: {
  query: string;
  results: OccupationSearchResult[];
  confirmedOccupationId: string | null;
  onQueryChange: (value: string) => void;
  onSelect: (result: OccupationSearchResult) => void;
}) {
  return (
    <div className="occupation-combobox">
      <label htmlFor="occupation-search">Ocupación</label>
      <input
        id="occupation-search"
        role="combobox"
        aria-controls="occupation-options"
        aria-expanded={results.length > 0}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Escribe una ocupación cotidiana"
      />
      {results.length > 0 ? (
        <ul id="occupation-options" role="listbox">
          {results.map((result) => (
            <li key={result.occupationId}>
              <button
                type="button"
                role="option"
                aria-selected={confirmedOccupationId === result.occupationId}
                onClick={() => onSelect(result)}
              >
                {result.matchedAlias} — {result.preferredLabel}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
