# Contest Release and Candidate Hardening Design

**Date:** 2026-08-22  
**Status:** Approved in chat; awaiting review of this written specification  
**Canonical URL:** `https://salida-cyl.157-90-22-40.sslip.io/`  
**Fallback URL:** `https://huntsman1756.github.io/concursos_cyl/`

## Purpose

SALIDA CyL needs a candidate release whose public application, data freeze,
deployment record, screenshots, and submission documents identify the same
release. The public endpoints and primary snapshot are internally consistent,
but the release evidence, freeze metadata, and resource inventory still
disagree. The deployment record identifies commit `05407a0…` while the VPS and
GitHub Pages serve `085faca…`. A documentation commit triggered a new build and
changed `version.json` even though the product data did not change.

This design fixes that release-identity loop, centralizes the provisional
canonical URL, and tightens the contest evidence. Product improvements will use
separate specifications and candidate releases. This design does not submit the
application, buy a domain, invent impact claims, or broaden the data scope to
improve a headline count.

## Current facts

- The VPS is the provisional canonical URL. GitHub Pages is a fallback.
- Both public endpoints served commit `085faca66dee67b9f2ca56aed11d32e0522eeb97`
  and snapshot `20260822021233066-9d8fa948959b` during the audit.
- The corresponding manifest SHA-256 was
  `ce47c7cf7011a3dcebddf2a3dac01c3e34ee175a18ac133211b5b5ca3fb3ba11`.
- `release-evidence.json` still identified deployment commit `05407a0…`.
- A push to `main` always runs the Pages deployment and writes `github.sha` to
  `version.json`, including evidence-only commits.
- Runtime preparation reads contest evidence to decide which snapshots to keep,
  so evidence-only changes can also change the built artifact.
- The 2026 submission requires a public URL and a memory of at most 1,000 words.
- Products and Services has seven equally weighted criteria: utility, economic
  value, public or social value, originality, dataset variety, ease and
  accessibility, and technical quality.
- The remote product currently includes an experimental SEPE resource with one
  record. It is not a JCyL dataset and will not be part of the candidate release.

## Design principles

1. Build once and identify the resulting artifact, rather than treating every
   repository commit as a new product release.
2. Store data identity, artifact identity, deployment evidence, and evidence
   commit identity as separate fields.
3. Reject a stale verified claim. Do not silently reinterpret it as current.
4. Read public identity from the endpoint before capturing screenshots.
5. Keep evidence out of the runtime dependency graph.
6. Make the canonical URL replaceable through one configuration value.
7. Preserve useful experimental work without putting it in the candidate.
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
- `pagesWorkflowRunId`: successful Pages workflow that consumed the bundle.
- `vpsReleaseId`: VPS release directory or deployment identifier.
- `observedAt`: timestamp of the public verification.

`version.json` will expose `releaseId`, `sourceCommitSha`, `snapshotId`,
`manifestSha256`, and `artifactSha256`. It will not claim the commit that later
records screenshots.

### Canonical artifact digest

The build will generate `artifact-manifest.json` from every regular file under
`dist`, except `version.json` and `artifact-manifest.json`. Each entry contains
the POSIX relative path, byte length, and SHA-256 of the exact file bytes.
Entries are sorted by UTF-8 path bytes. The file is serialized as UTF-8 JSON
with sorted object keys, no insignificant whitespace, and one trailing LF.
`artifactSha256` is the SHA-256 of those canonical manifest bytes.

After the digest is known, the build writes `version.json` and places both
identity files in the bundle. Excluding the two identity files prevents a
self-referential hash while still binding every runtime payload file. A release
attestation stored beside the CI artifact records the same digest.

The Pages job verifies the inventory before upload. The VPS deployment verifies
the inventory after extraction against the remote filesystem. Live verification
fetches both identity files, checks their digest and critical resources, and
ties them to the build attestation. Pages and VPS evidence must report the same
`artifactSha256`.

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
`manifestSha256`, workflow run or VPS release ID, state, and `observedAt`.
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
generated before release evidence exists. `scripts/release/prepareRuntimeData.ts`
and the existing `release:runtime-data` command will consume only this runtime
configuration and the source data tree. Changing contest prose or screenshots
must not change the runtime artifact.

### Candidate bundle

The release workflow will:

1. Resolve `sourceCommitSha` from the protected `main` ref or an approved
   `candidate-*` tag, check out that exact commit detached, require a clean
   worktree, and record its tree and lockfile hashes.
2. Run the complete release gates.
3. Build runtime data and the application once.
4. Write `version.json` with the approved release identity.
5. Create a deterministic bundle and compute `artifactSha256`.
6. Publish the bundle, canonical inventory, and attestation as the candidate
   artifact.
7. Deploy the same bundle to Pages and VPS.
8. Verify both endpoints against the expected identity.

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

Before writing a screenshot or capture record, the capture command will fetch
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

The one-record SEPE experiment will be excluded from the candidate artifact.
Omitting `sepeOccupationMarket` from the manifest is insufficient: the candidate
must also exclude the SEPE UI, loader, tests, claims, evidence references, and
runtime resource. Its code and research may remain on a separate branch or
behind a build-time boundary that cannot enter the candidate bundle.

A candidate-resource allowlist will require the manifest, freeze, and release
evidence to contain the same complete resource set. The validator rejects an
extra resource, a missing resource, or any SEPE claim in the candidate.

The allowlist lives at `config/candidate-resource-allowlist.json`. The candidate
build fails if `public/data/v1/manifest.json`, its generated resource catalogue,
the freeze, UI bundle, rendered documents, or claims expose
`sepeOccupationMarket` or the candidate-only SEPE market component. General
classification citations to INE or SEPE that support reviewed mappings are not
the excluded experiment and remain permitted with their original source terms.

The eight JCyL catalogue records are licensed under the catalogue-declared CC BY
4.0 ES terms. A licence inventory will record each dataset ID, `licenseName`,
and `licenseUrl` at `config/jcyl-license-inventory.json`. The licence gate will
validate that inventory against fixtures captured from the official metadata.
External certificate links
hosted by SEPE, and any BOE, INE, TodoFP, EDUCAbase, or SEPE content, retain
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

The original checkout is not a safe implementation target because its index and
working tree report hundreds of modifications from parallel work. All changes
for this design will use isolated worktrees based on the current remote `main`.

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
4. Build and deploy one immutable candidate artifact to both endpoints.
5. Recapture and record evidence from the canonical VPS.
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
  `releaseId`, `sourceCommitSha`, `artifactSha256`, and `manifestSha256`.
- Captures cannot be written against a public identity different from the
  expected release.
- Evidence-only changes do not create a deployment or change the runtime
  artifact identity.
- VPS and Pages serve the same candidate release identity and manifest.
- The candidate excludes the one-record SEPE experiment and counts eight JCyL
  datasets without reclassifying state sources.
- The memory is at most 1,000 words and covers all seven criteria.
- Claim references resolve against real JSON fields.
- The submission documents, freeze, release evidence, capture manifest, and
  public application identify the same candidate release.
- No existing user changes in the original checkout are overwritten.
