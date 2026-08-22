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
  loadFoundationResourceSubset,
  loadManifest,
} from "../../data/generatedDataClient";
import { ExternalLink } from "../../components/ExternalLink";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import { useRouteReady } from "../../app/RouteReadyContext";

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

  useRouteReady(state.status === "ready" || state.status === "unknown");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then((manifest) =>
        loadFoundationResourceSubset(
          manifest,
          ["programs", "centers", "trainingOfferings"],
          options,
        ),
      )
      .then((resources) => {
        if (signal.aborted) return;
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
        if (signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => {
      controller.abort();
    };
  }, [programKey]);

  if (state.status === "loading")
    return (
      <p role="status" aria-live="polite">
        Cargando centros oficiales…
      </p>
    );
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        role="alert"
        aria-labelledby="training-route-error-heading"
      >
        <h1 id="training-route-error-heading">
          No hemos podido cargar la ruta formativa
        </h1>
        <Link to="/desde-fp">Volver a los ciclos</Link>
      </section>
    );
  }
  if (state.status === "unknown") {
    return (
      <section
        className="status-panel"
        aria-labelledby="training-route-not-found-heading"
      >
        <h1 id="training-route-not-found-heading">Ciclo no encontrado</h1>
        <Link to="/desde-fp">Elegir otro ciclo</Link>
      </section>
    );
  }

  const centersByCode = new Map(
    state.centers.map((center) => [center.centerCode, center]),
  );
  return (
    <section className="training-page" aria-labelledby="training-route-heading">
      <header className="training-page__header">
        <Link to={`/desde-fp/${encodeURIComponent(state.program.programKey)}`}>
          Volver a salidas y ofertas
        </Link>
        <p className="training-page__eyebrow">
          Oferta oficial de FP en Castilla y León
        </p>
        <h1 id="training-route-heading">
          Dónde estudiar {state.program.programTitle}
        </h1>
        <p>
          {trainingLevelLabel(state.program.level)} · Código oficial{" "}
          {state.program.programKey}
        </p>
      </header>
      {state.offerings.length === 0 ? (
        <div className="status-panel">
          <p>
            No hay centros publicados para este ciclo en la copia de datos
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
                  <ExternalLink href={center.website}>
                    Web del centro
                  </ExternalLink>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
