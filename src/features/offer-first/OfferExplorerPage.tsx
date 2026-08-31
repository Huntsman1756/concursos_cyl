import { type ReactNode, useEffect, useMemo, useState } from "react";
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
import { Icon, type IconName } from "../../components/Icon";
import {
  OFFER_EVIDENCE_CLASSIFICATION_LABELS,
  OFFER_EVIDENCE_STATUS_LABELS,
  filterOfferEvidenceRecords,
  offerEvidenceCategoryLabel,
  sortOfferEvidenceRecords,
} from "../../domain/offerEvidence";
import { useRouteReady } from "../../app/RouteReadyContext";
import "./offerExplorer.css";

const PAGE_SIZE = 12;
const STATUS_OPTIONS = [
  "all",
  ...Object.keys(OFFER_EVIDENCE_STATUS_LABELS),
] as Array<OfferEvidenceStatus | "all">;
const STATUS_HELP = [
  "Cita y revisión.",
  "Menciona formación; no implica relación FP.",
  "U1/U2/U3: vía universitaria o regulada; el título no basta.",
  "Certificados o acreditación: vías a investigar, no equivalencias.",
  "Texto literal; no adivinamos.",
  "Evidencia insuficiente.",
] as const;

type OfferExplorerState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; records: OfferEvidenceRecord[]; generatedAt: string };

function formattedDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(value));
}

const NO_REQUIREMENTS_COPY = "No hay requisitos concretos extraídos.";
const NO_RELATION_COPY =
  "No hay relación FP revisada; no demuestra imposibilidad.";
const LIMITATIONS_COPY =
  "No inferimos equivalencias, acceso, colegiación ni empleabilidad desde esta copia.";
const SECTION_CLASS = "offer-explorer-card__section";
const LITERAL_CLASS = "offer-explorer__literal";
const ACTION_LINK_CLASS = "offer-explorer__action-link";
const NORMALIZED_CLASS = "offer-explorer__normalized";
const MUTED_CLASS = "offer-explorer__muted";
const EYEBROW_CLASS = "offer-explorer__eyebrow";
const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noreferrer",
} as const;

function EvidenceState({ status }: { status: OfferEvidenceStatus }) {
  const icon: IconName =
    status === "ambiguous_requirement"
      ? "eye"
      : status === "no_reviewed_relationship"
        ? "x"
        : "badge-check";
  return (
    <p className="offer-explorer__evidence-state">
      <Icon name={icon} size={19} />
      <strong>{OFFER_EVIDENCE_STATUS_LABELS[status]}</strong>
    </p>
  );
}

function ActionLink({ action }: { action: OfferEvidenceNextAction }) {
  if (action.targetKind === "internal") {
    return (
      <Link className={ACTION_LINK_CLASS} to={action.href}>
        {action.label}
      </Link>
    );
  }
  return (
    <a
      {...EXTERNAL_LINK_PROPS}
      className={ACTION_LINK_CLASS}
      href={action.href}
    >
      {action.label}
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

function EvidenceItem({
  icon,
  className,
  children,
}: {
  icon: IconName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={className}>
      <Icon name={icon} size={18} />
      <div>{children}</div>
    </li>
  );
}

function RequirementEvidence({
  record,
  compact,
}: {
  record: OfferEvidenceRecord;
  compact?: boolean;
}) {
  const requirement = record.requirements[0];
  const headingId = `requirements-${record.offerId}`;
  return (
    <section
      className="offer-explorer-card__requirement"
      aria-labelledby={headingId}
    >
      <div className="offer-explorer__section-heading">
        <Icon name="file-check" size={20} />
        <h3 id={headingId}>Requisito literal</h3>
      </div>
      {record.requirements.length === 0 ? (
        <p className={MUTED_CLASS}>
          {NO_REQUIREMENTS_COPY}
          {record.universityEvidence?.evidenceClass === "U1" ? (
            <> U1: “{record.universityEvidence.sourceQuote}”</>
          ) : null}
        </p>
      ) : compact ? (
        <>
          <blockquote className={LITERAL_CLASS}>
            “{requirement.literalRequirement}”
          </blockquote>
          {record.requirements.length > 1 ? (
            <p className="offer-explorer__preview-note">
              + {record.requirements.length - 1} requisitos más.
            </p>
          ) : null}
        </>
      ) : (
        <ul className="offer-explorer__requirements">
          {record.requirements.map((requirement) => (
            <li key={requirement.requirementId}>
              <blockquote className={LITERAL_CLASS}>
                “{requirement.literalRequirement}”
              </blockquote>
              <p className="offer-explorer__requirement-meta">
                Tipo:{" "}
                <strong>
                  {offerEvidenceCategoryLabel(requirement.normalizedCategory)}
                </strong>{" "}
                · Lectura:{" "}
                {
                  OFFER_EVIDENCE_CLASSIFICATION_LABELS[
                    requirement.classificationStatus
                  ]
                }
              </p>
              {requirement.normalizedValue !== null ? (
                <p className={NORMALIZED_CLASS}>
                  Lectura normalizada:{" "}
                  <strong>{String(requirement.normalizedValue)}</strong>
                </p>
              ) : (
                <p className={NORMALIZED_CLASS}>
                  No se ha normalizado este texto.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function KnownEvidence({ record }: { record: OfferEvidenceRecord }) {
  const certificateAction = record.nextActions.find(
    (action) => action.certificateEvidence !== undefined,
  );
  const headingId = `known-${record.offerId}`;
  return (
    <section
      className={`${SECTION_CLASS} offer-explorer-card__known`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>Lo que sabemos</h3>
      <ul className="offer-explorer__known-list">
        {record.relations.map((relation) => (
          <EvidenceItem
            key={
              relation.programKey + relation.occupationId + relation.matchRule
            }
            icon="badge-check"
          >
            <strong>{relation.programTitle}</strong> ·{" "}
            {relation.occupationLabel}
            <small>
              {OFFER_EVIDENCE_STATUS_LABELS.reviewed_fp_relationship}
            </small>
          </EvidenceItem>
        ))}
        {record.universityEvidence !== null ? (
          <EvidenceItem
            icon="shield-check"
            className="offer-explorer__known-boundary"
          >
            <strong>
              {record.universityEvidence.evidenceClass} ·{" "}
              {record.universityEvidence.evidenceClass === "U1"
                ? "Requisito literal"
                : record.universityEvidence.evidenceClass === "U2"
                  ? "Vía regulada"
                  : "Contexto oficial"}
            </strong>
            <blockquote className={LITERAL_CLASS}>
              “{record.universityEvidence.sourceQuote}”
            </blockquote>
          </EvidenceItem>
        ) : null}
        {certificateAction !== undefined ? (
          <EvidenceItem key="known-certificate" icon="file-check">
            <strong>
              {certificateAction.certificateRouteType ===
              "offer_explicitly_accepts"
                ? "Certificado citado por la oferta"
                : "Certificado oficial relacionado"}
            </strong>
            {certificateAction.certificateEvidence?.map((certificate) => (
              <span key={certificate.certificateCode}>
                {certificate.certificateCode} · {certificate.certificateTitle}
                <small>{certificate.relevance}</small>
              </span>
            ))}
          </EvidenceItem>
        ) : null}
        {record.relations.length === 0 &&
        record.universityEvidence === null &&
        certificateAction === undefined ? (
          <EvidenceItem icon="eye">
            La oferta publica la ocupación{" "}
            <strong>{record.occupationLabel}</strong>.
          </EvidenceItem>
        ) : null}
      </ul>
    </section>
  );
}

function UnknownEvidence({ record }: { record: OfferEvidenceRecord }) {
  const hasAccreditationAction = record.nextActions.some(
    (action) => action.actionType === "accreditation_route",
  );
  const hasUnknowns =
    record.requirements.length === 0 ||
    record.hasAmbiguousRequirements ||
    record.relations.length === 0 ||
    record.universitySignal === "title_only_unverified" ||
    hasAccreditationAction;

  if (!hasUnknowns) return null;
  const headingId = `unknown-${record.offerId}`;

  return (
    <section
      className={`${SECTION_CLASS} offer-explorer-card__unknown`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>Lo que no sabemos</h3>
      <ul className="offer-explorer__unknown-list">
        {record.requirements.length === 0 ? (
          <EvidenceItem icon="eye">{NO_REQUIREMENTS_COPY}</EvidenceItem>
        ) : null}
        {record.hasAmbiguousRequirements ? (
          <EvidenceItem icon="eye">
            Texto de requisito sin clasificar; no adivinamos.
          </EvidenceItem>
        ) : null}
        {record.relations.length === 0 ? (
          <EvidenceItem icon="x">{NO_RELATION_COPY}</EvidenceItem>
        ) : null}
        {record.universitySignal === "title_only_unverified" ? (
          <EvidenceItem icon="shield-check">
            El título por sí solo no prueba una exigencia universitaria o
            regulada.
          </EvidenceItem>
        ) : null}
        {hasAccreditationAction ? (
          <EvidenceItem icon="eye">
            La elegibilidad para acreditación no está calculada.
          </EvidenceItem>
        ) : null}
      </ul>
    </section>
  );
}

function ActionNotes({ action }: { action: OfferEvidenceNextAction }) {
  const note = action.caveat
    ? "Límite: " + action.caveat
    : action.eligibilityStatus === "not_calculated"
      ? "La elegibilidad para acreditación no está calculada."
      : null;

  if (!note) return null;

  return <p className="offer-explorer__caveat">{note}</p>;
}

function NextAction({
  record,
  compact,
}: {
  record: OfferEvidenceRecord;
  compact?: boolean;
}) {
  const primaryAction =
    record.nextActions.find(
      (action) => action.actionType === "open_original_offer",
    ) ?? record.nextActions[0];
  if (compact) {
    return <ActionLink action={primaryAction} />;
  }
  const secondaryAction = record.nextActions.find(
    (action) => action !== primaryAction && action.actionType !== "ecyl_office",
  );
  const headingId = `actions-${record.offerId}`;

  return (
    <section
      className={`${SECTION_CLASS} offer-explorer-card__next-action`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>Siguiente acción</h3>
      <p>{primaryAction.reason}</p>
      <ActionLink action={primaryAction} />
      <ActionNotes action={primaryAction} />
      {secondaryAction ? (
        <div className="offer-explorer__secondary-action">
          <ActionLink action={secondaryAction} />
          <p>{secondaryAction.reason}</p>
          <ActionNotes action={secondaryAction} />
        </div>
      ) : null}
    </section>
  );
}

function SupportingEvidence({ record }: { record: OfferEvidenceRecord }) {
  const universitySource =
    record.universityEvidence === null
      ? []
      : [
          {
            key: "university-evidence",
            url: record.universityEvidence.sourceUrl,
            linkLabel: "abrir fuente",
          },
        ];
  const sources = [
    {
      key: "data-source",
      url: record.sourceUrl,
      linkLabel:
        record.sourceName +
        " · Empleador no publicado · Frescura " +
        formattedDate(record.freshnessDate),
    },
    ...record.requirements.map((requirement) => ({
      key: requirement.requirementId,
      url: requirement.sourceUrl,
      linkLabel: "abrir publicación",
    })),
    ...record.relations.map((relation) => ({
      key: relation.programKey + relation.occupationId + relation.matchRule,
      url: relation.sourceUrl,
      linkLabel:
        "ver evidencia oficial · " + formattedDate(relation.reviewedAt),
    })),
    ...universitySource,
    ...record.nextActions.flatMap((action) =>
      (action.certificateEvidence ?? []).map((certificate) => ({
        key: certificate.certificateCode,
        url: certificate.authoritativeSourceUrl,
        linkLabel: "Abrir fuente oficial SEPE ↗",
      })),
    ),
  ];
  const headingId = `supporting-${record.offerId}`;

  return (
    <section
      className={`${SECTION_CLASS} offer-explorer-card__supporting`}
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>Fuentes y limitaciones</h3>
      <p className={MUTED_CLASS}>
        Conservamos las fuentes y fechas que sostienen cada estado.{" "}
        {LIMITATIONS_COPY}
      </p>
      <ul className="offer-explorer__supporting-list">
        {sources.map((source) => (
          <li key={source.key}>
            <a {...EXTERNAL_LINK_PROPS} href={source.url}>
              {source.linkLabel}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OfferCard({ record }: { record: OfferEvidenceRecord }) {
  const headingId = `offer-heading-${record.offerId}`;
  const stateHeadingId = `state-${record.offerId}`;
  return (
    <article className="offer-explorer-card" aria-labelledby={headingId}>
      <header className="offer-explorer-card__header">
        <h2 id={headingId}>{record.title}</h2>
        <p className="offer-explorer-card__occupation">
          Ocupación publicada: <strong>{record.occupationLabel}</strong>
        </p>
      </header>

      <dl className="offer-explorer-card__facts">
        <div>
          <dt>Ubicación</dt>
          <dd>
            {[record.locality, record.province].filter(Boolean).join(" · ") ||
              "Ubicación no publicada"}
          </dd>
        </div>
        <div>
          <dt>Publicada</dt>
          <dd>{formattedDate(record.publishedAt)}</dd>
        </div>
        <div>
          <dt>Fuente</dt>
          <dd>{record.sourceName}</dd>
        </div>
        <div>
          <dt>Instantánea</dt>
          <dd>Copia fechada</dd>
        </div>
      </dl>

      <p className="offer-explorer-card__source">
        <a {...EXTERNAL_LINK_PROPS} href={record.originalUrl}>
          Abrir publicación original ↗
        </a>
      </p>

      <RequirementEvidence record={record} compact />

      <EvidenceState status={record.evidenceStatus} />

      <p className="offer-explorer-card__critical">
        <Icon name="eye" size={18} />
        <span>
          <strong>Vigencia no confirmada.</strong> Esta oferta aparece en una
          copia fechada del{" "}
          <time dateTime={record.freshnessDate}>
            {formattedDate(record.freshnessDate)}
          </time>
          .
        </span>
      </p>

      <NextAction record={record} compact />

      <details className="offer-explorer-card__details">
        <summary>Ver requisito, evidencia y siguiente acción</summary>
        <div className="offer-explorer-card__decision-flow">
          <RequirementEvidence record={record} />
          <section
            className={`${SECTION_CLASS} offer-explorer-card__state`}
            aria-labelledby={stateHeadingId}
          >
            <h3 id={stateHeadingId}>Estado de la evidencia</h3>
            <EvidenceState status={record.evidenceStatus} />
          </section>
          <KnownEvidence record={record} />
          <UnknownEvidence record={record} />
          <NextAction record={record} />
          <SupportingEvidence record={record} />
        </div>
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
        <p className={EYEBROW_CLASS}>Desde una oferta</p>
        <h1 id="offer-explorer-heading">Tengo una oferta</h1>
        <p>Comprueba requisito, evidencia y siguiente acción.</p>
        <p className="offer-explorer__limit">
          Copia fechada de {state.records.length.toLocaleString("es-ES")}{" "}
          ofertas. La vigencia actual se comprueba en la publicación de origen.
        </p>
      </header>

      <section
        className="offer-explorer__search"
        aria-labelledby="offer-search-heading"
      >
        <h2 id="offer-search-heading">Buscar una oferta</h2>
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
            <p className={EYEBROW_CLASS}>Resultado reproducible</p>
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

      <details className="offer-explorer__legend">
        <summary>Cómo interpretamos estos estados</summary>
        <div className="offer-explorer__legend-content">
          <ul>
            {STATUS_HELP.map((description, index) => {
              const status = STATUS_OPTIONS[index + 1] as OfferEvidenceStatus;
              return (
                <li key={status}>
                  <strong>{OFFER_EVIDENCE_STATUS_LABELS[status]}:</strong>{" "}
                  {description}
                </li>
              );
            })}
          </ul>
          <p>
            El dataset candidato se generó el{" "}
            {state.generatedAt ? formattedDate(state.generatedAt) : "—"}.
          </p>
        </div>
      </details>
    </article>
  );
}
