import { copyFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const distributionDirectory = resolve("dist");
const indexPath = resolve(distributionDirectory, "index.html");
const fallbackPath = resolve(distributionDirectory, "404.html");

const index = await stat(indexPath);
if (!index.isFile() || index.size === 0) {
  throw new Error(
    "dist/index.html must exist before preparing the Pages fallback.",
  );
}
await copyFile(indexPath, fallbackPath);
console.log("Prepared dist/404.html from the production entry point.");
