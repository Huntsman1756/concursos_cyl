import candidateResourceAllowlist from "../../config/candidate-resource-allowlist.json";
import {
  SepeOccupationMarketResourceSchema,
  type SepeOccupationMarketResource,
} from "./sepeOccupationMarket";
import type { GeneratedResourceKey } from "./generatedResourceCatalog";

const CANDIDATE_RESOURCE_COUNT = 21;
const RESOURCE_KEY_PATTERN = /^[a-z][a-zA-Z\d]*$/u;
const CANONICAL_SEPE_PERIOD = "2026-07";
const CANONICAL_SEPE_RECORD_COUNT = 116;

type CandidateResourceAllowlistConfig = {
  schemaVersion: "1.0.0";
  resourceKeys: readonly string[];
};

function compareKeys(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parseCandidateResourceAllowlist(
  value: unknown,
): CandidateResourceAllowlistConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Candidate resource allowlist must be an object.");
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.length !== 2 ||
    !keys.includes("schemaVersion") ||
    !keys.includes("resourceKeys")
  ) {
    throw new Error(
      "Candidate resource allowlist must contain only schemaVersion and resourceKeys.",
    );
  }
  if (record.schemaVersion !== "1.0.0") {
    throw new Error(
      "Candidate resource allowlist schemaVersion must be 1.0.0.",
    );
  }
  if (
    !Array.isArray(record.resourceKeys) ||
    record.resourceKeys.some(
      (key) => typeof key !== "string" || !RESOURCE_KEY_PATTERN.test(key),
    )
  ) {
    throw new Error("Candidate resource allowlist resourceKeys are invalid.");
  }
  const resourceKeys = record.resourceKeys as string[];
  if (resourceKeys.length !== CANDIDATE_RESOURCE_COUNT) {
    throw new Error(
      `Candidate resource allowlist must contain exactly ${CANDIDATE_RESOURCE_COUNT} keys.`,
    );
  }
  if (new Set(resourceKeys).size !== resourceKeys.length) {
    throw new Error(
      "Candidate resource allowlist resourceKeys must be unique.",
    );
  }
  const sorted = [...resourceKeys].sort(compareKeys);
  if (JSON.stringify(resourceKeys) !== JSON.stringify(sorted)) {
    throw new Error(
      "Candidate resource allowlist resourceKeys must be sorted.",
    );
  }
  return { schemaVersion: "1.0.0", resourceKeys };
}

const parsedAllowlist = parseCandidateResourceAllowlist(
  candidateResourceAllowlist,
);

export const CANDIDATE_RESOURCE_KEYS = Object.freeze([
  ...parsedAllowlist.resourceKeys,
]);

export type CandidateResourceKey = GeneratedResourceKey;

export function assertCandidateResourceSet(
  keys: readonly string[],
): asserts keys is readonly CandidateResourceKey[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const key of keys) {
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
  if (duplicates.length > 0) {
    throw new Error(
      `Candidate resource set contains duplicate key(s): ${[...new Set(duplicates)].join(", ")}.`,
    );
  }

  const expected = new Set<string>(CANDIDATE_RESOURCE_KEYS);
  const extra = [...seen].filter((key) => !expected.has(key)).sort(compareKeys);
  if (extra.length > 0) {
    throw new Error(
      `Candidate resource set contains extra key(s): ${extra.join(", ")}.`,
    );
  }
  const missing = CANDIDATE_RESOURCE_KEYS.filter((key) => !seen.has(key));
  if (missing.length > 0) {
    throw new Error(
      `Candidate resource set is missing key(s): ${missing.join(", ")}.`,
    );
  }
}

export function assertCanonicalSepeCandidateResource(
  value: unknown,
): SepeOccupationMarketResource {
  let resource: SepeOccupationMarketResource;
  try {
    resource = SepeOccupationMarketResourceSchema.parse(value);
  } catch (error) {
    throw new Error(
      "Canonical sepeOccupationMarket resource failed strict schema validation.",
      { cause: error },
    );
  }

  if (resource.period !== CANONICAL_SEPE_PERIOD) {
    throw new Error(
      `Canonical sepeOccupationMarket resource must use period ${CANONICAL_SEPE_PERIOD}.`,
    );
  }
  if (resource.records.length !== CANONICAL_SEPE_RECORD_COUNT) {
    throw new Error(
      `Canonical sepeOccupationMarket resource must contain ${CANONICAL_SEPE_RECORD_COUNT} records; got ${resource.records.length}.`,
    );
  }

  const recordCodes = resource.records.map((record) => record.cno.code);
  if (new Set(recordCodes).size !== recordCodes.length) {
    throw new Error(
      "Canonical sepeOccupationMarket resource must contain unique CNO records.",
    );
  }
  const sortedCodes = [...recordCodes].sort(compareKeys);
  if (JSON.stringify(recordCodes) !== JSON.stringify(sortedCodes)) {
    throw new Error(
      "Canonical sepeOccupationMarket resource CNO records must be sorted.",
    );
  }
  if (resource.coverage.notPublishedCnoCodes.length !== 0) {
    throw new Error(
      "Canonical sepeOccupationMarket resource cannot contain missing published CNO codes.",
    );
  }
  if (
    resource.coverage.publishedCnoCodes.length !==
      CANONICAL_SEPE_RECORD_COUNT ||
    resource.coverage.requestedCnoCodes.length !== CANONICAL_SEPE_RECORD_COUNT
  ) {
    throw new Error(
      "Canonical sepeOccupationMarket coverage must contain all 116 published CNO codes.",
    );
  }
  return resource;
}

export type CandidateReferenceClassification =
  "complementary-classification-source" | "publisher-owned" | "other";

function isSepeHost(hostname: string): boolean {
  return (
    hostname === "sepe.es" ||
    hostname.endsWith(".sepe.es") ||
    hostname === "sepe.gob.es" ||
    hostname.endsWith(".sepe.gob.es")
  );
}

export function classifyCandidateReference(
  url: string,
): CandidateReferenceClassification {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "other";
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== ""
  ) {
    return "other";
  }

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    return "other";
  }
  const hostAndPath = `${parsed.hostname.toLocaleLowerCase("en-US")}${decodedPath.toLocaleLowerCase("en-US")}`;
  const certificateReference =
    /(?:certificad|especialidad|cualific|titulaci[oó]n|formativ)/u.test(
      hostAndPath,
    );
  if (certificateReference) return "publisher-owned";
  if (isSepeHost(parsed.hostname.toLocaleLowerCase("en-US"))) {
    return "complementary-classification-source";
  }
  if (/occupation-market/u.test(decodedPath.toLocaleLowerCase("en-US"))) {
    return "other";
  }
  return "other";
}
