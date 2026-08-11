import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { LoadableGeneratedManifest } from "../../../data/schemas/generated";
import type { Occupation } from "../../../data/schemas/curatedMappings";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
  loadOfficialOccupations,
  type LoadedAuditedRelationships,
  type LoadedFoundationResources,
} from "../../data/generatedDataClient";
import { loadApprovedMappings } from "../../domain/occupation";
import { TrainingRouteCard } from "./TrainingRouteCard";

interface ReadyState {
  status: "ready";
  manifest: LoadableGeneratedManifest;
  foundation: LoadedFoundationResources;
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

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const [foundation, loadedRelationships, officialOccupations] =
          await Promise.all([
            loadFoundationResources(manifest),
            loadAuditedRelationships(manifest),
            loadOfficialOccupations(manifest),
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
        if (active) setState(nextState);
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
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

  if (state.status === "loading") return <p>Preparando las rutas revisadas…</p>;
  if (state.status === "failed") {
    return (
      <section className="status-panel" role="alert">
        <h1>No hemos podido cargar las rutas formativas</h1>
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
      <section className="status-panel">
        <h1>Ocupación no encontrada</h1>
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

  return (
    <section className="training-page">
      <header className="training-page__header">
        <Link to="/desde-ocupacion">Buscar otra ocupación</Link>
        <p className="training-page__eyebrow">Ocupación oficial confirmada</p>
        <h1>{occupation.preferredLabel}</h1>
        <p>
          CNO-11 {occupation.classificationCode}. Mostramos todas las relaciones
          aprobadas del catálogo actual; cada una indica su tipo y fuente.
        </p>
      </header>
      <p className="coverage-note">
        La cobertura aún es limitada: una ausencia indica que la relación no ha
        sido revisada, no que no exista formación relacionada.
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
            Falta el ciclo oficial de {missingPrograms.length} relación revisada
            en la instantánea formativa.
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
        <div
          className="training-route-list"
          aria-label="Rutas formativas revisadas"
        >
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
                snapshotDate={spanishDate(snapshotInstant)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
