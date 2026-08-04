import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { TrainingProgramSchema } from "../../data/schemas/generated";
import {
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

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function snapshot(root: string, name: string): Promise<string> {
  const directory = join(root, "public", "data", "v1", "snapshots", name);
  await mkdir(directory, { recursive: true });
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("public snapshot distribution", () => {
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

    await expect(
      findRevokedPublicSnapshotDirectories(root, curatedMappings),
    ).resolves.toEqual([
      resolve(revokedOccupation),
      resolve(revokedAlias),
      resolve(revokedLink),
    ]);
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

    await expect(
      assertPublicSnapshotDistribution(root, mappings),
    ).resolves.toBeUndefined();
  });
});
