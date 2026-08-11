import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  installDecisionFlowFixture,
  syntheticQuotes,
} from "../fixtures/decisionFlowFixture";

async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let steps = 0; steps < 80; steps += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((node) => document.activeElement === node))
      return;
  }
  throw new Error("Expected the control to be reachable in page tab order.");
}

test("live DAW results shows formacion link and approved occupation", async ({
  page,
}) => {
  await page.goto("/desde-fp");

  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver ofertas" }).click();

  await expect(
    page.getByRole("link", {
      name: "Acceder a la información formativa de Desarrollo de Aplicaciones Web",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Acceder a la información formativa de Desarrollo de Aplicaciones Web",
    }),
  ).toHaveAttribute("href", "/formacion/IFC03S");

  await expect(
    page.getByText("Analistas, programadores y diseñadores web y multimedia"),
  ).toBeVisible();

  await expect(page.getByText("Código CNO-11: 2713")).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Ver perfil profesional" }),
  ).toBeVisible();
});

test("live DAW results name the dated zero-match snapshot without claiming there are no jobs", async ({
  page,
}) => {
  const manifestResponse = page.waitForResponse((response) =>
    response.url().endsWith("/data/v1/manifest.json"),
  );
  await page.goto("/desde-fp");
  const manifest = (await (await manifestResponse).json()) as {
    resourceSnapshots: {
      jobOffers: { sourceUpdatedAt: string | null; snapshotFetchedAt: string };
    };
  };

  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver ofertas" }).click();
  const snapshotDate = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(
      manifest.resourceSnapshots.jobOffers.sourceUpdatedAt ??
        manifest.resourceSnapshots.jobOffers.snapshotFetchedAt,
    ),
  );

  await expect(
    page.getByText(
      `No hay ofertas relacionadas en la instantánea del ${snapshotDate}.`,
    ),
  ).toBeVisible();
  await expect(page.getByText(/no hay (empleo|trabajo|puestos)/iu)).toHaveCount(
    0,
  );
});

test("COM01M is explicitly unavailable before and after submit", async ({
  page,
}) => {
  await page.goto("/desde-fp");
  await page
    .getByRole("combobox", { name: "Ciclo de Formación Profesional" })
    .selectOption("COM01M");
  await expect(page.getByRole("status")).toContainText(
    /cobertura revisada no disponible/i,
  );
  await page.getByRole("button", { name: "Ver ofertas" }).click();
  await expect(
    page.getByText(/Aún no hay una relación revisada/i),
  ).toBeVisible();
});

test("the intercepted full DAW card makes a declared gap, action, filter, and evidence keyboard-accessible", async ({
  page,
}) => {
  await installDecisionFlowFixture(page);
  await page.goto("/desde-fp");
  await page
    .getByLabel("Ciclo de Formación Profesional")
    .selectOption("IFC03S");
  await page.getByRole("button", { name: "Ver ofertas" }).click();

  const card = page.getByRole("article", {
    name: "Desarrollador web para servicios públicos",
  });
  await expect(card).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Por qué aparece" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Qué publica la vacante" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Tu comprobación" }),
  ).toBeVisible();
  await expect(
    card.getByRole("heading", { name: "Siguiente acción" }),
  ).toBeVisible();

  const mappingDisclosure = card.getByText("Ver cita exacta").first();
  await tabTo(page, mappingDisclosure);
  await expect(mappingDisclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    card.getByText("Desarrollador de aplicaciones en entornos Web."),
  ).toBeVisible();

  const firstExperienceAnswer = card.getByRole("radio", {
    name: `Lo tengo: ${syntheticQuotes.experienceQuote}`,
    exact: true,
  });
  await tabTo(page, firstExperienceAnswer);
  await expect(firstExperienceAnswer).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const missingExperience = card.getByRole("radio", {
    name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
  });
  await expect(missingExperience).toBeFocused();
  await expect(card.getByText(/^Brecha declarada:/u)).toBeVisible();

  const exactAbsenceAction = card.getByRole("button", {
    name: "Ver ofertas relacionadas donde no se publica este requisito",
  });
  await tabTo(page, exactAbsenceAction);
  await expect(exactAbsenceAction).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(
      "Filtro activo: ofertas relacionadas que no publican este requisito exacto.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("article", { name: "Desarrollador web junior" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtro" }).click();
  await expect(page.getByText(/Filtro activo:/u)).toHaveCount(0);

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
