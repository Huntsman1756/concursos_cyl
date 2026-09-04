import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectStrictAxe(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test("offer-first connects literal cooking evidence to a reviewed FP route", async ({
  page,
}) => {
  await page.goto(
    "/desde-oferta?query=T%C3%A9cnico%20en%20Cocina%20y%20Gastronom%C3%ADa",
  );

  await expect(
    page.getByRole("heading", { name: "1–2 de 2 ofertas" }),
  ).toBeVisible();
  const card = page
    .getByRole("article", { name: "COCINEROS, EN GENERAL" })
    .first();
  await expect(card).toContainText("Técnico en Cocina y Gastronomía.");
  await expect(card).toContainText("Con FP relacionada");
  await expect(
    card.getByRole("link", { name: /Ver oferta oficial/ }).first(),
  ).toBeVisible();
  await expectStrictAxe(page);
  await expect(card.getByLabel(/Ver trazabilidad de/)).toBeVisible();
  await card
    .getByLabel("Ver trazabilidad de COCINEROS, EN GENERAL")
    .press("Enter");
  await expect(card.locator("details")).toHaveAttribute("open", "");

  await expect(card).toContainText("Técnico en Cocina y Gastronomía");
  await expect(card).toContainText("Clasificado en revisión");
  await expect(
    card.getByRole("link", { name: "Cocina y Gastronomía" }),
  ).toHaveAttribute("href", "/desde-fp/HOT01M");
  await expect(
    card.getByRole("link", { name: /Ver oferta oficial/ }).first(),
  ).toBeVisible();
});

test("offer card actions share one stable axis across results on desktop", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "chromium-mobile",
    "Mobile stacks content above actions by design.",
  );
  await page.setViewportSize({ width: 1267, height: 1044 });
  await page.goto("/desde-oferta");
  await expect(
    page.getByRole("heading", { name: /de \d+ ofertas?/u }),
  ).toBeVisible();
  await page.locator(".offer-row").first().waitFor();

  const rightEdges = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".offer-row .offer-row__actions"))
      .slice(0, 12)
      .map((actions) => {
        const box = actions.getBoundingClientRect();
        return Math.round(box.x + box.width);
      }),
  );
  expect(rightEdges.length).toBeGreaterThanOrEqual(2);
  expect(new Set(rightEdges).size).toBe(1);
});

test("offer-first keeps ambiguity and the university boundary explicit", async ({
  page,
}) => {
  await page.goto("/desde-oferta?query=cuidador");
  await expect(
    page.getByRole("heading", { name: "1–12 de 56 ofertas" }),
  ).toBeVisible();
  const caregiver = page
    .getByRole("article", {
      name: "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    })
    .first();
  await expect(caregiver).toContainText("Sin relación FP comprobada");
  await expect(
    caregiver.getByRole("link", { name: /Ver oferta oficial/ }).first(),
  ).toBeVisible();
  await expect(caregiver.getByLabel(/Ver trazabilidad de/)).toBeVisible();
  await caregiver
    .getByLabel(
      "Ver trazabilidad de CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    )
    .click();
  await expect(caregiver).toContainText("Correspondencia con formación");
  await expect(caregiver).toContainText("No hay una relación FP comprobada");
  await expect(caregiver).not.toContainText("Esta oferta exige");

  await page.goto("/desde-oferta?query=Grado%20en%20Fisioterapia");
  await page
    .getByRole("combobox", { name: "Relación con la formación" })
    .selectOption({ label: "Vía universitaria o regulada" });
  await expect(
    page.getByRole("heading", { name: "1–10 de 10 ofertas" }),
  ).toBeVisible();
  const physiotherapy = page
    .getByRole("article", { name: "FISIOTERAPEUTAS, EN GENERAL" })
    .first();
  await expect(physiotherapy).toContainText(/fisioterapia/i);
  await expect(physiotherapy).toContainText("Vía universitaria o regulada");
  await expect(
    physiotherapy.getByRole("link", { name: /Ver oferta oficial/ }).first(),
  ).toBeVisible();
  await expect(physiotherapy.getByLabel(/Ver trazabilidad de/)).toBeVisible();
  await physiotherapy
    .getByLabel("Ver trazabilidad de FISIOTERAPEUTAS, EN GENERAL")
    .click();
  await expect(physiotherapy).toContainText(
    "Aquí marcamos un límite: no inferimos equivalencias",
  );
  await expect(physiotherapy).not.toContainText("Esta oferta exige");
  await expectStrictAxe(page);
});

test("offer-first keeps certificate evidence conservative and traceable", async ({
  page,
}) => {
  await page.goto(
    "/desde-oferta?query=Certificado%20de%20Profesionalidad%20de%20Atenci%C3%B3n%20Sociosanitaria%20a%20Personas%20en%20el%20Domicilio",
  );
  const accepted = page
    .getByRole("article", { name: "Auxiliar de ayuda a domicilio para Burgos" })
    .first();
  await expect(accepted).toBeVisible();
  await accepted
    .getByLabel("Ver trazabilidad de Auxiliar de ayuda a domicilio para Burgos")
    .click();
  await expect(accepted).toContainText("Piden un certificado o cualificación");
  await expect(accepted).toContainText(
    "Certificado de Profesionalidad de Atención Sociosanitaria a Personas en el Domicilio",
  );
  await expect(accepted).toContainText("Certificado (Clasificado por regla)");

  await page.goto(
    "/desde-oferta?query=Certificado%20de%20profesionalidad%20en%20atenci%C3%B3n%20sociosanitaria%20a%20personas%20dependientes%20en%20instituciones%20sociales",
  );
  const related = page
    .getByRole("article", {
      name: "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    })
    .first();
  await related
    .getByLabel(
      "Ver trazabilidad de CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    )
    .click();
  await expect(related).toContainText("Piden un certificado o cualificación");
  await expect(related).toContainText(
    "Certificado de profesionalidad en atención sociosanitaria a personas dependientes en instituciones sociales",
  );
  await expect(related).toContainText("Certificado (Clasificado por regla)");
  await expect(related).not.toContainText("Con FP relacionada");
  await expectStrictAxe(page);
});

test("offer-evidence is a manifest-addressed candidate dataset", async ({
  request,
}) => {
  const manifestResponse = await request.get("/data/v1/manifest.json");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = (await manifestResponse.json()) as {
    snapshotId: string;
    activationProvenance: {
      candidateSnapshotId: string;
      sourceSnapshotId: string;
      derivedResourceKeys: string[];
    };
    resourceSnapshots: Record<
      string,
      { recordCount: number; resourcePath: string; sha256: string }
    >;
  };
  expect(manifest.snapshotId).toBe("20260830120000000-8c6c79fbd2a1");
  expect(manifest.activationProvenance.sourceSnapshotId).toBe(
    "20260822085631889-fc9bf2ba23f9",
  );
  expect(manifest.activationProvenance.derivedResourceKeys).toContain(
    "offerEvidence",
  );

  const descriptor = manifest.resourceSnapshots.offerEvidence;
  expect(descriptor.recordCount).toBe(1058);
  expect(descriptor.resourcePath).toMatch(
    /\/data\/v1\/snapshots\/20260830120000000-8c6c79fbd2a1\/offer-evidence\.json$/u,
  );
  const resourceResponse = await request.get(descriptor.resourcePath);
  expect(resourceResponse.ok()).toBe(true);
  const resource = (await resourceResponse.json()) as {
    snapshotId: string;
    baseSnapshotId: string;
    counts: { requirementCount: number; classifiedRequirementCount: number };
    records: unknown[];
  };
  expect(resource.snapshotId).toBe(manifest.snapshotId);
  expect(resource.baseSnapshotId).toBe(
    manifest.activationProvenance.sourceSnapshotId,
  );
  expect(resource.records).toHaveLength(1058);
  expect(resource.counts).toMatchObject({
    requirementCount: 1055,
    classifiedRequirementCount: 70,
  });
});
