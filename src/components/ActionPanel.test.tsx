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
          programKey="IFC03S"
          actions={actions}
          checklist={[]}
          onAddChecklist={() => undefined}
          onRemoveChecklist={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Ver ruta formativa y centros" }),
    ).toHaveAttribute("href", "/formacion/IFC03S");
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
          programKey="IFC03S"
          actions={actions}
          checklist={session.checklist}
          onAddChecklist={session.addChecklistItem}
          onRemoveChecklist={session.removeChecklistItem}
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
            programKey="IFC03S"
            actions={remoteActions}
            checklist={[]}
            onAddChecklist={noOp}
            onRemoveChecklist={noOp}
          />
        </section>
        <section aria-label="Presencial">
          <ActionPanel
            programKey="IFC03S"
            actions={onSiteActions}
            checklist={[]}
            onAddChecklist={noOp}
            onRemoveChecklist={noOp}
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
