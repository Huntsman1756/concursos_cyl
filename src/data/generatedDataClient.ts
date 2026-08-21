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
  OutcomeIndicatorsResourceSchema,
  type OutcomeIndicatorsResource,
} from "../../data/schemas/outcomes";
import {
  GENERATED_FOUNDATION_RESOURCE_KEYS,
  isPermittedGeneratedAssetPath,
  legacyGeneratedResourcePath,
  type GeneratedFoundationResourceKey,
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
import {
  ProfessionalProfilesResourceSchema,
  type ProfessionalProfile,
} from "../../data/schemas/professionalProfiles";
import {
  EcylCoursesResourceSchema,
  ProfessionalCertificatesResourceSchema,
  type EcylCourse,
  type ProfessionalCertificate,
} from "../../data/schemas/ecylResources";
import {
  MunicipalitiesResourceSchema,
  ProvincialContractsResourceSchema,
  type MunicipalityContext,
  type ProvincialContract,
} from "../../data/schemas/regionalContext";
import {
  PublicEmploymentCallsResourceSchema,
  type PublicEmploymentCall,
} from "../../data/schemas/publicEmployment";
import {
  DerivedFpOccupationGraphResourceSchema,
  OpenDataCatalogResourceSchema,
  type DerivedFpOccupationRow,
  type OpenDataCatalogRecord,
} from "../../data/schemas/openData";
import {
  EducationCenterDirectoryResourceSchema,
  type EducationCenterDirectoryRecord,
} from "../../data/schemas/educationCenterDirectory";

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

/** Resolves a logical generated path beneath Vite's same-origin public base. */
export function resolveGeneratedAssetPath(
  logicalPath: string,
  basePath = import.meta.env.BASE_URL,
): string {
  const assetPath = validatedGeneratedAssetPath(logicalPath);
  if (
    !basePath.startsWith("/") ||
    basePath.startsWith("//") ||
    basePath.includes("\\") ||
    basePath.includes("?") ||
    basePath.includes("#") ||
    basePath.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new GeneratedDataError(
      "missing",
      `Generated asset base must be a same-origin absolute path: ${basePath}.`,
    );
  }
  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/u, "");
  return `${normalizedBase}${assetPath}`;
}

/** Fetches a generated static asset and enforces its runtime contract. */
export async function loadGeneratedResource<T>(
  path: string,
  schema: z.ZodType<T>,
  requestInit?: RequestInit,
): Promise<T> {
  const assetPath = resolveGeneratedAssetPath(path);
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

export async function loadDerivedFpOccupationGraph(
  manifest: LoadableGeneratedManifest,
): Promise<DerivedFpOccupationRow[]> {
  const snapshot = (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"derivedFpOccupationGraph", { resourcePath: string }>>
  ).derivedFpOccupationGraph;
  return snapshot === undefined
    ? []
    : loadGeneratedResource(
        snapshot.resourcePath,
        DerivedFpOccupationGraphResourceSchema,
      );
}

export async function loadOpenDataCatalog(
  manifest: LoadableGeneratedManifest,
): Promise<OpenDataCatalogRecord[]> {
  const snapshot = (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"openDataCatalog", { resourcePath: string }>>
  ).openDataCatalog;
  return snapshot === undefined
    ? []
    : loadGeneratedResource(
        snapshot.resourcePath,
        OpenDataCatalogResourceSchema,
      );
}

export async function loadEcylCourses(
  manifest: LoadableGeneratedManifest,
): Promise<EcylCourse[]> {
  const snapshot = (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"ecylCourses", { resourcePath: string }>>
  ).ecylCourses;
  return snapshot === undefined
    ? []
    : loadGeneratedResource(snapshot.resourcePath, EcylCoursesResourceSchema);
}

export async function loadProfessionalCertificates(
  manifest: LoadableGeneratedManifest,
): Promise<ProfessionalCertificate[]> {
  const snapshot = (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"professionalCertificates", { resourcePath: string }>>
  ).professionalCertificates;
  return snapshot === undefined
    ? []
    : loadGeneratedResource(
        snapshot.resourcePath,
        ProfessionalCertificatesResourceSchema,
      );
}

export async function loadPublicEmploymentCalls(
  manifest: LoadableGeneratedManifest,
): Promise<PublicEmploymentCall[]> {
  const snapshot = (
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"publicEmploymentCalls", { resourcePath: string }>>
  ).publicEmploymentCalls;
  return snapshot === undefined
    ? []
    : loadGeneratedResource(
        snapshot.resourcePath,
        PublicEmploymentCallsResourceSchema,
      );
}

export interface LoadedRegionalContext {
  provincialContracts: ProvincialContract[];
  municipalities: MunicipalityContext[];
  educationCenterDirectory: EducationCenterDirectoryRecord[];
}

/** Loads optional JCyL territorial context; historical snapshots resolve empty. */
export async function loadRegionalContext(
  manifest: LoadableGeneratedManifest,
): Promise<LoadedRegionalContext> {
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<
        Record<
          "provincialContracts" | "municipalities" | "educationCenterDirectory",
          { resourcePath: string }
        >
      >;
  const [provincialContracts, municipalities, educationCenterDirectory] =
    await Promise.all([
      snapshots.provincialContracts === undefined
        ? Promise.resolve([])
        : loadGeneratedResource(
            snapshots.provincialContracts.resourcePath,
            ProvincialContractsResourceSchema,
          ),
      snapshots.municipalities === undefined
        ? Promise.resolve([])
        : loadGeneratedResource(
            snapshots.municipalities.resourcePath,
            MunicipalitiesResourceSchema,
          ),
      snapshots.educationCenterDirectory === undefined
        ? Promise.resolve([])
        : loadGeneratedResource(
            snapshots.educationCenterDirectory.resourcePath,
            EducationCenterDirectoryResourceSchema,
          ),
    ]);
  return { provincialContracts, municipalities, educationCenterDirectory };
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

/** Loads literal TodoFP professional outputs; retained historical snapshots resolve empty. */
export function loadProfessionalProfiles(
  manifest: LoadableGeneratedManifest,
): Promise<ProfessionalProfile[]> {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, { resourcePath: string } | undefined>;
  const snapshot = resourceSnapshots.professionalProfiles;
  if (snapshot === undefined) return Promise.resolve([]);

  return loadGeneratedResource(
    snapshot.resourcePath,
    ProfessionalProfilesResourceSchema,
  );
}

/** Loads optional verified income evidence; retained historical snapshots return null. */
export function loadOutcomeIndicators(
  manifest: LoadableGeneratedManifest,
): Promise<OutcomeIndicatorsResource | null> {
  const resourceSnapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<string, { resourcePath: string } | undefined>;
  const snapshot = resourceSnapshots.outcomeIndicators;
  if (snapshot === undefined) return Promise.resolve(null);
  return loadGeneratedResource(
    snapshot.resourcePath,
    OutcomeIndicatorsResourceSchema,
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

export async function loadOfficialOccupations(
  manifest: LoadableGeneratedManifest,
): Promise<Occupation[]> {
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Partial<Record<"officialOccupations", { resourcePath: string }>>;
  const official = snapshots.officialOccupations;
  if (official === undefined) {
    return (await loadAuditedRelationships(manifest)).occupations;
  }
  return loadGeneratedResource(official.resourcePath, OccupationsSchema);
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

export type FoundationResourceKey = GeneratedFoundationResourceKey;

export type LoadedFoundationResourceSubset<
  K extends FoundationResourceKey,
> =
  | Pick<LoadedCurrentFoundationResources, "contract" | K>
  | Pick<LoadedLegacyFoundationResources, "contract" | K>;

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

function foundationResourceSchema(
  contract: "current" | "legacy",
  key: FoundationResourceKey,
): z.ZodType {
  switch (key) {
    case "programs":
      return z.array(TrainingProgramSchema);
    case "centers":
      return z.array(
        contract === "current"
          ? EducationCenterSchema
          : LegacyEducationCenterSchema,
      );
    case "trainingOfferings":
      return z.array(
        contract === "current"
          ? TrainingOfferingSchema
          : LegacyTrainingOfferingSchema,
      );
    case "jobOffers":
      return z.array(JobOfferSchema);
  }
}

function parseFoundationResourceSubset(
  keys: readonly FoundationResourceKey[],
  resources: Record<FoundationResourceKey, unknown>,
  contract: "current" | "legacy",
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: z.ZodError } {
  const data: Record<string, unknown> = {};
  for (const key of keys) {
    const result = foundationResourceSchema(contract, key).safeParse(
      resources[key],
    );
    if (!result.success) {
      return result;
    }
    data[key] = result.data;
  }
  return { success: true, data };
}

/** Loads only the selected foundation resources as one tagged contract set. */
export async function loadFoundationResourceSubset<
  const K extends FoundationResourceKey,
>(
  manifest: LoadableGeneratedManifest,
  keys: readonly K[],
): Promise<LoadedFoundationResourceSubset<K>> {
  const requestedKeys = [...new Set(keys)] as FoundationResourceKey[];
  const loadedEntries = await Promise.all(
    requestedKeys.map(async (key) => [
      key,
      await loadGeneratedResource(
        manifest.resourceSnapshots[key].resourcePath,
        z.unknown(),
      ),
    ] as const),
  );
  const resources = Object.fromEntries(loadedEntries) as Record<
    FoundationResourceKey,
    unknown
  >;
  const current = parseFoundationResourceSubset(
    requestedKeys,
    resources,
    "current",
  );
  const legacy = parseFoundationResourceSubset(
    requestedKeys,
    resources,
    "legacy",
  );

  let contract: "current" | "legacy";
  let data: Record<string, unknown>;
  if (current.success && legacy.success) {
    contract = manifestAddressedFoundationContract(manifest);
    data = contract === "current" ? current.data : legacy.data;
  } else if (current.success) {
    contract = "current";
    data = current.data;
  } else if (legacy.success) {
    contract = "legacy";
    data = legacy.data;
  } else {
    throw new GeneratedDataError(
      "schema",
      "Generated foundation resources do not share one supported contract.",
      current.error,
    );
  }

  return { contract, ...data } as LoadedFoundationResourceSubset<K>;
}

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
