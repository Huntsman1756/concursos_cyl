import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const supportPage of [
  {
    path: "/accesibilidad",
    heading: "Accesibilidad",
    action: "Abrir una incidencia de accesibilidad",
  },
  {
    path: "/para-organizaciones",
    heading: "Para centros y administraciones",
    action: "Descargar datos abiertos",
  },
]) {
  test(`${supportPage.path} is concise, reachable and accessible`, async ({
    page,
  }) => {
    await page.goto(supportPage.path);

    await expect(
      page.getByRole("heading", { level: 1, name: supportPage.heading }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: supportPage.action }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}
