import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  LoadableGeneratedManifest,
  SourceSnapshot,
} from "../../../data/schemas/generated";
import type { Occupation } from "../../../data/schemas/curatedMappings";
import { ExternalLink } from "../../components/ExternalLink";
import { ResultSectionNav } from "../../components/ResultSectionNav";
import {
  loadAuditedRelationships,
  loadFoundationResourceSubset,
  loadManifest,
  loadOfficialOccupations,
  type LoadedAuditedRelationships,
  type LoadedFoundationResourceSubset,
} from "../../data/generatedDataClient";
import { loadApprovedMappings } from "../../domain/occupation";
import { useRouteReady } from "../../app/RouteReadyContext";
import { OccupationMarketEvidence } from "./OccupationMarketEvidence";
import { TrainingRouteCard } from "./TrainingRouteCard";

interface ReadyState {
  status: "ready";
  manifest: LoadableGeneratedManifest;
  foundation: LoadedFoundationResourceSubset<"programs" | "trainingOfferings">;
  relationships: LoadedAuditedRelationships;
  officialOccupations: Occupation[];
}

type ResultsState = { status: "loading" } | { status: "failed" } | ReadyState;

function spanishDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function OccupationResultsPage() {
  const { occupationId = "" } = useParams();
  const [state, setState] = useState<ResultsState>({ status: "loading" });

  useRouteReady(state.status === "ready");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const [foundation, loadedRelationships, officialOccupations] =
          await Promise.all([
            loadFoundationResourceSubset(
              manifest,
              ["programs", "trainingOfferings"],
              options,
            ),
            loadAuditedRelationships(manifest, options),
            loadOfficialOccupations(manifest, options),
          ]);
        return {
          status: "ready" as const,
          manifest,
          foundation,
          relationships: loadApprovedMappings(loadedRelationships),
          officialOccupations,
        };
      })
      .then((nextState) => {
        if (!signal.aborted) setState(nextState);
      })
      .catch(() => {
        if (signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => {
      controller.abort();
    };
  }, []);

  const orderedLinks = useMemo(() => {
    if (state.status !== "ready") return [];
    return state.relationships.links
      .filter((link) => link.occupationId === occupationId)
      .sort((left, right) => {
        const relationshipOrder =
          (left.relationshipType === "official_output" ? 0 : 1) -
          (right.relationshipType === "official_output" ? 0 : 1);
        if (relationshipOrder !== 0) return relationshipOrder;
        const leftProgram = state.foundation.programs.find(
          (program) => program.programKey === left.trainingProgramKey,
        );
        const rightProgram = state.foundation.programs.find(
          (program) => program.programKey === right.trainingProgramKey,
        );
        return (
          (leftProgram?.programTitle ?? left.trainingProgramKey).localeCompare(
            rightProgram?.programTitle ?? right.trainingProgramKey,
            "es",
          ) || left.trainingProgramKey.localeCompare(right.trainingProgramKey)
        );
      });
  }, [occupationId, state]);

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Preparando las rutas revisadas…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        role="alert"
        aria-labelledby="occupation-results-load-error-heading"
      >
        <h1 id="occupation-results-load-error-heading">
          No hemos podido cargar las rutas formativas
        </h1>
        <p>Vuelve a intentarlo dentro de unos minutos.</p>
        <Link to="/desde-ocupacion">Buscar otra ocupación</Link>
      </section>
    );
  }

  const occupation = state.officialOccupations.find(
    (candidate) => candidate.occupationId === occupationId,
  );
  if (occupation === undefined) {
    return (
      <section
        className="status-panel"
        aria-labelledby="occupation-results-not-found-heading"
      >
        <h1 id="occupation-results-not-found-heading">
          Ocupación no encontrada
        </h1>
        <p>La dirección no corresponde a una ocupación oficial CNO-11.</p>
        <Link to="/desde-ocupacion">Buscar otra ocupación</Link>
      </section>
    );
  }

  const missingPrograms = orderedLinks.filter(
    (link) =>
      !state.foundation.programs.some(
        (program) => program.programKey === link.trainingProgramKey,
      ),
  );
  const trainingSnapshot = state.manifest.resourceSnapshots.trainingOfferings;
  const snapshotInstant =
    trainingSnapshot.sourceUpdatedAt ?? trainingSnapshot.snapshotFetchedAt;
  const stale =
    state.manifest.qualityStatus === "stale" ||
    trainingSnapshot.qualityStatus === "stale";
  const linkedProgramKeys = new Set(
    orderedLinks.map((link) => link.trainingProgramKey),
  );
  const linkedOfferings = state.foundation.trainingOfferings.filter(
    (offering) => linkedProgramKeys.has(offering.programKey),
  );
  const linkedCenters = new Set(
    linkedOfferings.map((offering) => offering.centerCode),
  );
  const linkedProvinces = new Set(
    linkedOfferings.map((offering) => offering.province),
  );
  const resourceSnapshots = state.manifest
    .resourceSnapshots as typeof state.manifest.resourceSnapshots &
    Partial<
      Record<
        "officialOccupations" | "trainingOccupationLinks",
        SourceSnapshot & { resourcePath: string }
      >
    >;
  const occupationSnapshot = resourceSnapshots.officialOccupations;
  const relationshipSnapshot = resourceSnapshots.trainingOccupationLinks;
  const occupationSourceUrl = occupationSnapshot?.sourceUrl;
  const relationshipSourceUrl =
    orderedLinks[0]?.sourceUrl ?? relationshipSnapshot?.sourceUrl;
  const relationshipDate =
    orderedLinks[0]?.reviewedAt ??
    relationshipSnapshot?.sourceUpdatedAt ??
    relationshipSnapshot?.snapshotFetchedAt;
  const sectionNavigationLinks = [
    { href: "#mercado-laboral", label: "Mercado laboral" },
    ...(orderedLinks.length === 0
      ? []
      : [{ href: "#rutas-formativas", label: "Rutas formativas" }]),
  ];
  const hasOfficialOutput = orderedLinks.some(
    (link) => link.relationshipType === "official_output",
  );
  const hasReviewedRelationship = orderedLinks.some(
    (link) => link.relationshipType === "reviewed_relationship",
  );

  return (
    <section
      className="training-page occupation-result-page"
      aria-labelledby="occupation-results-heading"
    >
      <header className="training-page__header">
        <Link to="/desde-ocupacion">Buscar otra ocupación</Link>
        <p className="training-page__eyebrow">
          Ocupación seleccionada del catálogo oficial
        </p>
        <h1 id="occupation-results-heading">{occupation.preferredLabel}</h1>
        <p>CNO-11 {occupation.classificationCode}</p>
      </header>
      <p className="decision-direction">
        Ocupación que quieres <span aria-hidden="true">→</span> FP que te lleva
        a ella
      </p>
      <ResultSectionNav links={sectionNavigationLinks} />
      <section className="decision-basis" aria-labelledby="route-basis-title">
        <div className="decision-basis__heading">
          <p>Base para decidir</p>
          <h2 id="route-basis-title">Qué rutas hemos podido comprobar</h2>
        </div>
        <dl className="result-summary" aria-label="Resumen de rutas formativas">
          <div>
            <dt>FP relacionadas</dt>
            <dd>
              <strong>{linkedProgramKeys.size}</strong>
              <span className="result-summary__unit">rutas revisadas</span>
              <span className="result-summary__source">
                {relationshipSourceUrl !== undefined && (
                  <ExternalLink href={relationshipSourceUrl}>
                    Fuente: relación FP-ocupación
                  </ExternalLink>
                )}
                {relationshipDate !== undefined && (
                  <time dateTime={relationshipDate}>
                    Revisada el {spanishDate(relationshipDate)}
                  </time>
                )}
              </span>
            </dd>
          </div>
          <div>
            <dt>Centros</dt>
            <dd>
              <strong>{linkedCenters.size}</strong>
              <span className="result-summary__unit">centros publicados</span>
              <span className="result-summary__source">
                <ExternalLink href={trainingSnapshot.sourceUrl}>
                  Fuente: oferta FP JCyL
                </ExternalLink>
                <time dateTime={snapshotInstant}>
                  Copia del {spanishDate(snapshotInstant)}
                </time>
              </span>
            </dd>
          </div>
          <div>
            <dt>Provincias</dt>
            <dd>
              <strong>{linkedProvinces.size}</strong>
              <span className="result-summary__unit">
                provincias con oferta
              </span>
              <span className="result-summary__source">
                {occupationSourceUrl !== undefined && (
                  <ExternalLink href={occupationSourceUrl}>
                    Fuente: catálogo CNO-11
                  </ExternalLink>
                )}
                {occupationSnapshot !== undefined && (
                  <time
                    dateTime={
                      occupationSnapshot.sourceUpdatedAt ??
                      occupationSnapshot.snapshotFetchedAt
                    }
                  >
                    Catálogo comprobado el{" "}
                    {spanishDate(
                      occupationSnapshot.sourceUpdatedAt ??
                        occupationSnapshot.snapshotFetchedAt,
                    )}
                  </time>
                )}
              </span>
            </dd>
          </div>
        </dl>
      </section>
      <div id="mercado-laboral" tabIndex={-1}>
        <OccupationMarketEvidence
          manifest={state.manifest}
          cnoCode={occupation.classificationCode}
        />
      </div>
      <p className="coverage-note">
        Cobertura en revisión. Un resultado ausente no demuestra que no exista
        formación relacionada.
      </p>
      {stale && (
        <p className="stale-warning" role="status">
          No se han podido actualizar los datos formativos. Mostramos la última
          copia disponible.
        </p>
      )}
      {missingPrograms.length > 0 && (
        <div className="status-panel" role="alert">
          <h2>Hay relaciones que no se pueden mostrar</h2>
          <p>
            {missingPrograms.length === 1
              ? "Falta el ciclo oficial de una relación revisada"
              : `Faltan los ciclos oficiales de ${missingPrograms.length} relaciones revisadas`}{" "}
            en la copia de datos formativos.
          </p>
        </div>
      )}
      {orderedLinks.length === 0 ? (
        <div className="status-panel">
          <p>Aún no hay una ruta formativa revisada para esta ocupación.</p>
          <p>
            Esto no significa que no exista formación relacionada: el catálogo
            solo publica relaciones ya verificadas.
          </p>
          <Link to="/desde-ocupacion">Probar otra búsqueda</Link>
        </div>
      ) : (
        <section
          id="rutas-formativas"
          className="occupation-routes"
          aria-labelledby="training-routes-heading"
          tabIndex={-1}
        >
          <div className="section-heading">
            <h2 id="training-routes-heading">FP relacionadas</h2>
            <span>
              Oferta FP JCyL: copia del {spanishDate(snapshotInstant)}
            </span>
          </div>
          <div className="route-relationship-guides">
            {hasOfficialOutput && (
              <p>
                La salida aparece expresamente en el perfil profesional oficial
                del ciclo.
              </p>
            )}
            {hasReviewedRelationship && (
              <p>
                La relación se apoya en competencias compartidas y ha sido
                revisada antes de publicarse.
              </p>
            )}
          </div>
          <div className="training-route-list">
            {orderedLinks.map((link) => {
              const program = state.foundation.programs.find(
                (candidate) => candidate.programKey === link.trainingProgramKey,
              );
              if (program === undefined) return null;
              return (
                <TrainingRouteCard
                  key={`${link.trainingProgramKey}-${link.relationshipType}`}
                  link={link}
                  program={program}
                  offerings={state.foundation.trainingOfferings.filter(
                    (offering) => offering.programKey === program.programKey,
                  )}
                />
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
