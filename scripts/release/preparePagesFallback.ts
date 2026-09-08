import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";

const distributionDirectory = resolve("dist");
const indexPath = join(distributionDirectory, "index.html");
const index = await stat(indexPath);
if (!index.isFile() || index.size === 0) {
  throw new Error(
    "dist/index.html must exist before preparing the Pages fallback.",
  );
}
await copyFile(indexPath, join(distributionDirectory, "404.html"));
// Pages cannot rewrite deep links. Materialize known routes as directory indexes;
// unknown routes still use 404.html and preserve their HTTP error status.
const manifest = JSON.parse(
  await readFile(join(distributionDirectory, "data/v1/manifest.json"), "utf8"),
);
async function records(key: string) {
  const resourcePath: string = manifest.resourceSnapshots[key].resourcePath;
  if (
    !/^\/data\/v1\/snapshots\/[a-z0-9-]+\/[a-z0-9-]+\.json$/u.test(resourcePath)
  )
    throw new Error("Unsafe snapshot path");
  return JSON.parse(
    await readFile(join(distributionDirectory, resourcePath.slice(1)), "utf8"),
  );
}
const programs: { programKey: string }[] = await records("programs");
const occupations: { occupationId: string }[] = await records("occupations");
const paths = new Set([
  "desde-fp",
  "desde-ocupacion",
  "desde-oferta",
  "donde-estudiar",
  "comparar",
  "recursos",
  "metodologia",
  "datos-abiertos",
  "accesibilidad",
  "para-organizaciones",
  ...programs.flatMap(({ programKey }) => [
    `desde-fp/${programKey}`,
    `desde-fp/${programKey}/ofertas`,
    `donde-estudiar/${programKey}`,
    `formacion/${programKey}`,
  ]),
  ...occupations.flatMap(({ occupationId }) => [
    `desde-ocupacion/${occupationId}`,
    `desde-ocupacion/${occupationId}/ofertas`,
  ]),
]);
let prepared = 0;
for (const path of paths) {
  if (!/^[a-zA-Z0-9:-]+(?:\/[a-zA-Z0-9:-]+)*$/u.test(path))
    throw new Error(`Unsafe public route: ${path}`);
  // Production Pages builds run on Linux, whose filenames support CNO IDs.
  if (process.platform === "win32" && path.includes(":")) continue;
  const directory = join(distributionDirectory, path);
  await mkdir(directory, { recursive: true });
  await copyFile(indexPath, join(directory, "index.html"));
  prepared++;
}
console.log(
  `Prepared ${prepared}/${paths.size} known Pages routes and an unknown-route 404 fallback.`,
);

if (prepared !== paths.size)
  console.warn(
    "Windows cannot materialize colon-containing CNO directories. Full Pages route verification requires the Linux CI artifact.",
  );
