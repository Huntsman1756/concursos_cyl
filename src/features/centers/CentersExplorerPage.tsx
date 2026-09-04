import { useEffect, useMemo, useState } from "react";
import type { FormEvent, JSX } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type { TrainingProgram } from "../../../data/schemas/generated";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ExternalLink } from "../../components/ExternalLink";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { PageEyebrow } from "../../components/PageEyebrow";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  loadFoundationResourceSubset,
  loadManifest,
  type LoadedFoundationResourceSubset,
} from "../../data/generatedDataClient";
import { globalCentersPath, trainingDetailPath } from "../../app/routePaths";
import { buildGoogleMapsSearchUrl } from "../../domain/mapsUrl";
import { formatProgramTitle } from "../../domain/trainingPresentation";
import {
  buildCenterCatalogRows,
  facetCountsFor,
  filterCenterRows,
  CENTER_FILTER_LABELS,
  type CenterCatalogFilters,
  type CenterCatalogRow,
} from "../../domain/centerCatalog";
import {
  centerWebsiteCtaFor,
  loadCenterLinkPolicy,
} from "../../domain/centerLinkPolicy";
import "./centers.css";

type Foundation = LoadedFoundationResourceSubset<
  "programs" | "centers" | "trainingOfferings"
>;

const GLOBAL_PAGE_SIZE = 25;

const FILTER_PARAMS = [
  "query",
  "province",
  "modality",
  "titularidad",
  "level",
  "family",
  "ownership",
] as const;

type FilterParam = (typeof FILTER_PARAMS)[number];

type PageState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "unknown" }
  | {
      status: "ready";
      foundation: Foundation;
      generatedAt: string;
      program: TrainingProgram | null;
    };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function filtersFromParams(
  searchParams: URLSearchParams,
): CenterCatalogFilters {
  const read = (key: FilterParam) => searchParams.get(key) ?? "";
  return {
    query: read("query"),
    province: read("province"),
    modalidad: read("modality"),
    titularidad: read("titularidad"),
    nivel: read("level"),
    familia: read("family"),
    ownership: read("ownership"),
  };
}

function CenterRow({
  row,
  policy,
}: {
  row: CenterCatalogRow;
  policy: Awaited<ReturnType<typeof loadCenterLinkPolicy>>;
}): JSX.Element {
  const mapUrl = buildGoogleMapsSearchUrl([
    row.centerName,
    row.centerAddress ?? "",
    row.locality,
    row.province,
  ]);
  const cta = centerWebsiteCtaFor(policy, row.centerCode);
  return (
    <>
      <th scope="row">
        <strong>{row.centerName}</strong>
        <span className="cell-sub">
          {row.centerOwnership === null
            ? "Centro de formación"
            : CENTER_FILTER_LABELS.ownership[row.centerOwnership]}
        </span>
      </th>
      <td>
        {row.locality} · {row.province}
        {row.centerAddress !== null && (
          <span className="cell-sub">{row.centerAddress}</span>
        )}
      </td>
      <td>
        <Link to={trainingDetailPath(row.programKey)}>
          {formatProgramTitle(row.programTitle)}
        </Link>
        <span className="cell-sub">
          {CENTER_FILTER_LABELS.level[row.level]} · {row.programKey}
        </span>
      </td>
      <td>
        {row.modalities
          .map((modality) =>
            modality === "unknown"
              ? CENTER_FILTER_LABELS.unpublishedModality
              : CENTER_FILTER_LABELS.modality[modality],
          )
          .join(" · ")}
      </td>
      <td className="center-titularidad-cell">
        {row.teachingTypes.length === 0
          ? "—"
          : row.teachingTypes
              .map((type) => CENTER_FILTER_LABELS.teachingType[type])
              .join(" · ")}
      </td>
      <td>
        <div className="table-actions">
          {cta !== null && row.centerWebsite !== null && (
            <ExternalLink
              href={row.centerWebsite}
              className="table-action-link"
            >
              {cta}
            </ExternalLink>
          )}
          {mapUrl !== null && (
            <ExternalLink href={mapUrl} className="table-action-link">
              Cómo llegar
            </ExternalLink>
          )}
        </div>
      </td>
    </>
  );
}

function CenterResultCard({
  row,
  policy,
}: {
  row: CenterCatalogRow;
  policy: Awaited<ReturnType<typeof loadCenterLinkPolicy>>;
}): JSX.Element {
  const mapUrl = buildGoogleMapsSearchUrl([
    row.centerName,
    row.centerAddress ?? "",
    row.locality,
    row.province,
  ]);
  const cta = centerWebsiteCtaFor(policy, row.centerCode);
  return (
    <li>
      <article className="rcard">
        <div className="rcard-field">
          <p className="rcard-label">Centro</p>
          <p className="rcard-value">
            <strong>{row.centerName}</strong>
          </p>
          <p className="rcard-sub">
            {row.centerOwnership === null
              ? "Centro de formación"
              : CENTER_FILTER_LABELS.ownership[row.centerOwnership]}
          </p>
        </div>
        <div className="rcard-field">
          <p className="rcard-label">Localidad</p>
          <p className="rcard-value">
            {row.locality} · {row.province}
          </p>
        </div>
        <div className="rcard-field">
          <p className="rcard-label">Ciclo</p>
          <p className="rcard-value">{formatProgramTitle(row.programTitle)}</p>
          <p className="rcard-sub">{CENTER_FILTER_LABELS.level[row.level]}</p>
        </div>
        <div className="rcard-field">
          <p className="rcard-label">Modalidad</p>
          <p className="rcard-value">
            {row.modalities
              .map((modality) =>
                modality === "unknown"
                  ? CENTER_FILTER_LABELS.unpublishedModality
                  : CENTER_FILTER_LABELS.modality[modality],
              )
              .join(" · ")}
          </p>
        </div>
        <div className="rcard-field">
          <p className="rcard-label">Titularidad</p>
          <p className="rcard-value">
            {row.teachingTypes.length === 0
              ? "—"
              : row.teachingTypes
                  .map((type) => CENTER_FILTER_LABELS.teachingType[type])
                  .join(" · ")}
          </p>
        </div>
        <div className="rcard-actions">
          <Link
            className="table-action-link"
            to={trainingDetailPath(row.programKey)}
          >
            Ver ciclo
          </Link>
          {cta !== null && row.centerWebsite !== null && (
            <ExternalLink
              href={row.centerWebsite}
              className="table-action-link"
            >
              {cta}
            </ExternalLink>
          )}
          {mapUrl !== null && (
            <ExternalLink href={mapUrl} className="table-action-link">
              Cómo llegar
            </ExternalLink>
          )}
        </div>
      </article>
    </li>
  );
}

export function CentersExplorerPage(): JSX.Element {
  const { programKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [linkPolicy, setLinkPolicy] = useState<Awaited<
    ReturnType<typeof loadCenterLinkPolicy>
  > | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const requestedPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const paginationEnabled = programKey === undefined;

  useRouteReady(state.status !== "loading");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const foundation = await loadFoundationResourceSubset(
          manifest,
          ["programs", "centers", "trainingOfferings"],
          options,
        );
        const program =
          programKey === undefined
            ? null
            : (foundation.programs.find(
                (candidate) => candidate.programKey === programKey,
              ) ?? null);
        return { manifest, foundation, program };
      })
      .then(({ manifest, foundation, program }) => {
        if (controller.signal.aborted) return;
        if (programKey !== undefined && program === null) {
          setState({ status: "unknown" });
          return;
        }
        setState({
          status: "ready",
          foundation,
          generatedAt:
            manifest.resourceSnapshots.trainingOfferings.sourceUpdatedAt ??
            manifest.resourceSnapshots.trainingOfferings.snapshotFetchedAt,
          program,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [programKey]);

  // Dated QA overlay for the website CTA. Fail-safe: absent/malformed
  // artifact ⇒ no website CTA anywhere (never the pre-audit behaviour).
  useEffect(() => {
    const controller = new AbortController();
    void loadCenterLinkPolicy({ signal: controller.signal })
      .then((policy) => {
        if (!controller.signal.aborted) setLinkPolicy(policy);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLinkPolicy(null);
      });
    return () => controller.abort();
  }, []);

  const rows = useMemo(
    () =>
      state.status === "ready"
        ? buildCenterCatalogRows({
            offerings: state.foundation.trainingOfferings,
            centers: state.foundation.centers,
            programs: state.foundation.programs,
          }).filter(
            (row) =>
              state.program === null ||
              row.programKey === state.program.programKey,
          )
        : [],
    [state],
  );

  const filters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams],
  );
  const filteredRows = useMemo(
    () => filterCenterRows(rows, filters),
    [filters, rows],
  );

  const facetCounts = useMemo(
    () => facetCountsFor(rows, filters),
    [filters, rows],
  );

  const provinces = useMemo(
    () =>
      [...new Set(rows.map((row) => row.province))].sort((left, right) =>
        left.localeCompare(right, "es"),
      ),
    [rows],
  );
  const families = useMemo(
    () =>
      [
        ...new Map(
          rows.map((row) => [row.familyCode, row.familyName]),
        ).entries(),
      ].sort((left, right) => left[0].localeCompare(right[0], "es")),
    [rows],
  );

  const pageCount = paginationEnabled
    ? Math.max(1, Math.ceil(filteredRows.length / GLOBAL_PAGE_SIZE))
    : 1;
  const currentPage = paginationEnabled
    ? Math.min(requestedPage, pageCount)
    : 1;
  const visibleRows = paginationEnabled
    ? filteredRows.slice(
        (currentPage - 1) * GLOBAL_PAGE_SIZE,
        currentPage * GLOBAL_PAGE_SIZE,
      )
    : filteredRows;

  useEffect(() => {
    if (state.status !== "ready") return;
    const canonicalPage =
      paginationEnabled && currentPage > 1 ? String(currentPage) : null;
    if (searchParams.get("page") === canonicalPage) return;
    const next = new URLSearchParams(searchParams);
    if (canonicalPage === null) next.delete("page");
    else next.set("page", canonicalPage);
    setSearchParams(next, { replace: true });
  }, [
    currentPage,
    paginationEnabled,
    searchParams,
    setSearchParams,
    state.status,
  ]);

  const firstVisibleResult =
    filteredRows.length === 0 ? 0 : (currentPage - 1) * GLOBAL_PAGE_SIZE + 1;
  const lastVisibleResult = paginationEnabled
    ? Math.min(currentPage * GLOBAL_PAGE_SIZE, filteredRows.length)
    : filteredRows.length;
  const centerCount = new Set(filteredRows.map((row) => row.centerCode)).size;
  const provinceCount = new Set(filteredRows.map((row) => row.province)).size;
  const activeFilterKeys = FILTER_PARAMS.filter(
    (key) => (searchParams.get(key) ?? "") !== "",
  );
  const hasFilters = activeFilterKeys.length > 0;

  function updateFilter(key: FilterParam, value: string): void {
    const next = new URLSearchParams(searchParams);
    if (value === "") next.delete(key);
    else next.set(key, value);
    next.delete("page"); // filter changes reset pagination (page = 1)
    setSearchParams(next);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateFilter("query", String(formData.get("query") ?? "").trim());
  }

  function clearFilters(): void {
    setSearchParams({});
  }

  if (state.status === "loading") {
    return (
      <div className="container catalog-page" aria-busy="true">
        <LoadingSkeleton
          status="Cargando la oferta formativa…"
          layout="table"
        />
      </div>
    );
  }
  if (state.status === "failed") {
    return (
      <div className="container page-header">
        <section role="alert" aria-labelledby="centers-error-heading">
          <h1 id="centers-error-heading" className="h1">
            No hemos podido cargar los centros
          </h1>
          <p className="lede">Vuelve a intentarlo dentro de unos minutos.</p>
          <Link className="link-action" to="/">
            Volver a explorar
          </Link>
        </section>
      </div>
    );
  }
  if (state.status === "unknown") {
    return (
      <div className="container page-header">
        <section aria-labelledby="centers-not-found-heading">
          <h1 id="centers-not-found-heading" className="h1">
            Ciclo no encontrado
          </h1>
          <p className="lede">
            La dirección no corresponde a un ciclo oficial disponible.
          </p>
          <Link className="link-action" to="/">
            Volver a explorar
          </Link>
        </section>
      </div>
    );
  }

  const contextualProgram = state.program;
  const contextual = contextualProgram !== null;
  const heading = contextual
    ? `Dónde estudiar ${formatProgramTitle(contextualProgram.programTitle)}`
    : "Dónde estudiar";

  const modalityOptions = Object.entries(CENTER_FILTER_LABELS.modality).filter(
    ([value]) =>
      value === "on_site" ||
      value === "distance" ||
      value === "mixed" ||
      (facetCounts.modalities[value] ?? 0) > 0,
  );

  return (
    <div className="catalog-page">
      <div className="container">
        <Breadcrumbs
          items={
            contextual
              ? [
                  { label: "Inicio", to: "/" },
                  {
                    label: contextualProgram.programTitle,
                    to: trainingDetailPath(contextualProgram.programKey),
                  },
                  { label: "Dónde estudiar" },
                ]
              : [
                  { label: "Inicio", to: "/" },
                  { label: "Dónde estudiar", to: globalCentersPath() },
                ]
          }
        />
        <header className="page-header page-masthead">
          <PageEyebrow>
            {contextual ? "Centros del ciclo" : "Formación en Castilla y León"}
          </PageEyebrow>
          <h1 className="h1" id="centers-heading">
            {heading}
          </h1>
          <p className="page-subcopy page-lede">
            {contextual
              ? `Los centros que publican este ciclo en la copia activa. Comprueba la oferta y las fechas en la fuente oficial.`
              : "Busca ciclos y centros de formación publicados en Castilla y León. La oferta puede cambiar según la convocatoria."}
          </p>
          <p className="caption" style={{ marginTop: "var(--space-2)" }}>
            Oferta formativa · copia del {formatDate(state.generatedAt)}
          </p>
        </header>

        <button
          className="sheet-button"
          type="button"
          aria-expanded={sheetOpen}
          aria-controls="centers-filters"
          onClick={() => setSheetOpen((open) => !open)}
        >
          Filtros
          {hasFilters ? ` (${activeFilterKeys.length})` : ""}
        </button>

        <form
          className={"filter-sheet" + (sheetOpen ? " is-open" : "")}
          id="centers-filters"
          onSubmit={submitSearch}
          aria-label="Filtrar dónde estudiar"
        >
          <div className="filter-bar">
            <div className="filter-field filter-grow">
              <label htmlFor="centers-query">
                {contextual ? "Buscar centro" : "Buscar centro o ciclo"}
              </label>
              <input
                id="centers-query"
                name="query"
                type="search"
                key={filters.query}
                defaultValue={filters.query}
                placeholder="Ej.: CIFP, Administración y Finanzas"
              />
            </div>
            <div className="filter-field">
              <label htmlFor="centers-province">Provincia</label>
              <select
                id="centers-province"
                value={filters.province}
                onChange={(event) =>
                  updateFilter("province", event.target.value)
                }
              >
                <option value="">Todas</option>
                {provinces.map((province) => (
                  <option value={province} key={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="centers-modality">Modalidad</label>
              <select
                id="centers-modality"
                value={filters.modalidad}
                onChange={(event) =>
                  updateFilter("modality", event.target.value)
                }
              >
                <option value="">Todas</option>
                {modalityOptions.map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="centers-titularidad">Titularidad</label>
              <select
                id="centers-titularidad"
                value={filters.titularidad}
                onChange={(event) =>
                  updateFilter("titularidad", event.target.value)
                }
              >
                <option value="">Todas</option>
                {Object.entries(CENTER_FILTER_LABELS.teachingType).map(
                  ([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            {!contextual && (
              <div className="filter-field">
                <label htmlFor="centers-level">Nivel</label>
                <select
                  id="centers-level"
                  value={filters.nivel}
                  onChange={(event) =>
                    updateFilter("level", event.target.value)
                  }
                >
                  <option value="">Todos</option>
                  {Object.entries(CENTER_FILTER_LABELS.level).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
            {!contextual && (
              <div className="filter-field">
                <label htmlFor="centers-family">Familia profesional</label>
                <select
                  id="centers-family"
                  value={filters.familia}
                  onChange={(event) =>
                    updateFilter("family", event.target.value)
                  }
                >
                  <option value="">Todas</option>
                  {families.map(([code, name]) => (
                    <option value={code} key={code}>
                      {code} — {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!contextual && (
              <div className="filter-field">
                <label htmlFor="centers-ownership">Tipo de centro</label>
                <select
                  id="centers-ownership"
                  value={filters.ownership}
                  onChange={(event) =>
                    updateFilter("ownership", event.target.value)
                  }
                >
                  <option value="">Todos</option>
                  {Object.entries(CENTER_FILTER_LABELS.ownership).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
            <div className="filter-field">
              <button className="button button--primary" type="submit">
                Aplicar
              </button>
            </div>
          </div>
        </form>

        <div className="result-meta">
          <p className="result-count" style={{ margin: 0 }}>
            {contextual
              ? `${centerCount} ${centerCount === 1 ? "centro publicado" : "centros publicados"}`
              : `${firstVisibleResult}–${lastVisibleResult} de ${filteredRows.length} ${filteredRows.length === 1 ? "combinación de centro y ciclo" : "combinaciones de centro y ciclo"}`}
          </p>
          <p className="caption" style={{ margin: 0 }}>
            {contextual
              ? `${filteredRows.length} ${filteredRows.length === 1 ? "combinación de centro y ciclo" : "combinaciones de centro y ciclo"} · ${provinceCount} provincias`
              : `${centerCount} centros representados · ${state.foundation.trainingOfferings.length} opciones de centro y modalidad en la copia`}
          </p>
          {hasFilters && (
            <button
              className="link-action"
              type="button"
              style={{ minHeight: "auto", fontSize: "var(--text-small)" }}
              onClick={clearFilters}
            >
              Quitar filtros
            </button>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="empty-state">
            <h2 className="empty-title">No hay coincidencias</h2>
            <p className="lede">
              Prueba con otra búsqueda o quita algún filtro. La ausencia en esta
              copia no demuestra que no exista oferta.
            </p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="result-table" id="center-results-table">
                <caption className="sr-only">
                  Centros y ciclos de formación disponibles
                  {paginationEnabled && pageCount > 1
                    ? `. Página ${currentPage} de ${pageCount}`
                    : ""}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Centro</th>
                    <th scope="col">Localidad</th>
                    <th scope="col">Ciclo</th>
                    <th scope="col">Modalidad</th>
                    <th scope="col">Titularidad</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.rowKey}>
                      <CenterRow row={row} policy={linkPolicy} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="rcard-list">
              {visibleRows.map((row) => (
                <CenterResultCard
                  key={row.rowKey}
                  row={row}
                  policy={linkPolicy}
                />
              ))}
            </ul>
          </>
        )}

        {paginationEnabled && pageCount > 1 ? (
          <nav
            className="pagination"
            aria-label="Paginación de opciones formativas"
            aria-controls="center-results-table"
          >
            <button
              className={
                "button button--secondary" +
                (currentPage === 1 ? " button--disabled" : "")
              }
              type="button"
              aria-label="Página anterior"
              disabled={currentPage === 1}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                const previousPage = Math.max(1, currentPage - 1);
                if (previousPage === 1) next.delete("page");
                else next.set("page", String(previousPage));
                setSearchParams(next);
              }}
            >
              Anterior
            </button>
            <span className="range" aria-live="polite">
              {firstVisibleResult}–{lastVisibleResult} de {filteredRows.length}
            </span>
            <button
              className="button button--secondary"
              type="button"
              aria-label="Página siguiente"
              disabled={currentPage === pageCount}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set("page", String(Math.min(pageCount, currentPage + 1)));
                setSearchParams(next);
              }}
            >
              Siguiente
            </button>
          </nav>
        ) : null}

        <p className="caption">
          Las URLs de los centros se muestran tal como las publica la fuente; el
          CTA solo aparece con disponibilidad e identidad verificadas en la
          auditoría de enlaces
          {linkPolicy !== null &&
            ` del ${formatDate(linkPolicy.auditedAt.slice(0, 10))}`}
          . Si un centro no publica modalidad, aparece como “Modalidad no
          publicada”.
        </p>
      </div>
    </div>
  );
}
