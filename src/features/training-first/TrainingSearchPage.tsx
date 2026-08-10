import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { TrainingProgram } from "../../../data/schemas/generated";
import type { MappingCoverage } from "../../../data/schemas/curatedMappings";
import {
  loadFoundationResources,
  loadMappingCoverage,
  loadManifest,
} from "../../data/generatedDataClient";
import { trainingLevelLabel } from "../../domain/trainingPresentation";

const PROVINCES = [
  "Ávila",
  "Burgos",
  "León",
  "Palencia",
  "Salamanca",
  "Segovia",
  "Soria",
  "Valladolid",
  "Zamora",
] as const;

interface CatalogSummary {
  programCount: number;
  reviewedModalityCount: number;
}

export function TrainingSearchPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [programKey, setProgramKey] = useState("");
  const [coverage, setCoverage] = useState<MappingCoverage[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<CatalogSummary | null>(
    null,
  );
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => ({
        resources: await loadFoundationResources(manifest),
        coverage: await loadMappingCoverage(manifest),
      }))
      .then(({ resources, coverage }) => {
        if (!active) return;
        setPrograms(resources.programs);
        setCoverage(coverage);
        setCatalogSummary({
          programCount: resources.programs.length,
          reviewedModalityCount: coverage.filter(
            (row) =>
              row.scope === "program" && row.coverageStatus === "reviewed",
          ).length,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("failed");
      });
    return () => {
      active = false;
    };
  }, []);

  const sortedPrograms = useMemo(
    () =>
      [...programs].sort((left, right) =>
        left.programTitle.localeCompare(right.programTitle, "es"),
      ),
    [programs],
  );
  const validSelection = programs.some(
    (program) => program.programKey === programKey,
  );
  const selectedCoverage = coverage.find(
    (row): row is Extract<MappingCoverage, { scope: "program" }> =>
      row.scope === "program" && row.programKey === programKey,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validSelection) return;
    const query =
      province === "" ? "" : `?province=${encodeURIComponent(province)}`;
    navigate(`/desde-fp/${encodeURIComponent(programKey)}${query}`);
  }

  return (
    <section className="training-page" aria-busy={status === "loading"}>
      <header className="training-page__header">
        <p className="training-page__eyebrow">Desde tu formación</p>
        <h1>Encuentra ofertas relacionadas con tu FP</h1>
        <p>
          Elige tu ciclo oficial. Mostraremos únicamente relaciones revisadas y
          requisitos publicados por cada vacante.
        </p>
      </header>

      {catalogSummary !== null && (
        <section
          className="training-catalog-note"
          aria-label="Alcance del catálogo de FP"
        >
          <h2>El catálogo completo está disponible</h2>
          <p>
            El selector contiene {catalogSummary.programCount} ciclos oficiales.
            La cobertura ocupacional revisada es una capa separada: ahora
            incluye {catalogSummary.reviewedModalityCount}{" "}
            {catalogSummary.reviewedModalityCount === 1 ? "clave" : "claves"} de
            modalidad.
          </p>
          <p>
            Si un ciclo no tiene una relación revisada, podrás seguir
            consultando dónde se estudia; la ausencia de una relación no
            significa que el ciclo no tenga salidas profesionales.
          </p>
          <Link to="/metodologia#fp-catalogo">
            Cómo funciona la cobertura de FP
          </Link>
        </section>
      )}

      {status === "loading" && <p>Preparando los ciclos oficiales…</p>}
      {status === "failed" && (
        <div className="status-panel" role="alert">
          <h2>No hemos podido cargar los ciclos</h2>
          <p>Vuelve a intentarlo dentro de unos minutos.</p>
        </div>
      )}
      {status === "ready" && (
        <form className="training-search" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="training-program">
              Ciclo de Formación Profesional
            </label>
            <select
              id="training-program"
              value={programKey}
              onChange={(event) => setProgramKey(event.target.value)}
            >
              <option value="">Selecciona un ciclo</option>
              {sortedPrograms.map((program) => (
                <option key={program.programKey} value={program.programKey}>
                  {program.programTitle} — {trainingLevelLabel(program.level)} ·{" "}
                  {program.programKey}
                </option>
              ))}
            </select>
          </div>
          {selectedCoverage !== undefined && (
            <p role="status" aria-live="polite">
              {selectedCoverage.coverageStatus === "reviewed"
                ? `Cobertura revisada: ${selectedCoverage.approvedMappings} ocupaciones CNO.`
                : "Cobertura revisada no disponible para este ciclo."}
            </p>
          )}
          <div className="form-field">
            <label htmlFor="training-province">Provincia (opcional)</label>
            <select
              id="training-province"
              value={province}
              onChange={(event) => setProvince(event.target.value)}
            >
              <option value="">Toda Castilla y León</option>
              {PROVINCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={!validSelection}
          >
            Ver ofertas
          </button>
        </form>
      )}
    </section>
  );
}
