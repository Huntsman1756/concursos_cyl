import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import publicationReviews from "../../../analysis/fp_one_word_publication_reviews.json";
import occupationAliases from "../../../data/curated/occupation-aliases.json";
import occupations from "../../../data/curated/occupations.json";
import trainingOccupationLinks from "../../../data/curated/training-occupation-links.json";
import { currentManifestFixture } from "../../../tests/fixtures/generatedManifest";
import type {
  Occupation,
  TrainingOccupationLink,
} from "../../../data/schemas/curatedMappings";
import { AppRoutes } from "../../app/routes";
import {
  loadFoundationResources,
  loadManifest,
} from "../../data/generatedDataClient";
import { publishedRequirementId } from "../../domain/requirements";
import { resolveApprovedOccupations } from "./resolveApprovedOccupations";

const program = {
  programKey: "IFC03S",
  programTitle: "Desarrollo de Aplicaciones Web",
  level: "higher",
  familyCode: "IFC",
  familyName: "Informática y Comunicaciones",
} as const;

const distanceProgram = {
  ...program,
  programKey: "IFC03SD",
  programTitle: "Desarrollo de Aplicaciones Web (distancia)",
} as const;

function responseFor(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

interface ActiveManifestFixture {
  resourceSnapshots: Record<string, { resourcePath: string }>;
}

async function installActiveAliasPassFetch(
  options: {
    outcomeFailures?: number;
    outcomePending?: boolean;
    onOutcomeSignal?: (signal: AbortSignal | null | undefined) => void;
  } = {},
): Promise<void> {
  const manifest = JSON.parse(
    await readFile(
      resolve(process.cwd(), "public", "data", "v1", "manifest.json"),
      "utf8",
    ),
  ) as ActiveManifestFixture;
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    ...(await Promise.all(
      Object.values(manifest.resourceSnapshots).map(
        async ({ resourcePath }) =>
          [
            resourcePath,
            JSON.parse(
              await readFile(
                resolve(
                  process.cwd(),
                  "public",
                  ...resourcePath.slice(1).split("/"),
                ),
                "utf8",
              ),
            ),
          ] as const,
      ),
    )),
  ]);
  let outcomeFailuresRemaining = options.outcomeFailures ?? 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      if (payload === undefined) {
        throw new Error(`Missing active generated-data fixture for ${path}.`);
      }
      if (path.endsWith("/outcome-indicators.json")) {
        options.onOutcomeSignal?.(init?.signal);
        if (options.outcomePending === true) {
          return new Promise<Response>(() => undefined);
        }
        if (outcomeFailuresRemaining > 0) {
          outcomeFailuresRemaining -= 1;
          return Promise.resolve(new Response(null, { status: 500 }));
        }
      }
      return Promise.resolve(responseFor(payload));
    }),
  );
}

function installResultsFetch(
  options: {
    links?: TrainingOccupationLink[];
    offers?: unknown[];
    requirements?: unknown[];
    professionalProfiles?: unknown[];
    stale?: boolean;
  } = {},
): void {
  const baseManifest = currentManifestFixture();
  const baseSnapshot = baseManifest.resourceSnapshots.jobOffers;
  const extraSnapshots = {
    occupations: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/occupations.json",
    },
    occupationAliases: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/occupation-aliases.json",
    },
    trainingOccupationLinks: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/training-occupation-links.json",
    },
    publishedRequirements: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/published-requirements.json",
    },
    professionalProfiles: {
      ...baseSnapshot,
      resourcePath: "/data/v1/snapshots/build-1/professional-profiles.json",
    },
  } as const;
  const manifest = {
    ...baseManifest,
    qualityStatus: options.stale
      ? ("stale" as const)
      : baseManifest.qualityStatus,
    resourceSnapshots: {
      ...baseManifest.resourceSnapshots,
      ...extraSnapshots,
    },
  };
  const fixtureProgramKeys = new Set<string>([
    program.programKey,
    distanceProgram.programKey,
  ]);
  const fixtureLinks = (options.links ?? trainingOccupationLinks).filter(
    (link) => fixtureProgramKeys.has(link.trainingProgramKey),
  );
  const fixtureOccupationIds = new Set(
    fixtureLinks.map((link) => link.occupationId),
  );
  const fixtureOccupations = occupations.filter((occupation) =>
    fixtureOccupationIds.has(occupation.occupationId),
  );
  const fixtureAliases = occupationAliases.filter((alias) =>
    fixtureOccupationIds.has(alias.occupationId),
  );
  const resources = new Map<string, unknown>([
    ["/data/v1/manifest.json", manifest],
    [
      manifest.resourceSnapshots.programs.resourcePath,
      [program, distanceProgram],
    ],
    [manifest.resourceSnapshots.centers.resourcePath, []],
    [manifest.resourceSnapshots.trainingOfferings.resourcePath, []],
    [manifest.resourceSnapshots.jobOffers.resourcePath, options.offers ?? []],
    [extraSnapshots.occupations.resourcePath, fixtureOccupations],
    [extraSnapshots.occupationAliases.resourcePath, fixtureAliases],
    [extraSnapshots.trainingOccupationLinks.resourcePath, fixtureLinks],
    [
      extraSnapshots.publishedRequirements.resourcePath,
      options.requirements ?? [],
    ],
    [
      extraSnapshots.professionalProfiles.resourcePath,
      options.professionalProfiles ?? [
        {
          profileId: `professional-profile:${"b".repeat(64)}`,
          ...program,
          officialTitle: "Técnico Superior en Desarrollo de Aplicaciones Web",
          outputLabel: "Programador web.",
          sourceSystem: "TodoFP",
          sourceUrl:
            "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
          sourceQuote: "Programador web.",
        },
      ],
    ],
  ]);
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const path = typeof input === "string" ? input : input.toString();
      const payload = resources.get(path);
      if (payload === undefined) {
        throw new Error(`Missing generated-data test fixture for ${path}.`);
      }
      return Promise.resolve(responseFor(payload));
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TrainingResultsPage", () => {
  const expectedPublishedOfferIds: Record<"HOT01M" | "EOC01M", string[]> = {
    HOT01M: (["cocinero", "cocineros"] as const).flatMap((form) => {
      const decision = publicationReviews.publicationDecision[form];
      if (decision === undefined || decision.status !== "rejected") {
        throw new Error(`Expected ${form} to be rejected.`);
      }
      return [];
    }),
    EOC01M: (() => {
      const decision = publicationReviews.publicationDecision.encofradores;
      if (decision === undefined || decision.status !== "accepted") {
        throw new Error("Expected encofradores to be accepted.");
      }
      return ["1285667539377", "1285668256621", "1285671523023"];
    })(),
  };

  it("labels the load-error status section with its heading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveAttribute(
      "aria-labelledby",
      "training-results-load-error-heading",
    );
    expect(
      within(alert).getByRole("heading", {
        name: "No hemos podido cargar los resultados",
      }),
    ).toHaveAttribute("id", "training-results-load-error-heading");
  });

  it("labels the unknown-program status section with its heading", async () => {
    installResultsFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/UNKNOWN"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const section = await screen.findByText("Ciclo no encontrado");
    expect(section.closest("section")).toHaveAttribute(
      "aria-labelledby",
      "training-results-not-found-heading",
    );
    expect(section).toHaveAttribute("id", "training-results-not-found-heading");
    expect(
      await screen.findByRole("status", { name: "Contenido listo" }),
    ).toBeVisible();
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it.each(["HOT01M", "EOC01M"])(
    "keeps the current bounded publication result for %s",
    async (programKey) => {
      await installActiveAliasPassFetch();
      const manifest = await loadManifest();
      const foundation = await loadFoundationResources(manifest);
      const expectedOfferIds =
        expectedPublishedOfferIds[
          programKey as keyof typeof expectedPublishedOfferIds
        ];
      const missingOfferIds = expectedOfferIds.filter(
        (offerId) => !foundation.jobOffers.some(({ id }) => id === offerId),
      );
      expect(missingOfferIds).toEqual([]);
      const expectedOffers = foundation.jobOffers.filter(({ id }) =>
        expectedOfferIds.includes(id),
      );
      render(
        <MemoryRouter initialEntries={[`/desde-fp/${programKey}`]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      if (expectedOffers.length === 0) {
        expect(
          await screen.findByText(
            /No hay ofertas relacionadas en la copia de datos del/u,
          ),
        ).toBeVisible();
        expect(screen.queryAllByRole("article")).toHaveLength(0);
      } else {
        const articles = await screen.findAllByRole("article");
        expect(articles).toHaveLength(expectedOffers.length);
        expect(
          articles
            .map((article) => article.getAttribute("aria-labelledby"))
            .sort(),
        ).toEqual(expectedOfferIds.map((id) => `offer-${id}`).sort());
      }
    },
  );

  it("clarifies contribution-base scope and offers section navigation", async () => {
    await installActiveAliasPassFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const pageHeading = await screen.findByRole("heading", {
      name: /Desarrollo de Aplicaciones Web/i,
    });
    expect(pageHeading).toHaveAttribute("id", "training-results-heading");
    expect(pageHeading.closest("section")).toHaveAttribute(
      "aria-labelledby",
      "training-results-heading",
    );
    expect(
      screen.getByRole("heading", {
        name: "Base de cotización observada de titulados",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("No es salario personal ni una predicción."),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Base de cotización anualizada · empleo por cuenta ajena a jornada completa.",
      ),
    ).toBeVisible();
    await userEvent.setup().click(
      screen.getByRole("button", {
        name: "Cargar datos de ingresos observados",
      }),
    );
    await screen.findByText("España · grupo del ciclo");
    expect(screen.getByText("España · grupo del ciclo")).toBeVisible();
    expect(screen.getByText("Castilla y León · Grado superior")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Contexto provincial" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Contexto provincial — no específico de esta ocupación. Reúne contratos registrados de todas las ocupaciones.",
      ),
    ).toBeVisible();
    const outcome = screen.getByRole("region", {
      name: "Base de cotización observada de titulados",
    });
    const sectionNavigation = screen.getByRole("navigation", {
      name: "Secciones del resultado",
    });
    expect(
      within(sectionNavigation).getByRole("link", {
        name: "Base de cotización",
      }),
    ).toHaveAttribute("href", "#base-cotizacion-observada");
    expect(
      within(sectionNavigation).getByRole("link", { name: "Dónde estudiar" }),
    ).toHaveAttribute("href", "#donde-estudiar");
    expect(
      within(sectionNavigation).getByRole("link", {
        name: "Contexto provincial",
      }),
    ).toHaveAttribute("href", "#contexto-provincial");
    expect(
      within(sectionNavigation).getByRole("link", {
        name: "Distribución de centros",
      }),
    ).toHaveAttribute("href", "#distribucion-centros");
    expect(
      within(sectionNavigation).getByRole("link", {
        name: "Salidas profesionales",
      }),
    ).toHaveAttribute("href", "#salidas-profesionales");
    expect(
      within(sectionNavigation).getByRole("link", {
        name: "Ocupaciones revisadas",
      }),
    ).toHaveAttribute("href", "#ocupaciones-revisadas");
    const nextActions = screen.getByRole("navigation", {
      name: "Siguientes pasos",
    });
    expect(
      within(nextActions).getByRole("link", { name: "Comparar ingresos" }),
    ).toHaveAttribute("href", "/comparar");
    expect(
      within(nextActions).getByRole("link", {
        name: "Ver ocupaciones revisadas",
      }),
    ).toHaveAttribute("href", "#ocupaciones-revisadas");
    expect(
      within(nextActions).getByRole("link", {
        name: "Ver centros y modalidades",
      }),
    ).toHaveAttribute("href", "/formacion/IFC03S");
    expect(nextActions.querySelectorAll(".primary-button")).toHaveLength(1);
    const occupationsSection = document.getElementById("ocupaciones-revisadas");
    expect(occupationsSection).toBeVisible();
    expect(occupationsSection).toHaveAttribute("tabindex", "-1");
    fireEvent.click(
      within(nextActions).getByRole("link", {
        name: "Ver ocupaciones revisadas",
      }),
    );
    expect(occupationsSection).toHaveFocus();
    expect(
      within(outcome).getByRole("link", { name: /Fuente: EDUCAbase/u }),
    ).toHaveAttribute(
      "href",
      "https://estadisticas.educacion.gob.es/EducaJaxiPx/",
    );
  });

  it("does not load observed income until its accessible action is activated", async () => {
    await installActiveAliasPassFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", {
      name: /Desarrollo de Aplicaciones Web/i,
    });
    const outcomePath = vi
      .mocked(fetch)
      .mock.calls.map(([input]) =>
        typeof input === "string" ? input : input.toString(),
      )
      .find((input) => input.endsWith("/outcome-indicators.json"));
    expect(outcomePath).toBeUndefined();
    const loadButton = screen.getByRole("button", {
      name: "Cargar datos de ingresos observados",
    });
    expect(loadButton).toBeVisible();
    expect(
      within(
        screen.getByRole("region", {
          name: "Base de cotización observada de titulados",
        }),
      ).getByRole("link", { name: /Fuente: EDUCAbase/u }),
    ).toBeVisible();

    const user = userEvent.setup();
    await user.click(loadButton);
    await screen.findByText("Fuente: EDUCAbase");
    expect(
      vi.mocked(fetch).mock.calls.filter(([input]) => {
        const path = typeof input === "string" ? input : input.toString();
        return path.endsWith("/outcome-indicators.json");
      }),
    ).toHaveLength(1);
  });

  it("keeps the outcome error state retryable after a failed explicit load", async () => {
    await installActiveAliasPassFetch({ outcomeFailures: 1 });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", {
      name: /Desarrollo de Aplicaciones Web/i,
    });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", {
        name: "Cargar datos de ingresos observados",
      }),
    );
    await screen.findByText(
      "No se han podido validar los datos de ingresos observados.",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Reintentar datos de ingresos observados",
      }),
    );
    await screen.findByText("Fuente: EDUCAbase");
    expect(
      vi.mocked(fetch).mock.calls.filter(([input]) => {
        const path = typeof input === "string" ? input : input.toString();
        return path.endsWith("/outcome-indicators.json");
      }),
    ).toHaveLength(2);
  });

  it("aborts a pending explicit outcome request on unmount", async () => {
    let outcomeSignal: AbortSignal | null | undefined;
    await installActiveAliasPassFetch({
      outcomePending: true,
      onOutcomeSignal: (signal) => {
        outcomeSignal = signal;
      },
    });
    const { unmount } = render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", {
      name: /Desarrollo de Aplicaciones Web/i,
    });
    await userEvent.setup().click(
      screen.getByRole("button", {
        name: "Cargar datos de ingresos observados",
      }),
    );
    await waitFor(() => expect(outcomeSignal).toBeDefined());
    unmount();
    expect(outcomeSignal).toHaveProperty("aborted", true);
  });

  it("does not activate an unpublished-requirement filter from arbitrary URL parameters", async () => {
    installResultsFetch();
    render(
      <MemoryRouter
        initialEntries={[
          "/desde-fp/IFC03S?publication=not-published&category=experience&value=12",
        ]}
      >
        <AppRoutes />
      </MemoryRouter>,
    );

    await screen.findByText(
      "No hay ofertas relacionadas en la copia de datos del 31 de julio de 2026.",
    );
    expect(screen.queryByText(/Filtro activo/)).not.toBeInTheDocument();
  });

  it("separates missing CNO coverage from official professional outputs", async () => {
    installResultsFetch({ links: [] });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        /Todavía no hay una relación revisada que permita buscar ofertas/u,
      ),
    ).toBeVisible();
    const nextActions = screen.getByRole("navigation", {
      name: "Siguientes pasos",
    });
    expect(
      within(nextActions).getByRole("link", {
        name: "Ver centros y modalidades",
      }),
    ).toHaveClass("primary-button");
    expect(
      within(nextActions).queryByRole("link", {
        name: "Ver ocupaciones revisadas",
      }),
    ).not.toBeInTheDocument();
    expect(nextActions.querySelectorAll(".primary-button")).toHaveLength(1);
  });

  it("shows literal TodoFP outputs with their official source", async () => {
    installResultsFetch({
      links: [],
      professionalProfiles: [
        {
          profileId: `professional-profile:${"a".repeat(64)}`,
          ...program,
          officialTitle: "Técnico Superior en Desarrollo de Aplicaciones Web",
          outputLabel: "Programador web.",
          sourceSystem: "TodoFP",
          sourceUrl:
            "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/daw.html",
          sourceQuote: "Programador web.",
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Programador web.")).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /Comprobar estas salidas en la ficha oficial de TodoFP/u,
      }),
    ).toHaveAttribute("href", expect.stringContaining("todofp.es"));
  });

  it("describes a truthful zero-match snapshot without claiming there are no jobs", async () => {
    installResultsFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "No hay ofertas relacionadas en la copia de datos del 31 de julio de 2026.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText("Grado superior · Código oficial IFC03S"),
    ).toBeVisible();
    expect(
      screen.getByLabelText(
        "Tu título de Formación Profesional conduce a ocupaciones con evidencia",
      ),
    ).toHaveTextContent("Tu título de FP→Ocupaciones con evidencia");
    expect(screen.queryByText(/no hay trabajo/iu)).not.toBeInTheDocument();
  });

  it("warns above results when the generated snapshot is stale", async () => {
    installResultsFetch({ stale: true });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const warning = await screen.findByText(
      /No se han podido actualizar los datos\./u,
    );
    expect(warning).toHaveTextContent(
      "No se han podido actualizar los datos. Mostramos la última copia disponible.",
    );
    const emptyState = screen.getByText(
      /No hay ofertas relacionadas en la copia de datos/,
    );
    expect(
      warning.compareDocumentPosition(emptyState) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the vertical evidence story and derives a reliable action from an answer", async () => {
    const offerId = "offer:synthetic-card";
    const sourceQuote = "Se requiere permiso de conducir B.";
    const requirement = {
      id: publishedRequirementId(
        offerId,
        "driving_license_or_vehicle",
        sourceQuote,
      ),
      category: "driving_license_or_vehicle",
      normalizedValue: "B",
      sourceQuote,
      parserRule: "license.driving_b",
      parserVersion: "1.0.0",
    } as const;
    const offer = {
      id: offerId,
      title: "Programador web para servicios públicos",
      province: "Valladolid",
      locality: "Valladolid",
      publishedAt: "2026-07-30T00:00:00.000Z",
      sourceName: "ECYL",
      descriptionText: sourceQuote,
      descriptionSections: {
        summary: [],
        functions: [],
        requirements: [sourceQuote],
        conditions: [],
        application: [],
        other: [],
      },
      originalUrl: "https://empleo.jcyl.es/oferta/synthetic-card",
      sourceSnapshot: {
        sourceId: "ofertas-de-empleo",
        sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
        sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
        snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
        schemaVersion: "1.0.0",
        recordCount: 1,
        sha256: "a".repeat(64),
        qualityStatus: "passed",
      },
    } as const;
    installResultsFetch({
      offers: [offer],
      requirements: [{ offerId, requirements: [requirement] }],
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const card = await screen.findByRole("article", {
      name: "Programador web para servicios públicos",
    });
    await user.click(within(card).getByText("Ver evidencia y requisitos"));
    const headings = Array.from(card.querySelectorAll(".evidence-step h3")).map(
      (heading) => heading.textContent,
    );
    expect(headings).toEqual([
      "Por qué aparece",
      "Qué publica la vacante",
      "Tu comprobación",
      "Siguiente acción",
    ]);
    const disclosures = screen.getAllByText("Ver cita exacta");
    const mappingDisclosure = disclosures[0].closest("details");
    const requirementDisclosure = disclosures[1].closest("details");
    expect(mappingDisclosure).not.toBeNull();
    expect(requirementDisclosure).not.toBeNull();
    expect(screen.getByText(sourceQuote)).toBeVisible();
    await user.click(disclosures[0]);
    expect(
      within(mappingDisclosure!).getByText(
        "Revisión de la relación: 4 de agosto de 2026",
      ),
    ).toBeVisible();
    expect(
      within(mappingDisclosure!).getByText("Versión de la relación: 1.0.0"),
    ).toBeVisible();
    await user.click(disclosures[1]);
    expect(screen.getByText(sourceQuote)).toBeVisible();
    expect(
      within(requirementDisclosure!).getByRole("link", {
        name: /Abrir fuente de la vacante/,
      }),
    ).toHaveAttribute("href", offer.sourceSnapshot.sourceUrl);
    expect(
      within(requirementDisclosure!).getByText(
        "Fecha de la fuente: 31 de julio de 2026",
      ),
    ).toBeVisible();
    expect(
      within(requirementDisclosure!).getByText(
        "Regla técnica de extracción: license.driving_b",
      ),
    ).toBeVisible();
    expect(
      within(requirementDisclosure!).getByText(
        "Versión de la extracción: 1.0.0",
      ),
    ).toBeVisible();

    await user.click(
      screen.getByRole("radio", {
        name: `No lo tengo: ${sourceQuote}`,
      }),
    );
    expect(
      await screen.findByRole("link", { name: /Consultar trámite oficial/ }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Requisito no cumplido")).toBeVisible();
    expect(
      screen.getByText("Requisito no cumplido").closest("div"),
    ).toHaveClass("evidence-state evidence-state--gap");
    expect(
      screen.queryByText(/compatibilidad|porcentaje|%/iu),
    ).not.toBeInTheDocument();
  });

  it("shows Dónde estudiar link even without approved relationship", async () => {
    installResultsFetch({ links: [] });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const estudioLink = await screen.findByRole("link", {
      name: "Ver centros y modalidades",
    });
    expect(estudioLink).toBeVisible();
    expect(estudioLink).toHaveAttribute("href", "/formacion/IFC03S");
    const studyHeading = await screen.findByRole("heading", {
      name: "Dónde estudiar",
    });
    expect(studyHeading).toBeVisible();
  });

  it("makes every decision summary metric traceable to its source", async () => {
    installResultsFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Qué sabemos de este título",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Del título a la evidencia disponible",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/no representa todo el mercado laboral/u),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Fuente: TodoFP/u }),
    ).toHaveAttribute("href", expect.stringContaining("todofp.es"));
    expect(
      screen.getByRole("link", { name: /Fuente: relación revisada/u }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: /Fuente: ofertas ECYL/u }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: /Fuente: oferta FP JCyL/u }),
    ).toHaveAttribute("target", "_blank");
  });

  it("shows approved occupation and zero match message when no offers exist", async () => {
    installResultsFetch();
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const estudioLink = await screen.findByRole("link", {
      name: "Ver centros y modalidades",
    });
    expect(estudioLink).toHaveAttribute("href", "/formacion/IFC03S");

    const ocupacion = await screen.findByText(
      "Analistas, programadores y diseñadores web y multimedia",
    );
    expect(ocupacion).toBeVisible();

    const enlaceCno = await screen.findByText("CNO-11 2713");
    expect(enlaceCno).toBeVisible();

    const perfilLink = ocupacion.closest("a");
    expect(perfilLink).not.toBeNull();
    expect(perfilLink).toBeVisible();
    expect(perfilLink).toHaveAttribute(
      "href",
      "/desde-ocupacion/occupation%3Acno11%3A2713",
    );

    expect(
      await screen.findByText(
        /No hay ofertas relacionadas en la copia de datos del/u,
      ),
    ).toBeVisible();
  });

  it("filters out draft links, duplicates and unresolvable occupations", () => {
    const draftLink = {
      trainingProgramKey: "IFC03S",
      occupationId: "occupation:cno11:2222",
      relationshipType: "reviewed_relationship",
      reviewStatus: "draft" as const,
      sourceUrl: "https://example.com/draft",
      sourceQuote:
        "Este es un enlace borrador que no debe publicarse en la interfaz.",
      reviewedAt: "2026-06-01",
      mappingVersion: "0.1.0",
      reviewNote: "Borrador pendiente de revisión por el equipo.",
    } as const;
    const fakeOccupationIdLink = {
      trainingProgramKey: "IFC03S",
      occupationId: "occupation:cno11:9999",
      relationshipType: "reviewed_relationship",
      reviewStatus: "approved" as const,
      sourceUrl: "https://example.com/fake",
      sourceQuote:
        "Enlace a una ocupación que no existe en el catálogo de pruebas.",
      reviewedAt: "2026-07-01",
      mappingVersion: "1.0.0",
      reviewNote: "La ocupación no está disponible en el catálogo oficial.",
    } as const;

    const approvedLink = trainingOccupationLinks.find(
      (link) =>
        link.trainingProgramKey === "IFC03S" &&
        link.reviewStatus === "approved",
    ) as TrainingOccupationLink | undefined;
    expect(approvedLink).toBeDefined();
    const boundedApprovedLink = {
      ...approvedLink!,
      functionalBoundary: {
        roleLevel: "assistant",
        fullOccupationQualification: false,
      },
    } as const satisfies TrainingOccupationLink;

    const result = resolveApprovedOccupations(
      "IFC03S",
      [
        draftLink,
        boundedApprovedLink,
        boundedApprovedLink,
        fakeOccupationIdLink,
      ],
      occupations as Occupation[],
    );

    expect(result).toEqual([
      {
        occupationId: "occupation:cno11:2713",
        preferredLabel:
          "Analistas, programadores y diseñadores web y multimedia",
        classificationCode: "2713",
        functionalBoundary: {
          roleLevel: "assistant",
          fullOccupationQualification: false,
        },
      },
    ]);
  });

  it("explains when an approved occupation link only covers an assistant role", async () => {
    const approvedLink = trainingOccupationLinks.find(
      (link) =>
        link.trainingProgramKey === "IFC03S" &&
        link.reviewStatus === "approved",
    ) as TrainingOccupationLink | undefined;
    expect(approvedLink).toBeDefined();
    installResultsFetch({
      links: [
        {
          ...approvedLink!,
          functionalBoundary: {
            roleLevel: "assistant",
            fullOccupationQualification: false,
          },
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    const occupationLink = await screen.findByRole("link", {
      name: /Analistas, programadores y diseñadores web y multimedia/u,
    });
    expect(occupationLink).toHaveTextContent("Alcance: puesto auxiliar");
    expect(occupationLink).toHaveTextContent(
      "El título no acredita por sí solo toda la ocupación CNO-11.",
    );
  });

  it("applies the intact unpublished-requirement action in memory and preserves province", async () => {
    const sourceQuote = "Se requiere experiencia mínima de un año.";
    const firstOfferId = "offer:with-experience";
    const sourceSnapshot = {
      sourceId: "ofertas-de-empleo",
      sourceUrl: "https://datosabiertos.jcyl.es/ofertas-de-empleo",
      sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
      snapshotFetchedAt: "2026-08-04T10:00:00.000Z",
      schemaVersion: "1.0.0",
      recordCount: 2,
      sha256: "a".repeat(64),
      qualityStatus: "passed",
    } as const;
    const descriptionSections = {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    };
    const offers = [
      {
        id: firstOfferId,
        title: "Programador web con experiencia",
        province: "León",
        locality: "León",
        publishedAt: "2026-07-30T00:00:00.000Z",
        sourceName: "ECYL",
        descriptionText: sourceQuote,
        descriptionSections: {
          ...descriptionSections,
          requirements: [sourceQuote],
        },
        originalUrl: "https://empleo.jcyl.es/oferta/with-experience",
        sourceSnapshot,
      },
      {
        id: "offer:without-experience",
        title: "Programador web junior",
        province: "Burgos",
        locality: "Burgos",
        publishedAt: "2026-07-29T00:00:00.000Z",
        sourceName: "ECYL",
        descriptionText: "Oferta sin experiencia publicada.",
        descriptionSections,
        originalUrl: "https://empleo.jcyl.es/oferta/without-experience",
        sourceSnapshot,
      },
    ];
    const requirement = {
      id: publishedRequirementId(firstOfferId, "experience", sourceQuote),
      category: "experience",
      normalizedValue: 12,
      sourceQuote,
      parserRule: "experience.years",
      parserVersion: "1.0.0",
    } as const;
    installResultsFetch({
      offers,
      requirements: [{ offerId: firstOfferId, requirements: [requirement] }],
    });
    const user = userEvent.setup();
    function LocationProbe() {
      const location = useLocation();
      return (
        <output aria-label="Dirección actual">
          {location.pathname}
          {location.search}
        </output>
      );
    }

    const view = render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S?province=León"]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>,
    );

    const firstOffer = await screen.findByRole("article", {
      name: "Programador web con experiencia",
    });
    await user.click(
      within(firstOffer).getByText("Ver evidencia y requisitos"),
    );

    await user.click(
      await screen.findByRole("radio", {
        name: `No lo tengo: ${sourceQuote}`,
      }),
    );
    const filterButton = await screen.findByRole("button", {
      name: "Ver ofertas relacionadas donde no se publica este requisito",
    });
    await user.click(filterButton);

    const filterNotice = await screen.findByRole("status", {
      name: "Filtro activo: ofertas relacionadas que no publican este requisito exacto.",
    });
    expect(filterNotice).toBeVisible();
    expect(filterNotice).toHaveFocus();
    expect(
      screen.queryByRole("article", {
        name: "Programador web con experiencia",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Programador web junior" }),
    ).toBeVisible();
    await user.click(
      within(
        screen.getByRole("article", { name: "Programador web junior" }),
      ).getByText("Ver evidencia y requisitos"),
    );
    expect(screen.getByText("Requisito no publicado")).toBeVisible();
    expect(
      screen.getByText("Requisito no publicado").closest("div"),
    ).toHaveClass("requirement-state requirement-state--unpublished");
    expect(screen.getByText("Zona elegida: León")).toBeVisible();
    expect(screen.getByLabelText("Dirección actual")).toHaveTextContent(
      "/desde-fp/IFC03S?province=León",
    );

    await user.click(screen.getByRole("button", { name: "Quitar filtro" }));
    expect(
      screen.getByRole("article", {
        name: "Programador web con experiencia",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Filtro activo/)).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(filterNotice);
    expect(screen.getByLabelText("Dirección actual")).toHaveTextContent(
      "/desde-fp/IFC03S?province=León",
    );

    await user.click(
      screen.getByRole("button", {
        name: "Ver ofertas relacionadas donde no se publica este requisito",
      }),
    );
    expect(await screen.findByText(/Filtro activo/)).toBeVisible();

    view.unmount();
    installResultsFetch({
      offers,
      requirements: [{ offerId: firstOfferId, requirements: [requirement] }],
    });
    render(
      <MemoryRouter initialEntries={["/desde-fp/IFC03S?province=León"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("article", {
        name: "Programador web con experiencia",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Filtro activo/)).not.toBeInTheDocument();
  });
});
