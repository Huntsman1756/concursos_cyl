import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Occupation } from "../../../data/schemas/curatedMappings";
import {
  loadAuditedRelationships,
  loadFoundationResources,
  loadManifest,
  loadOfficialOccupations,
  type LoadedAuditedRelationships,
} from "../../data/generatedDataClient";
import { loadApprovedMappings } from "../../domain/occupation";
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

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const [, relationships, officialOccupations] = await Promise.all([
          loadFoundationResources(manifest),
          loadAuditedRelationships(manifest),
          loadOfficialOccupations(manifest),
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
        if (active) setState({ status: "ready", ...relationships });
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (confirmedOccupation === null) return;
    navigate(
      `/desde-ocupacion/${encodeURIComponent(confirmedOccupation.occupationId)}`,
    );
  }

  return (
    <section className="training-page" aria-busy={state.status === "loading"}>
      <header className="training-page__header">
        <p className="training-page__eyebrow">Desde una ocupación</p>
        <h1>Descubre qué FP conduce a un trabajo concreto</h1>
        <p>
          Escribe como lo dirías normalmente y filtra el catálogo completo
          CNO-11. Después mostraremos las relaciones FP que ya están revisadas.
        </p>
      </header>
      {state.status === "loading" && (
        <p>Preparando las ocupaciones oficiales…</p>
      )}
      {state.status === "failed" && (
        <div className="status-panel" role="alert">
          <h2>No hemos podido cargar las ocupaciones</h2>
          <p>Vuelve a intentarlo dentro de unos minutos.</p>
        </div>
      )}
      {state.status === "ready" && (
        <form className="training-search" onSubmit={submit}>
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
            Ver rutas formativas
          </button>
          <p className="coverage-note">
            El catálogo incluye {state.occupations.length} grupos oficiales de
            ocupación. Que una ocupación aparezca no implica que su relación con
            un ciclo FP esté validada todavía.
          </p>
        </form>
      )}
    </section>
  );
}
