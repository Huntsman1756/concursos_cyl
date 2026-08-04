export const GENERATED_DATA_VERSION_PATH = "/data/v1";
export const GENERATED_MANIFEST_PATH = `${GENERATED_DATA_VERSION_PATH}/manifest.json`;

export const GENERATED_RESOURCE_CATALOG = {
  programs: { fileName: "programs.json" },
  centers: { fileName: "centers.json" },
  trainingOfferings: { fileName: "training-offerings.json" },
  jobOffers: { fileName: "job-offers.json" },
} as const;

export type GeneratedResourceKey = keyof typeof GENERATED_RESOURCE_CATALOG;

export const GENERATED_RESOURCE_KEYS = Object.keys(
  GENERATED_RESOURCE_CATALOG,
) as GeneratedResourceKey[];

export const GENERATED_RESOURCE_KEY_PATTERN = /^[a-z][a-zA-Z\d]*$/u;
export const GENERATED_RESOURCE_FILE_NAME_PATTERN =
  /^[a-z\d]+(?:-[a-z\d]+)*\.json$/u;
export const GENERATED_SNAPSHOT_ID_PATTERN = /^[a-z\d]+(?:-[a-z\d]+)*$/u;

export function generatedResourceFileNameForKey(key: string): string | null {
  if (!GENERATED_RESOURCE_KEY_PATTERN.test(key)) {
    return null;
  }

  return `${key.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`)}.json`;
}

export function legacyGeneratedResourcePath(key: GeneratedResourceKey): string {
  return `${GENERATED_DATA_VERSION_PATH}/${GENERATED_RESOURCE_CATALOG[key].fileName}`;
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

  return `${GENERATED_DATA_VERSION_PATH}/snapshots/${snapshotId}/${fileName}`;
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

  const prefix = `${GENERATED_DATA_VERSION_PATH}/snapshots/`;
  const suffix = `/${fileName}`;
  if (!path.startsWith(prefix) || !path.endsWith(suffix)) {
    return false;
  }

  const snapshotId = path.slice(prefix.length, -suffix.length);
  return GENERATED_SNAPSHOT_ID_PATTERN.test(snapshotId);
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
  const match =
    /^\/data\/v1\/snapshots\/([a-z\d]+(?:-[a-z\d]+)*)\/([a-z\d]+(?:-[a-z\d]+)*\.json)$/u.exec(
      path,
    );
  return (
    match !== null &&
    match[2] !== "manifest.json" &&
    GENERATED_SNAPSHOT_ID_PATTERN.test(match[1]) &&
    GENERATED_RESOURCE_FILE_NAME_PATTERN.test(match[2])
  );
}

export function isPermittedGeneratedAssetPath(path: string): boolean {
  return (
    path === GENERATED_MANIFEST_PATH ||
    GENERATED_RESOURCE_KEYS.some(
      (key) => path === legacyGeneratedResourcePath(key),
    ) ||
    isGenericImmutableGeneratedResourcePath(path)
  );
}
