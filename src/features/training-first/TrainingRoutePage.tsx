import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  EducationCenter,
  LegacyEducationCenter,
  LegacyTrainingOffering,
  TrainingOffering,
  TrainingProgram,
} from "../../../data/schemas/generated";
import {
  loadFoundationResources,
  loadManifest,
} from "../../data/generatedDataClient";
import { trainingLevelLabel } from "../../domain/trainingPresentation";

type Center = EducationCenter | LegacyEducationCenter;
type Offering = TrainingOffering | LegacyTrainingOffering;

type RouteState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "unknown" }
  | {
      status: "ready";
      program: TrainingProgram;
      centers: Center[];
      offerings: Offering[];
    };

const modalityLabels: Record<Offering["modality"], string> = {
  on_site: "Presencial",
  distance: "A distancia",
  mixed: "Mixta",
  unknown: "Modalidad no publicada",
};

export function TrainingRoutePage() {
  const { programKey = "" } = useParams();
  const [state, setState] = useState<RouteState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then((manifest) => loadFoundationResources(manifest))
      .then((resources) => {
        if (!active) return;
        const program = resources.programs.find(
          (candidate) => candidate.programKey === programKey,
        );
        if (program === undefined) {
          setState({ status: "unknown" });
          return;
        }
        setState({
          status: "ready",
          program,
          centers: resources.centers,
          offerings: resources.trainingOfferings.filter(
            (offering) => offering.programKey === programKey,
          ),
        });
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, [programKey]);

  if (state.status === "loading") return <p>Cargando centros oficiales…</p>;
  if (state.status === "failed") {
    return (
      <section className="status-panel" role="alert">
        <h1>No hemos podido cargar la ruta formativa</h1>
        <Link to="/desde-fp">Volver a los ciclos</Link>
      </section>
    );
  }
  if (state.status === "unknown") {
    return (
      <section className="status-panel">
        <h1>Ciclo no encontrado</h1>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }

  const centersByCode = new Map(
    state.centers.map((center) => [center.centerCode, center]),
  );
  return (
    <section className="training-page">
      <header className="training-page__header">
        <Link to={`/desde-fp/${encodeURIComponent(state.program.programKey)}`}>
          Volver a ofertas relacionadas
        </Link>
        <p className="training-page__eyebrow">
          Oferta oficial de FP en Castilla y León
        </p>
        <h1>Dónde estudiar {state.program.programTitle}</h1>
        <p>
          {trainingLevelLabel(state.program.level)} · Código oficial{" "}
          {state.program.programKey}
        </p>
      </header>
      {state.offerings.length === 0 ? (
        <div className="status-panel">
          <p>
            No hay centros publicados para este ciclo en la instantánea
            disponible.
          </p>
        </div>
      ) : (
        <ul className="center-list" aria-label="Centros que imparten el ciclo">
          {state.offerings.map((offering) => {
            const center = centersByCode.get(offering.centerCode);
            const centerName =
              "centerName" in offering
                ? offering.centerName
                : (center?.centerName ?? offering.centerCode);
            return (
              <li
                className="center-card"
                key={`${offering.centerCode}-${offering.modality}`}
              >
                <h2>{centerName}</h2>
                <p>
                  {offering.province} · {modalityLabels[offering.modality]}
                </p>
                {center?.address !== null && center?.address !== undefined && (
                  <p>{center.address}</p>
                )}
                {center?.website !== null && center?.website !== undefined && (
                  <a href={center.website} target="_blank" rel="noreferrer">
                    Web del centro{" "}
                    <span className="sr-only">(abre en una pestaña nueva)</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
