import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { trainingDetailPath } from "../../app/routePaths";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { TrainingCombobox } from "./TrainingCombobox";

export function TrainingSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [confirmedProgram, setConfirmedProgram] =
    useState<TrainingProgram | null>(null);
  const [coverage, setCoverage] = useState<MappingCoverage[]>([]);
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

  const requestedLevel = searchParams.get("level") ?? "";
  const levelFilter = levelOptions.includes(
    requestedLevel as TrainingProgram["level"],
  )
    ? (requestedLevel as TrainingProgram["level"])
    : "";
  const requestedFamily = searchParams.get("family") ?? "";
  const familyFilter = familyOptions.some(
    ([familyCode]) => familyCode === requestedFamily,
  )
    ? requestedFamily
    : "";
  const requestedProvince = searchParams.get("province") ?? "";
  const province =
    CYL_PROVINCES.find((candidate) => candidate === requestedProvince) ?? "";

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

  const catalogCoverage = useMemo(() => {
    const reviewedProgramKeys = new Set(
      coverage
        .filter(
          (row): row is Extract<MappingCoverage, { scope: "program" }> =>
            row.scope === "program" && row.coverageStatus === "reviewed",
        )
        .map((row) => row.programKey),
    );
    return {
      programCount: programs.length,
      reviewedProgramCount: programs.filter((program) =>
        reviewedProgramKeys.has(program.programKey),
      ).length,
    };
  }, [coverage, programs]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmedProgram === null) return;
    navigate(
      trainingDetailPath(
        confirmedProgram.programKey,
        confirmedProgram.programTitle,
        province,
      ),
    );
  }

  function updateCatalogFilter(
    key: "level" | "family" | "province",
    value: string,
  ) {
    const next = new URLSearchParams(searchParams);
    if (value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  }

  return (
    <section
      className="training-page search-page training-search-page"
      aria-busy={status === "loading"}
      aria-labelledby="training-search-heading"
    >
      <Breadcrumbs
        items={[{ label: "Inicio", to: "/" }, { label: "Explorar FP" }]}
      />
      <header className="training-page__header">
        <h1 className="h1" id="training-search-heading">
          ¿En qué puedes trabajar con una FP?
        </h1>
        <p className="training-page__intro">
          Elige un ciclo oficial y verás las profesiones relacionadas con él,
          las ofertas de la copia actual y los centros donde estudiarlo.
        </p>
      </header>

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
                  ? `Profesiones comprobadas para este ciclo: ${selectedCoverage.approvedMappings}.`
                  : "Verás sus salidas oficiales; todavía no hay una relación comprobada para buscar ofertas."}
              </p>
            )}
            <details className="training-search__filters">
              <summary>Filtrar catálogo y contexto</summary>
              <div className="form-field">
                <label htmlFor="training-level">Nivel</label>
                <select
                  id="training-level"
                  value={levelFilter}
                  onChange={(event) => {
                    const nextLevel = event.target.value as
                      TrainingProgram["level"] | "";
                    updateCatalogFilter("level", nextLevel);
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
                <label htmlFor="training-family">Familia profesional</label>
                <select
                  id="training-family"
                  value={familyFilter}
                  onChange={(event) => {
                    const nextFamily = event.target.value;
                    updateCatalogFilter("family", nextFamily);
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
                  onChange={(event) =>
                    updateCatalogFilter("province", event.target.value)
                  }
                >
                  <option value="">Toda Castilla y León</option>
                  {CYL_PROVINCES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </details>
            <button
              className="primary-button"
              type="submit"
              disabled={confirmedProgram === null}
            >
              Ver salidas y ofertas
            </button>
          </form>
          <section
            className="training-catalog-note"
            aria-label="Alcance del catálogo de FP"
          >
            <h2>Qué cubre este buscador</h2>
            <p>
              {catalogCoverage.programCount} ciclos oficiales;{" "}
              {catalogCoverage.reviewedProgramCount}{" "}
              {catalogCoverage.reviewedProgramCount === 1
                ? "ciclo o modalidad con relaciones profesionales comprobadas"
                : "ciclos o modalidades con relaciones profesionales comprobadas"}
              .
            </p>
            <p>
              Si no aparece una relación revisada, no mostramos ofertas por
              inferencia: consulta las salidas oficiales y busca por texto.
            </p>
            <Link to="/metodologia#fp-catalogo">
              Cómo funciona la cobertura de FP
            </Link>
          </section>
        </>
      )}
    </section>
  );
}
