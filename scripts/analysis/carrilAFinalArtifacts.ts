import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const OUT_DIR = "analysis/carril_a_20260827";
const SNAPSHOT = "20260822085631889-7bbe69380f6d";

async function readJson(path: string): Promise<unknown> {
  const full = isAbsolute(path) ? path : resolve(process.cwd(), path);
  return JSON.parse(await readFile(full, "utf8")) as unknown;
}

const INE_CORR = "https://www.ine.es/daco/daco42/clasificaciones/cno11_correspcno94.xls";
const BOE_CNO = "https://www.boe.es/eli/es/rd/2010-11-26/1591";
const INE_NOTAS = "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";

const SAFE = [
  {
    candidateId: "SAFE-01-AD-5710",
    type: "ALIAS",
    cluster: "asistentes domiciliarios",
    rawTitles: ["ASISTENTES DOMICILIARIOS"],
    offerCount: 59,
    proposedCnoCode: "5710",
    proposedCnoTitle: "Trabajadores de los cuidados personales a domicilio",
    aliasForOccupation: "occupation:cno11:5710",
    existingFpCnoLink: "SSC01M (Atención a Personas en Situación de Dependencia)",
    evidenceType: "INE official correspondence CNO-94->CNO-11 (1:1) + INE CNO-11 nomenclature notes",
    evidenceSource: "INE",
    evidenceUrl: INE_CORR,
    evidenceQuote: "CNO94=5113 'Asistentes domiciliarios' (FREC94=1) -> CNO11=5710 'Trabajadores de los cuidados personales a domicilio' (FREC11=1)",
    evidenceUrl2: INE_NOTAS,
    evidenceQuote2: "5710: prestan cuidados personales rutinarios... en casas particulares o en otras unidades residenciales independientes. Ejemplos: Cuidadores de personas mayores a domicilio, Auxiliares de ayuda a personas dependientes a domicilio",
    evidenceExplanation:
      "El titulo de oferta ECYL reproduce literalmente la rubrica CNO-94 5113 'Asistentes domiciliarios'. La unica fila de la tabla oficial de correspondencias INE para 5113 apunta a 5710 con cardinalidad 1:1, y las notas oficiales CNO-11 de 5710 describen exactamente el ambito (cuidados personales a domicilio).",
    whyUnambiguous: "Correspondencia oficial 1:1 verificada tambien a nivel de codigo (5113 es la unica entrada de 5710 en la tabla); las ofertas 'asistente personal' del cluster encajan en cuidados personales a domicilio.",
    possibleAlternativeCnos: ["5629 (trabajadores de los cuidados en servicios de salud)", "5891 (asistentes personales/compania)"],
    whyAlternativesRejected: "Notas INE 5629: entorno de servicios de salud, no domicilio; notas 5891: compania sin cuidados sanitarios, y su lista de 'ocupaciones afines no incluidas' remite expresamente los cuidados personales a domicilio a 5710.",
    impact: { offersUnlocked: 59, newRelationsWithOffers: 1, newProgramsWithOffers: 1, newFamiliesWithOffers: 1, newCnoRepresented: 1 },
    adversarialReview: "ACCEPT_SAFE",
    review: "gemma4 (nan-bulletin-reviewer, revisor independiente) + revisión propia adversarial de descripciones de las 59 ofertas",
  },
  {
    candidateId: "SAFE-02-PC-9602",
    type: "ALIAS",
    cluster: "peones de la construcción de edificios",
    rawTitles: ["PEONES DE LA CONSTRUCCIÓN DE EDIFICIOS"],
    offerCount: 3,
    proposedCnoCode: "9602",
    proposedCnoTitle: "Peones de la construcción de edificios",
    aliasForOccupation: "occupation:cno11:9602",
    existingFpCnoLink: "EOC01B (Reforma y Mantenimiento de Edificios)",
    evidenceType: "Titulo oficial CNO-11 identico + correspondencia oficial CNO-94->CNO-11 1:1",
    evidenceSource: "BOE RD 1591/2010 + INE",
    evidenceUrl: BOE_CNO,
    evidenceQuote: "9602: 'Peones de la construcción de edificios'",
    evidenceUrl2: INE_CORR,
    evidenceQuote2: "CNO94=9602 'Peones de la construcción de edificios' (FREC94=1) -> CNO11=9602 (FREC11=1)",
    evidenceExplanation: "Identidad total de rubrica entre titulo de oferta y la categoria oficial CNO-11 9602 publicada en el BOE, reforzada por correspondencia 1:1 desde el mismo codigo CNO-94.",
    whyUnambiguous: "Unica categoria oficial con esa rubrica; sin solapes con 9601/9700 descritos con otras rubricas.",
    possibleAlternativeCnos: ["9601 'Peones de minas y canteras'", "9700 'Peones de las industrias manufactureras'"],
    whyAlternativesRejected: "Rubricas oficiales distintas y ambitos explicitamente separados en la nomenclatura.",
    impact: { offersUnlocked: 3, newRelationsWithOffers: 1, newProgramsWithOffers: 1, newFamiliesWithOffers: 0, newCnoRepresented: 1 },
    adversarialReview: "ACCEPT_SAFE",
    review: "gemma4 + revision propia",
  },
  {
    candidateId: "SAFE-03-PF-9543",
    type: "ALIAS",
    cluster: "peones forestales",
    rawTitles: ["PEONES FORESTALES"],
    offerCount: 3,
    proposedCnoCode: "9543",
    proposedCnoTitle: "Peones forestales y de la caza",
    aliasForOccupation: "occupation:cno11:9543",
    existingFpCnoLink: "AGA03B (Aprovechamientos Forestales)",
    evidenceType: "Correspondencia oficial INE CNO-94->CNO-11 (1:1 del codigo origen)",
    evidenceSource: "INE",
    evidenceUrl: INE_CORR,
    evidenceQuote: "CNO94=9440 'Peones forestales' (FREC94=1) -> CNO11=9543 'Peones forestales y de la caza'",
    evidenceExplanation: "El titulo de oferta reproduce la rubrica CNO-94 9440, que la tabla oficial INE traduce a un unico codigo CNO-11 (9543). El receptor 9543 recibe tambien 9450 (pesca), pero la oferta dice 'forestales', no 'pesca'.",
    whyUnambiguous: "Direccion origen->destino 1:1 en la tabla oficial.",
    possibleAlternativeCnos: ["9543 via 9450 'Peones de la pesca'"],
    whyAlternativesRejected: "No aplica: el titulo fuente es 9440 (forestales); la oferta no menciona pesca y el codigo CNO-94 pesquero tiene su propia rubrica.",
    impact: { offersUnlocked: 3, newRelationsWithOffers: 1, newProgramsWithOffers: 1, newFamiliesWithOffers: 1, newCnoRepresented: 1 },
    adversarialReview: "ACCEPT_SAFE",
    review: "gemma4 + revision propia",
  },
  {
    candidateId: "SAFE-04-PA-9530",
    type: "ALIAS",
    cluster: "peones agropecuarios",
    rawTitles: ["PEONES AGROPECUARIOS"],
    offerCount: 1,
    proposedCnoCode: "9530",
    proposedCnoTitle: "Peones agropecuarios",
    aliasForOccupation: "occupation:cno11:9530",
    existingFpCnoLink: "AGA03B (Aprovechamientos Forestales)",
    evidenceType: "Titulo oficial CNO-11 identico + correspondencia 1:1",
    evidenceSource: "BOE RD 1591/2010 + INE",
    evidenceUrl: BOE_CNO,
    evidenceQuote: "9530: 'Peones agropecuarios'",
    evidenceUrl2: INE_CORR,
    evidenceQuote2: "CNO94=9430 'Peones agropecuarios' (FREC94=1) -> CNO11=9530 (FREC11=1)",
    evidenceExplanation: "Identidad de rubrica oficial y correspondencia 1:1.",
    whyUnambiguous: "Unica categoria con esa rubrica; notas 9530 la delimitan frente a 9511/9512 (peones agricolas) y 9520 (peones ganaderos).",
    possibleAlternativeCnos: ["9511", "9512", "9520"],
    whyAlternativesRejected: "Rubricas oficiales distintas (agricolas vs ganaderos); 9530 es la categoria mixta explicita.",
    impact: { offersUnlocked: 1, newRelationsWithOffers: 1, newProgramsWithOffers: 0, newFamiliesWithOffers: 0, newCnoRepresented: 1 },
    adversarialReview: "ACCEPT_SAFE",
    review: "gemma4 + revision propia",
  },
  {
    candidateId: "SAFE-05-ME-7191",
    type: "ALIAS",
    cluster: "mantenedores de edificios",
    rawTitles: ["MANTENEDORES DE EDIFICIOS"],
    offerCount: 1,
    proposedCnoCode: "7191",
    proposedCnoTitle: "Mantenedores de edificios",
    aliasForOccupation: "occupation:cno11:7191",
    existingFpCnoLink: "EOC01B (Reforma y Mantenimiento de Edificios)",
    evidenceType: "Titulo oficial CNO-11 identico (RD 1591/2010 / nomenclatura INE) + exclusion explicita desde 7121",
    evidenceSource: "BOE RD 1591/2010 + INE",
    evidenceUrl: BOE_CNO,
    evidenceQuote: "7191: 'Mantenedores de edificios'",
    evidenceUrl2: INE_NOTAS,
    evidenceQuote2: "Grupo 7121 (Albaniles), 'Ocupaciones afines no incluidas en este grupo primario: Mantenedores de edificios, 7191'",
    evidenceExplanation: "La rubrica de la oferta es literalmente la categoria oficial 7191, y la nomenclatura separa expresamente 7191 de 7121.",
    whyUnambiguous: "Identidad total de rubrica oficial; sin otras categorias con esa denominacion.",
    possibleAlternativeCnos: ["7121 'Albaniles'", "5831 supervisores mantenimiento y limpieza"],
    whyAlternativesRejected: "Las notas oficiales excluyen 7191 de 7121; 5831 es rubrica distinta (supervisores).",
    impact: { offersUnlocked: 1, newRelationsWithOffers: 1, newProgramsWithOffers: 0, newFamiliesWithOffers: 0, newCnoRepresented: 1 },
    adversarialReview: "ACCEPT_SAFE",
    review: "gemma4 + revision propia",
  },
];

interface Cluster {
  foldKey: string;
  rawVariants: string[];
  offerCount: number;
  sampleOfferIds: string[];
  provinces: string[];
}

async function main() {
  const [clusters, candidatesOld] = await Promise.all([
    readJson(resolve(OUT_DIR, "unmatched-title-clusters.json")),
    readJson(resolve(OUT_DIR, "coverage-candidates.json")),
  ]);
  const list = (clusters as { clusterList: Cluster[] }).clusterList;
  const safeIds = new Set(SAFE.map((s) => s.candidateId));
  void safeIds;

  const classByFold = new Map<string, { cls: string; target: string | null; note: string }>([
    ["asistentes domiciliarios", { cls: "SAFE", target: "5710", note: "SAFE-01" }],
    ["peones de la construccion de edificios", { cls: "SAFE", target: "9602", note: "SAFE-02" }],
    ["peones forestales", { cls: "SAFE", target: "9543", note: "SAFE-03" }],
    ["peones agropecuarios", { cls: "SAFE", target: "9530", note: "SAFE-04" }],
    ["mantenedores de edificios", { cls: "SAFE", target: "7191", note: "SAFE-05" }],
    ["albaniles", { cls: "AMBIGUOUS", target: "7121", note: "Auditado oferta a oferta por el proyecto (fp_one_word_publication_reviews): publicacion RECHAZADA (2/22 contradictorias); alias de un solo token" }],
    ["auxiliares de enfermerio", { cls: "AMBIGUOUS", target: "5611|5612", note: "union de dos categorias oficiales" }],
    ["cuidadores de personos con discapacidad y o dependencio en institution", { cls: "AMBIGUOUS", target: "5611|5629", note: "entorno institucional con supervision -> notas INE" }],
    ["cocineros en general", { cls: "NO_EVIDENCE", target: "5110", note: "rubrica oficial 'Cocineros asalariados'; etiqueta estilo CNO-96 sin concordancia oficial disponible" }],
    ["camareros en general", { cls: "NO_EVIDENCE", target: "5120", note: "rubrica oficial 'Camareros asalariados'" }],
    ["pinches de cocino", { cls: "NO_EVIDENCE", target: "9310", note: "rubrica oficial 'Ayudantes de cocina'" }],
    ["peones agricolos en general", { cls: "AMBIGUOUS", target: "9511|9512", note: "particion oficial" }],
    ["mecanicos de mantenimiento y reparacion de automocion en general", { cls: "NO_EVIDENCE", target: "7401", note: "rubrica oficial distinta" }],
    ["terapeutos ocupacionales", { cls: "REJECT", target: "2156", note: "profesion universitaria, sin programa FP: no desbloquea FP-CNO" }],
    ["enfermeros de cuidados generales", { cls: "REJECT", target: "2121", note: "profesion universitaria" }],
    ["fisioterapeutos en general", { cls: "REJECT", target: "2152", note: "profesion universitaria" }],
    ["medicos medicino general", { cls: "REJECT", target: "2201", note: "profesion universitaria" }],
    ["personal de limpiezo o limpiadores en general", { cls: "AMBIGUOUS", target: "9210|9229", note: "union; ni siquiera vinculada a FP" }],
    ["conductores de camion en general", { cls: "NO_EVIDENCE", target: "8432", note: "rubrica oficial distinta; 8432 ademas no vinculada" }],
    ["empleados administrativos en general", { cls: "AMBIGUOUS", target: null, note: "sin rubrica CNO-11 equivalente unica" }],
    ["peones ganaderos en general", { cls: "NO_EVIDENCE", target: "9520", note: "9520 unica tras quitar 'en general' pero no esta en catalogo revisado ni vinculada a FP" }],
  ]);

  const merged = list.map((c) => {
    const hit = classByFold.get(c.foldKey);
    return {
      candidateId: `CAND:${c.foldKey.replace(/\s+/gu, "_")}`.slice(0, 72),
      cluster: c.foldKey,
      rawTitles: c.rawVariants,
      offerCount: c.offerCount,
      totalProvinces: c.provinces.length,
      sampleOfferIds: c.sampleOfferIds,
      classification: hit?.cls ?? "NO_EVIDENCE",
      proposedTargetCno: hit?.target ?? null,
      note: hit?.note ?? "sin evidencia de rubrica oficial que la vincule a un CNO con FP",
    };
  });
  merged.sort(
    (a, b) =>
      b.offerCount - a.offerCount ||
      (a.cluster < b.cluster ? -1 : 1),
  );
  await writeFile(
    resolve(OUT_DIR, "coverage-candidates.json"),
    JSON.stringify({ snapshotId: SNAPSHOT, totalClusters: merged.length, candidates: merged }, null, 2),
    "utf8",
  );
  void candidatesOld;

  await writeFile(
    resolve(OUT_DIR, "coverage-safe.json"),
    JSON.stringify({ snapshotId: SNAPSHOT, safeCandidates: SAFE, totals: { aliases: 5, fpCnoRelations: 0, offersUnlocked: 67 } }, null, 2),
    "utf8",
  );

  const counts: Record<string, number> = {};
  for (const m of merged) counts[m.classification] = (counts[m.classification] ?? 0) + 1;
  console.log(counts, "top100 threshold offers:", merged[99]?.offerCount);
}
void main();
