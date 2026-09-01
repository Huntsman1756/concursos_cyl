import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import type { BaselineOutput } from "./carrilARecompute";
import { recompute } from "./carrilARecompute";

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

export function normalizeTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}

function foldToken(token: string): string {
  if (token.length >= 4 && token.endsWith("a")) return `${token.slice(0, -1)}o`;
  if (token.length >= 5 && token.endsWith("as"))
    return `${token.slice(0, -2)}os`;
  if (token.length >= 5 && token.endsWith("es") && !/(ense|ades|eres)$/u.test(token))
    return token;
  return token;
}

function foldGender(normalized: string): string {
  return normalized.split(" ").map(foldToken).join(" ");
}

function collapseSpaces(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

interface Cluster {
  clusterId: string;
  foldKey: string;
  representativeTitle: string;
  normalizedVariants: string[];
  rawVariants: string[];
  offerCount: number;
  sampleOfferIds: string[];
  provinces: string[];
  totalProvinces: number;
  sourceNames: string[];
}

async function main() {
  const baseline: BaselineOutput = await recompute();
  const matched = new Set(baseline.matches.map((m) => m.offerId));
  const offers = JobOfferSchema.array().parse(
    await readJson(snap("job-offers.json")),
  );
  const programs = TrainingProgramSchema.array().parse(
    await readJson(snap("programs.json")),
  );

  const unmatched = offers.filter((o) => !matched.has(o.id));
  const distinctRaw = new Set(unmatched.map((o) => o.title));
  const distinctNormalized = new Set(
    [...distinctRaw].map((t) => normalizeTitle(t)),
  );

  const groups = new Map<string, typeof unmatched>();
  for (const offer of unmatched) {
    const key = collapseSpaces(foldGender(normalizeTitle(offer.title)));
    const bucket = groups.get(key) ?? [];
    bucket.push(offer);
    groups.set(key, bucket);
  }

  const clusters: Cluster[] = [...groups.entries()]
    .map(([foldKey, bucket]) => {
      const provinces = [...new Set(bucket.map((o) => o.province))].sort();
      const sorted = [...bucket].sort((a, b) => (a.id < b.id ? -1 : 1));
      return {
        clusterId: `CL:${foldKey.replace(/\s+/gu, "_").slice(0, 48)}`,
        foldKey,
        representativeTitle: sorted[0].title,
        normalizedVariants: [
          ...new Set(sorted.map((o) => normalizeTitle(o.title))),
        ].sort(),
        rawVariants: [...new Set(sorted.map((o) => o.title))].sort(),
        offerCount: bucket.length,
        sampleOfferIds: sorted.slice(0, 5).map((o) => o.id),
        provinces,
        totalProvinces: provinces.length,
        sourceNames: [...new Set(sorted.map((o) => o.sourceName))].sort(),
      };
    })
    .sort(
      (a, b) =>
        b.offerCount - a.offerCount ||
        b.totalProvinces - a.totalProvinces ||
        (a.foldKey < b.foldKey ? -1 : 1),
    );

  const artifact = {
    snapshotId: SNAPSHOT,
    unmatchedOffers: unmatched.length,
    distinctRawTitles: distinctRaw.size,
    distinctNormalizedTitles: distinctNormalized.size,
    clusters: clusters.length,
    totalPrograms: programs.length,
    clusterList: clusters,
  };
  await writeFile(
    resolve(process.cwd(), OUT_DIR, "unmatched-title-clusters.json"),
    JSON.stringify(artifact, null, 2),
    "utf8",
  );
  console.log(
    JSON.stringify(
      {
        unmatchedOffers: artifact.unmatchedOffers,
        distinctRawTitles: artifact.distinctRawTitles,
        distinctNormalizedTitles: artifact.distinctNormalizedTitles,
        clusters: artifact.clusters,
      },
      null,
      2,
    ),
  );
  console.log("TOP 60 clusters:");
  for (const c of clusters.slice(0, 60)) {
    console.log(
      `${String(c.offerCount).padStart(3)} | ${c.totalProvinces} prov | ${c.foldKey.slice(0, 60)} | ${c.rawVariants.slice(0, 2).join(" ;; ").slice(0, 90)}`,
    );
  }
}

void main();
