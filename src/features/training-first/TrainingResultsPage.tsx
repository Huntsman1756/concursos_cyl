import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../../data/catalogs/reviewedQualifications";
import type {
  JobOffer,
  LoadableGeneratedManifest,
  SourceSnapshot,
  TrainingProgram,
} from "../../../data/schemas/generated";
import type { OutcomeIndicatorsResource } from "../../../data/schemas/outcomes";
import type { ProfessionalProfile } from "../../../data/schemas/professionalProfiles";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
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
import {
  matchOffersForProgram,
  type OfferMatch,
} from "../../domain/offerMatching";
import type { OfferPublishedRequirements } from "../../domain/requirements";
import type { ReliableAction } from "../../domain/actionEngine";
import { ReliableActionSchema } from "../../domain/actionEngine";
import { useDecisionSession } from "../../domain/session";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import { ExternalLink } from "../../components/ExternalLink";
import { FragmentLink } from "../../components/FragmentLink";
import { useRouteReady } from "../../app/RouteReadyContext";
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
  matches: OfferMatch[];
  outcome: TrainingOutcomeState;
}

type ResultsState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "unknown" }
  | ReadyResults;

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

function evidenceDate(snapshot: SourceSnapshot | undefined): string | null {
  if (snapshot === undefined) return null;
  return snapshot.sourceUpdatedAt ?? snapshot.snapshotFetchedAt;
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
  const selectedProvince = searchParams.get("province");
  const [publicationFilter, setPublicationFilter] = useState<Extract<
    ReliableAction,
    { actionType: "explore_unpublished_requirement" }
  > | null>(null);
  const filterNoticeFocusRequestedRef = useRef(false);
  const filterNoticeRef = useRef<HTMLDivElement | null>(null);
  const outcomeControllerRef = useRef<AbortController | null>(null);
  const session = useDecisionSession();
  const [state, setState] = useState<ResultsState>({ status: "loading" });
  const readyForProgram =
    state.status === "ready" && state.program.programKey === programKey;

  useRouteReady(readyForProgram);

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
        const matches = matchOffersForProgram(programKey, {
          programs: foundation.programs,
          qualifications: REVIEWED_QUALIFICATIONS,
          programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
          occupations: relationships.occupations,
          aliases: relationships.aliases,
          links: relationships.links,
          offers: foundation.jobOffers,
          publishedRequirements: requirements,
          humanOverrides: [],
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

  const hasApprovedRelationship = approvedLinks.length > 0;

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
    return [...latest.values()]
      .sort((left, right) =>
        left.provinceName.localeCompare(right.provinceName, "es"),
      )
      .slice(0, 4);
  }, [selectedProvince, state, studyCenters]);

  const municipalityByLocation = useMemo(() => {
    if (state.status !== "ready") return new Map<string, number>();
    return new Map(
      state.regionalContext.municipalities.map((municipality) => [
        `${normalizedLocation(municipality.municipalityName)}|${normalizedLocation(municipality.provinceName)}`,
        municipality.population,
      ]),
    );
  }, [state]);

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
  const profilesEvidenceDate = evidenceDate(profilesSnapshot);
  const relationshipEvidenceDate =
    approvedLinks[0]?.reviewedAt ?? evidenceDate(relationshipsSnapshot);
  const offersEvidenceDate = evidenceDate(offersSnapshot);
  const offeringsEvidenceDate = evidenceDate(offeringsSnapshot);
  const sectionNavigationLinks = [
    { href: "#base-cotizacion-observada", label: "Base de cotización" },
    { href: "#donde-estudiar", label: "Dónde estudiar" },
    { href: "#contexto-provincial", label: "Contexto provincial" },
    ...(educationCenterDirectorySnapshot === undefined
      ? []
      : [{ href: "#distribucion-centros", label: "Distribución de centros" }]),
    { href: "#salidas-profesionales", label: "Salidas profesionales" },
    ...(resolvedOccupations.length === 0
      ? []
      : [{ href: "#ocupaciones-revisadas", label: "Ocupaciones revisadas" }]),
    ...(hasApprovedRelationship && orderedMatches.length > 0
      ? [{ href: "#ofertas-relacionadas", label: "Ofertas relacionadas" }]
      : []),
  ];

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
      className="training-page"
      aria-labelledby="training-results-heading"
    >
      <header className="training-page__header">
        <Link to="/desde-fp">Cambiar ciclo</Link>
        <p
          className="training-page__eyebrow training-page__direction"
          aria-label="Tu título de Formación Profesional conduce a ocupaciones con evidencia"
        >
          <span>Tu título de FP</span>
          <span aria-hidden="true">→</span>
          <span>Ocupaciones con evidencia</span>
        </p>
        <h1 id="training-results-heading">{state.program.programTitle}</h1>
        <p>
          {trainingLevelLabel(state.program.level)} · Código oficial{" "}
          {state.program.programKey}
        </p>
        {selectedProvince !== null && <p>Zona elegida: {selectedProvince}</p>}
      </header>
      <section
        className="decision-basis"
        aria-labelledby="decision-basis-title"
      >
        <div className="decision-basis__heading">
          <p>Base para decidir</p>
          <h2 id="decision-basis-title">Qué sabemos de este título</h2>
        </div>
        <dl className="result-summary" aria-label="Resumen con fuentes">
          <div>
            <dt>Salidas profesionales</dt>
            <dd>
              <strong>{officialProfiles.length}</strong>
              <span className="result-summary__unit">perfiles oficiales</span>
              <span className="result-summary__source">
                {officialProfiles[0] !== undefined && (
                  <ExternalLink href={officialProfiles[0].sourceUrl}>
                    Fuente: TodoFP
                  </ExternalLink>
                )}
                {profilesEvidenceDate !== null && (
                  <time dateTime={profilesEvidenceDate}>
                    Copia del {shortDate(profilesEvidenceDate)}
                  </time>
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt>Ocupaciones vinculadas</dt>
            <dd>
              <strong>{resolvedOccupations.length}</strong>
              <span className="result-summary__unit">grupos revisados</span>
              <span className="result-summary__source">
                {(approvedLinks[0] !== undefined ||
                  relationshipsSnapshot !== undefined) && (
                  <ExternalLink
                    href={
                      approvedLinks[0]?.sourceUrl ??
                      relationshipsSnapshot?.sourceUrl
                    }
                  >
                    Fuente: relación revisada
                  </ExternalLink>
                )}
                {relationshipEvidenceDate !== null && (
                  <time dateTime={relationshipEvidenceDate}>
                    {approvedLinks[0] === undefined ? "Copia" : "Revisada"} del{" "}
                    {shortDate(relationshipEvidenceDate)}
                  </time>
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt>Ofertas relacionadas</dt>
            <dd>
              <strong>{orderedMatches.length}</strong>
              <span className="result-summary__unit">en la copia actual</span>
              <span className="result-summary__source">
                <ExternalLink href={offersSnapshot.sourceUrl}>
                  Fuente: ofertas ECYL
                </ExternalLink>
                {offersEvidenceDate !== null && (
                  <time dateTime={offersEvidenceDate}>
                    Copia del {shortDate(offersEvidenceDate)}
                  </time>
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt>Dónde estudiarlo</dt>
            <dd>
              <strong>{studyCenters.length}</strong>
              <span className="result-summary__unit">centros publicados</span>
              <span className="result-summary__source">
                <ExternalLink href={offeringsSnapshot.sourceUrl}>
                  Fuente: oferta FP JCyL
                </ExternalLink>
                {offeringsEvidenceDate !== null && (
                  <time dateTime={offeringsEvidenceDate}>
                    Copia del {shortDate(offeringsEvidenceDate)}
                  </time>
                )}
              </span>
            </dd>
          </div>
        </dl>
        <p className="decision-basis__scope">
          La copia de ofertas no representa todo el mercado laboral.
        </p>
      </section>
      <nav className="result-actions" aria-label="Siguientes pasos">
        {resolvedOccupations.length > 0 ? (
          <>
            <FragmentLink
              className="primary-button"
              href="#ocupaciones-revisadas"
            >
              Ver ocupaciones revisadas
            </FragmentLink>
            <Link
              className="secondary-button"
              to={`/formacion/${encodeURIComponent(programKey)}`}
            >
              Ver centros y modalidades
            </Link>
          </>
        ) : (
          <Link
            className="primary-button"
            to={`/formacion/${encodeURIComponent(programKey)}`}
          >
            Ver centros y modalidades
          </Link>
        )}
        <Link className="result-actions__tertiary" to="/comparar">
          Comparar ingresos
        </Link>
      </nav>
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
          <p>
            Filtro activo: ofertas relacionadas que no publican este requisito
            exacto.
          </p>
          <p>
            La ausencia en el texto publicado no demuestra que el requisito no
            exista.
          </p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setPublicationFilter(null)}
          >
            Quitar filtro
          </button>
        </div>
      )}
      <ResultSectionNav links={sectionNavigationLinks} />
      <TrainingOutcomeEvidence
        program={state.program}
        outcome={state.outcome}
        outcomeSource={outcomeSource}
        onRequestLoad={requestOutcome}
      />
      <section className="decision-evidence" aria-label="Evidencia territorial">
        <div id="donde-estudiar" className="study-section" tabIndex={-1}>
          <div className="section-heading">
            <h2>Dónde estudiar</h2>
            <span>
              {studyCenters.length}{" "}
              {studyCenters.length === 1 ? "centro" : "centros"}
            </span>
          </div>
          {studyCenters.length === 0 ? (
            <p>No hay centros publicados para este ciclo en la copia actual.</p>
          ) : (
            <ul className="study-center-preview">
              {studyCenters.slice(0, 4).map((center) => {
                const population = municipalityByLocation.get(
                  `${normalizedLocation(center.locality)}|${normalizedLocation(center.province)}`,
                );
                return (
                  <li key={center.centerCode}>
                    <strong>{center.centerName}</strong>
                    <span>
                      {center.locality}, {center.province}
                      {population === undefined
                        ? ""
                        : ` · ${new Intl.NumberFormat("es-ES").format(population)} habitantes`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div
          id="contexto-provincial"
          className="regional-context"
          tabIndex={-1}
        >
          <div className="section-heading">
            <h2>Contexto provincial</h2>
            <span>Contratos registrados</span>
          </div>
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
            Contexto provincial — no específico de esta ocupación. Reúne
            contratos registrados de todas las ocupaciones.
          </p>
        </div>
      </section>
      {educationCenterDirectorySnapshot !== undefined && (
        <div id="distribucion-centros" tabIndex={-1}>
          <TerritorialDistribution
            centers={territorialCenters}
            sourceUrl={educationCenterDirectorySnapshot.sourceUrl}
            academicYear={
              state.regionalContext.educationCenterDirectory[0]?.academicYear ??
              null
            }
            sourceUpdatedAt={educationCenterDirectorySnapshot.sourceUpdatedAt}
            snapshotFetchedAt={
              educationCenterDirectorySnapshot.snapshotFetchedAt
            }
          />
        </div>
      )}
      <section
        id="salidas-profesionales"
        className="occupations-section"
        tabIndex={-1}
      >
        <h2>Salidas profesionales oficiales</h2>
        <p>
          TodoFP identifica estos perfiles para el título. Describen trabajos a
          los que prepara el ciclo; no significan que exista ahora una oferta
          concreta en esta copia de datos.
        </p>
        {officialProfiles.length > 0 ? (
          <>
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
            <p>
              <ExternalLink href={officialProfiles[0]!.sourceUrl}>
                Comprobar estas salidas en la ficha oficial de TodoFP
              </ExternalLink>
            </p>
          </>
        ) : (
          <p>No se han podido cargar las salidas oficiales de este ciclo.</p>
        )}
      </section>
      {resolvedOccupations.length > 0 && (
        <section
          id="ocupaciones-revisadas"
          className="occupations-section"
          tabIndex={-1}
        >
          <h2>Grupos de ocupación revisados para buscar ofertas</h2>
          <ul className="reviewed-occupation-list">
            {resolvedOccupations.map((occupation) => (
              <li key={occupation.occupationId}>
                <Link
                  to={`/desde-ocupacion/${encodeURIComponent(occupation.occupationId)}`}
                >
                  <strong>{occupation.preferredLabel}</strong>
                  {occupation.classificationCode !== "" && (
                    <span>CNO-11 {occupation.classificationCode}</span>
                  )}
                  {occupation.functionalBoundary !== undefined && (
                    <span className="reviewed-occupation-boundary">
                      <strong>
                        Alcance:{" "}
                        {occupation.functionalBoundary.roleLevel === "assistant"
                          ? "puesto auxiliar"
                          : "ocupación afín"}
                      </strong>
                      <span>
                        El título no acredita por sí solo toda la ocupación
                        CNO-11.
                      </span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!hasApprovedRelationship ? (
        <div className="status-panel">
          <h2>Cómo buscar oportunidades ahora</h2>
          <p>
            Las salidas oficiales están disponibles arriba. Todavía no hay una
            relación revisada que permita buscar ofertas para este ciclo sin
            mostrar coincidencias dudosas.
          </p>
          <p>
            Usa los nombres oficiales como términos de búsqueda en los portales
            de empleo y comprueba siempre los requisitos de cada oferta.
          </p>
        </div>
      ) : orderedMatches.length === 0 ? (
        <div className="status-panel">
          <p>
            {publicationFilter === null
              ? `No hay ofertas relacionadas en la copia de datos del ${snapshotDate(state.manifest)}.`
              : "No hay ofertas relacionadas en esta copia de datos que omitan publicar este requisito exacto."}
          </p>
          <p>
            Esto no significa que no existan ofertas fuera de esta copia de
            datos.
          </p>
        </div>
      ) : (
        <section
          id="ofertas-relacionadas"
          className="offer-results"
          aria-labelledby="offer-results-title"
          tabIndex={-1}
        >
          <div className="section-heading">
            <h2 id="offer-results-title">Ofertas relacionadas ahora</h2>
            <span>Copia del {snapshotDate(state.manifest)}</span>
          </div>
          <div className="offer-list">
            {orderedMatches.map((match) => {
              const offer = state.offers.find(({ id }) => id === match.offerId);
              if (offer === undefined) return null;
              const evidenceState = deriveEvidenceState(match, session.answers);
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
                <OfferEvidenceCard
                  key={match.offerId}
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
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
