import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const SNAPSHOT = "20260822085631889-7bbe69380f6d";
const OUT_DIR = "analysis/carril_a_20260827";

async function readJson(path: string): Promise<unknown> {
  const full = isAbsolute(path) ? path : resolve(process.cwd(), path);
  return JSON.parse(await readFile(full, "utf8")) as unknown;
}

function snap(name: string): string {
  return resolve(process.cwd(), `public/data/v1/snapshots/${SNAPSHOT}/${name}`);
}

const NON_SAFE_WITH_LINKED_TARGET = [
  { foldKey: "cuidadores de personos con discapacidad y o dependencio en instituciones", target: "5629", klass: "AMBIGUOUS", reason: "institutional supervised care routes to 5611/5629 per INE note; title does not disambiguate" },
  { foldKey: "auxiliares de enfermerio", target: "5611", klass: "AMBIGUOUS", reason: "bare title is union of 5611/5612" },
  { foldKey: "cocineros en general", target: "5110", klass: "NO_EVIDENCE", reason: "official title is 'Cocineros asalariados'; CNO-96-style label; no official concordance" },
  { foldKey: "albaniles", target: "7121", klass: "AMBIGUOUS", reason: "exact CNO-11 title, but project one-word audit rejected publication (2/22 contradictory offers); single-token" },
  { foldKey: "camareros en general", target: "5120", klass: "NO_EVIDENCE", reason: "official title 'Camareros asalariados'" },
  { foldKey: "peones agricolos en general", target: "9511", klass: "AMBIGUOUS", reason: "CNO-11 splits into 9511/9512" },
  { foldKey: "pinches de cocino", target: "9310", klass: "NO_EVIDENCE", reason: "official title 'Ayudantes de cocina'" },
  { foldKey: "mecanicos de mantenimiento y reparacion de automocion en general", target: "7401", klass: "NO_EVIDENCE", reason: "official title 'Mecanicos y ajustadores de vehiculos de motor'" },
];

async function main() {
  const [clustersArtifact, links, occupations, programsCatalog] =
    await Promise.all([
      readJson(resolve(OUT_DIR, "unmatched-title-clusters.json")),
      readJson(snap("training-occupation-links.json")),
      readJson(snap("occupations.json")),
      readJson(snap("programs.json")),
    ]);
  const clusters = (
    clustersArtifact as {
      clusterList: {
        foldKey: string;
        offerCount: number;
        rawVariants: string[];
        provinces: string[];
      }[];
    }
  ).clusterList;
  const byFold = new Map(clusters.map((c) => [c.foldKey, c]));
  const approvedIds = new Set(
    (occupations as { occupationId: string; reviewStatus: string }[])
      .filter((o) => o.reviewStatus === "approved")
      .map((o) => o.occupationId.replace("occupation:cno11:", "")),
  );
  const progsByCno = new Map<string, string[]>();
  for (const l of links as { trainingProgramKey: string; occupationId: string }[]) {
    const code = l.occupationId.replace("occupation:cno11:", "");
    if (!approvedIds.has(code)) continue;
    const b = progsByCno.get(code) ?? [];
    if (!b.includes(l.trainingProgramKey)) b.push(l.trainingProgramKey);
    progsByCno.set(code, b);
  }
  const familyOf = new Map(
    (
      programsCatalog as { programKey: string; familyCode: string }[]
    ).map((p) => [p.programKey, p.familyCode]),
  );

  const rows = NON_SAFE_WITH_LINKED_TARGET.map((e) => {
    const c = byFold.get(e.foldKey);
    if (!c) {
      console.log("MISSING:", e.foldKey, "| have:", [...byFold.keys()].filter((k) => k.startsWith(e.foldKey.slice(0, 12))).join(" ; "));
    }
    const targetPrograms = progsByCno.get(e.target) ?? [];
    return { ...e, offerCount: c?.offerCount ?? 0, rawTitle: c?.rawVariants[0] ?? "?", provinces: c?.provinces.length ?? 0, targetPrograms, linked: targetPrograms.length > 0 };
  });

  const linkedRows = rows.filter((r) => r.linked);
  const touchedPrograms = [...new Set(linkedRows.flatMap((r) => r.targetPrograms))];
  const families = [...new Set(touchedPrograms.map((p) => familyOf.get(p) ?? "?"))];
  const out = {
    snapshotId: SNAPSHOT,
    note: "Theoretical NON-SAFE ceiling: what would unlock if AMBIGUOUS/NO_EVIDENCE candidates targeting ALREADY-LINKED CNOs were accepted. NOT recommended.",
    rows,
    totals: {
      offersIfAccepted: linkedRows.reduce((s, r) => s + r.offerCount, 0),
      programsTouched: touchedPrograms.sort(),
      familiesTouched: families.sort(),
    },
  };
  await writeFile(
    resolve(OUT_DIR, "coverage-ambiguous.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  for (const r of rows) console.log(`${String(r.offerCount).padStart(3)} | ${r.klass.padEnd(11)} | ${r.target} -> [${r.targetPrograms.join(",")}] | ${r.rawTitle.slice(0, 55)}`);
  console.log(JSON.stringify(out.totals));
}
void main();
