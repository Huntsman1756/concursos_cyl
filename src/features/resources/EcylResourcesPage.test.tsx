import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  EcylCourse,
  ProfessionalCertificate,
} from "../../../data/schemas/ecylResources";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import { EcylResourcesPage } from "./EcylResourcesPage";

const SNAPSHOT_PREFIX = "/data/v1/snapshots/build-1";

const snapshot = {
  sourceId: "jcyl-ecyl-training",
  sourceUrl: "https://analisis.datosabiertos.jcyl.es/records",
  sourceUpdatedAt: null,
  snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
  schemaVersion: "1.0.0",
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "passed",
} as const;

function resourceManifest() {
  const base = currentManifestFixture();
  return {
    ...base,
    resourceSnapshots: {
      programs: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/programs.json`,
      },
      centers: { ...snapshot, resourcePath: `${SNAPSHOT_PREFIX}/centers.json` },
      trainingOfferings: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/training-offerings.json`,
      },
      jobOffers: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/job-offers.json`,
      },
      ecylCourses: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/ecyl-courses.json`,
      },
      professionalCertificates: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/professional-certificates.json`,
      },
      publicEmploymentCalls: {
        ...snapshot,
        resourcePath: `${SNAPSHOT_PREFIX}/public-employment-calls.json`,
      },
    },
  };
}

function course(overrides: Partial<EcylCourse> = {}): EcylCourse {
  return {
    id: "course-001",
    title: "Curso de prueba",
    modality: "Presencial",
    locality: "León",
    applicationDeadline: "2026-09-30",
    startDate: "2026-10-01",
    endDate: "2026-12-01",
    durationHours: 100,
    subject: "Administración",
    audience: ["Desempleado"],
    requirements: "Ninguno",
    registration: "Inscripción online",
    venue: "Centro ECYL",
    places: 20,
    officialUrl: "https://empleo.jcyl.es/cursos/course-001",
    ...overrides,
  };
}

function certificate(): ProfessionalCertificate {
  return {
    code: "ADGD0108",
    title: "GESTIÓN CONTABLE Y GESTIÓN ADMINISTRATIVA",
    familyCode: "ADG",
    level: 3,
    totalHours: 630,
    classroomHours: 550,
    onlineHours: 550,
    practiceHours: 80,
    fullyOnline: true,
    structureUrl: "https://sede.sepe.gob.es/estructura/ADGD0108",
    programUrl: "https://sede.sepe.gob.es/programa/ADGD0108.pdf",
  };
}

function publicCall(overrides: Record<string, unknown> = {}) {
  return {
    id: "call-001",
    title: "Convocatoria de prueba",
    organization: "Junta de Castilla y León",
    places: 10,
    municipality: "Valladolid",
    applicationStart: "2026-07-28",
    applicationDeadline: "2026-08-24",
    requirements: null,
    deadlineCopy: null,
    accessType: "open",
    applicationUrl: null,
    officialUrl: "https://empleo.jcyl.es/convocatoria",
    sourceUpdatedAt: null,
    ...overrides,
  };
}

function requestPath(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.pathname;
  return new URL(input.url).pathname;
}

function responseFor(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function renderResources({
  courses = [course()],
  certificates = [certificate()],
  publicCalls = [] as Array<Record<string, unknown>>,
  holdManifest = false,
}: {
  courses?: EcylCourse[];
  certificates?: ProfessionalCertificate[];
  publicCalls?: Array<Record<string, unknown>>;
  holdManifest?: boolean;
} = {}) {
  const manifest = resourceManifest();
  const assets = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [`${SNAPSHOT_PREFIX}/ecyl-courses.json`, courses],
    [`${SNAPSHOT_PREFIX}/professional-certificates.json`, certificates],
    [`${SNAPSHOT_PREFIX}/public-employment-calls.json`, publicCalls],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      if (holdManifest) {
        return new Promise<Response>(() => undefined);
      }
      const value = assets.get(requestPath(input));
      return Promise.resolve(
        value === undefined
          ? new Response(null, { status: 404 })
          : responseFor(value),
      );
    }),
  );

  return render(
    <MemoryRouter>
      <EcylResourcesPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EcylResourcesPage", () => {
  it("never renders a public-calls count while data is still loading", () => {
    renderResources({ holdManifest: true });

    expect(screen.getByRole("status")).toHaveTextContent("Cargando recursos…");
    expect(
      screen.queryByRole("heading", {
        name: /Empleo público abierto al /u,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/convocatorias?$/u)).not.toBeInTheDocument();
    expect(screen.queryByText("0 convocatorias")).not.toBeInTheDocument();
  });

  it("shows an honest zero only after the runtime derivation returns zero", async () => {
    renderResources({
      publicCalls: [publicCall({ applicationDeadline: "2026-08-03" })],
    });

    await screen.findByRole("heading", {
      name: /Empleo público abierto al /u,
    });
    expect(screen.getByText("0 convocatorias")).toBeVisible();
    expect(
      screen.getByText(
        "Ninguna convocatoria de esta copia tiene el plazo de solicitud abierto a la fecha de la copia. Los plazos publicados ya habían cerrado o todavía no empezaban; comprueba la fuente oficial por si se han publicado procesos nuevos.",
      ),
    ).toBeVisible();
  });

  it("uses the copy reference date for the contractual open-call total", async () => {
    renderResources({
      publicCalls: [
        publicCall({ id: "call-001" }),
        publicCall({ id: "call-002" }),
        publicCall({ id: "call-003" }),
        publicCall({ id: "call-004" }),
      ],
    });

    await screen.findByRole("heading", {
      name: /Empleo público abierto al /u,
    });
    expect(screen.getByText("4 convocatorias")).toBeVisible();
  });

  it("renders open calls with their deadline and source provenance", async () => {
    renderResources({
      publicCalls: [
        {
          id: "1285666453332",
          title: "ATS/DUE (2023/24/25)",
          organization: "Sanidad",
          places: 363,
          municipality: "Valladolid",
          applicationStart: "2026-07-28",
          applicationDeadline: "2026-12-31",
          requirements: null,
          deadlineCopy: null,
          accessType: "open",
          applicationUrl: null,
          officialUrl: "https://empleo.jcyl.es/convocatoria-1",
          sourceUpdatedAt: null,
        },
      ],
    });

    await screen.findByRole("heading", { name: "Ats/due (2023/24/25)" });
    expect(screen.getByText("1 convocatoria")).toBeVisible();
    expect(screen.getByText(/Plazo hasta el/u)).toBeVisible();
  });

  it("presents the certificate family as an official code and readable label", async () => {
    renderResources();

    const familyFilter = await screen.findByRole("combobox", {
      name: "Familia profesional",
    });

    expect(
      within(familyFilter).getByRole("option", {
        name: "ADG · Administración y Gestión",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Familia profesional: ADG · Administración y Gestión"),
    ).toBeVisible();
  });

  it("finds a course when the search term is its stable ECYL identifier", async () => {
    const user = userEvent.setup();
    renderResources({
      courses: [
        course({ id: "course-001", title: "Curso que no coincide" }),
        course({ id: "course-002", title: "Curso identificado por ID" }),
      ],
    });

    const search = await screen.findByRole("searchbox", {
      name: "Buscar por nombre, localidad o código",
    });
    expect(search).toHaveAttribute("placeholder", "Nombre o código");
    await user.type(search, "course-002");

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Curso identificado por ID",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        level: 3,
        name: "Curso que no coincide",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 de 1 resultados")).toBeVisible();
  });

  it("keeps course identity and primary published fields visible while details stay collapsed", async () => {
    renderResources();

    const heading = await screen.findByRole("heading", {
      level: 3,
      name: "Curso de prueba",
    });
    const card = heading.closest("article");
    if (card === null) throw new Error("Expected the course card.");

    expect(screen.getByText("Identificador ECYL: course-001")).toBeVisible();
    expect(within(card).getByText("León · Presencial")).toBeVisible();
    expect(within(card).getByText("Administración · 100 h")).toBeVisible();
    const summary = within(card).getByText("Ver todos los datos publicados");
    const details = summary.closest("details");
    if (details === null) throw new Error("Expected a metadata disclosure.");
    expect(details).not.toHaveAttribute("open");
  });

  it("shows an explicit value for every missing course metadata field", async () => {
    const user = userEvent.setup();
    renderResources({
      courses: [
        course({
          id: "course-incomplete",
          title: "Curso con información incompleta",
          modality: null,
          locality: null,
          applicationDeadline: null,
          startDate: null,
          endDate: null,
          durationHours: null,
          subject: null,
          audience: [],
          requirements: null,
          registration: null,
          venue: null,
          places: null,
        }),
      ],
    });

    const heading = await screen.findByRole("heading", {
      level: 3,
      name: "Curso con información incompleta",
    });
    const card = heading.closest("article");
    if (card === null) throw new Error("Expected the course card.");

    const summary = within(card).getByText("Ver todos los datos publicados");
    const details = summary.closest("details");
    if (details === null) throw new Error("Expected a metadata disclosure.");
    expect(details).not.toHaveAttribute("open");
    expect(within(card).getByText(/Datos no publicados:/u)).toHaveTextContent(
      "Datos no publicados: fecha de inicio, plazo de inscripción, fecha de fin, requisitos.",
    );

    for (const label of [
      "Modalidad",
      "Localidad",
      "Plazo de inscripción",
      "Inicio",
      "Fin",
      "Duración",
      "Materia",
      "Destinatarios",
      "Requisitos",
      "Inscripción",
      "Lugar",
      "Plazas",
    ]) {
      const matchingRow = [...details.querySelectorAll("div")].find(
        (candidate) => candidate.querySelector("dt")?.textContent === label,
      );
      if (matchingRow === undefined) {
        throw new Error(`Expected metadata row for ${label}.`);
      }
      expect(matchingRow).toHaveTextContent("No publicado en la ficha");
    }

    await user.click(summary);
    expect(details).toHaveAttribute("open");
    expect(
      within(details).getAllByText("No publicado en la ficha"),
    ).toHaveLength(12);
  });

  it("keeps duplicate course titles distinguishable with their stable identifiers and links", async () => {
    renderResources({
      courses: [
        course({
          id: "course-101",
          title: "Misma convocatoria",
          officialUrl: "https://empleo.jcyl.es/cursos/course-101",
        }),
        course({
          id: "course-102",
          title: "Misma convocatoria",
          officialUrl: "https://empleo.jcyl.es/cursos/course-102",
        }),
      ],
    });

    await screen.findAllByRole("heading", {
      level: 3,
      name: "Misma convocatoria",
    });

    expect(screen.getByText("Identificador ECYL: course-101")).toBeVisible();
    expect(screen.getByText("Identificador ECYL: course-102")).toBeVisible();
    expect(
      screen.getAllByRole("heading", {
        level: 3,
        name: "Misma convocatoria",
      }),
    ).toHaveLength(2);
    expect(
      screen
        .getAllByRole("link", { name: /Ver ficha oficial/u })
        .map((link) => link.getAttribute("href")),
    ).toEqual([
      "https://empleo.jcyl.es/cursos/course-101",
      "https://empleo.jcyl.es/cursos/course-102",
    ]);
  });

  it("explains how to recover from a search with no matching resources", async () => {
    const user = userEvent.setup();
    renderResources();

    const search = await screen.findByRole("searchbox", {
      name: "Buscar por nombre, localidad o código",
    });
    await user.type(search, "no existe");

    expect(
      screen.getByText(
        "No hay cursos que coincidan con tu búsqueda. Prueba con otro término, localidad o identificador.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "No hay certificados que coincidan con tu búsqueda o familia. Prueba con otros filtros.",
      ),
    ).toBeVisible();
  });
});
