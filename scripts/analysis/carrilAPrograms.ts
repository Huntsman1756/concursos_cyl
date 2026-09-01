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

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function foldGender(n: string): string {
  return n
    .split(" ")
    .map((t) => {
      if (t.length >= 5 && t.endsWith("as")) return `${t.slice(0, -2)}os`;
      if (t.length >= 4 && t.endsWith("a")) return `${t.slice(0, -1)}o`;
      return t;
    })
    .join(" ");
}

async function main() {
  const [links, occupations, programs, profiles, official] =
    await Promise.all([
      readJson(snap("training-occupation-links.json")),
      readJson(snap("occupations.json")),
      readJson(snap("programs.json")),
      readJson(snap("professional-profiles.json")),
      readJson(snap("official-occupations.json")),
    ]);
  const covered = new Set(
    (links as { trainingProgramKey: string }[]).map(
      (l) => l.trainingProgramKey,
    ),
  );
  const approvedIds = new Set(
    (occupations as { occupationId: string; reviewStatus: string }[])
      .filter((o) => o.reviewStatus === "approved")
      .map((o) => o.occupationId.replace("occupation:cno11:", "")),
  );
  const officialByFold = new Map<string, string[]>();
  for (const o of official as { classificationCode: string; preferredLabel: string }[]) {
    const k = foldGender(norm(o.preferredLabel));
    const b = officialByFold.get(k) ?? [];
    if (!b.includes(o.classificationCode)) b.push(o.classificationCode);
    officialByFold.set(k, b);
  }
  const uncovered = (programs as { programKey: string; programTitle: string; familyCode: string }[]).filter(
    (p) => !covered.has(p.programKey),
  );
  const profileList = profiles as {
    programKey: string;
    outputLabel: string;
    sourceUrl: string;
    officialTitle: string;
  }[];
  const rows: unknown[] = [];
  for (const p of uncovered) {
    const ps = profileList.filter((x) => x.programKey === p.programKey);
    const hits: string[] = [];
    for (const prof of ps) {
      const k = foldGender(norm(prof.outputLabel.replace(/\.$/u, "")));
      const codes = officialByFold.get(k) ?? [];
      for (const code of codes) {
        hits.push(`${code} <- "${prof.outputLabel}"${approvedIds.has(code) ? " (reviewed)" : " (NOT reviewed)"}`);
      }
    }
    rows.push({
      programKey: p.programKey,
      familyCode: p.familyCode,
      profileOutputs: ps.length,
      officialTitleExactHits: [...new Set(hits)],
    });
  }
  await writeFile(
    resolve(OUT_DIR, "program-uncovered-scan.json"),
    JSON.stringify({ snapshotId: SNAPSHOT, uncoveredCount: uncovered.length, rows }, null, 2),
    "utf8",
  );
  for (const r of rows as { programKey: string; officialTitleExactHits: string[] }[]) {
    if (r.officialTitleExactHits.length > 0)
      console.log(r.programKey, "=>", r.officialTitleExactHits.join(" ; "));
  }
  console.log("programs with 0 exact official-title hits from TodoFP outputs:", (rows as { officialTitleExactHits: string[] }[]).filter((r) => r.officialTitleExactHits.length === 0).length, "of", rows.length);
}
void main();
