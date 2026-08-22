import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { TrainingProgram } from "../../../data/schemas/generated";
import type { MappingCoverage } from "../../../data/schemas/curatedMappings";
import {
  loadFoundationResourceSubset,
  loadMappingCoverage,
  loadManifest,
} from "../../data/generatedDataClient";
import {
  featuredTrainingCoverage,
  trainingLevelLabel,
} from "../../domain/trainingPresentation";
import { CYL_PROVINCES } from "../../domain/territory";
import { useRouteReady } from "../../app/RouteReadyContext";
import { TrainingCombobox } from "./TrainingCombobox";

interface CatalogSummary {
  programCount: number;
  reviewedModalityCount: number;
}

export function TrainingSearchPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [confirmedProgram, setConfirmedProgram] =
    useState<TrainingProgram | null>(null);
  const [coverage, setCoverage] = useState<MappingCoverage[]>([]);
  const [catalogSummary, setCatalogSummary] = useState<CatalogSummary | null>(
    null,
  );
  const [levelFilter, setLevelFilter] = useState<TrainingProgram["level"] | "">(
    "",
  );
  const [familyFilter, setFamilyFilter] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useRouteReady(status === "ready");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => ({
        resources: await loadFoundationResourceSubset(
          manifest,
          ["programs"],
          options,
        ),
        coverage: await loadMappingCoverage(manifest, options),
      }))
      .then(({ resources, coverage }) => {
        if (signal.aborted) return;
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
        if (signal.aborted) return;
        setStatus("failed");
      });
    return () => {
      controller.abort();
    };
  }, []);

  const levelOptions = useMemo(
    () =>
      [...new Set(programs.map((program) => program.level))].sort(
        (left, right) =>
          trainingLevelLabel(left).localeCompare(
            trainingLevelLabel(right),
            "es",
          ),
      ),
    [programs],
  );

  const familyOptions = useMemo(() => {
    const families = new Map<string, string>();
    for (const program of programs) {
      families.set(program.familyCode, program.familyName);
    }
    return [...families.entries()].sort(
      ([leftCode, leftName], [rightCode, rightName]) =>
        leftName.localeCompare(rightName, "es") ||
        leftCode.localeCompare(rightCode),
    );
  }, [programs]);

  const filteredPrograms = useMemo(
    () =>
      programs
        .filter(
          (program) =>
            (levelFilter === "" || program.level === levelFilter) &&
            (familyFilter === "" || program.familyCode === familyFilter),
        )
        .sort(
          (left, right) =>
            left.programTitle.localeCompare(right.programTitle, "es", {
              sensitivity: "base",
            }) || left.programKey.localeCompare(right.programKey),
        ),
    [familyFilter, levelFilter, programs],
  );

  const guidedExamples = useMemo(() => {
    const programsByKey = new Map(
      programs.map((program) => [program.programKey, program]),
    );
    return featuredTrainingCoverage(coverage).flatMap((row) => {
      const program = programsByKey.get(row.programKey);
      return program === undefined ? [] : [{ row, program }];
    });
  }, [coverage, programs]);

  const selectedCoverage = coverage.find(
    (row): row is Extract<MappingCoverage, { scope: "program" }> =>
      row.scope === "program" &&
      row.programKey === confirmedProgram?.programKey,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmedProgram === null) return;
    const query =
      province === "" ? "" : `?province=${encodeURIComponent(province)}`;
    navigate(
      `/desde-fp/${encodeURIComponent(confirmedProgram.programKey)}${query}`,
    );
  }

  return (
    <section
      className="training-page"
      aria-busy={status === "loading"}
      aria-labelledby="training-search-heading"
    >
      <header className="training-page__header">
        <p className="training-page__eyebrow">Desde tu formación</p>
        <h1 id="training-search-heading">
          Consulta salidas y ofertas relacionadas con tu FP
        </h1>
        <p>
          Elige tu ciclo oficial. Verás sus salidas publicadas por TodoFP y, por
          separado, las ocupaciones y ofertas que ya hemos podido relacionar con
          evidencia revisada.
        </p>
      </header>

      {catalogSummary !== null && (
        <section
          className="training-catalog-note"
          aria-label="Alcance del catálogo de FP"
        >
          <h2>Consulta los ciclos de la copia publicada</h2>
          <p>
            El selector contiene {catalogSummary.programCount} ciclos oficiales.
            Todos muestran las salidas profesionales publicadas por TodoFP.
          </p>
          <p>
            Para buscar ofertas usamos relaciones revisadas entre ciclos y
            grupos de la Clasificación Nacional de Ocupaciones (CNO-11). Ahora
            hay {catalogSummary.reviewedModalityCount}{" "}
            {catalogSummary.reviewedModalityCount === 1
              ? "ciclo o modalidad"
              : "ciclos o modalidades"}{" "}
            con esa relación revisada. Si falta, no mostramos ofertas dudosas.
          </p>
          <Link to="/metodologia#fp-catalogo">
            Cómo funciona la cobertura de FP
          </Link>
        </section>
      )}

      {status === "loading" && (
        <p role="status" aria-live="polite">
          Preparando los ciclos oficiales…
        </p>
      )}
      {status === "failed" && (
        <div className="status-panel" role="alert">
          <h2>No hemos podido cargar los ciclos</h2>
          <p>Vuelve a intentarlo dentro de unos minutos.</p>
        </div>
      )}
      {status === "ready" && (
        <>
          <section
            className="training-guided-examples"
            aria-label="Ejemplos guiados de ciclos"
          >
            <h2>Empieza con un ciclo relacionado</h2>
            <p>
              Ejemplos de ciclos con relaciones revisadas; no es el catálogo
              completo.
            </p>
            <ul>
              {guidedExamples.map(({ row, program }) => (
                <li key={program.programKey}>
                  <Link
                    to={`/desde-fp/${encodeURIComponent(program.programKey)}`}
                  >
                    {program.programTitle}
                  </Link>
                  <span>
                    {trainingLevelLabel(program.level)} · {row.familyName}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <form className="training-search" onSubmit={submit}>
            <div className="form-field">
              <label htmlFor="training-level">Filtrar por nivel</label>
              <select
                id="training-level"
                value={levelFilter}
                onChange={(event) => {
                  const nextLevel = event.target.value as
                    TrainingProgram["level"] | "";
                  setLevelFilter(nextLevel);
                  if (
                    confirmedProgram !== null &&
                    nextLevel !== "" &&
                    confirmedProgram.level !== nextLevel
                  ) {
                    setConfirmedProgram(null);
                  }
                }}
              >
                <option value="">Todos los niveles</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>
                    {trainingLevelLabel(level)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="training-family">
                Filtrar por familia profesional
              </label>
              <select
                id="training-family"
                value={familyFilter}
                onChange={(event) => {
                  const nextFamily = event.target.value;
                  setFamilyFilter(nextFamily);
                  if (
                    confirmedProgram !== null &&
                    nextFamily !== "" &&
                    confirmedProgram.familyCode !== nextFamily
                  ) {
                    setConfirmedProgram(null);
                  }
                }}
              >
                <option value="">Todas las familias profesionales</option>
                {familyOptions.map(([familyCode, familyName]) => (
                  <option key={familyCode} value={familyCode}>
                    {familyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <TrainingCombobox
                id="training-program"
                programs={filteredPrograms}
                confirmedProgram={confirmedProgram}
                onConfirm={setConfirmedProgram}
                onClear={() => setConfirmedProgram(null)}
                label="Ciclo de Formación Profesional"
                hint="Busca un ciclo oficial por nombre, familia, nivel o código."
              />
            </div>
            {selectedCoverage !== undefined && (
              <p role="status" aria-live="polite">
                {selectedCoverage.coverageStatus === "reviewed"
                  ? `Relaciones revisadas con ${selectedCoverage.approvedMappings} ${selectedCoverage.approvedMappings === 1 ? "grupo" : "grupos"} de ocupación.`
                  : "Salidas oficiales disponibles; todavía no hay una relación revisada para buscar ofertas."}
              </p>
            )}
            <div className="form-field">
              <label htmlFor="training-province">
                Provincia para el contexto (opcional)
              </label>
              <p id="training-province-hint">
                Se usa solo para mostrar contexto provincial; no filtra los
                centros publicados.
              </p>
              <select
                id="training-province"
                aria-describedby="training-province-hint"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
              >
                <option value="">Toda Castilla y León</option>
                {CYL_PROVINCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="primary-button"
              type="submit"
              disabled={confirmedProgram === null}
            >
              Ver salidas y ofertas
            </button>
          </form>
        </>
      )}
    </section>
  );
}
