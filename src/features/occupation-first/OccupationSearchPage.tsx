import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Occupation } from "../../../data/schemas/curatedMappings";
import {
  loadAuditedRelationships,
  loadManifest,
  loadOfficialOccupations,
  type LoadedAuditedRelationships,
} from "../../data/generatedDataClient";
import { loadApprovedMappings } from "../../domain/occupation";
import { useRouteReady } from "../../app/RouteReadyContext";
import { occupationDetailPath } from "../../app/routePaths";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { OccupationCombobox } from "./OccupationCombobox";

type SearchState =
  | { status: "loading" }
  | { status: "failed" }
  | ({ status: "ready" } & LoadedAuditedRelationships);

export function OccupationSearchPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<SearchState>({ status: "loading" });
  const [confirmedOccupation, setConfirmedOccupation] =
    useState<Occupation | null>(null);

  useRouteReady(state.status === "ready");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const [relationships, officialOccupations] = await Promise.all([
          loadAuditedRelationships(manifest, options),
          loadOfficialOccupations(manifest, options),
        ]);
        const approved = loadApprovedMappings(relationships);
        const reviewedById = new Map(
          approved.occupations.map((occupation) => [
            occupation.occupationId,
            occupation,
          ]),
        );
        return {
          ...approved,
          occupations: officialOccupations.map((occupation) => ({
            ...occupation,
            confirmationLabel:
              reviewedById.get(occupation.occupationId)?.confirmationLabel ??
              occupation.confirmationLabel,
          })),
        };
      })
      .then((relationships) => {
        if (!signal.aborted) setState({ status: "ready", ...relationships });
      })
      .catch(() => {
        if (signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => {
      controller.abort();
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (confirmedOccupation === null) return;
    navigate(
      occupationDetailPath(
        confirmedOccupation.occupationId,
        confirmedOccupation.preferredLabel,
      ),
    );
  }

  return (
    <section
      className="training-page search-page occupation-search-page"
      aria-busy={state.status === "loading"}
      aria-labelledby="occupation-search-heading"
    >
      <Breadcrumbs
        items={[{ label: "Inicio", to: "/" }, { label: "Buscar profesión" }]}
      />
      <header className="training-page__header">
        <h1 className="h1" id="occupation-search-heading">
          ¿Qué FP te lleva a una profesión?
        </h1>
        <p className="training-page__intro">
          Escribe una profesión y verás los ciclos con una relación comprobada
          con ella, y los centros donde estudiarlos.
        </p>
      </header>
      {state.status === "loading" && (
        <p role="status" aria-live="polite">
          Preparando las ocupaciones oficiales…
        </p>
      )}
      {state.status === "failed" && (
        <div className="status-panel" role="alert">
          <h2>No hemos podido cargar las ocupaciones</h2>
          <p>Vuelve a intentarlo dentro de unos minutos.</p>
        </div>
      )}
      {state.status === "ready" && (
        <form className="training-search search-card" onSubmit={submit}>
          <div className="search-card__intro">
            <h2>Busca en el catálogo oficial de profesiones</h2>
            <p>
              También puedes escribir un nombre coloquial: solo verás las
              relaciones comprobadas.
            </p>
          </div>
          <OccupationCombobox
            occupations={state.occupations}
            aliases={state.aliases}
            confirmedOccupation={confirmedOccupation}
            onConfirm={setConfirmedOccupation}
            onClear={() => setConfirmedOccupation(null)}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={confirmedOccupation === null}
          >
            Ver qué FP te lleva a ella
          </button>
          <p className="coverage-note">
            El catálogo incluye {state.occupations.length} grupos oficiales de
            ocupación. Que una ocupación aparezca no significa que su relación
            con un ciclo FP esté comprobada todavía.
          </p>
        </form>
      )}
    </section>
  );
}
