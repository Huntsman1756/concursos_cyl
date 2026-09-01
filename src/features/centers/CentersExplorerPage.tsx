import { useEffect, useMemo, useState } from "react";
import type { FormEvent, JSX } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import type {
  EducationCenter,
  LegacyEducationCenter,
  LegacyTrainingOffering,
  TrainingOffering,
  TrainingProgram,
} from "../../../data/schemas/generated";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { ExternalLink } from "../../components/ExternalLink";
import { useRouteReady } from "../../app/RouteReadyContext";
import {
  loadFoundationResourceSubset,
  loadManifest,
  type LoadedFoundationResourceSubset,
} from "../../data/generatedDataClient";
import { globalCentersPath, trainingDetailPath } from "../../app/routePaths";
import { buildGoogleMapsSearchUrl } from "../../domain/mapsUrl";
import { trainingLevelLabel } from "../../domain/trainingPresentation";
import "./centers.css";

type Center = EducationCenter | LegacyEducationCenter;
type Offering = TrainingOffering | LegacyTrainingOffering;
type Foundation = LoadedFoundationResourceSubset<
  "programs" | "centers" | "trainingOfferings"
>;

type PageState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "unknown" }
  | {
      status: "ready";
      foundation: Foundation;
      generatedAt: string;
      program: TrainingProgram | null;
    };

interface CenterCatalogRow {
  key: string;
  center: Center;
  program: TrainingProgram;
  modalities: string[];
  teachingTypes: string[];
}

const modalityLabels: Record<Offering["modality"], string> = {
  on_site: "Presencial",
  distance: "A distancia",
  mixed: "Mixta",
  unknown: "Modalidad no publicada",
};

const teachingTypeLabels: Record<
  Extract<Offering, TrainingOffering>["teachingType"],
  string
> = {
  public: "Pública",
  concerted: "Concertada",
  private: "Privada",
};

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function centerSearchText(row: CenterCatalogRow): string {
  return normalized(
    [
      row.center.centerName,
      row.center.locality,
      row.center.province,
      row.center.address ?? "",
      row.program.programTitle,
      row.program.programKey,
      row.program.familyName,
      row.program.familyCode,
    ].join(" "),
  );
}

function centerOwnershipLabel(center: Center): string {
  if (!("centerOwnership" in center)) return "Centro de formación";
  switch (center.centerOwnership) {
    case "agriculture":
      return "Centro de formación agraria";
    case "municipality":
      return "Centro municipal";
    case "education":
      return "Centro educativo";
    case "private":
      return "Centro privado";
  }
}

function rowsForFoundation(
  foundation: Foundation,
  program: TrainingProgram | null,
): CenterCatalogRow[] {
  const centersByCode = new Map(
    foundation.centers.map((center) => [center.centerCode, center]),
  );
  const programsByKey = new Map(
    foundation.programs.map((candidate) => [candidate.programKey, candidate]),
  );
  const rows = new Map<string, CenterCatalogRow>();

  for (const offering of foundation.trainingOfferings as Offering[]) {
    if (program !== null && offering.programKey !== program.programKey) {
      continue;
    }
    const center = centersByCode.get(offering.centerCode);
    const rowProgram = programsByKey.get(offering.programKey);
    if (center === undefined || rowProgram === undefined) continue;

    const key = `${center.centerCode}:${rowProgram.programKey}`;
    const existing = rows.get(key);
    const modality = modalityLabels[offering.modality];
    const teachingType =
      "teachingType" in offering
        ? teachingTypeLabels[offering.teachingType]
        : null;

    if (existing === undefined) {
      rows.set(key, {
        key,
        center,
        program: rowProgram,
        modalities: [modality],
        teachingTypes: teachingType === null ? [] : [teachingType],
      });
      continue;
    }
    if (!existing.modalities.includes(modality)) {
      existing.modalities.push(modality);
    }
    if (
      teachingType !== null &&
      !existing.teachingTypes.includes(teachingType)
    ) {
      existing.teachingTypes.push(teachingType);
    }
  }

  return [...rows.values()].sort(
    (left, right) =>
      left.center.province.localeCompare(right.center.province, "es") ||
      left.center.locality.localeCompare(right.center.locality, "es") ||
      left.center.centerName.localeCompare(right.center.centerName, "es") ||
      left.program.programTitle.localeCompare(right.program.programTitle, "es"),
  );
}

function CenterRow({ row }: { row: CenterCatalogRow }): JSX.Element {
  const mapUrl = buildGoogleMapsSearchUrl([
    row.center.centerName,
    row.center.address ?? "",
    row.center.locality,
    row.center.province,
  ]);
  return (
    <tr>
      <th scope="row" data-label="Centro">
        <span className="center-catalog__name">{row.center.centerName}</span>
        <span className="center-catalog__ownership">
          {centerOwnershipLabel(row.center)}
        </span>
      </th>
      <td data-label="Localidad">
        {row.center.locality} · {row.center.province}
        {row.center.address !== null && row.center.address !== undefined && (
          <span className="center-catalog__address">{row.center.address}</span>
        )}
      </td>
      <td data-label="Ciclo">
        <Link to={trainingDetailPath(row.program.programKey)}>
          {row.program.programTitle}
        </Link>
        <span className="center-catalog__program-meta">
          {trainingLevelLabel(row.program.level)} · {row.program.programKey}
        </span>
      </td>
      <td data-label="Modalidad">
        <span className="center-catalog__mode">
          {row.modalities.join(" · ")}
        </span>
        {row.teachingTypes.length > 0 && (
          <span className="center-catalog__ownership">
            {row.teachingTypes.join(" · ")}
          </span>
        )}
      </td>
      <td data-label="Acciones" className="center-catalog__actions">
        {row.center.website !== null && row.center.website !== undefined && (
          <ExternalLink href={row.center.website}>Web del centro</ExternalLink>
        )}
        {mapUrl !== null && (
          <ExternalLink href={mapUrl}>Cómo llegar</ExternalLink>
        )}
      </td>
    </tr>
  );
}

export function CentersExplorerPage(): JSX.Element {
  const { programKey } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const queryParam = searchParams.get("query") ?? "";
  const provinceParam = searchParams.get("province") ?? "all";

  useRouteReady(state.status !== "loading");

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const foundation = await loadFoundationResourceSubset(
          manifest,
          ["programs", "centers", "trainingOfferings"],
          options,
        );
        const program =
          programKey === undefined
            ? null
            : (foundation.programs.find(
                (candidate) => candidate.programKey === programKey,
              ) ?? null);
        return { manifest, foundation, program };
      })
      .then(({ manifest, foundation, program }) => {
        if (controller.signal.aborted) return;
        if (programKey !== undefined && program === null) {
          setState({ status: "unknown" });
          return;
        }
        setState({
          status: "ready",
          foundation,
          generatedAt:
            manifest.resourceSnapshots.trainingOfferings.sourceUpdatedAt ??
            manifest.resourceSnapshots.trainingOfferings.snapshotFetchedAt,
          program,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [programKey]);

  const rows = useMemo(
    () =>
      state.status === "ready"
        ? rowsForFoundation(state.foundation, state.program)
        : [],
    [state],
  );
  const provinces = useMemo(
    () =>
      [...new Set(rows.map((row) => row.center.province))].sort((left, right) =>
        left.localeCompare(right, "es"),
      ),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const query = normalized(queryParam);
    return rows.filter(
      (row) =>
        (provinceParam === "all" || row.center.province === provinceParam) &&
        (query.length === 0 || centerSearchText(row).includes(query)),
    );
  }, [provinceParam, queryParam, rows]);
  const centerCount = new Set(filteredRows.map((row) => row.center.centerCode))
    .size;
  const hasFilters = queryParam.trim() !== "" || provinceParam !== "all";

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("query") ?? "").trim();
    const province = String(formData.get("province") ?? "all");
    const next = new URLSearchParams();
    if (query !== "") next.set("query", query);
    if (province !== "all") next.set("province", province);
    setSearchParams(next);
  }

  function clearFilters(): void {
    setSearchParams({});
  }

  if (state.status === "loading") {
    return (
      <p role="status" aria-live="polite">
        Cargando la oferta formativa…
      </p>
    );
  }
  if (state.status === "failed") {
    return (
      <section
        className="status-panel"
        role="alert"
        aria-labelledby="centers-error-heading"
      >
        <h1 id="centers-error-heading">No hemos podido cargar los centros</h1>
        <p>Vuelve a intentarlo dentro de unos minutos.</p>
        <Link to="/">Volver a explorar</Link>
      </section>
    );
  }
  if (state.status === "unknown") {
    return (
      <section
        className="status-panel"
        aria-labelledby="centers-not-found-heading"
      >
        <h1 id="centers-not-found-heading">Ciclo no encontrado</h1>
        <p>La dirección no corresponde a un ciclo oficial disponible.</p>
        <Link to="/">Volver a explorar</Link>
      </section>
    );
  }

  const contextualProgram = state.program;
  const contextual = contextualProgram !== null;
  const heading = contextual
    ? `Dónde estudiar ${contextualProgram.programTitle}`
    : "Dónde estudiar";

  return (
    <section
      className="catalog-page centers-catalog"
      aria-labelledby="centers-heading"
    >
      <Breadcrumbs
        items={
          contextual
            ? [
                { label: "Inicio", to: "/" },
                {
                  label: contextualProgram.programTitle,
                  to: trainingDetailPath(contextualProgram.programKey),
                },
                { label: "Dónde estudiar" },
              ]
            : [
                { label: "Inicio", to: "/" },
                { label: "Dónde estudiar", to: globalCentersPath() },
              ]
        }
      />
      <header className="catalog-page__header">
        <div className="catalog-page__meta">
          <span className="catalog-page__eyebrow">
            {contextual
              ? "Formación relacionada"
              : "Formación en Castilla y León"}
          </span>
          <span className="catalog-page__freshness">
            Oferta formativa · snapshot del {formatDate(state.generatedAt)}
          </span>
        </div>
        <h1 id="centers-heading">{heading}</h1>
        <p>
          {contextual
            ? "Estos son los centros que publican este ciclo en la copia actual. Comprueba la oferta y las fechas en la fuente oficial."
            : "Busca ciclos y centros de formación publicados en Castilla y León. La oferta puede cambiar según la convocatoria."}
        </p>
      </header>

      <form
        className="catalog-search"
        onSubmit={submitSearch}
        aria-label="Buscar dónde estudiar"
      >
        <label htmlFor="centers-query">
          {contextual
            ? "Centro o localidad"
            : "Ciclo, familia, centro o localidad"}
          <input
            id="centers-query"
            key={queryParam}
            name="query"
            type="search"
            defaultValue={queryParam}
            placeholder={
              contextual ? "Ej.: nombre del centro" : "Ej.: ciclo o centro"
            }
          />
        </label>
        <label htmlFor="centers-province">
          Provincia
          <select
            id="centers-province"
            name="province"
            value={provinceParam}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value === "all") next.delete("province");
              else next.set("province", event.target.value);
              setSearchParams(next);
            }}
          >
            <option value="all">Todas las provincias</option>
            {provinces.map((province) => (
              <option value={province} key={province}>
                {province}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          Buscar
        </button>
        {hasFilters && (
          <button
            className="catalog-search__clear"
            type="button"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        )}
      </form>

      <section
        className="catalog-results"
        aria-labelledby="centers-results-heading"
      >
        <div className="catalog-results__toolbar">
          <div>
            <h2 id="centers-results-heading">
              {contextual
                ? `${centerCount} ${centerCount === 1 ? "centro publicado" : "centros publicados"}`
                : `${filteredRows.length} opciones formativas`}
            </h2>
            {!contextual && <span>{centerCount} centros representados</span>}
          </div>
        </div>
        {filteredRows.length === 0 ? (
          <div className="status-panel" role="status">
            <h2>No hay coincidencias</h2>
            <p>
              Prueba con otra búsqueda o quita algún filtro. La ausencia en esta
              copia no demuestra que no exista oferta.
            </p>
            {hasFilters && (
              <button
                className="secondary-button"
                type="button"
                onClick={clearFilters}
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="center-catalog__table-wrap">
            <table className="center-catalog__table">
              <caption className="sr-only">
                Centros y ciclos de formación disponibles
              </caption>
              <thead>
                <tr>
                  <th scope="col">Centro</th>
                  <th scope="col">Localidad</th>
                  <th scope="col">Ciclo</th>
                  <th scope="col">Modalidad</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <CenterRow key={row.key} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="catalog-page__note">
        Mostramos solo centros y modalidades publicados en la copia indicada.
        Verifica fechas, admisión y condiciones en la web del centro.
      </p>
    </section>
  );
}
