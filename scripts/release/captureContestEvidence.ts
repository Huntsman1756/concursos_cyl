import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { chromium, type Page } from "playwright";
import { format } from "prettier";

import { writeContestEvidenceChecklist } from "./validateContestEvidenceManifest";

const MANIFEST_PATH = resolve("docs/contest/evidence-capture.json");
const DEFAULT_BASE_URL = "https://salida-cyl.157-90-22-40.sslip.io";

type RequiredVisible =
  | { kind: "role"; role: string; name: string }
  | { kind: "text"; value: string };

type Capture = {
  evidenceId: string;
  route: string;
  viewport: { width: number; height: number };
  requiredVisible: RequiredVisible[];
  outputFile: string;
  sha256?: string;
  capturedAt?: string;
  localCommitSha?: string;
  deployedCommitSha?: string | null;
};

type Manifest = { captures: Capture[] } & Record<string, unknown>;

type Diagnostics = {
  failedRequests: string[];
  badResponses: string[];
  consoleErrors: string[];
  externalRequests: string[];
};

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

function installDiagnostics(page: Page, baseOrigin: string): Diagnostics {
  const diagnostics: Diagnostics = {
    failedRequests: [],
    badResponses: [],
    consoleErrors: [],
    externalRequests: [],
  };

  page.on("requestfailed", (request) => {
    diagnostics.failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      diagnostics.badResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error")
      diagnostics.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const url = request.url();
    if (/^https?:/u.test(url) && new URL(url).origin !== baseOrigin) {
      diagnostics.externalRequests.push(url);
    }
  });

  return diagnostics;
}

async function prepareCapture(page: Page, evidenceId: string): Promise<void> {
  if (evidenceId === "fp-pre-search-reviewed") {
    await page
      .getByLabel("Ciclo de Formación Profesional")
      .selectOption("EOC01M");
  }
  if (evidenceId === "fp-pre-search-reviewed-zero") {
    await page
      .getByLabel("Ciclo de Formación Profesional")
      .selectOption("COM01M");
  }
  if (evidenceId === "comparison-dual-scopes") {
    await page.getByText("Grado superior", { exact: true }).click();
    await page
      .getByLabel("Filtrar ciclos o grupos")
      .fill("Administración y finanzas");
    await page.getByText("Administración y finanzas", { exact: true }).click();
    await page.getByLabel("3. Cohorte de titulación").selectOption("2022-2023");
    await page
      .getByRole("group", { name: "4. Año tras titularse" })
      .getByText("2", { exact: true })
      .click();
  }
}

async function assertRequiredState(
  page: Page,
  requiredVisible: RequiredVisible[],
): Promise<void> {
  for (const required of requiredVisible) {
    const locator =
      required.kind === "role"
        ? page.getByRole(required.role as "heading" | "combobox", {
            name: required.name,
          })
        : page.getByText(required.value, { exact: false });
    await locator.first().waitFor({ state: "visible" });
  }
}

async function assertCaptureQuality(
  page: Page,
  diagnostics: Diagnostics,
  evidenceId: string,
): Promise<void> {
  await page
    .locator("[aria-busy='true']")
    .waitFor({ state: "detached" })
    .catch(() => undefined);

  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth - document.body.clientWidth,
    document:
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  }));
  assertCondition(
    overflow.body <= 1,
    `${evidenceId}: body overflow ${overflow.body}px`,
  );
  assertCondition(
    overflow.document <= 1,
    `${evidenceId}: document overflow ${overflow.document}px`,
  );

  const { violations } = await new AxeBuilder({ page }).analyze();
  const serious = violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact ?? ""),
  );
  assertCondition(
    serious.length === 0,
    `${evidenceId}: Axe violations ${JSON.stringify(serious, null, 2)}`,
  );
  for (const [name, errors] of Object.entries(diagnostics)) {
    assertCondition(
      errors.length === 0,
      `${evidenceId}: ${name}: ${errors.join("\n")}`,
    );
  }
}

async function positionCapture(page: Page, evidenceId: string): Promise<void> {
  if (evidenceId === "fp-unreviewed-result") {
    const zeroResultMessage = page
      .getByRole("heading", {
        name: "Cómo buscar oportunidades ahora",
      })
      .first();
    await zeroResultMessage.evaluate((element) =>
      element.scrollIntoView({ block: "center" }),
    );
  }
  if (evidenceId === "comparison-dual-scopes") {
    await page
      .getByRole("heading", {
        name: "Ingresos observados del ciclo o grupo en España",
      })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -260));
  }
  if (evidenceId === "methodology-sources") {
    await page
      .getByRole("heading", { name: "8 datasets de la Junta" })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
  }
}

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const baseUrl = (
    argumentValue("--base-url") ??
    process.env.CONTEST_EVIDENCE_BASE_URL ??
    DEFAULT_BASE_URL
  ).replace(/\/$/u, "");
  const commitSha =
    argumentValue("--commit") ?? process.env.CONTEST_EVIDENCE_COMMIT_SHA;
  assertCondition(
    commitSha !== undefined && /^[a-f0-9]{40}$/u.test(commitSha),
    "CONTEST_EVIDENCE_COMMIT_SHA must be the deployed 40-character commit SHA",
  );

  const manifest = JSON.parse(
    await readFile(MANIFEST_PATH, "utf8"),
  ) as Manifest;
  assertCondition(
    Array.isArray(manifest.captures),
    "Invalid evidence manifest",
  );

  const browser = await chromium.launch({ headless: true });
  const capturedAt = new Date().toISOString();
  const capturedImages: Array<{ outputPath: string; png: Buffer }> = [];
  try {
    for (const capture of manifest.captures) {
      const context = await browser.newContext({
        viewport: capture.viewport,
        locale: "es-ES",
        colorScheme: "light",
      });
      const page = await context.newPage();
      const diagnostics = installDiagnostics(page, new URL(baseUrl).origin);
      try {
        const response = await page.goto(`${baseUrl}${capture.route}`, {
          waitUntil: "networkidle",
        });
        assertCondition(
          response?.ok(),
          `${capture.evidenceId}: route did not return 2xx`,
        );
        await prepareCapture(page, capture.evidenceId);
        await assertRequiredState(page, capture.requiredVisible);
        await assertCaptureQuality(page, diagnostics, capture.evidenceId);
        await positionCapture(page, capture.evidenceId);

        const outputPath = resolve(capture.outputFile);
        const png = await page.screenshot({ fullPage: false });
        capture.sha256 = createHash("sha256").update(png).digest("hex");
        capture.capturedAt = capturedAt;
        capture.localCommitSha = commitSha;
        capture.deployedCommitSha = commitSha;
        capturedImages.push({ outputPath, png });
        console.info(`Captured ${capture.evidenceId}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  for (const { outputPath, png } of capturedImages) {
    await writeFile(outputPath, png);
  }
  await writeFile(
    MANIFEST_PATH,
    await format(JSON.stringify(manifest), { parser: "json" }),
    "utf8",
  );
  writeContestEvidenceChecklist();
  console.info(
    `Captured ${manifest.captures.length} evidence images from ${baseUrl}`,
  );
}

await main();
