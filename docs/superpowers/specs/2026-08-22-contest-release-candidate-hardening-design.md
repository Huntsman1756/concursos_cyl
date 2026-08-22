# Contest Release and Candidate Hardening Design

**Date:** 2026-08-22  
**Status:** Approved in chat; rebased onto the current product baseline  
**Canonical URL:** `https://salida-cyl.157-90-22-40.sslip.io/`  
**Fallback URL:** `https://huntsman1756.github.io/concursos_cyl/`

## Purpose

SALIDA CyL needs a candidate release whose public application, data freeze,
deployment record, screenshots, and submission documents identify the same
release. The current public product is internally consistent under the legacy
schema, but that schema still couples product commits, evidence commits, and
deployment claims. A documentation-only push can therefore create a new build
identity even when the product data did not change.

This design fixes that release-identity loop, centralizes the provisional
canonical URL, and tightens the contest evidence. Product improvements will use
separate specifications and candidate releases. This design does not submit the
application, buy a domain, invent impact claims, or broaden the data scope to
improve a headline count.

## Rebased baseline and current facts

- The VPS is the provisional canonical URL. GitHub Pages is a fallback.
- This hardening work is rebased on `main` commit
  `f78d4a258e589106eef3e974bcabd6f7e11ed936`. Earlier implementation commits
  based on `085faca…` are design inputs only and must be ported and retested;
  they are never cherry-picked blindly over the current product.
- The public VPS serves product commit
  `ae66d5bc8393dbb02818471ad7eb850e4d4367de` under the legacy release identity.
- The authoritative candidate input snapshot is
  `20260822085631889-7bbe69380f6d`; its manifest SHA-256 is
  `92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18`.
- The manifest contains exactly 21 resources. `sepeOccupationMarket` is a
  canonical 116-record complementary state-source resource with resource
  SHA-256 `5adf3bfaff153b5d7739a58805284e8f3c88361804507e52ddbd195e0883e323`.
- The current freeze records 264 approved relations, 113 distinct
  qualifications, 130 qualification/modality keys, 131 occupations, 21
  approved aliases, 3 matched relations, 261 zero-reviewed relations, and 38
  matched offers. These are preservation floors for the schema migration.
- The legacy `release-evidence.json` correctly records the previously verified
  public product, but it is historical input. Migration to schema 2 starts the
  new, unpublished candidate at `pending`; it does not transplant the old
  `verified` state.
- A push to `main` always runs the Pages deployment and writes `github.sha` to
  `version.json`, including evidence-only commits.
- Runtime preparation reads contest evidence to decide which snapshots to keep,
  so evidence-only changes can also change the built artifact.
- The 2026 submission requires a public URL and a memory of at most 1,000 words.
- Products and Services has seven equally weighted criteria: utility, economic
  value, public or social value, originality, dataset variety, ease and
  accessibility, and technical quality.
- SEPE remains a complementary state source and does not increase the count of
  eight JCyL datasets. Its provenance and publisher terms must be represented
  independently from the JCyL licence inventory.

## Design principles

1. Build once and identify the resulting artifact, rather than treating every
   repository commit as a new product release.
2. Store data identity, artifact identity, deployment evidence, and evidence
   commit identity as separate fields.
3. Reject a stale verified claim. Do not silently reinterpret it as current.
4. Read public identity from the endpoint before capturing screenshots.
5. Keep evidence out of the runtime dependency graph.
6. Make the canonical URL replaceable through one configuration value.
7. Preserve the canonical SEPE evidence and reject stale experimental fixtures.
8. Add product features only when they improve a contest criterion or a real
   user decision.

## Release identity

### Publication configuration

A repository-level JSON configuration will define:

```json
{
  "schemaVersion": "1.0.0",
  "canonicalRootUrl": "https://salida-cyl.157-90-22-40.sslip.io/",
  "fallbackRootUrl": "https://huntsman1756.github.io/concursos_cyl/"
}
```

The renderer, capture command, deployment verification, canonical metadata,
Open Graph metadata, and contest documents will consume this configuration.
Production and release commands may not override these URLs. Tests may inject a
temporary configuration through function arguments. A future domain migration
changes `canonicalRootUrl` and regenerates dependent artifacts.

`canonicalRootUrl` is the single candidate URL value. `fallbackRootUrl` records
the non-canonical Pages endpoint and its `/concursos_cyl/` base path; no renderer
may substitute it for the candidate URL.

### Identity fields

The release model will keep these fields distinct:

- `releaseId`: immutable identifier for one built candidate artifact.
- `sourceCommitSha`: commit whose runtime inputs were built.
- `evidenceCommitSha`: later commit that records the observed evidence.
- `snapshotId`: published data snapshot.
- `manifestSha256`: SHA-256 of the exact public manifest bytes.
- `artifactSha256`: SHA-256 of the canonical runtime file inventory described
  below.
- `envelopeSha256`: deployment-specific digest for the small hosting wrapper
  used by Pages or VPS.
- `pagesWorkflowRunId`: successful Pages workflow that consumed the bundle.
- `vpsReleaseId`: VPS release directory or deployment identifier.
- `observedAt`: timestamp of the public verification.

`version.json` will expose `releaseId`, `sourceCommitSha`, `snapshotId`,
`manifestSha256`, `artifactSha256`, the deployment kind, and
`envelopeSha256`. It will not claim the commit that later records screenshots.
The definitive candidate is created after the Task 5 product/runtime commit;
later evidence, validation and workflow-only commits reuse that exact
attestation and product `sourceCommitSha`. They never rebuild identity from an
evidence commit. A later product/runtime edit instead starts a new candidate.

### Canonical artifact digest

Pages is hosted below `/concursos_cyl/` while the VPS is hosted below `/`, so
their entry HTML cannot be byte-identical. The shared candidate is therefore a
single compiled core plus a small deployment envelope. The core contains the
compiled JavaScript, CSS, images, and data. An envelope contains `index.html`,
the Pages `404.html` when needed, `version.json`, and deployment base metadata.

The build will generate `artifact-manifest.json` from every regular core file,
excluding `index.html`, `404.html`, `version.json`,
`deployment-config.json`, `artifact-manifest.json`, and
`envelope-manifest.json`. Each entry contains the
POSIX relative path, byte length, and SHA-256 of the exact file bytes.
Entries are sorted by UTF-8 path bytes. The file is serialized as UTF-8 JSON
with sorted object keys, no insignificant whitespace, and one trailing LF.
`artifactSha256` is the SHA-256 of those canonical manifest bytes.

After the core digest is known, the packaging step creates the Pages and VPS
envelopes from the same index template. Each envelope has a canonical manifest
and `envelopeSha256`. `version.json` records the shared identity and the current
envelope digest. Excluding envelope and identity files from the core prevents a
self-referential hash while binding every shared runtime payload file. A release
attestation stored beside the CI artifact records the core digest and both
envelope digests.

The Pages job verifies its envelope and the core inventory before upload. The
VPS deployment verifies its envelope and the same core inventory after
extraction against the remote filesystem. Live verification fetches the
identity files, checks the relevant envelope digest and critical resources, and
ties them to the build attestation. Pages and VPS evidence must report the same
`artifactSha256`; each must report the expected deployment-specific
`envelopeSha256`.

### Single deployment truth

`coverage-freeze.json` describes data and reviewed coverage. It will no longer
contain `deployment.status`.

`release-evidence.json` is the only deployment claim. Its top-level state is
`pending`, `structurally_valid`, or `verified`. Offline validation can produce
only `pending` or `structurally_valid`. `verified` requires
`verificationMode: "live"`, successful checks of both public deployments, and
the successful GitHub run API response or an equivalent trusted host
attestation kept outside the repository. The submission renderer treats only
`verified` as a current release.

The record contains `deployments.pages` and `deployments.vps`. Each deployment
stores its configured URL, `releaseId`, `sourceCommitSha`, `artifactSha256`,
`envelopeSha256`, `manifestSha256`, workflow run or VPS release ID, state, and
`observedAt`.
Both must be verified. The capture manifest refers explicitly to
`deployments.vps` as the canonical capture target.

Verified evidence must match the freeze, publication configuration, capture
manifest, build attestation, and observed public identity. A mismatch is an
error. The validator rejects a record produced by offline validation that
claims `verified`.

`evidenceCommitSha` must differ from `sourceCommitSha`, descend from it, and
change only the documented evidence allowlist. The source commit may never use
the evidence commit as a build input. Live verification confirms ancestry and
the evidence-only diff through the GitHub API.

The freeze schema becomes `2.0.0`. The parser rejects the old schema with a
message requiring a rebake; it never infers a deployment state from an old
`deployment` object. The migration covers `validateContestFreeze`, its exported
types, focused tests, freeze JSON, claim ledger, and generated documents.

## Build and deployment flow

### Runtime snapshot retention

The build will stop reading `release-evidence.json` to decide which snapshots
belong in `dist`. Snapshot retention will come from
`config/runtime-snapshot-retention.json`, validated by a dedicated schema and
generated before release evidence exists. The policy separates historical
snapshots that must remain immutable in the source tree from the narrower set
that is intentionally shipped in `dist`; the active manifest snapshot is
implicit in both paths. `scripts/release/prepareRuntimeData.ts` and the existing
`release:runtime-data` command consume only the runtime subset and the source
data tree, while `buildSnapshots.ts` consumes the source-retention subset.
Changing contest prose or screenshots must not change the runtime artifact.

### Candidate bundle

The release workflow will:

1. Resolve `sourceCommitSha` from the protected `main` ref or an approved
   `candidate-*` tag, check out that exact commit detached, require a clean
   worktree, and record its tree and lockfile hashes.
2. Run the complete release gates.
3. Build runtime data and the application once.
4. Write `version.json` with the approved release identity.
5. Create the deterministic core and compute `artifactSha256`.
6. Create and attest the Pages and VPS envelopes from that core.
7. Publish the core, both envelopes, canonical inventories, and attestation as
   one candidate release artifact.
8. Deploy the matching envelope plus the same core to Pages and VPS.
9. Verify both endpoints against the expected shared and envelope identities.

The source-tree hash is SHA-256 over the exact NUL-delimited bytes from
`git ls-tree -r -z --full-tree <sourceCommitSha>`. The lockfile hash is SHA-256
over the exact checked-out `package-lock.json` bytes. These algorithms are part
of the attestation contract rather than implementation-defined labels.

Evidence-only commits will run a separate validation workflow and will not
create a candidate artifact or deployment. The publication workflow uses an
explicit runtime-path allowlist and a manual candidate dispatch. A regression
test compares runtime digests before and after an evidence-only commit. Runtime
changes require an explicit new release.

The first implementation may introduce the strict evidence gate before the
shared-bundle deployment is operational. During that interval the public
release remains `pending`; no renderer may mark it verified.

Pages receives and verifies the candidate first. The VPS is staged in a new
release directory and switches its `current` symlink only after local and public
checks pass. If Pages fails, the VPS is not promoted. If VPS verification fails
after the switch, deployment restores the previous symlink. The previous two
candidate bundles remain available, and a manual rollback workflow redeploys an
existing `releaseId`; rollback never rebuilds from HEAD.

## Evidence capture and validation

Before writing a screenshot or capture record, the capture command hashes and
validates the exact Task 5 release attestation, then fetches
the canonical endpoint's `version.json` and manifest. It will compute the
manifest hash from the received bytes and compare the result with the expected
freeze and release identity.

An operator-supplied commit or release ID is an expectation, not evidence. If
the endpoint returns a different identity, capture stops without overwriting
the existing evidence.

The capture manifest validator will require:

- one release identity across every capture;
- one snapshot and manifest hash across every capture;
- screenshot hashes that match the files on disk;
- the configured canonical root URL;
- current capture time and the observed endpoint identity;
- no personal data or credentials in the declared capture context.

Schema 2 distinguishes `pending` from `captured`. A local, unpublished
candidate uses `pending`: it records the expected attested VPS identity and the
required capture definitions, but has `observedIdentity: null` and no screenshot
hash or capture timestamp. Only the atomic live capture command may transition
the manifest to `captured`, populate the observed public identity and hashes,
and make the new screenshots eligible for verified release evidence. Existing
legacy screenshots may remain as historical files, but they are not silently
relabelled as evidence for the new candidate.

Live verification must verify the referenced GitHub workflow's head SHA,
successful conclusion, active Pages deployment, configured URLs, and source
ancestry. Offline checks remain deterministic and validate recorded structure
and cross-file invariants, but cannot mark a release verified.

## Candidate data boundary

The candidate will describe the eight JCyL datasets already used by the product:

1. vocational training offer;
2. employment offers;
3. ECYL training;
4. professional certificates;
5. public employment calls;
6. provincial contracts;
7. municipalities;
8. education-centre directory.

CNO-11, BOE, INE, TodoFP, EDUCAbase, and other state sources remain clearly
labelled as complementary official sources. Their presence does not increase
the JCyL dataset count.

The current 116-record `sepeOccupationMarket` resource is part of the candidate.
It is kept as a complementary official state source, never counted as a JCyL
dataset. Its schema, 116 canonical CNO records, source authority, period,
resource hash, provenance, product UI, and freeze entry must remain mutually
consistent. A stale one-record fixture or a resource that cannot prove that
canonical boundary is rejected.

A candidate-resource allowlist will require the manifest, generated catalogue,
freeze, release evidence, claims, and built application to agree on the same
complete set of exactly 21 resource keys. The validator rejects an extra key, a
missing key, a duplicate key, the absence of `sepeOccupationMarket`, a stale
one-record SEPE payload, and SEPE metadata that contradicts the canonical
source contract.

The allowlist lives at `config/candidate-resource-allowlist.json`. The candidate
build validates that `public/data/v1/manifest.json`, its generated resource
catalogue, the freeze, UI bundle, rendered documents, and claims retain the
canonical SEPE resource without treating it as JCyL-owned or applying a JCyL or
MIT licence to its content. General INE or SEPE classification citations that
support reviewed mappings remain permitted with their original publisher terms.

The eight JCyL catalogue records are licensed under the catalogue-declared CC BY
4.0 ES terms. A licence inventory will record each dataset ID, `licenseName`,
and `licenseUrl` at `config/jcyl-license-inventory.json`. The licence gate will
validate that inventory against fixtures captured from the official metadata.
External certificate links hosted by SEPE, the canonical occupation-market
resource, and any BOE, INE, TodoFP, EDUCAbase, or other SEPE content retain
their own publisher terms and are not relicensed by the project under MIT or CC
BY. The 583-record JCyL professional-certificates dataset remains CC BY 4.0 ES;
its external `programUrl` and `structureUrl` targets do not inherit that licence.

## Submission package

### Memory

The memory will remain below 1,000 words and give each equally weighted
criterion its own section. It will:

- describe the user problem and two-way decision flow;
- make measured product claims and avoid claiming unmeasured time savings;
- state possible future sustainability paths such as paid deployment, support,
  white-label integration, or API services for centres, municipalities,
  orientation bodies, and employment organisations; it will not claim existing
  customers, agreements, revenue, adoption, or an operating API service;
- explain public value through traceability and access to official sources;
- distinguish SALIDA from the 2022 winner, “Oferta de Formación profesional de
  Castilla y León. Una alternativa atractiva y accesible con herramientas
  no-code”, by Laura Folgado Galache, using only facts documented on the official
  winners page;
- count the eight JCyL datasets accurately;
- describe tested accessibility and remaining manual checks;
- summarize technical quality without turning the memory into a runbook.

The memory will not quantify adoption, audience size, or time saved without
measured evidence. The 2025 winners may be named as precedents, but the memory
will not infer their scores or the jury's reasons beyond the official record.

### Claims and checklist

The claim ledger will use RFC 6901 JSON Pointer. Every claim declares its source
document, pointer, expected JSON type, and expected value or comparison rule.
Allowed roots are the validated freeze, release evidence, capture manifest,
publication configuration, and licence inventory. A gate will reject missing
references, wrong types, aliases of removed fields, and value mismatches.

The submission checklist will include author or representative, applicant type,
title, category, memory word count, public URL, originality and prior-award
declarations, confirmation that SALIDA is not an undeclared continuation or
resubmission of the 2022 project, eligibility declarations, consent, and
signature. Submission and identity fields remain human-only.

The privacy copy will say that SALIDA stores no searches, answers, or results.
It stores only the non-sensitive preferred search mode in `localStorage`.

## Follow-up product specifications

The searchable FP selector, province contract, printable orientation sheet,
guided example, contextual links, metadata, footer, and methodology onboarding
will each receive a separate specification or a deliberately grouped product
specification after this release work. They are not acceptance criteria for this
hardening change.

Every accepted product change creates a new `sourceCommitSha`, artifact,
deployment verification, and screenshot set. Product work cannot be merged into
an already verified candidate without invalidating that candidate.

## Work isolation and integration

The original checkout continues to receive parallel work and is not the
integration target for this effort. All changes for this design use the isolated
`codex/contest-hardening-current` worktree based on remote `main` commit
`f78d4a258e589106eef3e974bcabd6f7e11ed936`.

Parallel agents may implement independent release-hardening tasks only with
exact, disjoint allowed paths. Shared integration files such as `package.json`,
publication configuration, workflows, and submission renderers are reserved
for the primary integration branch. Every agent result receives an independent
diff review and fresh validation before acceptance.

No agent may deploy, push, submit the contest application, delete experimental
work, or approve its own change.

## Delivery sequence

1. Add the strict release-evidence validator and publication configuration.
2. Migrate the freeze schema, validator, types, tests, JSON, and generated
   documents to remove deployment state; old schemas fail deterministically or
   migrate explicitly to pending evidence.
3. Decouple runtime snapshot retention from contest evidence.
4. Build and verify one immutable candidate artifact locally for both envelopes.
5. Leave the new release evidence pending and prepare the exact publication and
   recapture handoff; deployment requires separate authorization.
6. Regenerate the submission package and verify the 1,000-word limit.
7. Correct source, licence, privacy, and precedent documentation.
8. Run unit, integration, end-to-end, accessibility, build, licence, format,
   and public-release verification.

## Acceptance criteria

- One configuration value controls the canonical URL everywhere in scope.
- The freeze has no independent deployment status.
- Offline validation cannot produce `verified` evidence.
- Verified evidence with a different release, artifact digest, snapshot,
  manifest hash, workflow run, or URL fails deterministically.
- Pages and VPS have separate verified deployment records and expose the same
  `releaseId`, `sourceCommitSha`, `artifactSha256`, and `manifestSha256`, plus
  their expected deployment-specific `envelopeSha256`.
- Captures cannot be written against a public identity different from the
  expected release.
- Evidence-only changes do not create a deployment or change the runtime
  artifact identity.
- VPS and Pages serve the same candidate release identity and manifest.
- The candidate preserves exactly 21 resources, including the canonical
  116-record SEPE resource, while counting exactly eight JCyL datasets and never
  reclassifying the state source.
- The schema migration preserves or improves the current coverage floors: 264
  approved relations, 113 qualifications, 130 modality keys, 131 occupations,
  21 aliases, and 38 matched offers.
- The memory is at most 1,000 words and covers all seven criteria.
- Claim references resolve against real JSON fields.
- The submission documents, freeze, release evidence, capture manifest, and
  public application identify the same candidate release.
- No existing user changes in the original checkout are overwritten.
