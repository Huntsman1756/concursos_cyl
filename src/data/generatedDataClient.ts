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
  GENERATED_RESOURCE_KEYS,
  isPermittedGeneratedAssetPath,
  legacyGeneratedResourcePath,
} from "../../data/schemas/generatedResourceCatalog";

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

function foundationResourceContract(
  manifest: LoadableGeneratedManifest,
): LoadedFoundationResources["contract"] {
  const legacyResourceCount = GENERATED_RESOURCE_KEYS.filter(
    (key) =>
      manifest.resourceSnapshots[key].resourcePath ===
      legacyGeneratedResourcePath(key),
  ).length;

  if (legacyResourceCount === 0) {
    return "current";
  }
  if (legacyResourceCount === GENERATED_RESOURCE_KEYS.length) {
    return "legacy";
  }

  throw new GeneratedDataError(
    "schema",
    "Generated manifest mixes current and legacy foundation resources.",
  );
}

interface FoundationResourceSchemas<TCenter, TTrainingOffering> {
  center: z.ZodType<TCenter>;
  trainingOffering: z.ZodType<TTrainingOffering>;
}

async function loadFoundationResourceSet<TCenter, TTrainingOffering>(
  resourceSnapshots: LoadableGeneratedManifest["resourceSnapshots"],
  schemas: FoundationResourceSchemas<TCenter, TTrainingOffering>,
): Promise<
  LoadedFoundationResourceBase & {
    centers: TCenter[];
    trainingOfferings: TTrainingOffering[];
  }
> {
  const [programs, centers, trainingOfferings, jobOffers] = await Promise.all([
    loadGeneratedResource(
      resourceSnapshots.programs.resourcePath,
      z.array(TrainingProgramSchema),
    ),
    loadGeneratedResource(
      resourceSnapshots.centers.resourcePath,
      z.array(schemas.center),
    ),
    loadGeneratedResource(
      resourceSnapshots.trainingOfferings.resourcePath,
      z.array(schemas.trainingOffering),
    ),
    loadGeneratedResource(
      resourceSnapshots.jobOffers.resourcePath,
      z.array(JobOfferSchema),
    ),
  ]);

  return { programs, centers, trainingOfferings, jobOffers };
}

/** Loads all required v1 resources as one tagged current or legacy set. */
export async function loadFoundationResources(
  manifest: LoadableGeneratedManifest,
): Promise<LoadedFoundationResources> {
  const { resourceSnapshots } = manifest;
  const contract = foundationResourceContract(manifest);

  if (contract === "legacy") {
    const resources = await loadFoundationResourceSet(resourceSnapshots, {
      center: LegacyEducationCenterSchema,
      trainingOffering: LegacyTrainingOfferingSchema,
    });
    return { contract, ...resources };
  }

  const resources = await loadFoundationResourceSet(resourceSnapshots, {
    center: EducationCenterSchema,
    trainingOffering: TrainingOfferingSchema,
  });
  return { contract, ...resources };
}
