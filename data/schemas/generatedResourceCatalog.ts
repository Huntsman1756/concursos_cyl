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

export function legacyGeneratedResourcePath(key: GeneratedResourceKey): string {
  return `/data/v1/${GENERATED_RESOURCE_CATALOG[key].fileName}`;
}

export function immutableGeneratedResourcePath(
  key: GeneratedResourceKey,
  snapshotId: string,
): string {
  return `/data/v1/snapshots/${snapshotId}/${GENERATED_RESOURCE_CATALOG[key].fileName}`;
}

export function isImmutableGeneratedResourcePath(
  key: GeneratedResourceKey,
  path: string,
): boolean {
  const prefix = "/data/v1/snapshots/";
  const suffix = `/${GENERATED_RESOURCE_CATALOG[key].fileName}`;
  if (!path.startsWith(prefix) || !path.endsWith(suffix)) {
    return false;
  }
  const snapshotId = path.slice(prefix.length, -suffix.length);
  return /^[a-z0-9-]+$/u.test(snapshotId);
}

export function isPermittedGeneratedAssetPath(path: string): boolean {
  return (
    path === "/data/v1/manifest.json" ||
    GENERATED_RESOURCE_KEYS.some(
      (key) =>
        path === legacyGeneratedResourcePath(key) ||
        isImmutableGeneratedResourcePath(key, path),
    )
  );
}
