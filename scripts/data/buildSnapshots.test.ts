import { createHash } from "node:crypto";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GeneratedManifestSchema,
  LoadableGeneratedManifestSchema,
} from "../../data/schemas/generated";
import {
  liveOfferSourceRecord,
  liveTrainingSourceRecord,
} from "../../tests/fixtures/sourceRecords";
import { publishedRequirementId } from "../../src/domain/requirements";
import {
  buildSnapshots,
  type SnapshotFailureInjection,
} from "./buildSnapshots";
import { hashFile } from "./hashFile";
import type { ValidatedCuratedMappings } from "./validateCuratedMappings";
import { assertPublicSnapshotDistribution } from "./validatePublicDistribution";

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "salida-cyl-task-6-"));
  temporaryRoots.push(root);
  return root;
}

function assetPath(root: string, resourcePath: string): string {
  return join(root, "public", ...resourcePath.split("/").filter(Boolean));
}

async function readManifest(root: string) {
  return GeneratedManifestSchema.parse(
    JSON.parse(
      await readFile(
        join(root, "public", "data", "v1", "manifest.json"),
        "utf8",
      ),
    ),
  );
}

const fixedOptions = {
  now: () => new Date("2026-08-04T10:00:00.000Z"),
  fetchTrainingRecords: async () => [{ ...liveTrainingSourceRecord }],
  fetchOfferRecords: async () => [{ ...liveOfferSourceRecord }],
  loadCuratedMappings: async () => ({
    occupations: [],
    aliases: [],
    links: [],
  }),
  log: () => undefined,
};

const unresolvedAdministrativeReviewNote =
  "CNO-11 classification between 4309 and 4500 remains unresolved; excluded from public resources pending exact official evidence.";

function ambiguousAdministrativeMappings(
  reviewStatus: "approved" | "draft",
): ValidatedCuratedMappings {
  return {
    occupations: [
      {
        occupationId: "occupation:cno11:4309",
        preferredLabel:
          "Empleados administrativos sin tareas de atención al público no clasificados bajo otros epígrafes",
        confirmationLabel: "Administración y apoyo de oficina",
        classificationSystem: "CNO-11",
        classificationCode: "4309",
        reviewStatus,
        sourceUrl:
          "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
        reviewedAt: "2026-08-04",
        catalogVersion: "1.0.0",
        reviewNote: unresolvedAdministrativeReviewNote,
      },
    ],
    aliases: [
      {
        alias: "auxiliar administrativo",
        occupationId: "occupation:cno11:4309",
        reviewStatus,
        reviewedAt: "2026-08-04",
        mappingVersion: "1.0.0",
        reviewNote: unresolvedAdministrativeReviewNote,
      },
    ],
    links: [
      {
        trainingProgramKey: "ADG01M",
        occupationId: "occupation:cno11:4309",
        relationshipType: "official_output",
        reviewStatus,
        sourceUrl:
          "https://www.todofp.es/que-estudiar/familias-profesionales/administracion-gestion/gestion-administrativa.html",
        sourceQuote: "Auxiliar administrativo.",
        reviewedAt: "2026-08-04",
        mappingVersion: "1.0.0",
        reviewNote: unresolvedAdministrativeReviewNote,
      },
    ],
  };
}

function ambiguousOccupationMappings(
  reviewStatus: "approved" | "draft",
): ValidatedCuratedMappings {
  const mappings = ambiguousAdministrativeMappings(reviewStatus);
  return { ...mappings, links: [] };
}

const FIXED_POINT_FETCHED_AT = "2026-08-04T15:52:38.619Z";
const FIXED_POINT_SNAPSHOT_ID = "20260804155238619-6e07eafedc96";
const FIXED_POINT_TRAINING_URL =
  "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/oferta-de-formacion-profesional/records";
const FIXED_POINT_OFFERS_URL =
  "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records";

function fixedPointResourceSnapshot(
  source: "training" | "offers",
  recordCount: number,
  fileName: string,
  sha256: string,
) {
  return {
    qualityStatus: "passed" as const,
    recordCount,
    resourcePath: `/data/v1/snapshots/${FIXED_POINT_SNAPSHOT_ID}/${fileName}`,
    schemaVersion: "1.0.0" as const,
    sha256,
    snapshotFetchedAt: FIXED_POINT_FETCHED_AT,
    sourceId:
      source === "training"
        ? "jcyl-vocational-training-offer"
        : "jcyl-employment-offers",
    sourceUpdatedAt: source === "training" ? null : "2026-07-31T00:00:00.000Z",
    sourceUrl:
      source === "training" ? FIXED_POINT_TRAINING_URL : FIXED_POINT_OFFERS_URL,
  };
}

const fixedPointManifest = {
  generatedAt: FIXED_POINT_FETCHED_AT,
  qualityReport: {
    counts: { centers: 229, offerings: 1293, offers: 1033, programs: 187 },
    nullRates: {
      centerAddress: 0,
      centerEmail: 0,
      centerPhone: 0,
      centerWebsite: 0.004366812227074236,
      offerDescription: 0,
      offerLocality: 0.08906098741529525,
      offerProvince: 0,
    },
  },
  qualityStatus: "passed" as const,
  resourceSnapshots: {
    centers: fixedPointResourceSnapshot(
      "training",
      229,
      "centers.json",
      "995839b947e15ec86922633b46c6f521ffcdfbdd75495e0980dfb2cca9f92efc",
    ),
    jobOffers: fixedPointResourceSnapshot(
      "offers",
      1033,
      "job-offers.json",
      "65e3a987b302e2ebba345351ab0c409a1a83393e0bba83466c55b6822c818147",
    ),
    programs: fixedPointResourceSnapshot(
      "training",
      187,
      "programs.json",
      "7c3538b583c2feb48207b90d5a69874325fedcf20bda0e781044282db76c0d22",
    ),
    trainingOfferings: fixedPointResourceSnapshot(
      "training",
      1293,
      "training-offerings.json",
      "0d091ea5889e2939b3806bcf223a2652e89434dfa480e58ee49687ea4e89dade",
    ),
  },
  schemaVersion: "1.0.0" as const,
};

const fixedPointOfferSourceSnapshot = {
  qualityStatus: "passed",
  recordCount: 1033,
  schemaVersion: "1.0.0",
  sha256: "8fcf7ec2a1a8a356ad63d61229f3e00a9362fada70e68ca6944121aa041e2035",
  snapshotFetchedAt: FIXED_POINT_FETCHED_AT,
  sourceId: "jcyl-employment-offers",
  sourceUpdatedAt: "2026-07-31T00:00:00.000Z",
  sourceUrl: FIXED_POINT_OFFERS_URL,
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

function serializeDeterministically(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(stableValue(value), null, 2)}\n`);
}

function lockFailureInjection(
  hooks: SnapshotFailureInjection,
): SnapshotFailureInjection {
  return hooks;
}

function canonicalTestRoot(root: string): string {
  const absolute = resolve(root);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

function snapshotLockBytes(
  root: string,
  token: string,
  pid = process.pid,
): string {
  return `${JSON.stringify({
    schemaVersion: "1.0.0",
    token,
    pid,
    startedAt: "2027-04-01T10:00:00.000Z",
    root: canonicalTestRoot(root),
    buildId: `${pid}-${token}`,
  })}\n`;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("hashFile", () => {
  it("hashes the exact bytes written to disk", async () => {
    const root = await temporaryRoot();
    const file = join(root, "bytes.txt");
    await writeFile(file, Buffer.from([0x61, 0x62, 0x63]));

    await expect(hashFile(file)).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("buildSnapshots", () => {
  it("publishes the four curated mapping resources through the manifest", async () => {
    const root = await temporaryRoot();

    await buildSnapshots({ rootDirectory: root, ...fixedOptions });

    const manifest = await readManifest(root);
    for (const key of [
      "occupations",
      "occupationAliases",
      "trainingOccupationLinks",
      "mappingCoverage",
    ] as const) {
      const snapshot = manifest.resourceSnapshots[key];
      expect(snapshot).toBeDefined();
      const bytes = await readFile(assetPath(root, snapshot.resourcePath));
      const records = JSON.parse(bytes.toString("utf8")) as unknown[];
      expect(records).toHaveLength(snapshot.recordCount);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        snapshot.sha256,
      );
    }

    const publicLinks = JSON.parse(
      await readFile(
        assetPath(
          root,
          manifest.resourceSnapshots.trainingOccupationLinks.resourcePath,
        ),
        "utf8",
      ),
    ) as Array<{
      reviewStatus: string;
      sourceUrl: string;
      sourceQuote: string;
    }>;
    expect(publicLinks.every((link) => link.reviewStatus === "approved")).toBe(
      true,
    );
    expect(
      publicLinks.every(
        (link) =>
          link.sourceUrl.startsWith("https://") &&
          link.sourceQuote.trim().length >= 12,
      ),
    ).toBe(true);
  });

  it("publishes quote-backed requirements as an additive hashed resource", async () => {
    const root = await temporaryRoot();
    const requirementQuote = "Permiso de conducir B y vehículo propio.";

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      fetchOfferRecords: async () => [
        {
          ...liveOfferSourceRecord,
          descripcion: `<h2>Requisitos</h2><ul><li>${requirementQuote}</li></ul><h2>Condiciones</h2><p>Teletrabajo.</p>`,
        },
      ],
    });

    const manifest = await readManifest(root);
    const snapshot = manifest.resourceSnapshots.publishedRequirements;
    expect(snapshot).toBeDefined();
    const bytes = await readFile(assetPath(root, snapshot.resourcePath));
    const resource = JSON.parse(bytes.toString("utf8")) as Array<{
      offerId: string;
      requirements: Array<{
        sourceQuote: string;
        category: string;
        normalizedValue: string;
      }>;
    }>;

    expect(resource).toEqual([
      {
        offerId: liveOfferSourceRecord.identificador,
        requirements: [
          expect.objectContaining({
            category: "driving_license_or_vehicle",
            normalizedValue: "B",
            sourceQuote: requirementQuote,
          }),
        ],
      },
    ]);
    expect(snapshot.recordCount).toBe(1);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      snapshot.sha256,
    );
  });

  it("publishes Gestión Administrativa as draft coverage without exposing the unresolved CNO mapping", async () => {
    const root = await temporaryRoot();
    const reviewNote =
      "CNO-11 classification between 4309 and 4500 remains unresolved; excluded from public resources pending exact official evidence.";

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      fetchTrainingRecords: async () => [
        {
          ...liveTrainingSourceRecord,
          clave_ciclo: "ADG01M",
          ciclo_formativo_curso_de_especializacion: "Gestión Administrativa",
          codigo_familia: "ADG",
          familia_profesional: "Administración y Gestión",
          nivel_educativo: "Grado Medio",
        },
      ],
      loadCuratedMappings: async () => ({
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
      }),
    });

    const manifest = await readManifest(root);
    const readResource = async (key: string): Promise<unknown[]> => {
      const snapshot = manifest.resourceSnapshots[key];
      return JSON.parse(
        await readFile(assetPath(root, snapshot.resourcePath), "utf8"),
      ) as unknown[];
    };
    await expect(readResource("occupations")).resolves.toEqual([]);
    await expect(readResource("occupationAliases")).resolves.toEqual([]);
    await expect(readResource("trainingOccupationLinks")).resolves.toEqual([]);
    await expect(readResource("mappingCoverage")).resolves.toContainEqual(
      expect.objectContaining({
        scope: "program",
        programKey: "ADG01M",
        approvedMappings: 0,
        draftMappings: 1,
        coverageStatus: "draft",
      }),
    );
  });

  it("restores an inactive revoked snapshot byte-for-byte when quarantine fails", async () => {
    const root = await temporaryRoot();
    const draftMappings = ambiguousAdministrativeMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => draftMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const revokedDirectory = join(
      root,
      "public",
      "data",
      "v1",
      "snapshots",
      "20260801000000000-ffffffffffff",
    );
    await mkdir(revokedDirectory, { recursive: true });
    const revokedContents = serializeDeterministically(
      ambiguousAdministrativeMappings("approved").occupations,
    );
    const revokedPath = join(revokedDirectory, "occupations.json");
    await writeFile(revokedPath, revokedContents);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          afterRevokedSnapshotPrune: () => {
            throw new Error("injected inactive quarantine failure");
          },
        },
      }),
    ).rejects.toThrow(/injected inactive quarantine failure/i);

    await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
    await expect(access(revokedDirectory)).resolves.toBeUndefined();
    await expect(readFile(revokedPath)).resolves.toEqual(revokedContents);

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-08-06T10:00:00.000Z"),
      loadCuratedMappings: async () => draftMappings,
    });
    await expect(access(revokedDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("restores inactive quarantine when manifest validation or swap is interrupted", async () => {
    const root = await temporaryRoot();
    const draftMappings = ambiguousAdministrativeMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => draftMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const revokedDirectory = join(
      root,
      "public",
      "data",
      "v1",
      "snapshots",
      "20260801000000000-ffffffffffff",
    );
    await mkdir(revokedDirectory, { recursive: true });
    const revokedContents = serializeDeterministically(
      ambiguousAdministrativeMappings("approved").occupations,
    );
    const revokedPath = join(revokedDirectory, "occupations.json");
    await writeFile(revokedPath, revokedContents);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          beforeManifestCommit: () => {
            throw new Error("injected manifest swap failure");
          },
        },
      }),
    ).rejects.toThrow(/injected manifest swap failure/i);

    await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
    await expect(readFile(revokedPath)).resolves.toEqual(revokedContents);
  });

  it("recovers an interrupted journaled quarantine before the next publication", async () => {
    const root = await temporaryRoot();
    const draftMappings = ambiguousAdministrativeMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => draftMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const previousManifest = await readManifest(root);
    const previousSnapshotIds = [
      ...new Set(
        Object.values(previousManifest.resourceSnapshots).map((resource) =>
          resource.resourcePath.split("/").at(-2),
        ),
      ),
    ]
      .filter((value): value is string => value !== undefined)
      .sort();
    const revokedDirectory = join(
      root,
      "public",
      "data",
      "v1",
      "snapshots",
      "20260801000000000-ffffffffffff",
    );
    await mkdir(revokedDirectory, { recursive: true });
    const revokedContents = serializeDeterministically(
      ambiguousAdministrativeMappings("approved").occupations,
    );
    await writeFile(
      join(revokedDirectory, "occupations.json"),
      revokedContents,
    );
    const quarantine = join(
      root,
      ".codex-tmp",
      "data-backup-revoked-snapshots-interrupted",
    );
    await mkdir(quarantine, { recursive: true });
    const quarantinedDirectory = join(
      quarantine,
      "20260801000000000-ffffffffffff",
    );
    await writeFile(
      join(quarantine, "snapshot-quarantine-journal.json"),
      serializeDeterministically({
        schemaVersion: "2.0.0",
        buildId: "interrupted-test-build",
        previousManifestIdentity: {
          canonicalSha256: createHash("sha256")
            .update(serializeDeterministically(previousManifest))
            .digest("hex"),
          snapshotIds: previousSnapshotIds,
        },
        candidateManifestIdentity: {
          canonicalSha256: "0".repeat(64),
          snapshotIds: [],
        },
        committed: false,
        entries: [
          {
            source: revokedDirectory,
            destination: quarantinedDirectory,
          },
        ],
      }),
    );
    await rename(revokedDirectory, quarantinedDirectory);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          beforeManifestCommit: () => {
            throw new Error("injected manifest swap failure after recovery");
          },
        },
      }),
    ).rejects.toThrow(/injected manifest swap failure after recovery/i);

    await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
    await expect(
      readFile(join(revokedDirectory, "occupations.json")),
    ).resolves.toEqual(revokedContents);
  });

  it("keeps an active revoked snapshot available until the replacement manifest is committed", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const previous = await readManifest(root);
    const revokedActiveDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-08-05T10:00:00.000Z"),
      loadCuratedMappings: async () => draftMappings,
      failureInjection: {
        beforeManifestCommit: async () => {
          await expect(access(revokedActiveDirectory)).resolves.toBeUndefined();
          await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
        },
      },
    });

    await expect(readFile(manifestPath)).resolves.not.toEqual(manifestBefore);
    await expect(access(revokedActiveDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();
  });

  it("restores the active revoked snapshot and manifest when post-swap quarantine fails", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const previous = await readManifest(root);
    const revokedActiveDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          afterActiveRevokedSnapshotQuarantine: () => {
            throw new Error("injected active quarantine failure");
          },
        },
      }),
    ).rejects.toThrow(/injected active quarantine failure/i);

    await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
    await expect(access(revokedActiveDirectory)).resolves.toBeUndefined();
    await expect(
      readFile(join(revokedActiveDirectory, "occupations.json"), "utf8"),
    ).resolves.toContain("occupation:cno11:4309");
  });

  it("preserves a manifest-addressed candidate when post-swap rollback also fails", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const previous = await readManifest(root);
    const revokedActiveDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          afterActiveRevokedSnapshotQuarantine: () => {
            throw new Error("injected post-swap failure");
          },
          beforeRollbackManifestCommit: () => {
            throw new Error("injected rollback commit failure");
          },
        } as SnapshotFailureInjection & {
          beforeRollbackManifestCommit: () => void;
        },
      }),
    ).rejects.toThrow(/rollback also failed/i);

    const active = await readManifest(root);
    expect(active.generatedAt).toBe("2026-08-05T10:00:00.000Z");
    const candidateOccupationPath = assetPath(
      root,
      active.resourceSnapshots.occupations.resourcePath,
    );
    await expect(access(candidateOccupationPath)).resolves.toBeUndefined();
    await expect(hashFile(candidateOccupationPath)).resolves.toBe(
      active.resourceSnapshots.occupations.sha256,
    );
    await expect(access(revokedActiveDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-08-06T10:00:00.000Z"),
      loadCuratedMappings: async () => draftMappings,
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();
  });

  it("finalizes a crash-pending quarantine when the candidate manifest is active", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const previous = await readManifest(root);
    const revokedActiveDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          crashAfterActiveSnapshotQuarantine: () => {
            throw new Error("simulated process crash after manifest swap");
          },
        } as SnapshotFailureInjection & {
          crashAfterActiveSnapshotQuarantine: () => void;
        },
      }),
    ).rejects.toThrow(/simulated process crash/i);

    await expect(access(revokedActiveDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const temporaryPath = join(root, ".codex-tmp");
    const pending = (await readdir(temporaryPath)).find((name) =>
      name.startsWith("data-backup-revoked-snapshots-"),
    );
    expect(pending).toBeDefined();
    await writeFile(
      join(temporaryPath, pending!, "snapshot-quarantine-journal.next.json"),
      "{truncated",
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-06T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        fetchTrainingRecords: async () => {
          throw new Error("injected fetch failure after recovery");
        },
      }),
    ).rejects.toThrow(/injected fetch failure after recovery/i);
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-08-07T10:00:00.000Z"),
      loadCuratedMappings: async () => draftMappings,
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();
  });

  it("finishes an entry journaled before its first rename when the candidate is active", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const previous = await readManifest(root);
    const revokedDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          crashAfterActiveJournalBeforeFirstSnapshotRename: () => {
            throw new Error("crash after durable journal before rename");
          },
        } as SnapshotFailureInjection & {
          crashAfterActiveJournalBeforeFirstSnapshotRename: () => void;
        },
      }),
    ).rejects.toThrow(/crash after durable journal before rename/i);
    await expect(access(revokedDirectory)).resolves.toBeUndefined();

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        loadCuratedMappings: async () => draftMappings,
        fetchTrainingRecords: async () => {
          throw new Error("fetch failed after entry recovery");
        },
      }),
    ).rejects.toThrow(/fetch failed after entry recovery/i);
    await expect(access(revokedDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();
    const active = await readManifest(root);
    await expect(
      access(
        assetPath(root, active.resourceSnapshots.occupations.resourcePath),
      ),
    ).resolves.toBeUndefined();
  });

  it("recovers a crash immediately after manifest commit from predeclared active entries", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const previous = await readManifest(root);
    const revokedDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          crashAfterManifestCommitBeforeActiveSnapshotRename: () => {
            throw new Error("crash immediately after manifest commit");
          },
        } as SnapshotFailureInjection & {
          crashAfterManifestCommitBeforeActiveSnapshotRename: () => void;
        },
      }),
    ).rejects.toThrow(/crash immediately after manifest commit/i);
    await expect(access(revokedDirectory)).resolves.toBeUndefined();

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        loadCuratedMappings: async () => draftMappings,
        fetchTrainingRecords: async () => {
          throw new Error("fetch failed after postcommit recovery");
        },
      }),
    ).rejects.toThrow(/fetch failed after postcommit recovery/i);
    await expect(access(revokedDirectory)).rejects.toMatchObject({
      code: "ENOENT",
    });
    const active = await readManifest(root);
    const candidatePath = assetPath(
      root,
      active.resourceSnapshots.occupations.resourcePath,
    );
    await expect(access(candidatePath)).resolves.toBeUndefined();
    await expect(hashFile(candidatePath)).resolves.toBe(
      active.resourceSnapshots.occupations.sha256,
    );
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-08-06T10:00:00.000Z"),
      loadCuratedMappings: async () => draftMappings,
    });
    await expect(
      assertPublicSnapshotDistribution(root, draftMappings),
    ).resolves.toBeUndefined();
  });

  it("leaves predeclared unmoved active entries intact when commit never happens", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifestBefore = await readFile(manifestPath);
    const previous = await readManifest(root);
    const activeDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          beforeManifestCommit: () => {
            throw new Error("commit never happened");
          },
        },
      }),
    ).rejects.toThrow(/commit never happened/i);

    await expect(readFile(manifestPath)).resolves.toEqual(manifestBefore);
    await expect(access(activeDirectory)).resolves.toBeUndefined();
    await expect(readManifest(root)).resolves.toEqual(previous);
  });

  it("restores moved entries when a committed journal still has the previous manifest active", async () => {
    const root = await temporaryRoot();
    const approvedMappings = ambiguousOccupationMappings("approved");
    const draftMappings = ambiguousOccupationMappings("draft");
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      loadCuratedMappings: async () => approvedMappings,
    });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const previousManifestBytes = await readFile(manifestPath);
    const previous = await readManifest(root);
    const revokedDirectory = dirname(
      assetPath(root, previous.resourceSnapshots.occupations.resourcePath),
    );
    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        loadCuratedMappings: async () => draftMappings,
        failureInjection: {
          crashAfterActiveSnapshotQuarantine: () => {
            throw new Error("leave committed-marker fixture");
          },
        },
      }),
    ).rejects.toThrow(/leave committed-marker fixture/i);
    const temporaryPath = join(root, ".codex-tmp");
    const pending = (await readdir(temporaryPath)).find((name) =>
      name.startsWith("data-backup-revoked-snapshots-"),
    )!;
    const journalPath = join(
      temporaryPath,
      pending,
      "snapshot-quarantine-journal.json",
    );
    const journal = JSON.parse(await readFile(journalPath, "utf8")) as Record<
      string,
      unknown
    >;
    await writeFile(
      journalPath,
      serializeDeterministically({ ...journal, committed: true }),
    );
    await writeFile(manifestPath, previousManifestBytes);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        loadCuratedMappings: async () => approvedMappings,
        fetchTrainingRecords: async () => {
          throw new Error("fetch failed after previous recovery");
        },
      }),
    ).rejects.toThrow(/fetch failed after previous recovery/i);
    await expect(access(revokedDirectory)).resolves.toBeUndefined();
  });

  it("isolates a corrupt quarantine journal without restoring or looping forever", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const quarantine = join(
      root,
      ".codex-tmp",
      "data-backup-revoked-snapshots-corrupt",
    );
    await mkdir(quarantine, { recursive: true });
    await writeFile(
      join(quarantine, "snapshot-quarantine-journal.json"),
      "{truncated",
    );
    await writeFile(join(quarantine, "revoked-backup.json"), "preserve me");

    await expect(
      buildSnapshots({ rootDirectory: root, ...fixedOptions }),
    ).rejects.toThrow(/quarantine journal/i);
    await expect(access(quarantine)).rejects.toMatchObject({ code: "ENOENT" });
    const isolated = (await readdir(join(root, ".codex-tmp"))).find((name) =>
      name.startsWith("data-quarantine-corrupt-"),
    );
    expect(isolated).toBeDefined();
    await expect(
      readFile(
        join(root, ".codex-tmp", isolated!, "revoked-backup.json"),
        "utf8",
      ),
    ).resolves.toBe("preserve me");

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords: async () => {
          throw new Error("retry reached fetch");
        },
      }),
    ).rejects.toThrow(/retry reached fetch/i);
  });

  it("lets one builder hold the lock while two competitors fail before fetch", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const before = await readManifest(root);
    let signalPaused!: () => void;
    let resumeBuild!: () => void;
    const paused = new Promise<void>((resolvePaused) => {
      signalPaused = resolvePaused;
    });
    const resume = new Promise<void>((resolveResume) => {
      resumeBuild = resolveResume;
    });

    const buildY = buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2027-01-02T10:00:00.000Z"),
      failureInjection: {
        beforeManifestCommit: async () => {
          signalPaused();
          await resume;
        },
      },
    });
    await paused;

    const competitorFetches = [
      vi.fn(fixedOptions.fetchTrainingRecords),
      vi.fn(fixedOptions.fetchTrainingRecords),
    ];
    const [buildXError, buildZError] = await Promise.all(
      competitorFetches.map((fetchTrainingRecords, index) =>
        buildSnapshots({
          rootDirectory: root,
          ...fixedOptions,
          fetchTrainingRecords,
          now: () => new Date(`2027-01-0${index + 3}T10:00:00.000Z`),
        }).then(
          () => undefined,
          (error: unknown) => error,
        ),
      ),
    );
    const during = await readManifest(root);
    resumeBuild();
    await buildY;

    for (const error of [buildXError, buildZError]) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/operator|manual/i);
    }
    for (const fetchTrainingRecords of competitorFetches) {
      expect(fetchTrainingRecords).not.toHaveBeenCalled();
    }
    expect(during).toEqual(before);
    const committed = await readManifest(root);
    expect(committed.generatedAt).toBe("2027-01-02T10:00:00.000Z");
    await expect(
      access(
        assetPath(root, committed.resourceSnapshots.programs.resourcePath),
      ),
    ).resolves.toBeUndefined();
  });

  it("fails closed on a dead-owner lock and preserves the last known good snapshot", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const before = await readManifest(root);
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    const lockBytes = `${JSON.stringify({
      schemaVersion: "1.0.0",
      token: "00000000-0000-4000-8000-000000000001",
      pid: 2_147_483_647,
      startedAt: "2026-01-01T00:00:00.000Z",
      root,
      buildId: "2147483647-00000000-0000-4000-8000-000000000001",
    })}\n`;
    await writeFile(lockPath, lockBytes, "utf8");
    const fetchTrainingRecords = vi.fn(fixedOptions.fetchTrainingRecords);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords,
      }),
    ).rejects.toThrow(/operator|manual/i);

    expect(fetchTrainingRecords).not.toHaveBeenCalled();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(lockBytes);
    await expect(readManifest(root)).resolves.toEqual(before);
  });

  it("fails closed on malformed lock metadata without marking data stale", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const before = await readManifest(root);
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    const lockBytes = `${JSON.stringify({
      schemaVersion: "1.0.0",
      token: "00000000-0000-4000-8000-000000000001",
      pid: 2_147_483_647,
      startedAt: "2026-01-01T00:00:00.000Z",
      root,
      buildId: "crashed-build",
      unexpected: true,
    })}\n`;
    await writeFile(lockPath, lockBytes, "utf8");

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2027-01-02T10:00:00.000Z"),
      }),
    ).rejects.toThrow(/operator|manual/i);
    await expect(readManifest(root)).resolves.toEqual(before);
    await expect(readFile(lockPath, "utf8")).resolves.toBe(lockBytes);
  });

  it("rejects lock metadata whose build identity does not match pid and token", async () => {
    const root = await temporaryRoot();
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    await mkdir(temporaryRootPath, { recursive: true });
    const lockBytes = `${JSON.stringify({
      schemaVersion: "1.0.0",
      token: "00000000-0000-4000-8000-000000000001",
      pid: 2_147_483_647,
      startedAt: "2026-01-01T00:00:00.000Z",
      root,
      buildId: "crashed-build",
    })}\n`;
    await writeFile(lockPath, lockBytes, "utf8");

    await expect(
      buildSnapshots({ rootDirectory: root, ...fixedOptions }),
    ).rejects.toThrow(/operator|manual/i);
    await expect(readFile(lockPath, "utf8")).resolves.toBe(lockBytes);
  });

  it("rejects a non-canonical stored root before any build work", async () => {
    const root = await temporaryRoot();
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    await mkdir(temporaryRootPath, { recursive: true });
    const lockBytes = `${JSON.stringify({
      schemaVersion: "1.0.0",
      token: "00000000-0000-4000-8000-000000000001",
      pid: 2_147_483_647,
      startedAt: "2026-01-01T00:00:00.000Z",
      root: `${root}${sep}nested${sep}..`,
      buildId: "2147483647-00000000-0000-4000-8000-000000000001",
    })}\n`;
    await writeFile(lockPath, lockBytes, "utf8");
    const fetchTrainingRecords = vi.fn(fixedOptions.fetchTrainingRecords);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords,
      }),
    ).rejects.toThrow(/operator|manual/i);
    expect(fetchTrainingRecords).not.toHaveBeenCalled();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(lockBytes);
  });

  it.each([
    {
      name: "handle close rejection",
      message: "injected lock close rejection",
      hooks: lockFailureInjection({
        closeLockHandle: async (close: () => Promise<void>) => {
          await close();
          throw new Error("injected lock close rejection");
        },
      }),
    },
    {
      name: "post-close physical assertion failure",
      message: "injected lock physical assertion failure",
      hooks: lockFailureInjection({
        assertLockPhysicalAfterClose: async (
          assertPhysical: () => Promise<void>,
        ) => {
          await assertPhysical();
          throw new Error("injected lock physical assertion failure");
        },
      }),
    },
  ])(
    "cleans its atomically created lock after $name",
    async ({ hooks, message }) => {
      const root = await temporaryRoot();
      const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");

      await expect(
        buildSnapshots({
          rootDirectory: root,
          ...fixedOptions,
          failureInjection: hooks,
        }),
      ).rejects.toThrow(message);
      await expect(access(lockPath)).rejects.toMatchObject({ code: "ENOENT" });

      await expect(
        buildSnapshots({ rootDirectory: root, ...fixedOptions }),
      ).resolves.toBeUndefined();
    },
  );

  it("preserves a cooperative replacement installed before normal release validation", async () => {
    const root = await temporaryRoot();
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    const replacementBytes = snapshotLockBytes(
      root,
      "00000000-0000-4000-8000-000000000011",
    );
    const log = vi.fn();
    const beforeLockReleaseValidation = vi.fn(async () => {
      await rm(lockPath);
      await writeFile(lockPath, replacementBytes, "utf8");
    });

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        log,
        failureInjection: lockFailureInjection({
          beforeLockReleaseValidation,
        }),
      }),
    ).resolves.toBeUndefined();

    expect(beforeLockReleaseValidation).toHaveBeenCalledOnce();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(replacementBytes);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/release failure/i));
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/operator|manual/i));
  });

  it("preserves a cooperative replacement installed before failed-acquisition cleanup validation", async () => {
    const root = await temporaryRoot();
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    const replacementBytes = snapshotLockBytes(
      root,
      "00000000-0000-4000-8000-000000000012",
    );
    const log = vi.fn();
    const beforeFailedLockCleanupValidation = vi.fn(async () => {
      await rm(lockPath);
      await writeFile(lockPath, replacementBytes, "utf8");
    });

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        log,
        failureInjection: lockFailureInjection({
          closeLockHandle: async (close) => {
            await close();
            throw new Error("primary close failure");
          },
          beforeFailedLockCleanupValidation,
        }),
      }),
    ).rejects.toThrow("primary close failure");

    expect(beforeFailedLockCleanupValidation).toHaveBeenCalledOnce();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(replacementBytes);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/cleanup failure/i));
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/operator|manual/i));
  });

  it("preserves a contender that acquires the canonical path after normal release renames its owned lock", async () => {
    const root = await temporaryRoot();
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    const contenderBytes = snapshotLockBytes(
      root,
      "00000000-0000-4000-8000-000000000013",
    );
    const afterLockReleaseOwnedRename = vi.fn(() =>
      writeFile(lockPath, contenderBytes, { encoding: "utf8", flag: "wx" }),
    );

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      failureInjection: lockFailureInjection({
        afterLockReleaseOwnedRename,
      }),
    });

    expect(afterLockReleaseOwnedRename).toHaveBeenCalledOnce();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(contenderBytes);
  });

  it("preserves a contender that acquires the canonical path after failed-acquisition cleanup renames its owned lock", async () => {
    const root = await temporaryRoot();
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    const contenderBytes = snapshotLockBytes(
      root,
      "00000000-0000-4000-8000-000000000014",
    );
    const afterFailedLockCleanupOwnedRename = vi.fn(() =>
      writeFile(lockPath, contenderBytes, { encoding: "utf8", flag: "wx" }),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        failureInjection: lockFailureInjection({
          closeLockHandle: async (close) => {
            await close();
            throw new Error("primary close failure");
          },
          afterFailedLockCleanupOwnedRename,
        }),
      }),
    ).rejects.toThrow("primary close failure");

    expect(afterFailedLockCleanupOwnedRename).toHaveBeenCalledOnce();
    await expect(readFile(lockPath, "utf8")).resolves.toBe(contenderBytes);
  });

  it("refuses an existing symbolic lock with safe operator guidance without following it", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    const targetPath = join(temporaryRootPath, "untrusted-lock-target");
    const targetBytes = "untrusted lock target\n";
    await writeFile(targetPath, targetBytes, "utf8");
    await symlink(targetPath, lockPath, "file");

    await expect(
      buildSnapshots({ rootDirectory: root, ...fixedOptions }),
    ).rejects.toThrow(/operator|manual/i);

    await expect(readFile(targetPath, "utf8")).resolves.toBe(targetBytes);
    await expect(readFile(lockPath, "utf8")).resolves.toBe(targetBytes);
  });

  it("writes validated immutable resources with exact counts and hashes", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });

    const manifest = await readManifest(root);
    const resources = [
      "programs",
      "centers",
      "trainingOfferings",
      "jobOffers",
    ] as const;

    expect(manifest.qualityStatus).toBe("passed");
    expect(manifest.qualityReport).toMatchObject({
      counts: { programs: 1, centers: 1, offerings: 1, offers: 1 },
    });

    for (const key of resources) {
      const snapshot = manifest.resourceSnapshots[key];
      expect(snapshot.resourcePath).toMatch(
        /^\/data\/v1\/snapshots\/[a-z0-9-]+\/.+\.json$/u,
      );
      const bytes = await readFile(assetPath(root, snapshot.resourcePath));
      const records = JSON.parse(bytes.toString("utf8")) as unknown[];
      expect(snapshot.recordCount).toBe(records.length);
      expect(snapshot.sha256).toBe(
        createHash("sha256").update(bytes).digest("hex"),
      );
    }
  });

  it("migrates the transitional top-level offer timestamp before refresh", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifest = await readManifest(root);
    const jobOffersPath = assetPath(
      root,
      manifest.resourceSnapshots.jobOffers.resourcePath,
    );
    const jobOffers = JSON.parse(
      await readFile(jobOffersPath, "utf8"),
    ) as Array<Record<string, unknown>>;
    const firstOffer = jobOffers[0];
    const sourceSnapshot = firstOffer.sourceSnapshot as Record<string, unknown>;
    firstOffer.sourceRecordUpdatedAt = sourceSnapshot.sourceUpdatedAt;
    await writeFile(
      jobOffersPath,
      `${JSON.stringify(jobOffers, null, 2)}\n`,
      "utf8",
    );
    manifest.resourceSnapshots.jobOffers.sha256 = await hashFile(jobOffersPath);
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
      }),
    ).resolves.toBeUndefined();

    const refreshed = await readManifest(root);
    const refreshedOffers = JSON.parse(
      await readFile(
        assetPath(root, refreshed.resourceSnapshots.jobOffers.resourcePath),
        "utf8",
      ),
    ) as Array<Record<string, unknown>>;
    expect(refreshedOffers[0]).not.toHaveProperty("sourceRecordUpdatedAt");
    expect(refreshedOffers[0]?.sourceSnapshot).toMatchObject({
      sourceUpdatedAt: new Date(
        liveOfferSourceRecord.actualizacionmetadatos,
      ).toISOString(),
    });
  });

  it("preserves prior resource bytes and records staleness after refresh failure", async () => {
    const root = await temporaryRoot();
    const options = { rootDirectory: root, ...fixedOptions };
    await buildSnapshots(options);

    const beforeManifest = await readManifest(root);
    const resourcePaths = Object.values(beforeManifest.resourceSnapshots).map(
      (snapshot) => snapshot.resourcePath,
    );
    const before = await Promise.all(
      resourcePaths.map((path) => readFile(assetPath(root, path))),
    );

    await expect(
      buildSnapshots({
        ...options,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        fetchTrainingRecords: async () => {
          throw new Error("official source unavailable");
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    const after = await Promise.all(
      resourcePaths.map((path) => readFile(assetPath(root, path))),
    );
    expect(after).toEqual(before);

    const manifest = await readManifest(root);
    expect(manifest.qualityStatus).toBe("stale");
    expect(
      Object.values(manifest.resourceSnapshots).map(
        (snapshot) => snapshot.resourcePath,
      ),
    ).toEqual(resourcePaths);
    expect(
      Object.values(manifest.resourceSnapshots).every(
        (snapshot) => snapshot.qualityStatus === "stale",
      ),
    ).toBe(true);
  });

  it("blocks upstream field drift and preserves the previous published resources", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const beforeManifest = await readManifest(root);
    const resourcePaths = Object.values(beforeManifest.resourceSnapshots).map(
      (snapshot) => snapshot.resourcePath,
    );
    const beforeBytes = await Promise.all(
      resourcePaths.map((path) => readFile(assetPath(root, path))),
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        fetchTrainingRecords: async () => [
          {
            ...liveTrainingSourceRecord,
            upstream_renamed_field: "drift",
          },
        ],
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    const afterManifest = await readManifest(root);
    expect(afterManifest.qualityStatus).toBe("stale");
    expect(
      Object.values(afterManifest.resourceSnapshots).map(
        (snapshot) => snapshot.resourcePath,
      ),
    ).toEqual(resourcePaths);
    await expect(
      Promise.all(resourcePaths.map((path) => readFile(assetPath(root, path)))),
    ).resolves.toEqual(beforeBytes);
  });

  it("publishes identical bytes for equivalent source arrays in reverse order", async () => {
    const firstRoot = await temporaryRoot();
    const secondRoot = await temporaryRoot();
    const trainingB = {
      ...liveTrainingSourceRecord,
      clave_ciclo: "IFC03S",
      ciclo_formativo_curso_de_especializacion:
        "Desarrollo de Aplicaciones Web",
      codigo_centro: "47000000",
      centro_educativo: "IES Río Duero",
      familia_profesional: "Informática y Comunicaciones",
      codigo_familia: "IFC",
      nivel_educativo: "Grado Superior",
      provincia: "Valladolid",
      localidad: "Valladolid",
    };
    const offerB = {
      ...liveOfferSourceRecord,
      identificador: "09-2026-00001",
      titulo: "Álbum profesional",
      enlace_al_contenido: "https://empleo.jcyl.es/oferta/09-2026-00001",
    };
    const first = {
      ...fixedOptions,
      fetchTrainingRecords: async () => [
        { ...liveTrainingSourceRecord },
        trainingB,
      ],
      fetchOfferRecords: async () => [{ ...liveOfferSourceRecord }, offerB],
    };
    const second = {
      ...fixedOptions,
      fetchTrainingRecords: async () => [
        trainingB,
        { ...liveTrainingSourceRecord },
      ],
      fetchOfferRecords: async () => [offerB, { ...liveOfferSourceRecord }],
    };

    await buildSnapshots({ rootDirectory: firstRoot, ...first });
    await buildSnapshots({ rootDirectory: secondRoot, ...second });

    const firstManifest = await readManifest(firstRoot);
    const secondManifest = await readManifest(secondRoot);
    expect(secondManifest).toEqual(firstManifest);
    for (const key of Object.keys(firstManifest.resourceSnapshots) as Array<
      keyof typeof firstManifest.resourceSnapshots
    >) {
      const firstSnapshot = firstManifest.resourceSnapshots[key];
      const secondSnapshot = secondManifest.resourceSnapshots[key];
      expect(
        await readFile(assetPath(secondRoot, secondSnapshot.resourcePath)),
      ).toEqual(
        await readFile(assetPath(firstRoot, firstSnapshot.resourcePath)),
      );
    }
  });

  it("keeps the old manifest live when interrupted before the manifest commit", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const before = await readManifest(root);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        failureInjection: {
          beforeManifestCommit: () => {
            throw new Error("interrupted before manifest commit");
          },
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    const after = await readManifest(root);
    expect(after.qualityStatus).toBe("stale");
    expect(
      Object.values(after.resourceSnapshots).map((item) => item.resourcePath),
    ).toEqual(
      Object.values(before.resourceSnapshots).map((item) => item.resourcePath),
    );
  });

  it("leaves the newly committed snapshot fresh when interrupted after commit", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-08-05T10:00:00.000Z"),
        failureInjection: {
          afterManifestCommit: () => {
            throw new Error("interrupted after manifest commit");
          },
        },
      }),
    ).rejects.toThrow(/interrupted after manifest commit/i);

    const manifest = await readManifest(root);
    expect(manifest.generatedAt).toBe("2026-08-05T10:00:00.000Z");
    expect(manifest.qualityStatus).toBe("passed");
    await expect(
      access(assetPath(root, manifest.resourceSnapshots.programs.resourcePath)),
    ).resolves.toBeUndefined();
  });

  it("treats post-commit cleanup failure as non-fatal and keeps data fresh", async () => {
    const root = await temporaryRoot();
    const lockedBackup = join(
      root,
      ".codex-tmp",
      "data-backup-locked-after-commit",
    );
    await mkdir(lockedBackup, { recursive: true });
    const beforeCleanup = vi.fn(() => {
      throw new Error("locked cleanup target");
    });

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        failureInjection: {
          beforeCleanup,
        },
      }),
    ).resolves.toBeUndefined();

    expect(beforeCleanup).toHaveBeenCalled();
    await expect(access(lockedBackup)).resolves.toBeUndefined();
    await expect(readManifest(root)).resolves.toMatchObject({
      qualityStatus: "passed",
    });
  });

  it("rejects corrupt but self-consistent prior snapshots before fetching", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const manifest = await readManifest(root);
    const programsPath = assetPath(
      root,
      manifest.resourceSnapshots.programs.resourcePath,
    );
    const programs = JSON.parse(await readFile(programsPath, "utf8"));
    programs.push(programs[0]);
    const bytes = `${JSON.stringify(programs, null, 2)}\n`;
    await writeFile(programsPath, bytes, "utf8");
    manifest.resourceSnapshots.programs.recordCount = programs.length;
    manifest.resourceSnapshots.programs.sha256 = createHash("sha256")
      .update(bytes)
      .digest("hex");
    if (manifest.qualityReport !== undefined) {
      manifest.qualityReport.counts.programs = programs.length;
    }
    await writeFile(
      join(root, "public", "data", "v1", "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({ rootDirectory: root, ...fixedOptions }),
    ).rejects.toThrow(/duplicate program/i);
  });

  it("rejects a prior manifest with contradictory null-rate metadata", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const manifest = await readManifest(root);
    if (manifest.qualityReport === undefined) {
      throw new Error("Expected generated quality report");
    }
    manifest.qualityReport.nullRates.offerLocality = 0.5;
    await writeFile(
      join(root, "public", "data", "v1", "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    const fetchTrainingRecords = vi.fn(fixedOptions.fetchTrainingRecords);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords,
      }),
    ).rejects.toThrow(/quality report/i);
    expect(fetchTrainingRecords).not.toHaveBeenCalled();
  });

  it("rejects a current prior manifest missing its quality report", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    delete manifest.qualityReport;
    await writeFile(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
    const before = await readFile(manifestPath);
    const fetchTrainingRecords = vi.fn(fixedOptions.fetchTrainingRecords);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords,
      }),
    ).rejects.toThrow(/qualityReport|invalid|union/i);
    expect(fetchTrainingRecords).not.toHaveBeenCalled();
    await expect(readFile(manifestPath)).resolves.toEqual(before);
  });

  it("accepts the exact fixed-point immutable manifest with pre-hardening payloads", async () => {
    const root = await temporaryRoot();
    const output = join(root, "public", "data", "v1");
    const fixedPointDirectory = join(
      output,
      "snapshots",
      FIXED_POINT_SNAPSHOT_ID,
    );
    await mkdir(fixedPointDirectory, { recursive: true });

    const resourceBytes = {} as Record<
      keyof typeof fixedPointManifest.resourceSnapshots,
      Buffer
    >;
    for (const key of ["programs", "centers", "trainingOfferings"] as const) {
      const fileName =
        key === "trainingOfferings" ? "training-offerings.json" : `${key}.json`;
      resourceBytes[key] = await readFile(
        join(process.cwd(), "public", "data", "v1", fileName),
      );
      await writeFile(join(fixedPointDirectory, fileName), resourceBytes[key]);
    }

    const fixedPointOffers = JSON.parse(
      await readFile(
        join(process.cwd(), "public", "data", "v1", "job-offers.json"),
        "utf8",
      ),
    ) as Array<Record<string, unknown>>;
    for (const offer of fixedPointOffers) {
      offer.sourceSnapshot = fixedPointOfferSourceSnapshot;
    }
    resourceBytes.jobOffers = serializeDeterministically(fixedPointOffers);
    await writeFile(
      join(fixedPointDirectory, "job-offers.json"),
      resourceBytes.jobOffers,
    );

    for (const key of Object.keys(
      fixedPointManifest.resourceSnapshots,
    ) as Array<keyof typeof fixedPointManifest.resourceSnapshots>) {
      expect(
        createHash("sha256").update(resourceBytes[key]).digest("hex"),
      ).toBe(fixedPointManifest.resourceSnapshots[key].sha256);
    }
    const manifestPath = join(output, "manifest.json");
    await writeFile(
      manifestPath,
      `${JSON.stringify(fixedPointManifest, null, 2)}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords: async () => {
          throw new Error("official source unavailable");
        },
      }),
    ).rejects.toThrow(/official source unavailable/i);

    const staleManifest = GeneratedManifestSchema.parse(
      JSON.parse(await readFile(manifestPath, "utf8")),
    );
    expect(staleManifest.qualityStatus).toBe("stale");
    for (const key of Object.keys(
      fixedPointManifest.resourceSnapshots,
    ) as Array<keyof typeof fixedPointManifest.resourceSnapshots>) {
      expect(staleManifest.resourceSnapshots[key].qualityStatus).toBe("stale");
      await expect(
        readFile(
          assetPath(
            root,
            fixedPointManifest.resourceSnapshots[key].resourcePath,
          ),
        ),
      ).resolves.toEqual(resourceBytes[key]);
    }
  });

  it("marks a valid legacy flat snapshot stale without changing resource bytes", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const manifest = await readManifest(root);
    const output = join(root, "public", "data", "v1");
    const fileNames = {
      programs: "programs.json",
      centers: "centers.json",
      trainingOfferings: "training-offerings.json",
      jobOffers: "job-offers.json",
    } as const;
    const before = {} as Record<keyof typeof fileNames, Buffer>;
    const recordCounts = {} as Record<keyof typeof fileNames, number>;

    for (const key of Object.keys(fileNames) as Array<keyof typeof fileNames>) {
      const legacyBytes = await readFile(
        join(process.cwd(), "public", "data", "v1", fileNames[key]),
      );
      before[key] = legacyBytes;
      recordCounts[key] = (
        JSON.parse(legacyBytes.toString("utf8")) as unknown[]
      ).length;
      await writeFile(join(output, fileNames[key]), legacyBytes);
    }
    const legacyManifest = {
      schemaVersion: manifest.schemaVersion,
      generatedAt: manifest.generatedAt,
      qualityStatus: manifest.qualityStatus,
      resourceSnapshots: Object.fromEntries(
        Object.entries(fileNames).map(([key]) => [
          key,
          {
            ...Object.fromEntries(
              Object.entries(
                manifest.resourceSnapshots[key as keyof typeof fileNames],
              ).filter(([field]) => field !== "resourcePath"),
            ),
            sha256: createHash("sha256")
              .update(before[key as keyof typeof fileNames])
              .digest("hex"),
            recordCount: recordCounts[key as keyof typeof fileNames],
          },
        ]),
      ),
    };
    await writeFile(
      join(output, "manifest.json"),
      `${JSON.stringify(legacyManifest, null, 2)}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords: async () => {
          throw new Error("official source unavailable");
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    const staleJson = JSON.parse(
      await readFile(join(output, "manifest.json"), "utf8"),
    );
    expect(staleJson.qualityStatus).toBe("stale");
    expect(LoadableGeneratedManifestSchema.safeParse(staleJson).success).toBe(
      true,
    );
    for (const key of Object.keys(fileNames) as Array<keyof typeof fileNames>) {
      await expect(readFile(join(output, fileNames[key]))).resolves.toEqual(
        before[key],
      );
    }
  });

  it("recovers a legacy interrupted backup before attempting refresh", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const temporary = join(root, ".codex-tmp");
    const target = join(root, "public", "data", "v1");
    const backup = join(temporary, "data-backup-interrupted");
    await rename(target, backup);

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        fetchTrainingRecords: async () => {
          throw new Error("official source unavailable");
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);

    await expect(readManifest(root)).resolves.toMatchObject({
      qualityStatus: "stale",
    });
  });

  it("cleans abandoned staging state after the next successful commit", async () => {
    const root = await temporaryRoot();
    const abandoned = join(root, ".codex-tmp", "data-build-abandoned");
    await mkdir(abandoned, { recursive: true });
    await writeFile(join(abandoned, "partial.json"), "{", "utf8");

    await buildSnapshots({ rootDirectory: root, ...fixedOptions });

    await expect(access(abandoned)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readManifest(root)).resolves.toMatchObject({
      qualityStatus: "passed",
    });
  });

  it("retains the current snapshot and only two prior immutable snapshots", async () => {
    const root = await temporaryRoot();
    const snapshotPaths: string[] = [];
    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const orphan = join(snapshotsRoot, "20000101000000000-aaaaaaaaaaaa");

    for (let day = 1; day <= 4; day += 1) {
      await buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date(`2026-08-0${day}T10:00:00.000Z`),
      });
      snapshotPaths.push(
        (await readManifest(root)).resourceSnapshots.programs.resourcePath,
      );
      if (day === 1) {
        await mkdir(orphan, { recursive: true });
        await writeFile(join(orphan, "partial.json"), "{", "utf8");
      }
    }

    const currentManifest = await readManifest(root);
    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const currentId = currentManifest.resourceSnapshots.programs.resourcePath
      .split("/")
      .at(-2);

    expect(retained).toHaveLength(3);
    expect(retained).toContain(currentId);
    await expect(
      access(assetPath(root, snapshotPaths[0])),
    ).rejects.toMatchObject({
      code: "ENOENT",
    });
    await expect(access(orphan)).rejects.toMatchObject({ code: "ENOENT" });
    for (const path of snapshotPaths.slice(-3)) {
      await expect(access(assetPath(root, path))).resolves.toBeUndefined();
    }
  });

  it("transactionally quarantines a self-consistent snapshot with stale requirement semantics", async () => {
    const root = await temporaryRoot();
    const options = {
      ...fixedOptions,
      fetchOfferRecords: async () => [
        {
          ...liveOfferSourceRecord,
          descripcion: "<p>Requisitos:</p><ul><li>Grado en Derecho.</li></ul>",
        },
      ],
    };
    await buildSnapshots({ rootDirectory: root, ...options });
    const staleManifest = await readManifest(root);
    const staleSnapshotId =
      staleManifest.resourceSnapshots.jobOffers.resourcePath.split("/").at(-2)!;
    const sidecarPath = assetPath(
      root,
      staleManifest.resourceSnapshots.publishedRequirements!.resourcePath,
    );
    const sidecar = JSON.parse(await readFile(sidecarPath, "utf8")) as Array<{
      offerId: string;
      requirements: Array<Record<string, unknown> & { sourceQuote: string }>;
    }>;
    const requirement = sidecar[0]!.requirements[0]!;
    sidecar[0]!.requirements[0] = {
      ...requirement,
      id: publishedRequirementId(
        sidecar[0]!.offerId,
        "unclassified",
        requirement.sourceQuote,
      ),
      category: "unclassified",
      normalizedValue: null,
      parserRule: "unclassified.conservative_fallback",
    };
    await writeFile(
      sidecarPath,
      `${JSON.stringify(sidecar, null, 2)}\n`,
      "utf8",
    );
    const manifestPath = join(root, "public", "data", "v1", "manifest.json");
    const staleManifestBytes = JSON.parse(
      await readFile(manifestPath, "utf8"),
    ) as typeof staleManifest;
    staleManifestBytes.resourceSnapshots.publishedRequirements!.sha256 =
      await hashFile(sidecarPath);
    await writeFile(
      manifestPath,
      `${JSON.stringify(staleManifestBytes, null, 2)}\n`,
      "utf8",
    );

    await buildSnapshots({
      rootDirectory: root,
      ...options,
      now: () => new Date("2026-08-05T10:00:00.000Z"),
    });

    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(retained).toHaveLength(1);
    expect(retained).not.toContain(staleSnapshotId);
    await expect(
      access(join(snapshotsRoot, staleSnapshotId)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("still enforces retention when earlier post-commit cleanup fails", async () => {
    const root = await temporaryRoot();
    for (let day = 1; day <= 4; day += 1) {
      await buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date(`2026-09-0${day}T10:00:00.000Z`),
        failureInjection:
          day === 4
            ? {
                beforeCleanup: () => {
                  throw new Error("locked temporary cleanup");
                },
              }
            : undefined,
      });
    }

    const manifest = await readManifest(root);
    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const currentId = manifest.resourceSnapshots.programs.resourcePath
      .split("/")
      .at(-2);

    expect(retained).toHaveLength(3);
    expect(retained).toContain(currentId);
  });

  it("removes each immutable candidate when manifest commit fails", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const publishedId = (
      await readManifest(root)
    ).resourceSnapshots.programs.resourcePath
      .split("/")
      .at(-2);

    for (let day = 2; day <= 5; day += 1) {
      await expect(
        buildSnapshots({
          rootDirectory: root,
          ...fixedOptions,
          now: () => new Date(`2026-10-0${day}T10:00:00.000Z`),
          failureInjection: {
            beforeManifestCommit: () => {
              throw new Error("manifest commit blocked");
            },
          },
        }),
      ).rejects.toThrow(/previous snapshot marked stale/i);
    }

    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(retained).toEqual([publishedId]);
  });

  it("does not retain a failed future candidate as published history", async () => {
    const root = await temporaryRoot();
    const publishedIds: string[] = [];
    for (let day = 1; day <= 3; day += 1) {
      await buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date(`2026-11-0${day}T10:00:00.000Z`),
      });
      publishedIds.push(
        (await readManifest(root)).resourceSnapshots.programs.resourcePath
          .split("/")
          .at(-2)!,
      );
    }

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2026-11-04T10:00:00.000Z"),
        failureInjection: {
          beforeManifestCommit: () => {
            throw new Error("manifest commit blocked");
          },
        },
      }),
    ).rejects.toThrow(/previous snapshot marked stale/i);
    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-11-05T10:00:00.000Z"),
    });
    publishedIds.push(
      (await readManifest(root)).resourceSnapshots.programs.resourcePath
        .split("/")
        .at(-2)!,
    );

    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(retained).toEqual(publishedIds.slice(1).sort());
  });

  it("removes a crash orphan newer than the committed manifest on startup", async () => {
    const root = await temporaryRoot();
    const publishedIds: string[] = [];
    for (let day = 1; day <= 3; day += 1) {
      await buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date(`2026-12-0${day}T10:00:00.000Z`),
      });
      publishedIds.push(
        (await readManifest(root)).resourceSnapshots.programs.resourcePath
          .split("/")
          .at(-2)!,
      );
    }
    const snapshotsRoot = join(root, "public", "data", "v1", "snapshots");
    const suffix = publishedIds[2]!.split("-").at(-1);
    const orphanId = `20261204100000000-${suffix}`;
    await cp(
      join(snapshotsRoot, publishedIds[2]!),
      join(snapshotsRoot, orphanId),
      { recursive: true },
    );

    await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2026-12-05T10:00:00.000Z"),
    });
    publishedIds.push(
      (await readManifest(root)).resourceSnapshots.programs.resourcePath
        .split("/")
        .at(-2)!,
    );

    const retained = (await readdir(snapshotsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(retained).toEqual(publishedIds.slice(1).sort());
    expect(retained).not.toContain(orphanId);
  });

  it.each([{ linkedPath: "public/data" }, { linkedPath: ".codex-tmp" }])(
    "rejects a physical junction escape through $linkedPath",
    async ({ linkedPath }) => {
      const root = await temporaryRoot();
      const outside = await temporaryRoot();
      const marker = join(outside, "outside-marker.txt");
      await writeFile(marker, "untouched", "utf8");
      const link = resolve(root, linkedPath);
      await mkdir(join(link, ".."), { recursive: true });

      try {
        await symlink(
          outside,
          link,
          process.platform === "win32" ? "junction" : "dir",
        );
      } catch (error) {
        if (
          error !== null &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "EPERM"
        ) {
          return;
        }
        throw error;
      }

      await expect(
        buildSnapshots({ rootDirectory: root, ...fixedOptions }),
      ).rejects.toThrow(/symbolic link|junction|reparse|physical path/i);
      await expect(readFile(marker, "utf8")).resolves.toBe("untouched");
    },
  );
});
