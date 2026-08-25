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
}: {
  courses?: EcylCourse[];
  certificates?: ProfessionalCertificate[];
} = {}) {
  const manifest = resourceManifest();
  const assets = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [`${SNAPSHOT_PREFIX}/ecyl-courses.json`, courses],
    [`${SNAPSHOT_PREFIX}/professional-certificates.json`, certificates],
    [`${SNAPSHOT_PREFIX}/public-employment-calls.json`, []],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
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

  it("shows an explicit value for every missing course metadata field", async () => {
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
      const matchingRow = [...card.querySelectorAll("div")].find(
        (candidate) => candidate.querySelector("dt")?.textContent === label,
      );
      if (matchingRow === undefined) {
        throw new Error(`Expected metadata row for ${label}.`);
      }
      expect(matchingRow).toHaveTextContent("No publicado en la ficha");
    }
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
