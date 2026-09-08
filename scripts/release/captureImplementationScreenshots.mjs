#!/usr/bin/env node
/**
 * Implementation screenshot QA (FASE 21): captures the redesigned product at
 * 1440/768/390/320 for the core screens and assembles
 * IMPLEMENTATION-CONTACT-SHEET.png for the fidelity review against
 * docs/design/prototypes/product/screenshots/PRODUCT-CONTACT-SHEET.png.
 *
 * Usage: node scripts/release/captureImplementationScreenshots.mjs
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFile } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const OUT = join(repoRoot, "analysis", "implementation-screenshots");

const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}`;

const SCREENS = [
  ["home", "/"],
  ["fp-detail", "/desde-fp/ADG02S"],
  ["occupation-detail", "/desde-ocupacion/occupation%3Acno11%3A5611"],
  ["offers-global", "/desde-oferta"],
  ["offers-contextual", "/desde-fp/ADG02S/ofertas"],
  ["centers-global", "/donde-estudiar"],
  ["centers-contextual", "/donde-estudiar/ADG02S"],
  ["zero-fail-closed", "/desde-ocupacion/occupation%3Acno11%3A3820/ofertas"],
  ["compare-studies", "/comparar"],
  ["resources", "/recursos"],
];

const VIEWPORTS = [
  [1440, 900],
  [768, 1024],
  [390, 844],
  [320, 720],
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
  for (const [width, height] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height } });
    for (const [name, path] of SCREENS) {
      await page.goto(`${BASE}${path}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: join(OUT, `${name}-${width}.png`),
        fullPage: false,
      });
      console.log(`captured ${name}-${width}`);
    }
    await page.close();
  }

  const sheet = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>IMPLEMENTATION-CONTACT-SHEET</title>
<style>body{margin:24px;background:#1c2b31;font-family:sans-serif}h1{color:#fff;font-size:16px}
h2{color:#c9d3d8;font-size:13px;font-weight:400}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
figure{margin:0}figcaption{color:#f7f5f1;font-size:12px;padding:6px 2px}
img{width:100%;height:auto;border:1px solid #56666d;background:#fff}</style></head><body>
<h1>SALIDA CyL — IMPLEMENTATION (production build)</h1>
<h2>Home + core interior families at 1440 · comparison vs PRODUCT-CONTACT-SHEET</h2>
<div class="grid">
<figure><img src="home-1440.png"><figcaption>HOME</figcaption></figure>
<figure><img src="fp-detail-1440.png"><figcaption>FP DETAIL (ADG02S)</figcaption></figure>
<figure><img src="occupation-detail-1440.png"><figcaption>OCCUPATION (CNO 5611)</figcaption></figure>
<figure><img src="offers-global-1440.png"><figcaption>OFFERS (1058)</figcaption></figure>
<figure><img src="centers-global-1440.png"><figcaption>CENTERS (1293)</figcaption></figure>
<figure><img src="offers-contextual-1440.png"><figcaption>OFFERS CONTEXTUAL</figcaption></figure>
<figure><img src="compare-studies-1440.png"><figcaption>COMPARE STUDIES</figcaption></figure>
<figure><img src="resources-1440.png"><figcaption>MORE TRAINING</figcaption></figure>
<figure><img src="zero-fail-closed-1440.png"><figcaption>ZERO STATE (CNO 3820)</figcaption></figure>
</div></body></html>`;
  writeFile(
    join(OUT, "IMPLEMENTATION-CONTACT-SHEET.html"),
    sheet,
    () => undefined,
  );

  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
  });
  await page.goto(
    `file:///${join(OUT, "IMPLEMENTATION-CONTACT-SHEET.html").replace(/\\/g, "/")}`,
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(OUT, "IMPLEMENTATION-CONTACT-SHEET.png"),
    fullPage: true,
  });
  await page.close();
  await browser.close();
  console.log("done →", OUT);
} finally {
  server.kill();
}
