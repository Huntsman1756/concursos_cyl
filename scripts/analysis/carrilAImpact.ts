import { readFile, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type OccupationAlias,
} from "../../data/schemas/curatedMappings";
import {
  JobOfferSchema,
  TrainingProgramSchema,
} from "../../data/schemas/generated";
import {
  matchOffersForProgram,
  type OfferMatch,
} from "../../src/domain/offerMatching";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";

const SNAPSHOT = "20260822085631889-7bbe69380f6d";
const OUT_DIR = "analysis/carril_a_20260827";

async function readJson(path: string): Promise<unknown> {
  const full = isAbsolute(path) ? path : resolve(process.cwd(), path);
  return JSON.parse(await readFile(full, "utf8")) as unknown;
}

function snap(name: string): string {
  return resolve(process.cwd(), `public/data/v1/snapshots/${SNAPSHOT}/${name}`);
}

export const SAFE_ALIASES: { alias: string; occupationId: string; reviewNote: string }[] =
  [
    {
      alias: "asistentes domiciliarios",
      occupationId: "occupation:cno11:5710",
      reviewNote:
        "Carril A audit: CNO-94 5113 'Asistentes domiciliarios' -> CNO-11 5710 (1:1) per INE correspondence",
    },
    {
      alias: "peones de la construcción de edificios",
      occupationId: "occupation:cno11:9602",
      reviewNote:
        "Carril A audit: identical official title CNO-94 9602 and CNO-11 9602 (INE correspondence)",
    },
    {
      alias: "peones forestales",
      occupationId: "occupation:cno11:9543",
      reviewNote:
        "Carril A audit: CNO-94 9440 'Peones forestales' -> CNO-11 9543 (1:1) per INE correspondence",
    },
    {
      alias: "peones agropecuarios",
      occupationId: "occupation:cno11:9530",
      reviewNote:
        "Carril A audit: CNO-94 9430 'Peones agropecuarios' -> CNO-11 9530 (1:1); identical CNO-11 official title",
    },
    {
      alias: "mantenedores de edificios",
      occupationId: "occupation:cno11:7191",
      reviewNote:
        "Carril A audit: identical official title CNO-11 7191 (RD 1591/2010 / INE nomenclature)",
    },
  ];

async function load(aliases: OccupationAlias[]) {
  const [programs, occupations, links, offers, requirements] =
    await Promise.all([
      readJson(snap("programs.json")),
      readJson(snap("occupations.json")),
      readJson(snap("training-occupation-links.json")),
      readJson(snap("job-offers.json")),
      readJson(snap("published-requirements.json")),
    ]);
  return {
    programs: TrainingProgramSchema.array().parse(programs),
    occupations: OccupationsSchema.parse(occupations),
    links: TrainingOccupationLinksSchema.parse(links),
    aliases,
    offers: JobOfferSchema.array().parse(offers),
    requirements: PublishedRequirementsResourceSchema.parse(requirements),
  };
}

function summarize(
  r: Awaited<ReturnType<typeof runMatch>>,
): Record<string, unknown> {
  const matched = new Set<string>();
  const relations = new Set<string>();
  const cno = new Set<string>();
  const prov = new Set<string>();
  for (const m of r.all) {
    matched.add(m.offer.id);
    relations.add(`${m.programKey}|${m.match.occupationId}`);
    cno.add(m.match.occupationId);
    prov.add(m.offer.province);
  }
  const programsMatched = new Set(r.all.map((m) => m.programKey));
  const familyOf = new Map(r.data.programs.map((p) => [p.programKey, p.familyCode]));
  return {
    matchedOffers: matched.size,
    matchedPercent: Number(((matched.size / r.data.offers.length) * 100).toFixed(2)),
    relationsWithOffers: relations.size,
    programsWithOffers: programsMatched.size,
    familiesWithOffers: new Set([...programsMatched].map((k) => familyOf.get(k)!)).size,
    distinctCno: cno.size,
    provinces: [...prov].sort(),
  };
}

async function runMatch(extraAliases: typeof SAFE_ALIASES) {
  const base = OccupationAliasesSchema.parse(
    await readJson(snap("occupation-aliases.json")),
  );
  const aliases = [
    ...base,
    ...extraAliases.map(
      (a) =>
        ({
          alias: a.alias,
          occupationId: a.occupationId,
          reviewStatus: "approved",
          reviewedAt: "2026-08-27",
          mappingVersion: "9.9.9",
          reviewNote: a.reviewNote,
        }) satisfies OccupationAlias,
    ),
  ];
  const data = await load(aliases);
  const all: { programKey: string; match: OfferMatch; offerId: string; offer: { id: string; title: string; province: string } }[] = [];
  for (const program of data.programs) {
    const matches = matchOffersForProgram(program.programKey, {
      programs: data.programs,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      occupations: data.occupations,
      aliases: data.aliases,
      links: data.links,
      offers: data.offers,
      publishedRequirements: data.requirements,
      humanOverrides: [],
    });
    const byId = new Map(data.offers.map((o) => [o.id, o]));
    for (const match of matches) {
      const offer = byId.get(match.offerId)!;
      all.push({ programKey: program.programKey, match, offerId: match.offerId, offer });
    }
  }
  return { all, data };
}

async function main() {
  const baseline = await runMatch([]);
  const safe = await runMatch(SAFE_ALIASES);

  const baselineIds = new Set(baseline.all.map((m) => m.offerId));
  const newMatches = safe.all.filter((m) => !baselineIds.has(m.offerId));
  const newOfferIds = new Set(newMatches.map((m) => m.offerId));

  const baselineIdsGlobal = new Set(baseline.all.map((m) => m.offerId));
  const byAlias = new Map<string, { offer: { id: string; title: string; province: string }; programKeys: string[] }[]>();
  for (const m of safe.all) {
    if (baselineIdsGlobal.has(m.offerId) && !newMatches.some((x) => x.offerId === m.offerId)) continue;
    const alias =
      "aliasEvidence" in m.match && m.match.aliasEvidence
        ? m.match.aliasEvidence.payload.alias
        : "(other)";
    if (!SAFE_ALIASES.some((s) => s.alias === alias)) continue;
    const bucket = byAlias.get(alias) ?? [];
    const existing = bucket.find((x) => x.offer.id === m.offerId);
    if (existing) existing.programKeys.push(m.programKey);
    else bucket.push({ offer: m.offer, programKeys: [m.programKey] });
    byAlias.set(alias, bucket);
  }

  // per-family breakdown
  const familyOf = new Map(baseline.data.programs.map((p) => [p.programKey, p.familyCode]));
  const fam: Record<string, { baseline: Set<string>; safe: Set<string>; offers: Set<string> }> = {};
  for (const m of baseline.all) {
    const f = familyOf.get(m.programKey)!;
    fam[f] ??= { baseline: new Set(), safe: new Set(), offers: new Set() };
    fam[f].baseline.add(m.programKey);
  }
  for (const m of safe.all) {
    const f = familyOf.get(m.programKey)!;
    fam[f] ??= { baseline: new Set(), safe: new Set(), offers: new Set() };
    fam[f].safe.add(m.programKey);
    fam[f].offers.add(m.offerId);
  }

  const out = {
    snapshotId: SNAPSHOT,
    safeAliases: SAFE_ALIASES,
    baseline: summarize(baseline),
    safeTotal: summarize(safe),
    newOfferCount: newOfferIds.size,
    newOfferIds: [...newOfferIds].sort(),
    matchesByAlias: [...byAlias.entries()].map(([alias, list]) => ({
      alias,
      offers: list.length,
      provinces: [...new Set(list.map((x) => x.offer.province))].sort(),
      sample: list.slice(0, 60).map((x) => ({ id: x.offer.id, title: x.offer.title, province: x.offer.province, programs: [...new Set(x.programKeys)] })),
    })),
    families: Object.fromEntries(
      Object.entries(fam).map(([k, v]) => [
        k,
        {
          baselineProgramsWithOffers: v.baseline.size,
          safeProgramsWithOffers: v.safe.size,
          safeOffers: v.offers.size,
        },
      ]),
    ),
  };
  await writeFile(
    resolve(OUT_DIR, "coverage-impact.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  console.log(JSON.stringify({ baseline: out.baseline, safeTotal: out.safeTotal, newOfferCount: out.newOfferCount, families: out.families, aliases: out.matchesByAlias.map((a) => ({ alias: a.alias, offers: a.offers, provinces: a.provinces })) }, null, 2));
}

void main();
