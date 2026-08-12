import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const curated = resolve(root, "data", "curated");
const reviewedAt = "2026-08-12";

async function readJson(name) {
  return JSON.parse(await readFile(resolve(curated, name), "utf8"));
}

async function writeJson(name, value) {
  await writeFile(
    resolve(curated, name),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

const official = await readJson("official-occupations.json");
const links = await readJson("training-occupation-links.json");

const requiredCodes = ["4113", "7401", "8202"];

for (const code of requiredCodes) {
  const source = official.find((item) => item.classificationCode === code);
  if (!source) throw new Error(`Missing official CNO-11 occupation ${code}`);
  if (source.reviewStatus !== "approved")
    throw new Error(
      `Occupation ${code} exists but is not approved (${source.reviewStatus})`,
    );
}

const linkRows = [
  [
    "ADG01M",
    "4113",
    "https://www.boe.es/eli/es/rd/2009/10/30/1631",
    "Empleado de tesorería.",
  ],
  [
    "ADG01MD",
    "4113",
    "https://www.boe.es/eli/es/rd/2009/10/30/1631",
    "Empleado de tesorería.",
  ],
  [
    "TMV02M",
    "7401",
    "https://www.boe.es/eli/es/rd/2010/03/19/453",
    "Mecánico de automóviles.",
  ],
  [
    "IMA03M",
    "8202",
    "https://www.boe.es/eli/es/rd/2011/11/04/1589",
    "Montador de equipos eléctricos.",
  ],
];

let added = 0;
for (const [trainingProgramKey, code, sourceUrl, sourceQuote] of linkRows) {
  const occupationId = `occupation:cno11:${code}`;
  if (
    links.some(
      (item) =>
        item.trainingProgramKey === trainingProgramKey &&
        item.occupationId === occupationId,
    )
  )
    continue;
  links.push({
    trainingProgramKey,
    occupationId,
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl,
    sourceQuote,
    reviewedAt,
    mappingVersion: "1.0.0",
  });
  added += 1;
}

await writeJson("training-occupation-links.json", links);

console.log(
  JSON.stringify({
    links: links.length,
    addedLinks: added,
  }),
);
