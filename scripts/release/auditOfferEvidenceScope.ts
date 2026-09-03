import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { GeneratedManifestSchema } from "../../data/schemas/generated";
import { OfferEvidenceResourceSchema } from "../../data/schemas/offerEvidence";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outputRoot = join(repoRoot, "analysis", "final-scope-evidence");
const manifestPath = join(repoRoot, "public", "data", "v1", "manifest.json");

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function collectFieldNames(
  value: unknown,
  names = new Set<string>(),
): Set<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectFieldNames(item, names));
    return names;
  }
  if (value === null || typeof value !== "object") return names;
  for (const [key, child] of Object.entries(value)) {
    names.add(key);
    collectFieldNames(child, names);
  }
  return names;
}

async function main(): Promise<void> {
  const manifest = GeneratedManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const snapshots =
    manifest.resourceSnapshots as typeof manifest.resourceSnapshots &
      Record<
        "offerEvidence",
        {
          sourceId: string;
          sourceUrl: string;
          recordCount: number;
          sha256: string;
          snapshotFetchedAt: string;
          resourcePath: string;
          qualityStatus: "passed" | "stale";
        }
      >;
  const manifestSnapshot = snapshots.offerEvidence;
  if (manifestSnapshot === undefined) {
    throw new Error("The active manifest does not advertise offerEvidence.");
  }

  const publicPath = manifestSnapshot.resourcePath;
  const filePath = join(repoRoot, "public", publicPath.slice(1));
  const bytes = await readFile(filePath);
  const resource = OfferEvidenceResourceSchema.parse(
    JSON.parse(bytes.toString("utf8")),
  );
  const actualSha256 = sha256(bytes);
  const reviewCatalog = JSON.parse(
    await readFile(
      join(repoRoot, "data", "curated", "offer-evidence-reviews.json"),
      "utf8",
    ),
  );
  const reviewCatalogSha256 = sha256(
    Buffer.from(JSON.stringify(reviewCatalog), "utf8"),
  );
  const fieldNames = [...collectFieldNames(resource.records)].sort();
  const containsPrivateEmployers = resource.records.some(
    ({ employer }) => employer !== null,
  );
  const containsPredictiveFields = fieldNames.some((name) =>
    /predict|prediction|predic|forecast|salary/iu.test(name),
  );
  const provenance = manifest.activationProvenance;
  const dependency = provenance?.derivedResourceDependencies.find(
    ({ resourceKey }) => resourceKey === "offerEvidence",
  );
  const methodology = await readFile(
    join(repoRoot, "src", "features", "methodology", "MethodologyPage.tsx"),
    "utf8",
  );
  const methodologyMentionsOfferEvidence =
    /offerEvidence|recurso derivado de evidencia|páginas de ofertas|dataset reutilizable independiente|publicación independiente/iu.test(
      methodology,
    );

  const report = {
    publicFile: publicPath,
    localFile:
      "public/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json",
    generator: [
      "scripts/data/buildOfferEvidenceSnapshot.ts",
      "scripts/data/activateOfferEvidenceCandidate.ts",
    ],
    sourceResources: {
      manifestDependencyKeys: dependency?.sourceResourceKeys ?? [],
      sourceSnapshots: resource.sourceSnapshots,
      sourceDataset: "jcyl-employment-offers",
      sourceDatasetUrl:
        "https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ofertas-de-empleo/records",
    },
    recordCount: resource.records.length,
    counts: resource.counts,
    schema: {
      schemaVersion: resource.schemaVersion,
      validator: "data/schemas/offerEvidence.ts:OfferEvidenceResourceSchema",
      topLevelKeys: Object.keys(resource),
      recordKeys: Object.keys(resource.records[0] ?? {}),
    },
    license: {
      derivedResourceDeclaration: "NOT_DECLARED",
      sourceDatasetDocumentation: "CC BY 4.0 ES",
      sourceEvidence: "docs/data-audit-jcyl-open-data.md:128-141",
      conclusion:
        "The source license is documented, but the derived public resource does not declare its own reuse terms in its manifest/catalog entry.",
    },
    provenance: {
      snapshotId: resource.snapshotId,
      baseSnapshotId: resource.baseSnapshotId,
      generatedAt: resource.generatedAt,
      reviewVersion: resource.reviewVersion,
      reviewCatalogSha256,
      manifestSourceSnapshotId: provenance?.sourceSnapshotId ?? null,
      activationKind: provenance?.kind ?? null,
      derivedResourceKeys: provenance?.derivedResourceKeys ?? [],
    },
    hash: {
      actualSha256,
      manifestSha256: manifestSnapshot.sha256,
      matchesManifest: actualSha256 === manifestSnapshot.sha256,
    },
    snapshot: {
      manifestRecordCount: manifestSnapshot.recordCount,
      resourceRecordCount: resource.records.length,
      manifestFetchedAt: manifestSnapshot.snapshotFetchedAt,
      resourceGeneratedAt: resource.generatedAt,
    },
    tests: [
      "data/schemas/offerEvidence.ts",
      "scripts/data/buildOfferEvidenceSnapshot.test.ts",
      "src/domain/offerEvidence.test.ts",
      "src/data/generatedDataClient.test.ts",
      "scripts/release/validateCandidateBoundary.test.ts",
      "scripts/release/distributionCheck.ts",
      "tests/e2e/offer-first.spec.ts",
    ],
    manifestRelationship: {
      manifestKey: "offerEvidence",
      resourcePath: manifestSnapshot.resourcePath,
      sourceId: manifestSnapshot.sourceId,
      qualityStatus: manifestSnapshot.qualityStatus,
      activationDependencyKeys: dependency?.sourceResourceKeys ?? [],
    },
    canonicalOrDerived: "DERIVED",
    containsPrivateEmployers: containsPrivateEmployers ? "YES" : "NO",
    containsPredictions: containsPredictiveFields ? "YES" : "NO",
    publicSurface: "REMOVED_FROM_OPEN_DATA_SURFACE",
    runtimeRole: "RUNTIME_DERIVED_RESOURCE",
    standalonePublicationStatus: "NOT_PUBLISHED_AS_STANDALONE_REUSABLE_DATASET",
    publicMethodologyCoverage: methodologyMentionsOfferEvidence
      ? "PRESENT"
      : "ABSENT",
    classificationCode: "D",
    classification: "INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION",
    classificationBasis: [
      "Purpose, provenance, snapshot, schema, hashes and tests are present.",
      "The derived resource has no explicit license/reuse declaration in its own manifest/catalog entry.",
      "The public Methodology page now documents the runtime role and the non-standalone publication status in one proportional note.",
      "Standalone publication remains insufficiently documented until the derived resource's reuse terms are closed at the same level as the published datasets.",
    ],
    candidate8Decision: "REMOVED_FROM_OPEN_DATA_SURFACE_KEEP_RUNTIME_RESOURCE",
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    join(outputRoot, "offer-dataset-scope.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    join(outputRoot, "offer-dataset-scope.md"),
    `# Offer evidence scope audit

- OFFER_DATASET_INTRODUCED_COMMIT: \
\`9bad066a1144e6055e087e2c6e64f371521bf10d\` — 2026-09-01 — \
\`chore(contest): converge local release candidate\`.
- Purpose: activate the Expansion V1 derived offer-evidence resource in the immutable manifest and expose its evidence-backed offer journey.
- PUBLIC_FILE: \`${report.publicFile}\`
- GENERATOR: \`${report.generator.join("`, `")}\`
- RECORD_COUNT: ${report.recordCount}
- SCHEMA: \`${report.schema.validator}\` (${report.schema.schemaVersion})
- LICENSE: source documented as CC BY 4.0 ES, but derived-resource reuse terms are not declared in its own manifest/catalog entry.
- PROVENANCE: base snapshot \`${report.provenance.baseSnapshotId}\`; review version \`${report.provenance.reviewVersion}\`; review catalog SHA-256 \`${report.provenance.reviewCatalogSha256}\`.
- HASH: ${report.hash.actualSha256} (manifest match: ${report.hash.matchesManifest ? "YES" : "NO"})
- SNAPSHOT: \`${report.snapshot.resourceRecordCount}\` records, generated \`${report.snapshot.resourceGeneratedAt}\`, base offer count \`${report.counts.offerCount}\`.
- MANIFEST_RELATIONSHIP: key \`offerEvidence\`, quality \`${report.manifestRelationship.qualityStatus}\`, immutable resource path, derived dependency keys \`${report.manifestRelationship.activationDependencyKeys.join(", ")}\`.
- CANONICAL_OR_DERIVED: ${report.canonicalOrDerived}
- CONTAINS_PRIVATE_EMPLOYERS: ${report.containsPrivateEmployers}
- CONTAINS_PREDICTIONS: ${report.containsPredictions}
- OFFER_DATASET_PUBLIC_SURFACE: ${report.publicSurface}
- OFFER_DATASET_RUNTIME_ROLE: ${report.runtimeRole}
- OFFER_DATASET_STANDALONE_PUBLICATION_STATUS: ${report.standalonePublicationStatus}
- CLASSIFICATION: ${report.classificationCode}. ${report.classification}
- METHODOLOGY_COVERAGE: ${report.publicMethodologyCoverage}
- TESTS: schema, generator, domain, loader, boundary, distribution and offer-first E2E coverage are present.

## Decision

**D. INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION**.

The artifact is technically reproducible and hash-checked. The public Methodology now explains its derived runtime role and makes clear that it is not published as a standalone reusable dataset. The independent publication remains out of scope until its reuse terms are documented at the same level as the published datasets. Keep the immutable JSON, manifest resource and generators/data artifacts; do not alter the data or canonical source snapshots.
`,
    "utf8",
  );
  console.log(JSON.stringify(report, null, 2));
}

await main();
