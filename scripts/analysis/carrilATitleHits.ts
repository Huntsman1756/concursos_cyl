import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

const SNAPSHOT = "20260822085631889-7bbe69380f6d";
const OUT_DIR = "analysis/carril_a_20260827";

async function readJson(path: string): Promise<unknown> {
  const full = isAbsolute(path)
    ? path
    : resolve(process.cwd(), path);
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

async function main() {
  const [clustersArtifact, official, links, occupations] = await Promise.all([
    readJson(resolve(OUT_DIR, "unmatched-title-clusters.json")),
    readJson(snap("official-occupations.json")),
    readJson(snap("training-occupation-links.json")),
    readJson(snap("occupations.json")),
  ]);

  const clusters = (
    clustersArtifact as {
      clusterList: {
        foldKey: string;
        representativeTitle: string;
        normalizedVariants: string[];
        rawVariants: string[];
        offerCount: number;
        sampleOfferIds: string[];
        provinces: string[];
      }[];
    }
  ).clusterList;

  const officials = official as {
    classificationCode: string;
    preferredLabel: string;
  }[];
  const foldOfficial = new Map<string, { code: string; label: string }[]>();
  for (const o of officials) {
    const key = foldGender(norm(o.preferredLabel));
    const b = foldOfficial.get(key) ?? [];
    if (!b.some((x) => x.code === o.classificationCode))
      b.push({ code: o.classificationCode, label: o.preferredLabel });
    foldOfficial.set(key, b);
  }

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

  const results: {
    foldKey: string;
    rawTitles: string[];
    offerCount: number;
    provinces: string[];
    sampleOfferIds: string[];
    rule: string;
    cnoCodes: string[];
    officialLabels: string[];
    uniqueCode: boolean;
    typeAPrograms: string[];
    typeB: boolean;
  }[] = [];
  for (const c of clusters) {
    let rule: "R1_exact" | "R2_en_general" | null = null;
    let hits: { code: string; label: string }[] = [];
    for (const nv of c.normalizedVariants) {
      const folded = foldGender(nv);
      const exact = foldOfficial.get(folded);
      if (exact && exact.length >= 1) {
        rule = "R1_exact";
        hits = exact;
        break;
      }
      const stripped = folded.replace(/\s+en general$/u, "");
      if (stripped !== folded) {
        const hit2 = foldOfficial.get(stripped);
        if (hit2 && hit2.length >= 1) {
          rule = "R2_en_general";
          hits = hit2;
          break;
        }
      }
    }
    if (rule === null) continue;
    const codes = [...new Set(hits.map((h) => h.code))];
    results.push({
      foldKey: c.foldKey,
      rawTitles: c.rawVariants,
      offerCount: c.offerCount,
      provinces: c.provinces,
      sampleOfferIds: c.sampleOfferIds,
      rule,
      cnoCodes: codes,
      officialLabels: hits.map((h) => h.label),
      uniqueCode: codes.length === 1,
      typeAPrograms: codes.flatMap((code) => programsByCno.get(code) ?? []),
      typeB:
        codes.length === 1 && (programsByCno.get(codes[0]) ?? []).length === 0,
    });
  }

  results.sort((a, b) => b.offerCount - a.offerCount);
  await writeFile(
    resolve(OUT_DIR, "cno-title-hits.json"),
    JSON.stringify({ snapshotId: SNAPSHOT, results }, null, 2),
    "utf8",
  );
  for (const x of results) {
    console.log(
      `${String(x.offerCount).padStart(3)} | ${x.rule} | ${x.cnoCodes.join("/")} ${x.officialLabels[0]?.slice(0, 48)} | uniq:${x.uniqueCode} | A:[${x.typeAPrograms.join(",")}] | B:${x.typeB} | ${x.rawTitles[0].slice(0, 50)}`,
    );
  }
}

void main();
