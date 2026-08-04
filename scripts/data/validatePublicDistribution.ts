import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import type { ValidatedCuratedMappings } from "./validateCuratedMappings";

function normalizeAlias(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function aliasIdentity(
  alias: Pick<OccupationAlias, "alias" | "occupationId">,
): string {
  return `${normalizeAlias(alias.alias)}:${alias.occupationId}`;
}

function linkIdentity(
  link: Pick<
    TrainingOccupationLink,
    "trainingProgramKey" | "occupationId" | "relationshipType"
  >,
): string {
  return `${link.trainingProgramKey}:${link.occupationId}:${link.relationshipType}`;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Finds deployable immutable snapshots that expose records whose current
 * curated review state is no longer approved. Foundation-only history is
 * intentionally accepted because it contains no curated decision records.
 */
export async function findRevokedPublicSnapshotDirectories(
  rootDirectory: string,
  curatedMappings: ValidatedCuratedMappings,
  options: { ignoredDirectories?: readonly string[] } = {},
): Promise<string[]> {
  const snapshotsRoot = resolve(
    rootDirectory,
    "public",
    "data",
    "v1",
    "snapshots",
  );
  if (!(await pathExists(snapshotsRoot))) return [];

  const revokedOccupationIds = new Set(
    curatedMappings.occupations
      .filter((occupation) => occupation.reviewStatus !== "approved")
      .map((occupation) => occupation.occupationId),
  );
  const revokedAliases = new Set(
    curatedMappings.aliases
      .filter((alias) => alias.reviewStatus !== "approved")
      .map(aliasIdentity),
  );
  const revokedLinks = new Set(
    curatedMappings.links
      .filter((link) => link.reviewStatus !== "approved")
      .map(linkIdentity),
  );
  const invalidDirectories: string[] = [];
  const ignoredDirectories = new Set(
    (options.ignoredDirectories ?? []).map((directory) => resolve(directory)),
  );
  const entries = await readdir(snapshotsRoot, { withFileTypes: true });

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!entry.isDirectory()) continue;
    const directory = resolve(snapshotsRoot, entry.name);
    if (ignoredDirectories.has(directory)) continue;
    const occupationsPath = resolve(directory, "occupations.json");
    const aliasesPath = resolve(directory, "occupation-aliases.json");
    const linksPath = resolve(directory, "training-occupation-links.json");
    let invalid = false;

    if (await pathExists(occupationsPath)) {
      const occupations = OccupationsSchema.parse(
        await readJson(occupationsPath),
      );
      invalid ||= occupations.some(
        (occupation) =>
          occupation.reviewStatus !== "approved" ||
          revokedOccupationIds.has(occupation.occupationId),
      );
    }
    if (await pathExists(aliasesPath)) {
      const aliases = OccupationAliasesSchema.parse(
        await readJson(aliasesPath),
      );
      invalid ||= aliases.some(
        (alias) =>
          alias.reviewStatus !== "approved" ||
          revokedOccupationIds.has(alias.occupationId) ||
          revokedAliases.has(aliasIdentity(alias)),
      );
    }
    if (await pathExists(linksPath)) {
      const links = TrainingOccupationLinksSchema.parse(
        await readJson(linksPath),
      );
      invalid ||= links.some(
        (link) =>
          link.reviewStatus !== "approved" ||
          revokedOccupationIds.has(link.occupationId) ||
          revokedLinks.has(linkIdentity(link)),
      );
    }

    if (invalid) invalidDirectories.push(directory);
  }

  return invalidDirectories;
}

export async function assertPublicSnapshotDistribution(
  rootDirectory: string,
  curatedMappings: ValidatedCuratedMappings,
  options: { ignoredDirectories?: readonly string[] } = {},
): Promise<void> {
  const invalid = await findRevokedPublicSnapshotDirectories(
    rootDirectory,
    curatedMappings,
    options,
  );
  if (invalid.length > 0) {
    throw new Error(
      `Deployable snapshots expose revoked curated mappings: ${invalid.join(", ")}.`,
    );
  }
}
