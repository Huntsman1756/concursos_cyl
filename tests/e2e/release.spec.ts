import { expect, test } from "@playwright/test";

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
