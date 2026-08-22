# Contest Release Candidate Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a fail-closed SALIDA CyL candidate-release system whose shared runtime core, Pages and VPS envelopes, freeze, live deployment evidence, captures, and contest documents identify the same release.

**Architecture:** Build one base-path-independent runtime core and package two small deployment envelopes for `/` and `/concursos_cyl/`. Validate data identity separately from deployment identity, require live verification before using `verified`, and keep contest evidence out of runtime snapshot retention. Candidate-only allowlists exclude the one-record SEPE experiment without deleting its research tooling.

**Tech Stack:** TypeScript 5, Node.js 24, Vite, Vitest, Playwright, GitHub Actions, Bash, PowerShell, JSON, Markdown.

**Spec:** `docs/superpowers/specs/2026-08-22-contest-release-candidate-hardening-design.md`

## Global Constraints

- Canonical candidate URL: `https://salida-cyl.157-90-22-40.sslip.io/`.
- Fallback Pages URL: `https://huntsman1756.github.io/concursos_cyl/`.
- The shared core identity is `releaseId`, `sourceCommitSha`, `snapshotId`, `manifestSha256`, and `artifactSha256`.
- Pages and VPS add separate `envelopeSha256` values; both must share the complete core identity.
- Offline validation cannot produce `verified`; `verified` requires live checks of both deployments.
- `coverage-freeze.json` schema `2.0.0` contains no deployment state or candidate URL.
- The candidate has exactly the configured 20 runtime resources and excludes the `sepeOccupationMarket` experiment from manifest, runtime UI, claims, evidence, and bundle.
- General INE or SEPE classification citations used by reviewed mappings remain allowed and retain their publisher terms.
- The eight configured JCyL datasets are counted separately from state sources and retain catalogue-declared `CC BY 4.0 ES` terms.
- The contest memory has at most 1,000 words and covers all seven equally weighted criteria.
- Production and release commands do not override publication URLs; tests inject configuration through function arguments.
- No task publishes, pushes, merges, submits the contest application, or overwrites the original checkout.
- Every production-code change follows RED → GREEN → refactor and includes focused tests.

---

### Task 1: Publication configuration, release identity, and deployment envelopes

**Files:**
- Create: `config/publication.json`
- Create: `scripts/release/releaseIdentity.ts`
- Create: `scripts/release/releaseIdentity.test.ts`
- Modify: `scripts/release/publicBasePath.ts`
- Modify: `scripts/release/publicBasePath.test.ts`
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/vite-env.d.ts`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`

**Interfaces:**
- Produces `PublicationConfig`, `ReleaseIdentity`, `DeploymentKind`, `DeploymentEnvelopeIdentity`, `loadPublicationConfig()`, `parseReleaseIdentity()`, `parseDeploymentEnvelopeIdentity()`, and `readRuntimeBasePath()`.
- Later tasks consume these types without redefining hashes, URLs, release IDs, or base-path rules.

- [ ] **Step 1: Write failing publication and identity tests**

```ts
it("loads the only production publication URLs", () => {
  expect(loadPublicationConfig(ROOT)).toEqual({
    schemaVersion: "1.0.0",
    canonicalRootUrl: "https://salida-cyl.157-90-22-40.sslip.io/",
    fallbackRootUrl: "https://huntsman1756.github.io/concursos_cyl/",
  });
});

it.each(["../release", "release/one", " release-1", "release-1 "])(
  "rejects unsafe releaseId %s",
  (releaseId) => {
    expect(() => parseReleaseIdentity(validIdentity({ releaseId }))).toThrow(
      /releaseId/u,
    );
  },
);

it("requires a deployment-specific envelope digest", () => {
  expect(
    parseDeploymentEnvelopeIdentity({
      ...validIdentity(),
      deployment: "pages",
      envelopeSha256: "b".repeat(64),
    }),
  ).toMatchObject({ deployment: "pages" });
});
```

- [ ] **Step 2: Run the identity tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/releaseIdentity.test.ts scripts/release/publicBasePath.test.ts`

Expected: FAIL because `releaseIdentity.ts` and the publication config do not exist and base-path resolution still depends on build-time environment state.

- [ ] **Step 3: Add the exact publication configuration**

```json
{
  "schemaVersion": "1.0.0",
  "canonicalRootUrl": "https://salida-cyl.157-90-22-40.sslip.io/",
  "fallbackRootUrl": "https://huntsman1756.github.io/concursos_cyl/"
}
```

- [ ] **Step 4: Implement the shared identity contracts**

```ts
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
```

Use exact-key parsing, 40-hex and 64-hex validation, `releaseId` pattern `^[a-z0-9][a-z0-9._-]{0,79}$`, and HTTPS URLs without credentials, query, or fragment.

- [ ] **Step 5: Make the compiled core independent of the hosting prefix**

Set Vite's core asset base to relative output. Generate deployment `index.html` later rather than embedding `/` or `/concursos_cyl/` in compiled assets. Read the runtime base from:

```html
<meta name="salida-public-base-path" content="/">
```

Expose:

```ts
export function readRuntimeBasePath(document: Document): string {
  const value = document
    .querySelector<HTMLMetaElement>('meta[name="salida-public-base-path"]')
    ?.content.trim();
  if (value !== "/" && value !== "/concursos_cyl/") {
    throw new Error("Missing or invalid SALIDA public base path metadata.");
  }
  return value;
}
```

Route basename and generated-data URLs must consume this value rather than a build-time constant.

- [ ] **Step 6: Verify GREEN and build compatibility**

Run:

```text
rtk npm exec -- vitest run scripts/release/releaseIdentity.test.ts scripts/release/publicBasePath.test.ts src/data/generatedDataClient.test.ts
rtk npm run typecheck
rtk npm run build
```

Expected: all commands exit `0`; the compiled JS/CSS/data bytes do not depend on the deployment prefix.

- [ ] **Step 7: Commit Task 1**

```text
rtk git add config/publication.json scripts/release/releaseIdentity.ts scripts/release/releaseIdentity.test.ts scripts/release/publicBasePath.ts scripts/release/publicBasePath.test.ts vite.config.ts src/main.tsx src/vite-env.d.ts src/data/generatedDataClient.ts src/data/generatedDataClient.test.ts
rtk git commit -m "feat(release): define candidate publication identity"
```

---

### Task 2: Runtime snapshot retention independent of contest evidence

**Files:**
- Create: `config/runtime-snapshot-retention.json`
- Create: `scripts/release/runtimeSnapshotRetention.ts`
- Create: `scripts/release/runtimeSnapshotRetention.test.ts`
- Modify: `scripts/release/prepareRuntimeData.ts`
- Modify: `scripts/release/prepareRuntimeData.test.ts`
- Modify: `scripts/data/buildSnapshots.ts`
- Modify: `scripts/data/buildSnapshots.test.ts`

**Interfaces:**
- Produces `RuntimeSnapshotRetention`, `parseRuntimeSnapshotRetention(value)`, and `loadRuntimeSnapshotRetention(rootDir)`.
- `prepareRuntimeData()` and snapshot cleanup consume only the active manifest and this configuration; they never read contest documents.

- [ ] **Step 1: Write failing retention tests**

```ts
it("ignores release evidence when selecting runtime snapshots", async () => {
  const before = await prepareFixture({
    retention: ["20260822021233066-9d8fa948959b"],
    evidenceSnapshot: "20260821120933391-9bd4488f9029",
  });
  const after = await prepareFixture({
    retention: ["20260822021233066-9d8fa948959b"],
    evidenceSnapshot: "20260821144454118-a56e3eeaffa6",
  });
  expect(after.snapshotIds).toEqual(before.snapshotIds);
  expect(after.treeSha256).toBe(before.treeSha256);
});

it("rejects duplicate or unsorted retained snapshot IDs", () => {
  expect(() =>
    parseRuntimeSnapshotRetention({
      schemaVersion: "1.0.0",
      snapshotIds: [
        "20260822021233066-9d8fa948959b",
        "20260822021233066-9d8fa948959b",
      ],
    }),
  ).toThrow(/sorted unique/u);
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/runtimeSnapshotRetention.test.ts scripts/release/prepareRuntimeData.test.ts scripts/data/buildSnapshots.test.ts`

Expected: FAIL because both build paths still scan `coverage-freeze.json` and `release-evidence.json`.

- [ ] **Step 3: Add and parse the retention configuration**

```json
{
  "schemaVersion": "1.0.0",
  "snapshotIds": ["20260822021233066-9d8fa948959b"]
}
```

```ts
export interface RuntimeSnapshotRetention {
  schemaVersion: "1.0.0";
  snapshotIds: string[];
}
```

Require snapshot pattern `^\d{17}-[a-f0-9]{12}$`, sorted unique values, and an existing snapshot directory for every configured ID.

- [ ] **Step 4: Replace evidence scanning in both runtime paths**

Remove `TERMINAL_EVIDENCE_PATHS`, `CONTEST_SNAPSHOT_REFERENCE_PATHS`, and recursive JSON-string extraction from contest documents. Preserve the active manifest snapshot automatically and union it with configured historical IDs.

- [ ] **Step 5: Verify GREEN and the regression invariant**

Run:

```text
rtk npm exec -- vitest run scripts/release/runtimeSnapshotRetention.test.ts scripts/release/prepareRuntimeData.test.ts scripts/data/buildSnapshots.test.ts
rtk npm run release:runtime-data
rtk npm run typecheck
```

Expected: all commands exit `0`; mutating contest evidence does not alter the prepared runtime tree.

- [ ] **Step 6: Commit Task 2**

```text
rtk git add config/runtime-snapshot-retention.json scripts/release/runtimeSnapshotRetention.ts scripts/release/runtimeSnapshotRetention.test.ts scripts/release/prepareRuntimeData.ts scripts/release/prepareRuntimeData.test.ts scripts/data/buildSnapshots.ts scripts/data/buildSnapshots.test.ts
rtk git commit -m "refactor(release): decouple runtime snapshot retention"
```

---

### Task 3: Candidate resource allowlist and SEPE experiment boundary

**Files:**
- Create: `config/candidate-resource-allowlist.json`
- Create: `data/schemas/candidateResourceAllowlist.ts`
- Create: `data/schemas/candidateResourceAllowlist.test.ts`
- Create: `scripts/release/validateCandidateBoundary.ts`
- Create: `scripts/release/validateCandidateBoundary.test.ts`
- Modify: `data/schemas/generatedResourceCatalog.ts`
- Modify: `data/schemas/generatedResourceCatalog.test.ts`
- Modify: `scripts/data/buildSnapshots.ts`
- Modify: `scripts/data/buildSnapshots.test.ts`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`
- Modify: `src/features/occupation-first/OccupationResultsPage.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.test.tsx`
- Modify: `tests/e2e/release.spec.ts`

**Interfaces:**
- Produces `CandidateResourceKey`, `CANDIDATE_RESOURCE_KEYS`, `assertCandidateResourceSet()`, `classifyCandidateReference(url)`, and `validateCandidateBoundary(options)`.
- Keeps SEPE parser, schema, capture command, curated fixture, and classification citations outside the candidate entrypoint.

```ts
export interface CandidateBoundaryOptions {
  rootDir: string;
  manifestPath: "public/data/v1/manifest.json";
  entrypointPaths: readonly [
    "src/main.tsx",
    "src/app/App.tsx",
    "src/data/generatedDataClient.ts",
    "src/features/occupation-first/OccupationResultsPage.tsx",
  ];
  documentPaths: readonly [
    "docs/contest/claim-ledger.json",
    "docs/contest/application-summary.md",
    "docs/contest/technical-evidence.md",
    "docs/contest/jury-memo.md",
    "docs/contest/submission-checklist.md",
    "docs/contest/source-ledger.md",
    "docs/contest/limitations.md",
    "docs/contest/coverage-freeze.json",
    "docs/contest/evidence-capture.json",
    "docs/contest/release-evidence.json",
    "DATA_LICENSE.md",
  ];
  bundleRoots: readonly ["dist"];
}
```

- [ ] **Step 1: Write failing allowlist and boundary tests**

```ts
it("rejects the one-record SEPE experiment from candidate resources", () => {
  expect(() =>
    assertCandidateResourceSet([
      ...CANDIDATE_RESOURCE_KEYS,
      "sepeOccupationMarket",
    ]),
  ).toThrow(/sepeOccupationMarket/u);
});

it("allows reviewed mapping citations to sepe.es", () => {
  expect(
    classifyCandidateReference(
      "https://www.sepe.es/HomeSepe/que-es-el-sepe.html",
    ),
  ).toBe("complementary-classification-source");
});

it("rejects the experimental component from a candidate entrypoint", async () => {
  await expect(validateCandidateBoundary(candidateFixtureOptions({
    entrypointSource: FIXTURE_WITH_SEPE_UI,
  }))).rejects.toThrow(
    /OccupationMarketEvidence/u,
  );
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts scripts/release/validateCandidateBoundary.test.ts scripts/data/buildSnapshots.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx`

Expected: FAIL because the generated catalogue, snapshot build, client, and results page still advertise the experiment.

- [ ] **Step 3: Add the exact 20-key allowlist**

Populate `config/candidate-resource-allowlist.json` with this exact, lexicographically sorted candidate set:

```json
{
  "schemaVersion": "1.0.0",
  "resourceKeys": [
    "centers",
    "derivedFpOccupationGraph",
    "ecylCourses",
    "educationCenterDirectory",
    "jobOffers",
    "mappingCoverage",
    "municipalities",
    "occupationAliases",
    "occupations",
    "officialOccupations",
    "openDataCatalog",
    "outcomeIndicators",
    "professionalCertificates",
    "professionalProfiles",
    "programs",
    "provincialContracts",
    "publicEmploymentCalls",
    "publishedRequirements",
    "trainingOccupationLinks",
    "trainingOfferings"
  ],
  "forbiddenExperimentKeys": ["sepeOccupationMarket"],
  "forbiddenCandidateModules": ["OccupationMarketEvidence"]
}
```

Do not duplicate the resource set in TypeScript.

- [ ] **Step 4: Separate candidate and experimental catalogues**

Keep the experimental schema and capture tooling importable by their focused tests. Remove `sepeOccupationMarket` from `GENERATED_RESOURCE_KEYS`, candidate manifest creation, candidate source hash, runtime client loader, and the occupation result entrypoint.

- [ ] **Step 5: Add the executable boundary validator**

`validateCandidateBoundary()` scans exactly the paths in `CandidateBoundaryOptions`, plus every regular file below the required built `dist` root. It rejects the experiment key in the manifest, listed candidate documents, evidence records, and bundle; it rejects the component import from the four candidate entrypoints and compiled bundle. It does not scan `data/curated`, capture scripts, schemas, parser tests, or research documentation. `classifyCandidateReference()` classifies general `sepe.es` mapping/classification URLs as complementary and external certificate URLs as publisher-owned; neither classification permits the experiment resource or component in the candidate.

- [ ] **Step 6: Verify GREEN and rebuild candidate data**

Run:

```text
rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts data/schemas/generatedResourceCatalog.test.ts scripts/release/validateCandidateBoundary.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx
rtk npm exec -- playwright test tests/e2e/release.spec.ts --project=chromium
rtk npm run data:build
rtk npm run build
rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist
rtk npm run typecheck
```

Expected: candidate manifest has exactly 20 allowlisted resources; SEPE research tests remain runnable separately.

- [ ] **Step 7: Commit Task 3**

```text
rtk git add config/candidate-resource-allowlist.json data/schemas/candidateResourceAllowlist.ts data/schemas/candidateResourceAllowlist.test.ts scripts/release/validateCandidateBoundary.ts scripts/release/validateCandidateBoundary.test.ts data/schemas/generatedResourceCatalog.ts data/schemas/generatedResourceCatalog.test.ts scripts/data/buildSnapshots.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.tsx src/features/occupation-first/OccupationResultsPage.test.tsx tests/e2e/release.spec.ts public/data/v1
rtk git commit -m "fix(candidate): exclude experimental SEPE market resource"
```

---

### Task 4: Coverage freeze schema 2 and complete resource reconciliation

**Files:**
- Modify: `scripts/release/validateContestFreeze.ts`
- Modify: `scripts/release/validateContestFreeze.test.ts`
- Modify: `docs/contest/coverage-freeze.json`
- Create: `docs/contest/coverage-freeze-rebake-20260822.md`

**Interfaces:**
- Produces `ContestFreezeV2` with `schemaVersion: "2.0.0"` and no deployment object.
- Consumes `CANDIDATE_RESOURCE_KEYS` from Task 3.

- [ ] **Step 1: Write failing schema-migration tests**

```ts
it("rejects schema 1 freezes with a rebake message", async () => {
  const freeze = await readFreezeV2();
  expect(() =>
    validateContestFreeze(
      { ...freeze, schemaVersion: "1.0.0" },
      { rootDir: ROOT },
    ),
  ).toThrow(
    "coverage freeze schema 1.0.0 must be rebaked as 2.0.0",
  );
});

it("rejects deployment state in schema 2", async () => {
  const freeze = await readFreezeV2();
  expect(() =>
    validateContestFreeze(
      { ...freeze, deployment: { status: "verified" } },
      { rootDir: ROOT },
    ),
  ).toThrow(/unknown field.*deployment/iu);
});

it("requires the complete candidate resource set", async () => {
  const freeze = await readFreezeV2();
  delete freeze.manifest.resourceSnapshots.centers;
  expect(() => validateContestFreeze(freeze, { rootDir: ROOT })).toThrow(
    /candidate resource set/iu,
  );
});
```

- [ ] **Step 2: Run freeze tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/validateContestFreeze.test.ts`

Expected: FAIL because schema 1 and `deployment` are still required.

- [ ] **Step 3: Implement and export `ContestFreezeV2`**

Remove `DEPLOYMENT_KEYS`, `EXPECTED_ROOT_URL`, and the deployment field. Load candidate resource keys from Task 3 and compare exact sorted sets across the public manifest, freeze, and allowlist before recomputing coverage.

- [ ] **Step 4: Rebake the freeze from the candidate manifest**

Write schema `2.0.0`, exact manifest hash, snapshot, quality counts, 20 resource snapshots, recomputed coverage, offers, and attempts. Record the source commit boundary in the rebake note; do not add a deployment claim.

- [ ] **Step 5: Verify GREEN**

Run:

```text
rtk npm exec -- vitest run scripts/release/validateContestFreeze.test.ts
rtk npm exec -- tsx scripts/release/validateContestFreeze.ts
rtk npm run typecheck
```

Expected: all commands exit `0`, and adding `deployment` or an extra resource fails.

- [ ] **Step 6: Commit Task 4**

```text
rtk git add scripts/release/validateContestFreeze.ts scripts/release/validateContestFreeze.test.ts docs/contest/coverage-freeze.json docs/contest/coverage-freeze-rebake-20260822.md
rtk git commit -m "refactor(contest): migrate coverage freeze to schema 2"
```

---

### Task 5: Canonical core inventory, deployment envelopes, and candidate bundle

**Files:**
- Create: `scripts/release/artifactManifest.ts`
- Create: `scripts/release/artifactManifest.test.ts`
- Create: `scripts/release/createCandidateBundle.ts`
- Create: `scripts/release/createCandidateBundle.test.ts`
- Create: `scripts/release/verifyReleaseBundle.ts`
- Create: `scripts/release/verifyReleaseBundle.test.ts`
- Modify: `scripts/release/writeVersionMetadata.ts`
- Modify: `scripts/release/writeVersionMetadata.test.ts`
- Modify: `scripts/release/preparePagesFallback.ts`
- Modify: `scripts/release/prepareContestFallback646.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `ArtifactManifest`, `EnvelopeManifest`, `ReleaseAttestation`, `createCandidateBundle(options)`, and `verifyReleaseBundle(options)`.
- Bundle output contains one shared core, `metadata/artifact-manifest.json`, a canonical `metadata/publication.json`, plus `envelopes/pages` and `envelopes/vps`.

- [ ] **Step 1: Write failing canonical inventory tests**

```ts
it("hashes exact bytes in UTF-8 path order", async () => {
  await fixture.write("á.txt", Buffer.from([0x00, 0xff]));
  await fixture.write("z.txt", "z\n");
  const result = await createArtifactManifest(fixture.path);
  expect(result.manifest.files.map(({ path }) => path)).toEqual([
    "z.txt",
    "á.txt",
  ]);
  expect(result.serialized.endsWith("\n")).toBe(true);
  expect(result.artifactSha256).toMatch(/^[a-f0-9]{64}$/u);
});

it.each([
  "index.html",
  "404.html",
  "version.json",
  "deployment-config.json",
  "artifact-manifest.json",
])("excludes deployment envelope file %s from the core", async (path) => {
  await fixture.write(path, path);
  expect((await createArtifactManifest(fixture.path)).manifest.files).not.toContainEqual(
    expect.objectContaining({ path }),
  );
});
```

- [ ] **Step 2: Write failing bundle tests**

Assert that Pages and VPS packages have the same `artifactSha256`, different base metadata and `envelopeSha256`, exact identity fields in `version.json`, and no build input named `evidenceCommitSha`.

- [ ] **Step 3: Run bundle tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/artifactManifest.test.ts scripts/release/createCandidateBundle.test.ts scripts/release/writeVersionMetadata.test.ts scripts/release/verifyReleaseBundle.test.ts`

Expected: FAIL because core inventory and candidate packaging do not exist.

- [ ] **Step 4: Implement canonical serialization and safe tree checks**

```ts
export interface ArtifactManifest {
  schemaVersion: "1.0.0";
  files: Array<{ path: string; bytes: number; sha256: string }>;
}

export interface EnvelopeManifest {
  schemaVersion: "1.0.0";
  deployment: DeploymentKind;
  artifactSha256: string;
  files: Array<{ path: string; bytes: number; sha256: string }>;
}

export interface ReleaseAttestation {
  schemaVersion: "1.0.0";
  identity: ReleaseIdentity;
  envelopes: Record<DeploymentKind, { envelopeSha256: string }>;
  sourceTreeSha256: string;
  lockfileSha256: string;
  publicationSha256: string;
  createdAt: string;
}
```

Reject symlinks, non-regular entries, traversal, duplicate paths, unsorted inventory, wrong byte counts, and hash mismatches.

Serialize both manifest types as UTF-8 JSON with recursively sorted object keys, no insignificant whitespace, and one trailing LF. Sort `files` by raw UTF-8 path bytes. `artifactSha256` is the SHA-256 of the exact serialized `ArtifactManifest`. `envelopeSha256` is the SHA-256 of the exact serialized `EnvelopeManifest`. Store the exact canonical artifact-manifest bytes at `metadata/artifact-manifest.json` in the release bundle and copy them unchanged to `artifact-manifest.json` at the root of both deployed packages. Canonically serialize `config/publication.json` into `metadata/publication.json` and bind its exact bytes through `ReleaseAttestation.publicationSha256`. These metadata files are intentionally outside both file inventories because the artifact manifest's own bytes define `artifactSha256`; the attestation and `version.json` bind the release digests.

- [ ] **Step 5: Package the two envelopes from one core**

Generate Pages base metadata `/concursos_cyl/` and VPS base metadata `/`. Generate `index.html` from one template by replacing only asset URL prefix and the `salida-public-base-path` meta. Pages receives a byte-identical `404.html` copy of its final index.

The envelope manifest includes exactly `index.html`, `deployment-config.json`, and Pages `404.html` when present. It excludes `envelope-manifest.json`, `version.json`, and the copied public `artifact-manifest.json`. Create and hash that manifest first, then write `version.json` with the resulting `envelopeSha256`; this two-phase algorithm removes self-reference. The external `ReleaseAttestation` binds the shared identity and both envelope digests. Verification checks the core against public `artifact-manifest.json`, checks the envelope payload against its manifest, then checks the excluded `version.json` exactly against the attested deployment identity.

- [ ] **Step 6: Add package scripts and verify GREEN**

Add:

```json
{
  "release:candidate:create": "tsx scripts/release/createCandidateBundle.ts",
  "release:candidate:verify": "tsx scripts/release/verifyReleaseBundle.ts"
}
```

Run:

```text
rtk npm exec -- vitest run scripts/release/artifactManifest.test.ts scripts/release/createCandidateBundle.test.ts scripts/release/writeVersionMetadata.test.ts scripts/release/verifyReleaseBundle.test.ts
rtk npm run build
rtk npm run typecheck
```

Expected: all commands exit `0`; both envelopes verify against one core digest.

- [ ] **Step 7: Commit Task 5**

```text
rtk git add scripts/release/artifactManifest.ts scripts/release/artifactManifest.test.ts scripts/release/createCandidateBundle.ts scripts/release/createCandidateBundle.test.ts scripts/release/verifyReleaseBundle.ts scripts/release/verifyReleaseBundle.test.ts scripts/release/writeVersionMetadata.ts scripts/release/writeVersionMetadata.test.ts scripts/release/preparePagesFallback.ts scripts/release/prepareContestFallback646.ts package.json package-lock.json
rtk git commit -m "feat(release): build attested candidate core and envelopes"
```

---

### Task 6: Public identity probes and fail-before-write evidence capture

**Files:**
- Create: `scripts/release/publicReleaseIdentity.ts`
- Create: `scripts/release/publicReleaseIdentity.test.ts`
- Create: `scripts/release/captureContestEvidence.test.ts`
- Modify: `scripts/release/captureContestEvidence.ts`
- Modify: `scripts/release/validateContestEvidenceManifest.ts`
- Modify: `scripts/release/validateContestEvidenceManifest.test.ts`
- Modify: `docs/contest/evidence-capture.json`
- Modify: `docs/contest/evidence-capture.md`

**Interfaces:**
- Produces `PublicEndpointProbe`, `fetchPublicIdentity(baseUrl, fetchImpl)`, and evidence manifest schema `2.0.0`.
- Capture consumes expected VPS envelope identity from Task 5 and publication config from Task 1.

- [ ] **Step 1: Write failing public-probe tests**

```ts
it("hashes the exact manifest response bytes", async () => {
  const bytes = validCandidateManifestBytes({
    snapshotId: "20260822021233066-9d8fa948959b",
  });
  const probe = await fetchPublicIdentity(CANONICAL_URL, fixtureFetch({
    version: validVpsIdentity(),
    manifestBytes: bytes,
  }));
  expect(probe.manifestSha256).toBe(
    createHash("sha256").update(bytes).digest("hex"),
  );
});

it("rejects a version-manifest mismatch", async () => {
  await expect(
    fetchPublicIdentity(CANONICAL_URL, fixtureFetch({
      version: validVpsIdentity({ manifestSha256: "0".repeat(64) }),
      manifestBytes: VALID_MANIFEST_BYTES,
    })),
  ).rejects.toThrow(/manifestSha256/u);
});
```

- [ ] **Step 2: Write fail-before-write capture tests**

Create an existing PNG and evidence JSON, return a different release from the fake endpoint, run capture, and assert both files retain their original hashes.

- [ ] **Step 3: Run capture tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/publicReleaseIdentity.test.ts scripts/release/captureContestEvidence.test.ts scripts/release/validateContestEvidenceManifest.test.ts`

Expected: FAIL because capture trusts `--commit` and has no observed identity.

- [ ] **Step 4: Implement the endpoint probe**

Fetch configured `version.json`, `artifact-manifest.json`, and `data/v1/manifest.json`; require HTTP 200 JSON responses, validate the VPS envelope identity, hash exact manifest bytes, derive its snapshot from every resource path, and reject redirects to a different origin.

- [ ] **Step 5: Refactor capture into preflight and atomic write phases**

Before launching Chromium, compare expected identity with the canonical probe. Buffer every PNG and the complete new JSON in memory or temporary files. Rename into place only after every page, Axe, diagnostics, and hash check succeeds.

- [ ] **Step 6: Migrate the evidence manifest to schema 2**

```ts
export interface ContestEvidenceManifestV2 {
  schemaVersion: "2.0.0";
  freezeRequired: true;
  outputDirectory: "docs/contest/evidence";
  observedIdentity: DeploymentEnvelopeIdentity & {
    canonicalRootUrl: string;
    observedAt: string;
  };
  captures: Array<{
    evidenceId: string;
    route: string;
    viewport: { width: number; height: number };
    outputFile: string;
    sha256: string;
    capturedAt: string;
    requiredVisible: RequiredVisible[];
    claimIds: string[];
    freezeRequired: boolean;
    redactionRule: string;
  }>;
}
```

Preserve the existing capture contract for `freezeRequired`, `outputDirectory`, `requiredVisible`, `claimIds`, per-capture `freezeRequired`, and `redactionRule`. Remove only per-capture `localCommitSha` and `deployedCommitSha`; the single top-level observed identity replaces them.

- [ ] **Step 7: Verify GREEN**

Run:

```text
rtk npm exec -- vitest run scripts/release/publicReleaseIdentity.test.ts scripts/release/captureContestEvidence.test.ts scripts/release/validateContestEvidenceManifest.test.ts
rtk npm run typecheck
```

Expected: mismatch stops before any evidence write; one observed identity governs all captures.

- [ ] **Step 8: Commit Task 6**

```text
rtk git add scripts/release/publicReleaseIdentity.ts scripts/release/publicReleaseIdentity.test.ts scripts/release/captureContestEvidence.ts scripts/release/captureContestEvidence.test.ts scripts/release/validateContestEvidenceManifest.ts scripts/release/validateContestEvidenceManifest.test.ts docs/contest/evidence-capture.json docs/contest/evidence-capture.md
rtk git commit -m "fix(evidence): bind captures to observed public identity"
```

---

### Task 7: Release evidence schema 2 and live-only verification

**Files:**
- Create: `scripts/release/validateReleaseEvidence.ts`
- Create: `scripts/release/validateReleaseEvidence.test.ts`
- Modify: `scripts/release/verifyPagesDeployment.ts`
- Modify: `scripts/release/verifyPagesDeployment.test.ts`
- Modify: `scripts/release/verifyCaddyContainer.ts`
- Modify: `scripts/release/verifyCaddyContainer.test.ts`
- Modify: `scripts/release/verifyCaddyContainerCli.ts`
- Modify: `scripts/release/verifyVersionMetadata.test.ts`
- Modify: `docs/contest/release-evidence.json`

**Interfaces:**
- Produces `ContestReleaseEvidenceV2`, `DeploymentEvidence`, `GithubReleaseClient`, and `validateReleaseEvidence(evidence, options)`.
- Offline mode validates structure and cross-file identity. Live mode additionally probes both endpoints and GitHub.

- [ ] **Step 1: Write failing state and mismatch tests**

```ts
it("forbids verified evidence in offline mode", async () => {
  await expect(
    validateReleaseEvidence(validEvidence({ state: "verified" }), {
      rootDir: ROOT,
      mode: "offline",
    }),
  ).rejects.toThrow("verified release evidence requires live verification");
});

it.each([
  "releaseId",
  "sourceCommitSha",
  "snapshotId",
  "manifestSha256",
  "artifactSha256",
] as const)("rejects Pages/VPS mismatch in %s", async (field) => {
  const evidence = validEvidence();
  evidence.deployments.pages.identity[field] = alternateValue(field);
  await expect(validateOffline(evidence)).rejects.toThrow(
    "DEPLOYMENT_IDENTITY_MISMATCH",
  );
});
```

- [ ] **Step 2: Add ancestry, evidence-diff, workflow, and active-deployment tests**

Use an injected `GithubReleaseClient` fixture. Require source ancestry, distinct evidence commit, evidence-only changed paths, workflow `conclusion: "success"`, matching `head_sha`, and active Pages deployment.

- [ ] **Step 3: Run evidence tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/validateReleaseEvidence.test.ts scripts/release/verifyPagesDeployment.test.ts scripts/release/verifyCaddyContainer.test.ts`

Expected: FAIL because the old evidence model has one deployment and silently degrades mismatches.

- [ ] **Step 4: Implement schema 2 exact-key parsing**

```ts
export type ReleaseEvidenceState =
  | "pending"
  | "structurally_valid"
  | "verified";

export interface DeploymentEvidence {
  state: "pending" | "verified";
  configuredUrl: string;
  identity: DeploymentEnvelopeIdentity;
  workflowRunId: string | null;
  vpsReleaseId: string | null;
  observedAt: string | null;
}

export interface ContestReleaseEvidenceV2 {
  schemaVersion: "2.0.0";
  state: ReleaseEvidenceState;
  verificationMode: "offline" | "live";
  evidenceCommitSha: string | null;
  expected: ReleaseIdentity;
  deployments: { pages: DeploymentEvidence; vps: DeploymentEvidence };
  capture: { canonicalDeployment: "vps"; manifestPath: string };
  humanApproval: {
    finalApplicationTextApproved: boolean;
    rootUrlApproved: boolean;
    submissionAuthorized: boolean;
  };
}
```

`pending` may use `evidenceCommitSha: null`; `structurally_valid` and `verified` require a 40-hex evidence commit. An evidence commit must differ from and descend from `sourceCommitSha`, and its GitHub diff may change only `docs/contest/**` and `DATA_LICENSE.md`. No source, config, data, package, workflow, or release script is evidence-only.

- [ ] **Step 5: Unify Pages and Caddy verification on public probes**

Both verifiers consume expected envelope identities and compare public version, core inventory, envelope digest, manifest bytes, snapshot, critical resources, and host-specific requirements. Remove commit-only success paths.

- [ ] **Step 6: Write an explicit pending evidence record**

Migrate the checked-in record to schema 2 with `state: "pending"`, `verificationMode: "offline"`, `evidenceCommitSha: null`, null deployment observations, and all human approvals false. Do not preserve the stale verified claim. At the start of Task 7, record the committed Task 6 HEAD as the explicit 40-hex variable `TASK6_SOURCE_SHA`, build the candidate with `--release-id contest-2026-rc1 --source-commit TASK6_SOURCE_SHA`, and take `releaseId`, `sourceCommitSha`, `snapshotId`, `manifestSha256`, and `artifactSha256` verbatim from the resulting Task 5 attestation; never derive them from the evidence file or current evidence commit.

- [ ] **Step 7: Verify GREEN**

Run:

```text
rtk npm exec -- vitest run scripts/release/validateReleaseEvidence.test.ts scripts/release/verifyPagesDeployment.test.ts scripts/release/verifyCaddyContainer.test.ts scripts/release/verifyVersionMetadata.test.ts
rtk npm exec -- tsx scripts/release/validateReleaseEvidence.ts --mode offline
rtk npm run typecheck
```

Expected: offline pending record passes structural checks; any offline verified record fails.

- [ ] **Step 8: Commit Task 7**

```text
rtk git add scripts/release/validateReleaseEvidence.ts scripts/release/validateReleaseEvidence.test.ts scripts/release/verifyPagesDeployment.ts scripts/release/verifyPagesDeployment.test.ts scripts/release/verifyCaddyContainer.ts scripts/release/verifyCaddyContainer.test.ts scripts/release/verifyCaddyContainerCli.ts scripts/release/verifyVersionMetadata.test.ts docs/contest/release-evidence.json
rtk git commit -m "feat(release): require live verified deployment evidence"
```

---

### Task 8: Semantic claims, memory limit, licences, checklist, and renderer

**Files:**
- Create: `config/jcyl-license-inventory.json`
- Create: `scripts/release/jsonPointer.ts`
- Create: `scripts/release/jsonPointer.test.ts`
- Create: `scripts/release/validateContestMemory.ts`
- Create: `scripts/release/validateContestMemory.test.ts`
- Create: `scripts/release/validateSourceLicenses.ts`
- Create: `scripts/release/validateSourceLicenses.test.ts`
- Create: `scripts/release/validateSubmissionChecklist.ts`
- Create: `scripts/release/validateSubmissionChecklist.test.ts`
- Modify: `scripts/release/validateContestClaims.ts`
- Modify: `scripts/release/validateContestClaims.test.ts`
- Modify: `scripts/release/renderContestSubmission.ts`
- Modify: `scripts/release/renderContestSubmission.test.ts`
- Modify: `docs/contest/claim-ledger.json`
- Modify: `docs/contest/jury-memo.md`
- Modify: `docs/contest/source-ledger.md`
- Modify: `docs/contest/submission-checklist.md`
- Modify: `docs/contest/application-summary.md`
- Modify: `docs/contest/technical-evidence.md`
- Modify: `docs/contest/limitations.md`
- Modify: `DATA_LICENSE.md`
- Modify: `docs/deployment.md`
- Modify: `docs/contest/qa-matrix.md`
- Modify: `package.json`

**Interfaces:**
- Produces RFC 6901 resolver, memory validation result, eight-entry JCyL licence inventory, semantic claim evidence, and checklist validator.
- Renderer consumes validated freeze, release evidence, publication config, claims, licences, and memory result.

- [ ] **Step 1: Write failing RFC 6901 tests**

```ts
it("resolves RFC 6901 escapes and array indexes", () => {
  expect(resolveJsonPointer({ "a/b": { "~key": ["ok"] } }, "/a~1b/~0key/0"))
    .toBe("ok");
});

it.each(["manifest.snapshotId", "/__proto__/x", "/a/~2b"])(
  "rejects invalid pointer %s",
  (pointer) => {
    expect(() => resolveJsonPointer({}, pointer)).toThrow(/pointer/u);
  },
);
```

- [ ] **Step 2: Write failing semantic claim tests**

Migrate fixtures to `{document, pointer, expectedType, comparison, expectedValue}`. Assert missing fields, wrong types, symbolic aliases, and mismatched rendered values fail.

- [ ] **Step 3: Write failing memory boundary tests**

```ts
expect(countMarkdownWords(memoryWithBodyWords(1000))).toBe(1000);
expect(() => validateContestMemory(memoryWithBodyWords(1001))).toThrow(
  /1001.*maximum 1000/u,
);
```

Require the seven headings and reject unmeasured claims `reduce el tiempo`, `clientes actuales`, `acuerdos firmados`, and `API operativa`.

- [ ] **Step 4: Write failing licence and checklist tests**

Require exactly these JCyL IDs: `jcyl-vocational-training-offer`, `jcyl-employment-offers`, `jcyl-ecyl-training`, `jcyl-professional-certificates`, `jcyl-public-employment-calls`, `jcyl-provincial-employment-contracts`, `jcyl-municipal-registry`, and `jcyl-education-center-directory`. Reject state sources in that set and reject CC BY/MIT claims for external SEPE content.

- [ ] **Step 5: Run the new gates and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/jsonPointer.test.ts scripts/release/validateContestClaims.test.ts scripts/release/validateContestMemory.test.ts scripts/release/validateSourceLicenses.test.ts scripts/release/validateSubmissionChecklist.test.ts scripts/release/renderContestSubmission.test.ts`

Expected: FAIL because claims are symbolic and the new gates do not exist.

- [ ] **Step 6: Implement the four validators**

`countMarkdownWords()` ignores HTML comments and code blocks, counts visible link text, normalizes LF, and accepts exactly 1,000 words. Claim roots are limited to freeze, release evidence, capture manifest, publication config, and licence inventory.

- [ ] **Step 7: Add the exact licence inventory**

Every entry contains dataset ID, official records URL, `licenseName: "CC BY 4.0 ES"`, `licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.es_ES"`, and explicit attribution. The certificates note states that external SEPE targets retain publisher terms.

- [ ] **Step 8: Rewrite and validate the memory and checklist**

Keep the memory at or below 1,000 words, one section per equally weighted criterion. Name the 2022 winner exactly as “Oferta de Formación profesional de Castilla y León. Una alternativa atractiva y accesible con herramientas no-code”, by Laura Folgado Galache. Present economic paths as future possibilities and make no adoption, audience-size, revenue, customer, or measured-time claim.

Checklist must keep identity, contact, consent, signature, eligibility, originality, prior-award status, and submission authorization human-only and pending.

- [ ] **Step 9: Make renderer fail closed**

Remove `ROOT_URL` and the old deployment loader. Load publication config and validated release evidence. Render `verified` only for live-validated state; `pending` and `structurally_valid` use explicit pending language. Resolve every ledger claim before accepting rendered documents.

- [ ] **Step 10: Verify GREEN**

Run:

```text
rtk npm exec -- vitest run scripts/release/jsonPointer.test.ts scripts/release/validateContestClaims.test.ts scripts/release/validateContestMemory.test.ts scripts/release/validateSourceLicenses.test.ts scripts/release/validateSubmissionChecklist.test.ts scripts/release/renderContestSubmission.test.ts
rtk npm exec -- tsx scripts/release/validateContestMemory.ts
rtk npm exec -- tsx scripts/release/validateSourceLicenses.ts
rtk npm exec -- tsx scripts/release/renderContestSubmission.ts --write
rtk npm run contest:submission:check
rtk npm run license:check
```

Expected: all commands exit `0`; generated documents say deployment is pending until a real candidate is published.

- [ ] **Step 11: Commit Task 8**

```text
rtk git add config/jcyl-license-inventory.json scripts/release/jsonPointer.ts scripts/release/jsonPointer.test.ts scripts/release/validateContestMemory.ts scripts/release/validateContestMemory.test.ts scripts/release/validateSourceLicenses.ts scripts/release/validateSourceLicenses.test.ts scripts/release/validateSubmissionChecklist.ts scripts/release/validateSubmissionChecklist.test.ts scripts/release/validateContestClaims.ts scripts/release/validateContestClaims.test.ts scripts/release/renderContestSubmission.ts scripts/release/renderContestSubmission.test.ts docs/contest DATA_LICENSE.md docs/deployment.md package.json package-lock.json
rtk git commit -m "docs(contest): validate criteria claims licences and checklist"
```

---

### Task 9: Candidate workflows, immutable VPS deployment, and rollback

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Create: `.github/workflows/validate-contest-evidence.yml`
- Create: `.github/workflows/rollback-release.yml`
- Modify: `scripts/release/deployPagesWorkflow.test.ts`
- Create: `scripts/release/releaseWorkflow.test.ts`
- Create: `scripts/release/rollbackReleaseWorkflow.test.ts`
- Modify: `scripts/release/deployVps.sh`
- Modify: `scripts/release/deployVps.ps1`
- Modify: `scripts/release/vpsDeployment.test.ts`
- Create: `scripts/release/rollbackVps.sh`
- Create: `scripts/release/rollbackVps.ps1`
- Create: `scripts/release/rollbackVps.test.ts`
- Modify: `docs/deployment.md`

**Interfaces:**
- Publication workflow accepts exact `sourceCommitSha` and `releaseId`, creates one candidate release artifact, deploys Pages first, and stages VPS from the attested core plus VPS envelope.
- Evidence-only workflow never publishes.
- Rollback accepts existing `releaseId` and workflow run ID and never rebuilds.

Use these exact action pins already qualified for this repository family:

```text
actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97
actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093
actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9
actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d
actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128
```

The build job creates `candidate-bundle.tar.gz` and `release-attestation.json`, then uploads both as artifact `candidate-${releaseId}`. Pages extracts and verifies the Pages package before `upload-pages-artifact`; VPS downloads the same workflow-run artifact and extracts the VPS package. Rollback downloads that named historical artifact using the required workflow run ID.

Both deployment implementations expose the same required arguments:

```text
deployVps.sh --bundle candidate-bundle.tar.gz --attestation release-attestation.json --release-id RELEASE_ID
deployVps.ps1 -Bundle candidate-bundle.tar.gz -Attestation release-attestation.json -ReleaseId RELEASE_ID
rollbackVps.sh --bundle candidate-bundle.tar.gz --attestation release-attestation.json --release-id RELEASE_ID
rollbackVps.ps1 -Bundle candidate-bundle.tar.gz -Attestation release-attestation.json -ReleaseId RELEASE_ID
```

The four commands load `metadata/publication.json` from the verified bundle, check its bytes against `ReleaseAttestation.publicationSha256`, and use its canonical URL. Their tests require that exact path and digest check. They expose no URL override. If an environment-provided expected URL is used as a safety assertion, it must equal `canonicalRootUrl` byte-for-byte or fail before staging.

- [ ] **Step 1: Write failing workflow contract tests**

Assert precisely the pins and artifact names above, detached exact-SHA checkout, clean tree and lockfile hashes, single build, artifact upload, Pages-before-VPS dependency, publication only under `workflow_dispatch`, and no deploy action in the evidence workflow. PR/push runs validate only; `docs/contest/**` and `DATA_LICENSE.md` may trigger evidence validation but never candidate publication.

- [ ] **Step 2: Write failing VPS immutable-bundle tests**

```ts
for (const deployScript of [deployVpsSh, deployVpsPs1]) {
  for (const forbidden of [
    "git rev-parse HEAD",
    "npm ci",
    "npm run build",
    "writeVersionMetadata",
  ]) {
    expect(deployScript).not.toContain(forbidden);
  }
  expect(deployScript).toContain("verifyReleaseBundle");
  expect(deployScript).toContain(".staging-");
}
```

Add fixtures for existing release, failed inventory, pre-switch failure, post-switch public failure, and restoration of the previous `current` target.

- [ ] **Step 3: Write failing rollback tests**

Run the same behavioral fixture suite separately against `rollbackVps.sh` and `rollbackVps.ps1`. Require an existing attested artifact, forbid git/npm/build, verify atomic switch, restore on public-check failure, and retain current plus two previous releases.

- [ ] **Step 4: Run workflow/deployment tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/deployPagesWorkflow.test.ts scripts/release/releaseWorkflow.test.ts scripts/release/rollbackReleaseWorkflow.test.ts scripts/release/vpsDeployment.test.ts scripts/release/rollbackVps.test.ts`

Expected: FAIL because current flows rebuild from HEAD and have no rollback workflow.

- [ ] **Step 5: Split validation from explicit candidate publication**

Use `workflow_dispatch` inputs with strict SHA/release patterns. Validation remains on PR and push. Candidate publication builds from the requested protected-main commit or approved candidate tag, records tree and lockfile hashes, uploads the core, both envelopes, manifests, and attestation, and deploys Pages. The VPS job consumes the same release artifact; it does not rebuild.

- [ ] **Step 6: Implement safe VPS promotion and rollback**

Stage by `releaseId`, verify the complete core and VPS envelope, refuse overwrite, atomically switch `current`, run public verification, and restore the previous symlink on failure. Cleanup targets only this invocation's staging/archive files.

- [ ] **Step 7: Verify GREEN and workflow formatting**

Run:

```text
rtk npm exec -- vitest run scripts/release/deployPagesWorkflow.test.ts scripts/release/releaseWorkflow.test.ts scripts/release/rollbackReleaseWorkflow.test.ts scripts/release/vpsDeployment.test.ts scripts/release/rollbackVps.test.ts
rtk npm run typecheck
rtk npm run format:check
```

Expected: all commands exit `0`; no workflow publishes evidence-only changes.

- [ ] **Step 8: Commit Task 9**

```text
rtk git add .github/workflows scripts/release/deployPagesWorkflow.test.ts scripts/release/releaseWorkflow.test.ts scripts/release/rollbackReleaseWorkflow.test.ts scripts/release/deployVps.sh scripts/release/deployVps.ps1 scripts/release/vpsDeployment.test.ts scripts/release/rollbackVps.sh scripts/release/rollbackVps.ps1 scripts/release/rollbackVps.test.ts docs/deployment.md
rtk git commit -m "feat(release): deploy and roll back attested candidates"
```

---

### Task 10: Full candidate integration and pending handoff

**Files:**
- Create: `scripts/release/releaseCandidate.integration.test.ts`
- Create: `scripts/release/runtimeArtifactRegression.test.ts`
- Modify: `tests/e2e/release.spec.ts`
- Modify: `docs/contest/NEXT_SESSION.md`
- Modify: `docs/contest/technical-summary.md`

**Interfaces:**
- Proves the complete local chain through an attested but unpublished candidate.
- Leaves live evidence explicitly pending; publishing and recapture happen only after shared-branch integration and explicit external release execution.

- [ ] **Step 1: Write the failing end-to-end release fixture**

Build one fixture core, package both envelopes, serve them under `/` and `/concursos_cyl/`, and assert:

```ts
expect(pages.releaseId).toBe(vps.releaseId);
expect(pages.sourceCommitSha).toBe(vps.sourceCommitSha);
expect(pages.snapshotId).toBe(vps.snapshotId);
expect(pages.manifestSha256).toBe(vps.manifestSha256);
expect(pages.artifactSha256).toBe(vps.artifactSha256);
expect(pages.envelopeSha256).not.toBe(vps.envelopeSha256);
```

Also assert a Pages failure prevents VPS promotion, a VPS failure restores its previous target, and an evidence-only fixture change preserves the core digest.

- [ ] **Step 2: Run integration tests and confirm RED**

Run:

```text
rtk npm exec -- vitest run scripts/release/releaseCandidate.integration.test.ts scripts/release/runtimeArtifactRegression.test.ts
rtk npm exec -- playwright test tests/e2e/release.spec.ts --project=chromium
```

Expected: FAIL until every earlier task is integrated through public-base serving and candidate packaging.

- [ ] **Step 3: Complete only the minimal integration fixes**

Wire existing interfaces without adding product features. Keep the checked-in release evidence pending and describe the exact publish, live-verify, capture, and renderer commands in `NEXT_SESSION.md` and `technical-summary.md`.

- [ ] **Step 4: Run the complete verification suite**

Run:

```text
rtk npm run test:release -- --testTimeout=60000
rtk npm run typecheck
rtk npm run lint
rtk npm run format:check
rtk npm run license:check
rtk npm run contest:submission:check
rtk npm run build
rtk npm run test:e2e:chromium
rtk git diff --check
```

Expected: every command exits `0`; release evidence remains pending because this task does not publish.

- [ ] **Step 5: Commit Task 10**

```text
rtk git add scripts/release/releaseCandidate.integration.test.ts scripts/release/runtimeArtifactRegression.test.ts tests/e2e/release.spec.ts docs/contest/NEXT_SESSION.md docs/contest/technical-summary.md
rtk git commit -m "test(release): verify complete candidate identity chain"
```

- [ ] **Step 6: Prepare the publish handoff without side effects**

Record the exact candidate `sourceCommitSha`, proposed `releaseId`, local `artifactSha256`, Pages `envelopeSha256`, VPS `envelopeSha256`, manifest snapshot, and manifest SHA. Do not dispatch the workflow, upload to VPS, push, or merge from this task.
