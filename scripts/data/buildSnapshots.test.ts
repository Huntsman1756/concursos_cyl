import { createHash } from "node:crypto";
import {
  access,
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

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import {
  liveOfferSourceRecord,
  liveTrainingSourceRecord,
} from "../../tests/fixtures/sourceRecords";
import { buildSnapshots } from "./buildSnapshots";
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
