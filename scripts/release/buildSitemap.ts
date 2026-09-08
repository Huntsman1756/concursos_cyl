import { readFile, writeFile } from "node:fs/promises";
import { loadPublicationConfig } from "./releaseIdentity";
const config = loadPublicationConfig(process.cwd());
const manifest = JSON.parse(
  await readFile("dist/data/v1/manifest.json", "utf8"),
);
const programs = JSON.parse(
  await readFile(
    `dist${manifest.resourceSnapshots.programs.resourcePath}`,
    "utf8",
  ),
) as { programKey: string }[];
const occupations = JSON.parse(
  await readFile(
    `dist${manifest.resourceSnapshots.occupations.resourcePath}`,
    "utf8",
  ),
) as { occupationId: string }[];
const paths = [
  "",
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
  "candidatura.html",
  ...programs.map((p) => `desde-fp/${encodeURIComponent(p.programKey)}`),
  ...occupations.map(
    (o) => `desde-ocupacion/${encodeURIComponent(o.occupationId)}`,
  ),
];
const urls = [...new Set(paths)]
  .sort()
  .map((p) => new URL(p, config.canonicalRootUrl).href);
const escapeXml = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${escapeXml(u)}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap.xml", config.canonicalRootUrl).href}\n`,
);
console.log(
  `Sitemap: ${urls.length} canonical URLs; no search parameters or invented update dates.`,
);
