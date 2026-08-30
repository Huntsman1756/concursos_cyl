import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  GeneratedManifestSchema,
  type GeneratedManifest,
} from "../../data/schemas/generated";
import {
  GENERATED_RESOURCE_KEYS,
  immutableGeneratedResourcePath,
  type GeneratedResourceKey,
} from "../../data/schemas/generatedResourceCatalog";
import {
  OFFER_EVIDENCE_SNAPSHOT_ID,
  OfferEvidenceResourceSchema,
} from "../../data/schemas/offerEvidence";

const ROOT = resolve(".");
const MANIFEST_PATH = resolve(ROOT, "public/data/v1/manifest.json");
const CANDIDATE_SNAPSHOT_ID = OFFER_EVIDENCE_SNAPSHOT_ID;
const DERIVED_RESOURCE_KEY = "offerEvidence";
const DERIVED_RESOURCE_DEPENDENCIES = [
  "jobOffers",
  "publishedRequirements",
  "programs",
  "occupations",
  "occupationAliases",
  "trainingOccupationLinks",
  "professionalCertificates",
  "professionalProfiles",
].sort();

function localPublicPath(resourcePath: string): string {
  if (
    !resourcePath.startsWith("/data/v1/") ||
    resourcePath.includes("\\") ||
    resourcePath.split("/").some((part) => part === ".." || part === ".")
  ) {
    throw new Error(`Unsafe manifest resource path: ${resourcePath}`);
  }
  return resolve(ROOT, "public", resourcePath.slice(1));
}

function snapshotIdFromPath(resourcePath: string): string {
  const match = /^\/data\/v1\/snapshots\/([^/]+)\/[^/]+\.json$/u.exec(
    resourcePath,
  );
  if (match === null) {
    throw new Error(
      `Manifest resource is not an immutable snapshot: ${resourcePath}`,
    );
  }
  return match[1]!;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sourceResourceKeys(
  manifest: GeneratedManifest,
): GeneratedResourceKey[] {
  const keys = GENERATED_RESOURCE_KEYS.filter(
    (key) => key !== DERIVED_RESOURCE_KEY,
  );
  const actual = Object.keys(manifest.resourceSnapshots);
  if (
    actual.length !== keys.length ||
    keys.some((key) => !actual.includes(key))
  ) {
    throw new Error(
      "Activation requires the complete pre-expansion generated resource set.",
    );
  }
  const baseSnapshotId = snapshotIdFromPath(
    manifest.resourceSnapshots.jobOffers.resourcePath,
  );
  for (const key of keys) {
    if (
      snapshotIdFromPath(manifest.resourceSnapshots[key]!.resourcePath) !==
      baseSnapshotId
    ) {
      throw new Error(
        `Source resource ${key} does not use the immutable baseline snapshot.`,
      );
    }
  }
  return keys;
}

export async function activateOfferEvidenceCandidate(): Promise<GeneratedManifest> {
  const manifestBytes = await readFile(MANIFEST_PATH);
  const manifest = GeneratedManifestSchema.parse(
    JSON.parse(manifestBytes.toString("utf8")) as unknown,
  );
  if (
    manifest.snapshotId === CANDIDATE_SNAPSHOT_ID &&
    manifest.activationProvenance?.candidateSnapshotId === CANDIDATE_SNAPSHOT_ID
  ) {
    const sidecarPath = localPublicPath(
      immutableGeneratedResourcePath("offerEvidence", CANDIDATE_SNAPSHOT_ID),
    );
    const sidecarBytes = await readFile(sidecarPath);
    const sidecar = OfferEvidenceResourceSchema.parse(
      JSON.parse(sidecarBytes.toString("utf8")) as unknown,
    );
    const descriptor = manifest.resourceSnapshots[DERIVED_RESOURCE_KEY];
    if (
      descriptor === undefined ||
      descriptor.resourcePath !==
        immutableGeneratedResourcePath(
          "offerEvidence",
          CANDIDATE_SNAPSHOT_ID,
        ) ||
      descriptor.recordCount !== sidecar.records.length
    ) {
      throw new Error(
        "Activated offer-evidence manifest does not match its immutable sidecar.",
      );
    }
    if (
      sidecar.baseSnapshotId !== manifest.activationProvenance.sourceSnapshotId
    ) {
      throw new Error(
        "Activated offer-evidence sidecar does not match its source snapshot.",
      );
    }
    const refreshedDerivedDescriptor = {
      ...descriptor,
      recordCount: sidecar.records.length,
      sha256: sha256(sidecarBytes),
      snapshotFetchedAt: sidecar.generatedAt,
    };
    const canonicalResourceSnapshots = Object.fromEntries(
      Object.entries({
        ...manifest.resourceSnapshots,
        [DERIVED_RESOURCE_KEY]: refreshedDerivedDescriptor,
      }).sort(([left], [right]) => left.localeCompare(right, "en")),
    );
    const canonicalActivationProvenance = {
      ...manifest.activationProvenance,
      derivedResourceDependencies: [
        {
          resourceKey: DERIVED_RESOURCE_KEY,
          sourceSnapshotId: manifest.activationProvenance.sourceSnapshotId,
          sourceResourceKeys: DERIVED_RESOURCE_DEPENDENCIES,
        },
      ],
    };
    const nextManifest = {
      ...manifest,
      activationProvenance: canonicalActivationProvenance,
      resourceSnapshots: canonicalResourceSnapshots,
    };
    if (JSON.stringify(nextManifest) !== JSON.stringify(manifest)) {
      await writeFile(
        MANIFEST_PATH,
        JSON.stringify(nextManifest, null, 2) + "\n",
        "utf8",
      );
      return GeneratedManifestSchema.parse(nextManifest);
    }
    return manifest;
  }
  const sourceKeys = sourceResourceKeys(manifest);
  const sourceSnapshotId = snapshotIdFromPath(
    manifest.resourceSnapshots.jobOffers.resourcePath,
  );
  const sidecarPath = localPublicPath(
    immutableGeneratedResourcePath("offerEvidence", CANDIDATE_SNAPSHOT_ID),
  );
  const sidecarBytes = await readFile(sidecarPath);
  const sidecar = OfferEvidenceResourceSchema.parse(
    JSON.parse(sidecarBytes.toString("utf8")) as unknown,
  );
  if (sidecar.baseSnapshotId !== sourceSnapshotId) {
    throw new Error(
      `Offer evidence sidecar targets ${sidecar.baseSnapshotId}, expected ${sourceSnapshotId}.`,
    );
  }

  const candidateSnapshots = Object.fromEntries(
    await Promise.all(
      sourceKeys.map(async (key) => {
        const source = manifest.resourceSnapshots[key]!;
        const candidatePath = immutableGeneratedResourcePath(
          key,
          CANDIDATE_SNAPSHOT_ID,
        );
        const sourcePath = localPublicPath(source.resourcePath);
        const targetPath = localPublicPath(candidatePath);
        await mkdir(dirname(targetPath), { recursive: true });
        await copyFile(sourcePath, targetPath);
        return [key, { ...source, resourcePath: candidatePath }] as const;
      }),
    ),
  );

  const derivedPath = immutableGeneratedResourcePath(
    "offerEvidence",
    CANDIDATE_SNAPSHOT_ID,
  );
  candidateSnapshots[DERIVED_RESOURCE_KEY] = {
    qualityStatus: "passed",
    recordCount: sidecar.records.length,
    resourcePath: derivedPath,
    schemaVersion: "1.0.0",
    sha256: sha256(sidecarBytes),
    snapshotFetchedAt: sidecar.generatedAt,
    sourceId: "salida-cyl-derived-offer-evidence",
    sourceUpdatedAt: null,
    sourceUrl: "https://github.com/Huntsman1756/concursos_cyl",
  };
  const orderedCandidateSnapshots = Object.fromEntries(
    Object.entries(candidateSnapshots).sort(([left], [right]) =>
      left.localeCompare(right, "en"),
    ),
  );

  const activated = GeneratedManifestSchema.parse({
    ...manifest,
    generatedAt: sidecar.generatedAt,
    snapshotId: CANDIDATE_SNAPSHOT_ID,
    activationProvenance: {
      schemaVersion: "1.0.0",
      kind: "immutable_candidate",
      candidateSnapshotId: CANDIDATE_SNAPSHOT_ID,
      sourceSnapshotId,
      sourceManifestSha256: sha256(manifestBytes),
      sourceResourceKeys: sourceKeys,
      derivedResourceKeys: [DERIVED_RESOURCE_KEY],
      derivedResourceDependencies: [
        {
          resourceKey: DERIVED_RESOURCE_KEY,
          sourceSnapshotId,
          sourceResourceKeys: DERIVED_RESOURCE_DEPENDENCIES,
        },
      ],
    },
    resourceSnapshots: orderedCandidateSnapshots,
  });
  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(activated, null, 2)}\n`,
    "utf8",
  );
  return activated;
}

if (
  process.argv[1]
    ?.replaceAll("\\", "/")
    .endsWith("activateOfferEvidenceCandidate.ts")
) {
  const manifest = await activateOfferEvidenceCandidate();
  console.log(
    JSON.stringify(
      {
        activatedSnapshotId: manifest.snapshotId,
        sourceSnapshotId: manifest.activationProvenance?.sourceSnapshotId,
        resourceKeys: Object.keys(manifest.resourceSnapshots),
      },
      null,
      2,
    ),
  );
}
