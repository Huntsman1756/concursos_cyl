import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, JSX } from "react";
import { Link, useNavigate } from "react-router-dom";

import type {
  MappingCoverage,
  Occupation,
  OccupationAlias,
} from "../../../data/schemas/curatedMappings";
import type {
  SourceSnapshot,
  TrainingProgram,
} from "../../../data/schemas/generated";
import {
  loadAuditedRelationships,
  loadFoundationResourceSubset,
  loadManifest,
  loadMappingCoverage,
} from "../../data/generatedDataClient";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  globalOffersPath,
  occupationDetailPath,
  trainingDetailPath,
} from "../../app/routePaths";
import { loadApprovedMappings } from "../../domain/occupation";
import { featuredTrainingCoverage } from "../../domain/trainingPresentation";
import { OccupationCombobox } from "../occupation-first/OccupationCombobox";
import { TrainingCombobox } from "../training-first/TrainingCombobox";
import "./home.css";

type HomeSearchMode = "training" | "occupation" | "offer";

type FreshnessState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      sourceLabel: string;
      ariaLabel: string;
      date: string;
      dateTime: string;
      dateKind: "source" | "snapshot";
      stale: boolean;
    };

type SearchDataState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready";
      programs: TrainingProgram[];
      occupations: Occupation[];
      aliases: OccupationAlias[];
    };

interface CatalogCounts {
  programs: number;
  offers: number;
}

const TASKS: Array<{
  mode: HomeSearchMode;
  number: string;
  title: string;
  description: string;
  label: string;
  action: string;
}> = [
  {
    mode: "training",
    number: "01",
    title: "Tengo una FP y quiero saber mis salidas",
    description:
      "Busca el ciclo para ver profesiones, ofertas y centros relacionados.",
    label: "Busca tu ciclo",
    action: "Buscar ciclo",
  },
  {
    mode: "occupation",
    number: "02",
    title: "Quiero dedicarme a una profesión",
    description:
      "Busca una profesión y comprueba qué formación y ofertas aparecen.",
    label: "Busca una profesión",
    action: "Buscar profesión",
  },
  {
    mode: "offer",
    number: "03",
    title: "He visto una oferta y quiero entenderla",
    description: "Busca por puesto, localidad o código de ocupación.",
    label: "Busca una oferta",
    action: "Buscar oferta",
  },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<HomeSearchMode>("training");
  const [confirmedProgram, setConfirmedProgram] =
    useState<TrainingProgram | null>(null);
  const [confirmedOccupation, setConfirmedOccupation] =
    useState<Occupation | null>(null);
  const [offerQuery, setOfferQuery] = useState("");
  const [formError, setFormError] = useState("");
  const [freshness, setFreshness] = useState<FreshnessState>({
    status: "loading",
  });
  const [catalogCounts, setCatalogCounts] = useState<CatalogCounts | null>(
    null,
  );
  const [featuredProgram, setFeaturedProgram] = useState<{
    programKey: string;
    programTitle: string;
  } | null>(null);
  const [searchData, setSearchData] = useState<SearchDataState>({
    status: "loading",
  });
  const manifestRef = useRef<Awaited<ReturnType<typeof loadManifest>> | null>(
    null,
  );

  useRouteReady(searchData.status !== "loading");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };

    const manifestPromise =
      manifestRef.current === null
        ? loadManifest(options).then((manifest) => {
            if (!signal.aborted) manifestRef.current = manifest;
            return manifest;
          })
        : Promise.resolve(manifestRef.current);

    void manifestPromise
      .then(async (manifest) => {
        if (signal.aborted) return null;

        const snapshots =
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Partial<Record<"mappingCoverage", SourceSnapshot>>;
        const mappingSnapshot = snapshots.mappingCoverage;
        const freshnessSnapshot =
          mappingSnapshot ?? manifest.resourceSnapshots.jobOffers;
        const sourceLabel =
          mappingSnapshot === undefined
            ? "Ofertas laborales"
            : "Relaciones revisadas";
        const dateTime =
          freshnessSnapshot.sourceUpdatedAt ??
          freshnessSnapshot.snapshotFetchedAt;

        setFreshness({
          status: "ready",
          sourceLabel,
          ariaLabel:
            mappingSnapshot === undefined
              ? "Fecha de ofertas laborales"
              : "Fecha de relaciones revisadas",
          date: formatDate(dateTime),
          dateTime,
          dateKind:
            freshnessSnapshot.sourceUpdatedAt === null ? "snapshot" : "source",
          stale:
            manifest.qualityStatus === "stale" ||
            freshnessSnapshot.qualityStatus === "stale",
        });

        const [foundation, coverage] = await Promise.all([
          loadFoundationResourceSubset(manifest, ["programs"], options),
          mappingSnapshot === undefined
            ? Promise.resolve<MappingCoverage[]>([])
            : loadMappingCoverage(manifest, options),
        ]);
        if (signal.aborted) return null;

        setCatalogCounts({
          programs: foundation.programs.length,
          offers: manifest.resourceSnapshots.jobOffers.recordCount,
        });

        if (mappingSnapshot !== undefined) {
          const featured = featuredTrainingCoverage(
            coverage.filter(
              (row): row is Extract<MappingCoverage, { scope: "program" }> =>
                row.scope === "program" && row.coverageStatus === "reviewed",
            ),
          );
          const first = featured[0];
          if (first !== undefined) {
            setFeaturedProgram({
              programKey: first.programKey,
              programTitle: first.programTitle,
            });
          }
        }

        const relationships = await loadAuditedRelationships(manifest, options);
        if (signal.aborted) return null;
        const approved = loadApprovedMappings(relationships);
        return {
          programs: [...foundation.programs].sort((left, right) =>
            left.programTitle.localeCompare(right.programTitle, "es"),
          ),
          occupations: approved.occupations,
          aliases: approved.aliases,
        };
      })
      .then((resources) => {
        if (resources !== null && !signal.aborted) {
          setSearchData({ status: "ready", ...resources });
        }
      })
      .catch(() => {
        if (signal.aborted) return;
        if (manifestRef.current === null) {
          setFreshness({ status: "unavailable" });
        }
        setSearchData({ status: "unavailable" });
      });

    return () => controller.abort();
  }, []);

  const featuredExample = useMemo(() => {
    if (featuredProgram === null || searchData.status !== "ready") return null;
    return searchData.programs.some(
      (program) => program.programKey === featuredProgram.programKey,
    )
      ? featuredProgram
      : null;
  }, [featuredProgram, searchData]);

  function chooseSearchMode(mode: HomeSearchMode): void {
    setSearchMode(mode);
    setConfirmedProgram(null);
    setConfirmedOccupation(null);
    setOfferQuery("");
    setFormError("");
  }

  function submitSearch(
    mode: HomeSearchMode,
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();
    setFormError("");

    if (mode === "training") {
      if (confirmedProgram === null) {
        setFormError("Selecciona un ciclo oficial para continuar.");
        return;
      }
      navigate(
        trainingDetailPath(
          confirmedProgram.programKey,
          confirmedProgram.programTitle,
        ),
      );
      return;
    }
    if (mode === "occupation") {
      if (confirmedOccupation === null) {
        setFormError("Selecciona una profesión oficial para continuar.");
        return;
      }
      navigate(
        occupationDetailPath(
          confirmedOccupation.occupationId,
          confirmedOccupation.preferredLabel,
        ),
      );
      return;
    }
    const query = offerQuery.trim();
    if (query === "") {
      setFormError("Escribe algo para buscar entre las ofertas.");
      return;
    }
    navigate(globalOffersPath({ query }));
  }

  function renderTaskForm(task: (typeof TASKS)[number]): JSX.Element | null {
    if (searchMode !== task.mode) return null;

    return (
      <form
        className="inline-task-form"
        onSubmit={(event) => submitSearch(task.mode, event)}
        aria-label={task.label}
      >
        {task.mode === "training" && searchData.status === "ready" && (
          <TrainingCombobox
            id="home-training-search"
            programs={searchData.programs}
            confirmedProgram={confirmedProgram}
            onConfirm={(program) => {
              setConfirmedProgram(program);
              setFormError("");
            }}
            onClear={() => setConfirmedProgram(null)}
            label={task.label}
            hint="Selecciona un ciclo oficial por nombre, familia, nivel o código."
          />
        )}
        {task.mode === "occupation" && searchData.status === "ready" && (
          <OccupationCombobox
            occupations={searchData.occupations}
            aliases={searchData.aliases}
            confirmedOccupation={confirmedOccupation}
            onConfirm={(occupation) => {
              setConfirmedOccupation(occupation);
              setFormError("");
            }}
            onClear={() => setConfirmedOccupation(null)}
            label={task.label}
            hint="Selecciona una ocupación oficial para ver sus relaciones comprobadas."
          />
        )}
        {task.mode === "offer" && (
          <div className="inline-task-form__field">
            <label htmlFor="home-offer-search">{task.label}</label>
            <input
              id="home-offer-search"
              name="query"
              type="search"
              value={offerQuery}
              onChange={(event) => {
                setOfferQuery(event.target.value);
                setFormError("");
              }}
              placeholder="Ej.: puesto, localidad o código"
            />
          </div>
        )}
        {(task.mode === "training" || task.mode === "occupation") &&
          searchData.status === "loading" && (
            <p className="home-search__status" role="status" aria-live="polite">
              Cargando el catálogo oficial…
            </p>
          )}
        {(task.mode === "training" || task.mode === "occupation") &&
          searchData.status === "unavailable" && (
            <p className="home-search__status" role="alert">
              El buscador no está disponible ahora mismo.{" "}
              <Link
                to={task.mode === "training" ? "/desde-fp" : "/desde-ocupacion"}
              >
                Abrir buscador completo
              </Link>
            </p>
          )}
        <button className="inline-task-form__submit" type="submit">
          {task.action} <span aria-hidden="true">→</span>
        </button>
        <p className="form-message" role="status" aria-live="polite">
          {formError}
        </p>
        {task.mode === "training" && featuredExample !== null && (
          <p className="example-line">
            <span>Ejemplo:</span>{" "}
            <Link to={trainingDetailPath(featuredExample.programKey)}>
              {featuredExample.programTitle}
            </Link>
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="home-page" aria-labelledby="home-heading">
      <section className="home-hero" aria-labelledby="home-heading">
        <div className="home-page__meta">
          <span className="home-page__eyebrow">Orientación profesional</span>
          <span
            className="home-page__freshness"
            role="region"
            aria-label={
              freshness.status === "ready"
                ? freshness.ariaLabel
                : "Fecha de relaciones revisadas"
            }
            aria-busy={freshness.status === "loading"}
          >
            {freshness.status === "loading" && "Comprobando fecha…"}
            {freshness.status === "ready" && (
              <>
                {freshness.sourceLabel} ·{" "}
                {freshness.dateKind === "source"
                  ? "fuente actualizada el"
                  : "snapshot consultado el"}{" "}
                <time dateTime={freshness.dateTime}>{freshness.date}</time>
              </>
            )}
            {freshness.status === "unavailable" && "Fecha no disponible"}
          </span>
        </div>

        <div className="home-flow">
          <div className="home-intro">
            <h1 id="home-heading">
              Explora formación, profesiones y oportunidades en Castilla y León.
            </h1>
            <p className="lede">
              Conecta lo que sabes hacer con estudios, ocupaciones y ofertas
              publicadas para decidir tu siguiente paso.
            </p>
          </div>

          <div
            className="task-list"
            aria-label="Elige tu punto de partida"
            role="group"
          >
            <p className="section-label">¿Qué quieres hacer?</p>
            {TASKS.map((task) => {
              const active = searchMode === task.mode;
              return (
                <div
                  className={"task-option" + (active ? " is-active" : "")}
                  key={task.mode}
                >
                  <button
                    className={"task-row" + (active ? " is-active" : "")}
                    type="button"
                    aria-expanded={active}
                    aria-controls={"home-task-panel-" + task.mode}
                    onClick={() => chooseSearchMode(task.mode)}
                  >
                    <span className="task-number">{task.number}</span>
                    <span className="task-copy">
                      <strong>{task.title}</strong>
                      <small>{task.description}</small>
                    </span>
                    <span className="task-arrow" aria-hidden="true">
                      {active ? "↓" : "→"}
                    </span>
                  </button>
                  <div id={"home-task-panel-" + task.mode} hidden={!active}>
                    {renderTaskForm(task)}
                  </div>
                </div>
              );
            })}
          </div>

          <Link className="text-link home-offers-link" to={globalOffersPath()}>
            Ver todas las ofertas de la copia actual{" "}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="proof-rail" aria-label="Cobertura del producto">
          <div className="proof-item">
            <strong>
              {catalogCounts === null
                ? "…"
                : catalogCounts.programs.toLocaleString("es-ES")}
            </strong>
            <span>ciclos en la copia actual</span>
          </div>
          <div className="proof-item">
            <strong>
              {catalogCounts === null
                ? "…"
                : catalogCounts.offers.toLocaleString("es-ES")}
            </strong>
            <span>ofertas en la copia actual</span>
          </div>
        </div>

        <div className="method-line">
          <span>
            Relaciones construidas a partir de fuentes públicas y revisadas
            antes de publicarse.
            {freshness.status === "ready" && freshness.stale
              ? " Mostramos la última copia disponible."
              : ""}
          </span>
          <Link className="text-link" to="/metodologia">
            Cómo funciona <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
