import { expect, test } from "@playwright/test";

test("offer-first connects literal cooking evidence to a reviewed FP route", async ({
  page,
}) => {
  await page.goto(
    "/desde-oferta?query=T%C3%A9cnico%20en%20Cocina%20y%20Gastronom%C3%ADa",
  );

  await expect(
    page.getByRole("heading", { name: "2 de 1058 ofertas" }),
  ).toBeVisible();
  const card = page
    .getByRole("article", { name: "COCINEROS, EN GENERAL" })
    .first();
  await card.getByText("Ver requisitos, relación y siguiente acción").click();

  await expect(card).toContainText("Técnico en Cocina y Gastronomía");
  await expect(card).toContainText("Clasificado en revisión");
  await expect(
    card.getByRole("link", { name: /Ver dónde estudiar Cocina/ }),
  ).toHaveAttribute("href", "/formacion/HOT01M");
  await expect(
    card.getByRole("link", { name: /Abrir la oferta original/ }).first(),
  ).toBeVisible();
});

test("offer-first keeps ambiguity and the university boundary explicit", async ({
  page,
}) => {
  await page.goto("/desde-oferta?query=cuidador");
  await expect(
    page.getByRole("heading", { name: "56 de 1058 ofertas" }),
  ).toBeVisible();
  const caregiver = page
    .getByRole("article", {
      name: "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    })
    .first();
  await caregiver
    .getByText("Ver requisitos, relación y siguiente acción")
    .click();
  await expect(caregiver).toContainText(
    "No hemos podido extraer requisitos concretos de esta publicación",
  );
  await expect(caregiver).not.toContainText("Esta oferta exige");

  await page.goto("/desde-oferta?query=Grado%20en%20Fisioterapia");
  await page
    .getByRole("combobox", { name: "Estado de evidencia" })
    .selectOption({ label: "Vía universitaria o regulada" });
  await expect(
    page.getByRole("heading", { name: "2 de 1058 ofertas" }),
  ).toBeVisible();
  const physiotherapy = page
    .getByRole("article", { name: "FISIOTERAPEUTAS, EN GENERAL" })
    .first();
  await physiotherapy
    .getByText("Ver requisitos, relación y siguiente acción")
    .click();
  await expect(physiotherapy).toContainText("U1");
  await expect(physiotherapy).toContainText(
    "La oferta publica literalmente este requisito universitario o regulado.",
  );
  await expect(physiotherapy).not.toContainText("Esta oferta exige");
});

test("offer-first distinguishes accepted and related official certificates", async ({
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
    .getByText("Ver requisitos, relación y siguiente acción")
    .click();
  await expect(accepted).toContainText("SSCS0108");
  await expect(accepted).toContainText("Certificado citado por la oferta");
  await expect(accepted.locator('a[href*="SSCS0108.pdf"]')).toHaveCount(1);

  await page.goto("/desde-oferta?query=SSCS0208");
  const related = page
    .getByRole("article", {
      name: "CUIDADORES DE PERSONAS CON DISCAPACIDAD Y/O DEPENDENCIA, EN INSTITUCIONES",
    })
    .first();
  await related
    .getByText("Ver requisitos, relación y siguiente acción")
    .click();
  await expect(related).toContainText("Certificado oficial relacionado");
  await expect(related).toContainText(
    "alternativa relacionada, no como requisito satisfecho",
  );
  await expect(related).not.toContainText(
    "La oferta acepta explícitamente un certificado",
  );
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
