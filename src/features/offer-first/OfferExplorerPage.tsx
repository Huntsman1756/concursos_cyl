import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  OfferEvidenceNextAction,
  OfferEvidenceRecord,
  OfferEvidenceStatus,
} from "../../../data/schemas/offerEvidence";
import {
  loadManifest,
  loadOfferEvidence,
} from "../../data/generatedDataClient";
import {
  OFFER_EVIDENCE_CLASSIFICATION_LABELS,
  OFFER_EVIDENCE_STATUS_LABELS,
  filterOfferEvidenceRecords,
  offerEvidenceCategoryLabel,
  offerEvidenceStatusLabel,
  sortOfferEvidenceRecords,
} from "../../domain/offerEvidence";
import { useRouteReady } from "../../app/RouteReadyContext";
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

type OfferExplorerState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; records: OfferEvidenceRecord[]; generatedAt: string };

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formattedDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function locationLabel(record: OfferEvidenceRecord): string {
  return (
    [record.locality, record.province].filter(Boolean).join(" · ") ||
    "Ubicación no publicada"
  );
}

function requirementStatusLabel(
  status: keyof typeof OFFER_EVIDENCE_CLASSIFICATION_LABELS,
): string {
  return OFFER_EVIDENCE_CLASSIFICATION_LABELS[status];
}

function ActionLink({ action }: { action: OfferEvidenceNextAction }) {
  if (action.targetKind === "internal") {
    return (
      <Link className="offer-explorer__action-link" to={action.href}>
        {action.label}
      </Link>
    );
  }
  return (
    <a
      className="offer-explorer__action-link"
      href={action.href}
      target="_blank"
      rel="noreferrer"
    >
      {action.label}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

function RequirementEvidence({ record }: { record: OfferEvidenceRecord }) {
  return (
    <section
      className="offer-explorer-card__section"
      aria-labelledby={`requirements-${record.offerId}`}
    >
      <h3 id={`requirements-${record.offerId}`}>Qué publica la oferta</h3>
      {record.requirements.length === 0 ? (
        <p className="offer-explorer__muted">
          No hemos podido extraer requisitos concretos de esta publicación.
          Compruébalos en la oferta original.
        </p>
      ) : (
        <ul className="offer-explorer__requirements">
          {record.requirements.map((requirement) => (
            <li key={requirement.requirementId}>
              <p className="offer-explorer__literal">
                “{requirement.literalRequirement}”
              </p>
              <div className="offer-explorer__tags">
                <span className="offer-explorer__tag">
                  {offerEvidenceCategoryLabel(requirement.normalizedCategory)}
                </span>
                <span className="offer-explorer__tag offer-explorer__tag--quiet">
                  {requirementStatusLabel(requirement.classificationStatus)}
                </span>
              </div>
              {requirement.normalizedValue !== null ? (
                <p className="offer-explorer__normalized">
                  Lectura normalizada:{" "}
                  <strong>{String(requirement.normalizedValue)}</strong>
                </p>
              ) : (
                <p className="offer-explorer__normalized">
                  No se ha normalizado este texto; conservamos la cita literal.
                </p>
              )}
              <p className="offer-explorer__evidence-meta">
                Fuente de la oferta: {formattedDateTime(requirement.sourceDate)}{" "}
                ·{" "}
                <a
                  href={requirement.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  abrir publicación
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RelationshipEvidence({ record }: { record: OfferEvidenceRecord }) {
  return (
    <section
      className="offer-explorer-card__section"
      aria-labelledby={`relations-${record.offerId}`}
    >
      <h3 id={`relations-${record.offerId}`}>Relación y límites</h3>
      {record.relations.length === 0 ? (
        <p className="offer-explorer__muted">
          No hay una relación FP revisada para esta oferta. La ausencia no
          demuestra que la relación sea imposible.
        </p>
      ) : (
        <ul className="offer-explorer__relations">
          {record.relations.map((relation) => (
            <li
              key={`${relation.programKey}-${relation.occupationId}-${relation.matchRule}`}
            >
              <p>
                <strong>{relation.programTitle}</strong> ·{" "}
                {relation.occupationLabel}
              </p>
              <p className="offer-explorer__literal">
                “{relation.sourceQuote}”
              </p>
              <p className="offer-explorer__evidence-meta">
                Fuente oficial revisada el {formattedDate(relation.reviewedAt)}{" "}
                ·{" "}
                <a href={relation.sourceUrl} target="_blank" rel="noreferrer">
                  ver evidencia
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
      {record.universityEvidence !== null ? (
        <div className="offer-explorer__boundary-note">
          <p>
            <strong>{record.universityEvidence.evidenceClass}</strong>{" "}
            {record.universityEvidence.evidenceClass === "U1"
              ? "La oferta publica literalmente este requisito universitario o regulado."
              : record.universityEvidence.evidenceClass === "U2"
                ? "Esta profesión está regulada y requiere comprobar la fuente oficial."
                : "La fuente oficial revisada aporta contexto, pero no sustituye la comprobación del caso."}
          </p>
          <p className="offer-explorer__literal">
            “{record.universityEvidence.sourceQuote}”
          </p>
          <p className="offer-explorer__evidence-meta">
            Evidencia {record.universityEvidence.evidenceClass} ·{" "}
            <a
              href={record.universityEvidence.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              abrir fuente oficial o publicación
            </a>
          </p>
          <p>
            No inferimos equivalencias, acceso, colegiación ni empleabilidad
            desde esta copia.
          </p>
        </div>
      ) : record.universitySignal === "title_only_unverified" ? (
        <p className="offer-explorer__boundary-note">
          El título de la oferta menciona una profesión universitaria o
          regulada, pero el título por sí solo no es evidencia suficiente: no
          mostramos una ruta universitaria ni afirmamos que la oferta exija una
          titulación.
        </p>
      ) : null}
    </section>
  );
}

function OfferCard({ record }: { record: OfferEvidenceRecord }) {
  const headingId = `offer-heading-${record.offerId}`;
  return (
    <article className="offer-explorer-card" aria-labelledby={headingId}>
      <header className="offer-explorer-card__header">
        <div>
          <span className="offer-explorer__status">
            {offerEvidenceStatusLabel(record.evidenceStatus)}
          </span>
          {record.hasAmbiguousRequirements ? (
            <span className="offer-explorer__status offer-explorer__status--warning">
              Tiene requisitos sin clasificar
            </span>
          ) : null}
        </div>
        <h2 id={headingId}>{record.title}</h2>
        <p className="offer-explorer-card__occupation">
          Etiqueta ocupacional publicada:{" "}
          <strong>{record.occupationLabel}</strong>
        </p>
      </header>

      <dl className="offer-explorer-card__facts">
        <div>
          <dt>Ubicación</dt>
          <dd>{locationLabel(record)}</dd>
        </div>
        <div>
          <dt>Fuente</dt>
          <dd>{record.sourceName}</dd>
        </div>
        <div>
          <dt>Empleador</dt>
          <dd>No publicado en esta copia</dd>
        </div>
        <div>
          <dt>Publicada</dt>
          <dd>{formattedDate(record.publishedAt)}</dd>
        </div>
        <div>
          <dt>Frescura de la fuente</dt>
          <dd>{formattedDate(record.freshnessDate)}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>Publicada en la instantánea base; no implica que siga abierta</dd>
        </div>
      </dl>

      <p className="offer-explorer-card__source">
        <a href={record.originalUrl} target="_blank" rel="noreferrer">
          Abrir la oferta original ↗
        </a>
        <span>
          Fuente de datos: <a href={record.sourceUrl}>{record.sourceName}</a>
        </span>
      </p>

      <details className="offer-explorer-card__details">
        <summary>Ver requisitos, relación y siguiente acción</summary>
        <RequirementEvidence record={record} />
        <RelationshipEvidence record={record} />
        <section
          className="offer-explorer-card__section"
          aria-labelledby={`actions-${record.offerId}`}
        >
          <h3 id={`actions-${record.offerId}`}>Siguiente acción</h3>
          <ul className="offer-explorer__actions">
            {record.nextActions.map((nextAction) => (
              <li
                key={`${nextAction.actionType}-${nextAction.href}-${nextAction.programKey ?? ""}`}
              >
                <ActionLink action={nextAction} />
                <p>{nextAction.reason}</p>
                {nextAction.caveat ? (
                  <p className="offer-explorer__caveat">
                    Límite: {nextAction.caveat}
                  </p>
                ) : null}
                {nextAction.eligibilityStatus === "not_calculated" ? (
                  <p className="offer-explorer__caveat">
                    No calculamos tu elegibilidad con esta copia.
                  </p>
                ) : null}
                {nextAction.certificateRouteType ? (
                  <p className="offer-explorer__caveat">
                    {nextAction.certificateRouteType ===
                    "offer_explicitly_accepts"
                      ? "La oferta acepta explícitamente un certificado; no equivale automáticamente a un título de FP."
                      : "Es una alternativa relacionada con la ocupación; no equivale automáticamente a un título de FP."}
                  </p>
                ) : null}
                {nextAction.certificateEvidence ? (
                  <div className="offer-explorer__certificate-evidence">
                    <p>
                      <strong>
                        {nextAction.certificateRouteType ===
                        "offer_explicitly_accepts"
                          ? "Certificado citado por la oferta"
                          : "Certificado oficial relacionado"}
                      </strong>
                    </p>
                    <ul>
                      {nextAction.certificateEvidence.map((certificate) => (
                        <li key={certificate.certificateCode}>
                          <p>
                            <strong>
                              {certificate.certificateCode} ·{" "}
                              {certificate.certificateTitle}
                            </strong>
                          </p>
                          <p>Literal conservado: “{certificate.sourceQuote}”</p>
                          <p>Relevancia: {certificate.relevance}</p>
                          <p className="offer-explorer__evidence-meta">
                            <a
                              href={certificate.authoritativeSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Abrir fuente oficial SEPE ↗
                            </a>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </details>
    </article>
  );
}

export function OfferExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("query") ?? "";
  const [state, setState] = useState<OfferExplorerState>({ status: "loading" });
  const [status, setStatus] = useState<OfferEvidenceStatus | "all">("all");
  const [province, setProvince] = useState<string>("all");
  const [page, setPage] = useState(1);

  useRouteReady(state.status !== "loading" && state.status !== "failed");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    void loadManifest(options)
      .then((manifest) => loadOfferEvidence(manifest, options))
      .then((resource) => {
        if (controller.signal.aborted) return;
        setState({
          status: "ready",
          records: resource.records,
          generatedAt: resource.generatedAt,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => controller.abort();
  }, []);

  const provinces = useMemo(() => {
    if (state.status !== "ready") return [];
    return [
      ...new Set(
        state.records
          .map(({ province }) => province)
          .filter((value): value is string => value !== null),
      ),
    ].sort((left, right) => left.localeCompare(right, "es"));
  }, [state]);

  const filteredRecords = useMemo(() => {
    if (state.status !== "ready") return [];
    return sortOfferEvidenceRecords(
      filterOfferEvidenceRecords(state.records, {
        query: queryParam,
        status,
        province,
      }),
    );
  }, [province, queryParam, state, status]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextQuery = String(formData.get("query") ?? "").trim();
    setPage(1);
    if (nextQuery.length === 0) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ query: nextQuery }, { replace: true });
    }
  };

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Cargando las ofertas y su evidencia…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        aria-labelledby="offer-explorer-error-heading"
      >
        <h1 id="offer-explorer-error-heading">
          No hemos podido abrir las ofertas
        </h1>
        <p>
          La instantánea candidata no está disponible o no coincide con la base
          activa. Prueba de nuevo más tarde.
        </p>
        <Link to="/">Volver al inicio</Link>
      </section>
    );
  }

  return (
    <article
      className="offer-explorer"
      aria-labelledby="offer-explorer-heading"
    >
      <header className="offer-explorer__intro">
        <p className="offer-explorer__eyebrow">Tercera puerta de entrada</p>
        <h1 id="offer-explorer-heading">Tengo una oferta</h1>
        <p>
          Busca una oferta real y comprueba qué requisito publica, qué relación
          está revisada y cuál es el siguiente paso oficial que sí podemos
          sostener.
        </p>
        <p className="offer-explorer__limit">
          Trabajamos sobre una copia de{" "}
          {state.records.length.toLocaleString("es-ES")} ofertas. No completamos
          el empleador, no convertimos una etiqueta en una promesa y no llamamos
          “abierta” a una oferta solo por aparecer aquí.
        </p>
      </header>

      <section
        className="offer-explorer__search"
        aria-labelledby="offer-search-heading"
      >
        <h2 id="offer-search-heading">Explorar ofertas</h2>
        <form onSubmit={submitSearch}>
          <label htmlFor="offer-query">
            Título, ocupación, requisito o localidad
          </label>
          <div className="offer-explorer__search-row">
            <input
              id="offer-query"
              name="query"
              type="search"
              defaultValue={queryParam}
              placeholder="Ej.: cocina, cuidador, fisioterapeuta"
            />
            <button className="primary-button" type="submit">
              Buscar
            </button>
          </div>
        </form>
        <div className="offer-explorer__filters">
          <label>
            <span>Estado de evidencia</span>
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as OfferEvidenceStatus | "all");
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option value={option} key={option}>
                  {option === "all"
                    ? "Todos"
                    : OFFER_EVIDENCE_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Provincia</span>
            <select
              value={province}
              onChange={(event) => {
                setPage(1);
                setProvince(event.target.value);
              }}
            >
              <option value="all">Todas</option>
              {provinces.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="offer-explorer__demos"
          aria-label="Demos para el jurado"
        >
          <span>Prueba una demo:</span>
          <Link to="/desde-oferta?query=cocina">
            Cocina: requisito FP exacto
          </Link>
          <Link to="/desde-oferta?query=cuidador">
            Cuidador: ambigüedad visible
          </Link>
          <Link to="/desde-oferta?query=fisioterapeuta">
            Fisioterapia: límite universitario
          </Link>
        </div>
      </section>

      <section
        className="offer-explorer__results"
        aria-labelledby="offer-results-heading"
      >
        <div className="offer-explorer__results-heading">
          <div>
            <p className="offer-explorer__eyebrow">Resultado reproducible</p>
            <h2 id="offer-results-heading">
              {filteredRecords.length.toLocaleString("es-ES")} de{" "}
              {state.records.length.toLocaleString("es-ES")} ofertas
            </h2>
          </div>
          <p>Ordenadas por fecha publicada y después por título.</p>
        </div>
        {visibleRecords.length === 0 ? (
          <p className="offer-explorer__empty">
            No hay coincidencias con estos filtros. Prueba otra palabra o vuelve
            a mostrar todas las ofertas.
          </p>
        ) : (
          <div className="offer-explorer__grid">
            {visibleRecords.map((record) => (
              <OfferCard key={record.offerId} record={record} />
            ))}
          </div>
        )}
        {pageCount > 1 ? (
          <nav
            className="offer-explorer__pagination"
            aria-label="Paginación de ofertas"
          >
            <button
              className="secondary-button"
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Anteriores
            </button>
            <span>
              Página {currentPage} de {pageCount}
            </span>
            <button
              className="secondary-button"
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              Siguientes
            </button>
          </nav>
        ) : null}
      </section>

      <section
        className="offer-explorer__legend"
        aria-labelledby="offer-legend-heading"
      >
        <h2 id="offer-legend-heading">Cómo leemos la evidencia</h2>
        <ul>
          <li>
            <strong>Relación FP revisada:</strong> hay cita, fuente y revisión
            de la relación.
          </li>
          <li>
            <strong>Requisito formativo explícito:</strong> el texto publicado
            menciona formación; no implica relación FP.
          </li>
          <li>
            <strong>U1:</strong> la oferta publica literalmente un requisito;
            <strong> U2:</strong> una fuente oficial establece la regulación;
            <strong> U3:</strong> otra evidencia oficial revisada aporta
            contexto. El título por sí solo no cuenta.
          </li>
          <li>
            <strong>Alternativa de cualificación:</strong> mostramos
            certificados o acreditación como vías a investigar, no como
            equivalencias.
          </li>
          <li>
            <strong>Requisito ambiguo o sin clasificar:</strong> conservamos el
            texto literal y no adivinamos.
          </li>
          <li>
            <strong>Sin relación revisada:</strong> no hay evidencia suficiente
            publicada para afirmar una relación.
          </li>
        </ul>
        <p>
          El dataset candidato se generó el{" "}
          {state.generatedAt ? formattedDate(state.generatedAt) : "—"}. Los
          cursos ECYL no se presentan como recomendación automática cuando
          faltan fechas y condiciones suficientes para comprobar vigencia.
        </p>
      </section>
    </article>
  );
}
