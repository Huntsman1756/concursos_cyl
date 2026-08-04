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
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GeneratedManifestSchema,
  LoadableGeneratedManifestSchema,
} from "../../data/schemas/generated";
import {
  liveOfferSourceRecord,
  liveTrainingSourceRecord,
} from "../../tests/fixtures/sourceRecords";
import {
  buildSnapshots,
  type SnapshotFailureInjection,
} from "./buildSnapshots";
import { hashFile } from "./hashFile";

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
  log: () => undefined,
};

function lockFailureInjection(
  hooks: Record<string, unknown>,
): SnapshotFailureInjection {
  return hooks as SnapshotFailureInjection;
}

async function waitForSignal(signal: Promise<void>): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      signal,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Timed out waiting for lock interleaving.")),
          2_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
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
  it("rejects an overlapping live build without touching its candidate or manifest", async () => {
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

    const buildA = buildSnapshots({
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

    const buildBError = await buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2027-01-03T10:00:00.000Z"),
    }).then(
      () => undefined,
      (error: unknown) => error,
    );
    const during = await readManifest(root);
    resumeBuild();
    await buildA;

    expect(buildBError).toBeInstanceOf(Error);
    expect((buildBError as Error).message).toMatch(/already in progress/i);
    expect(during).toEqual(before);
    const committed = await readManifest(root);
    expect(committed.generatedAt).toBe("2027-01-02T10:00:00.000Z");
    await expect(
      access(
        assetPath(root, committed.resourceSnapshots.programs.resourcePath),
      ),
    ).resolves.toBeUndefined();
  });

  it("reclaims a strictly valid lock whose process owner is no longer live", async () => {
    const root = await temporaryRoot();
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    await mkdir(temporaryRootPath, { recursive: true });
    await writeFile(
      lockPath,
      `${JSON.stringify({
        schemaVersion: "1.0.0",
        token: "00000000-0000-4000-8000-000000000001",
        pid: 2_147_483_647,
        startedAt: "2026-01-01T00:00:00.000Z",
        root,
        buildId: "2147483647-00000000-0000-4000-8000-000000000001",
      })}\n`,
      "utf8",
    );

    await buildSnapshots({ rootDirectory: root, ...fixedOptions });

    await expect(access(lockPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readManifest(root)).resolves.toMatchObject({
      qualityStatus: "passed",
    });
  });

  it("fails closed on malformed lock metadata without marking data stale", async () => {
    const root = await temporaryRoot();
    await buildSnapshots({ rootDirectory: root, ...fixedOptions });
    const before = await readManifest(root);
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    await writeFile(
      lockPath,
      `${JSON.stringify({
        schemaVersion: "1.0.0",
        token: "00000000-0000-4000-8000-000000000001",
        pid: 2_147_483_647,
        startedAt: "2026-01-01T00:00:00.000Z",
        root,
        buildId: "crashed-build",
        unexpected: true,
      })}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({
        rootDirectory: root,
        ...fixedOptions,
        now: () => new Date("2027-01-02T10:00:00.000Z"),
      }),
    ).rejects.toThrow(/lock metadata/i);
    await expect(readManifest(root)).resolves.toEqual(before);
    await expect(access(lockPath)).resolves.toBeUndefined();
  });

  it("rejects lock metadata whose build identity does not match pid and token", async () => {
    const root = await temporaryRoot();
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    await mkdir(temporaryRootPath, { recursive: true });
    await writeFile(
      lockPath,
      `${JSON.stringify({
        schemaVersion: "1.0.0",
        token: "00000000-0000-4000-8000-000000000001",
        pid: 2_147_483_647,
        startedAt: "2026-01-01T00:00:00.000Z",
        root,
        buildId: "crashed-build",
      })}\n`,
      "utf8",
    );

    await expect(
      buildSnapshots({ rootDirectory: root, ...fixedOptions }),
    ).rejects.toThrow(/lock metadata/i);
    await expect(access(lockPath)).resolves.toBeUndefined();
  });

  it("cannot remove a replacement lock after a stale-reclaimer interleaving", async () => {
    const root = await temporaryRoot();
    const temporaryRootPath = join(root, ".codex-tmp");
    const lockPath = join(temporaryRootPath, "snapshot-build.lock");
    await mkdir(temporaryRootPath, { recursive: true });
    await writeFile(
      lockPath,
      `${JSON.stringify({
        schemaVersion: "1.0.0",
        token: "00000000-0000-4000-8000-000000000001",
        pid: 2_147_483_647,
        startedAt: "2026-01-01T00:00:00.000Z",
        root,
        buildId: "2147483647-00000000-0000-4000-8000-000000000001",
      })}\n`,
      "utf8",
    );
    let signalXInspected!: () => void;
    let resumeX!: () => void;
    const xInspected = new Promise<void>((resolveInspected) => {
      signalXInspected = resolveInspected;
    });
    const xResume = new Promise<void>((resolveResume) => {
      resumeX = resolveResume;
    });
    const buildXOutcome = buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2027-02-01T10:00:00.000Z"),
      failureInjection: lockFailureInjection({
        afterStaleLockInspection: async () => {
          signalXInspected();
          await xResume;
        },
      }),
    }).then(
      () => undefined,
      (error: unknown) => error,
    );
    await waitForSignal(xInspected);

    let signalYPaused!: () => void;
    let resumeY!: () => void;
    const yPaused = new Promise<void>((resolvePaused) => {
      signalYPaused = resolvePaused;
    });
    const yResume = new Promise<void>((resolveResume) => {
      resumeY = resolveResume;
    });
    const buildY = buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      now: () => new Date("2027-02-02T10:00:00.000Z"),
      failureInjection: {
        beforeManifestCommit: async () => {
          signalYPaused();
          await yResume;
        },
      },
    });
    await waitForSignal(yPaused);

    resumeX();
    const buildXError = await buildXOutcome;
    await expect(access(lockPath)).resolves.toBeUndefined();
    resumeY();
    await buildY;

    expect(buildXError).toBeInstanceOf(Error);
    expect((buildXError as Error).message).toMatch(/owner changed/i);
    await expect(readManifest(root)).resolves.toMatchObject({
      generatedAt: "2027-02-02T10:00:00.000Z",
      qualityStatus: "passed",
    });
    await expect(access(lockPath)).rejects.toMatchObject({ code: "ENOENT" });
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

  it("releases only its quarantined lock when a replacement appears", async () => {
    const root = await temporaryRoot();
    const lockPath = join(root, ".codex-tmp", "snapshot-build.lock");
    let signalReleaseInspected!: () => void;
    let resumeRelease!: () => void;
    const releaseInspected = new Promise<void>((resolveInspected) => {
      signalReleaseInspected = resolveInspected;
    });
    const releaseResume = new Promise<void>((resolveResume) => {
      resumeRelease = resolveResume;
    });
    const build = buildSnapshots({
      rootDirectory: root,
      ...fixedOptions,
      failureInjection: lockFailureInjection({
        afterLockReleaseQuarantineInspection: async () => {
          signalReleaseInspected();
          await releaseResume;
        },
      }),
    });
    await waitForSignal(releaseInspected);

    const replacement = {
      schemaVersion: "1.0.0",
      token: "00000000-0000-4000-8000-000000000002",
      pid: process.pid,
      startedAt: "2027-03-01T00:00:00.000Z",
      root,
      buildId: `${process.pid}-00000000-0000-4000-8000-000000000002`,
    };
    await writeFile(lockPath, `${JSON.stringify(replacement)}\n`, "utf8");
    resumeRelease();
    await build;

    await expect(
      readFile(lockPath, "utf8").then((value) => JSON.parse(value)),
    ).resolves.toEqual(replacement);
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

    for (const key of Object.keys(fileNames) as Array<keyof typeof fileNames>) {
      const bytes = await readFile(
        assetPath(root, manifest.resourceSnapshots[key].resourcePath),
      );
      before[key] = bytes;
      await writeFile(join(output, fileNames[key]), bytes);
    }
    const legacyManifest = {
      ...manifest,
      resourceSnapshots: Object.fromEntries(
        Object.entries(manifest.resourceSnapshots).map(
          ([key, snapshotValue]) => [
            key,
            Object.fromEntries(
              Object.entries(snapshotValue).filter(
                ([field]) => field !== "resourcePath",
              ),
            ),
          ],
        ),
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

  it.each(["public/data", ".codex-tmp"])(
    "rejects a physical junction escape through %s",
    async (linkedPath, context) => {
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
          context.skip();
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
