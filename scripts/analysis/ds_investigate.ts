import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SNAP = "public/data/v1/snapshots/20260822085631889-7bbe69380f6d";
const r = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), `${SNAP}/${p}`), "utf8"));

const offers: any[] = r("job-offers.json");
const links: any[] = r("training-occupation-links.json").filter((x: any) => x.reviewStatus === "approved");
const occupations: any[] = r("occupations.json");
const programs: any[] = r("programs.json");
const aliases: any[] = r("occupation-aliases.json").filter((x: any) => x.reviewStatus === "approved");

const approvedOcc = new Set(occupations.filter((o: any) => o.reviewStatus === "approved").map((o: any) => o.occupationId));
const progsByCno = new Map<string, Set<string>>();
for (const l of links) {
  if (!approvedOcc.has(l.occupationId)) continue;
  const c = l.occupationId.replace("occupation:cno11:", "");
  if (!progsByCno.has(c)) progsByCno.set(c, new Set());
  progsByCno.get(c)!.add(l.trainingProgramKey);
}
const famOf = new Map(programs.map((p: any) => [p.programKey, p.familyCode]));
const cityOf = new Map(offers.map((o: any) => [o.id, o.province]));

function norm(v: string) {
  return v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ").replace(/\s+/gu, " ").trim();
}
function bounded(text: string, phrase: string) {
  return ` ${text} `.includes(` ${phrase} `);
}

interface Cand { id: string; code: string; alias: string; expected: string[] }
const cands: Cand[] = [
  { id: "01-AD-5710", code: "5710", alias: "asistentes domiciliarios", expected: ["ASISTENTES DOMICILIARIOS"] },
  { id: "02-PC-9602", code: "9602", alias: "peones de la construccion de edificios", expected: ["PEONES DE LA CONSTRUCCIÓN DE EDIFICIOS"] },
  { id: "03-PF-9543", code: "9543", alias: "peones forestales", expected: ["PEONES FORESTALES"] },
  { id: "04-PA-9530", code: "9530", alias: "peones agropecuarios", expected: ["PEONES AGROPECUARIOS"] },
  { id: "05-ME-7191", code: "7191", alias: "mantenedores de edificios", expected: ["MANTENEDORES DE EDIFICIOS"] },
  { id: "06-PC-9310", code: "9310", alias: "pinches de cocina", expected: ["PINCHES DE COCINA"] },
  { id: "07-MA-7401", code: "7401", alias: "mecanicos de mantenimiento y reparacion de automocion en general", expected: ["MECÁNICOS DE MANTENIMIENTO Y REPARACIÓN DE AUTOMOCIÓN, EN GENERAL"] },
  { id: "08-AC-3510", code: "3510", alias: "agentes comerciales", expected: ["AGENTES COMERCIALES"] },
  { id: "09-CA-5500", code: "5500", alias: "cajeros de comercio", expected: ["CAJEROS DE COMERCIO"] },
  { id: "10-MC-7401", code: "7401", alias: "mecanicos-ajustadores de camiones y autobuses en general", expected: ["MECÁNICOS-AJUSTADORES DE CAMIONES Y AUTOBUSES, EN GENERAL"] },
  { id: "11-PE-5811", code: "5811", alias: "peluqueros unisex", expected: ["PELUQUEROS UNISEX"] },
  { id: "12-CS-5120", code: "5120", alias: "camareros de sala o jefes de rango", expected: ["CAMAREROS DE SALA O JEFES DE RANGO"] },
  { id: "13-AC-4111", code: "4111", alias: "empleados administrativos de contabilidad en general", expected: ["EMPLEADOS ADMINISTRATIVOS DE CONTABILIDAD, EN GENERAL"] },
  { id: "14-ES-5812", code: "5812", alias: "esteticistas", expected: ["ESTETICISTAS"] },
  { id: "15-JA-6120", code: "6120", alias: "jardineros en general", expected: ["JARDINEROS, EN GENERAL"] },
  { id: "16-FV-5894", code: "5894", alias: "profesores de formacion vial", expected: ["PROFESORES DE FORMACIÓN VIAL"] },
];

for (const c of cands) {
  const cph = norm(c.alias);
  const hits = offers.filter((o) => bounded(norm(o.title), cph));
  const expectedSet = new Set(c.expected.map((e) => norm(e)));
  const foreign = hits.filter((o) => !expectedSet.has(norm(o.title)));
  const provs = [...new Set(hits.map((o) => o.province))];
  const progs = progsByCno.get(c.code) ? [...progsByCno.get(c.code)!] : [];
  const fams = [...new Set(progs.map((p) => famOf.get(p)))];
  console.log(
    `\n### ${c.id} ${c.alias} -> CNO ${c.code}\n` +
    `expected cluster offers: ${hits.filter((o)=>expectedSet.has(norm(o.title))).length}\n` +
    `TOTAL phrase hits across 1058: ${hits.length}\n` +
    `foreign-title hits (FALSE POSITIVE risk): ${foreign.length}\n` +
    `foreign titles: ${[...new Set(foreign.map(o=>o.title))].join(' | ') || 'none'}\n` +
    `provinces: ${provs.join(',')}\n` +
    `linked programs: ${progs.join(',')} (${progs.length})\n` +
    `families: ${fams.join(',')}\n`
  );
}
