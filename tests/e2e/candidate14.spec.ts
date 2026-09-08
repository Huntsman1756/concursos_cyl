import { expect, test } from "@playwright/test";

for (const [route, chunk, status] of [
  ["/desde-oferta", "OfferExplorerPage", "Cargando las ofertas…"],
  ["/donde-estudiar", "CentersExplorerPage", "Cargando la oferta formativa…"],
]) {
  test(`${route} keeps the footer below the viewport through both loading phases`, async ({
    page,
  }) => {
    let releaseChunk!: () => void;
    let releaseData!: () => void;
    const chunkGate = new Promise<void>((resolve) => {
      releaseChunk = resolve;
    });
    const dataGate = new Promise<void>((resolve) => {
      releaseData = resolve;
    });
    await page.route(`**/assets/${chunk}-*.js`, async (request) => {
      await chunkGate;
      await request.continue();
    });
    await page.route("**/data/v1/manifest.json", async (request) => {
      await dataGate;
      await request.continue();
    });
    try {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByText("Cargando la página…", { exact: true }),
      ).toBeVisible();
      const footerTop = () =>
        page
          .locator("footer")
          .evaluate((e) => e.getBoundingClientRect().top - innerHeight);
      expect(await footerTop()).toBeGreaterThanOrEqual(0);
      releaseChunk();
      await expect(page.getByText(status, { exact: true })).toBeVisible();
      expect(await footerTop()).toBeGreaterThanOrEqual(0);
      releaseData();
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".catalog-loading")).toHaveCount(0);
    } finally {
      releaseChunk();
      releaseData();
    }
  });
}

test("a regulated profession without reviewed FP does not promise a future route", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion/occupation%3Acno11%3A2111");
  const message = page.getByRole("heading", {
    name: "Esta copia no contiene relaciones FP revisadas para esta profesión.",
  });
  await expect(message).toBeVisible();
  await expect(message.locator("..")).not.toContainText(
    /pendiente|todavía|aún/iu,
  );
  await expect(message.locator("..")).toContainText(
    "ni acredita habilitación profesional",
  );
});

test("an empty related-offer list does not advertise a sort order", async ({
  page,
}) => {
  await page.goto("/desde-ocupacion/occupation%3Acno11%3A2713/ofertas");
  await expect(
    page.getByRole("heading", { name: "0–0 de 0 ofertas relacionadas" }),
  ).toBeVisible();
  await expect(page.getByText(/más recientes primero/u)).toHaveCount(0);
});
