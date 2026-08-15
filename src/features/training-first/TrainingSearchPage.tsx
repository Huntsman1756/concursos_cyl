import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TrainingProgram } from "../../../data/schemas/generated";
import { loadGeneratedResource } from "../../data/generatedDataClient";
import { TrainingProgramsSchema } from "../../../data/schemas/generated";

export function TrainingSearchPage({
  programs: providedPrograms,
}: {
  programs?: TrainingProgram[];
}) {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainingProgram[]>(
    providedPrograms ?? [],
  );
  const [query, setQuery] = useState("");
  const [selectedProgramKey, setSelectedProgramKey] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(!providedPrograms);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (providedPrograms) return;
    let active = true;
    void loadGeneratedResource("/data/v1/programs.json", TrainingProgramsSchema)
      .then((value) => {
        if (active) setPrograms(value);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [providedPrograms]);

  const visiblePrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    if (!normalizedQuery) return programs.slice(0, 12);
    return programs
      .filter((program) =>
        `${program.programTitle} ${program.programKey}`
          .toLocaleLowerCase("es")
          .includes(normalizedQuery),
      )
      .slice(0, 12);
  }, [programs, query]);

  return (
    <div className="journey-page">
      <p className="eyebrow">Desde tu formación</p>
      <h1>He terminado FP</h1>
      <p>Selecciona el ciclo oficial para ver ofertas y rutas comprobables.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selectedProgramKey) navigate(`/formacion/${selectedProgramKey}`);
        }}
      >
        <label htmlFor="program-search">Ciclo formativo</label>
        <input
          id="program-search"
          role="combobox"
          aria-controls="program-options"
          aria-expanded={visiblePrograms.length > 0}
          aria-autocomplete="list"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedProgramKey(null);
          }}
          placeholder="Busca un título oficial"
        />
        {loading ? <p role="status">Cargando ciclos oficiales…</p> : null}
        {loadError ? (
          <p role="status">No se pudieron cargar los ciclos oficiales.</p>
        ) : null}
        {!loading && visiblePrograms.length > 0 ? (
          <div
            id="program-options"
            role="listbox"
            aria-label="Ciclos oficiales"
          >
            {visiblePrograms.map((program) => (
              <button
                key={program.programKey}
                type="button"
                role="option"
                aria-selected={selectedProgramKey === program.programKey}
                onClick={() => {
                  setQuery(program.programTitle);
                  setSelectedProgramKey(program.programKey);
                }}
              >
                {program.programTitle} ({program.programKey})
              </button>
            ))}
          </div>
        ) : null}
        <label htmlFor="province-filter">Provincia (opcional)</label>
        <select id="province-filter" defaultValue="">
          <option value="">Todas las provincias</option>
          <option value="Ávila">Ávila</option>
          <option value="Burgos">Burgos</option>
          <option value="León">León</option>
          <option value="Valladolid">Valladolid</option>
        </select>
        <button type="submit" disabled={!selectedProgramKey}>
          Ver ofertas y rutas
        </button>
      </form>
    </div>
  );
}
