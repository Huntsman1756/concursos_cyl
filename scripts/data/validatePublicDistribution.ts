import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import {
  MappingCoverageResourceSchema,
  OccupationAliasesSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type OccupationAlias,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";
import {
  JobOfferSchema,
  TrainingProgramSchema,
  type JobOffer,
} from "../../data/schemas/generated";
import { PublishedRequirementsResourceSchema } from "../../src/domain/requirements";
import { z } from "zod";
import { extractPublishedRequirements } from "./extractRequirements";
import {
  buildMappingCoverage,
  type ValidatedCuratedMappings,
} from "./validateCuratedMappings";

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
  historicalSnapshotDirectories?: readonly string[];
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

const spanishOfferCollator = new Intl.Collator("es", {
  sensitivity: "base",
  usage: "sort",
});

function compareJobOffers(left: JobOffer, right: JobOffer): number {
  return (
    spanishOfferCollator.compare(left.title, right.title) ||
    left.id.localeCompare(right.id)
  );
}

function isOperationalPathError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

async function hasCurrentRequirementSemantics(
  directory: string,
  accessPath: AccessPath,
): Promise<boolean> {
  const requirementsPath = resolve(directory, "published-requirements.json");
  if (!(await pathExists(requirementsPath, accessPath))) return true;

  const offersPath = resolve(directory, "job-offers.json");
  if (!(await pathExists(offersPath, accessPath))) return false;

  try {
    const offers = z.array(JobOfferSchema).parse(await readJson(offersPath));
    if (
      canonicalPayload(offers) !==
      canonicalPayload([...offers].sort(compareJobOffers))
    ) {
      return false;
    }

    const published = PublishedRequirementsResourceSchema.parse(
      await readJson(requirementsPath),
    );
    const recomputed = PublishedRequirementsResourceSchema.parse(
      offers.flatMap((offer) => {
        const requirements = extractPublishedRequirements(offer.id, {
          sections: offer.descriptionSections,
        });
        return requirements.length === 0
          ? []
          : [{ offerId: offer.id, requirements }];
      }),
    );
    return canonicalPayload(published) === canonicalPayload(recomputed);
  } catch (error) {
    if (isOperationalPathError(error)) throw error;
    return false;
  }
}

/**
 * Finds deployable immutable snapshots that expose records whose current
 * curated review state is no longer approved or whose derived requirement
 * evidence differs from current deterministic recomputation. Foundation-only
 * history is intentionally accepted because it contains no derived sidecar.
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
  const canonicalApprovedOccupations = curatedMappings.occupations
    .filter((occupation) => occupation.reviewStatus === "approved")
    .toSorted((left, right) =>
      left.occupationId.localeCompare(right.occupationId),
    );
  const canonicalApprovedAliases = curatedMappings.aliases
    .filter((alias) => alias.reviewStatus === "approved")
    .toSorted((left, right) =>
      aliasIdentity(left).localeCompare(aliasIdentity(right)),
    );
  const canonicalApprovedLinks = curatedMappings.links
    .filter((link) => link.reviewStatus === "approved")
    .toSorted((left, right) =>
      linkIdentity(left).localeCompare(linkIdentity(right)),
    );
  const invalidDirectories: string[] = [];
  const ignoredDirectories = new Set(
    (options.ignoredDirectories ?? []).map((directory) => resolve(directory)),
  );
  const historicalSnapshotDirectories = new Set(
    (options.historicalSnapshotDirectories ?? []).map((directory) =>
      resolve(directory),
    ),
  );
  const entries = await readdir(snapshotsRoot, { withFileTypes: true });

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (!entry.isDirectory()) continue;
    const directory = resolve(snapshotsRoot, entry.name);
    if (ignoredDirectories.has(directory)) continue;
    const isHistoricalSubset = historicalSnapshotDirectories.has(directory);
    if (!(await hasCurrentRequirementSemantics(directory, accessPath))) {
      invalidDirectories.push(directory);
      continue;
    }
    const occupationsPath = resolve(directory, "occupations.json");
    const aliasesPath = resolve(directory, "occupation-aliases.json");
    const linksPath = resolve(directory, "training-occupation-links.json");
    const coveragePath = resolve(directory, "mapping-coverage.json");
    const programsPath = resolve(directory, "programs.json");
    const decisionPaths = [
      occupationsPath,
      aliasesPath,
      linksPath,
      coveragePath,
    ];
    const decisionPresence = await Promise.all(
      decisionPaths.map((path) => pathExists(path, accessPath)),
    );
    if (decisionPresence.every((present) => !present)) continue;
    if (
      decisionPresence.some((present) => !present) ||
      !(await pathExists(programsPath, accessPath))
    ) {
      invalidDirectories.push(directory);
      continue;
    }

    let invalid = false;
    try {
      const occupations = OccupationsSchema.parse(
        await readJson(occupationsPath),
      );
      invalid ||= occupations.some(
        (occupation) =>
          occupation.reviewStatus !== "approved" ||
          approvedOccupations.get(occupation.occupationId) !==
            canonicalPayload(occupation),
      );
      invalid ||=
        !isHistoricalSubset &&
        canonicalPayload(occupations) !==
          canonicalPayload(canonicalApprovedOccupations);
      const aliases = OccupationAliasesSchema.parse(
        await readJson(aliasesPath),
      );
      invalid ||= aliases.some(
        (alias) =>
          alias.reviewStatus !== "approved" ||
          approvedAliases.get(aliasIdentity(alias)) !== canonicalPayload(alias),
      );
      invalid ||=
        !isHistoricalSubset &&
        canonicalPayload(aliases) !==
          canonicalPayload(canonicalApprovedAliases);
      const links = TrainingOccupationLinksSchema.parse(
        await readJson(linksPath),
      );
      invalid ||= links.some(
        (link) =>
          link.reviewStatus !== "approved" ||
          approvedLinks.get(linkIdentity(link)) !== canonicalPayload(link),
      );
      invalid ||=
        !isHistoricalSubset &&
        canonicalPayload(links) !== canonicalPayload(canonicalApprovedLinks);
      const programs = z
        .array(TrainingProgramSchema)
        .parse(await readJson(programsPath));
      const programKeys = new Set(
        programs.map((program) => program.programKey),
      );
      invalid ||= programKeys.size !== programs.length;
      invalid ||=
        canonicalPayload(programs) !==
        canonicalPayload(
          programs.toSorted((left, right) =>
            left.programKey.localeCompare(right.programKey),
          ),
        );
      invalid ||= links.some(
        (link) => !programKeys.has(link.trainingProgramKey),
      );
      const coverage = MappingCoverageResourceSchema.parse(
        await readJson(coveragePath),
      );
      invalid ||=
        !isHistoricalSubset &&
        canonicalPayload(coverage) !==
          canonicalPayload(
            buildMappingCoverage(programs, curatedMappings.links),
          );
    } catch (error) {
      if (isOperationalPathError(error)) throw error;
      invalid = true;
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
      `Deployable snapshots expose revoked mappings or stale derived semantics: ${invalid.join(", ")}.`,
    );
  }
}
