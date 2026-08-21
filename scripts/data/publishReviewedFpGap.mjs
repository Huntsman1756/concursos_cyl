import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const linksPath = resolve(root, "data/curated/training-occupation-links.json");
const reviewedAt = "2026-08-21";
const todoFpAutomocion =
  "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/automocion.html";
const todoFpInformatica =
  "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/informatica-comunicaciones.html";
const todoFpPeluqueria =
  "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-personal/peluqueria-cosmetica-capilar.html";

function relation(trainingProgramKey, code, sourceUrl, sourceQuote) {
  return {
    trainingProgramKey,
    occupationId: `occupation:cno11:${code}`,
    relationshipType: "official_output",
    reviewStatus: "approved",
    sourceUrl,
    sourceQuote,
    reviewedAt,
    mappingVersion: "1.0.0",
  };
}

const reviewedRelations = [
  relation(
    "IFC01B",
    "7533",
    todoFpInformatica,
    "Ayudante de instalador / instaladora de equipos y sistemas de comunicación.",
  ),
  relation(
    "IFC01B",
    "8202",
    "https://www.boe.es/buscar/doc.php?id=BOE-A-2014-2360",
    "Operador de ensamblado de equipos eléctricos y electrónicos.",
  ),
  relation("IMP02M", "5811", todoFpPeluqueria, "Peluquera / peluquero."),
  relation(
    "IMP02M",
    "5812",
    todoFpPeluqueria,
    "Técnica / técnico en manicura.",
  ),
  relation("IMP02MD", "5811", todoFpPeluqueria, "Peluquera / peluquero."),
  relation(
    "IMP02MD",
    "5812",
    todoFpPeluqueria,
    "Técnica / técnico en manicura.",
  ),
  relation("TMV01S", "3160", todoFpAutomocion, "Encargada / encargado de ITV."),
  relation(
    "TMV01S",
    "3405",
    todoFpAutomocion,
    "Perita / perito tasador de vehículos.",
  ),
  relation(
    "TMV01S",
    "4412",
    "https://www.boe.es/eli/es/rd/2008/11/03/1796",
    "Recepcionista de vehículos.",
  ),
];

function keyOf(item) {
  return `${item.trainingProgramKey}|${item.occupationId.replace("occupation:cno11:", "")}`;
}

function replaceOnce(text, anchor, replacement, path) {
  const first = text.indexOf(anchor);
  if (first === -1 || text.indexOf(anchor, first + anchor.length) !== -1) {
    throw new Error(`Expected one anchor in ${path}: ${anchor}`);
  }
  return `${text.slice(0, first)}${replacement}${text.slice(first + anchor.length)}`;
}

async function updateText(relativePath, updates) {
  const path = resolve(root, relativePath);
  let text = await readFile(path, "utf8");
  let changed = false;
  for (const update of updates) {
    if (text.includes(update.sentinel)) continue;
    text = replaceOnce(text, update.anchor, update.replacement, relativePath);
    changed = true;
  }
  if (changed) await writeFile(path, text, "utf8");
}

const links = JSON.parse(await readFile(linksPath, "utf8"));
const existingByKey = new Map(links.map((item) => [keyOf(item), item]));
let linksChanged = false;
for (const item of reviewedRelations) {
  const key = keyOf(item);
  const existing = existingByKey.get(key);
  if (existing === undefined) {
    links.push(item);
    existingByKey.set(key, item);
    linksChanged = true;
    continue;
  }
  if (JSON.stringify(existing) !== JSON.stringify(item)) {
    throw new Error(`Conflicting existing reviewed relation: ${key}`);
  }
}
if (linksChanged) {
  links.sort((left, right) => {
    const byProgram = left.trainingProgramKey.localeCompare(
      right.trainingProgramKey,
      "en",
    );
    return byProgram !== 0
      ? byProgram
      : left.occupationId.localeCompare(right.occupationId, "en");
  });
  await writeFile(linksPath, `${JSON.stringify(links, null, 2)}\n`, "utf8");
}

await updateText("scripts/data/restoreFrontierReviewedCoverage.ts", [
  {
    sentinel: '"IFC01B|7533"',
    anchor: '  "IFC02B|7533",',
    replacement: '  "IFC01B|7533",\n  "IFC01B|8202",\n  "IFC02B|7533",',
  },
  {
    sentinel: '"IMP02MD|5812"',
    anchor: '  "IMP01B|5812",',
    replacement:
      '  "IMP01B|5812",\n  "IMP02M|5811",\n  "IMP02M|5812",\n  "IMP02MD|5811",\n  "IMP02MD|5812",',
  },
  {
    sentinel: '"TMV01S|3160"',
    anchor: '  "TMV01B|7401",',
    replacement:
      '  "TMV01B|7401",\n  "TMV01S|3160",\n  "TMV01S|3405",\n  "TMV01S|4412",',
  },
]);

await updateText("scripts/data/restoreFrontierReviewedCoverage.test.ts", [
  {
    sentinel: '        "IFC01B|7533",',
    anchor: '        "IFC02S|2713",',
    replacement:
      '        "IFC01B|7533",\n        "IFC01B|8202",\n        "IFC02S|2713",',
  },
  {
    sentinel: '        "IMP02MD|5812",',
    anchor: '        "IMP01B|5812",',
    replacement:
      '        "IMP01B|5812",\n        "IMP02M|5811",\n        "IMP02M|5812",\n        "IMP02MD|5811",\n        "IMP02MD|5812",',
  },
  {
    sentinel: '        "TMV01S|3160",',
    anchor: '        "TMV01B|7401",',
    replacement:
      '        "TMV01B|7401",\n        "TMV01S|3160",\n        "TMV01S|3405",\n        "TMV01S|4412",',
  },
]);

await updateText("scripts/data/validateCuratedMappings.test.ts", [
  {
    sentinel: '    programKey: "IMP02MD",',
    anchor:
      '  {\n    programKey: "IMP02M",\n    programTitle: "Peluquería y Cosmética Capilar",\n    level: "intermediate",\n    familyCode: "IMP",\n    familyName: "Imagen Personal",\n  },',
    replacement:
      '  {\n    programKey: "IMP02M",\n    programTitle: "Peluquería y Cosmética Capilar",\n    level: "intermediate",\n    familyCode: "IMP",\n    familyName: "Imagen Personal",\n  },\n  {\n    programKey: "IMP02MD",\n    programTitle: "Peluquería y Cosmética Capilar (distancia)",\n    level: "intermediate",\n    familyCode: "IMP",\n    familyName: "Imagen Personal",\n  },',
  },
  {
    sentinel: "          IMP02MD: 2,",
    anchor: "          IMP02M: 2,",
    replacement: "          IMP02M: 2,\n          IMP02MD: 2,",
  },
]);

console.info(
  linksChanged
    ? `Published ${reviewedRelations.length} reviewed FP relations.`
    : "Reviewed FP relation gap already published.",
);
