import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import { buildOccupationIndex } from "../../domain/occupation";
import { OccupationCombobox } from "./OccupationCombobox";

export function OccupationSearchPage({
  occupations,
  aliases,
}: {
  occupations: Occupation[];
  aliases: OccupationAlias[];
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [confirmedOccupationId, setConfirmedOccupationId] = useState<
    string | null
  >(null);
  const index = useMemo(
    () => buildOccupationIndex(occupations, aliases),
    [occupations, aliases],
  );
  const results = query.trim() ? index.search(query) : [];

  return (
    <div className="journey-page">
      <p className="eyebrow">Desde una ocupación</p>
      <h1>Quiero trabajar de…</h1>
      <p>
        Confirma una ocupación oficial para ver ciclos y centros relacionados.
      </p>
      <OccupationCombobox
        query={query}
        results={results}
        confirmedOccupationId={confirmedOccupationId}
        onQueryChange={(value) => {
          setQuery(value);
          setConfirmedOccupationId(null);
        }}
        onSelect={(result) => {
          setQuery(result.matchedAlias);
          setConfirmedOccupationId(result.occupationId);
        }}
      />
      <p aria-live="polite">
        {query.trim() && results.length > 0
          ? `${results.length} ocupaciones revisadas encontradas.`
          : query.trim()
            ? "No encontramos una ocupación revisada con ese nombre."
            : ""}
      </p>
      <button
        type="button"
        disabled={!confirmedOccupationId}
        onClick={() => {
          if (confirmedOccupationId) {
            navigate(`/desde-ocupacion/${confirmedOccupationId}`);
          }
        }}
      >
        Ver rutas
      </button>
    </div>
  );
}
