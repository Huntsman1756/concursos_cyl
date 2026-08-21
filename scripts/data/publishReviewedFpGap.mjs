import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const linksPath = resolve(root, "data/curated/training-occupation-links.json");
const defaultReviewedAt = "2026-08-21";
const ineCno11 =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";
const todoFpAutomocion =
  "https://www.todofp.es/que-estudiar/familias-profesionales/transporte-mantenimiento-vehiculos/automocion.html";
const todoFpInformatica =
  "https://www.todofp.es/que-estudiar/familias-profesionales/informatica-comunicaciones/informatica-comunicaciones.html";
const todoFpPeluqueria =
  "https://www.todofp.es/que-estudiar/familias-profesionales/imagen-personal/peluqueria-cosmetica-capilar.html";
const boeComercioInternacional =
  "https://www.boe.es/boe/dias/2011/12/13/pdfs/BOE-A-2011-19439.pdf";
const boeFabricacionMontaje =
  "https://www.boe.es/boe/dias/2014/03/05/pdfs/BOE-A-2014-2360.pdf";
const boeAcondicionamientoFisico =
  "https://www.boe.es/boe/dias/2017/07/08/pdfs/BOE-A-2017-7981.pdf";
const boeAutomatizacionRobotica =
  "https://www.boe.es/eli/es/rd/2011/11/04/1581/dof/spa/pdf";
const boeMecanizado = "https://www.boe.es/eli/es/rd/2007/10/29/1398";
const todoFpDireccionCocina =
  "https://www.todofp.es/que-estudiar/familias-profesionales/hosteleria-turismo/direccion-cocina.html";

function relation(
  trainingProgramKey,
  code,
  sourceUrl,
  sourceQuote,
  reviewedAt = defaultReviewedAt,
) {
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
  relation(
    "AFD02S",
    "3723",
    boeAcondicionamientoFisico,
    "Entrenador/a personal.",
  ),
  relation(
    "AFD02SD",
    "3723",
    boeAcondicionamientoFisico,
    "Entrenador/a personal.",
  ),
  relation(
    "COM04S",
    "3522",
    boeComercioInternacional,
    "Técnico en comercio exterior.",
  ),
  relation(
    "COM04S",
    "3523",
    boeComercioInternacional,
    "Consignatario de buques.",
  ),
  relation("COM04S", "4123", boeComercioInternacional, "Transitario."),
  relation(
    "COM04SD",
    "3522",
    boeComercioInternacional,
    "Técnico en comercio exterior.",
  ),
  relation(
    "COM04SD",
    "3523",
    boeComercioInternacional,
    "Consignatario de buques.",
  ),
  relation("COM04SD", "4123", boeComercioInternacional, "Transitario."),
  relation("FME01B", "7221", boeFabricacionMontaje, "Fontanero/a."),
  relation(
    "FME01B",
    "9700",
    boeFabricacionMontaje,
    "Peones de industrias manufactureras.",
  ),
  relation(
    "ELE04S",
    "3123",
    boeAutomatizacionRobotica,
    "Técnico de puesta en marcha de sistemas de automatización industrial.",
  ),
  relation(
    "ELE04S",
    "3124",
    boeAutomatizacionRobotica,
    "Diseñador de circuitos y sistemas integrados en automatización industrial.",
  ),
  relation(
    "ELE04S",
    "3129",
    boeAutomatizacionRobotica,
    "Técnico en organización de mantenimiento de sistemas de automatización industrial.",
  ),
  relation(
    "ELE04S",
    "3139",
    boeAutomatizacionRobotica,
    "Programador-controlador de robots industriales.",
  ),
  relation(
    "ELE04S",
    "3209",
    boeAutomatizacionRobotica,
    "Jefe de equipo de supervisión de montaje de sistemas de automatización industrial.",
  ),
  relation(
    "ELE04S",
    "7521",
    boeAutomatizacionRobotica,
    "Verificador de aparatos, cuadros y equipos eléctricos.",
  ),
  relation(
    "FME01M",
    "7322",
    boeMecanizado,
    "Trabajadores de la fabricación de herramientas, mecánicos y ajustadores, modelistas matriceros y asimilados.",
  ),
  relation(
    "FME01M",
    "7323",
    boeMecanizado,
    "Ajustador operario de máquinas herramientas.",
  ),
  relation(
    "FME01M",
    "7324",
    boeMecanizado,
    "Pulidor de metales y afilador de herramientas.",
  ),
  relation("HOT04S", "5110", todoFpDireccionCocina, "Cocinera / cocinero."),
  relation(
    "COM01B",
    "4121",
    ineCno11,
    "4121 Empleados de control de abastecimientos e inventario",
    "2026-08-11",
  ),
  relation(
    "COM01B",
    "4123",
    ineCno11,
    "4123 Empleados de logística y transporte de pasajeros y mercancías",
    "2026-08-11",
  ),
  relation(
    "COM01B",
    "5220",
    ineCno11,
    "5220 Vendedores en tiendas y almacenes",
    "2026-08-11",
  ),
  relation(
    "COM01B",
    "5492",
    ineCno11,
    "5492 Promotores de venta",
    "2026-08-11",
  ),
  relation(
    "COM01B",
    "5500",
    ineCno11,
    "5500 Cajeros y taquilleros (excepto bancos)",
    "2026-08-11",
  ),
  relation(
    "COM01B",
    "8333",
    ineCno11,
    "8333 Operadores de carretillas elevadoras",
    "2026-08-11",
  ),
  relation("COM01B", "9820", ineCno11, "9820 Reponedores", "2026-08-11"),
  relation(
    "ELE03S",
    "7531",
    ineCno11,
    "7531 Técnicos de reparación de equipos electrónicos y de comunicaciones",
    "2026-08-11",
  ),
  relation(
    "FME02M",
    "7132",
    ineCno11,
    "7132 Instaladores de cerramientos metálicos y carpinteros metálicos",
    "2026-08-11",
  ),
  relation(
    "FME02M",
    "7312",
    ineCno11,
    "7312 Soldadores y oxicortadores",
    "2026-08-11",
  ),
  relation(
    "FME02M",
    "7313",
    ineCno11,
    "7313 Chapistas y caldereros",
    "2026-08-11",
  ),
  relation(
    "FME02M",
    "7314",
    ineCno11,
    "7314 Montadores de estructuras metálicas",
    "2026-08-11",
  ),
  relation(
    "IMA02M",
    "7250",
    ineCno11,
    "7250 Mecánicos-instaladores de refrigeración y climatización",
    "2026-08-11",
  ),
  relation(
    "MAM01M",
    "7812",
    "https://www.boe.es/eli/es/rd/1128/2010",
    "Operador de máquinas fijas para fabricar productos de madera.",
    "2026-08-09",
  ),
  relation(
    "MAM01M",
    "8209",
    "https://www.boe.es/eli/es/rd/1128/2010",
    "Montador-ensamblador de elementos de carpintería.",
    "2026-08-09",
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
let addedCount = 0;
for (const item of reviewedRelations) {
  const key = keyOf(item);
  const existing = existingByKey.get(key);
  if (existing === undefined) {
    links.push(item);
    existingByKey.set(key, item);
    addedCount += 1;
    continue;
  }
  if (JSON.stringify(existing) !== JSON.stringify(item)) {
    throw new Error(`Conflicting existing reviewed relation: ${key}`);
  }
}
if (addedCount > 0) {
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
    sentinel: '"COM01B|9820"',
    anchor: '  "COM01M|9820",',
    replacement:
      '  "COM01M|9820",\n  "COM01B|4121",\n  "COM01B|4123",\n  "COM01B|5220",\n  "COM01B|5492",\n  "COM01B|5500",\n  "COM01B|8333",\n  "COM01B|9820",',
  },
  {
    sentinel: '"ELE03S|7531"',
    anchor: '  "ELE02S|7533",',
    replacement: '  "ELE02S|7533",\n  "ELE03S|7531",',
  },
  {
    sentinel: '"FME02M|7314"',
    anchor: '  "FME02B|9700",',
    replacement:
      '  "FME02B|9700",\n  "FME02M|7132",\n  "FME02M|7312",\n  "FME02M|7313",\n  "FME02M|7314",',
  },
  {
    sentinel: '"IMA02M|7250"',
    anchor: '  "IMA03M|8202",',
    replacement: '  "IMA02M|7250",\n  "IMA03M|8202",',
  },
  {
    sentinel: '"MAM01M|8209"',
    anchor: '  "MAM01B|9700",',
    replacement: '  "MAM01B|9700",\n  "MAM01M|7812",\n  "MAM01M|8209",',
  },
  {
    sentinel: '"ELE04S|7521"',
    anchor: '  "ELE02S|7533",',
    replacement:
      '  "ELE02S|7533",\n  "ELE04S|3123",\n  "ELE04S|3124",\n  "ELE04S|3129",\n  "ELE04S|3139",\n  "ELE04S|3209",\n  "ELE04S|7521",',
  },
  {
    sentinel: '"FME01M|7324"',
    anchor: '  "FME01B|9700",',
    replacement:
      '  "FME01B|9700",\n  "FME01M|7322",\n  "FME01M|7323",\n  "FME01M|7324",',
  },
  {
    sentinel: '"HOT04S|5110"',
    anchor: '  "HOT01S|3510",',
    replacement: '  "HOT01S|3510",\n  "HOT04S|5110",',
  },
  {
    sentinel: '"AFD02SD|3723"',
    anchor: '  "AFD01SD|5992",',
    replacement: '  "AFD01SD|5992",\n  "AFD02S|3723",\n  "AFD02SD|3723",',
  },
  {
    sentinel: '"COM04SD|4123"',
    anchor: '  "COM03S|5210",',
    replacement:
      '  "COM03S|5210",\n  "COM04S|3522",\n  "COM04S|3523",\n  "COM04S|4123",\n  "COM04SD|3522",\n  "COM04SD|3523",\n  "COM04SD|4123",',
  },
  {
    sentinel: '"FME01B|9700"',
    anchor: '  "FME02B|7312",',
    replacement: '  "FME01B|7221",\n  "FME01B|9700",\n  "FME02B|7312",',
  },
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
    sentinel: '        "COM01B|9820",',
    anchor: '        "COM01M|9820",',
    replacement:
      '        "COM01M|9820",\n        "COM01B|4121",\n        "COM01B|4123",\n        "COM01B|5220",\n        "COM01B|5492",\n        "COM01B|5500",\n        "COM01B|8333",\n        "COM01B|9820",',
  },
  {
    sentinel: '        "ELE03S|7531",',
    anchor: '        "ELE02M|7533",',
    replacement: '        "ELE02M|7533",\n        "ELE03S|7531",',
  },
  {
    sentinel: '        "FME02M|7314",',
    anchor: '        "FME01B|9700",',
    replacement:
      '        "FME01B|9700",\n        "FME02M|7132",\n        "FME02M|7312",\n        "FME02M|7313",\n        "FME02M|7314",',
  },
  {
    sentinel: '        "IMA02M|7250",',
    anchor: '        "IMA03M|8202",',
    replacement: '        "IMA02M|7250",\n        "IMA03M|8202",',
  },
  {
    sentinel: '        "MAM01M|8209",',
    anchor: '        "IMA03S|3126",',
    replacement:
      '        "IMA03S|3126",\n        "MAM01M|7812",\n        "MAM01M|8209",',
  },
  {
    sentinel: '        "ELE04S|7521",',
    anchor: '        "ELE02M|7533",',
    replacement:
      '        "ELE02M|7533",\n        "ELE04S|3123",\n        "ELE04S|3124",\n        "ELE04S|3129",\n        "ELE04S|3139",\n        "ELE04S|3209",\n        "ELE04S|7521",',
  },
  {
    sentinel: '        "FME01M|7324",',
    anchor: '        "FME01B|9700",',
    replacement:
      '        "FME01B|9700",\n        "FME01M|7322",\n        "FME01M|7323",\n        "FME01M|7324",',
  },
  {
    sentinel: '        "HOT04S|5110",',
    anchor: '        "HOT01B|9310",',
    replacement: '        "HOT01B|9310",\n        "HOT04S|5110",',
  },
  {
    sentinel: '        "AFD02SD|3723",',
    anchor: '        "ADG02SD|4223",',
    replacement:
      '        "ADG02SD|4223",\n        "AFD02S|3723",\n        "AFD02SD|3723",',
  },
  {
    sentinel: '        "COM04SD|4123",',
    anchor: '        "COM01M|9820",',
    replacement:
      '        "COM01M|9820",\n        "COM04S|3522",\n        "COM04S|3523",\n        "COM04S|4123",\n        "COM04SD|3522",\n        "COM04SD|3523",\n        "COM04SD|4123",',
  },
  {
    sentinel: '        "FME01B|9700",',
    anchor: '        "ELE02M|7533",',
    replacement:
      '        "ELE02M|7533",\n        "FME01B|7221",\n        "FME01B|9700",',
  },
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
  addedCount > 0
    ? `Published ${addedCount} reviewed FP relations.`
    : "Reviewed FP relation gap already published.",
);
