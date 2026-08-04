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
  isPermittedGeneratedAssetPath,
  legacyGeneratedResourcePath,
  type GeneratedResourceKey,
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

export interface LoadedFoundationResources {
  programs: TrainingProgram[];
  centers: (EducationCenter | LegacyEducationCenter)[];
  trainingOfferings: (TrainingOffering | LegacyTrainingOffering)[];
  jobOffers: JobOffer[];
}

function usesLegacyResourceContract(
  key: GeneratedResourceKey,
  path: string,
): boolean {
  return path === legacyGeneratedResourcePath(key);
}

/** Loads all required v1 resources with path-sensitive current/legacy contracts. */
export async function loadFoundationResources(
  manifest: LoadableGeneratedManifest,
): Promise<LoadedFoundationResources> {
  const { resourceSnapshots } = manifest;
  const [programs, centers, trainingOfferings, jobOffers] = await Promise.all([
    loadGeneratedResource(
      resourceSnapshots.programs.resourcePath,
      z.array(TrainingProgramSchema),
    ),
    loadGeneratedResource(
      resourceSnapshots.centers.resourcePath,
      z.array(
        usesLegacyResourceContract(
          "centers",
          resourceSnapshots.centers.resourcePath,
        )
          ? LegacyEducationCenterSchema
          : EducationCenterSchema,
      ),
    ),
    loadGeneratedResource(
      resourceSnapshots.trainingOfferings.resourcePath,
      z.array(
        usesLegacyResourceContract(
          "trainingOfferings",
          resourceSnapshots.trainingOfferings.resourcePath,
        )
          ? LegacyTrainingOfferingSchema
          : TrainingOfferingSchema,
      ),
    ),
    loadGeneratedResource(
      resourceSnapshots.jobOffers.resourcePath,
      z.array(JobOfferSchema),
    ),
  ]);

  return { programs, centers, trainingOfferings, jobOffers };
}
