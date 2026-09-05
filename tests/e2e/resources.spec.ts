import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public resources expose the runtime open-call truth with provenance", async ({
  page,
  request,
}) => {
  const manifestResponse = await request.get("/data/v1/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    resourceSnapshots: {
      publicEmploymentCalls: {
        recordCount: number;
        resourcePath: string;
        snapshotFetchedAt: string;
      };
    };
  };
  const descriptor = manifest.resourceSnapshots.publicEmploymentCalls;
  expect(descriptor.recordCount).toBe(307);
  const callsResponse = await request.get(descriptor.resourcePath);
  expect(callsResponse.ok()).toBe(true);
  const calls = (await callsResponse.json()) as Array<{
    id: string;
    accessType: string;
    applicationStart: string | null;
    applicationDeadline: string | null;
  }>;
  const referenceDate = descriptor.snapshotFetchedAt.slice(0, 10);
  const openCalls = calls.filter(
    (call) =>
      call.accessType === "open" &&
      call.applicationDeadline !== null &&
      call.applicationDeadline >= referenceDate &&
      (call.applicationStart === null ||
        call.applicationStart <= referenceDate),
  );
  expect(calls).toHaveLength(307);
  expect(openCalls.map(({ id }) => id)).toEqual([
    "1285666453332",
    "1285666480084",
    "1285666447460",
    "1285666500281",
  ]);

  await page.goto("/recursos");

  const expectedCallsHeading = await page.evaluate((copyDate) => {
    const formatted = new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${copyDate}T00:00:00Z`));
    return `Convocatorias que figuraban abiertas en la copia del ${formatted}`;
  }, referenceDate);
  await expect(
    page.getByRole("heading", { name: expectedCallsHeading }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Empleo público abierto al/u }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: "Fuente: Convocatorias de Empleo Público JCyL",
    }),
  ).toHaveAttribute("href", /convocatorias-de-empleo-publico/u);
  await expect(
    page.getByText("4 convocatorias", { exact: true }),
  ).toBeVisible();

  const courses = page.getByRole("region", { name: "Cursos del ECYL" });
  const certificates = page.getByRole("region", {
    name: "Certificados de profesionalidad",
  });
  const sectionNav = page.getByRole("navigation", {
    name: "Secciones de esta página",
  });
  for (const [label, id] of [
    ["Certificados", "certificates-heading"],
    ["Cursos ECYL", "courses-heading"],
    ["Convocatorias", "public-calls-heading"],
  ]) {
    await sectionNav.getByRole("link", { name: label, exact: true }).click();
    await expect(page.locator(`#${id}`)).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
  await expect(courses).toBeVisible();
  await expect(certificates).toBeVisible();
  await expect(courses.getByText(/^8 de \d+ resultados$/u)).toBeVisible();
  await page.getByRole("button", { name: "Mostrar más cursos" }).click();
  await expect(courses.getByText(/^16 de \d+ resultados$/u)).toBeVisible();

  await expect(certificates.getByText(/^8 de \d+ resultados$/u)).toBeVisible();
  await page.getByRole("button", { name: "Mostrar más certificados" }).click();
  await expect(certificates.getByText(/^16 de \d+ resultados$/u)).toBeVisible();

  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
});
