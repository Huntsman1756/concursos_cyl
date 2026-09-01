import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.argv[2] ?? "before";
mkdirSync(outDir, { recursive: true });

const routes = [
  ["home", "/"],
  ["fp-search", "/desde-fp"],
  ["fp-results", "/desde-fp/SAN21"],
  ["fp-results-lower", "/desde-fp/SAN21?full=1"],
  ["oc-search", "/desde-ocupacion"],
  ["oc-results-5611", "/desde-ocupacion/occupation%3Acno11%3A5611"],
  ["oc-results-7111", "/desde-ocupacion/occupation%3Acno11%3A7111"],
  ["oc-results-3820", "/desde-ocupacion/occupation%3Acno11%3A3820"],
  ["ofertas", "/desde-oferta"],
  ["ofertas-q", "/desde-oferta?query=cocina"],
  ["formacion", "/formacion/SAN21"],
  ["comparar", "/comparar"],
  ["datos", "/datos-abiertos"],
  ["metodologia", "/metodologia"],
  ["recursos", "/recursos"],
];

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

const browser = await chromium.launch();
const errors = [];

for (const [mode, vp] of [
  ["desktop", desktop],
  ["mobile", mobile],
]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error")
      errors.push(`${mode} ${page.url()} :: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${mode} PAGEERROR ${page.url()} :: ${err.message}`));
  page.on("requestfailed", (req) => errors.push(`${mode} REQFAIL ${req.url()}`));
  for (const [name, path] of routes) {
    await page.goto("http://127.0.0.1:5173" + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: `${outDir}/${mode}-${name}.png`,
      fullPage: name === "fp-results" || name === "oc-results-5611" ? true : mode === "mobile",
    });
  }
  await ctx.close();
}

await browser.close();
console.log("ERRORS:\n" + (errors.length ? errors.join("\n") : "none"));
