import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type {
  JobOffer,
  LoadableGeneratedManifest,
  SourceSnapshot,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type { OfferEvidenceResource } from "../../../data/schemas/offerEvidence";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../../data/catalogs/reviewedQualifications";
import type { OutcomeIndicatorsResource } from "../../../data/schemas/outcomes";
import type { ProfessionalProfile } from "../../../data/schemas/professionalProfiles";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
  loadOfferEvidence,
  loadOutcomeIndicators,
  loadProfessionalProfiles,
  loadPublishedRequirements,
  loadRegionalContext,
  type LoadedAuditedRelationships,
  type LoadedFoundationResources,
  type LoadedRegionalContext,
  type GeneratedDataLoadOptions,
} from "../../data/generatedDataClient";
import { indexIncomeOutcomes } from "../../domain/outcomes";
import { deriveActions } from "../../domain/actionEngine";
import { deriveEvidenceState, orderOfferMatches } from "../../domain/evidence";
import { createOfferEvidenceMatch } from "../../domain/offerEvidence";
import {
  matchOffersForProgram,
  type OfferDisplayMatch,
} from "../../domain/offerMatching";
import type { OfferPublishedRequirements } from "../../domain/requirements";
import type { ReliableAction } from "../../domain/actionEngine";
import { ReliableActionSchema } from "../../domain/actionEngine";
import { useDecisionSession } from "../../domain/session";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ExternalLink } from "../../components/ExternalLink";
import { InfoDisclosure } from "../../components/InfoDisclosure";
import { PrintButton } from "../../components/PrintButton";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  contextualCentersPath,
  occupationDetailPath,
  trainingOffersPath,
} from "../../app/routePaths";
import { OfferEvidenceCard } from "./OfferEvidenceCard";
import { TerritorialDistribution } from "./TerritorialDistribution";
import {
  mergeTerritorialCenterCoordinates,
  type TerritorialCenterRecord,
} from "./territorialDistributionModel";
import { ResultSectionNav } from "../../components/ResultSectionNav";
import "./result-evidence.css";
import { resolveApprovedOccupations } from "./resolveApprovedOccupations";
import { TrainingOutcomeEvidence } from "./TrainingOutcomeEvidence";
import { parseCylProvince } from "../../domain/territory";
import type {
  TrainingOutcomeSnapshot,
  TrainingOutcomeState,
} from "./trainingOutcome";
import "./trainingFirst.css";

interface ReadyResults {
  status: "ready";
  program: TrainingProgram;
  programs: TrainingProgram[];
  manifest: LoadableGeneratedManifest;
  offers: JobOffer[];
  requirements: OfferPublishedRequirements[];
  relationships: LoadedAuditedRelationships;
  professionalProfiles: ProfessionalProfile[];
  foundation: LoadedFoundationResources;
  regionalContext: LoadedRegionalContext;
  matches: OfferDisplayMatch[];
  offerEvidence: OfferEvidenceResource | null;
  outcome: TrainingOutcomeState;
}

type ResultsState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "unknown" }
  | ReadyResults;

const INITIAL_VISIBLE_OFFERS = 8;

function snapshotDate(manifest: LoadableGeneratedManifest): string {
  const snapshot = manifest.resourceSnapshots.jobOffers;
  const instant = snapshot.sourceUpdatedAt ?? snapshot.snapshotFetchedAt;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(instant));
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function normalizedLocation(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

type OutcomeSnapshotDescriptor = Pick<
  TrainingOutcomeSnapshot,
  "sourceUrl" | "snapshotFetchedAt"
> & {
  qualityStatus: "passed" | "stale";
};

function outcomeSnapshotOf(
  manifest: LoadableGeneratedManifest,
): OutcomeSnapshotDescriptor | undefined {
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, OutcomeSnapshotDescriptor | undefined>;
  return snapshots.outcomeIndicators;
}

async function loadTrainingOutcomeState(
  manifest: LoadableGeneratedManifest,
  options?: GeneratedDataLoadOptions,
): Promise<TrainingOutcomeState> {
  const records: OutcomeIndicatorsResource | null = await loadOutcomeIndicators(
    manifest,
    options,
  );
  if (records === null) return { status: "unavailable" };

  const snapshot = outcomeSnapshotOf(manifest);
  if (snapshot === undefined) return { status: "invalid" };

  return {
    status: "available",
    index: indexIncomeOutcomes(records),
    snapshot: {
      sourceUrl: snapshot.sourceUrl,
      snapshotFetchedAt: snapshot.snapshotFetchedAt,
      stale:
        manifest.qualityStatus === "stale" ||
        snapshot.qualityStatus === "stale",
    },
  };
}

export function TrainingResultsPage() {
  const { programKey = "" } = useParams();
  const [searchParams] = useSearchParams();
  const provinceSelection = parseCylProvince(searchParams.getAll("province"));
  const selectedProvince =
    provinceSelection.kind === "valid" ? provinceSelection.province : null;
  const hasInvalidProvince = provinceSelection.kind === "invalid";
  const [publicationFilter, setPublicationFilter] = useState<Extract<
    ReliableAction,
    { actionType: "explore_unpublished_requirement" }
  > | null>(null);
  const [visibleOfferCounts, setVisibleOfferCounts] = useState<
    Record<string, number>
  >({});
  const filterNoticeFocusRequestedRef = useRef(false);
  const filterNoticeRef = useRef<HTMLDivElement | null>(null);
  const outcomeControllerRef = useRef<AbortController | null>(null);
  const session = useDecisionSession();
  const [state, setState] = useState<ResultsState>({ status: "loading" });
  const readyForProgram =
    state.status === "ready" && state.program.programKey === programKey;

  useRouteReady(readyForProgram || state.status === "unknown");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => {
        if (signal.aborted) return null;
        const foundation = await loadFoundationResources(manifest, options);
        const program = foundation.programs.find(
          (candidate) => candidate.programKey === programKey,
        );
        if (program === undefined) return { status: "unknown" as const };
        const resourceSnapshots =
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Record<"offerEvidence", { resourcePath: string } | undefined>;
        const offerEvidence =
          resourceSnapshots.offerEvidence === undefined
            ? null
            : await loadOfferEvidence(manifest, options);
        const [
          requirements,
          relationships,
          professionalProfiles,
          regionalContext,
        ] = await Promise.all([
          loadPublishedRequirements(manifest, options),
          loadAuditedRelationships(manifest, options),
          loadProfessionalProfiles(manifest, options),
          loadRegionalContext(manifest, options),
        ]);
        const matches =
          offerEvidence === null
            ? matchOffersForProgram(programKey, {
                programs: foundation.programs,
                qualifications: REVIEWED_QUALIFICATIONS,
                programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
                occupations: relationships.occupations,
                aliases: relationships.aliases,
                links: relationships.links,
                offers: foundation.jobOffers,
                publishedRequirements: requirements,
                humanOverrides: [],
              })
            : offerEvidence.records.flatMap((record) => {
                const relation = record.relations.find(
                  (candidate) => candidate.programKey === programKey,
                );
                return relation === undefined
                  ? []
                  : [createOfferEvidenceMatch(record, relation, requirements)];
              });
        return {
          status: "ready" as const,
          program,
          programs: foundation.programs,
          manifest,
          offers: foundation.jobOffers,
          requirements,
          relationships,
          professionalProfiles,
          foundation,
          regionalContext,
          matches,
          offerEvidence,
          outcome: { status: "not-requested" as const },
        };
      })
      .then((nextState) => {
        if (nextState !== null && !signal.aborted) {
          setState(nextState);
        }
      })
      .catch(() => {
        if (signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [programKey]);

  useEffect(() => {
    return () => outcomeControllerRef.current?.abort();
  }, [programKey]);

  const requestOutcome = () => {
    if (state.status !== "ready" || state.program.programKey !== programKey) {
      return;
    }
    outcomeControllerRef.current?.abort();
    const controller = new AbortController();
    outcomeControllerRef.current = controller;
    setState((current) =>
      current.status === "ready"
        ? { ...current, outcome: { status: "loading" } }
        : current,
    );
    void loadTrainingOutcomeState(state.manifest, { signal: controller.signal })
      .then((outcome) => {
        if (controller.signal.aborted) return;
        setState((current) =>
          current.status === "ready" &&
          current.program.programKey === programKey
            ? { ...current, outcome }
            : current,
        );
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState((current) =>
          current.status === "ready" &&
          current.program.programKey === programKey
            ? { ...current, outcome: { status: "invalid" } }
            : current,
        );
      });
  };

  const orderedMatches = useMemo(() => {
    if (state.status !== "ready") return [];
    const ordered = orderOfferMatches(state.matches, session.answers);
    if (publicationFilter === null) return ordered;
    return ordered.filter((match) =>
      match.requirements.every(
        (requirement) =>
          requirement.category !== publicationFilter.filter.category ||
          requirement.normalizedValue !==
            publicationFilter.filter.normalizedValue,
      ),
    );
  }, [publicationFilter, session.answers, state]);

  useEffect(() => {
    if (!filterNoticeFocusRequestedRef.current || publicationFilter === null) {
      return;
    }
    filterNoticeRef.current?.focus({ preventScroll: true });
    filterNoticeFocusRequestedRef.current = false;
  }, [publicationFilter]);

  const approvedLinks = useMemo(
    () =>
      state.status === "ready"
        ? state.relationships.links.filter(
            (link) =>
              link.trainingProgramKey === programKey &&
              link.reviewStatus === "approved",
          )
        : [],
    [state, programKey],
  );

  const hasOfferEvidenceRelationship =
    state.status === "ready" &&
    (state.offerEvidence === null
      ? state.matches.length > 0
      : state.offerEvidence.records.some((record) =>
          record.relations.some(
            (relation) => relation.programKey === programKey,
          ),
        ));

  const resolvedOccupations = useMemo(
    () =>
      state.status === "ready"
        ? resolveApprovedOccupations(
            programKey,
            state.relationships.links,
            state.relationships.occupations,
          )
        : [],
    [programKey, state],
  );

  const officialProfiles = useMemo(
    () =>
      state.status === "ready"
        ? state.professionalProfiles.filter(
            (profile) => profile.programKey === programKey,
          )
        : [],
    [programKey, state],
  );

  const studyCenters = useMemo(() => {
    if (state.status !== "ready") return [];
    const centerCodes = new Set(
      state.foundation.trainingOfferings
        .filter((offering) => offering.programKey === programKey)
        .map((offering) => offering.centerCode),
    );
    return state.foundation.centers
      .filter((center) => centerCodes.has(center.centerCode))
      .sort(
        (left, right) =>
          left.province.localeCompare(right.province, "es") ||
          left.locality.localeCompare(right.locality, "es") ||
          left.centerName.localeCompare(right.centerName, "es"),
      );
  }, [programKey, state]);

  const centersByProvince = useMemo(() => {
    const groups = new Map<string, typeof studyCenters>();
    for (const center of studyCenters) {
      const existing = groups.get(center.province);
      if (existing === undefined) groups.set(center.province, [center]);
      else existing.push(center);
    }
    return [...groups.entries()];
  }, [studyCenters]);

  const latestProvincialContracts = useMemo(() => {
    if (state.status !== "ready") return [];
    const relevantProvinces = new Set(
      (selectedProvince === null
        ? studyCenters.map((center) => center.province)
        : [selectedProvince]
      ).map(normalizedLocation),
    );
    const latest = new Map<
      string,
      LoadedRegionalContext["provincialContracts"][number]
    >();
    for (const row of state.regionalContext.provincialContracts) {
      if (!relevantProvinces.has(normalizedLocation(row.provinceName)))
        continue;
      const previous = latest.get(row.provinceCode);
      if (previous === undefined || previous.month < row.month) {
        latest.set(row.provinceCode, row);
      }
    }
    return [...latest.values()].sort((left, right) =>
      left.provinceName.localeCompare(right.provinceName, "es"),
    );
  }, [selectedProvince, state, studyCenters]);

  const territorialCenters = useMemo<TerritorialCenterRecord[]>(() => {
    if (state.status !== "ready") return [];
    return mergeTerritorialCenterCoordinates(
      studyCenters.map(({ centerCode, centerName, locality, province }) => ({
        centerCode,
        centerName,
        locality,
        province,
      })),
      state.regionalContext.educationCenterDirectory,
    );
  }, [state, studyCenters]);

  if (
    state.status === "loading" ||
    (state.status === "ready" && !readyForProgram)
  ) {
    return (
      <p role="status" aria-live="polite">
        Buscando ofertas relacionadas…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        role="alert"
        aria-labelledby="training-results-load-error-heading"
      >
        <h1 id="training-results-load-error-heading">
          No hemos podido cargar los resultados
        </h1>
        <p>Vuelve a intentarlo dentro de unos minutos.</p>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }
  if (state.status === "unknown") {
    return (
      <section
        className="status-panel"
        aria-labelledby="training-results-not-found-heading"
      >
        <h1 id="training-results-not-found-heading">Ciclo no encontrado</h1>
        <p>La dirección no corresponde a un ciclo oficial disponible.</p>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }

  const manifestOutcomeSnapshot = outcomeSnapshotOf(state.manifest);
  const outcomeSource =
    manifestOutcomeSnapshot === undefined
      ? undefined
      : {
          sourceUrl: manifestOutcomeSnapshot.sourceUrl,
          snapshotFetchedAt: manifestOutcomeSnapshot.snapshotFetchedAt,
          stale:
            state.manifest.qualityStatus === "stale" ||
            manifestOutcomeSnapshot.qualityStatus === "stale",
        };
  const stale =
    state.manifest.qualityStatus === "stale" ||
    state.manifest.resourceSnapshots.jobOffers.qualityStatus === "stale" ||
    outcomeSource?.stale === true ||
    (state.outcome.status === "available" && state.outcome.snapshot.stale);
  const regionalContractsSource = (
    state.manifest
      .resourceSnapshots as typeof state.manifest.resourceSnapshots &
      Partial<Record<"provincialContracts", { sourceUrl: string }>>
  ).provincialContracts?.sourceUrl;
  const resourceSnapshots = state.manifest
    .resourceSnapshots as typeof state.manifest.resourceSnapshots &
    Partial<
      Record<
        | "professionalProfiles"
        | "trainingOccupationLinks"
        | "educationCenterDirectory",
        SourceSnapshot & { resourcePath: string }
      >
    >;
  const profilesSnapshot = resourceSnapshots.professionalProfiles;
  const relationshipsSnapshot = resourceSnapshots.trainingOccupationLinks;
  const offeringsSnapshot = resourceSnapshots.trainingOfferings;
  const educationCenterDirectorySnapshot =
    resourceSnapshots.educationCenterDirectory;
  const offersSnapshot = resourceSnapshots.jobOffers;
  const profilesEvidenceDate =
    profilesSnapshot?.sourceUpdatedAt ?? profilesSnapshot?.snapshotFetchedAt;
  const relationshipEvidenceDate =
    approvedLinks[0]?.reviewedAt ??
    relationshipsSnapshot?.sourceUpdatedAt ??
    relationshipsSnapshot?.snapshotFetchedAt;
  const offersEvidenceDate =
    offersSnapshot.sourceUpdatedAt ?? offersSnapshot.snapshotFetchedAt;
  const offeringsEvidenceDate =
    offeringsSnapshot.sourceUpdatedAt ?? offeringsSnapshot.snapshotFetchedAt;
  const sectionNavigationLinks = [
    { href: "#salidas-profesionales", label: "Salidas relacionadas" },
    ...(hasOfferEvidenceRelationship
      ? [{ href: "#ofertas-relacionadas", label: "Ofertas relacionadas" }]
      : []),
    { href: "#donde-estudiar", label: "Dónde estudiar" },
    { href: "#contexto", label: "Contexto" },
  ];
  const visibleOfferCount =
    visibleOfferCounts[programKey] ?? INITIAL_VISIBLE_OFFERS;
  const visibleMatches = orderedMatches.slice(0, visibleOfferCount);

  function applyUnpublishedRequirementFilter(
    action: Extract<
      ReliableAction,
      { actionType: "explore_unpublished_requirement" }
    >,
  ): void {
    const issuedAction = ReliableActionSchema.parse(action);
    if (issuedAction.actionType !== "explore_unpublished_requirement") {
      throw new Error(
        "Issued action is not an unpublished-requirement filter.",
      );
    }
    const originatingMatch = orderedMatches.find(
      (match) => match.offerId === issuedAction.offerId,
    );
    const originatingCardIsRemoved =
      originatingMatch !== undefined &&
      originatingMatch.requirements.some(
        (requirement) =>
          requirement.category === issuedAction.filter.category &&
          requirement.normalizedValue === issuedAction.filter.normalizedValue,
      );
    filterNoticeFocusRequestedRef.current = originatingCardIsRemoved;
    setPublicationFilter(action);
  }

  return (
    <section
      className="training-page decision-result-page training-result-page"
      aria-labelledby="training-results-heading"
    >
      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Explorar FP", to: "/desde-fp" },
          { label: state.program.programTitle },
        ]}
      />
      <header className="training-page__header result-header">
        <div className="result-header__top">
          <div className="result-header__main">
            <Link
              to="/desde-fp"
              className="training-page__back"
              data-print-hidden="true"
            >
              Cambiar de ciclo
            </Link>
            <h1 id="training-results-heading">{state.program.programTitle}</h1>
            <p className="training-page__meta">
              {trainingLevelLabel(state.program.level)}
              <span className="training-page__code">
                {" "}
                · código oficial {state.program.programKey}
              </span>
            </p>
            <p className="training-page__lead">
              Desde este ciclo puedes explorar profesiones, ofertas relacionadas
              y centros donde seguir formándote.
            </p>
          </div>
          <div className="training-page__tools" data-print-hidden="true">
            <PrintButton className="secondary-button" />
          </div>
        </div>
        {selectedProvince !== null && (
          <p className="training-page__meta">
            Contexto provincial elegido: {selectedProvince}
          </p>
        )}
        <div className="training-page__summary result-summary">
          <span>
            <strong>{resolvedOccupations.length}</strong>{" "}
            {resolvedOccupations.length === 1
              ? "profesión en la que puedes trabajar"
              : "profesiones en las que puedes trabajar"}
          </span>
          <span>
            <strong>{orderedMatches.length}</strong>{" "}
            {orderedMatches.length === 1 ? "oferta" : "ofertas"} en la copia del{" "}
            {shortDate(offersEvidenceDate)}
          </span>
          <span>
            <strong>{studyCenters.length}</strong>{" "}
            {studyCenters.length === 1
              ? "centro donde estudiar"
              : "centros donde estudiar"}
          </span>
          <InfoDisclosure label="De dónde sale cada cifra">
            <ul className="summary-sources">
              <li>
                Profesiones: relación FP-ocupación revisada.{" "}
                {(approvedLinks[0] !== undefined ||
                  relationshipsSnapshot !== undefined) && (
                  <ExternalLink
                    href={
                      approvedLinks[0]?.sourceUrl ??
                      relationshipsSnapshot?.sourceUrl ??
                      ""
                    }
                  >
                    Ver fuente
                  </ExternalLink>
                )}
                {relationshipEvidenceDate !== undefined && (
                  <span>
                    {" "}
                    Revisada el {shortDate(relationshipEvidenceDate)}.
                  </span>
                )}
              </li>
              <li>
                Ofertas de empleo: fuente actualizada el{" "}
                {shortDate(offersEvidenceDate)}. Catálogo de ofertas de la
                Junta.{" "}
                {state.offerEvidence !== null && (
                  <>
                    Evidencia de relaciones generada el{" "}
                    {shortDate(state.offerEvidence.generatedAt)}.{" "}
                  </>
                )}
                <ExternalLink href={offersSnapshot.sourceUrl}>
                  Ver fuente
                </ExternalLink>
              </li>
              <li>
                Centros: oferta de formación profesional publicada.{" "}
                <ExternalLink href={offeringsSnapshot.sourceUrl}>
                  Ver fuente
                </ExternalLink>{" "}
                {offeringsEvidenceDate !== undefined && (
                  <span>
                    Snapshot consultado el {shortDate(offeringsEvidenceDate)}.
                  </span>
                )}
              </li>
              <li>
                Salidas oficiales del ciclo: perfiles profesionales de TodoFP.{" "}
                {officialProfiles[0] !== undefined && (
                  <ExternalLink href={officialProfiles[0].sourceUrl}>
                    Ver fuente
                  </ExternalLink>
                )}
                {profilesEvidenceDate !== undefined && (
                  <span>
                    {" "}
                    Snapshot consultado el {shortDate(profilesEvidenceDate)}.
                  </span>
                )}
              </li>
            </ul>
            <p>
              Las ofertas proceden de una copia fechada y no representan todo el
              mercado laboral.
            </p>
          </InfoDisclosure>
        </div>
      </header>
      {hasInvalidProvince && (
        <p className="status-panel" role="status">
          No hemos podido reconocer la provincia indicada. Elige una provincia
          oficial para consultar contexto provincial.
        </p>
      )}
      {stale && (
        <p className="stale-warning" role="status">
          No se han podido actualizar los datos. Mostramos la última copia
          disponible.
        </p>
      )}
      {publicationFilter !== null && (
        <div
          ref={filterNoticeRef}
          className="filter-notice"
          role="status"
          aria-label="Filtro activo: ofertas relacionadas que no publican este requisito exacto."
          tabIndex={-1}
        >
          <p>Filtro activo: ofertas que no publican ese requisito exacto.</p>
          <p>
            La ausencia en el texto publicado no demuestra que el requisito no
            exista.
          </p>
          <button
            className="secondary-button"
            type="button"
            data-print-hidden="true"
            onClick={() => setPublicationFilter(null)}
          >
            Quitar filtro
          </button>
        </div>
      )}
      <ResultSectionNav links={sectionNavigationLinks} />
      <section
        id="salidas-profesionales"
        className="outcomes-section"
        aria-labelledby="salidas-profesionales-heading"
        tabIndex={-1}
      >
        <h2 id="salidas-profesionales-heading">Salidas relacionadas</h2>
        {resolvedOccupations.length > 0 ? (
          <ul className="occupation-links">
            {resolvedOccupations.map((occupation) => (
              <li key={occupation.occupationId}>
                <Link to={occupationDetailPath(occupation.occupationId)}>
                  <strong>{occupation.preferredLabel}</strong>
                  <small>
                    {occupation.relationshipType === "official_output"
                      ? "Salida profesional publicada en el perfil oficial del ciclo."
                      : "Relación profesional documentada en fuentes revisadas."}
                  </small>
                  {occupation.functionalBoundary !== undefined && (
                    <small>
                      {occupation.functionalBoundary.roleLevel === "assistant"
                        ? "Alcance: puesto auxiliar. El título no acredita por sí solo toda la ocupación CNO-11."
                        : "Ocupación afín: el título no acredita por sí solo toda la profesión."}
                    </small>
                  )}
                  <span className="occupation-links__code">
                    CNO-11 {occupation.classificationCode}
                  </span>
                  <span className="occupation-links__cta">
                    Ver esta profesión <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="outcomes-section__empty">
            Todavía no hemos podido comprobar en fuentes oficiales qué
            profesiones se corresponden con este ciclo, así que no mostramos
            ofertas para él. Puedes usar los nombres de abajo como términos de
            búsqueda en portales de empleo.
          </p>
        )}
        {officialProfiles.length > 0 ? (
          <>
            <h3>Salidas que publica el perfil oficial del ciclo</h3>
            <ul className="professional-output-list">
              {officialProfiles.slice(0, 6).map((profile) => (
                <li key={profile.profileId}>{profile.outputLabel}</li>
              ))}
            </ul>
            {officialProfiles.length > 6 && (
              <details className="more-outputs">
                <summary>Ver {officialProfiles.length - 6} salidas más</summary>
                <ul className="professional-output-list">
                  {officialProfiles.slice(6).map((profile) => (
                    <li key={profile.profileId}>{profile.outputLabel}</li>
                  ))}
                </ul>
              </details>
            )}
            <p className="outcomes-section__source">
              <ExternalLink href={officialProfiles[0]!.sourceUrl}>
                Comprobar en la ficha oficial de TodoFP
              </ExternalLink>
            </p>
          </>
        ) : (
          <p>No se han podido cargar las salidas oficiales de este ciclo.</p>
        )}
      </section>
      {hasOfferEvidenceRelationship && (
        <section
          id="ofertas-relacionadas"
          className="offer-results"
          aria-labelledby="offer-results-title"
          tabIndex={-1}
        >
          <div className="section-heading">
            <h2 id="offer-results-title">
              Ofertas relacionadas con {state.program.programTitle}
            </h2>
            <span className="offer-results__heading-actions">
              <span>
                Ofertas de empleo · fecha usada {snapshotDate(state.manifest)}
              </span>
              <Link to={trainingOffersPath(programKey)}>
                Abrir listado de ofertas <span aria-hidden="true">→</span>
              </Link>
            </span>
          </div>
          {orderedMatches.length === 0 ? (
            <div className="status-panel">
              <p>
                {publicationFilter === null
                  ? `0 ofertas con correspondencia validada en la copia de datos del ${shortDate(offersEvidenceDate)}.`
                  : "Ninguna oferta de esta copia omite publicar justo ese requisito."}
              </p>
              <p>
                No significa que no exista empleo en este sector: solo mostramos
                la copia fechada de ofertas públicas, no el mercado completo.
              </p>
            </div>
          ) : (
            <>
              <div className="offer-list">
                {visibleMatches.map((match) => {
                  const offer = state.offers.find(
                    ({ id }) => id === match.offerId,
                  );
                  if (offer === undefined) return null;
                  const evidenceState = deriveEvidenceState(
                    match,
                    session.answers,
                  );
                  const remoteOrHybrid = match.requirements.some(
                    (requirement) =>
                      requirement.category === "mobility_or_work_mode" &&
                      (requirement.normalizedValue === "remote" ||
                        requirement.normalizedValue === "hybrid"),
                  );
                  const suitable =
                    selectedProvince === null
                      ? null
                      : remoteOrHybrid ||
                        normalizedLocation(offer.province) ===
                          normalizedLocation(selectedProvince);
                  const actions = deriveActions({
                    offer,
                    evidenceState,
                    requirements: match.requirements,
                    answers: session.answers,
                    selectedProvince,
                    isSelectedProvinceSuitable: suitable,
                  });
                  return (
                    <div className="print-avoid-break" key={match.offerId}>
                      <OfferEvidenceCard
                        programs={state.programs}
                        offer={offer}
                        match={match}
                        evidenceState={evidenceState}
                        answers={session.answers}
                        actions={actions}
                        checklist={session.checklist}
                        onAnswer={session.answerRequirement}
                        onAddChecklist={session.addChecklistItem}
                        onRemoveChecklist={session.removeChecklistItem}
                        onExploreUnpublishedRequirement={
                          applyUnpublishedRequirementFilter
                        }
                      />
                    </div>
                  );
                })}
              </div>
              {orderedMatches.length > visibleMatches.length ? (
                <button
                  className="secondary-button offer-results__more"
                  type="button"
                  onClick={() =>
                    setVisibleOfferCounts((counts) => ({
                      ...counts,
                      [programKey]: Math.min(
                        orderedMatches.length,
                        (counts[programKey] ?? INITIAL_VISIBLE_OFFERS) + 12,
                      ),
                    }))
                  }
                >
                  Mostrar más ofertas (quedan{" "}
                  {orderedMatches.length - visibleMatches.length})
                </button>
              ) : null}
            </>
          )}
        </section>
      )}
      <section
        id="donde-estudiar"
        className="centers-section"
        aria-labelledby="donde-estudiar-heading"
        tabIndex={-1}
      >
        <div className="section-heading">
          <h2 id="donde-estudiar-heading">Dónde estudiar</h2>
          <span>
            <Link
              to={contextualCentersPath(programKey)}
              className="centers-section__all"
            >
              Ver los {studyCenters.length} centros con direcciones y web
            </Link>
          </span>
        </div>
        {studyCenters.length === 0 ? (
          <p>
            No hay centros publicados para este ciclo en la copia actual. Esto
            no significa que no se imparta: comprueba la oferta vigente en la
            fuente oficial.
          </p>
        ) : (
          <ul className="province-groups">
            {centersByProvince.map(([province, centers]) => (
              <li key={province}>
                <strong>{province}</strong>
                <span>
                  {centers.length} {centers.length === 1 ? "centro" : "centros"}{" "}
                  ·{" "}
                  {new Intl.ListFormat("es-ES", {
                    style: "narrow",
                    type: "conjunction",
                  }).format(centers.map((center) => center.locality))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section id="contexto" className="context-section" tabIndex={-1}>
        <div className="section-heading">
          <h2 id="contexto-heading">Contexto laboral e ingresos</h2>
        </div>
        <p className="context-section__note">
          Datos agregados de referencia: no predicen tu situación personal ni
          miden el mercado completo.
        </p>
        <TrainingOutcomeEvidence
          program={state.program}
          outcome={state.outcome}
          outcomeSource={outcomeSource}
          onRequestLoad={requestOutcome}
        />
        <Link
          className="context-section__compare"
          to={`/comparar?program=${encodeURIComponent(state.program.programKey)}`}
        >
          Comparar ingresos observados de este ciclo
        </Link>
        <details className="context-section__contracts">
          <summary id="contexto-provincial">
            Contratos registrados por provincia (contexto general)
          </summary>
          {latestProvincialContracts.length === 0 ? (
            <p>Sin contexto provincial para los centros mostrados.</p>
          ) : (
            <ul className="contract-context-list">
              {latestProvincialContracts.map((row) => (
                <li key={row.provinceCode}>
                  <span>{row.provinceName}</span>
                  <strong>
                    {new Intl.NumberFormat("es-ES").format(row.totalContracts)}
                  </strong>
                  <small>
                    {new Intl.DateTimeFormat("es-ES", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(row.month))}
                  </small>
                </li>
              ))}
            </ul>
          )}
          {regionalContractsSource !== undefined && (
            <ExternalLink
              className="evidence-link"
              href={regionalContractsSource}
            >
              Fuente: Datos Abiertos JCyL
            </ExternalLink>
          )}
          <p className="evidence-limit">
            Reúne contratos de todas las ocupaciones de la provincia: no es una
            probabilidad de contratación para este ciclo.
          </p>
        </details>
        {educationCenterDirectorySnapshot !== undefined && (
          <details className="context-section__map">
            <summary id="distribucion-centros">
              Distribución geográfica de los centros
            </summary>
            <TerritorialDistribution
              centers={territorialCenters}
              sourceUrl={educationCenterDirectorySnapshot.sourceUrl}
              academicYear={
                state.regionalContext.educationCenterDirectory[0]
                  ?.academicYear ?? null
              }
              sourceUpdatedAt={educationCenterDirectorySnapshot.sourceUpdatedAt}
              snapshotFetchedAt={
                educationCenterDirectorySnapshot.snapshotFetchedAt
              }
            />
          </details>
        )}
      </section>
    </section>
  );
}
