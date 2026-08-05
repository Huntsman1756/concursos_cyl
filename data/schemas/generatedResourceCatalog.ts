export const GENERATED_DATA_VERSION_PATH = "/data/v1";
export const GENERATED_MANIFEST_PATH = `${GENERATED_DATA_VERSION_PATH}/manifest.json`;

export const GENERATED_FOUNDATION_RESOURCE_CATALOG = {
  programs: { fileName: "programs.json", sourceKind: "training" },
  centers: { fileName: "centers.json", sourceKind: "training" },
  trainingOfferings: {
    fileName: "training-offerings.json",
    sourceKind: "training",
  },
  jobOffers: { fileName: "job-offers.json", sourceKind: "offers" },
} as const;

export const GENERATED_RESOURCE_CATALOG = {
  ...GENERATED_FOUNDATION_RESOURCE_CATALOG,
  occupations: {
    fileName: "occupations.json",
    sourceKind: "curatedOccupations",
  },
  occupationAliases: {
    fileName: "occupation-aliases.json",
    sourceKind: "curatedOccupations",
  },
  trainingOccupationLinks: {
    fileName: "training-occupation-links.json",
    sourceKind: "curatedRelationships",
  },
  mappingCoverage: {
    fileName: "mapping-coverage.json",
    sourceKind: "curatedRelationships",
  },
  publishedRequirements: {
    fileName: "published-requirements.json",
    sourceKind: "offers",
  },
} as const;

export type GeneratedResourceKey = keyof typeof GENERATED_RESOURCE_CATALOG;
export type GeneratedFoundationResourceKey =
  keyof typeof GENERATED_FOUNDATION_RESOURCE_CATALOG;

export const GENERATED_FOUNDATION_RESOURCE_KEYS = Object.keys(
  GENERATED_FOUNDATION_RESOURCE_CATALOG,
) as GeneratedFoundationResourceKey[];

export const GENERATED_RESOURCE_KEYS = Object.keys(
  GENERATED_RESOURCE_CATALOG,
) as GeneratedResourceKey[];

export const GENERATED_RESOURCE_KEY_PATTERN = /^[a-z][a-zA-Z\d]*$/u;
export const GENERATED_RESOURCE_FILE_NAME_PATTERN =
  /^[a-z\d]+(?:-[a-z\d]+)*\.json$/u;
export const GENERATED_SNAPSHOT_ID_PATTERN = /^[a-z\d]+(?:-[a-z\d]+)*$/u;
const GENERATED_SNAPSHOT_RESOURCE_PREFIX = `${GENERATED_DATA_VERSION_PATH}/snapshots/`;

interface ImmutableGeneratedResourcePathParts {
  snapshotId: string;
  fileName: string;
}

function parseImmutableGeneratedResourcePath(
  path: string,
): ImmutableGeneratedResourcePathParts | null {
  if (!path.startsWith(GENERATED_SNAPSHOT_RESOURCE_PREFIX)) {
    return null;
  }

  const parts = path
    .slice(GENERATED_SNAPSHOT_RESOURCE_PREFIX.length)
    .split("/");
  if (parts.length !== 2) {
    return null;
  }

  const [snapshotId, fileName] = parts;
  if (
    !GENERATED_SNAPSHOT_ID_PATTERN.test(snapshotId) ||
    !GENERATED_RESOURCE_FILE_NAME_PATTERN.test(fileName) ||
    fileName === "manifest.json"
  ) {
    return null;
  }

  return { snapshotId, fileName };
}

export function generatedResourceFileNameForKey(key: string): string | null {
  if (!GENERATED_RESOURCE_KEY_PATTERN.test(key)) {
    return null;
  }

  return `${key.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}.json`;
}

export function legacyGeneratedResourcePath(
  key: GeneratedFoundationResourceKey,
): string {
  return `${GENERATED_DATA_VERSION_PATH}/${GENERATED_FOUNDATION_RESOURCE_CATALOG[key].fileName}`;
}

export function immutableGeneratedResourcePath(
  key: GeneratedResourceKey,
  snapshotId: string,
): string {
  return immutableGeneratedResourceFilePath(
    GENERATED_RESOURCE_CATALOG[key].fileName,
    snapshotId,
  );
}

export function immutableGeneratedResourceFilePath(
  fileName: string,
  snapshotId: string,
): string {
  if (
    !GENERATED_RESOURCE_FILE_NAME_PATTERN.test(fileName) ||
    !GENERATED_SNAPSHOT_ID_PATTERN.test(snapshotId) ||
    fileName === "manifest.json"
  ) {
    throw new Error("Invalid generated resource descriptor.");
  }

  return `${GENERATED_SNAPSHOT_RESOURCE_PREFIX}${snapshotId}/${fileName}`;
}

export function isImmutableGeneratedResourceFilePath(
  fileName: string,
  path: string,
): boolean {
  if (
    !GENERATED_RESOURCE_FILE_NAME_PATTERN.test(fileName) ||
    fileName === "manifest.json"
  ) {
    return false;
  }

  return parseImmutableGeneratedResourcePath(path)?.fileName === fileName;
}

export function isImmutableGeneratedResourcePath(
  key: GeneratedResourceKey,
  path: string,
): boolean {
  return isImmutableGeneratedResourceFilePath(
    GENERATED_RESOURCE_CATALOG[key].fileName,
    path,
  );
}

export function isGenericImmutableGeneratedResourcePath(path: string): boolean {
  return parseImmutableGeneratedResourcePath(path) !== null;
}

export function isPermittedGeneratedAssetPath(path: string): boolean {
  return (
    path === GENERATED_MANIFEST_PATH ||
    GENERATED_FOUNDATION_RESOURCE_KEYS.some(
      (key) => path === legacyGeneratedResourcePath(key),
    ) ||
    isGenericImmutableGeneratedResourcePath(path)
  );
}
