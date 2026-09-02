import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type {
  OfferEvidenceRecord,
  OfferEvidenceStatus,
} from "../../../data/schemas/offerEvidence";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ExternalLink } from "../../components/ExternalLink";
import { Icon } from "../../components/Icon";
import { InfoDisclosure } from "../../components/InfoDisclosure";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  globalOffersPath,
  occupationDetailPath,
  trainingDetailPath,
} from "../../app/routePaths";
import {
  loadFoundationResourceSubset,
  loadManifest,
  loadOfficialOccupations,
  loadOfferEvidence,
} from "../../data/generatedDataClient";
import {
  OFFER_EVIDENCE_CLASSIFICATION_LABELS,
  filterOfferEvidenceRecords,
  offerEvidenceCategoryLabel,
  sortOfferEvidenceRecords,
} from "../../domain/offerEvidence";
import "./offerExplorer.css";

const PAGE_SIZE = 12;

const STATUS_OPTIONS: Array<OfferEvidenceStatus | "all"> = [
  "all",
  "reviewed_fp_relationship",
  "explicit_training_requirement",
  "university_or_regulatory_route",
  "alternative_vocational_route",
  "ambiguous_requirement",
  "no_reviewed_relationship",
];

const STATUS_FILTER_LABELS: Record<OfferEvidenceStatus | "all", string> = {
  all: "Todas",
  reviewed_fp_relationship: "Con FP relacionada",
  explicit_training_requirement: "Piden una titulación concreta",
  university_or_regulatory_route: "Vía universitaria o regulada",
  alternative_vocational_route: "Piden un certificado o cualificación",
  ambiguous_requirement: "Requisitos sin clasificar",
  no_reviewed_relationship: "Sin relación FP comprobada",
};

export type OfferExplorerScope = "global" | "program" | "occupation";

type OfferContext =
  | { kind: "global" }
  | { kind: "program"; programKey: string; programTitle: string }
  | {
      kind: "occupation";
      occupationId: string;
      occupationLabel: string;
      classificationCode: string;
    };

type OfferExplorerState =
  | { status: "loading" }
  | { status: "failed" }
  | {
      status: "not-found";
      contextKind: Exclude<OfferExplorerScope, "global">;
    }
  | {
      status: "ready";
      records: OfferEvidenceRecord[];
      generatedAt: string;
      context: OfferContext;
    };

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function locationLabel(record: OfferEvidenceRecord): string | null {
  const location = [record.locality, record.province]
    .filter((value): value is string => value !== null)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
  return location.length > 0 ? location : null;
}

function isStatus(value: string | null): value is OfferEvidenceStatus {
  return (
    value !== null && STATUS_OPTIONS.includes(value as OfferEvidenceStatus)
  );
}

function TraceabilityContent({ record }: { record: OfferEvidenceRecord }) {
  return (
    <div className="offer-row__traceability">
      <section>
        <h3>Información de la publicación</h3>
        <dl className="offer-row__metadata">
          <div>
            <dt>Estado de la revisión</dt>
            <dd>{STATUS_FILTER_LABELS[record.evidenceStatus]}</dd>
          </div>
          <div>
            <dt>Fuente del dato</dt>
            <dd>
              <ExternalLink href={record.sourceUrl}>
                {record.sourceName}
              </ExternalLink>
            </dd>
          </div>
          <div>
            <dt>Fecha de publicación</dt>
            <dd>{formattedDate(record.sourceDate)}</dd>
          </div>
          <div>
            <dt>Última comprobación</dt>
            <dd>{formattedDate(record.freshnessDate)}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3>Qué publica la oferta</h3>
        {record.requirements.length === 0 ? (
          <p className="offer-explorer__muted">
            No hemos podido extraer requisitos concretos de esta publicación.
            Compruébalos en la oferta oficial.
          </p>
        ) : (
          <ul className="offer-row__requirements">
            {record.requirements.map((requirement) => (
              <li key={requirement.requirementId}>
                <p>
                  <strong>
                    {offerEvidenceCategoryLabel(requirement.normalizedCategory)}
                  </strong>{" "}
                  <span>
                    (
                    {
                      OFFER_EVIDENCE_CLASSIFICATION_LABELS[
                        requirement.classificationStatus
                      ]
                    }
                    )
                  </span>
                </p>
                <blockquote>{requirement.literalRequirement}</blockquote>
                {requirement.normalizedValue !== null && (
                  <p>
                    Lectura normalizada:{" "}
                    <strong>{String(requirement.normalizedValue)}</strong>
                  </p>
                )}
                <p className="offer-row__evidence-meta">
                  <ExternalLink href={requirement.sourceUrl}>
                    Fuente de la oferta
                  </ExternalLink>
                  <span>
                    Publicada el {formattedDate(requirement.sourceDate)}
                  </span>
                  <span>Regla: {requirement.parserRule}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Correspondencia con formación</h3>
        {record.relations.length === 0 ? (
          <p className="offer-explorer__muted">
            No hay una relación FP comprobada para esta oferta. Su ausencia no
            demuestra que la relación no exista.
          </p>
        ) : (
          <ul className="offer-row__relations">
            {record.relations.map((relation) => (
              <li
                key={`${relation.programKey}-${relation.occupationId}-${relation.matchRule}`}
              >
                <p>
                  <strong>{relation.programTitle}</strong> ·{" "}
                  {relation.occupationLabel}
                </p>
                <blockquote>{relation.sourceQuote}</blockquote>
                <p className="offer-row__evidence-meta">
                  <ExternalLink href={relation.sourceUrl}>
                    Fuente de la relación
                  </ExternalLink>
                  <span>Revisada el {formattedDate(relation.reviewedAt)}</span>
                  <span>Versión de la relación: {relation.mappingVersion}</span>
                </p>
                {relation.reviewNote !== undefined && (
                  <p>{relation.reviewNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {record.evidenceStatus === "university_or_regulatory_route" ? (
          <p className="offer-explorer__boundary-note">
            Aquí marcamos un límite: no inferimos equivalencias, acceso,
            colegiación ni empleabilidad universitaria.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function RelatedTrainingLinks({
  record,
  context,
}: {
  record: OfferEvidenceRecord;
  context: OfferContext;
}) {
  const relations =
    context.kind === "program"
      ? record.relations.filter(
          (relation) => relation.programKey === context.programKey,
        )
      : record.relations;

  if (relations.length === 0) return null;

  return (
    <div className="offer-row__relations-summary">
      <span>Formación relacionada:</span>
      <ul>
        {relations.map((relation) => (
          <li key={`${relation.programKey}-${relation.occupationId}`}>
            <Link to={trainingDetailPath(relation.programKey)}>
              {relation.programTitle}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OfferRow({
  record,
  context,
}: {
  record: OfferEvidenceRecord;
  context: OfferContext;
}) {
  const location = locationLabel(record);

  return (
    <article className="offer-row" aria-label={record.title}>
      <div className="offer-row__body">
        <div className="offer-row__content">
          <h3 className="offer-row__title">
            <span>{record.title}</span>
          </h3>
          <p className="offer-row__meta">
            {location !== null ? `${location} · ` : ""}
            {record.sourceName} · publicada{" "}
            <time dateTime={record.publishedAt}>
              {shortDate(record.publishedAt)}
            </time>
          </p>
          <RelatedTrainingLinks record={record} context={context} />
        </div>
        <div className="offer-row__actions">
          <ExternalLink
            className="offer-row__official"
            href={record.originalUrl}
          >
            Ver oferta oficial
            <Icon name="external-link" size={16} />
          </ExternalLink>
          <InfoDisclosure label={`Ver trazabilidad de ${record.title}`}>
            <TraceabilityContent record={record} />
          </InfoDisclosure>
        </div>
      </div>
    </article>
  );
}

function breadcrumbItems(context: OfferContext) {
  if (context.kind === "global") {
    return [
      { label: "Inicio", to: "/" },
      { label: "Ofertas de empleo", to: globalOffersPath() },
    ];
  }
  return [
    { label: "Inicio", to: "/" },
    { label: "Ofertas de empleo", to: globalOffersPath() },
    context.kind === "program"
      ? {
          label: context.programTitle,
          to: trainingDetailPath(context.programKey),
        }
      : {
          label: context.occupationLabel,
          to: occupationDetailPath(context.occupationId),
        },
    { label: "Ofertas relacionadas" },
  ];
}

function contextLabel(context: OfferContext): string {
  if (context.kind === "program") {
    return `Ofertas relacionadas con ${context.programTitle}`;
  }
  if (context.kind === "occupation") {
    return `Ofertas relacionadas con ${context.occupationLabel}`;
  }
  return "Ofertas de empleo";
}

function contextDescription(context: OfferContext): string {
  if (context.kind === "program") {
    return "Ofertas de la copia actual cuya relación con este ciclo está documentada. Comprueba siempre la vigencia y los requisitos en la publicación oficial. La relación orienta la búsqueda; no implica contratación ni equivalencia profesional.";
  }
  if (context.kind === "occupation") {
    return "Ofertas de la copia actual relacionadas con esta profesión mediante relaciones revisadas. No representan todo el mercado laboral. La relación orienta la búsqueda; no implica contratación ni equivalencia profesional.";
  }
  return "Copia de ofertas publicadas por la Junta de Castilla y León. Cuando una oferta tiene una formación relacionada comprobada, te lo indicamos. Comprueba siempre la vigencia y los requisitos en la oferta oficial. La relación orienta la búsqueda; no implica contratación ni equivalencia profesional.";
}

export function OfferExplorerPage({
  scope = "global",
}: {
  scope?: OfferExplorerScope;
}) {
  const { programKey, occupationId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<OfferExplorerState>({ status: "loading" });
  const queryParam = searchParams.get("query") ?? "";
  const statusParam = searchParams.get("status");
  const status: OfferEvidenceStatus | "all" = isStatus(statusParam)
    ? statusParam
    : "all";
  const province = searchParams.get("province") ?? "all";
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const requestedPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  useRouteReady(state.status !== "loading");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    void loadManifest(options)
      .then(async (manifest) => {
        const evidencePromise = loadOfferEvidence(manifest, options);
        if (scope === "program") {
          if (programKey === undefined) {
            return {
              kind: "not-found" as const,
              contextKind: "program" as const,
            };
          }
          const [resource, foundation] = await Promise.all([
            evidencePromise,
            loadFoundationResourceSubset(manifest, ["programs"], options),
          ]);
          const program = foundation.programs.find(
            (candidate) => candidate.programKey === programKey,
          );
          if (program === undefined) {
            return {
              kind: "not-found" as const,
              contextKind: "program" as const,
            };
          }
          return {
            kind: "ready" as const,
            resource,
            context: {
              kind: "program" as const,
              programKey: program.programKey,
              programTitle: program.programTitle,
            },
          };
        }
        if (scope === "occupation") {
          if (occupationId === undefined) {
            return {
              kind: "not-found" as const,
              contextKind: "occupation" as const,
            };
          }
          const [resource, occupations] = await Promise.all([
            evidencePromise,
            loadOfficialOccupations(manifest, options),
          ]);
          const occupation = occupations.find(
            (candidate) => candidate.occupationId === occupationId,
          );
          if (occupation === undefined) {
            return {
              kind: "not-found" as const,
              contextKind: "occupation" as const,
            };
          }
          return {
            kind: "ready" as const,
            resource,
            context: {
              kind: "occupation" as const,
              occupationId: occupation.occupationId,
              occupationLabel: occupation.preferredLabel,
              classificationCode: occupation.classificationCode,
            },
          };
        }
        return {
          kind: "ready" as const,
          resource: await evidencePromise,
          context: { kind: "global" as const },
        };
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.kind === "not-found") {
          setState({ status: "not-found", contextKind: result.contextKind });
          return;
        }
        setState({
          status: "ready",
          records: result.resource.records,
          generatedAt: result.resource.generatedAt,
          context: result.context,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "failed" });
      });

    return () => controller.abort();
  }, [occupationId, programKey, scope]);

  const contextualRecords = useMemo(() => {
    if (state.status !== "ready") return [];
    const context = state.context;
    if (context.kind === "global") return state.records;
    if (context.kind === "program") {
      const { programKey } = context;
      return state.records.filter((record) =>
        record.relations.some((relation) => relation.programKey === programKey),
      );
    }
    const { occupationId } = context;
    return state.records.filter((record) =>
      record.relations.some(
        (relation) => relation.occupationId === occupationId,
      ),
    );
  }, [state]);

  const provinces = useMemo(
    () =>
      [
        ...new Set(
          contextualRecords
            .map(({ province: value }) => value)
            .filter((value): value is string => value !== null),
        ),
      ].sort((left, right) => left.localeCompare(right, "es")),
    [contextualRecords],
  );

  // Unit contract (analysis/prototype-data-integrity.md §2): the reviewed
  // count is unique OFFERS with ≥1 reviewed relation — never the number of
  // relations (196 relations ≠ 138 offers in the frozen snapshot).
  const reviewedOfferCount = useMemo(
    () =>
      state.status === "ready"
        ? state.records.filter((record) => (record.relations ?? []).length > 0)
            .length
        : 0,
    [state],
  );

  const filteredRecords = useMemo(
    () =>
      sortOfferEvidenceRecords(
        filterOfferEvidenceRecords(contextualRecords, {
          query: queryParam,
          status,
          province,
        }),
      ),
    [contextualRecords, province, queryParam, status],
  );

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, pageCount);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  useEffect(() => {
    if (state.status !== "ready") return;
    const canonicalPage = currentPage <= 1 ? null : String(currentPage);
    if (searchParams.get("page") === canonicalPage) return;
    const next = new URLSearchParams(searchParams);
    if (canonicalPage === null) next.delete("page");
    else next.set("page", canonicalPage);
    setSearchParams(next, { replace: true });
  }, [currentPage, searchParams, setSearchParams, state.status]);
  const firstVisibleResult =
    filteredRecords.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleResult = Math.min(
    currentPage * PAGE_SIZE,
    filteredRecords.length,
  );
  const hasActiveFilters =
    queryParam.trim().length > 0 || status !== "all" || province !== "all";

  function updateParams(values: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(values)) {
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    setSearchParams(next);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParams({ query: String(formData.get("query") ?? "").trim() });
  }

  function clearFilters(): void {
    setSearchParams({});
  }

  function goToPage(nextPage: number): void {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete("page");
    else next.set("page", String(nextPage));
    setSearchParams(next);
  }

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Cargando las ofertas…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        aria-labelledby="offer-explorer-error-heading"
        role="alert"
      >
        <h1 id="offer-explorer-error-heading">
          No hemos podido abrir las ofertas
        </h1>
        <p>
          La copia de ofertas no está disponible. Prueba de nuevo más tarde.
        </p>
        <Link to="/">Volver al inicio</Link>
      </section>
    );
  }
  if (state.status === "not-found") {
    return (
      <section
        className="status-panel"
        aria-labelledby="offer-explorer-not-found-heading"
      >
        <h1 id="offer-explorer-not-found-heading">
          {state.contextKind === "program"
            ? "Ciclo no encontrado"
            : "Profesión no encontrada"}
        </h1>
        <p>
          La dirección no corresponde a un elemento oficial disponible en la
          copia actual.
        </p>
        <Link
          to={
            state.contextKind === "program" ? "/desde-fp" : "/desde-ocupacion"
          }
        >
          Volver a explorar
        </Link>
      </section>
    );
  }

  const { context } = state;
  const heading = contextLabel(context);
  const isGlobal = context.kind === "global";
  const resultNoun = isGlobal
    ? filteredRecords.length === 1
      ? "oferta"
      : "ofertas"
    : filteredRecords.length === 1
      ? "oferta relacionada"
      : "ofertas relacionadas";
  const resultsSummary = `${firstVisibleResult.toLocaleString("es-ES")}–${lastVisibleResult.toLocaleString("es-ES")} de ${filteredRecords.length.toLocaleString("es-ES")} ${resultNoun}`;

  return (
    <section
      className="offer-explorer"
      aria-labelledby="offer-explorer-heading"
    >
      <Breadcrumbs items={breadcrumbItems(context)} />
      <header className="page-header offer-explorer__intro">
        <p className="eyebrow offer-explorer__eyebrow">
          {isGlobal ? "Oportunidades publicadas" : "Contexto documentado"}
        </p>
        <h1 className="h1" id="offer-explorer-heading">
          {heading}
        </h1>
        <p className="page-subcopy">{contextDescription(context)}</p>
        <p
          className="caption offer-explorer__freshness"
          style={{ marginTop: "var(--space-2)" }}
        >
          Ofertas de empleo · snapshot de evidencia del{" "}
          <time dateTime={state.generatedAt}>
            {formattedDate(state.generatedAt)}
          </time>
        </p>
      </header>

      <form
        className="filter-bar offer-explorer__search"
        onSubmit={submitSearch}
        aria-label="Buscar ofertas"
      >
        <div className="filter-field filter-grow">
          <label htmlFor="offer-query">
            Título, ocupación, requisito o localidad
          </label>
          <input
            id="offer-query"
            key={queryParam}
            name="query"
            type="search"
            defaultValue={queryParam}
            placeholder="Ej.: puesto, localidad o código"
          />
        </div>
        <div className="filter-field">
          <label htmlFor="offer-province">
            <span>Provincia</span>
          </label>
          <select
            id="offer-province"
            value={province}
            onChange={(event) => updateParams({ province: event.target.value })}
          >
            <option value="all">Todas las provincias</option>
            {provinces.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="offer-status">
            <span>Relación con la formación</span>
          </label>
          <select
            id="offer-status"
            value={status}
            onChange={(event) => updateParams({ status: event.target.value })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option value={option} key={option}>
                {STATUS_FILTER_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <button className="button button--primary" type="submit">
            Buscar
          </button>
        </div>
        {hasActiveFilters && (
          <button
            className="offer-explorer__clear"
            type="button"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        )}
      </form>

      <section
        className="offer-explorer__results"
        aria-labelledby="offer-results-heading"
        aria-live="polite"
      >
        <div className="result-meta offer-explorer__count">
          <h2 className="result-count" id="offer-results-heading">
            {resultsSummary}
          </h2>
          {isGlobal && (
            <p className="caption" style={{ margin: 0 }}>
              {reviewedOfferCount.toLocaleString("es-ES")} con FP relacionada en
              esta copia (ofertas únicas con relación revisada) · más recientes
              primero
            </p>
          )}
          {!isGlobal && <span>· más recientes primero</span>}
        </div>
        {visibleRecords.length === 0 ? (
          <div className="offer-explorer__empty" role="status">
            {context.kind === "global" || hasActiveFilters ? (
              <>
                <h3>No hay coincidencias</h3>
                <p>
                  Prueba con otras palabras, revisa la ortografía o quita algún
                  filtro. La copia de ofertas no representa todo el mercado
                  laboral.
                </p>
                {hasActiveFilters && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={clearFilters}
                  >
                    Quitar filtros
                  </button>
                )}
              </>
            ) : (
              // Fail-closed zero state (screen contract §7): a reviewed empty
              // is a valid answer. Never "no existen ofertas".
              <>
                <h3>
                  Todavía no hemos podido comprobar ofertas relacionadas en esta
                  copia.
                </h3>
                <div className="empty-grid">
                  <div>
                    <h3>Qué significa</h3>
                    <p>
                      Ninguna oferta de esta copia tiene una relación revisada
                      con esta{" "}
                      {context.kind === "occupation" ? "profesión" : "FP"}.
                    </p>
                  </div>
                  <div>
                    <h3>Qué NO significa</h3>
                    <p>
                      No significa que no exista la oportunidad: la ausencia de
                      relación no prueba imposibilidad.
                    </p>
                  </div>
                  <div>
                    <h3>Qué puedes hacer</h3>
                    <p>
                      Explora el catálogo completo o consulta la metodología
                      para entender el criterio de revisión.
                    </p>
                  </div>
                </div>
                <div className="method-actions">
                  <Link
                    className="button button--secondary"
                    to={globalOffersPath()}
                  >
                    Explorar todas las ofertas
                  </Link>
                  <Link className="link-action" to="/metodologia">
                    Consultar metodología
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="offer-explorer__list" id="offer-results-list">
            {visibleRecords.map((record) => (
              <OfferRow
                key={record.offerId}
                record={record}
                context={context}
              />
            ))}
          </div>
        )}
        {pageCount > 1 ? (
          <nav
            className="offer-explorer__pagination"
            aria-label="Paginación de ofertas"
            aria-controls="offer-results-list"
          >
            <button
              className="secondary-button"
              type="button"
              aria-label="Página anterior"
              disabled={currentPage === 1}
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
            >
              Anterior
            </button>
            <span aria-live="polite">
              Página {currentPage} de {pageCount}
            </span>
            <button
              className="secondary-button"
              type="button"
              aria-label="Página siguiente"
              disabled={currentPage === pageCount}
              onClick={() => goToPage(Math.min(pageCount, currentPage + 1))}
            >
              Siguiente
            </button>
          </nav>
        ) : null}
      </section>
    </section>
  );
}
