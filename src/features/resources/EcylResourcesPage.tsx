import { useEffect, useMemo, useState } from "react";

import type {
  EcylCourse,
  ProfessionalCertificate,
} from "../../../data/schemas/ecylResources";
import type { PublicEmploymentCall } from "../../../data/schemas/publicEmployment";
import {
  loadEcylCourses,
  loadManifest,
  loadProfessionalCertificates,
  loadPublicEmploymentCalls,
} from "../../data/generatedDataClient";
import { ExternalLink } from "../../components/ExternalLink";
import { PageEyebrow } from "../../components/PageEyebrow";
import { useRouteReady } from "../../app/RouteReadyContext";
import { selectOpenPublicCalls } from "./openPublicCalls";
import "./ecylResources.css";

type State =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      courses: EcylCourse[];
      certificates: ProfessionalCertificate[];
      publicCalls: PublicEmploymentCall[];
      publicCallsSourceUrl: string | null;
      publicCallsUpdatedAt: string | null;
      publicCallsReferenceDate: string;
    };

const COURSE_PAGE_SIZE = 40;
const CERTIFICATE_PAGE_SIZE = 60;
const MISSING_COURSE_METADATA = "No publicado en la ficha";

const PROFESSIONAL_FAMILY_LABELS: Readonly<Record<string, string>> = {
  ADG: "Administración y Gestión",
  AFD: "Actividades Físicas y Deportivas",
  AGA: "Agraria",
  ARG: "Artes Gráficas",
  ART: "Artes y Artesanías",
  COM: "Comercio y Marketing",
  ELE: "Electricidad y Electrónica",
  ENA: "Energía y Agua",
  EOC: "Edificación y Obra Civil",
  FME: "Fabricación Mecánica",
  HOT: "Hostelería y Turismo",
  IEX: "Industrias Extractivas",
  IFC: "Informática y Comunicaciones",
  IMA: "Instalación y Mantenimiento",
  IMP: "Imagen Personal",
  IMS: "Imagen y Sonido",
  INA: "Industrias Alimentarias",
  MAM: "Madera, Mueble y Corcho",
  MAP: "Marítimo-Pesquera",
  QUI: "Química",
  SAN: "Sanidad",
  SEA: "Seguridad y Medio Ambiente",
  SSC: "Servicios Socioculturales y a la Comunidad",
  TCP: "Textil, Confección y Piel",
  TMV: "Transporte y Mantenimiento de Vehículos",
  VIC: "Vidrio y Cerámica",
};

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES");
}

function displayDate(value: string | null): string | null {
  if (value === null) return null;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function readableOfficialTitle(value: string): string {
  if (value !== value.toLocaleUpperCase("es-ES")) return value;
  const lower = value.toLocaleLowerCase("es-ES");
  return lower.replace(/\p{Letter}/u, (letter) =>
    letter.toLocaleUpperCase("es-ES"),
  );
}

function readableFamilyCode(code: string): string {
  const label = PROFESSIONAL_FAMILY_LABELS[code];
  return label === undefined ? code : `${code} · ${label}`;
}

function displayCourseText(value: string | null): string {
  return value ?? MISSING_COURSE_METADATA;
}

function displayCourseDate(value: string | null): string {
  return displayDate(value) ?? MISSING_COURSE_METADATA;
}

function displayCourseDuration(value: number | null): string {
  return value === null ? MISSING_COURSE_METADATA : `${value} h`;
}

function displayCourseAudience(audience: readonly string[]): string {
  return audience.length > 0 ? audience.join(", ") : MISSING_COURSE_METADATA;
}

function missingCourseSummary(course: EcylCourse): string | null {
  const missing = [
    course.startDate === null ? "fecha de inicio" : null,
    course.applicationDeadline === null ? "plazo de inscripción" : null,
    course.endDate === null ? "fecha de fin" : null,
    course.requirements === null ? "requisitos" : null,
  ].filter((label): label is string => label !== null);
  return missing.length === 0
    ? null
    : `Datos no publicados: ${missing.join(", ")}.`;
}

export function EcylResourcesPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  useRouteReady(state.status === "ready");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [courseLimit, setCourseLimit] = useState(COURSE_PAGE_SIZE);
  const [certificateLimit, setCertificateLimit] = useState(
    CERTIFICATE_PAGE_SIZE,
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const options = { signal };
    void loadManifest(options)
      .then(async (manifest) => {
        const [courses, certificates, publicCalls] = await Promise.all([
          loadEcylCourses(manifest, options),
          loadProfessionalCertificates(manifest, options),
          loadPublicEmploymentCalls(manifest, options),
        ]);
        const publicCallsSnapshot = (
          manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
            Partial<
              Record<
                "publicEmploymentCalls",
                {
                  sourceUrl: string;
                  sourceUpdatedAt: string | null;
                  snapshotFetchedAt: string;
                }
              >
            >
        ).publicEmploymentCalls;
        if (publicCallsSnapshot === undefined) {
          throw new Error("Public employment calls snapshot is missing.");
        }
        if (!signal.aborted)
          setState({
            status: "ready",
            courses,
            certificates,
            publicCalls,
            publicCallsSourceUrl: publicCallsSnapshot?.sourceUrl ?? null,
            publicCallsUpdatedAt:
              publicCallsSnapshot?.sourceUpdatedAt ??
              publicCallsSnapshot?.snapshotFetchedAt ??
              null,
            // This is a historical copy. "Open" must be evaluated at the
            // copy's reference date, not against the browser's wall clock.
            publicCallsReferenceDate:
              publicCallsSnapshot.snapshotFetchedAt.slice(0, 10),
          });
      })
      .catch(() => {
        if (signal.aborted) return;
        setState({ status: "error" });
      });
    return () => {
      controller.abort();
    };
  }, []);

  const families = useMemo(
    () =>
      state.status === "ready"
        ? [...new Set(state.certificates.map((item) => item.familyCode))].sort()
        : [],
    [state],
  );
  const term = normalized(query.trim());
  const matchingCourses =
    state.status === "ready"
      ? state.courses.filter((course) =>
          normalized(
            [course.id, course.title, course.locality, course.subject].join(
              " ",
            ),
          ).includes(term),
        )
      : [];
  const visibleCourses = matchingCourses.slice(0, courseLimit);
  const matchingCertificates =
    state.status === "ready"
      ? state.certificates.filter(
          (certificate) =>
            (family === "" || certificate.familyCode === family) &&
            normalized(
              `${certificate.code} ${certificate.title} ${certificate.familyCode}`,
            ).includes(term),
        )
      : [];
  const visibleCertificates = matchingCertificates.slice(0, certificateLimit);
  const openPublicCalls =
    state.status === "ready"
      ? selectOpenPublicCalls(state.publicCalls, state.publicCallsReferenceDate)
      : [];

  return (
    <section className="resources-page" aria-labelledby="resources-heading">
      <header className="page-masthead resources-page__intro">
        <PageEyebrow>Recursos de Castilla y León</PageEyebrow>
        <h1 className="h1" id="resources-heading">
          Formación para seguir avanzando
        </h1>
        <p className="page-lede">
          Consulta formación complementaria y convocatorias públicas abiertas.
          Cada opción conserva su alcance y su fuente oficial.
        </p>
      </header>

      <div className="resources-filters">
        <label>
          <span>Buscar por nombre, localidad o código</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCourseLimit(COURSE_PAGE_SIZE);
              setCertificateLimit(CERTIFICATE_PAGE_SIZE);
            }}
            placeholder="Nombre o código"
          />
        </label>
        <label>
          <span>Familia profesional</span>
          <select
            value={family}
            onChange={(event) => {
              setFamily(event.target.value);
              setCertificateLimit(CERTIFICATE_PAGE_SIZE);
            }}
          >
            <option value="">Todas las familias</option>
            {families.map((code) => (
              <option key={code} value={code}>
                {readableFamilyCode(code)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.status === "loading" ? (
        <p role="status" aria-live="polite">
          Cargando recursos…
        </p>
      ) : null}
      {state.status === "error" ? (
        <p role="alert">No se han podido cargar estos recursos.</p>
      ) : null}
      {state.status === "ready" ? (
        <>
          <section
            className="public-calls"
            aria-labelledby="public-calls-heading"
          >
            <div className="resources-section-heading">
              <h2 id="public-calls-heading">Empleo público abierto ahora</h2>
              <span>
                {openPublicCalls.length}{" "}
                {openPublicCalls.length === 1
                  ? "convocatoria"
                  : "convocatorias"}
              </span>
            </div>
            <p className="resources-section-help">
              Procesos con plazo publicado abierto en esta copia. Comprueba
              siempre los requisitos completos antes de presentar la solicitud.
            </p>
            {openPublicCalls.length === 0 ? (
              <p className="resource-empty-state">
                Ninguna convocatoria de esta copia tiene hoy el plazo de
                solicitud abierto. Los plazos publicados en la copia ya han
                cerrado o todavía no empiezan; comprueba la fuente oficial por
                si se han publicado procesos nuevos.
              </p>
            ) : (
              <div className="public-call-list">
                {openPublicCalls.map((call) => (
                  <article className="public-call" key={call.id}>
                    <p className="resource-card__code">
                      {call.accessType === "open"
                        ? "Turno libre"
                        : call.accessType === "internal"
                          ? "Promoción interna"
                          : "Consulta el tipo de acceso"}
                    </p>
                    <h3>{readableOfficialTitle(call.title)}</h3>
                    <p>
                      {call.places === null
                        ? "Plazas no publicadas"
                        : `${call.places} ${call.places === 1 ? "plaza" : "plazas"}`}
                      {call.municipality ? ` · ${call.municipality}` : ""}
                    </p>
                    <p>
                      Plazo hasta el {displayDate(call.applicationDeadline)}
                    </p>
                    <ExternalLink href={call.officialUrl}>
                      Ver convocatoria oficial
                    </ExternalLink>
                  </article>
                ))}
              </div>
            )}
            <footer className="public-calls__source">
              {state.publicCallsSourceUrl !== null && (
                <ExternalLink href={state.publicCallsSourceUrl}>
                  Fuente: Convocatorias de Empleo Público JCyL
                </ExternalLink>
              )}
              {state.publicCallsUpdatedAt !== null && (
                <span>
                  Copia del{" "}
                  {new Intl.DateTimeFormat("es-ES", {
                    dateStyle: "medium",
                  }).format(new Date(state.publicCallsUpdatedAt))}
                </span>
              )}
            </footer>
          </section>

          <div className="resources-columns">
            <section aria-labelledby="courses-heading">
              <div className="resources-section-heading">
                <h2 id="courses-heading">Cursos del ECYL</h2>
                <span>
                  {visibleCourses.length} de {matchingCourses.length} resultados
                </span>
              </div>
              <p className="resources-section-help">
                Revisa destinatarios, fechas y requisitos en la ficha oficial
                antes de solicitar una plaza.
              </p>
              <div className="resource-list">
                {visibleCourses.length === 0 ? (
                  <p className="resource-empty-state">
                    {term === ""
                      ? "No hay cursos publicados en la copia actual."
                      : "No hay cursos que coincidan con tu búsqueda. Prueba con otro término, localidad o identificador."}
                  </p>
                ) : (
                  visibleCourses.map((course) => (
                    <article className="resource-card" key={course.id}>
                      <p className="resource-card__code">
                        Identificador ECYL: {course.id}
                      </p>
                      <h3>{readableOfficialTitle(course.title)}</h3>
                      <p className="resource-card__summary">
                        {displayCourseText(course.locality)} ·{" "}
                        {displayCourseText(course.modality)}
                      </p>
                      <p className="resource-card__summary">
                        {displayCourseText(course.subject)} ·{" "}
                        {displayCourseDuration(course.durationHours)}
                      </p>
                      {course.startDate !== null && (
                        <p className="resource-card__summary">
                          Inicio: {displayCourseDate(course.startDate)}
                        </p>
                      )}
                      {missingCourseSummary(course) !== null && (
                        <p className="resource-card__missing">
                          {missingCourseSummary(course)}
                        </p>
                      )}
                      <details className="resource-card__details">
                        <summary>Ver todos los datos publicados</summary>
                        <dl className="resource-card__metadata">
                          <div>
                            <dt>Modalidad</dt>
                            <dd>{displayCourseText(course.modality)}</dd>
                          </div>
                          <div>
                            <dt>Localidad</dt>
                            <dd>{displayCourseText(course.locality)}</dd>
                          </div>
                          <div>
                            <dt>Plazo de inscripción</dt>
                            <dd>
                              {displayCourseDate(course.applicationDeadline)}
                            </dd>
                          </div>
                          <div>
                            <dt>Inicio</dt>
                            <dd>{displayCourseDate(course.startDate)}</dd>
                          </div>
                          <div>
                            <dt>Fin</dt>
                            <dd>{displayCourseDate(course.endDate)}</dd>
                          </div>
                          <div>
                            <dt>Duración</dt>
                            <dd>
                              {displayCourseDuration(course.durationHours)}
                            </dd>
                          </div>
                          <div>
                            <dt>Materia</dt>
                            <dd>{displayCourseText(course.subject)}</dd>
                          </div>
                          <div>
                            <dt>Destinatarios</dt>
                            <dd>{displayCourseAudience(course.audience)}</dd>
                          </div>
                          <div>
                            <dt>Requisitos</dt>
                            <dd>{displayCourseText(course.requirements)}</dd>
                          </div>
                          <div>
                            <dt>Inscripción</dt>
                            <dd>{displayCourseText(course.registration)}</dd>
                          </div>
                          <div>
                            <dt>Lugar</dt>
                            <dd>{displayCourseText(course.venue)}</dd>
                          </div>
                          <div>
                            <dt>Plazas</dt>
                            <dd>
                              {course.places === null
                                ? MISSING_COURSE_METADATA
                                : `${course.places} ${course.places === 1 ? "plaza" : "plazas"}`}
                            </dd>
                          </div>
                        </dl>
                      </details>
                      <ExternalLink href={course.officialUrl}>
                        Ver ficha oficial
                      </ExternalLink>
                    </article>
                  ))
                )}
              </div>
              {visibleCourses.length < matchingCourses.length ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setCourseLimit((current) => current + COURSE_PAGE_SIZE)
                  }
                >
                  Mostrar más cursos
                </button>
              ) : null}
            </section>

            <section aria-labelledby="certificates-heading">
              <div className="resources-section-heading">
                <h2 id="certificates-heading">
                  Certificados de profesionalidad
                </h2>
                <span>
                  {visibleCertificates.length} de {matchingCertificates.length}{" "}
                  resultados
                </span>
              </div>
              <p className="resources-section-help">
                La familia y el nivel proceden del catálogo oficial. No
                atribuimos equivalencias con títulos de FP.
              </p>
              <div className="resource-list">
                {visibleCertificates.length === 0 ? (
                  <p className="resource-empty-state">
                    {term === "" && family === ""
                      ? "No hay certificados publicados en la copia actual."
                      : "No hay certificados que coincidan con tu búsqueda o familia. Prueba con otros filtros."}
                  </p>
                ) : (
                  visibleCertificates.map((certificate) => (
                    <article className="resource-card" key={certificate.code}>
                      <p className="resource-card__code">{certificate.code}</p>
                      <p className="resource-card__code">
                        Familia profesional:{" "}
                        {readableFamilyCode(certificate.familyCode)}
                      </p>
                      <h3>{readableOfficialTitle(certificate.title)}</h3>
                      <p>
                        Nivel {certificate.level}
                        {certificate.totalHours
                          ? ` · ${certificate.totalHours} h`
                          : ""}
                        {certificate.fullyOnline
                          ? " · Teleformación completa"
                          : ""}
                      </p>
                      <ExternalLink href={certificate.programUrl}>
                        Consultar programa oficial
                      </ExternalLink>
                    </article>
                  ))
                )}
              </div>
              {visibleCertificates.length < matchingCertificates.length ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setCertificateLimit(
                      (current) => current + CERTIFICATE_PAGE_SIZE,
                    )
                  }
                >
                  Mostrar más certificados
                </button>
              ) : null}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
