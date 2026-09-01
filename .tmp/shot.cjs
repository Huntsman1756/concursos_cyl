const { chromium } = require("playwright");
const path = require("path");

const routes = process.argv[2] || "/";
const outPrefix = process.argv[3] || "shot";
const base = "http://127.0.0.1:5173";

async function main() {
  const browser = await chromium.launch();
  const list = routes.split(",").map((r) => r.trim());
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push("pageerror: " + err.message));
    for (let i = 0; i < list.length; i++) {
      const route = list[i];
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const name = `${outPrefix}-${width}-${i}.png`;
      await page.screenshot({
        path: path.join(process.cwd(), ".tmp", name),
        fullPage: true,
      });
      // horizontal overflow check
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      console.log(`${width} ${route} overflowX=${overflow}px errors=${errors.length}`);
      errors.length = 0;
    }
    await context.close();
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
