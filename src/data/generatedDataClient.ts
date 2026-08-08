import { z } from "zod";

import {
  EducationCenterSchema,
  JobOfferSchema,
  LegacyEducationCenterSchema,
  LegacyTrainingOfferingSchema,
  LoadableGeneratedManifestSchema,
  TrainingOfferingSchema,
  TrainingProgramSchema,
  type EducationCenter,
  type JobOffer,
  type LegacyEducationCenter,
  type LegacyTrainingOffering,
  type LoadableGeneratedManifest,
  type TrainingOffering,
  type TrainingProgram,
} from "../../data/schemas/generated";
import {
  GENERATED_FOUNDATION_RESOURCE_KEYS,
  isPermittedGeneratedAssetPath,
  legacyGeneratedResourcePath,
} from "../../data/schemas/generatedResourceCatalog";
import {
  PublishedRequirementsResourceSchema,
  type OfferPublishedRequirements,
} from "../domain/requirements";
import {
  OccupationAliasesSchema,
  MappingCoverageResourceSchema,
  OccupationsSchema,
  TrainingOccupationLinksSchema,
  type Occupation,
  type OccupationAlias,
  type MappingCoverage,
  type TrainingOccupationLink,
} from "../../data/schemas/curatedMappings";

export type GeneratedDataErrorCode = "network" | "schema" | "missing";

export class GeneratedDataError extends Error {
  readonly code: GeneratedDataErrorCode;

  constructor(code: GeneratedDataErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "GeneratedDataError";
    this.code = code;
  }
}

function validatedGeneratedAssetPath(path: string): string {
  if (
    path.trim().length === 0 ||
    path !== path.trim() ||
    !path.startsWith("/") ||
    /^[a-z][a-z\d+.-]*:/iu.test(path) ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#") ||
    /%[0-9a-f]{2}/iu.test(path) ||
    path.split("/").some((segment) => segment === "." || segment === "..") ||
    !isPermittedGeneratedAssetPath(path)
  ) {
    throw new GeneratedDataError(
      "missing",
      `Generated resource path must be same-origin and relative: ${path}.`,
    );
  }

  return path;
}

/** Fetches a generated static asset and enforces its runtime contract. */
export async function loadGeneratedResource<T>(
  path: string,
  schema: z.ZodType<T>,
  requestInit?: RequestInit,
): Promise<T> {
  const assetPath = validatedGeneratedAssetPath(path);
  let response: Response;

  try {
    response =
      requestInit === undefined
        ? await fetch(assetPath)
        : await fetch(assetPath, requestInit);
  } catch (error) {
    throw new GeneratedDataError(
      "network",
      `Could not fetch generated resource: ${assetPath}.`,
      error,
    );
  }

  if (!response.ok) {
    const code = response.status === 404 ? "missing" : "network";
    throw new GeneratedDataError(
      code,
      `Generated resource request failed with HTTP ${response.status}: ${assetPath}.`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource is not valid JSON: ${assetPath}.`,
      error,
    );
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new GeneratedDataError(
      "schema",
      `Generated resource failed schema validation: ${assetPath}.`,
      result.error,
    );
  }

  return result.data;
}

export function loadManifest(): Promise<LoadableGeneratedManifest> {
  return loadGeneratedResource(
    "/data/v1/manifest.json",
    LoadableGeneratedManifestSchema,
    { cache: "no-store" },
  );
}

/**
 * Loads quote-backed requirement evidence when the manifest advertises it.
 * Retained pre-sidecar manifests remain valid and intentionally resolve empty.
 */
export function loadPublishedRequirements(
  manifest: LoadableGeneratedManifest,
): Promise<OfferPublishedRequirements[]> {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, { resourcePath: string } | undefined>;
  const snapshot = resourceSnapshots.publishedRequirements;
  if (snapshot === undefined) return Promise.resolve([]);

  return loadGeneratedResource(
    snapshot.resourcePath,
    PublishedRequirementsResourceSchema,
  );
}

/** Loads the manifest-addressed public coverage rows used for coverage copy. */
export async function loadMappingCoverage(
  manifest: LoadableGeneratedManifest,
): Promise<MappingCoverage[]> {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, { resourcePath: string } | undefined>;
  const snapshot = resourceSnapshots.mappingCoverage;
  if (snapshot === undefined) {
    throw new GeneratedDataError(
      "missing",
      "Generated manifest does not advertise mapping coverage.",
    );
  }

  return loadGeneratedResource(
    snapshot.resourcePath,
    MappingCoverageResourceSchema,
  );
}

export interface LoadedAuditedRelationships {
  occupations: Occupation[];
  aliases: OccupationAlias[];
  links: TrainingOccupationLink[];
}

/** Loads only manifest-addressed, schema-validated relationship catalogs. */
export async function loadAuditedRelationships(
  manifest: LoadableGeneratedManifest,
): Promise<LoadedAuditedRelationships> {
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, { resourcePath: string } | undefined>;
  const occupations = snapshots.occupations;
  const aliases = snapshots.occupationAliases;
  const links = snapshots.trainingOccupationLinks;
  if (
    occupations === undefined ||
    aliases === undefined ||
    links === undefined
  ) {
    throw new GeneratedDataError(
      "missing",
      "Generated manifest does not advertise audited relationship resources.",
    );
  }
  const [loadedOccupations, loadedAliases, loadedLinks] = await Promise.all([
    loadGeneratedResource(occupations.resourcePath, OccupationsSchema),
    loadGeneratedResource(aliases.resourcePath, OccupationAliasesSchema),
    loadGeneratedResource(links.resourcePath, TrainingOccupationLinksSchema),
  ]);
  return {
    occupations: loadedOccupations,
    aliases: loadedAliases,
    links: loadedLinks,
  };
}

interface LoadedFoundationResourceBase {
  programs: TrainingProgram[];
  jobOffers: JobOffer[];
}

export interface LoadedLegacyFoundationResources extends LoadedFoundationResourceBase {
  contract: "legacy";
  centers: LegacyEducationCenter[];
  trainingOfferings: LegacyTrainingOffering[];
}

export interface LoadedCurrentFoundationResources extends LoadedFoundationResourceBase {
  contract: "current";
  centers: EducationCenter[];
  trainingOfferings: TrainingOffering[];
}

export type LoadedFoundationResources =
  LoadedLegacyFoundationResources | LoadedCurrentFoundationResources;

function manifestAddressedFoundationContract(
  manifest: LoadableGeneratedManifest,
): LoadedFoundationResources["contract"] {
  const legacyResourceCount = GENERATED_FOUNDATION_RESOURCE_KEYS.filter(
    (key) =>
      manifest.resourceSnapshots[key].resourcePath ===
      legacyGeneratedResourcePath(key),
  ).length;

  if (legacyResourceCount === 0) {
    return "current";
  }
  if (legacyResourceCount === GENERATED_FOUNDATION_RESOURCE_KEYS.length) {
    return "legacy";
  }

  throw new GeneratedDataError(
    "schema",
    "Generated manifest mixes current and legacy foundation resources.",
  );
}

const CurrentFoundationVariableResourcesSchema = z
  .object({
    centers: z.array(EducationCenterSchema),
    trainingOfferings: z.array(TrainingOfferingSchema),
  })
  .strict();

const LegacyFoundationVariableResourcesSchema = z
  .object({
    centers: z.array(LegacyEducationCenterSchema),
    trainingOfferings: z.array(LegacyTrainingOfferingSchema),
  })
  .strict();

async function loadFoundationResourceSet(
  resourceSnapshots: LoadableGeneratedManifest["resourceSnapshots"],
): Promise<
  LoadedFoundationResourceBase & {
    centers: unknown[];
    trainingOfferings: unknown[];
  }
> {
  const [programs, centers, trainingOfferings, jobOffers] = await Promise.all([
    loadGeneratedResource(
      resourceSnapshots.programs.resourcePath,
      z.array(TrainingProgramSchema),
    ),
    loadGeneratedResource(
      resourceSnapshots.centers.resourcePath,
      z.array(z.unknown()),
    ),
    loadGeneratedResource(
      resourceSnapshots.trainingOfferings.resourcePath,
      z.array(z.unknown()),
    ),
    loadGeneratedResource(
      resourceSnapshots.jobOffers.resourcePath,
      z.array(JobOfferSchema),
    ),
  ]);

  return { programs, centers, trainingOfferings, jobOffers };
}

function validatedFoundationResourceSet(
  manifest: LoadableGeneratedManifest,
  resources: Awaited<ReturnType<typeof loadFoundationResourceSet>>,
): LoadedFoundationResources {
  const variableResources = {
    centers: resources.centers,
    trainingOfferings: resources.trainingOfferings,
  };
  const current =
    CurrentFoundationVariableResourcesSchema.safeParse(variableResources);
  const legacy =
    LegacyFoundationVariableResourcesSchema.safeParse(variableResources);
  const sharedResources = {
    programs: resources.programs,
    jobOffers: resources.jobOffers,
  };

  if (current.success && legacy.success) {
    const contract = manifestAddressedFoundationContract(manifest);
    return contract === "current"
      ? { contract, ...sharedResources, ...current.data }
      : { contract, ...sharedResources, ...legacy.data };
  }
  if (current.success) {
    return { contract: "current", ...sharedResources, ...current.data };
  }
  if (legacy.success) {
    return { contract: "legacy", ...sharedResources, ...legacy.data };
  }

  throw new GeneratedDataError(
    "schema",
    "Generated foundation resources do not share one supported contract.",
    current.error,
  );
}

/** Loads all required v1 resources as one tagged current or legacy set. */
export async function loadFoundationResources(
  manifest: LoadableGeneratedManifest,
): Promise<LoadedFoundationResources> {
  const { resourceSnapshots } = manifest;
  const resources = await loadFoundationResourceSet(resourceSnapshots);
  return validatedFoundationResourceSet(manifest, resources);
}
