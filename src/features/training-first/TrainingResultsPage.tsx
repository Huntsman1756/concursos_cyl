import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../../data/catalogs/reviewedQualifications";
import type {
  JobOffer,
  LoadableGeneratedManifest,
  TrainingProgram,
} from "../../../data/schemas/generated";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
  loadPublishedRequirements,
  type LoadedAuditedRelationships,
} from "../../data/generatedDataClient";
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
import { OfferEvidenceCard } from "./OfferEvidenceCard";
import { resolveApprovedOccupations } from "./resolveApprovedOccupations";

interface ReadyResults {
  status: "ready";
  program: TrainingProgram;
  programs: TrainingProgram[];
  manifest: LoadableGeneratedManifest;
  offers: JobOffer[];
  requirements: OfferPublishedRequirements[];
  relationships: LoadedAuditedRelationships;
  matches: OfferMatch[];
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

function normalizedLocation(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function TrainingResultsPage() {
  const { programKey = "" } = useParams();
  const [searchParams] = useSearchParams();
  const selectedProvince = searchParams.get("province");
  const [publicationFilter, setPublicationFilter] = useState<Extract<
    ReliableAction,
    { actionType: "explore_unpublished_requirement" }
  > | null>(null);
  const session = useDecisionSession();
  const [state, setState] = useState<ResultsState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const foundation = await loadFoundationResources(manifest);
        const program = foundation.programs.find(
          (candidate) => candidate.programKey === programKey,
        );
        if (program === undefined) return { status: "unknown" as const };
        const [requirements, relationships] = await Promise.all([
          loadPublishedRequirements(manifest),
          loadAuditedRelationships(manifest),
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
          matches,
        };
      })
      .then((nextState) => {
        if (active) setState(nextState);
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, [programKey]);

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

  if (state.status === "loading") return <p>Buscando ofertas relacionadas…</p>;
  if (state.status === "failed") {
    return (
      <section className="status-panel" role="alert">
        <h1>No hemos podido cargar los resultados</h1>
        <p>Vuelve a intentarlo dentro de unos minutos.</p>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }
  if (state.status === "unknown") {
    return (
      <section className="status-panel">
        <h1>Ciclo no encontrado</h1>
        <p>La dirección no corresponde a un ciclo oficial disponible.</p>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }

  const stale =
    state.manifest.qualityStatus === "stale" ||
    state.manifest.resourceSnapshots.jobOffers.qualityStatus === "stale";

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
    setPublicationFilter(action);
  }

  return (
    <section className="training-page">
      <header className="training-page__header">
        <Link to="/desde-fp">Cambiar ciclo</Link>
        <p className="training-page__eyebrow">Ofertas relacionadas con</p>
        <h1>{state.program.programTitle}</h1>
        <p>
          {trainingLevelLabel(state.program.level)} · Código oficial{" "}
          {state.program.programKey}
        </p>
        {selectedProvince !== null && <p>Zona elegida: {selectedProvince}</p>}
      </header>
      {stale && (
        <p className="stale-warning" role="status">
          No se han podido actualizar los datos. Mostramos la última copia
          disponible.
        </p>
      )}
      {publicationFilter !== null && (
        <div className="filter-notice" role="status">
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
      <section className="study-section">
        <h2>Dónde estudiar este ciclo</h2>
        <p>
          <Link to={`/formacion/${encodeURIComponent(programKey)}`}>
            Acceder a la información formativa de {state.program.programTitle}
          </Link>
        </p>
      </section>
      {resolvedOccupations.length > 0 && (
        <section className="occupations-section">
          <h2>Ocupaciones revisadas</h2>
          <ul>
            {resolvedOccupations.map((occupation) => (
              <li key={occupation.occupationId}>
                <p>
                  <strong>{occupation.preferredLabel}</strong>
                </p>
                {occupation.classificationCode !== "" && (
                  <p>Código CNO-11: {occupation.classificationCode}</p>
                )}
                <p>
                  <Link
                    to={`/desde-ocupacion/${encodeURIComponent(occupation.occupationId)}`}
                  >
                    Ver perfil profesional
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {!hasApprovedRelationship ? (
        <div className="status-panel">
          <p>Aún no hay una relación revisada para este ciclo.</p>
        </div>
      ) : orderedMatches.length === 0 ? (
        <div className="status-panel">
          <p>
            {publicationFilter === null
              ? `No hay ofertas relacionadas en la instantánea del ${snapshotDate(state.manifest)}.`
              : "No hay ofertas relacionadas en esta instantánea que omitan publicar este requisito exacto."}
          </p>
          <p>
            Esto no significa que no existan ofertas fuera de esta copia de
            datos.
          </p>
        </div>
      ) : (
        <div className="offer-list" aria-label="Ofertas relacionadas">
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
      )}
    </section>
  );
}
