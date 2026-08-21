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
    };

const COURSE_PAGE_SIZE = 40;
const CERTIFICATE_PAGE_SIZE = 60;

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

export function EcylResourcesPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const [courseLimit, setCourseLimit] = useState(COURSE_PAGE_SIZE);
  const [certificateLimit, setCertificateLimit] = useState(
    CERTIFICATE_PAGE_SIZE,
  );

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const [courses, certificates, publicCalls] = await Promise.all([
          loadEcylCourses(manifest),
          loadProfessionalCertificates(manifest),
          loadPublicEmploymentCalls(manifest),
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
        if (active)
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
          });
      })
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
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
            [course.title, course.locality, course.subject].join(" "),
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
  const today = new Date().toISOString().slice(0, 10);
  const openPublicCalls =
    state.status === "ready"
      ? state.publicCalls.filter(
          (call) =>
            call.applicationDeadline !== null &&
            call.applicationDeadline >= today &&
            (call.applicationStart === null || call.applicationStart <= today),
        )
      : [];

  return (
    <section className="resources-page" aria-labelledby="resources-heading">
      <header className="resources-page__intro">
        <p className="resources-page__eyebrow">Recursos de Castilla y León</p>
        <h1 id="resources-heading">Formación para seguir avanzando</h1>
        <p>
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
            placeholder="Ej.: administración, León o ADG"
          />
        </label>
        <label>
          <span>Familia de certificados</span>
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
                {code}
              </option>
            ))}
          </select>
        </label>
      </div>

      {state.status === "loading" ? (
        <p role="status">Cargando recursos…</p>
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
              Procesos con plazo publicado todavía abierto. Comprueba siempre
              los requisitos completos antes de presentar la solicitud.
            </p>
            {openPublicCalls.length === 0 ? (
              <p>No hay convocatorias con plazo abierto en la copia actual.</p>
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
                    <a href={call.officialUrl} target="_blank" rel="noreferrer">
                      Ver convocatoria oficial
                    </a>
                  </article>
                ))}
              </div>
            )}
            <footer className="public-calls__source">
              {state.publicCallsSourceUrl !== null && (
                <a
                  href={state.publicCallsSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fuente: Convocatorias de Empleo Público JCyL
                </a>
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
                {visibleCourses.map((course) => (
                  <article className="resource-card" key={course.id}>
                    <h3>{readableOfficialTitle(course.title)}</h3>
                    <p>
                      {[
                        course.locality,
                        course.modality,
                        course.durationHours
                          ? `${course.durationHours} h`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                        "Consulta los detalles en la ficha oficial"}
                    </p>
                    {course.startDate ? (
                      <p>Inicio: {displayDate(course.startDate)}</p>
                    ) : null}
                    <a
                      href={course.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver ficha oficial
                    </a>
                  </article>
                ))}
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
                {visibleCertificates.map((certificate) => (
                  <article className="resource-card" key={certificate.code}>
                    <p className="resource-card__code">
                      {certificate.code} · Familia {certificate.familyCode}
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
                    <a
                      href={certificate.programUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Consultar programa oficial
                    </a>
                  </article>
                ))}
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
