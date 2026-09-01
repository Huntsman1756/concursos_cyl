import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { REVIEWED_PROGRAM_QUALIFICATION_LINKS } from "../../data/catalogs/reviewedProgramQualifications";
import { REVIEWED_QUALIFICATIONS } from "../../data/catalogs/reviewedQualifications";
import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
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
  return JSON.parse(await readFile(resolve(process.cwd(), path), "utf8")) as unknown;
}

function snap(name: string): string {
  return `public/data/v1/snapshots/${SNAPSHOT}/${name}`;
}

export interface BaselineOutput {
  snapshotId: string;
  totalOffers: number;
  matchedOffers: number;
  matchedOffersPercent: number;
  approvedFpCnoRelations: number;
  relationsWithMatchedOffers: number;
  totalPrograms: number;
  programsWithMatchedOffers: number;
  totalFamilies: number;
  familiesWithMatchedOffers: number;
  approvedAliases: number;
  distinctCnoWithMatchedOffers: number;
  distinctCnoCodes: string[];
  provincesWithMatchedOffers: string[];
  provincesTotal: string[];
  matches: {
    offerId: string;
    title: string;
    province: string;
    programKey: string;
    occupationId: string;
    matchRule: string;
    alias?: string;
  }[];
}

export async function recompute(): Promise<BaselineOutput> {
  const [programs, occupations, aliases, links, offers, requirements] =
    await Promise.all([
      readJson(snap("programs.json")),
      readJson(snap("occupations.json")),
      readJson(snap("occupation-aliases.json")),
      readJson(snap("training-occupation-links.json")),
      readJson(snap("job-offers.json")),
      readJson(snap("published-requirements.json")),
    ]);

  const parsedPrograms = TrainingProgramSchema.array().parse(programs);
  const parsedOffers = JobOfferSchema.array().parse(offers);
  const parsedRequirements =
    PublishedRequirementsResourceSchema.parse(requirements);
  const parsedOccupations = OccupationsSchema.parse(occupations);
  const parsedAliases = OccupationAliasesSchema.parse(aliases);
  const parsedLinks = TrainingOccupationLinksSchema.parse(links);

  const matchesByProgram = new Map<string, OfferMatch[]>();
  for (const program of parsedPrograms) {
    const matches = matchOffersForProgram(program.programKey, {
      programs: parsedPrograms,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      occupations: parsedOccupations,
      aliases: parsedAliases,
      links: parsedLinks,
      offers: parsedOffers,
      publishedRequirements: parsedRequirements,
      humanOverrides: [],
    });
    if (matches.length > 0) matchesByProgram.set(program.programKey, matches);
  }

  const offerById = new Map(parsedOffers.map((o) => [o.id, o]));
  const matchedOfferIds = new Set<string>();
  const relationsWithOffers = new Set<string>();
  const cnoCodes = new Set<string>();
  const provinces = new Set<string>();
  const flat: BaselineOutput["matches"] = [];
  for (const [programKey, matches] of matchesByProgram) {
    for (const m of matches) {
      matchedOfferIds.add(m.offerId);
      relationsWithOffers.add(`${programKey}|${m.occupationId}`);
      cnoCodes.add(m.occupationId.replace("occupation:cno11:", ""));
      const offer = offerById.get(m.offerId);
      if (offer) provinces.add(offer.province);
      flat.push({
        offerId: m.offerId,
        title: offer?.title ?? "",
        province: offer?.province ?? "",
        programKey,
        occupationId: m.occupationId,
        matchRule: m.matchRule,
        alias:
          "aliasEvidence" in m && m.aliasEvidence
            ? m.aliasEvidence.payload.alias
            : undefined,
      });
    }
  }

  const familyByProgram = new Map(
    parsedPrograms.map((p) => [p.programKey, p.familyCode]),
  );
  const familiesAll = new Set(parsedPrograms.map((p) => p.familyCode));
  const familiesMatched = new Set(
    [...matchesByProgram.keys()].map((k) => familyByProgram.get(k) ?? ""),
  );
  const provincesAll = new Set(parsedOffers.map((o) => o.province));

  flat.sort((a, b) => (a.offerId < b.offerId ? -1 : 1));

  return {
    snapshotId: SNAPSHOT,
    totalOffers: parsedOffers.length,
    matchedOffers: matchedOfferIds.size,
    matchedOffersPercent: Number(
      ((matchedOfferIds.size / parsedOffers.length) * 100).toFixed(2),
    ),
    approvedFpCnoRelations: parsedLinks.filter(
      (l) => l.reviewStatus === "approved",
    ).length,
    relationsWithMatchedOffers: relationsWithOffers.size,
    totalPrograms: parsedPrograms.length,
    programsWithMatchedOffers: matchesByProgram.size,
    totalFamilies: familiesAll.size,
    familiesWithMatchedOffers: familiesMatched.size,
    approvedAliases: parsedAliases.filter(
      (a) => a.reviewStatus === "approved",
    ).length,
    distinctCnoWithMatchedOffers: cnoCodes.size,
    distinctCnoCodes: [...cnoCodes].sort(),
    provincesWithMatchedOffers: [...provinces].sort(),
    provincesTotal: [...provincesAll].sort(),
    matches: flat,
  };
}

const isMain = process.argv[1]?.includes("carrilARecompute");
if (isMain) {
  const out = await recompute();
  await writeFile(
    resolve(process.cwd(), OUT_DIR, "coverage-baseline.json"),
    JSON.stringify(out, null, 2),
    "utf8",
  );
  const { matches, ...summary } = out;
  console.log(JSON.stringify(summary, null, 2));
}
