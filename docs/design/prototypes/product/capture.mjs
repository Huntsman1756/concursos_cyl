#!/usr/bin/env node
/**
 * Screenshot capture for the SALIDA product prototypes.
 * Usage (repo root): node docs/design/prototypes/product/capture.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const shots = join(here, "screenshots");

const PAGES = [
  ["fp", "fp-detail"],
  ["occupation", "occupation-detail"],
  ["offers/contextual.html", "offers-contextual"],
  ["offers/global.html", "offers-global"],
  ["centers/explorer.html", "centers-explorer"],
  ["centers/contextual.html", "centers-contextual"],
  ["zero", "zero-fail-closed"],
  ["open-data", "open-data"],
  ["methodology", "methodology"],
];

async function paint(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await page.waitForTimeout(250);
}

async function settled(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = window.innerHeight;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await Promise.race([
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              }),
          ),
      ),
      new Promise((r) => setTimeout(r, 5000)),
    ]);
  });
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();
await mkdir(shots, { recursive: true });

async function shoot(name, pagePath, width, height, fullPage = false) {
  const url = `file:///${join(here, pagePath).replace(/\\/g, "/")}`;
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url);
  await settled(page);
  await paint(page);
  await page.screenshot({
    path: join(shots, `${name}-${width}.png`),
    fullPage,
  });
  await page.close();
  console.log(`captured ${name}-${width}`);
}

const targets = [
  ["fp-detail", "fp/index.html", [1440, 390]],
  ["occupation-detail", "occupation/index.html", [1440, 390]],
  ["offers-contextual", "offers/contextual.html", [1440, 390]],
  ["offers-global", "offers/global.html", [1440, 390]],
  ["centers-explorer", "centers/explorer.html", [1440, 390, 320]],
  ["centers-contextual", "centers/contextual.html", [1440]],
  ["zero-fail-closed", "zero/index.html", [1440, 390]],
  ["open-data", "open-data/index.html", [1440]],
  ["methodology", "methodology/index.html", [1440]],
];

for (const [name, pagePath, widths] of targets) {
  for (const width of widths) {
    const height =
      width >= 1440 ? 900 : width >= 768 ? 1024 : width >= 390 ? 844 : 720;
    await shoot(name, pagePath, width, height);
  }
}

// Contact sheet: seven families side by side to verify "one product" feel.
const sheetHtml = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Contact sheet</title>
<style>
body{margin:24px;background:#1c2b31;font-family:sans-serif}
h1{color:#fff;font-size:16px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
figure{margin:0}
figcaption{color:#f7f5f1;font-size:12px;padding:6px 2px}
img{width:100%;height:auto;border:1px solid #56666d;background:#fff}
</style></head><body>
<h1>SALIDA CyL — ¿siete pantallas del mismo producto?</h1>
<div class="grid">
<figure><img src="../home/screenshots/FULL_PAGE_DESKTOP.png"><figcaption>HOME</figcaption></figure>
<figure><img src="screenshots/fp-detail-1440.png"><figcaption>FP DETAIL</figcaption></figure>
<figure><img src="screenshots/occupation-detail-1440.png"><figcaption>OCCUPATION</figcaption></figure>
<figure><img src="screenshots/offers-global-1440.png"><figcaption>OFFERS</figcaption></figure>
<figure><img src="screenshots/centers-explorer-1440.png"><figcaption>CENTERS</figcaption></figure>
<figure><img src="screenshots/zero-fail-closed-1440.png"><figcaption>ZERO STATE</figcaption></figure>
<figure><img src="screenshots/open-data-1440.png"><figcaption>OPEN DATA</figcaption></figure>
<figure><img src="screenshots/methodology-1440.png"><figcaption>METHODOLOGY</figcaption></figure>
</div></body></html>`;
await writeFile(join(here, "contact-sheet.html"), sheetHtml);
{
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
  });
  await page.goto(
    `file:///${join(here, "contact-sheet.html").replace(/\\/g, "/")}`,
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(shots, "PRODUCT-CONTACT-SHEET.png"),
    fullPage: true,
  });
  await page.close();
  console.log("captured PRODUCT-CONTACT-SHEET");
}

await browser.close();
console.log("done");
