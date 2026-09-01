import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const SNAP = "public/data/v1/snapshots/20260822085631889-7bbe69380f6d";
const r = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), `${SNAP}/${p}`), "utf8"));
const offers: any[] = r("job-offers.json");

const clusters: [string, string[]][] = [
  ["06 PINCHES DE COCINA", ["PINCHES DE COCINA"]],
  ["07 AUTOMOCION", ["MECÁNICOS DE MANTENIMIENTO Y REPARACIÓN DE AUTOMOCIÓN, EN GENERAL"]],
  ["08 AGENTES COMERCIALES", ["AGENTES COMERCIALES"]],
  ["09 CAJEROS DE COMERCIO", ["CAJEROS DE COMERCIO"]],
  ["10 CAMIONES", ["MECÁNICOS-AJUSTADORES DE CAMIONES Y AUTOBUSES, EN GENERAL"]],
  ["11 PELUQUEROS UNISEX", ["PELUQUEROS UNISEX"]],
  ["12 CAMAREROS DE SALA", ["CAMAREROS DE SALA O JEFES DE RANGO"]],
  ["13 ADMIN CONTABILIDAD", ["EMPLEADOS ADMINISTRATIVOS DE CONTABILIDAD, EN GENERAL"]],
  ["14 ESTETICISTAS", ["ESTETICISTAS"]],
  ["15 JARDINEROS", ["JARDINEROS, EN GENERAL"]],
  ["16 FORMACION VIAL", ["PROFESORES DE FORMACIÓN VIAL"]],
];
for (const [label, titles] of clusters) {
  console.log("\n========= " + label + " =========");
  for (const o of offers) {
    if (titles.includes(o.title)) {
      const fn = (o.descriptionSections?.functions || []).join(" | ");
      const req = (o.descriptionSections?.requirements || []).join(" | ");
      console.log(`- [${o.province}] ${o.id} | ${o.title}`);
      if (fn) console.log(`    FUNC: ${fn.slice(0, 260)}`);
      if (req) console.log(`    REQ : ${req.slice(0, 160)}`);
    }
  }
}
