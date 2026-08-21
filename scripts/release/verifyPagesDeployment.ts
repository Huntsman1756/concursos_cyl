import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const COMMIT_PATTERN = /^[0-9a-f]{40}$/u;
const SNAPSHOT_RESOURCE_PATTERN =
  /^\/data\/v1\/snapshots\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*\.json)$/u;
const APPLICATION_TITLE_PATTERN = /<title[^>]*>\s*SALIDA CyL\s*<\/title>/iu;
const ROOT_MOUNT_PATTERN = /id=["']root["']/u;

export const MAX_VERIFICATION_ATTEMPTS = 6;
export const DEFAULT_RETRY_DELAY_MS = 10_000;

export type PagesFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;
export type PagesDelay = (milliseconds: number) => Promise<void>;

export interface VerifyPagesDeploymentOptions {
  baseUrl: string;
  expectedCommit: string;
  fetchImpl?: PagesFetch;
  attempts?: number;
  retryDelayMs?: number;
  delayImpl?: PagesDelay;
  delay?: PagesDelay;
}

interface ResourceSnapshot {
  resourcePath: string;
}

interface PagesManifest {
  schemaVersion: "1.0.0";
  resourceSnapshots: Record<string, ResourceSnapshot>;
}

function normalizeBaseUrl(value: string): URL {
  let base: URL;
  try {
    base = new URL(value);
  } catch (error) {
    throw new Error(`Invalid Pages base URL: ${value}`, { cause: error });
  }

  if (
    (base.protocol !== "https:" && base.protocol !== "http:") ||
    base.username !== "" ||
    base.password !== "" ||
    base.search !== "" ||
    base.hash !== ""
  ) {
    throw new Error(
      "Pages base URL must be an HTTP(S) URL without credentials, query, or fragment.",
    );
  }

  base.pathname = `${base.pathname.replace(/\/+$/u, "")}/`;
  return base;
}

function urlForBasePath(base: URL, path: string): URL {
  return new URL(path.replace(/^\/+/, ""), base);
}

async function requiredResponse(
  request: PagesFetch,
  url: URL,
  description: string,
): Promise<Response> {
  const response = await request(url);
  if (response.status !== 200) {
    throw new Error(
      `Pages ${description} at ${url.pathname} returned HTTP ${response.status}.`,
    );
  }
  return response;
}

function assertApplicationRoot(body: string, description: string): void {
  if (!APPLICATION_TITLE_PATTERN.test(body) || !ROOT_MOUNT_PATTERN.test(body)) {
    throw new Error(
      `Pages ${description} is missing the SALIDA CyL application root/title.`,
    );
  }
}

function parseManifest(value: unknown): PagesManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Pages manifest must be a JSON object.");
  }

  const candidate = value as {
    schemaVersion?: unknown;
    resourceSnapshots?: unknown;
  };
  if (candidate.schemaVersion !== "1.0.0") {
    throw new Error(
      `Pages manifest has an invalid schemaVersion: ${String(candidate.schemaVersion)}.`,
    );
  }
  if (
    candidate.resourceSnapshots === null ||
    typeof candidate.resourceSnapshots !== "object" ||
    Array.isArray(candidate.resourceSnapshots)
  ) {
    throw new Error("Pages manifest resourceSnapshots must be an object.");
  }

  const resourceSnapshots: Record<string, ResourceSnapshot> = {};
  const snapshotIds = new Set<string>();
  for (const [key, valueForKey] of Object.entries(
    candidate.resourceSnapshots,
  )) {
    if (
      valueForKey === null ||
      typeof valueForKey !== "object" ||
      Array.isArray(valueForKey)
    ) {
      throw new Error(`Pages manifest resourceSnapshots.${key} is invalid.`);
    }
    const resourcePath = (valueForKey as { resourcePath?: unknown })
      .resourcePath;
    if (typeof resourcePath !== "string") {
      throw new Error(
        `Pages manifest resourceSnapshots.${key}.resourcePath is invalid.`,
      );
    }
    const match = SNAPSHOT_RESOURCE_PATTERN.exec(resourcePath);
    if (!match) {
      throw new Error(
        `Pages manifest resourceSnapshots.${key}.resourcePath is invalid: ${resourcePath}.`,
      );
    }
    snapshotIds.add(match[1]!);
    resourceSnapshots[key] = { resourcePath };
  }

  if (Object.keys(resourceSnapshots).length === 0) {
    throw new Error("Pages manifest must address at least one resource.");
  }
  if (snapshotIds.size !== 1) {
    throw new Error("Pages manifest must address exactly one active snapshot.");
  }

  return { schemaVersion: "1.0.0", resourceSnapshots };
}

async function verifyOnce(
  base: URL,
  expectedCommit: string,
  request: PagesFetch,
): Promise<void> {
  const rootResponse = await requiredResponse(request, base, "root");
  assertApplicationRoot(await rootResponse.text(), "root response");

  const versionUrl = urlForBasePath(base, "version.json");
  const versionResponse = await requiredResponse(
    request,
    versionUrl,
    "version metadata",
  );
  let version: unknown;
  try {
    version = (await versionResponse.json()) as unknown;
  } catch (error) {
    throw new Error("Pages version.json is not valid JSON.", { cause: error });
  }
  if (
    version === null ||
    typeof version !== "object" ||
    Array.isArray(version)
  ) {
    throw new Error("Pages version.json must be a JSON object.");
  }
  const versionRecord = version as {
    schemaVersion?: unknown;
    commit?: unknown;
  };
  if (versionRecord.schemaVersion !== "1.0.0") {
    throw new Error("Pages version.json has an invalid schemaVersion.");
  }
  if (
    typeof versionRecord.commit !== "string" ||
    !COMMIT_PATTERN.test(versionRecord.commit)
  ) {
    throw new Error("Pages version.json commit is not a 40-hex SHA.");
  }
  if (versionRecord.commit !== expectedCommit) {
    throw new Error(
      `Version mismatch: version.json commit mismatch; expected ${expectedCommit}, found ${versionRecord.commit}.`,
    );
  }

  const manifestUrl = urlForBasePath(base, "data/v1/manifest.json");
  const manifestResponse = await requiredResponse(
    request,
    manifestUrl,
    "manifest",
  );
  let manifestValue: unknown;
  try {
    manifestValue = (await manifestResponse.json()) as unknown;
  } catch (error) {
    throw new Error("Pages manifest is not valid JSON.", { cause: error });
  }
  const manifest = parseManifest(manifestValue);

  for (const [key, snapshot] of Object.entries(manifest.resourceSnapshots)) {
    const resourceUrl = urlForBasePath(base, snapshot.resourcePath);
    if (resourceUrl.origin !== base.origin) {
      throw new Error(
        `Pages manifest resource ${key} must remain same-origin.`,
      );
    }
    await requiredResponse(request, resourceUrl, `resource ${key}`);
  }

  const deepLinkUrl = urlForBasePath(base, "comparar");
  const deepLinkResponse = await request(deepLinkUrl);
  if (deepLinkResponse.status !== 200 && deepLinkResponse.status !== 404) {
    throw new Error(
      `Pages /comparar returned HTTP ${deepLinkResponse.status} at ${deepLinkUrl.pathname}.`,
    );
  }
  assertApplicationRoot(await deepLinkResponse.text(), "/comparar fallback");
}

function defaultDelay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds);
  });
}

export async function verifyPagesDeployment({
  baseUrl,
  expectedCommit,
  fetchImpl = fetch,
  attempts = MAX_VERIFICATION_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  delayImpl,
  delay,
}: VerifyPagesDeploymentOptions): Promise<void> {
  if (!COMMIT_PATTERN.test(expectedCommit)) {
    throw new Error(`Invalid expected commit SHA: ${expectedCommit}`);
  }
  if (
    !Number.isInteger(attempts) ||
    attempts < 1 ||
    attempts > MAX_VERIFICATION_ATTEMPTS
  ) {
    throw new Error(
      `Verification attempts must be an integer between 1 and ${MAX_VERIFICATION_ATTEMPTS}.`,
    );
  }
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    throw new Error("Verification retry delay must be a non-negative number.");
  }

  const base = normalizeBaseUrl(baseUrl);
  const wait = delayImpl ?? delay ?? defaultDelay;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await verifyOnce(base, expectedCommit, fetchImpl);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await wait(retryDelayMs);
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Pages deployment verification failed after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${message}`,
    { cause: lastError },
  );
}

async function main(): Promise<void> {
  const [baseUrl, expectedCommit] = process.argv.slice(2);
  if (baseUrl === undefined || expectedCommit === undefined) {
    throw new Error("Usage: npm run release:pages:verify -- <base-url> <sha>");
  }

  await verifyPagesDeployment({ baseUrl, expectedCommit });
  console.log(`Verified GitHub Pages deployment at ${baseUrl}.`);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
