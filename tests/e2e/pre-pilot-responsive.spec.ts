import { expect, test, type Page } from "@playwright/test";

const REPRESENTATIVE_ROUTES = [
  "/",
  "/desde-fp",
  "/desde-fp/COM01M",
  "/desde-ocupacion",
  "/desde-ocupacion/occupation%3Acno11%3A5611",
  "/desde-oferta?query=cocina",
  "/datos-abiertos",
] as const;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));

  expect(overflow.body).toBe(0);
  expect(overflow.document).toBe(0);
}

test("representative routes stay within the viewport at supported widths", async ({
  page,
}) => {
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    await page.setViewportSize(viewport);

    for (const route of REPRESENTATIVE_ROUTES) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("native offer disclosure toggles with Enter and Space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(
    "/desde-oferta?query=T%C3%A9cnico%20en%20Cocina%20y%20Gastronom%C3%ADa",
  );

  const card = page
    .getByRole("article", { name: "COCINEROS, EN GENERAL" })
    .first();
  const details = card.locator("details");
  const summary = details.locator("summary");

  await summary.focus();
  await expect(summary).toBeFocused();
  await expect(details).not.toHaveAttribute("open");

  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Enter");
  await expect(details).not.toHaveAttribute("open");

  await page.keyboard.press("Space");
  await expect(details).toHaveAttribute("open", "");
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");

  await expectNoHorizontalOverflow(page);
});
