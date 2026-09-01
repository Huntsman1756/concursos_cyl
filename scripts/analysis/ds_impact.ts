import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const SNAP = "public/data/v1/snapshots/20260822085631889-7bbe69380f6d";
const r = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), `${SNAP}/${p}`), "utf8"));
const offers: any[] = r("job-offers.json");
const links: any[] = r("training-occupation-links.json").filter((x: any) => x.reviewStatus === "approved");
const occupations: any[] = r("occupations.json");
const programs: any[] = r("programs.json");
const approvedOcc = new Set(occupations.filter((o: any) => o.reviewStatus === "approved").map((o: any) => o.occupationId));
const famOf = new Map(programs.map((p: any) => [p.programKey, p.familyCode]));
function norm(v: string) { return v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, " ").replace(/\s+/gu, " ").trim(); }
function bounded(t: string, p: string) { return ` ${t} `.includes(` ${p} `); }

const groups: Record<string, { alias: string; code: string }[]> = {
  STRONG: [
    { alias: "asistentes domiciliarios", code: "5710" },
    { alias: "peones de la construccion de edificios", code: "9602" },
    { alias: "peones forestales", code: "9543" },
    { alias: "peones agropecuarios", code: "9530" },
    { alias: "mantenedores de edificios", code: "7191" },
    { alias: "pinches de cocina", code: "9310" },
    { alias: "agentes comerciales", code: "3510" },
    { alias: "cajeros de comercio", code: "5500" },
  ],
  WEAK: [
    { alias: "mecanicos de mantenimiento y reparacion de automocion en general", code: "7401" },
    { alias: "mecanicos-ajustadores de camiones y autobuses en general", code: "7401" },
    { alias: "peluqueros unisex", code: "5811" },
    { alias: "camareros de sala o jefes de rango", code: "5120" },
    { alias: "empleados administrativos de contabilidad en general", code: "4111" },
    { alias: "esteticistas", code: "5812" },
    { alias: "jardineros en general", code: "6120" },
    { alias: "profesores de formacion vial", code: "5894" },
  ],
};

function impact(cands: { alias: string; code: string }[]) {
  const matchedOffers = new Set<string>();
  const relations = new Set<string>(); // programKey|code
  for (const c of cands) {
    const phrase = norm(c.alias);
    const cno = "occupation:cno11:" + c.code;
    if (!approvedOcc.has(cno)) continue;
    const progs = links.filter((l) => l.occupationId === cno).map((l) => l.trainingProgramKey);
    const hits = offers.filter((o) => bounded(norm(o.title), phrase));
    for (const o of hits) matchedOffers.add(o.id);
    for (const p of progs) relations.add(`${p}|${c.code}`);
  }
  const progs = new Set([...relations].map((x) => x.split("|")[0]));
  const fams = [...new Set([...progs].map((p) => famOf.get(p)))];
  const cnos = new Set([...relations].map((x) => x.split("|")[1]));
  const provs = new Set(offers.filter((o) => matchedOffers.has(o.id)).map((o) => o.province));
  return { offers: matchedOffers.size, relations: relations.size, programs: progs.size, families: fams.filter(Boolean).length, cnos: cnos.size, provinces: provs.size, provList: [...provs].join(",") };
}

for (const g of ["STRONG", "WEAK"]) {
  const inc = impact(groups[g]);
  const both = impact([...groups.STRONG, ...groups.WEAK]);
  console.log(`\n== ${g} incremental ==`); console.log(JSON.stringify(inc, null, 2));
  if (g === "STRONG") console.log("\n== STRONG+WEAK combined ==\n" + JSON.stringify(both, null, 2));
}
// standalone STRONG total numbers
const s = impact(groups.STRONG);
console.log("\nSTRONG matched offers total: " + s.offers);
