import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { JobOffer } from "../../data/schemas/generated";
import { deriveActions } from "../domain/actionEngine";
import {
  publishedRequirementId,
  type PublishedRequirement,
} from "../domain/requirements";
import { useDecisionSession } from "../domain/session";
import { ActionPanel } from "./ActionPanel";

const programs = [
  {
    programKey: "IFC03S",
    programTitle: "Desarrollo de Aplicaciones Web",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
  {
    programKey: "IFC03SD",
    programTitle: "Desarrollo de Aplicaciones Web (distancia)",
    level: "higher",
    familyCode: "IFC",
    familyName: "Informática y Comunicaciones",
  },
] as const;

function offer(id: string): JobOffer {
  return {
    id,
    title: "Programador web",
    province: "León",
    locality: "León",
    publishedAt: "2026-07-30T00:00:00.000Z",
    sourceName: "ECYL",
    descriptionText: "Oferta publicada",
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [],
      conditions: [],
      application: [],
      other: [],
    },
    originalUrl: `https://empleo.jcyl.es/${id}`,
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
  };
}

function requirement(
  offerId: string,
  input: Omit<PublishedRequirement, "id" | "sourceQuote" | "parserVersion">,
): PublishedRequirement {
  const sourceQuote = `Requisito ${input.parserRule}`;
  return {
    ...input,
    id: publishedRequirementId(offerId, input.category, sourceQuote),
    sourceQuote,
    parserVersion: "1.0.0",
  } as PublishedRequirement;
}

afterEach(cleanup);

describe("ActionPanel integration", () => {
  it("routes an engine-issued regulated-training action to centers, not employment results", () => {
    const jobOffer = offer("offer:qualification");
    const qualification = requirement(jobOffer.id, {
      category: "qualification_or_specialization",
      normalizedValue: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      parserRule: "qualification.official_title",
    });
    const actions = deriveActions({
      offer: jobOffer,
      evidenceState: "declared_explicit_gap",
      requirements: [qualification],
      answers: { [qualification.id]: "lacks" },
    });

    render(
      <MemoryRouter>
        <ActionPanel
          programs={programs}
          actions={actions}
          checklist={[]}
          onAddChecklist={() => undefined}
          onRemoveChecklist={() => undefined}
          onExploreUnpublishedRequirement={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", {
        name: "Desarrollo de Aplicaciones Web, Grado superior, IFC03S",
      }),
    ).toHaveAttribute("href", "/formacion/IFC03S");
    expect(
      screen.getByRole("link", {
        name: "Desarrollo de Aplicaciones Web (distancia), Grado superior, IFC03SD",
      }),
    ).toHaveAttribute("href", "/formacion/IFC03SD");
  });

  it("shows one explicit external action when verification and source share a URL", () => {
    const jobOffer = offer("offer:shared-url");
    const actions = deriveActions({
      offer: jobOffer,
      evidenceState: "explicit_fit",
      requirements: [],
      answers: {},
    });

    render(
      <MemoryRouter>
        <ActionPanel
          programs={programs}
          actions={actions}
          checklist={[]}
          onAddChecklist={() => undefined}
          onRemoveChecklist={() => undefined}
          onExploreUnpublishedRequirement={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", {
        name: /Comprobar requisitos en la oferta.*abre en una pestaña nueva/,
      }),
    ).toHaveAttribute("href", jobOffer.originalUrl);
    expect(
      screen.queryByRole("link", {
        name: /Abrir oferta original.*abre en una pestaña nueva/,
      }),
    ).not.toBeInTheDocument();
  });

  it("does not silently omit an issued training route without official metadata", () => {
    const jobOffer = offer("offer:missing-program");
    const qualification = requirement(jobOffer.id, {
      category: "qualification_or_specialization",
      normalizedValue: "Técnico/a Superior en Desarrollo de Aplicaciones Web",
      parserRule: "qualification.official_title",
    });
    const actions = deriveActions({
      offer: jobOffer,
      evidenceState: "declared_explicit_gap",
      requirements: [qualification],
      answers: { [qualification.id]: "lacks" },
    });

    expect(() =>
      render(
        <MemoryRouter>
          <ActionPanel
            programs={[programs[0]]}
            actions={actions}
            checklist={[]}
            onAddChecklist={() => undefined}
            onRemoveChecklist={() => undefined}
            onExploreUnpublishedRequirement={() => undefined}
          />
        </MemoryRouter>,
      ),
    ).toThrow("Missing official training program metadata for IFC03SD.");
  });

  it("passes the intact engine-issued checklist action into session memory", async () => {
    const jobOffer = offer("offer:checklist");
    const registration = requirement(jobOffer.id, {
      category: "certificate_or_regulated_license",
      normalizedValue: "professional_registration",
      parserRule: "certificate.professional_registration",
    });

    function Harness() {
      const session = useDecisionSession();
      const actions = deriveActions({
        offer: jobOffer,
        evidenceState: "declared_explicit_gap",
        requirements: [registration],
        answers: { [registration.id]: "lacks" },
      });
      return (
        <ActionPanel
          programs={programs}
          actions={actions}
          checklist={session.checklist}
          onAddChecklist={session.addChecklistItem}
          onRemoveChecklist={session.removeChecklistItem}
          onExploreUnpublishedRequirement={() => undefined}
        />
      );
    }

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", {
        name: "Añadir a comprobaciones de esta sesión",
      }),
    );

    expect(
      screen.getByRole("complementary", {
        name: "Comprobaciones de esta sesión",
      }),
    ).toHaveTextContent(
      "Comprobar «Requisito certificate.professional_registration» en la oferta oficial",
    );
  });

  it("passes the intact engine-issued unpublished-requirement action to its handler", async () => {
    const jobOffer = offer("offer:unpublished");
    const experience = requirement(jobOffer.id, {
      category: "experience",
      normalizedValue: 12,
      parserRule: "experience.years",
    });
    const actions = deriveActions({
      offer: jobOffer,
      evidenceState: "declared_explicit_gap",
      requirements: [experience],
      answers: { [experience.id]: "lacks" },
    });
    const engineAction = actions.find(
      (action) => action.actionType === "explore_unpublished_requirement",
    );
    let receivedAction: typeof engineAction;

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ActionPanel
          programs={programs}
          actions={actions}
          checklist={[]}
          onAddChecklist={() => undefined}
          onRemoveChecklist={() => undefined}
          onExploreUnpublishedRequirement={(action) => {
            receivedAction = action;
          }}
        />
      </MemoryRouter>,
    );
    await user.click(
      screen.getByRole("button", {
        name: "Ver ofertas relacionadas donde no se publica este requisito",
      }),
    );

    expect(engineAction).toBeDefined();
    expect(receivedAction).toBe(engineAction);
  });

  it("suppresses a province-change action for remote evidence but keeps it for on-site evidence", () => {
    const remoteOffer = offer("offer:remote");
    const onSiteOffer = offer("offer:on-site");
    const remote = requirement(remoteOffer.id, {
      category: "mobility_or_work_mode",
      normalizedValue: "remote",
      parserRule: "work_mode.remote",
    });
    const onSite = requirement(onSiteOffer.id, {
      category: "mobility_or_work_mode",
      normalizedValue: "on_site",
      parserRule: "work_mode.on_site",
    });
    const remoteActions = deriveActions({
      offer: remoteOffer,
      evidenceState: "explicit_fit",
      requirements: [remote],
      answers: {},
      selectedProvince: "Burgos",
      isSelectedProvinceSuitable: false,
    });
    const onSiteActions = deriveActions({
      offer: onSiteOffer,
      evidenceState: "explicit_fit",
      requirements: [onSite],
      answers: {},
      selectedProvince: "Burgos",
      isSelectedProvinceSuitable: false,
    });
    const noOp = () => undefined;

    render(
      <MemoryRouter>
        <section aria-label="Remoto">
          <ActionPanel
            programs={programs}
            actions={remoteActions}
            checklist={[]}
            onAddChecklist={noOp}
            onRemoveChecklist={noOp}
            onExploreUnpublishedRequirement={noOp}
          />
        </section>
        <section aria-label="Presencial">
          <ActionPanel
            programs={programs}
            actions={onSiteActions}
            checklist={[]}
            onAddChecklist={noOp}
            onRemoveChecklist={noOp}
            onExploreUnpublishedRequirement={noOp}
          />
        </section>
      </MemoryRouter>,
    );

    expect(
      within(screen.getByRole("region", { name: "Remoto" })).queryByRole(
        "link",
        {
          name: "Cambiar zona de búsqueda",
        },
      ),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Presencial" })).getByRole(
        "link",
        {
          name: "Cambiar zona de búsqueda",
        },
      ),
    ).toHaveAttribute("href", "/desde-fp");
  });
});
