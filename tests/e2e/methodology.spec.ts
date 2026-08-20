import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("methodology exposes official source, download, terms, and normalized evidence links", async ({
  page,
}) => {
  await page.goto("/metodologia");

  await expect(
    page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
  ).toHaveCount(1);
  const regionalInventory = page.getByRole("region", {
    name: "7 datasets de la Junta",
  });
  await expect(regionalInventory).toBeVisible();
  await expect(regionalInventory.getByRole("row")).toHaveCount(7);
  await expect(
    regionalInventory.getByRole("link", { name: "Contratos por provincia" }),
  ).toBeVisible();
  for (const disclosure of await page
    .getByText("Ver actualización, identificadores y descargas")
    .all()) {
    await disclosure.click();
  }
  for (const tableId of [
    "famprof_2_08",
    "famprof_3_08",
    "ccaa_2_07",
    "ccaa_3_07",
  ]) {
    await page.getByText(new RegExp(`^${tableId}`, "u")).click();
  }
  await expect(
    page.getByRole("link", { name: "Ficha oficial del catálogo" }),
  ).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Descarga CSV oficial" }),
  ).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Descarga PC-Axis oficial" }),
  ).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: "Aviso legal del Ministerio" }),
  ).toHaveAttribute(
    "href",
    "https://www.educacionyfp.gob.es/comunes/aviso-legal.html",
  );
  await expect(
    page.getByRole("link", { name: "Descargar los datos utilizados" }).first(),
  ).toHaveAttribute(
    "href",
    /^\/data\/v1\/snapshots\/.+\/outcome-indicators\.json$/u,
  );

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    ),
  ).toEqual([]);
});
