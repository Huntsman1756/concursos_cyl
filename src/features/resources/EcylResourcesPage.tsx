import { useEffect, useMemo, useState } from "react";

import type {
  EcylCourse,
  ProfessionalCertificate,
} from "../../../data/schemas/ecylResources";
import {
  loadEcylCourses,
  loadManifest,
  loadProfessionalCertificates,
} from "../../data/generatedDataClient";
import "./ecylResources.css";

type State =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      courses: EcylCourse[];
      certificates: ProfessionalCertificate[];
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

export function EcylResourcesPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");

  useEffect(() => {
    let active = true;
    void loadManifest()
      .then(async (manifest) => {
        const [courses, certificates] = await Promise.all([
          loadEcylCourses(manifest),
          loadProfessionalCertificates(manifest),
        ]);
        if (active) setState({ status: "ready", courses, certificates });
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
  const visibleCourses =
    state.status === "ready"
      ? state.courses
          .filter((course) =>
            normalized(
              [course.title, course.locality, course.subject].join(" "),
            ).includes(term),
          )
          .slice(0, 40)
      : [];
  const visibleCertificates =
    state.status === "ready"
      ? state.certificates
          .filter(
            (certificate) =>
              (family === "" || certificate.familyCode === family) &&
              normalized(
                `${certificate.code} ${certificate.title} ${certificate.familyCode}`,
              ).includes(term),
          )
          .slice(0, 60)
      : [];

  return (
    <section className="resources-page" aria-labelledby="resources-heading">
      <header className="resources-page__intro">
        <p className="resources-page__eyebrow">Recursos de Castilla y León</p>
        <h1 id="resources-heading">Formación para seguir avanzando</h1>
        <p>
          Consulta cursos publicados por el ECYL y certificados de
          profesionalidad. Son opciones complementarias: no equivalen
          automáticamente a un ciclo de FP ni garantizan acceso a un empleo.
        </p>
      </header>

      <div className="resources-filters">
        <label>
          <span>Buscar por nombre, localidad o código</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej.: administración, León o ADG"
          />
        </label>
        <label>
          <span>Familia de certificados</span>
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
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
        <div className="resources-columns">
          <section aria-labelledby="courses-heading">
            <div className="resources-section-heading">
              <h2 id="courses-heading">Cursos del ECYL</h2>
              <span>{visibleCourses.length} mostrados</span>
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
                      course.durationHours ? `${course.durationHours} h` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") ||
                      "Consulta los detalles en la ficha oficial"}
                  </p>
                  {course.startDate ? (
                    <p>Inicio: {displayDate(course.startDate)}</p>
                  ) : null}
                  <a href={course.officialUrl} target="_blank" rel="noreferrer">
                    Ver ficha oficial
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="certificates-heading">
            <div className="resources-section-heading">
              <h2 id="certificates-heading">Certificados de profesionalidad</h2>
              <span>{visibleCertificates.length} mostrados</span>
            </div>
            <p className="resources-section-help">
              La familia y el nivel proceden del catálogo oficial. No atribuimos
              equivalencias con títulos de FP.
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
                    {certificate.fullyOnline ? " · Teleformación completa" : ""}
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
          </section>
        </div>
      ) : null}
    </section>
  );
}
