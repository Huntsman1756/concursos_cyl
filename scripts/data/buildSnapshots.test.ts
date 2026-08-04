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
import { join, resolve, sep } from "node:path";

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
