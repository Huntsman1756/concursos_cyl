import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FormEvent,
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import type {
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
  loadOfferEvidence,
} from "../../data/generatedDataClient";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  globalOffersPath,
  occupationDetailPath,
  trainingDetailPath,
} from "../../app/routePaths";
import { loadApprovedMappings } from "../../domain/occupation";
import { longDate } from "../../domain/displayFormat";
import { buildApprovedExample } from "../../domain/approvedExample";
import { formatProgramTitle } from "../../domain/trainingPresentation";
import { EditorialImage } from "../../components/EditorialImage";
import { Icon } from "../../components/Icon";
import { InfoButton } from "../../components/InfoButton";
import { PageEyebrow } from "../../components/PageEyebrow";
import { OccupationCombobox } from "../occupation-first/OccupationCombobox";
import { TrainingCombobox } from "../training-first/TrainingCombobox";

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

type ExampleOfferState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; title: string; meta: string; reviewedOffers: number };

const TASK_TABS: Array<{
  mode: HomeSearchMode;
  id: string;
  tab: string;
  label: string;
  hint: string;
  action: string;
}> = [
  {
    mode: "training",
    id: "fp",
    tab: "Tengo una FP",
    label: "Busca tu ciclo",
    hint: "Por nombre, familia profesional o código del ciclo.",
    action: "Ver mis salidas",
  },
  {
    mode: "occupation",
    id: "occupation",
    tab: "Busco una profesión",
    label: "Busca una profesión",
    hint: "Por nombre de ocupación (CNO-11).",
    action: "Buscar profesión",
  },
  {
    mode: "offer",
    id: "offer",
    tab: "Estoy mirando una oferta",
    label: "Pega el título de la oferta",
    hint: "Copia el puesto tal y como aparece en la oferta.",
    action: "Analizar la oferta",
  },
];

function formatDate(value: string): string {
  return longDate(value);
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
  const [proof, setProof] = useState<{
    programs: number | null;
    centers: number | null;
    reviewedOffers: number | null;
    generatedAt: string | null;
    programsDate: string | null;
    centersDate: string | null;
    reviewedOffersDate: string | null;
  }>({
    programs: null,
    centers: null,
    reviewedOffers: null,
    generatedAt: null,
    programsDate: null,
    centersDate: null,
    reviewedOffersDate: null,
  });
  const [searchData, setSearchData] = useState<SearchDataState>({
    status: "loading",
  });
  const [example, setExample] = useState<Awaited<
    ReturnType<typeof buildApprovedExample>
  > | null>(null);
  const [exampleOffer, setExampleOffer] = useState<ExampleOfferState>({
    status: "loading",
  });
  const manifestRef = useRef<Awaited<ReturnType<typeof loadManifest>> | null>(
    null,
  );
  const [manifestReady, setManifestReady] = useState(false);

  useRouteReady(searchData.status !== "loading");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };

    const manifestPromise =
      manifestRef.current === null
        ? loadManifest(options).then((manifest) => {
            if (!signal.aborted) {
              manifestRef.current = manifest;
              setManifestReady(true);
            }
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

        const foundation = await loadFoundationResourceSubset(
          manifest,
          ["programs", "centers", "trainingOfferings"],
          options,
        );
        if (signal.aborted) return null;

        setProof((current) => ({
          ...current,
          programs: foundation.programs.length,
          centers: foundation.centers.length,
          programsDate: manifest.resourceSnapshots.programs.snapshotFetchedAt,
          centersDate: manifest.resourceSnapshots.centers.snapshotFetchedAt,
          generatedAt: manifest.generatedAt,
        }));

        const relationships = await loadAuditedRelationships(manifest, options);
        if (signal.aborted) return null;
        const approved = loadApprovedMappings(relationships);

        setExample(
          buildApprovedExample({
            programs: foundation.programs,
            links: relationships.links,
            occupations: approved.occupations,
            offerings: foundation.trainingOfferings,
            centers: foundation.centers,
          }),
        );

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

  // The reviewed-offer proof stat (and the example offer) come from the
  // offer-evidence sidecar. It is the heaviest resource of the app, so the
  // value fills in after first paint instead of blocking the hero.
  useEffect(() => {
    if (!manifestReady || manifestRef.current === null) return;
    const controller = new AbortController();
    const { signal } = controller;
    const idle = window.setTimeout(() => {
      void loadOfferEvidence(manifestRef.current!, { signal })
        .then((evidence) => {
          if (signal.aborted) return;
          setProof((current) => ({
            ...current,
            reviewedOffers: evidence.counts.offersWithReviewedFpRelationship,
            reviewedOffersDate: evidence.generatedAt,
          }));
          const exampleOfferRecord =
            evidence.records.find(
              (record) =>
                (record.relations ?? []).some(
                  (relation) => relation.programKey === "ADG02S",
                ) && record.offerId === "1285665634571",
            ) ??
            evidence.records.find((record) =>
              (record.relations ?? []).some(
                (relation) => relation.programKey === "ADG02S",
              ),
            );
          setExampleOffer(
            exampleOfferRecord === undefined
              ? { status: "unavailable" }
              : {
                  status: "ready",
                  title: exampleOfferRecord.title,
                  meta: `${exampleOfferRecord.province} · ${exampleOfferRecord.sourceName} · publicada el ${formatDate(
                    exampleOfferRecord.publishedAt,
                  )}`,
                  reviewedOffers:
                    evidence.counts.offersWithReviewedFpRelationship,
                },
          );
        })
        .catch(() => {
          if (!signal.aborted) setExampleOffer({ status: "unavailable" });
        });
    }, 0);

    return () => {
      window.clearTimeout(idle);
      controller.abort();
    };
  }, [manifestReady]);

  const exampleProvincesLabel = useMemo(() => {
    if (example === null) return "";
    return example.topProvinces
      .map((entry) => `${entry.province} ${entry.centers}`)
      .join(" · ");
  }, [example]);

  function chooseSearchMode(mode: HomeSearchMode): void {
    setSearchMode(mode);
    setConfirmedProgram(null);
    setConfirmedOccupation(null);
    setOfferQuery("");
    setFormError("");
  }

  function onTaskTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ): void {
    const currentIndex = TASK_TABS.findIndex((tab) => tab.mode === searchMode);
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % TASK_TABS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + TASK_TABS.length) % TASK_TABS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = TASK_TABS.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    chooseSearchMode(TASK_TABS[nextIndex]!.mode);
    window.requestAnimationFrame(() => {
      document.getElementById(`home-tab-${TASK_TABS[nextIndex]!.id}`)?.focus();
    });
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

  function renderTaskPanel(task: (typeof TASK_TABS)[number]): JSX.Element {
    return (
      <div
        key={task.id}
        className="hero-search"
        id={`home-panel-${task.id}`}
        role="tabpanel"
        aria-labelledby={`home-tab-${task.id}`}
        aria-hidden={searchMode !== task.mode}
      >
        <form
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
              hint={task.hint}
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
              hint={task.hint}
            />
          )}
          {task.mode === "offer" && (
            <>
              <label className="field-label" htmlFor="home-offer-search">
                {task.label}
              </label>
              <div className="search-row">
                <input
                  className="search-input"
                  id="home-offer-search"
                  name="query"
                  type="search"
                  value={offerQuery}
                  onChange={(event) => {
                    setOfferQuery(event.target.value);
                    setFormError("");
                  }}
                  placeholder="Ej.: Empleado administrativo de contabilidad"
                />
                <button className="button button--primary" type="submit">
                  {task.action}
                </button>
              </div>
            </>
          )}
          {(task.mode === "training" || task.mode === "occupation") &&
            searchData.status === "loading" && (
              <p className="search-hint" role="status" aria-live="polite">
                Cargando el catálogo oficial…
              </p>
            )}
          {(task.mode === "training" || task.mode === "occupation") &&
            searchData.status === "unavailable" && (
              <p className="search-hint" role="alert">
                El buscador no está disponible ahora mismo.{" "}
                <Link
                  to={
                    task.mode === "training" ? "/desde-fp" : "/desde-ocupacion"
                  }
                >
                  Abrir buscador completo
                </Link>
              </p>
            )}
          {task.mode !== "offer" && searchData.status === "ready" && (
            <div className="search-row" style={{ marginTop: "var(--space-3)" }}>
              <button className="button button--primary" type="submit">
                {task.action}
              </button>
            </div>
          )}
          <p className="search-hint" role="status" aria-live="polite">
            {formError}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div>
            <PageEyebrow>
              Orientación profesional con datos públicos
            </PageEyebrow>
            <h1 className="display" id="hero-title">
              Tu FP, tus salidas profesionales y dónde dar el siguiente paso.
            </h1>
            <p className="lede">
              Descubre qué profesiones están relacionadas con tu ciclo, qué
              ofertas hay en Castilla y León y dónde puedes estudiar cada
              formación.
            </p>
            <p className="trust-line">Datos oficiales, revisados y con fecha</p>

            <div className="task-selector">
              <ul
                className="task-selector-list"
                role="tablist"
                aria-label="Elige tu punto de partida"
              >
                {TASK_TABS.map((task) => {
                  const active = searchMode === task.mode;
                  return (
                    <li role="presentation" key={task.mode}>
                      <button
                        className="task-tab"
                        id={`home-tab-${task.id}`}
                        role="tab"
                        aria-selected={active}
                        aria-controls={`home-panel-${task.id}`}
                        tabIndex={active ? 0 : -1}
                        type="button"
                        onClick={() => chooseSearchMode(task.mode)}
                        onKeyDown={onTaskTabKeyDown}
                      >
                        {task.tab}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="task-panels">
                {TASK_TABS.map((task) => renderTaskPanel(task))}
              </div>
            </div>
          </div>

          <div className="hero-stage">
            <EditorialImage
              asset="hero-career-guidance"
              variants={[640, 960, 1280, 1536]}
              alt="Joven explorando opciones de formación profesional en un taller técnico."
              width={1536}
              height={1024}
              sizes="(min-width: 1080px) 45vw, calc(100vw - 2 * var(--grid-gutter))"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="paths-title">
        <div className="container">
          <div className="section-head">
            <h2 className="h2" id="paths-title">
              Empieza desde donde estás
            </h2>
          </div>
          <div className="paths-grid">
            <article className="path">
              <div className="path-media">
                <EditorialImage
                  asset="path-training"
                  variants={[640, 960]}
                  alt="Estudiante de FP consultando su plan de formación en una tableta dentro de un taller."
                  width={640}
                  height={480}
                  sizes="(min-width: 768px) 33vw, calc(100vw - 2 * var(--grid-gutter))"
                />
              </div>
              <div className="path-body">
                <p className="path-number">01</p>
                <h3 className="h3">Tengo una FP</h3>
                <p className="path-description">
                  Descubre profesiones, ofertas y centros relacionados con tu
                  ciclo.
                </p>
                <div className="path-actions">
                  <Link className="link-action" to="/desde-fp">
                    Ver salidas de mi FP →
                  </Link>
                </div>
              </div>
            </article>
            <article className="path">
              <div className="path-media">
                <EditorialImage
                  asset="path-occupation"
                  variants={[640, 960]}
                  alt="Dos estudiantes conversando con un formador sobre su futura profesión en un taller de mecanizado."
                  width={640}
                  height={480}
                  sizes="(min-width: 768px) 33vw, calc(100vw - 2 * var(--grid-gutter))"
                />
              </div>
              <div className="path-body">
                <p className="path-number">02</p>
                <h3 className="h3">Quiero dedicarme a una profesión</h3>
                <p className="path-description">
                  Comprueba qué ciclos tienen una relación revisada con esa
                  ocupación.
                </p>
                <div className="path-actions">
                  <Link className="link-action" to="/desde-ocupacion">
                    Buscar una profesión →
                  </Link>
                </div>
              </div>
            </article>
            <article className="path">
              <div className="path-media">
                <EditorialImage
                  asset="path-offer"
                  variants={[640, 960]}
                  alt="Persona anotando los requisitos de una oferta de empleo junto a su portátil."
                  width={640}
                  height={480}
                  sizes="(min-width: 768px) 33vw, calc(100vw - 2 * var(--grid-gutter))"
                />
              </div>
              <div className="path-body">
                <p className="path-number">03</p>
                <h3 className="h3">He visto una oferta</h3>
                <p className="path-description">
                  Entiende sus requisitos y comprueba si aparece relacionada con
                  una FP.
                </p>
                <div className="path-actions">
                  <Link className="link-action" to={globalOffersPath()}>
                    Analizar una oferta →
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="proof-title">
        <div className="container">
          <h2 className="sr-only" id="proof-title">
            Datos y actualización
          </h2>
          <div
            className="proof-rail"
            role="region"
            aria-label="Datos y actualización de la copia activa"
          >
            <div className="proof-stat">
              <p className="proof-stat-value">
                {proof.programs === null
                  ? "…"
                  : proof.programs.toLocaleString("es-ES")}
              </p>
              <p className="proof-stat-label">ciclos oficiales</p>
              <p className="proof-stat-date">
                {proof.programsDate === null ? "comprobando fecha…" : null}
                {proof.programsDate !== null && (
                  <>
                    fuente consultada el{" "}
                    <time dateTime={proof.programsDate}>
                      {formatDate(proof.programsDate)}
                    </time>
                  </>
                )}
              </p>
            </div>
            <div className="proof-stat">
              <p className="proof-stat-value">
                {proof.reviewedOffers === null
                  ? "…"
                  : proof.reviewedOffers.toLocaleString("es-ES")}
              </p>
              <p className="proof-stat-label">
                ofertas con relación FP revisada
              </p>
              <p className="proof-stat-date">
                {proof.reviewedOffersDate === null
                  ? "comprobando fecha…"
                  : null}
                {proof.reviewedOffersDate !== null && (
                  <>
                    evidencia generada el{" "}
                    <time dateTime={proof.reviewedOffersDate}>
                      {formatDate(proof.reviewedOffersDate)}
                    </time>
                  </>
                )}
              </p>
            </div>
            <div className="proof-stat">
              <p className="proof-stat-value">
                {proof.centers === null
                  ? "…"
                  : proof.centers.toLocaleString("es-ES")}
              </p>
              <p className="proof-stat-label">centros</p>
              <p className="proof-stat-date">
                {proof.centersDate === null ? "comprobando fecha…" : null}
                {proof.centersDate !== null && (
                  <>
                    fuente consultada el{" "}
                    <time dateTime={proof.centersDate}>
                      {formatDate(proof.centersDate)}
                    </time>
                  </>
                )}
              </p>
            </div>
            <div className="proof-note">
              <p className="small" style={{ margin: 0 }}>
                Cada cifra indica la fecha de su propia fuente.
                <InfoButton label="Qué es una relación revisada">
                  Una relación revisada enlaza un ciclo con una ocupación y se
                  ha verificado contra su fuente oficial (TodoFP, BOE) con fecha
                  de revisión publicada.
                </InfoButton>
              </p>
            </div>
          </div>
          {freshness.status !== "unavailable" && (
            <p
              className="caption"
              style={{ marginTop: "var(--space-5)" }}
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
                    : "copia consultada el"}{" "}
                  <time dateTime={freshness.dateTime}>{freshness.date}</time>
                  {freshness.stale && " Mostramos la última copia disponible."}
                </>
              )}
            </p>
          )}
          {proof.generatedAt !== null && (
            <p className="caption" style={{ marginTop: "var(--space-2)" }}>
              Copia activa generada el {formatDate(proof.generatedAt)}.
            </p>
          )}
        </div>
      </section>

      {example !== null && (
        <section className="section" aria-labelledby="example-title">
          <div className="container">
            <div className="section-head">
              <h2 className="h2" id="example-title">
                Comprueba cómo funciona
              </h2>
              <p className="lede">
                Un caso real del catálogo, de principio a fin.
              </p>
            </div>
            <ol className="example-flow">
              <li className="example-step">
                <span className="example-step-icon" aria-hidden="true">
                  <Icon name="graduation-cap" size={20} />
                </span>
                <div>
                  <p className="example-step-kind">Formación profesional</p>
                  <h3 className="h3">
                    {formatProgramTitle(example.programTitle)}
                  </h3>
                  <p className="meta">
                    {example.levelLabel} · Familia {example.familyName}
                  </p>
                </div>
              </li>
              <li className="example-step">
                <span className="example-step-icon" aria-hidden="true">
                  <Icon name="briefcase" size={20} />
                </span>
                <div>
                  <p className="example-step-kind">Profesiones relacionadas</p>
                  <h3 className="h3">{example.occupations[0]?.label}</h3>
                  <p className="meta">
                    {example.occupations.length > 1
                      ? `+ ${example.occupations.length - 1} profesiones más · `
                      : ""}
                    Relación oficial revisada{" "}
                    {example.occupations[0]?.reviewedAt} ·{" "}
                    {example.occupations[0]?.sourceLabel}
                  </p>
                </div>
              </li>
              {exampleOffer.status === "ready" && (
                <li className="example-step">
                  <span className="example-step-icon" aria-hidden="true">
                    <Icon name="map-pin" size={20} />
                  </span>
                  <div>
                    <p className="example-step-kind">
                      Oferta de la copia consultada
                    </p>
                    <h3 className="h3">{exampleOffer.title}</h3>
                    <p className="meta">{exampleOffer.meta}</p>
                  </div>
                </li>
              )}
              <li className="example-step">
                <span className="example-step-icon" aria-hidden="true">
                  <Icon name="school" size={20} />
                </span>
                <div>
                  <p className="example-step-kind">Dónde estudiarla</p>
                  <h3 className="h3">
                    {example.centersCount} centros publican este ciclo
                  </h3>
                  <p className="meta">
                    En {example.provincesCount} provincias
                    {exampleProvincesLabel !== "" &&
                      ` · ${exampleProvincesLabel}`}
                  </p>
                </div>
              </li>
            </ol>
            <div className="example-cta">
              <Link
                className="button button--secondary"
                to={trainingDetailPath(example.programKey)}
              >
                Ver el ejemplo completo
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section section--alt" aria-labelledby="centers-title">
        <div className="container teaser">
          <div className="teaser-media">
            <EditorialImage
              asset="centers-vocational-training"
              variants={[640, 960, 1280]}
              alt="Estudiantes de un ciclo de FP montando un prototipo electrónico en un aula-taller."
              width={1280}
              height={720}
              sizes="(min-width: 1080px) 42vw, calc(100vw - 2 * var(--grid-gutter))"
            />
          </div>
          <div>
            <h2 className="h2" id="centers-title">
              ¿Buscas dónde estudiar?
            </h2>
            <p className="lede">
              Consulta los centros que publican cada ciclo y filtra por
              provincia, modalidad y tipo de centro.
            </p>
            <div className="method-actions">
              <Link className="button button--primary" to="/donde-estudiar">
                Buscar dónde estudiar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="method-title">
        <div className="container">
          <div className="section-head" style={{ maxWidth: "44rem" }}>
            <h2 className="h2" id="method-title">
              Cada dato, con su origen y su fecha.
            </h2>
            <p className="lede">
              SALIDA combina fuentes públicas de formación y empleo y solo
              publica relaciones que han superado sus criterios de revisión.
            </p>
          </div>
          <div className="method-actions" style={{ marginTop: 0 }}>
            <Link className="button button--secondary" to="/metodologia">
              Ver metodología
            </Link>
            <Link className="link-action" to="/datos-abiertos">
              Explorar los datos abiertos →
            </Link>
          </div>
          <div className="method-disclosure">
            <p className="caption">
              Las imágenes editoriales son generadas mediante IA y no
              representan personas, empresas, ofertas ni centros reales.
            </p>
            {freshness.status === "ready" && (
              <p className="caption" style={{ marginTop: "var(--space-2)" }}>
                Fuentes: Junta de Castilla y León (ECYL), SEPE, TodoFP y BOE ·{" "}
                {freshness.sourceLabel}: copia del {freshness.date}.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
