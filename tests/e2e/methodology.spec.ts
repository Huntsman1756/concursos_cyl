import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("methodology exposes official source, download, terms, and normalized evidence links", async ({
  page,
}) => {
  await page.goto("/metodologia");

  await expect(
    page.getByRole("heading", { level: 1, name: "Metodología y fuentes" }),
  ).toHaveCount(1);
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
    page.getByRole("link", { name: "Descargar evidencia normalizada" }).first(),
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
