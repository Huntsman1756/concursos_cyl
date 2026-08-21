import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  GeneratedManifestSchema,
  type GeneratedManifest,
} from "../../data/schemas/generated";
import { GENERATED_RESOURCE_KEYS } from "../../data/schemas/generatedResourceCatalog";

const COMMIT_PATTERN = /^[0-9a-f]{40}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const MANIFEST_PATH = "/data/v1/manifest.json";
const SNAPSHOT_RESOURCE_PATTERN =
  /^\/data\/v1\/snapshots\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*\.json)$/u;
const APPLICATION_TITLE_PATTERN = /<title[^>]*>\s*SALIDA CyL\s*<\/title>/iu;
const ROOT_MOUNT_PATTERN = /id=["']root["']/u;

export const MAX_VERIFICATION_ATTEMPTS = 6;
export const DEFAULT_RETRY_DELAY_MS = 10_000;
export const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

export type PagesFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;
export type PagesDelay = (milliseconds: number) => Promise<void>;
export type PagesDigestMap = Readonly<Record<string, string>>;

export interface VerifyPagesDeploymentOptions {
  baseUrl: string;
  expectedCommit: string;
  expectedDigests?: PagesDigestMap;
  fetchImpl?: PagesFetch;
  attempts?: number;
  retryDelayMs?: number;
  requestTimeoutMs?: number;
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

interface ResponseContext {
  response: Response;
  controller: AbortController;
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

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function expectedDigestForPath(
  expectedDigests: PagesDigestMap | undefined,
  base: URL,
  assetPath: string,
): string | undefined {
  if (expectedDigests === undefined) return undefined;
  const normalizedPath = `/${assetPath.replace(/^\/+/, "")}`;
  return (
    expectedDigests[normalizedPath] ??
    expectedDigests[urlForBasePath(base, normalizedPath).pathname]
  );
}

function assertExpectedDigestConfigured(
  expectedDigests: PagesDigestMap | undefined,
  expectedDigest: string | undefined,
  assetPath: string,
): void {
  if (expectedDigests === undefined) return;
  if (expectedDigest === undefined) {
    throw new Error(
      `Pages checked-out digest is missing for ${assetPath}; refusing to verify an unpinned asset.`,
    );
  }
  if (!SHA256_PATTERN.test(expectedDigest)) {
    throw new Error(
      `Pages checked-out digest for ${assetPath} is not a SHA-256 digest.`,
    );
  }
}

function assertExpectedDigest(
  bytes: Uint8Array,
  expectedDigest: string | undefined,
  description: string,
): void {
  if (expectedDigest === undefined) return;
  const actualDigest = sha256(bytes);
  if (actualDigest !== expectedDigest) {
    throw new Error(
      `Pages ${description} digest mismatch; expected ${expectedDigest}, found ${actualDigest}.`,
    );
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  controller: AbortController,
  description: string,
  onLateValue?: (value: T) => void,
): Promise<T> {
  void operation.then(
    (value) => {
      if (controller.signal.aborted) onLateValue?.(value);
    },
    () => undefined,
  );
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(
        new Error(
          `Pages ${description} timed out after ${timeoutMs} milliseconds.`,
        ),
      );
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation, deadline]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

function assertResponseUrl(
  response: Response,
  expectedUrl: URL,
  description: string,
): void {
  if (response.url === "") return;
  let finalUrl: URL;
  try {
    finalUrl = new URL(response.url);
  } catch (error) {
    throw new Error(`Pages ${description} returned an invalid response URL.`, {
      cause: error,
    });
  }
  if (
    finalUrl.origin !== expectedUrl.origin ||
    finalUrl.pathname !== expectedUrl.pathname ||
    finalUrl.search !== expectedUrl.search ||
    finalUrl.hash !== expectedUrl.hash
  ) {
    throw new Error(
      `Pages ${description} followed an escaped or cross-origin redirect to ${response.url}.`,
    );
  }
}

async function fetchResponse(
  request: PagesFetch,
  url: URL,
  description: string,
  requestTimeoutMs: number,
): Promise<ResponseContext> {
  const controller = new AbortController();
  let fetchPromise: Promise<Response>;
  try {
    fetchPromise = request(url, {
      redirect: "error",
      signal: controller.signal,
    });
  } catch (error) {
    controller.abort();
    throw error;
  }
  const response = await withTimeout(
    fetchPromise,
    requestTimeoutMs,
    controller,
    description,
    cancelResponseBody,
  );
  try {
    assertResponseUrl(response, url, description);
  } catch (error) {
    controller.abort();
    cancelResponseBody(response);
    throw error;
  }
  return { response, controller };
}

async function requiredResponse(
  request: PagesFetch,
  url: URL,
  description: string,
  requestTimeoutMs: number,
): Promise<ResponseContext> {
  const context = await fetchResponse(
    request,
    url,
    description,
    requestTimeoutMs,
  );
  if (context.response.status !== 200) {
    context.controller.abort();
    cancelResponseBody(context.response);
    throw new Error(
      `Pages ${description} at ${url.pathname} returned HTTP ${context.response.status}.`,
    );
  }
  return context;
}

function cancelResponseBody(response: Response): void {
  let cancellation: Promise<unknown> | undefined;
  try {
    cancellation = response.body?.cancel();
  } catch {
    // The body can already be locked or consumed; the controller still aborts it.
  }
  if (cancellation !== undefined) {
    void cancellation.catch(() => undefined);
  }
}

async function readResponseBytes(
  context: ResponseContext,
  description: string,
  requestTimeoutMs: number,
): Promise<Uint8Array> {
  try {
    const body = await withTimeout(
      context.response.arrayBuffer(),
      requestTimeoutMs,
      context.controller,
      `${description} body`,
    );
    return new Uint8Array(body);
  } catch (error) {
    context.controller.abort();
    cancelResponseBody(context.response);
    throw error;
  } finally {
    context.controller.abort();
  }
}

async function readResponseText(
  context: ResponseContext,
  description: string,
  requestTimeoutMs: number,
): Promise<string> {
  try {
    return await withTimeout(
      context.response.text(),
      requestTimeoutMs,
      context.controller,
      `${description} body`,
    );
  } catch (error) {
    context.controller.abort();
    cancelResponseBody(context.response);
    throw error;
  } finally {
    context.controller.abort();
  }
}

async function readJsonResponse(
  context: ResponseContext,
  description: string,
  requestTimeoutMs: number,
  expectedDigest?: string,
): Promise<unknown> {
  const bytes = await readResponseBytes(context, description, requestTimeoutMs);
  assertExpectedDigest(bytes, expectedDigest, description);
  const body = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new Error(`Pages ${description} body is not valid JSON.`, {
      cause: error,
    });
  }
}

function assertApplicationRoot(body: string, description: string): void {
  if (!APPLICATION_TITLE_PATTERN.test(body) || !ROOT_MOUNT_PATTERN.test(body)) {
    throw new Error(
      `Pages ${description} is missing the SALIDA CyL application root/title.`,
    );
  }
}

function parseManifest(value: unknown): PagesManifest {
  const parsed = GeneratedManifestSchema.safeParse(value);
  if (!parsed.success) {
    const paths = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Pages manifest does not satisfy the generated schema${paths ? ` (${paths})` : ""}.`,
    );
  }

  const manifest = parsed.data as GeneratedManifest;
  const actualKeys = Object.keys(manifest.resourceSnapshots).sort();
  const expectedKeys = [...GENERATED_RESOURCE_KEYS].sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(
      `Pages manifest must contain exactly the generated resource keys: ${expectedKeys.join(", ")}.`,
    );
  }

  const resourceSnapshots: Record<string, ResourceSnapshot> = {};
  const snapshotIds = new Set<string>();
  for (const [key, valueForKey] of Object.entries(manifest.resourceSnapshots)) {
    const resourcePath = valueForKey.resourcePath;
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
  expectedDigests: PagesDigestMap | undefined,
  request: PagesFetch,
  requestTimeoutMs: number,
): Promise<void> {
  const rootResponse = await requiredResponse(
    request,
    base,
    "root",
    requestTimeoutMs,
  );
  assertApplicationRoot(
    await readResponseText(rootResponse, "root response", requestTimeoutMs),
    "root response",
  );

  const versionUrl = urlForBasePath(base, "version.json");
  const versionResponse = await requiredResponse(
    request,
    versionUrl,
    "version metadata",
    requestTimeoutMs,
  );
  const version = await readJsonResponse(
    versionResponse,
    "version.json",
    requestTimeoutMs,
  );
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
    requestTimeoutMs,
  );
  const expectedManifestDigest = expectedDigestForPath(
    expectedDigests,
    base,
    MANIFEST_PATH,
  );
  assertExpectedDigestConfigured(
    expectedDigests,
    expectedManifestDigest,
    MANIFEST_PATH,
  );
  const manifest = parseManifest(
    await readJsonResponse(
      manifestResponse,
      "manifest",
      requestTimeoutMs,
      expectedManifestDigest,
    ),
  );

  for (const [key, snapshot] of Object.entries(manifest.resourceSnapshots)) {
    const resourceUrl = urlForBasePath(base, snapshot.resourcePath);
    if (resourceUrl.origin !== base.origin) {
      throw new Error(
        `Pages manifest resource ${key} must remain same-origin.`,
      );
    }
    const expectedResourceDigest = expectedDigestForPath(
      expectedDigests,
      base,
      snapshot.resourcePath,
    );
    assertExpectedDigestConfigured(
      expectedDigests,
      expectedResourceDigest,
      snapshot.resourcePath,
    );
    const resourceResponse = await requiredResponse(
      request,
      resourceUrl,
      `resource ${key}`,
      requestTimeoutMs,
    );
    await readJsonResponse(
      resourceResponse,
      `resource ${key}`,
      requestTimeoutMs,
      expectedResourceDigest,
    );
  }

  const deepLinkUrl = urlForBasePath(base, "comparar");
  const deepLinkContext = await fetchResponse(
    request,
    deepLinkUrl,
    "/comparar",
    requestTimeoutMs,
  );
  if (
    deepLinkContext.response.status !== 200 &&
    deepLinkContext.response.status !== 404
  ) {
    deepLinkContext.controller.abort();
    cancelResponseBody(deepLinkContext.response);
    throw new Error(
      `Pages /comparar returned HTTP ${deepLinkContext.response.status} at ${deepLinkUrl.pathname}.`,
    );
  }
  assertApplicationRoot(
    await readResponseText(
      deepLinkContext,
      "/comparar fallback",
      requestTimeoutMs,
    ),
    "/comparar fallback",
  );
}

function defaultDelay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, milliseconds);
  });
}

export async function verifyPagesDeployment({
  baseUrl,
  expectedCommit,
  expectedDigests,
  fetchImpl = fetch,
  attempts = MAX_VERIFICATION_ATTEMPTS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
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
  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    throw new Error("Verification request timeout must be a positive number.");
  }

  const base = normalizeBaseUrl(baseUrl);
  const wait = delayImpl ?? delay ?? defaultDelay;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await verifyOnce(
        base,
        expectedCommit,
        expectedDigests,
        fetchImpl,
        requestTimeoutMs,
      );
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

export async function computeExpectedPagesDigests(
  publicDirectory = resolve("public"),
): Promise<PagesDigestMap> {
  const manifestFilePath = resolve(publicDirectory, "data/v1/manifest.json");
  let manifestBytes: Buffer;
  try {
    manifestBytes = await readFile(manifestFilePath);
  } catch (error) {
    throw new Error(
      `Could not read checked-out Pages manifest at ${manifestFilePath}.`,
      { cause: error },
    );
  }

  let manifestValue: unknown;
  try {
    manifestValue = JSON.parse(manifestBytes.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(
      `Checked-out Pages manifest at ${manifestFilePath} is not valid JSON.`,
      { cause: error },
    );
  }
  const manifest = parseManifest(manifestValue);
  const expectedDigests: Record<string, string> = {
    [MANIFEST_PATH]: sha256(manifestBytes),
  };

  for (const snapshot of Object.values(manifest.resourceSnapshots)) {
    const resourceFilePath = resolve(
      publicDirectory,
      `.${snapshot.resourcePath}`,
    );
    let resourceBytes: Buffer;
    try {
      resourceBytes = await readFile(resourceFilePath);
    } catch (error) {
      throw new Error(
        `Could not read checked-out Pages resource at ${resourceFilePath}.`,
        { cause: error },
      );
    }
    expectedDigests[snapshot.resourcePath] = sha256(resourceBytes);
  }

  return expectedDigests;
}

async function main(): Promise<void> {
  const [baseUrl, expectedCommit] = process.argv.slice(2);
  if (baseUrl === undefined || expectedCommit === undefined) {
    throw new Error("Usage: npm run release:pages:verify -- <base-url> <sha>");
  }

  const expectedDigests = await computeExpectedPagesDigests();
  await verifyPagesDeployment({ baseUrl, expectedCommit, expectedDigests });
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
