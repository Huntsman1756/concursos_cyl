import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import type { Occupation } from "../../../data/schemas/curatedMappings";
import { ExternalLink } from "../../components/ExternalLink";
import { InfoDisclosure } from "../../components/InfoDisclosure";
import { PrintButton } from "../../components/PrintButton";
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
import { occupationOffersPath } from "../../app/routePaths";
import { Breadcrumbs } from "../../components/Breadcrumbs";
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
        <h1 className="h1" id="occupation-results-load-error-heading">
          No hemos podido cargar las rutas formativas
        </h1>
        <p>Vuelve a intentarlo dentro de unos minutos.</p>
        <Link to="/desde-ocupacion">Buscar otra profesión</Link>
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
        <h1 className="h1" id="occupation-results-not-found-heading">
          Profesión no encontrada
        </h1>
        <p>La dirección no corresponde a una profesión oficial (CNO-11).</p>
        <Link to="/desde-ocupacion">Buscar otra profesión</Link>
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
  const sectionNavigationLinks = [
    { href: "#rutas-formativas", label: "FP relacionadas" },
    { href: "#mercado-laboral", label: "Mercado laboral" },
  ];

  return (
    <section
      className="training-page occupation-result-page"
      aria-labelledby="occupation-results-heading"
    >
      <Breadcrumbs
        items={[
          { label: "Inicio", to: "/" },
          { label: "Buscar profesión", to: "/desde-ocupacion" },
          { label: occupation.preferredLabel },
        ]}
      />
      <header className="training-page__header page-masthead">
        <Link
          to="/desde-ocupacion"
          className="training-page__back"
          data-print-hidden="true"
        >
          Buscar otra profesión
        </Link>
        <h1 className="h1" id="occupation-results-heading">
          {occupation.preferredLabel}
        </h1>
        <div className="training-page__meta">
          <span className="training-page__code">
            CNO-11 {occupation.classificationCode}
          </span>
          <InfoDisclosure label="Fuente de esta profesión">
            <p>Denominación oficial del catálogo CNO-11 (BOE, RD 1591/2010).</p>
            <ExternalLink href={occupation.sourceUrl}>
              Ver fuente oficial
            </ExternalLink>
            <p>Catálogo comprobado el {spanishDate(occupation.reviewedAt)}.</p>
          </InfoDisclosure>
        </div>
        <div className="training-page__tools" data-print-hidden="true">
          <PrintButton className="secondary-button" />
        </div>
      </header>
      <ResultSectionNav links={sectionNavigationLinks} />
      <p className="contextual-offers-link">
        <Link to={occupationOffersPath(occupation.occupationId)}>
          Ver ofertas relacionadas con esta profesión{" "}
          <span aria-hidden="true">→</span>
        </Link>
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
          <h1 className="h1" id="occupation-results-heading">
            Aún no hay una ruta formativa comprobada para esta profesión
          </h1>
          <p>
            Esto no significa que no exista formación relacionada: solo
            publicamos relaciones verificadas en fuentes oficiales, y esta aún
            está pendiente.
          </p>
          <p>
            Puedes buscar{" "}
            <Link to="/desde-oferta">
              ofertas relacionadas en la copia actual
            </Link>{" "}
            o <Link to="/desde-ocupacion">probar con otra profesión</Link>.
          </p>
        </div>
      ) : (
        <section
          id="rutas-formativas"
          className="occupation-routes"
          aria-labelledby="training-routes-heading"
          tabIndex={-1}
        >
          <div className="section-heading">
            <h2 id="training-routes-heading">
              FP que te llevan a esta profesión
            </h2>
            <span>
              Oferta formativa · copia consultada el{" "}
              {spanishDate(snapshotInstant)}
            </span>
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
      <div
        id="mercado-laboral"
        aria-labelledby="occupation-market-evidence-title"
        tabIndex={-1}
      >
        <OccupationMarketEvidence
          manifest={state.manifest}
          cnoCode={occupation.classificationCode}
        />
      </div>
    </section>
  );
}
