import { expect, test } from "@playwright/test";
import { installDecisionFlowFixture } from "../fixtures/decisionFlowFixture";

const RELEASE_PATHS = [
  "/",
  "/desde-fp",
  "/desde-ocupacion",
  "/comparar",
  "/datos-abiertos",
  "/accesibilidad",
  "/para-organizaciones",
  "/metodologia",
];

test("every public destination and a direct deep-link reload render the SPA", async ({
  page,
}) => {
  for (const path of RELEASE_PATHS) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("#root")).not.toBeEmpty();
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
  ).toBeVisible();
});

test("the manifest-addressed outcome artifact is public and same-origin", async ({
  request,
}) => {
  const manifestResponse = await request.get("/data/v1/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    resourceSnapshots: { outcomeIndicators: { resourcePath: string } };
  };
  const resourcePath =
    manifest.resourceSnapshots.outcomeIndicators.resourcePath;
  expect(resourcePath).toMatch(
    /^\/data\/v1\/snapshots\/.+\/outcome-indicators\.json$/u,
  );
  const outcomeResponse = await request.get(resourcePath);
  expect(outcomeResponse.ok()).toBe(true);
  expect(outcomeResponse.headers()["content-type"]).toContain(
    "application/json",
  );
});

test("the public candidate manifest retains canonical SEPE evidence", async ({
  request,
}) => {
  const manifestResponse = await request.get("/data/v1/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    resourceSnapshots: Record<
      string,
      { recordCount: number; resourcePath: string }
    >;
  };
  expect(Object.keys(manifest.resourceSnapshots).sort()).toEqual([
    "centers",
    "derivedFpOccupationGraph",
    "ecylCourses",
    "educationCenterDirectory",
    "jobOffers",
    "mappingCoverage",
    "municipalities",
    "occupationAliases",
    "occupations",
    "officialOccupations",
    "openDataCatalog",
    "outcomeIndicators",
    "professionalCertificates",
    "professionalProfiles",
    "programs",
    "provincialContracts",
    "publicEmploymentCalls",
    "publishedRequirements",
    "sepeOccupationMarket",
    "trainingOccupationLinks",
    "trainingOfferings",
  ]);
  const sepeSnapshot = manifest.resourceSnapshots.sepeOccupationMarket;
  expect(sepeSnapshot.recordCount).toBe(116);
  const sepeResponse = await request.get(sepeSnapshot.resourcePath);
  expect(sepeResponse.ok()).toBe(true);
  const sepe = (await sepeResponse.json()) as {
    period: string;
    records: unknown[];
    coverage: { notPublishedCnoCodes: unknown[] };
  };
  expect(sepe.period).toBe("2026-07");
  expect(sepe.records).toHaveLength(116);
  expect(sepe.coverage.notPublishedCnoCodes).toHaveLength(0);
});

test("print media preserves closed evidence and hides coordinate details", async ({
  page,
}) => {
  await installDecisionFlowFixture(page);
  await page.goto("/desde-fp/IFC03S");

  const card = page.getByRole("article", {
    name: "Desarrollador web para servicios públicos",
  });
  await expect(card).toBeVisible();
  await expect(
    card.locator("details.offer-card__evidence"),
  ).not.toHaveAttribute("open");

  await page.emulateMedia({ media: "print" });

  const evidenceHeading = card
    .locator("details.offer-card__evidence .evidence-step h4")
    .first();
  await expect(evidenceHeading).toHaveText("Por qué aparece");
  expect(
    await evidenceHeading.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeGreaterThan(0);

  const evidenceSource = card.locator("details.offer-card__evidence a").first();
  await expect(evidenceSource).toHaveAttribute("href");
  expect(
    await evidenceSource.evaluate(
      (element) => element.getBoundingClientRect().height,
    ),
  ).toBeGreaterThan(0);

  const coordinatesPage = await page.context().newPage();
  await coordinatesPage.goto("/desde-fp/IFC03S");
  await expect(
    coordinatesPage.getByRole("heading", {
      name: "Distribución de centros",
    }),
  ).toBeVisible();
  await coordinatesPage.emulateMedia({ media: "print" });

  const coordinates = coordinatesPage.locator(
    'details.territorial-distribution__coordinates[data-print-hidden="true"]',
  );
  await expect(coordinates).toHaveCount(1);
  await expect(coordinates).toHaveCSS("display", "none");
  await coordinatesPage.close();
});
