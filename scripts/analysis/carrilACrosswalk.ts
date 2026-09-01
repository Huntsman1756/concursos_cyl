import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require(
  "C:/Users/rome_/AppData/Local/Temp/opencode/node_modules/xlsx",
) as {
  readFile: (f: string) => { SheetNames: string[]; Sheets: Record<string, unknown> };
  utils: {
    sheet_to_json: (
      ws: unknown,
      opts: { header: 1 },
    ) => (string | number | null)[][];
  };
};

const SNAPSHOT = "20260822085631889-7bbe69380f6d";
const OUT_DIR = "analysis/carril_a_20260827";
const CORR_XLSX =
  "C:/Users/rome_/AppData/Local/Temp/opencode/corr94.xls";
export const CORRESPONDENCE_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_correspcno94.xls";
export const STRUCTURE_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_estructura.xls";
export const NOTAS_URL =
  "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf";

async function readJson(path: string): Promise<unknown> {
  const full = isAbsolute(path) ? path : resolve(process.cwd(), path);
  return JSON.parse(await readFile(full, "utf8")) as unknown;
}

function snap(name: string): string {
  return resolve(process.cwd(), `public/data/v1/snapshots/${SNAPSHOT}/${name}`);
}

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function foldGender(normalized: string): string {
  return normalized
    .split(" ")
    .map((t) => {
      if (t.length >= 5 && t.endsWith("as")) return `${t.slice(0, -2)}os`;
      if (t.length >= 4 && t.endsWith("a")) return `${t.slice(0, -1)}o`;
      return t;
    })
    .join(" ");
}

interface Row {
  cno94: string;
  titulo94: string;
  cno11: string;
  titulo11: string;
}

export interface CrosswalkCandidate {
  foldKey: string;
  rawTitles: string[];
  offerCount: number;
  provinces: string[];
  sampleOfferIds: string[];
  cno94Titles: string[];
  cno94Codes: string[];
  cno11Codes: string[];
  cno11Title: string | null;
  uniqueMapping: boolean;
  reviewedOccupation: boolean;
  typeAPrograms: string[];
}

export async function crosswalkCandidates(): Promise<{
  candidates: CrosswalkCandidate[];
  unmatchedToCorrespondence: number;
  totalClusters: number;
}> {
  const wb = XLSX.readFile(CORR_XLSX);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["Hoja1"], { header: 1 });
  const parsed: Row[] = [];
  for (const r of rows) {
    const a = String(r[0] ?? "");
    const b = String(r[1] ?? "");
    const d = String(r[3] ?? "");
    const e = String(r[4] ?? "");
    if (!/^\d{4}$/u.test(a) || !/^\d{4}$/u.test(d)) continue;
    parsed.push({ cno94: a, titulo94: b, cno11: d, titulo11: e });
  }

  const byTitle94 = new Map<string, Row[]>();
  for (const row of parsed) {
    const key = foldGender(norm(row.titulo94));
    const b = byTitle94.get(key) ?? [];
    b.push(row);
    byTitle94.set(key, b);
  }

  const [clustersArtifact, occupations, links] = await Promise.all([
    readJson(resolve(OUT_DIR, "unmatched-title-clusters.json")),
    readJson(snap("occupations.json")),
    readJson(snap("training-occupation-links.json")),
  ]);
  const clusters = (
    clustersArtifact as {
      clusterList: {
        foldKey: string;
        normalizedVariants: string[];
        rawVariants: string[];
        offerCount: number;
        sampleOfferIds: string[];
        provinces: string[];
      }[];
    }
  ).clusterList;
  const approvedIds = new Set(
    (occupations as { occupationId: string; reviewStatus: string }[])
      .filter((o) => o.reviewStatus === "approved")
      .map((o) => o.occupationId),
  );
  const programsByCno = new Map<string, string[]>();
  for (const l of links as {
    trainingProgramKey: string;
    occupationId: string;
    reviewStatus: string;
  }[]) {
    if (l.reviewStatus !== "approved" || !approvedIds.has(l.occupationId))
      continue;
    const code = l.occupationId.replace("occupation:cno11:", "");
    const b = programsByCno.get(code) ?? [];
    if (!b.includes(l.trainingProgramKey)) b.push(l.trainingProgramKey);
    programsByCno.set(code, b);
  }

  const candidates: CrosswalkCandidate[] = [];
  let matchedClusters = 0;
  for (const c of clusters) {
    for (const nv of c.normalizedVariants) {
      const rows = byTitle94.get(foldGender(nv));
      if (!rows || rows.length === 0) continue;
      matchedClusters += 1;
      const cno94Codes = [...new Set(rows.map((r) => r.cno94))].sort();
      const cno11Codes = [...new Set(rows.map((r) => r.cno11))].sort();
      const cno94Titles = [...new Set(rows.map((r) => r.titulo94))];
      candidates.push({
        foldKey: c.foldKey,
        rawTitles: c.rawVariants,
        offerCount: c.offerCount,
        provinces: c.provinces,
        sampleOfferIds: c.sampleOfferIds,
        cno94Titles,
        cno94Codes,
        cno11Codes,
        cno11Title: rows[0].titulo11,
        uniqueMapping: cno11Codes.length === 1,
        reviewedOccupation:
          cno11Codes.length === 1 &&
          approvedIds.has(`occupation:cno11:${cno11Codes[0]}`),
        typeAPrograms:
          cno11Codes.length === 1
            ? programsByCno.get(cno11Codes[0]) ?? []
            : [],
      });
      break;
    }
  }
  candidates.sort((a, b) => b.offerCount - a.offerCount);
  return {
    candidates,
    unmatchedToCorrespondence: clusters.length - matchedClusters,
    totalClusters: clusters.length,
  };
}

if (process.argv[1]?.includes("carrilACrosswalk")) {
  const out = await crosswalkCandidates();
  await writeFile(
    resolve(OUT_DIR, "crosswalk-candidates.json"),
    JSON.stringify({ ...out, correspondenceUrl: CORRESPONDENCE_URL }, null, 2),
    "utf8",
  );
  console.log(
    `clusters=${out.totalClusters} withCno94Title=${out.candidates.length} without=${out.unmatchedToCorrespondence}`,
  );
  for (const x of out.candidates) {
    const tag = !x.uniqueMapping
      ? "MULTI"
      : x.typeAPrograms.length > 0
        ? "TYPE-A"
        : x.reviewedOccupation
          ? "REV-B"
          : "NOTREV";
    console.log(
      `${String(x.offerCount).padStart(3)} | ${tag.padEnd(6)} | 94:${x.cno94Codes.join("/")} -> 11:${x.cno11Codes.join("/")} | ${x.cno11Title?.slice(0, 45)} | A:[${x.typeAPrograms.join(",")}] | ${x.rawTitles[0].slice(0, 45)}`,
    );
  }
}
