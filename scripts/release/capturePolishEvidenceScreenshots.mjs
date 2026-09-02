#!/usr/bin/env node
/**
 * Polish-round evidence capture (post human review of the implementation
 * build): regenerates ONLY the screenshots affected by the final visual
 * polish round plus the missing direct evidence (home long scroll, footer AI
 * disclosure, open-data/methodology implementation pages).
 *
 * Usage: node scripts/release/capturePolishEvidenceScreenshots.mjs
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const OUT = join(repoRoot, "analysis", "implementation-screenshots");

const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}`;

const VIEWPORT_SHOTS = [
  ["resources-320", "/recursos", 320, 720],
  ["resources-390", "/recursos", 390, 844],
  [
    "occupation-detail-320",
    "/desde-ocupacion/occupation%3Acno11%3A5611",
    320,
    720,
  ],
  ["offers-global-320", "/desde-oferta", 320, 720],
  ["offers-global-390", "/desde-oferta", 390, 844],
  ["offers-contextual-320", "/desde-fp/ADG02S/ofertas", 320, 720],
  ["offers-contextual-390", "/desde-fp/ADG02S/ofertas", 390, 844],
  [
    "zero-fail-closed-320",
    "/desde-ocupacion/occupation%3Acno11%3A3820/ofertas",
    320,
    720,
  ],
  ["centers-global-320", "/donde-estudiar", 320, 720],
  ["centers-contextual-320", "/donde-estudiar/ADG02S", 320, 720],
  ["compare-studies-320", "/comparar", 320, 720],
  ["open-data-1440-implementation", "/datos-abiertos", 1440, 900],
  ["open-data-390-implementation", "/datos-abiertos", 390, 844],
  ["methodology-1440-implementation", "/metodologia", 1440, 900],
  ["methodology-390-implementation", "/metodologia", 390, 844],
];

const FULL_PAGE_SHOTS = [
  ["home-390-long", "/", 390, 844],
  ["open-data-1440-implementation", "/datos-abiertos", 1440, 900],
  ["open-data-390-implementation", "/datos-abiertos", 390, 844],
  ["methodology-1440-implementation", "/metodologia", 1440, 900],
  ["methodology-390-implementation", "/metodologia", 390, 844],
];

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`preview server did not start at ${url}`);
}

async function waitForRouteEvidence(page, path) {
  if (path === "/recursos") {
    await page
      .getByRole("heading", { name: "Empleo público abierto ahora" })
      .waitFor();
    await page.getByText("4 convocatorias", { exact: true }).waitFor();
  } else if (path === "/metodologia") {
    await page
      .getByText(
        "Las imágenes editoriales son generadas mediante IA y no representan personas, empresas, ofertas ni centros reales.",
        { exact: true },
      )
      .waitFor();
  } else if (path === "/datos-abiertos") {
    await page
      .getByRole("heading", { name: "Datos abiertos de SALIDA CyL" })
      .waitFor();
  } else if (path === "/") {
    await page.locator(".home-page").waitFor();
  }
}

const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT)],
  { cwd: repoRoot, stdio: "ignore", shell: true },
);
process.on("exit", () => server.kill());

try {
  await waitForServer(BASE);
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const captured = new Set();

  for (const [name, path, width, height] of FULL_PAGE_SHOTS) {
    if (captured.has(name)) continue;
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(`${BASE}${path}`);
    await page.evaluate(() => document.fonts.ready);
    await waitForRouteEvidence(page, path);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
    captured.add(name);
    console.log(`captured ${name} (fullPage)`);
    await page.close();
  }

  for (const [name, path, width, height] of VIEWPORT_SHOTS) {
    if (captured.has(name)) continue;
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(`${BASE}${path}`);
    await page.evaluate(() => document.fonts.ready);
    await waitForRouteEvidence(page, path);
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false });
    captured.add(name);
    console.log(`captured ${name}`);
    await page.close();
  }

  // Footer AI disclosure: element screenshot so the sentence is readable.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/datos-abiertos`);
  await page.evaluate(() => document.fonts.ready);
  await waitForRouteEvidence(page, "/datos-abiertos");
  await page.waitForTimeout(400);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.locator("footer").screenshot({
    path: join(OUT, "footer-ai-disclosure.png"),
  });
  console.log("captured footer-ai-disclosure");
  await page.close();

  await browser.close();
  console.log("done →", OUT);
} finally {
  server.kill();
}
