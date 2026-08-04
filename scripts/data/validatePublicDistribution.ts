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

function canonicalPayload(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalPayload).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([key, entry]) => `${JSON.stringify(key)}:${canonicalPayload(entry)}`,
      )
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

type AccessPath = (path: string) => Promise<void>;

interface DistributionValidationOptions {
  ignoredDirectories?: readonly string[];
  accessPath?: AccessPath;
}

function isMissingPathError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function pathExists(
  path: string,
  accessPath: AccessPath = access,
): Promise<boolean> {
  try {
    await accessPath(path);
    return true;
  } catch (error) {
    if (isMissingPathError(error)) return false;
    throw error;
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
  options: DistributionValidationOptions = {},
): Promise<string[]> {
  const snapshotsRoot = resolve(
    rootDirectory,
    "public",
    "data",
    "v1",
    "snapshots",
  );
  const accessPath = options.accessPath ?? access;
  if (!(await pathExists(snapshotsRoot, accessPath))) return [];

  const approvedOccupations = new Map(
    curatedMappings.occupations
      .filter((occupation) => occupation.reviewStatus === "approved")
      .map((occupation) => [
        occupation.occupationId,
        canonicalPayload(occupation),
      ]),
  );
  const approvedAliases = new Map(
    curatedMappings.aliases
      .filter((alias) => alias.reviewStatus === "approved")
      .map((alias) => [aliasIdentity(alias), canonicalPayload(alias)]),
  );
  const approvedLinks = new Map(
    curatedMappings.links
      .filter((link) => link.reviewStatus === "approved")
      .map((link) => [linkIdentity(link), canonicalPayload(link)]),
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

    if (await pathExists(occupationsPath, accessPath)) {
      const occupations = OccupationsSchema.parse(
        await readJson(occupationsPath),
      );
      invalid ||= occupations.some(
        (occupation) =>
          occupation.reviewStatus !== "approved" ||
          approvedOccupations.get(occupation.occupationId) !==
            canonicalPayload(occupation),
      );
    }
    if (await pathExists(aliasesPath, accessPath)) {
      const aliases = OccupationAliasesSchema.parse(
        await readJson(aliasesPath),
      );
      invalid ||= aliases.some(
        (alias) =>
          alias.reviewStatus !== "approved" ||
          approvedAliases.get(aliasIdentity(alias)) !== canonicalPayload(alias),
      );
    }
    if (await pathExists(linksPath, accessPath)) {
      const links = TrainingOccupationLinksSchema.parse(
        await readJson(linksPath),
      );
      invalid ||= links.some(
        (link) =>
          link.reviewStatus !== "approved" ||
          approvedLinks.get(linkIdentity(link)) !== canonicalPayload(link),
      );
    }

    if (invalid) invalidDirectories.push(directory);
  }

  return invalidDirectories;
}

export async function assertPublicSnapshotDistribution(
  rootDirectory: string,
  curatedMappings: ValidatedCuratedMappings,
  options: DistributionValidationOptions = {},
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
