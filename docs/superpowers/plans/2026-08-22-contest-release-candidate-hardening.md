# Contest Release Candidate Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a fail-closed SALIDA CyL candidate-release system whose shared runtime core, Pages and VPS envelopes, freeze, live deployment evidence, captures, and contest documents identify the same release.

**Architecture:** Build one base-path-independent runtime core and package two small deployment envelopes for `/` and `/concursos_cyl/`. Validate data identity separately from deployment identity, require live verification before using `verified`, and keep contest evidence out of runtime snapshot retention. An exact candidate allowlist preserves the canonical 116-record SEPE resource as a separately governed state source while rejecting stale experimental payloads.

**Tech Stack:** TypeScript 5, Node.js 24, Vite, Vitest, Playwright, GitHub Actions, Bash, PowerShell, JSON, Markdown.

**Spec:** `docs/superpowers/specs/2026-08-22-contest-release-candidate-hardening-design.md`

## Global Constraints

- Authoritative implementation base: `f78d4a258e589106eef3e974bcabd6f7e11ed936`
  (`main`). The previous Task 1–7 commits based on `085faca…` are reference
  patches only; every change is ported deliberately and validated against the
  current code and data.
- Current published product commit: `ae66d5bc8393dbb02818471ad7eb850e4d4367de`.
- Candidate data input: snapshot `20260822085631889-7bbe69380f6d`, manifest
  SHA-256 `92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18`.
- Canonical candidate URL: `https://salida-cyl.157-90-22-40.sslip.io/`.
- Fallback Pages URL: `https://huntsman1756.github.io/concursos_cyl/`.
- The shared core identity is `releaseId`, `sourceCommitSha`, `snapshotId`, `manifestSha256`, and `artifactSha256`.
- Pages and VPS add separate `envelopeSha256` values; both must share the complete core identity.
- Offline validation cannot produce `verified`; `verified` requires live checks of both deployments.
- `coverage-freeze.json` schema `2.0.0` contains no deployment state or candidate URL.
- The candidate has exactly the configured 21 runtime resources, including the
  canonical 116-record `sepeOccupationMarket` state-source resource. It rejects
  stale one-record fixtures, missing/extra keys, invalid provenance, and any
  attempt to count or license SEPE as a JCyL dataset.
- General INE or SEPE classification citations used by reviewed mappings remain allowed and retain their publisher terms.
- The eight configured JCyL datasets are counted separately from state sources and retain catalogue-declared `CC BY 4.0 ES` terms.
- The contest memory has at most 1,000 words and covers all seven equally weighted criteria.
- Production and release commands do not override publication URLs; tests inject configuration through function arguments.
- No task publishes, deploys, pushes, merges, submits the contest application,
  or overwrites the original checkout.
- The schema migration preserves at least 264 approved relations, 113 distinct
  qualifications, 130 modality keys, 131 occupations, 21 aliases, and 38
  matched offers.
- Every production-code change follows RED → GREEN → refactor and includes focused tests.

---

### Task 1: Publication configuration, release identity, and deployment envelopes

**Files:**
- Create: `config/publication.json`
- Create: `scripts/release/releaseIdentity.ts`
- Create: `scripts/release/releaseIdentity.test.ts`
- Modify: `scripts/release/publicBasePath.ts`
- Modify: `scripts/release/publicBasePath.test.ts`

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

- [ ] **Step 5: Define, but do not yet activate, the runtime-base contract**

Implement and test strict reading of the runtime base from:

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
Do not wire this strict reader into `src/main.tsx` yet: the current source
`index.html` and deployment workflow do not inject the metadata. Activation is
atomic with Task 5's envelope producer and source-index fallback, so dev,
preview, Pages and Caddy never pass through an unbootable intermediate commit.

- [ ] **Step 6: Verify GREEN and build compatibility**

Run:

```text
rtk npm exec -- vitest run scripts/release/releaseIdentity.test.ts scripts/release/publicBasePath.test.ts
rtk npm run typecheck
rtk npm run build
```

Expected: all commands exit `0`; the compiled JS/CSS/data bytes do not depend on the deployment prefix.

- [ ] **Step 7: Commit Task 1**

```text
rtk git add config/publication.json scripts/release/releaseIdentity.ts scripts/release/releaseIdentity.test.ts scripts/release/publicBasePath.ts scripts/release/publicBasePath.test.ts
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
    retention: ["20260822082339635-2706ba4b5a53"],
    evidenceSnapshot: "20260821120933391-9bd4488f9029",
  });
  const after = await prepareFixture({
    retention: ["20260822082339635-2706ba4b5a53"],
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
        "20260822085631889-7bbe69380f6d",
        "20260822085631889-7bbe69380f6d",
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
  "snapshotIds": [
    "20260808172031375-7c88ca187340",
    "20260808174436640-7b8aa74dc939",
    "20260808184316256-47f987062bc2",
    "20260808213621985-add4c517860c",
    "20260808215403108-add4c517860c",
    "20260809014318761-5b22c488ce4b",
    "20260822021233066-9d8fa948959b",
    "20260822064449120-b76d60c84145",
    "20260822074315030-a6fc9479d93c",
    "20260822082339635-2706ba4b5a53"
  ]
}
```

```ts
export interface RuntimeSnapshotRetention {
  schemaVersion: "1.0.0";
  snapshotIds: string[];
}
```

Require snapshot pattern `^\d{17}-[a-f0-9]{12}$`, sorted unique values, and an
existing snapshot directory for every configured ID. The active snapshot
`20260822085631889-7bbe69380f6d` is retained automatically from the manifest and
is intentionally not duplicated in this historical list.

- [ ] **Step 4: Replace evidence scanning in both runtime paths**

Remove `TERMINAL_EVIDENCE_PATHS`, `CONTEST_SNAPSHOT_REFERENCE_PATHS`, and
recursive JSON-string extraction from contest documents. Preserve the active
manifest snapshot automatically and union it with configured historical IDs.
In `buildSnapshots.ts`, retain the current
`FP_COVERAGE_WAVE_3_VERSIONED_SNAPSHOT_IDS`, quarantine handling,
`ignoredDirectories`, byte-identical preservation of active revoked snapshots,
symlink/traversal checks, and the returned
`{ ignoredDirectories, historicalSnapshotDirectories }` contract; replace only
the evidence/analysis extractors with the validated retention configuration.

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

### Task 3: Exact 21-resource allowlist and canonical SEPE boundary

**Files:**
- Create: `config/candidate-resource-allowlist.json`
- Create: `data/schemas/candidateResourceAllowlist.ts`
- Create: `data/schemas/candidateResourceAllowlist.test.ts`
- Create: `scripts/release/validateCandidateBoundary.ts`
- Create: `scripts/release/validateCandidateBoundary.test.ts`
- Modify: `data/schemas/generatedResourceCatalog.ts`
- Modify: `data/schemas/generatedResourceCatalog.test.ts`
- Modify: `tests/e2e/release.spec.ts`

**Interfaces:**
- Produces `CandidateResourceKey`, `CANDIDATE_RESOURCE_KEYS`,
  `assertCandidateResourceSet()`, `assertCanonicalSepeCandidateResource()`,
  `classifyCandidateReference(url)`, and `validateCandidateBoundary(options)`.
- Preserves the current SEPE parser, strict schema, 116 canonical records,
  runtime loader, product evidence component, and official-source citations.
- Treats SEPE as a complementary state source; only the eight configured JCyL
  catalogue records contribute to the JCyL dataset count.

```ts
export interface CandidateBoundaryOptions {
  rootDir: string;
  manifestPath: "public/data/v1/manifest.json";
  sepeResourcePath: string;
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
it("requires the canonical SEPE resource in the candidate set", () => {
  expect(() =>
    assertCandidateResourceSet(
      CANDIDATE_RESOURCE_KEYS.filter((key) => key !== "sepeOccupationMarket"),
    ),
  ).toThrow(/missing.*sepeOccupationMarket/iu);
});

it("allows reviewed mapping citations to sepe.es", () => {
  expect(
    classifyCandidateReference(
      "https://www.sepe.es/HomeSepe/que-es-el-sepe.html",
    ),
  ).toBe("complementary-classification-source");
});

it("rejects a stale one-record SEPE payload", async () => {
  await expect(validateCandidateBoundary(candidateFixtureOptions({
    sepeResource: FIXTURE_WITH_ONE_SEPE_RECORD,
  }))).rejects.toThrow(
    /canonical.*116|sepeOccupationMarket/iu,
  );
});

it("retains the canonical SEPE runtime evidence", async () => {
  await expect(validateCandidateBoundary(currentCandidateOptions()))
    .resolves.toMatchObject({ resourceCount: 21, sepeRecordCount: 116 });
});
```

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts scripts/release/validateCandidateBoundary.test.ts scripts/data/buildSnapshots.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx`

Expected: FAIL because the exact candidate allowlist and the cross-file SEPE
boundary validator do not yet exist.

- [ ] **Step 3: Add the exact 21-key allowlist**

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
    "sepeOccupationMarket",
    "trainingOccupationLinks",
    "trainingOfferings"
  ]
}
```

Do not duplicate the resource set in TypeScript.

- [ ] **Step 4: Bind the canonical SEPE resource without weakening its schema**

Keep the existing `sepeOccupationMarket` entry in `GENERATED_RESOURCE_KEYS`,
snapshot creation, candidate source hashing, runtime loader, and
`OccupationMarketEvidence` unchanged. Validate the current resource through the
existing `SepeOccupationMarketResourceSchema` and require exactly 116 unique,
sorted CNO records for this freeze, period `2026-07`, no missing published CNO
code, HTTPS canonical SEPE detail URLs, and the manifest resource hash/record
count to match the exact bytes on disk. Do not edit or relax the current schema,
parser, resolver, capture, curated data, loader, or product UI in this task.

- [ ] **Step 5: Add the executable boundary validator**

`validateCandidateBoundary()` compares exact sorted sets across the allowlist,
public manifest, generated resource catalogue, freeze, release evidence and
claims where applicable. It validates every regular file below the required
built `dist` root against the same manifest, rejects symlinks and traversal, and
parses the SEPE payload with the canonical assertions above. It rejects missing,
extra, or duplicate resources and contradictory JCyL ownership/licence claims.
`classifyCandidateReference()` classifies SEPE classification and
occupation-market URLs as complementary state-source references and external
certificate URLs as publisher-owned; neither classification permits relicensing
them under the JCyL inventory or MIT.

- [ ] **Step 6: Verify GREEN and rebuild candidate data**

Run:

```text
rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts data/schemas/generatedResourceCatalog.test.ts scripts/release/validateCandidateBoundary.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx
rtk npm exec -- vitest run data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx
rtk npm exec -- playwright test tests/e2e/release.spec.ts --project=chromium
rtk npm run data:build
rtk npm run build
rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist
rtk npm run typecheck
```

Expected: candidate manifest has exactly 21 allowlisted resources; the
116-record SEPE resource, loader, UI evidence and focused tests remain present;
the eight-entry JCyL count remains unchanged.

- [ ] **Step 7: Commit Task 3**

```text
rtk git add config/candidate-resource-allowlist.json data/schemas/candidateResourceAllowlist.ts data/schemas/candidateResourceAllowlist.test.ts scripts/release/validateCandidateBoundary.ts scripts/release/validateCandidateBoundary.test.ts data/schemas/generatedResourceCatalog.ts data/schemas/generatedResourceCatalog.test.ts tests/e2e/release.spec.ts
rtk git commit -m "feat(candidate): enforce canonical 21-resource boundary"
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

it("requires the complete 21-resource candidate set", async () => {
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

- [ ] **Step 4: Rebake the freeze from the current candidate manifest**

Write schema `2.0.0`, exact manifest hash, snapshot, quality counts, all 21
resource snapshots (including the 116-record SEPE resource), recomputed
coverage, offers, and attempts. Preserve or improve the baseline of 264 approved
relations, 113 distinct qualifications, 130 modality keys, 131 occupations, 21
aliases, 3 matched relations, 261 zero-reviewed relations, and 38 matched
offers. Record the committed Task 3 HEAD (which contains the candidate
allowlist) as the new source boundary in the rebake note and freeze; the legacy
`05f9053…` boundary is no longer sufficient. Do not add a deployment claim and
do not reuse hashes from the stale branch.

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
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `src/main.tsx`
- Modify: `src/vite-env.d.ts`
- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`
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

Define `sourceTreeSha256` as SHA-256 over the exact raw bytes emitted by
`git ls-tree -r -z --full-tree <sourceCommitSha>` from the detached source
commit. Define `lockfileSha256` as SHA-256 over the exact checked-out
`package-lock.json` bytes. Tests use raw `Buffer` values so NUL delimiters,
non-ASCII paths and final-byte behavior cannot be changed by text decoding.

Reject symlinks, non-regular entries, traversal, duplicate paths, unsorted inventory, wrong byte counts, and hash mismatches.

Serialize both manifest types as UTF-8 JSON with recursively sorted object keys, no insignificant whitespace, and one trailing LF. Sort `files` by raw UTF-8 path bytes. `artifactSha256` is the SHA-256 of the exact serialized `ArtifactManifest`. `envelopeSha256` is the SHA-256 of the exact serialized `EnvelopeManifest`. Store the exact canonical artifact-manifest bytes at `metadata/artifact-manifest.json` in the release bundle and copy them unchanged to `artifact-manifest.json` at the root of both deployed packages. Canonically serialize `config/publication.json` into `metadata/publication.json` and bind its exact bytes through `ReleaseAttestation.publicationSha256`. These metadata files are intentionally outside both file inventories because the artifact manifest's own bytes define `artifactSha256`; the attestation and `version.json` bind the release digests.

- [ ] **Step 5: Package the two envelopes from one core**

Generate Pages base metadata `/concursos_cyl/` and VPS base metadata `/`. Generate `index.html` from one template by replacing only asset URL prefix and the `salida-public-base-path` meta. Pages receives a byte-identical `404.html` copy of its final index.

Activate Task 1's runtime-base contract in the same commit: set Vite's shared
core to relative assets; route basename and generated-data requests through
`readRuntimeBasePath(document)`; and put
`<meta name="salida-public-base-path" content="/" />` in source `index.html` so
local dev, `vite preview`, and the VPS root boot without packaging. The Pages
envelope rewrites only that explicit value to `/concursos_cyl/`. Preserve the
current generated-data client's SEPE adapters, abort handling, payload budgets,
and all newer fixtures while inserting the runtime-base argument.

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
rtk npm exec -- vitest run scripts/release/publicBasePath.test.ts src/data/generatedDataClient.test.ts
rtk npm run build
rtk npm run typecheck
```

Expected: all commands exit `0`; both envelopes verify against one core digest.

- [ ] **Step 7: Commit Task 5**

```text
rtk git add scripts/release/artifactManifest.ts scripts/release/artifactManifest.test.ts scripts/release/createCandidateBundle.ts scripts/release/createCandidateBundle.test.ts scripts/release/verifyReleaseBundle.ts scripts/release/verifyReleaseBundle.test.ts scripts/release/writeVersionMetadata.ts scripts/release/writeVersionMetadata.test.ts scripts/release/preparePagesFallback.ts scripts/release/prepareContestFallback646.ts vite.config.ts index.html src/main.tsx src/vite-env.d.ts src/data/generatedDataClient.ts src/data/generatedDataClient.test.ts package.json package-lock.json
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
    snapshotId: "20260822085631889-7bbe69380f6d",
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

Also cover a never-resolving request, a never-ending response body, a response
above the configured byte ceiling, missing resource hash/size metadata, a
generated resource absent from the attested core inventory, symlinks, and a
same-looking redirect whose final origin or pathname is not the requested one.

- [ ] **Step 2: Write fail-before-write capture tests**

Create an existing PNG and evidence JSON, return a different release from the fake endpoint, run capture, and assert both files retain their original hashes.

- [ ] **Step 3: Run capture tests and confirm RED**

Run: `rtk npm exec -- vitest run scripts/release/publicReleaseIdentity.test.ts scripts/release/captureContestEvidence.test.ts scripts/release/validateContestEvidenceManifest.test.ts`

Expected: FAIL because capture trusts `--commit` and has no observed identity.

- [ ] **Step 4: Implement the bounded endpoint probe**

Fetch configured `version.json`, `artifact-manifest.json`,
`envelope-manifest.json`, `deployment-config.json`, every attested core payload,
`data/v1/manifest.json`, and every generated resource. Use an abortable timeout
for both headers and streaming bodies and a bounded response-size ceiling (16
MiB maximum, lower values injectable in tests). Require HTTP 200 and JSON media
types where appropriate, validate the deployment envelope identity, hash exact
bytes, require resource `sha256` and byte metadata, bind every resource to the
attested core inventory, derive one snapshot from every resource path, and
reject any redirect/final URL with a different origin, pathname, query, or
fragment.

- [ ] **Step 5: Refactor capture into preflight and atomic write phases**

Before launching Chromium, compare expected identity with the canonical probe.
Resolve every manifest and image path from an explicit repository root, require
that its real path remains below the declared output directory, and reject
symlinks, traversal, backslashes, encoded traversal, duplicate canonical paths,
non-regular files, and output-directory aliases. Buffer every PNG and the
complete new JSON in an invocation-specific temporary directory below the safe
parent. Rename into place only after every page, Axe, diagnostics, inventory,
and hash check succeeds; clean only that invocation's temporary files.
Production capture must derive its expected identity and publication metadata
from the verified Task 5 attestation; injectable identities remain test-only.
Treat a page that remains `[aria-busy="true"]` after the bounded wait as a hard
failure. Rollback must reject symlinked existing targets before restoring them.

- [ ] **Step 6: Migrate the evidence manifest to schema 2**

```ts
export interface ContestEvidenceManifestV2 {
  schemaVersion: "2.0.0";
  state: "pending" | "captured";
  freezeRequired: true;
  outputDirectory: "docs/contest/evidence";
  expectedIdentity: DeploymentEnvelopeIdentity;
  observedIdentity: (DeploymentEnvelopeIdentity & {
    canonicalRootUrl: string;
    observedAt: string;
  }) | null;
  captures: Array<{
    evidenceId: string;
    route: string;
    viewport: { width: number; height: number };
    outputFile: string;
    sha256: string | null;
    capturedAt: string | null;
    requiredVisible: RequiredVisible[];
    claimIds: string[];
    freezeRequired: boolean;
    redactionRule: string;
  }>;
}
```

Preserve the existing capture contract for `freezeRequired`, `outputDirectory`, `requiredVisible`, `claimIds`, per-capture `freezeRequired`, and `redactionRule`. Remove only per-capture `localCommitSha` and `deployedCommitSha`; the single top-level observed identity replaces them.

For the checked-in unpublished candidate, write `state: "pending"`, bind
`expectedIdentity` to the Task 5 attestation, set `observedIdentity: null`, and
set every new-candidate `sha256`/`capturedAt` to `null`. Preserve the existing 13
capture definitions and legacy PNG files, but do not present their hashes or
identity as evidence for the new candidate. Only a successful atomic live
capture may write `state: "captured"` and non-null observed fields.

Require strict UTC RFC 3339 timestamps ending in `Z`; reject equivalent
`Date.parse` aliases such as `+00:00`. Validation must load and fully validate
the capture manifest, claim ledger, freeze marker and every declared screenshot
from the same repository root before release evidence may rely on
`observedIdentity`.

- [ ] **Step 7: Verify GREEN**

Run:

```text
rtk npm exec -- vitest run scripts/release/publicReleaseIdentity.test.ts scripts/release/captureContestEvidence.test.ts scripts/release/validateContestEvidenceManifest.test.ts
rtk npm run typecheck
```

Expected: pending local evidence validates without claiming a capture; mismatch
stops before any evidence write; one observed identity governs all captured
items; all public bytes are bounded and inventory-bound; root escape, symlink,
partial manifest, timestamp alias, or hash mismatch fails.

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

Also prove that `pending` rejects verified deployment observations, timestamps
must be strict UTC RFC 3339 ending in `Z`, changed paths are unique canonical
POSIX repository paths (no traversal, backslashes, percent-encoded aliases or
duplicates), capture observation cannot predate VPS observation, and live
verification rejects a partial, symlinked, root-escaping, or hash-invalid
capture manifest or screenshot.

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

All timestamps are strict UTC RFC 3339 values ending in `Z`. Normalize no Git
path: reject any noncanonical spelling before applying the allowlist, and reject
duplicates after validation. A `pending` record contains no verified deployment
observation. Live verification calls the complete Task 6 capture validator from
the repository root, requires `state: "captured"`, and then requires capture
time to be at or after the canonical VPS deployment observation. Offline
pending validation accepts only the Task 6 `pending` shape and must not infer
evidence from legacy PNG files.

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

Expected: offline pending record passes structural checks; any offline verified
record, verified observation hidden in pending state, path alias, incomplete or
symlinked capture evidence, non-UTC timestamp, or invalid event ordering fails.

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

Preserve or strengthen the POSIX remote lock, nonce-scoped staging,
no-clobber, bounded cleanup and path-prefix checks in both POSIX and PowerShell.
Require non-interactive SSH options (`BatchMode=yes`, `IdentitiesOnly=yes`) and
a caller-provided pinned `known_hosts` file; never disable host-key checking.
Reject fixed/shared temporary archive names, existing release directories,
unsafe retention targets and a post-switch verification failure. Retention is
exactly the active `current` target plus the two most recent previous releases.

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
