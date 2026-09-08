import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

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

const BASELINE_SNAPSHOT_ID = "20260822085631889-7bbe69380f6d";
const EXCLUDED_AMBIGUOUS_OCCUPATION_IDS = new Set([
  "occupation:cno11:9543",
  "occupation:cno11:5812",
]);

/**
 * Expected matcher results copied from the approved local implementation
 * manifest. The manifest remains local coordination state; this is the
 * committed regression contract for the product data and matcher.
 */
const SAFE_ALIAS_CONTRACT = [
  {
    candidateId: "01-AD-5710",
    alias: "asistentes domiciliarios",
    occupationId: "occupation:cno11:5710",
    expectedOfferIds: [
      "1285620653126",
      "1285629158396",
      "1285631739680",
      "1285637975976",
      "1285640948901",
      "1285643274420",
      "1285646840496",
      "1285647687060",
      "1285651638453",
      "1285654004126",
      "1285656209312",
      "1285658994748",
      "1285660030053",
      "1285660489054",
      "1285660519315",
      "1285661179988",
      "1285661241095",
      "1285662467522",
      "1285662467588",
      "1285663192909",
      "1285664934729",
      "1285664976346",
      "1285665099048",
      "1285665756044",
      "1285665756072",
      "1285666004800",
      "1285666076349",
      "1285666076377",
      "1285666076442",
      "1285666137989",
      "1285666442663",
      "1285667211360",
      "1285667211388",
      "1285667891829",
      "1285668051299",
      "1285668877533",
      "1285669380182",
      "1285669380247",
      "1285669484226",
      "1285670055297",
      "1285670055466",
      "1285670082044",
      "1285670314991",
      "1285670583569",
      "1285670583597",
      "1285670802553",
      "1285671046460",
      "1285671206652",
      "1285671248506",
      "1285671557433",
      "1285671867754",
      "1285671920706",
      "1285672104200",
      "1285672131085",
      "1285672164768",
      "1285672205408",
      "1285672244571",
      "1285672244599",
      "1285672481412",
    ],
  },
  {
    candidateId: "02-PC-9602",
    alias: "peones de la construccion de edificios",
    occupationId: "occupation:cno11:9602",
    expectedOfferIds: ["1285663193331", "1285669341353", "1285672532223"],
  },
  {
    candidateId: "04-PA-9530",
    alias: "peones agropecuarios",
    occupationId: "occupation:cno11:9530",
    expectedOfferIds: ["1285666138609"],
  },
  {
    candidateId: "05-ME-7191",
    alias: "mantenedores de edificios",
    occupationId: "occupation:cno11:7191",
    expectedOfferIds: ["1285669240479"],
  },
  {
    candidateId: "06-PC-9310",
    alias: "pinches de cocina",
    occupationId: "occupation:cno11:9310",
    expectedOfferIds: [
      "1285622767314",
      "1285666804087",
      "1285671503827",
      "1285671557562",
      "1285671956131",
    ],
  },
  {
    candidateId: "07-MA-7401",
    alias: "mecanicos de mantenimiento y reparacion de automocion en general",
    occupationId: "occupation:cno11:7401",
    expectedOfferIds: [
      "1285666878866",
      "1285670315056",
      "1285671591757",
      "1285672085476",
      "1285672343297",
    ],
  },
  {
    candidateId: "08-AC-3510",
    alias: "agentes comerciales",
    occupationId: "occupation:cno11:3510",
    expectedOfferIds: [
      "1285665706767",
      "1285668257051",
      "1285671714804",
      "1285671788804",
    ],
  },
  {
    candidateId: "09-CA-5500",
    alias: "cajeros de comercio",
    occupationId: "occupation:cno11:5500",
    expectedOfferIds: ["1285670583504", "1285671119059", "1285671955220"],
  },
  {
    candidateId: "10-MC-7401",
    alias: "mecanicos-ajustadores de camiones y autobuses en general",
    occupationId: "occupation:cno11:7401",
    expectedOfferIds: ["1285670315084", "1285671248777", "1285672227125"],
  },
  {
    candidateId: "11-PE-5811",
    alias: "peluqueros unisex",
    occupationId: "occupation:cno11:5811",
    expectedOfferIds: ["1285620089808", "1285661589449", "1285667927355"],
  },
  {
    candidateId: "12-CS-5120",
    alias: "camareros de sala o jefes de rango",
    occupationId: "occupation:cno11:5120",
    expectedOfferIds: ["1285671836280", "1285672104128"],
  },
  {
    candidateId: "13-AC-4111",
    alias: "empleados administrativos de contabilidad en general",
    occupationId: "occupation:cno11:4111",
    expectedOfferIds: ["1285665634571", "1285672565954"],
  },
  {
    candidateId: "15-JA-6120",
    alias: "jardineros en general",
    occupationId: "occupation:cno11:6120",
    expectedOfferIds: ["1285669618131", "1285669925151"],
  },
  {
    candidateId: "16-FV-5894",
    alias: "profesores de formacion vial",
    occupationId: "occupation:cno11:5894",
    expectedOfferIds: ["1285642715478", "1285671248534"],
  },
] as const;

type Snapshot = {
  programs: ReturnType<typeof TrainingProgramSchema.parse>[];
  occupations: ReturnType<typeof OccupationsSchema.parse>;
  aliases: ReturnType<typeof OccupationAliasesSchema.parse>;
  links: ReturnType<typeof TrainingOccupationLinksSchema.parse>;
  offers: ReturnType<typeof JobOfferSchema.parse>[];
  publishedRequirements: ReturnType<
    typeof PublishedRequirementsResourceSchema.parse
  >;
};

type MatchEntry = {
  programKey: string;
  offerId: string;
  match: OfferMatch;
};

type Metrics = {
  totalOffers: number;
  matchedOffers: number;
  matchedOffersPercent: number;
  relationsWithOffers: number;
  programsWithOffers: number;
  familiesWithOffers: number;
  distinctCnoWithMatchedOffers: number;
  provincesWithMatchedOffers: string[];
  approvedFpCnoRelations: number;
};

type Artifacts = {
  baseline: Snapshot;
  active: Snapshot;
  baselineMatches: MatchEntry[];
  activeMatches: MatchEntry[];
  activeSnapshotId: string;
  actualByCandidate: Map<string, Set<string>>;
  expectedNewOfferIds: Set<string>;
  actualNewOfferIds: Set<string>;
  actualNewAliasOfferIds: Set<string>;
  newAliases: OccupationAlias[];
  baselinePairs: Set<string>;
  activePairs: Set<string>;
  newAliasOccupationByOffer: Map<string, Set<string>>;
};

const root = process.cwd();

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function loadSnapshot(snapshotId: string): Promise<Snapshot> {
  const snapshotRoot = resolve(root, "public/data/v1/snapshots", snapshotId);
  const resource = (name: string) => resolve(snapshotRoot, `${name}.json`);
  const [programs, occupations, aliases, links, offers, publishedRequirements] =
    await Promise.all([
      readJson<unknown[]>(resource("programs")),
      readJson<unknown[]>(resource("occupations")),
      readJson<unknown[]>(resource("occupation-aliases")),
      readJson<unknown[]>(resource("training-occupation-links")),
      readJson<unknown[]>(resource("job-offers")),
      readJson<unknown[]>(resource("published-requirements")),
    ]);

  return {
    programs: programs.map((value) => TrainingProgramSchema.parse(value)),
    occupations: OccupationsSchema.parse(occupations),
    aliases: OccupationAliasesSchema.parse(aliases),
    links: TrainingOccupationLinksSchema.parse(links),
    offers: offers.map((value) => JobOfferSchema.parse(value)),
    publishedRequirements: PublishedRequirementsResourceSchema.parse(
      publishedRequirements,
    ),
  };
}

function asSet(values: Iterable<string>): Set<string> {
  return new Set(values);
}

function sorted(values: Iterable<string>): string[] {
  return [...values].sort();
}

function aliasKey(alias: Pick<OccupationAlias, "alias" | "occupationId">) {
  return `${alias.alias}:${alias.occupationId}`;
}

function matchKey(entry: MatchEntry): string {
  return `${entry.programKey}|${entry.offerId}|${entry.match.occupationId}`;
}

function aliasFromMatch(match: OfferMatch): OccupationAlias | undefined {
  return "aliasEvidence" in match ? match.aliasEvidence.payload : undefined;
}

function runMatches(data: Snapshot): MatchEntry[] {
  const matches: MatchEntry[] = [];
  for (const program of data.programs) {
    for (const match of matchOffersForProgram(program.programKey, {
      ...data,
      qualifications: REVIEWED_QUALIFICATIONS,
      programQualificationLinks: REVIEWED_PROGRAM_QUALIFICATION_LINKS,
      humanOverrides: [],
    })) {
      matches.push({
        programKey: program.programKey,
        offerId: match.offerId,
        match,
      });
    }
  }
  return matches;
}

function metrics(data: Snapshot, matches: readonly MatchEntry[]): Metrics {
  const offers = new Map(data.offers.map((offer) => [offer.id, offer]));
  const programs = new Map(
    data.programs.map((program) => [program.programKey, program]),
  );
  const offerIds = asSet(matches.map((entry) => entry.offerId));
  const relationIds = asSet(
    matches.map((entry) => `${entry.programKey}|${entry.match.occupationId}`),
  );
  const programIds = asSet(matches.map((entry) => entry.programKey));
  const familyIds = asSet(
    [...programIds].map((programKey) => programs.get(programKey)!.familyCode),
  );
  const cnoIds = asSet(matches.map((entry) => entry.match.occupationId));
  const provinces = sorted(
    asSet(
      [...offerIds].flatMap((offerId) => {
        const province = offers.get(offerId)!.province;
        return province === null ? [] : [province];
      }),
    ),
  );

  return {
    totalOffers: data.offers.length,
    matchedOffers: offerIds.size,
    matchedOffersPercent: Number(
      ((offerIds.size / data.offers.length) * 100).toFixed(2),
    ),
    relationsWithOffers: relationIds.size,
    programsWithOffers: programIds.size,
    familiesWithOffers: familyIds.size,
    distinctCnoWithMatchedOffers: cnoIds.size,
    provincesWithMatchedOffers: provinces,
    approvedFpCnoRelations: data.links.filter(
      (link) => link.reviewStatus === "approved",
    ).length,
  };
}

let artifacts: Artifacts;

beforeAll(async () => {
  const runtimeManifest = await readJson<{
    resourceSnapshots: Record<string, { resourcePath: string }>;
  }>(resolve(root, "docs/contest/manifest-20260830-historical.json"));
  const activeSnapshotId = runtimeManifest.resourceSnapshots
    .programs!.resourcePath.split("/")
    .at(-2)!;
  const [baseline, active] = await Promise.all([
    loadSnapshot(BASELINE_SNAPSHOT_ID),
    loadSnapshot(activeSnapshotId),
  ]);
  const [baselineMatches, activeMatches] = [
    runMatches(baseline),
    runMatches(active),
  ];
  const baselineOfferIds = asSet(baselineMatches.map((entry) => entry.offerId));
  const activeOfferIds = asSet(activeMatches.map((entry) => entry.offerId));
  const newAliasLiterals: Set<string> = new Set(
    SAFE_ALIAS_CONTRACT.map((candidate) => candidate.alias),
  );
  const expectedNewOfferIds = asSet(
    SAFE_ALIAS_CONTRACT.flatMap((candidate) => candidate.expectedOfferIds),
  );
  const actualByCandidate = new Map<string, Set<string>>();
  for (const candidate of SAFE_ALIAS_CONTRACT) {
    actualByCandidate.set(
      candidate.candidateId,
      asSet(
        activeMatches
          .filter((entry) => {
            const alias = aliasFromMatch(entry.match);
            return (
              entry.match.occupationId === candidate.occupationId &&
              alias?.alias === candidate.alias
            );
          })
          .map((entry) => entry.offerId),
      ),
    );
  }
  const actualNewAliasOfferIds = asSet(
    activeMatches
      .filter((entry) =>
        newAliasLiterals.has(aliasFromMatch(entry.match)?.alias ?? ""),
      )
      .map((entry) => entry.offerId),
  );
  const actualNewOfferIds = asSet(
    [...activeOfferIds].filter((offerId) => !baselineOfferIds.has(offerId)),
  );
  const baselinePairs = asSet(baselineMatches.map(matchKey));
  const activePairs = asSet(activeMatches.map(matchKey));
  const newAliasOccupationByOffer = new Map<string, Set<string>>();
  for (const entry of activeMatches) {
    const alias = aliasFromMatch(entry.match)?.alias;
    if (!alias || !newAliasLiterals.has(alias)) continue;
    const occupations =
      newAliasOccupationByOffer.get(entry.offerId) ?? new Set<string>();
    occupations.add(entry.match.occupationId);
    newAliasOccupationByOffer.set(entry.offerId, occupations);
  }

  const baselineAliasKeys = new Set(baseline.aliases.map(aliasKey));
  const newAliases = active.aliases.filter(
    (alias) => !baselineAliasKeys.has(aliasKey(alias)),
  );

  artifacts = {
    baseline,
    active,
    baselineMatches,
    activeMatches,
    activeSnapshotId,
    actualByCandidate,
    expectedNewOfferIds,
    actualNewOfferIds,
    actualNewAliasOfferIds,
    newAliases,
    baselinePairs,
    activePairs,
    newAliasOccupationByOffer,
  };
}, 60_000);

describe("Carril A coverage expansion", () => {
  it("publishes exactly the 14 approved aliases and preserves the graph", () => {
    expect(artifacts.newAliases.map(aliasKey).sort()).toEqual(
      SAFE_ALIAS_CONTRACT.map(aliasKey).sort(),
    );
    expect(artifacts.active.aliases).toHaveLength(35);
    expect(artifacts.newAliases).toHaveLength(14);
    expect(artifacts.active.links).toEqual(artifacts.baseline.links);
    expect(artifacts.active.links).toHaveLength(264);
    expect(artifacts.active.occupations).toEqual(
      artifacts.baseline.occupations,
    );
    expect(
      [...artifacts.baselinePairs].every((pair) =>
        artifacts.activePairs.has(pair),
      ),
    ).toBe(true);
  });

  it("resolves every literal to its approved target CNO and reconciles offers", () => {
    for (const candidate of SAFE_ALIAS_CONTRACT) {
      const alias = artifacts.active.aliases.find(
        (entry) => entry.alias === candidate.alias,
      );
      expect(alias?.occupationId, candidate.candidateId).toBe(
        candidate.occupationId,
      );
      expect(
        [
          ...(artifacts.actualByCandidate.get(candidate.candidateId) ?? []),
        ].sort(),
        candidate.candidateId,
      ).toEqual([...candidate.expectedOfferIds].sort());
    }
    expect([...artifacts.actualNewAliasOfferIds].sort()).toEqual(
      [...artifacts.expectedNewOfferIds].sort(),
    );
    expect([...artifacts.actualNewOfferIds].sort()).toEqual(
      [...artifacts.expectedNewOfferIds].sort(),
    );
  });

  it("has no unexpected or missing matches and excludes ambiguous candidates", () => {
    const unexpected = [...artifacts.actualNewOfferIds].filter(
      (offerId) => !artifacts.expectedNewOfferIds.has(offerId),
    );
    const missing = [...artifacts.expectedNewOfferIds].filter(
      (offerId) => !artifacts.actualNewOfferIds.has(offerId),
    );
    const newAliasMatchesForAmbiguousCno = artifacts.activeMatches.filter(
      (entry) => {
        const alias = aliasFromMatch(entry.match)?.alias;
        return (
          EXCLUDED_AMBIGUOUS_OCCUPATION_IDS.has(entry.match.occupationId) &&
          SAFE_ALIAS_CONTRACT.some((candidate) => candidate.alias === alias)
        );
      },
    );

    expect(unexpected).toEqual([]);
    expect(missing).toEqual([]);
    expect(newAliasMatchesForAmbiguousCno).toEqual([]);
    expect(
      artifacts.newAliases.some((alias) =>
        EXCLUDED_AMBIGUOUS_OCCUPATION_IDS.has(alias.occupationId),
      ),
    ).toBe(false);
  });

  it("does not introduce multi-CNO conflicts", () => {
    const conflicts = [...artifacts.newAliasOccupationByOffer.entries()]
      .filter(([, occupationIds]) => occupationIds.size > 1)
      .map(([offerId]) => offerId)
      .sort();
    expect(conflicts).toEqual([]);
  });

  it("matches the approved baseline and final metrics", () => {
    expect(artifacts.activeSnapshotId).not.toBe(BASELINE_SNAPSHOT_ID);
    const baseline = metrics(artifacts.baseline, artifacts.baselineMatches);
    const final = metrics(artifacts.active, artifacts.activeMatches);

    expect(baseline).toMatchObject({
      totalOffers: 1058,
      matchedOffers: 38,
      matchedOffersPercent: 3.59,
      relationsWithOffers: 3,
      programsWithOffers: 2,
      familiesWithOffers: 2,
      distinctCnoWithMatchedOffers: 3,
      approvedFpCnoRelations: 264,
    });
    expect(baseline.provincesWithMatchedOffers).toHaveLength(9);
    expect(final).toMatchObject({
      totalOffers: 1058,
      matchedOffers: 133,
      matchedOffersPercent: 12.57,
      relationsWithOffers: 33,
      programsWithOffers: 30,
      familiesWithOffers: 10,
      distinctCnoWithMatchedOffers: 16,
      approvedFpCnoRelations: 264,
    });
    expect(final.provincesWithMatchedOffers).toHaveLength(9);
  });
});
