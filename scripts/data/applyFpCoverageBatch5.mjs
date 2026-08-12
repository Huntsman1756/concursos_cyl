import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const curated = resolve(root, "data", "curated");
const reviewedAt = "2026-08-12";
const cnoNotes =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";

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
const occupations = JSON.parse(
  execFileSync("git", ["show", "HEAD:data/curated/occupations.json"], {
    cwd: root,
    encoding: "utf8",
  }),
);
const aliases = await readJson("occupation-aliases.json");
const links = await readJson("training-occupation-links.json");

const intentionallyOmittedSingleWordAliases = new Set([
  "Teleoperador",
  "Televendedor",
  "Promotor",
  "Cajero",
  "Reponedor",
]);
for (let index = aliases.length - 1; index >= 0; index -= 1) {
  if (intentionallyOmittedSingleWordAliases.has(aliases[index].alias)) {
    aliases.splice(index, 1);
  }
}

const occupationCodes = [
  "1432",
  "2640",
  "3126",
  "3160",
  "3314",
  "3405",
  "3510",
  "3522",
  "3722",
  "3723",
  "3724",
  "4412",
  "4424",
  "5300",
  "5420",
  "5992",
];

for (const code of occupationCodes) {
  const source = official.find((item) => item.classificationCode === code);
  if (!source) throw new Error(`Missing official CNO-11 occupation ${code}`);
  const approvedOccupation = {
    ...source,
    sourceUrl: cnoNotes,
    reviewedAt,
    catalogVersion: "1.0.0",
  };
  const existingIndex = occupations.findIndex(
    (item) => item.classificationCode === code,
  );
  if (existingIndex === -1) occupations.push(approvedOccupation);
  else if (occupations[existingIndex].reviewStatus !== "approved")
    occupations[existingIndex] = approvedOccupation;
}
const aliasRows = [
  ["Técnico en redes locales y telemática", "3813"],
  ["Técnico en instalación y mantenimiento de redes locales", "3813"],
  ["Instalador de antenas", "7533"],
  ["Instalador de telefonía", "7533"],
  ["Instalador-montador de equipos telefónicos y telemáticos", "7533"],
  ["Técnico instalador-mantenedor de equipos informáticos", "7533"],
  ["Auxiliar de peluquería", "5811"],
  ["Ayudante de manicura y pedicura", "5812"],
  ["Ayudante de maquillaje", "5812"],
  ["Auxiliar de depilación", "5812"],
  ["Encargado de ITV", "3160"],
  ["Perito tasador de vehículos", "3405"],
  ["Recepcionista de vehículos", "4412"],
  ["Árbitro deportivo", "3722"],
  ["Cronometrador de competiciones deportivas", "3722"],
  ["Instructor de educación física", "3723"],
  ["Instructor de natación", "3723"],
  ["Animador turístico", "3724"],
  ["Monitor de tiempo libre", "3724"],
  ["Socorrista en instalaciones acuáticas", "5992"],
  ["Socorrista de piscina", "5992"],
  [
    "Técnico en planificación y programación de procesos de mantenimiento de instalaciones de maquinaria y equipo industrial",
    "3126",
  ],
  ["Técnico de laboratorio sanitario", "3314"],
  ["Técnico en laboratorio de diagnóstico clínico", "3314"],
  ["Delegado comercial de productos hospitalarios y farmacéuticos", "2640"],
  ["Ayudante de instalador de equipos y sistemas de comunicación", "7533"],
  ["Ayudante de instalador de sistemas para transmisión de datos", "7533"],
  ["Gerente de pequeño comercio", "1432"],
  ["Representante comercial", "3510"],
  ["Técnico en gestión de stocks y almacén", "3522"],
  ["Comerciante de tienda", "5300"],
];

for (const [alias, code] of aliasRows) {
  const occupationId = `occupation:cno11:${code}`;
  const existing = aliases.find(
    (item) =>
      item.alias.localeCompare(alias, "es", { sensitivity: "base" }) === 0,
  );
  if (existing) {
    if (existing.occupationId !== occupationId) {
      throw new Error(
        `Alias conflict for ${alias}: ${existing.occupationId} vs ${occupationId}`,
      );
    }
    continue;
  }
  aliases.push({
    alias,
    occupationId,
    reviewStatus: "approved",
    reviewedAt,
    mappingVersion: "1.0.0",
  });
}

const todoFp = {
  ELE02M:
    "https://www.todofp.es/que-estudiar/familias-profesionales/electricidad-electronica/instalaciones-telecomunicaciones.html",
  IMP01B:
    "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-personal/peluqueria-estetica.html",
  AFD01S:
    "https://www.todofp.es/que-estudiar/familias-profesionales/actividades-fisicas-deportivas/ensenanza-animacion-sociodeportiva.html",
  SAN08S:
    "https://www.todofp.es/que-estudiar/familias-profesionales/sanidad/laboratorio-clinico-biomedico.html",
  COM01M:
    "https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/actividades-comerciales.html",
};
const boe = {
  ELE02M: "https://www.boe.es/eli/es/rd/2009/10/30/1632",
  TMV01S: "https://www.boe.es/eli/es/rd/2008/11/03/1796",
  AFD01S: "https://www.boe.es/eli/es/rd/2017/06/23/653",
  IMA03S: "https://www.boe.es/eli/es/rd/2011/11/04/1576",
  IFC01B: "https://www.boe.es/buscar/doc.php?id=BOE-A-2014-2360",
};

const linkRows = [
  ["ELE02M", "3813", boe.ELE02M, "Técnico en redes locales y telemática."],
  ["ELE02M", "7533", boe.ELE02M, "Instalador de antenas."],
  ["IMP01B", "5811", todoFp.IMP01B, "Auxiliar de peluquería."],
  ["IMP01B", "5812", todoFp.IMP01B, "Ayudante de manicura y pedicura."],
  [
    "TMV01S",
    "3160",
    todoFp.TMV01S ??
      "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/automocion.html",
    "Encargada / encargado de ITV.",
  ],
  [
    "TMV01S",
    "3405",
    "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/automocion.html",
    "Perita / perito tasador de vehículos.",
  ],
  ["TMV01S", "4412", boe.TMV01S, "Recepcionista de vehículos."],
  [
    "IMA03S",
    "3126",
    boe.IMA03S,
    "Técnico en planificación y programación de procesos de mantenimiento de instalaciones de maquinaria y equipo industrial.",
  ],
  [
    "IFC01B",
    "7533",
    "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/informatica-comunicaciones.html",
    "Ayudante de instalador / instaladora de equipos y sistemas de comunicación.",
  ],
  [
    "IFC01B",
    "8202",
    boe.IFC01B,
    "Operador de ensamblado de equipos eléctricos y electrónicos.",
  ],
  ["COM01M", "1432", todoFp.COM01M, "Gerente de pequeño comercio."],
  ["COM01M", "3510", todoFp.COM01M, "Representante comercial."],
  [
    "COM01M",
    "3522",
    todoFp.COM01M,
    "Técnica / técnico en gestión de stocks y almacén.",
  ],
  [
    "COM01M",
    "4424",
    todoFp.COM01M,
    "Teleoperador / teleoperadora (Call-Center).",
  ],
  ["COM01M", "5300", todoFp.COM01M, "Comerciante de tienda."],
  ["COM01M", "5420", todoFp.COM01M, "Televendedor / televendedora."],
  ["COM01M", "5492", todoFp.COM01M, "Promotor / promotora."],
  ["COM01M", "5500", todoFp.COM01M, "Cajera / cajero."],
  ["COM01M", "9820", todoFp.COM01M, "Reponedor / reponedora."],
];

for (const programKey of ["AFD01S", "AFD01SD"]) {
  linkRows.push(
    [
      programKey,
      "3722",
      todoFp.AFD01S,
      "Cronometrador / cronometradora, juez / jueza y árbitra / árbitro de competiciones deportivas no oficiales.",
    ],
    [
      programKey,
      "3723",
      boe.AFD01S,
      "Profesor/a de actividades físico-deportivas.",
    ],
    [
      programKey,
      "3724",
      todoFp.AFD01S,
      "Animador / animadora de veladas, espectáculos y actividades recreativas en instalaciones turísticas.",
    ],
    [programKey, "5992", boe.AFD01S, "Socorrista en instalaciones acuáticas."],
  );
}
for (const programKey of ["SAN08S", "SAN08SD"]) {
  linkRows.push(
    [
      programKey,
      "3314",
      todoFp.SAN08S,
      "Técnica / técnico superior en laboratorio de diagnóstico clínico.",
    ],
    [
      programKey,
      "2640",
      todoFp.SAN08S,
      "Delegada / delegado comercial de productos hospitalarios y farmacéuticos.",
    ],
  );
}

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
}

await Promise.all([
  writeJson("occupations.json", occupations),
  writeJson("occupation-aliases.json", aliases),
  writeJson("training-occupation-links.json", links),
]);

console.log(
  JSON.stringify({
    occupations: occupations.length,
    aliases: aliases.length,
    links: links.length,
    addedLinks: linkRows.length,
  }),
);
