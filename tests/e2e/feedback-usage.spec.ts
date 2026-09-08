import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("home actions share a baseline and the opened help retains contrast", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("combobox", { name: "Busca tu ciclo" }),
  ).toBeVisible();
  const tops = [];
  for (const name of [
    "Tengo una FP",
    "Busco una profesión",
    "Estoy mirando una oferta",
  ]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const button = page.locator(
      '[role="tabpanel"][aria-hidden="false"] button[type="submit"]',
    );
    await expect(button).toBeVisible();
    tops.push((await button.boundingBox())!.y);
  }
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
  await page
    .getByRole("button", { name: "Qué es una relación revisada" })
    .click();
  await expect(page.locator(".info-popover")).toBeVisible();
  const colors = await page
    .locator(".info-popover")
    .evaluate((el) => [
      getComputedStyle(el).color,
      getComputedStyle(el).backgroundColor,
    ]);
  expect(colors[0]).not.toBe(colors[1]);
  expect(
    (await new AxeBuilder({ page }).include(".proof-rail").analyze())
      .violations,
  ).toEqual([]);
});
test("official offer links retain legible text on hover and focus", async ({
  page,
}) => {
  for (const route of ["/desde-oferta", "/desde-fp/ADG02S"]) {
    await page.goto(route);
    const link = page
      .getByRole("link", { name: /Ver oferta oficial/u })
      .first();
    await expect(link).toBeVisible();
    await link.hover();
    await link.focus();
    const colors = await link.evaluate((el) => [
      getComputedStyle(el).color,
      getComputedStyle(el).backgroundColor,
    ]);
    expect(colors[0]).toBe("rgb(255, 255, 255)");
    expect(colors[0]).not.toBe(colors[1]);
  }
});
