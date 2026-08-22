import { readFileSync } from "node:fs";
import { join } from "node:path";

export type DeploymentKind = "pages" | "vps";

export interface ReleaseIdentity {
  schemaVersion: "1.0.0";
  releaseId: string;
  sourceCommitSha: string;
  snapshotId: string;
  manifestSha256: string;
  artifactSha256: string;
}

export interface DeploymentEnvelopeIdentity extends ReleaseIdentity {
  deployment: DeploymentKind;
  envelopeSha256: string;
}

export type VersionMetadata = DeploymentEnvelopeIdentity;

export interface PublicationConfig {
  schemaVersion: "1.0.0";
  canonicalRootUrl: string;
  fallbackRootUrl: string;
}

const RELEASE_IDENTITY_KEYS = [
  "schemaVersion",
  "releaseId",
  "sourceCommitSha",
  "snapshotId",
  "manifestSha256",
  "artifactSha256",
] as const;

const DEPLOYMENT_ENVELOPE_IDENTITY_KEYS = [
  ...RELEASE_IDENTITY_KEYS,
  "deployment",
  "envelopeSha256",
] as const;

const PUBLICATION_CONFIG_KEYS = [
  "schemaVersion",
  "canonicalRootUrl",
  "fallbackRootUrl",
] as const;

type RecordValue = Record<string, unknown>;

function recordValue(value: unknown, label: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value as RecordValue;
}

function assertExactKeys(
  value: RecordValue,
  expectedKeys: readonly string[],
  label: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    throw new Error(
      `${label} must contain exact keys: ${expected.join(", ")}.`,
    );
  }
}

function stringValue(value: RecordValue, key: string, label: string): string {
  const candidate = value[key];
  if (typeof candidate !== "string") {
    throw new Error(`${label}.${key} must be a string.`);
  }
  return candidate;
}

function hexValue(
  value: RecordValue,
  key: string,
  length: number,
  label: string,
): string {
  const candidate = stringValue(value, key, label);
  if (!new RegExp(`^[a-f0-9]{${length}}$`, "u").test(candidate)) {
    throw new Error(`${label}.${key} must be a ${length}-hexadecimal digest.`);
  }
  return candidate;
}

function schemaVersion(value: RecordValue, label: string): "1.0.0" {
  const candidate = value.schemaVersion;
  if (candidate !== "1.0.0") {
    throw new Error(`${label}.schemaVersion must be exactly "1.0.0".`);
  }
  return candidate;
}

function parseReleaseIdentityRecord(value: RecordValue): ReleaseIdentity {
  assertExactKeys(value, RELEASE_IDENTITY_KEYS, "Release identity");

  const schema = schemaVersion(value, "Release identity");
  const releaseId = stringValue(value, "releaseId", "Release identity");
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/u.test(releaseId)) {
    throw new Error(
      `Release identity.releaseId must match ^[a-z0-9][a-z0-9._-]{0,79}$.`,
    );
  }

  const snapshotId = stringValue(value, "snapshotId", "Release identity");
  if (snapshotId.length === 0) {
    throw new Error("Release identity.snapshotId must not be empty.");
  }

  return {
    schemaVersion: schema,
    releaseId,
    sourceCommitSha: hexValue(value, "sourceCommitSha", 40, "Release identity"),
    snapshotId,
    manifestSha256: hexValue(value, "manifestSha256", 64, "Release identity"),
    artifactSha256: hexValue(value, "artifactSha256", 64, "Release identity"),
  };
}

function parsePublicationConfigRecord(value: RecordValue): PublicationConfig {
  assertExactKeys(value, PUBLICATION_CONFIG_KEYS, "Publication config");

  const schema = schemaVersion(value, "Publication config");
  const canonicalRootUrl = httpsUrlValue(
    value,
    "canonicalRootUrl",
    "Publication config",
  );
  const fallbackRootUrl = httpsUrlValue(
    value,
    "fallbackRootUrl",
    "Publication config",
  );

  return { schemaVersion: schema, canonicalRootUrl, fallbackRootUrl };
}

function httpsUrlValue(value: RecordValue, key: string, label: string): string {
  const candidate = stringValue(value, key, label);
  if (candidate.length === 0 || candidate.trim() !== candidate) {
    throw new Error(
      `${label}.${key} must be an HTTPS URL without credentials, query, or fragment.`,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(
      `${label}.${key} must be an HTTPS URL without credentials, query, or fragment.`,
    );
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.length === 0 ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    throw new Error(
      `${label}.${key} must be an HTTPS URL without credentials, query, or fragment.`,
    );
  }

  return candidate;
}

export function parseReleaseIdentity(value: unknown): ReleaseIdentity {
  return parseReleaseIdentityRecord(recordValue(value, "Release identity"));
}

export function parseDeploymentEnvelopeIdentity(
  value: unknown,
): DeploymentEnvelopeIdentity {
  const record = recordValue(value, "Deployment envelope identity");
  assertExactKeys(
    record,
    DEPLOYMENT_ENVELOPE_IDENTITY_KEYS,
    "Deployment envelope identity",
  );

  const releaseIdentity = parseReleaseIdentityRecord(
    Object.fromEntries(RELEASE_IDENTITY_KEYS.map((key) => [key, record[key]])),
  );
  const deployment = stringValue(
    record,
    "deployment",
    "Deployment envelope identity",
  );
  if (deployment !== "pages" && deployment !== "vps") {
    throw new Error(
      'Deployment envelope identity.deployment must be "pages" or "vps".',
    );
  }

  return {
    ...releaseIdentity,
    deployment,
    envelopeSha256: hexValue(
      record,
      "envelopeSha256",
      64,
      "Deployment envelope identity",
    ),
  };
}

export function parsePublicationConfig(value: unknown): PublicationConfig {
  return parsePublicationConfigRecord(recordValue(value, "Publication config"));
}

export function loadPublicationConfig(
  rootDir = process.cwd(),
): PublicationConfig {
  const path = join(rootDir, "config", "publication.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load publication config at ${path}: ${detail}`, {
      cause: error,
    });
  }
  return parsePublicationConfig(parsed);
}
