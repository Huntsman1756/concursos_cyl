import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  installDecisionFlowFixture,
  syntheticQuotes,
} from "../fixtures/decisionFlowFixture";

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
  await mappingDisclosure.focus();
  await expect(mappingDisclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    card.getByText("Desarrollador de aplicaciones en entornos Web."),
  ).toBeVisible();

  const missingExperience = card.getByRole("radio", {
    name: `No lo tengo: ${syntheticQuotes.experienceQuote}`,
  });
  await missingExperience.focus();
  await expect(missingExperience).toBeFocused();
  await page.keyboard.press("Space");
  await expect(card.getByText(/^Brecha declarada:/u)).toBeVisible();

  const exactAbsenceAction = card.getByRole("button", {
    name: "Ver ofertas relacionadas donde no se publica este requisito",
  });
  await exactAbsenceAction.focus();
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
