import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SNAPSHOT = "20260822085631889-7bbe69380f6d";
const OUT_DIR = "analysis/carril_a_20260827";

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(
    await readFile(resolve(process.cwd(), path), "utf8"),
  ) as unknown;
}

function snap(name: string): string {
  return `public/data/v1/snapshots/${SNAPSHOT}/${name}`;
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

interface Candidate {
  candidateId: string;
  clusterFoldKey: string;
  rawTitles: string[];
  offerCount: number;
  provinces: string[];
  proposedCnoCode: string | null;
  proposedCnoTitle: string | null;
  matchKind:
    | "official_exact"
    | "official_singular_plural"
    | "none"
    | "ambiguous_multiple_official";
  ambiguousCodes?: string[];
  typeAExistingLink: boolean;
  linkedPrograms: string[];
  todoFpProgramMatches: { programKey: string; outputLabel: string }[];
  status: "UNREVIEWED";
}

async function main() {
  const [clustersArtifact, official, links, occupations, profiles] =
    await Promise.all([
      readJson(resolve(OUT_DIR, "unmatched-title-clusters.json")),
      readJson(snap("official-occupations.json")),
      readJson(snap("training-occupation-links.json")),
      readJson(snap("occupations.json")),
      readJson(snap("professional-profiles.json")),
    ]);

  const clusters = (clustersArtifact as { clusterList: unknown[] })
    .clusterList as {
    foldKey: string;
    representativeTitle: string;
    normalizedVariants: string[];
    rawVariants: string[];
    offerCount: number;
    sampleOfferIds: string[];
    provinces: string[];
  }[];

  const officials = official as {
    classificationCode: string;
    preferredLabel: string;
  }[];
  const officialByNorm = new Map<string, { code: string; label: string }[]>();
  for (const o of officials) {
    const key = norm(o.preferredLabel);
    const bucket = officialByNorm.get(key) ?? [];
    bucket.push({ code: o.classificationCode, label: o.preferredLabel });
    officialByNorm.set(key, bucket);
  }

  const approvedOccupationIds = new Set(
    (occupations as { occupationId: string; reviewStatus: string }[])
      .filter((o) => o.reviewStatus === "approved")
      .map((o) => o.occupationId),
  );
  const linkList = links as {
    trainingProgramKey: string;
    occupationId: string;
    reviewStatus: string;
  }[];
  const programsByCno = new Map<string, string[]>();
  for (const l of linkList) {
    if (l.reviewStatus !== "approved") continue;
    if (!approvedOccupationIds.has(l.occupationId)) continue;
    const code = l.occupationId.replace("occupation:cno11:", "");
    const bucket = programsByCno.get(code) ?? [];
    if (!bucket.includes(l.trainingProgramKey)) bucket.push(l.trainingProgramKey);
    programsByCno.set(code, bucket);
  }

  const profileList = profiles as {
    programKey: string;
    outputLabel: string;
  }[];
  const profileIndex = new Map<string, { programKey: string; outputLabel: string }[]>();
  for (const p of profileList) {
    const key = norm(p.outputLabel.replace(/\.$/u, ""));
    const bucket = profileIndex.get(key) ?? [];
    bucket.push({ programKey: p.programKey, outputLabel: p.outputLabel });
    profileIndex.set(key, bucket);
  }

  const candidates: Candidate[] = [];
  for (const c of clusters) {
    let matchKind: Candidate["matchKind"] = "none";
    let hits: { code: string; label: string }[] = [];
    for (const nv of c.normalizedVariants) {
      const exact = officialByNorm.get(norm(nv));
      if (exact && exact.length > 0) {
        matchKind = "official_exact";
        hits = exact;
        break;
      }
    }
    if (matchKind === "none") {
      outer: for (const nv of c.normalizedVariants) {
        const tokens = nv.split(" ");
        for (const alt of officialByNorm.keys()) {
          if (norm(alt) === nv) continue;
          const altTokens = alt.split(" ");
          if (
            altTokens.length === tokens.length &&
            tokens.every((t, i) => {
              const a = altTokens[i];
              return (
                t === a ||
                (t.length >= 4 && `${t.slice(0, -1)}a` === a) ||
                (a.length >= 4 && `${a.slice(0, -1)}a` === t) ||
                (t.endsWith("s") && t.slice(0, -1) === a) ||
                (a.endsWith("s") && a.slice(0, -1) === t)
              );
            })
          ) {
            matchKind = "official_singular_plural";
            hits = officialByNorm.get(alt) ?? [];
            break outer;
          }
        }
      }
    }
    const uniqueCodes = [...new Set(hits.map((h) => h.code))];
    if (hits.length > 1 && uniqueCodes.length > 1) matchKind = "ambiguous_multiple_official";

    const code = uniqueCodes.length === 1 ? uniqueCodes[0] : null;
    const linkedPrograms = code ? programsByCno.get(code) ?? [] : [];
    const todoFpProgramMatches = code
      ? profileIndex.get(norm(c.representativeTitle)) ?? []
      : [];

    candidates.push({
      candidateId: `CAND:${c.foldKey.replace(/\s+/gu, "_").slice(0, 48)}:${code ?? "none"}`,
      clusterFoldKey: c.foldKey,
      rawTitles: c.rawVariants,
      offerCount: c.offerCount,
      provinces: c.provinces,
      proposedCnoCode: code,
      proposedCnoTitle: hits[0]?.label ?? null,
      matchKind,
      ambiguousCodes: matchKind === "ambiguous_multiple_official" ? uniqueCodes : undefined,
      typeAExistingLink: linkedPrograms.length > 0,
      linkedPrograms,
      todoFpProgramMatches: todoFpProgramMatches.slice(0, 10),
      status: "UNREVIEWED",
    });
  }

  candidates.sort(
    (a, b) =>
      b.offerCount - a.offerCount ||
      (a.clusterFoldKey < b.clusterFoldKey ? -1 : 1),
  );

  await writeFile(
    resolve(OUT_DIR, "coverage-candidates.json"),
    JSON.stringify(
      { snapshotId: SNAPSHOT, total: candidates.length, candidates },
      null,
      2,
    ),
    "utf8",
  );

  const withCode = candidates.filter((x) => x.proposedCnoCode);
  console.log(
    JSON.stringify(
      {
        totalClusters: candidates.length,
        withOfficialCode: withCode.length,
        officialExact: candidates.filter((x) => x.matchKind === "official_exact").length,
        singularPlural: candidates.filter((x) => x.matchKind === "official_singular_plural").length,
        ambiguous: candidates.filter((x) => x.matchKind === "ambiguous_multiple_official").length,
        none: candidates.filter((x) => x.matchKind === "none").length,
        typeA: withCode.filter((x) => x.typeAExistingLink).length,
        offersCoveredByTypeA: withCode.filter((x) => x.typeAExistingLink).reduce((s, x) => s + x.offerCount, 0),
        offersCoveredByAllMapped: withCode.reduce((s, x) => s + x.offerCount, 0),
      },
      null,
      2,
    ),
  );
  console.log("\nType A (existing FP-CNO link) ranked:");
  for (const x of withCode.filter((y) => y.typeAExistingLink)) {
    console.log(
      `${String(x.offerCount).padStart(3)} | ${x.proposedCnoCode} ${x.proposedCnoTitle?.slice(0, 45)} | progs ${x.linkedPrograms.join(",")} | ${x.matchKind} | ${x.rawTitles[0].slice(0, 55)}`,
    );
  }
  console.log("\nTop mapped Type B (>=2 offers):");
  for (const x of withCode.filter((y) => !y.typeAExistingLink && y.offerCount >= 2).slice(0, 40)) {
    console.log(
      `${String(x.offerCount).padStart(3)} | ${x.proposedCnoCode} ${x.proposedCnoTitle?.slice(0, 45)} | todoFP ${x.todoFpProgramMatches.length} | ${x.matchKind} | ${x.rawTitles[0].slice(0, 55)}`,
    );
  }
}

void main();
