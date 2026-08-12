import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID } from "../../data/schemas/fpOfficialAliasPass";
import { FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT } from "../../data/schemas/fpOneWordPublicationReview";
import {
  JobOfferSchema,
  TrainingProgramSchema,
  type JobOffer,
} from "../../data/schemas/generated";
import { publishedRequirementId } from "../../src/domain/requirements";
import { extractPublishedRequirements } from "./extractRequirements";
import {
  buildMappingCoverage,
  loadCuratedMappingsFromDisk,
  type ValidatedCuratedMappings,
} from "./validateCuratedMappings";
import {
  assertPublicSnapshotDistribution,
  findRevokedPublicSnapshotDirectories,
} from "./validatePublicDistribution";

const temporaryRoots: string[] = [];
const reviewNote =
  "CNO-11 classification between 4309 and 4500 remains unresolved; excluded from public resources pending exact official evidence.";

const curatedMappings: ValidatedCuratedMappings = {
  occupations: [
    {
      occupationId: "occupation:cno11:4309",
      preferredLabel:
        "Empleados administrativos sin tareas de atención al público no clasificados bajo otros epígrafes",
      confirmationLabel: "Administración y apoyo de oficina",
      classificationSystem: "CNO-11",
      classificationCode: "4309",
      reviewStatus: "draft",
      sourceUrl:
        "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
      reviewedAt: "2026-08-04",
      catalogVersion: "1.0.0",
      reviewNote,
    },
  ],
  aliases: [
    {
      alias: "auxiliar administrativo",
      occupationId: "occupation:cno11:4309",
      reviewStatus: "draft",
      reviewedAt: "2026-08-04",
      mappingVersion: "1.0.0",
      reviewNote,
    },
  ],
  links: [
    {
      trainingProgramKey: "ADG01M",
      occupationId: "occupation:cno11:4309",
      relationshipType: "official_output",
      reviewStatus: "draft",
      sourceUrl:
        "https://www.todofp.es/que-estudiar/familias-profesionales/administracion-gestion/gestion-administrativa.html",
      sourceQuote: "Auxiliar administrativo.",
      reviewedAt: "2026-08-04",
      mappingVersion: "1.0.0",
      reviewNote,
    },
  ],
};

const approvedMappings: ValidatedCuratedMappings = {
  occupations: curatedMappings.occupations.map((occupation) => ({
    ...occupation,
    reviewStatus: "approved",
  })),
  aliases: curatedMappings.aliases.map((alias) => ({
    ...alias,
    reviewStatus: "approved",
  })),
  links: curatedMappings.links.map((link) => ({
    ...link,
    reviewStatus: "approved",
  })),
};

const administrativeProgram = TrainingProgramSchema.parse({
  programKey: "ADG01M",
  programTitle: "Gestión Administrativa",
  level: "intermediate",
  familyCode: "ADG",
  familyName: "Administración y Gestión",
});

const secondAdministrativeProgram = TrainingProgramSchema.parse({
  ...administrativeProgram,
  programKey: "ADG02M",
  programTitle: "Servicios Administrativos",
});

const completeApprovedMappings: ValidatedCuratedMappings = {
  occupations: [
    ...approvedMappings.occupations,
    {
      ...approvedMappings.occupations[0],
      occupationId: "occupation:cno11:4310",
      classificationCode: "4310",
      preferredLabel: "Segundo grupo administrativo",
    },
  ],
  aliases: [
    ...approvedMappings.aliases,
    {
      ...approvedMappings.aliases[0],
      alias: "segundo auxiliar",
      occupationId: "occupation:cno11:4310",
    },
  ],
  links: approvedMappings.links,
};

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function snapshot(root: string, name: string): Promise<string> {
  const directory = join(root, "public", "data", "v1", "snapshots", name);
  await mkdir(directory, { recursive: true });
  return directory;
}

const requirementSnapshot = {
  sourceId: "jcyl-employment-offers",
  sourceUrl: "https://datosabiertos.jcyl.es/",
  sourceUpdatedAt: "2026-08-03T00:00:00.000Z",
  snapshotFetchedAt: "2026-08-05T07:00:00.000Z",
  schemaVersion: "1.0.0" as const,
  recordCount: 1,
  sha256: "a".repeat(64),
  qualityStatus: "passed" as const,
};

function jobOffer(id: string, title: string, requirement: string): JobOffer {
  return JobOfferSchema.parse({
    id,
    title,
    province: "Valladolid",
    locality: "Valladolid",
    publishedAt: "2026-08-01T00:00:00.000Z",
    sourceName: "ECYL",
    descriptionText: requirement,
    descriptionSections: {
      summary: [],
      functions: [],
      requirements: [requirement],
      conditions: [],
      application: [],
      other: [],
    },
    originalUrl: `https://example.com/offers/${id}`,
    sourceSnapshot: requirementSnapshot,
  });
}

function currentRequirements(offers: readonly JobOffer[]) {
  return offers.flatMap((offer) => {
    const requirements = extractPublishedRequirements(offer.id, {
      sections: offer.descriptionSections,
    });
    return requirements.length === 0
      ? []
      : [{ offerId: offer.id, requirements }];
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("public snapshot distribution", () => {
  it("rejects every retained sidecar that differs from current recomputation", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const quote = "Grado en Derecho bajo revisión posterior.";
    const offer = jobOffer("offer:stale", "Abogado/a", quote);
    const expected = currentRequirements([offer]);
    const expectedRequirement = expected[0]!.requirements[0]!;
    const staleStructured = {
      offerId: offer.id,
      requirements: [
        {
          ...expectedRequirement,
          id: publishedRequirementId(
            offer.id,
            "qualification_or_specialization",
            quote,
          ),
          category: "qualification_or_specialization",
          normalizedValue: "Grado en Derecho bajo revisión posterior",
          parserRule: "qualification.official_title",
        },
      ],
    };
    const staleRule = {
      offerId: offer.id,
      requirements: [
        {
          ...expectedRequirement,
          parserRule: "unclassified.ambiguous_or_negated",
        },
      ],
    };
    const staleCategoryAndValue = {
      offerId: offer.id,
      requirements: [
        {
          ...expectedRequirement,
          id: publishedRequirementId(
            offer.id,
            "driving_license_or_vehicle",
            quote,
          ),
          category: "driving_license_or_vehicle",
          normalizedValue: "B",
          parserRule: "license.driving_b",
        },
      ],
    };
    const variants: unknown[] = [
      [staleStructured],
      [staleRule],
      [
        {
          ...expected[0],
          requirements: [
            { ...expectedRequirement, id: `requirement:${"f".repeat(64)}` },
          ],
        },
      ],
      [staleCategoryAndValue],
      [],
      [
        ...expected,
        {
          offerId: "offer:extra",
          requirements: [
            {
              ...expectedRequirement,
              id: publishedRequirementId(
                "offer:extra",
                expectedRequirement.category,
                quote,
              ),
            },
          ],
        },
      ],
    ];
    const invalidDirectories: string[] = [];
    for (const [index, sidecar] of variants.entries()) {
      const directory = await snapshot(
        root,
        `2026100${index + 1}000000000-${String(index + 1).repeat(12)}`,
      );
      await writeJson(join(directory, "job-offers.json"), [offer]);
      await writeJson(join(directory, "published-requirements.json"), sidecar);
      invalidDirectories.push(resolve(directory));
    }

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual(invalidDirectories);
  });

  it("allows pre-sidecar history but requires jobs and canonical order for a sidecar", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const preSidecar = await snapshot(root, "20261101000000000-aaaaaaaaaaaa");
    await writeJson(join(preSidecar, "job-offers.json"), [
      jobOffer("offer:legacy", "Oferta antigua", "Texto libre."),
    ]);

    const missingJobs = await snapshot(root, "20261102000000000-bbbbbbbbbbbb");
    await writeJson(join(missingJobs, "published-requirements.json"), []);

    const canonical = [
      jobOffer("offer:a", "A oferta", "Grado en Derecho."),
      jobOffer("offer:z", "Z oferta", "Bachiller o equivalente."),
    ];
    const valid = await snapshot(root, "20261103000000000-cccccccccccc");
    await writeJson(join(valid, "job-offers.json"), canonical);
    await writeJson(
      join(valid, "published-requirements.json"),
      currentRequirements(canonical),
    );

    const reordered = await snapshot(root, "20261104000000000-dddddddddddd");
    const reverse = [...canonical].reverse();
    await writeJson(join(reordered, "job-offers.json"), reverse);
    await writeJson(
      join(reordered, "published-requirements.json"),
      currentRequirements(reverse),
    );

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual([resolve(missingJobs), resolve(reordered)]);
  });
  it("finds every retained snapshot that exposes a currently draft curated record", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);

    const foundationOnly = await snapshot(
      root,
      "20260801000000000-aaaaaaaaaaaa",
    );
    await writeJson(join(foundationOnly, "programs.json"), []);

    const revokedOccupation = await snapshot(
      root,
      "20260802000000000-bbbbbbbbbbbb",
    );
    await writeJson(join(revokedOccupation, "occupations.json"), [
      { ...curatedMappings.occupations[0], reviewStatus: "approved" },
    ]);

    const revokedAlias = await snapshot(root, "20260803000000000-cccccccccccc");
    await writeJson(join(revokedAlias, "occupation-aliases.json"), [
      { ...curatedMappings.aliases[0], reviewStatus: "approved" },
    ]);

    const revokedLink = await snapshot(root, "20260804000000000-dddddddddddd");
    await writeJson(join(revokedLink, "training-occupation-links.json"), [
      { ...curatedMappings.links[0], reviewStatus: "approved" },
    ]);

    const validCurrent = await snapshot(root, "20260805000000000-eeeeeeeeeeee");
    await writeJson(join(validCurrent, "occupations.json"), []);
    await writeJson(join(validCurrent, "occupation-aliases.json"), []);
    await writeJson(join(validCurrent, "training-occupation-links.json"), []);
    await writeJson(join(validCurrent, "programs.json"), [
      administrativeProgram,
    ]);
    await writeJson(
      join(validCurrent, "mapping-coverage.json"),
      buildMappingCoverage([administrativeProgram], curatedMappings.links),
    );

    await expect(
      findRevokedPublicSnapshotDirectories(root, curatedMappings),
    ).resolves.toEqual([
      resolve(revokedOccupation),
      resolve(revokedAlias),
      resolve(revokedLink),
    ]);
  });

  it("revokes a historical approved record deleted from the curated catalog", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const deletedOccupation = await snapshot(
      root,
      "20260801000000000-aaaaaaaaaaaa",
    );
    await writeJson(
      join(deletedOccupation, "occupations.json"),
      approvedMappings.occupations,
    );

    await expect(
      findRevokedPublicSnapshotDirectories(root, {
        occupations: [],
        aliases: [],
        links: [],
      }),
    ).resolves.toEqual([resolve(deletedOccupation)]);
  });

  it("allows a pinned historical snapshot to omit later approved catalog additions", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const historical = await snapshot(root, "20260801000000000-aaaaaaaaaaaa");
    await writeJson(
      join(historical, "occupations.json"),
      approvedMappings.occupations,
    );
    await writeJson(
      join(historical, "occupation-aliases.json"),
      approvedMappings.aliases,
    );
    await writeJson(
      join(historical, "training-occupation-links.json"),
      approvedMappings.links,
    );
    await writeJson(join(historical, "programs.json"), [administrativeProgram]);
    await writeJson(
      join(historical, "mapping-coverage.json"),
      buildMappingCoverage([administrativeProgram], approvedMappings.links),
    );

    await expect(
      findRevokedPublicSnapshotDirectories(root, completeApprovedMappings, {
        historicalSnapshotDirectories: [historical],
      }),
    ).resolves.toEqual([]);
  });

  it("quarantines pinned snapshots that contain removed, non-approved, or changed approved identities", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const variants: Array<{
      name: string;
      current: ValidatedCuratedMappings;
    }> = [
      {
        name: "removed occupation",
        current: { ...approvedMappings, occupations: [] },
      },
      {
        name: "removed alias",
        current: { ...approvedMappings, aliases: [] },
      },
      {
        name: "removed training link",
        current: { ...approvedMappings, links: [] },
      },
      {
        name: "draft occupation",
        current: {
          ...approvedMappings,
          occupations: approvedMappings.occupations.map((occupation) => ({
            ...occupation,
            reviewStatus: "draft" as const,
            reviewNote,
          })),
        },
      },
      {
        name: "draft alias",
        current: {
          ...approvedMappings,
          aliases: approvedMappings.aliases.map((alias) => ({
            ...alias,
            reviewStatus: "draft" as const,
            reviewNote,
          })),
        },
      },
      {
        name: "draft training link",
        current: {
          ...approvedMappings,
          links: approvedMappings.links.map((link) => ({
            ...link,
            reviewStatus: "draft" as const,
            reviewNote,
          })),
        },
      },
      {
        name: "rejected occupation",
        current: {
          ...approvedMappings,
          occupations: approvedMappings.occupations.map((occupation) => ({
            ...occupation,
            reviewStatus: "rejected" as const,
          })),
        },
      },
      {
        name: "rejected alias",
        current: {
          ...approvedMappings,
          aliases: approvedMappings.aliases.map((alias) => ({
            ...alias,
            reviewStatus: "rejected" as const,
          })),
        },
      },
      {
        name: "rejected training link",
        current: {
          ...approvedMappings,
          links: approvedMappings.links.map((link) => ({
            ...link,
            reviewStatus: "rejected" as const,
          })),
        },
      },
      {
        name: "mutated occupation payload",
        current: {
          ...approvedMappings,
          occupations: approvedMappings.occupations.map((occupation) => ({
            ...occupation,
            preferredLabel: "Etiqueta actualizada",
          })),
        },
      },
      {
        name: "mutated alias payload",
        current: {
          ...approvedMappings,
          aliases: approvedMappings.aliases.map((alias) => ({
            ...alias,
            alias: "auxiliar de oficina",
          })),
        },
      },
      {
        name: "mutated training link payload",
        current: {
          ...approvedMappings,
          links: approvedMappings.links.map((link) => ({
            ...link,
            sourceQuote: "Auxiliar administrativo con evidencia actualizada.",
          })),
        },
      },
    ];

    for (const [index, variant] of variants.entries()) {
      const historical = await snapshot(
        root,
        `202608${String(index + 1).padStart(2, "0")}000000000-${String(index + 1).repeat(12)}`,
      );
      await writeJson(
        join(historical, "occupations.json"),
        approvedMappings.occupations,
      );
      await writeJson(
        join(historical, "occupation-aliases.json"),
        approvedMappings.aliases,
      );
      await writeJson(
        join(historical, "training-occupation-links.json"),
        approvedMappings.links,
      );
      await writeJson(join(historical, "programs.json"), [
        administrativeProgram,
      ]);
      await writeJson(
        join(historical, "mapping-coverage.json"),
        buildMappingCoverage([administrativeProgram], approvedMappings.links),
      );

      await expect(
        findRevokedPublicSnapshotDirectories(root, variant.current, {
          historicalSnapshotDirectories: [historical],
        }),
        variant.name,
      ).resolves.toContain(resolve(historical));
      await expect(
        assertPublicSnapshotDistribution(root, variant.current, {
          historicalSnapshotDirectories: [historical],
        }),
        variant.name,
      ).rejects.toThrow(/revoked mappings/i);
    }
  }, 30000);

  it("rejects historical alias and link rows omitted from a partial curated set", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const partial = await snapshot(root, "20260801000000000-aaaaaaaaaaaa");
    await writeJson(
      join(partial, "occupation-aliases.json"),
      approvedMappings.aliases,
    );
    await writeJson(
      join(partial, "training-occupation-links.json"),
      approvedMappings.links,
    );

    await expect(
      findRevokedPublicSnapshotDirectories(root, {
        occupations: approvedMappings.occupations,
        aliases: [],
        links: [],
      }),
    ).resolves.toEqual([resolve(partial)]);
  });

  it("rejects an approved identity whose public payload was mutated", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const mutated = await snapshot(root, "20260801000000000-aaaaaaaaaaaa");
    await writeJson(join(mutated, "occupations.json"), [
      {
        ...approvedMappings.occupations[0],
        preferredLabel: "Payload alterado",
      },
    ]);

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual([resolve(mutated)]);
  });

  it("rejects an unknown approved identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const mutated = await snapshot(root, "20260801000000000-aaaaaaaaaaaa");
    await writeJson(join(mutated, "occupations.json"), [
      {
        ...approvedMappings.occupations[0],
        occupationId: "occupation:cno11:9999",
        classificationCode: "9999",
      },
    ]);

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual([resolve(mutated)]);
  });

  it("fails closed when checking the snapshot tree returns an access error", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const denied = Object.assign(new Error("access denied"), {
      code: "EACCES",
    });

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings, {
        accessPath: async (path: string) => {
          if (path.endsWith("snapshots")) throw denied;
          await access(path);
        },
      } as never),
    ).rejects.toMatchObject({ code: "EACCES" });
  });

  it("rejects every partial decision-resource set", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const resources = [
      ["occupations.json", approvedMappings.occupations],
      ["occupation-aliases.json", approvedMappings.aliases],
      ["training-occupation-links.json", approvedMappings.links],
      [
        "mapping-coverage.json",
        buildMappingCoverage([administrativeProgram], approvedMappings.links),
      ],
    ] as const;
    const expected: string[] = [];
    for (const [index, [fileName, contents]] of resources.entries()) {
      const directory = await snapshot(
        root,
        `2026080${index + 1}000000000-${String(index + 1).repeat(12)}`,
      );
      await writeJson(join(directory, fileName), contents);
      expected.push(resolve(directory));
    }

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual(expected);
  });

  it("rejects missing programs, malformed coverage, and forged coverage fields", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const correctCoverage = buildMappingCoverage(
      [administrativeProgram],
      approvedMappings.links,
    );
    const variants: Array<{ programs?: unknown; coverage: unknown }> = [
      { coverage: correctCoverage },
      { programs: [administrativeProgram], coverage: [{ scope: "program" }] },
      {
        programs: [administrativeProgram],
        coverage: correctCoverage.map((row) =>
          row.scope === "program"
            ? { ...row, approvedMappings: row.approvedMappings + 1 }
            : row,
        ),
      },
      {
        programs: [administrativeProgram],
        coverage: correctCoverage.map((row) =>
          row.scope === "program"
            ? { ...row, coverageStatus: "uncovered" }
            : row,
        ),
      },
      {
        programs: [
          { ...administrativeProgram, programTitle: "Título manipulado" },
        ],
        coverage: correctCoverage,
      },
      { programs: [], coverage: [] },
    ];
    const expected: string[] = [];
    for (const [index, variant] of variants.entries()) {
      const directory = await snapshot(
        root,
        `2026081${index}000000000-${String(index + 5).repeat(12)}`,
      );
      await writeJson(
        join(directory, "occupations.json"),
        approvedMappings.occupations,
      );
      await writeJson(
        join(directory, "occupation-aliases.json"),
        approvedMappings.aliases,
      );
      await writeJson(
        join(directory, "training-occupation-links.json"),
        approvedMappings.links,
      );
      if (variant.programs !== undefined) {
        await writeJson(join(directory, "programs.json"), variant.programs);
      }
      await writeJson(
        join(directory, "mapping-coverage.json"),
        variant.coverage,
      );
      expected.push(resolve(directory));
    }

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual(expected);
  });

  it("requires the complete canonical approved arrays without subsets, duplicates, or reordering", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const programs = [administrativeProgram, secondAdministrativeProgram];
    const variants = [
      { occupations: [] },
      { links: [] },
      {
        aliases: [
          ...completeApprovedMappings.aliases,
          completeApprovedMappings.aliases[0],
        ],
      },
      { occupations: [...completeApprovedMappings.occupations].reverse() },
    ];
    const expected: string[] = [];
    for (const [index, variant] of variants.entries()) {
      const directory = await snapshot(
        root,
        `2026090${index + 1}000000000-${String(index + 1).repeat(12)}`,
      );
      await writeJson(join(directory, "programs.json"), programs);
      await writeJson(
        join(directory, "occupations.json"),
        variant.occupations ?? completeApprovedMappings.occupations,
      );
      await writeJson(
        join(directory, "occupation-aliases.json"),
        variant.aliases ?? completeApprovedMappings.aliases,
      );
      await writeJson(
        join(directory, "training-occupation-links.json"),
        variant.links ?? completeApprovedMappings.links,
      );
      await writeJson(
        join(directory, "mapping-coverage.json"),
        buildMappingCoverage(programs, completeApprovedMappings.links),
      );
      expected.push(resolve(directory));
    }

    await expect(
      findRevokedPublicSnapshotDirectories(root, completeApprovedMappings),
    ).resolves.toEqual(expected);
  });

  it("rejects duplicate or non-canonically ordered programs", async () => {
    const root = await mkdtemp(join(tmpdir(), "salida-cyl-distribution-"));
    temporaryRoots.push(root);
    const variants = [
      [administrativeProgram, administrativeProgram],
      [secondAdministrativeProgram, administrativeProgram],
    ];
    const expected: string[] = [];
    for (const [index, programs] of variants.entries()) {
      const directory = await snapshot(
        root,
        `2026091${index}000000000-${String(index + 5).repeat(12)}`,
      );
      await writeJson(join(directory, "programs.json"), programs);
      await writeJson(
        join(directory, "occupations.json"),
        approvedMappings.occupations,
      );
      await writeJson(
        join(directory, "occupation-aliases.json"),
        approvedMappings.aliases,
      );
      await writeJson(
        join(directory, "training-occupation-links.json"),
        approvedMappings.links,
      );
      await writeJson(
        join(directory, "mapping-coverage.json"),
        buildMappingCoverage(programs, approvedMappings.links),
      );
      expected.push(resolve(directory));
    }

    await expect(
      findRevokedPublicSnapshotDirectories(root, approvedMappings),
    ).resolves.toEqual(expected);
  });

  it("keeps every checked-in deployable snapshot free of revoked curated mappings", async () => {
    const root = process.cwd();
    const manifest = JSON.parse(
      await readFile(
        join(root, "public", "data", "v1", "manifest.json"),
        "utf8",
      ),
    ) as { resourceSnapshots: { programs: { resourcePath: string } } };
    const programs = z
      .array(TrainingProgramSchema)
      .parse(
        JSON.parse(
          await readFile(
            join(
              root,
              "public",
              ...manifest.resourceSnapshots.programs.resourcePath
                .split("/")
                .filter(Boolean),
            ),
            "utf8",
          ),
        ),
      );
    const mappings = await loadCuratedMappingsFromDisk(root, programs);
    const pilot = JSON.parse(
      await readFile(
        join(root, "analysis", "fp_coverage_pilot_results.json"),
        "utf8",
      ),
    ) as {
      attempts: {
        state: string;
        snapshotCoverage?: { status: string; snapshotId: string };
      }[];
    };
    const historicalSnapshotDirectories = [
      ...pilot.attempts.flatMap((attempt) =>
        attempt.state === "completed" &&
        attempt.snapshotCoverage?.status === "verified"
          ? [
              join(
                root,
                "public",
                "data",
                "v1",
                "snapshots",
                attempt.snapshotCoverage.snapshotId,
              ),
            ]
          : [],
      ),
      join(
        root,
        "public",
        "data",
        "v1",
        "snapshots",
        FP_OFFICIAL_ALIAS_PASS_BASELINE_SNAPSHOT_ID,
      ),
      join(
        root,
        "public",
        "data",
        "v1",
        "snapshots",
        FP_ONE_WORD_PUBLICATION_REVIEW_SNAPSHOT.snapshotId,
      ),
    ];

    await expect(
      assertPublicSnapshotDistribution(root, mappings, {
        historicalSnapshotDirectories,
      }),
    ).resolves.toBeUndefined();
  }, 30000);
});
