import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const curated = resolve(root, "data", "curated");
const reviewedAt = "2026-08-14";

async function readJson(name) {
  return JSON.parse(await readFile(resolve(curated, name), "utf8"));
}

const official = await readJson("official-occupations.json");
const linksPath = resolve(curated, "training-occupation-links.json");
const linksText = await readFile(linksPath, "utf8");
const links = JSON.parse(linksText);

const requiredCodes = ["5811"];

for (const code of requiredCodes) {
  const source = official.find((item) => item.classificationCode === code);
  if (!source) throw new Error(`Missing official CNO-11 occupation ${code}`);
  if (source.reviewStatus !== "approved")
    throw new Error(
      `Occupation ${code} exists but is not approved (${source.reviewStatus})`,
    );
}

const newLink = {
  trainingProgramKey: "IMP02S",
  occupationId: "occupation:cno11:5811",
  relationshipType: "official_output",
  reviewStatus: "approved",
  sourceUrl: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2011-19352",
  sourceQuote: "Peluquero/a especialista.",
  reviewedAt,
  mappingVersion: "1.0.0",
};

const alreadyPresent = links.some(
  (item) =>
    item.trainingProgramKey === newLink.trainingProgramKey &&
    item.occupationId === newLink.occupationId,
);
let added = 0;

if (!alreadyPresent) {
  const trimmed = linksText.trimEnd();
  if (!trimmed.endsWith("]")) {
    throw new Error("training-occupation-links.json must end with an array");
  }
  const beforeClosingBracket = trimmed.slice(0, -1).trimEnd();
  const serializedLink = JSON.stringify(newLink, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
  const separator = links.length > 0 ? ",\n" : "\n";
  await writeFile(
    linksPath,
    `${beforeClosingBracket}${separator}${serializedLink}\n]\n`,
    "utf8",
  );
  added = 1;
}

console.log(
  JSON.stringify({
    links: links.length,
    addedLinks: added,
  }),
);
