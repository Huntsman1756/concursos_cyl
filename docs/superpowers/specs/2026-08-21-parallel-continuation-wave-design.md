# Parallel Continuation Wave Design

**Date:** 2026-08-21

**Status:** Approved in chat; awaiting written-spec review

## Objective

Continue SALIDA CyL on three independent tracks: restore reproducible VPS
deployment from macOS, publish the next conservative FP-to-occupation evidence
wave, and reduce avoidable runtime and release overhead. Finish with local,
GitHub `main`, GitHub Pages, and the VPS serving one verified commit.

This wave does not run a human pilot, fabricate adoption evidence, complete
human-only contest fields, contact third parties, or submit the contest entry.

## Current baseline

- Local checkout, `origin/main`, and GitHub Pages serve commit
  `a8f279dfd863bbc7f72ed2efc33ee2d222b3d1ab`.
- The canonical VPS still serves
  `98632cc91d92ad59b1e8483fc2beae2694104bb9`.
- The Mac has no SSH identity accepted by `dani@157.90.22.40`; the repository
  and `github-pages` environment have no Actions secrets or variables.
- Coverage is 228 approved relation rows, 86 reviewed base qualifications,
  102 modality keys, 16 reviewed no-match bases, and 52 pending bases.
- The staged release contains 124 data files and 91,350,943 raw bytes, of
  which 49,647,353 bytes are reported as duplicate content. Nine historical
  snapshots are retained because the staging scanner treats bare IDs in
  research material as deployment references.
- `HomePage` requests the no-store manifest twice during one mount.
- The Pages workflow prepares runtime data once inside `npm run build` and a
  second time explicitly.

## Chosen approach

Use three disjoint implementation tracks and integrate them only after each
has its own red-green test cycle and commit.

1. **VPS access and cross-platform deployment:** create a dedicated SALIDA CyL
   SSH key on the Mac, have an already-authorized Windows/VPS operator append
   only its public key, and add a POSIX deployment script with the same atomic
   release contract as the existing PowerShell script. Do not store a private
   key in GitHub or the repository.
2. **Evidence-backed FP wave:** publish only the twelve modality-expanded rows
   accepted by Frontier for the next five queue bases, with seven missing CNO
   records added to the curated subset. Record rejected alternatives.
3. **Runtime and release efficiency:** coalesce the Home manifest request,
   narrow snapshot staging to explicit terminal public evidence, remove the
   duplicate staging step, and verify the live Pages deployment after publish.

The alternatives rejected for this wave are a GitHub Actions VPS private-key
secret and a VPS pull/webhook. Both add a new secret-bearing or host-resident
automation boundary before basic Mac SSH access has been restored.

## Track A: VPS access and deployment

### Identity bootstrap

Generate a new ED25519 identity at
`~/.ssh/salida_cyl_vps_ed25519` with a SALIDA-specific comment. The private key
never leaves the Mac and is never printed, committed, copied into Actions, or
passed to an agent. Print only the `.pub` content and its SHA-256 fingerprint.

The already-authorized operator appends that exact public key to the approved
account on `157.90.22.40`. After authorization, add a local-only SSH config
entry named `salida-cyl-vps` with explicit host, user, identity, and
`IdentitiesOnly yes`. A read-only preflight must prove access before any upload.

### POSIX deployment interface

Add `scripts/release/deployVps.sh` as the macOS/Linux counterpart to
`deployVps.ps1`. It accepts an optional SSH host and release ID, requires a
clean worktree and a 40-character HEAD SHA, builds with
`VITE_PUBLIC_BASE_PATH=/`, writes `dist/version.json`, packages only `dist`,
and uploads to a unique temporary archive.

Remote activation must:

1. create `/srv/salida-cyl/releases/<release-id>`;
2. extract and assign `caddy:caddy` ownership;
3. require `index.html` and `version.json` before activation;
4. switch `/srv/salida-cyl/current` atomically through `current.next`;
5. remove the uploaded archive;
6. retain the five newest release directories;
7. reload Caddy; and
8. run the existing live Caddy verifier with the expected SHA.

Local temporary archives must be removed on success or failure. The script may
not commit, push, alter SSH authorization, or upload repository metadata.

### Failure handling

- Missing authentication, a dirty tree, build failure, upload failure, or
  remote validation failure stops before changing `current` whenever possible.
- A failure after activation is reported with the exact release ID and current
  live SHA; it is not described as synchronized.
- No automatic fallback to another account, key, host, or Pages artifact is
  allowed.

## Track B: next FP coverage wave

### Accepted publication set

Add seven existing official CNO codes to `data/curated/occupations.json`:

- `3141`, `3316`, `3317`, `5931`, `5932`, `5993`, and `7403`.

Publish exactly these approved relation keys:

```text
QUI01E|3141
SAN01S|3317
SAN01SD|3317
SAN02S|3316
SAN02S|2640
SEA01M|5931
SEA01MD|5931
SEA01M|5932
SEA01MD|5932
SEA01M|5993
SEA01MD|5993
TMV03M|7403
```

Primary TodoFP outputs provide the program-side evidence. BOE CNO-11 and INE
notes provide the classification-side evidence. The review record must explain
why generic or adjacent codes were rejected, including `3314`, `3124`, `3315`,
`3510` for the dental sale, `5622`, `7401`, `3126`, `7521`, and `8321`.

No alias is added in this wave. Ambiguous management, military-emergency,
generic commercial, and generic machinery roles remain unpublished.

### Expected data boundary

After regeneration, expected counts are:

- approved relation rows: 240;
- reviewed base qualifications: 91;
- modality keys: 109;
- reviewed no-match bases: 16;
- pending bases: 47;
- aliases: 21.

Create a new immutable snapshot. Never mutate
`20260821162954121-087e3c5155c6`. Update the restore allowlist and pinned source
commit only after Frontier has reviewed the exact curated diff.

### Evidence artifacts

Create `analysis/fp_coverage_priority_20260821_wave2/` containing a README,
bounded batch contract, official-source notes, one proposal per base, and a
Frontier decision. Generated queue, outcome, graph, snapshot, freeze, contest
matrix, and rendered contest documents must be reproducible from the accepted
curated rows.

## Track C: product and release efficiency

### One Home manifest request

Refactor the two Home effects to share one no-store manifest request per mount.
The freshness, coverage, and search-data states retain independent failure
behavior: a coverage-resource failure must not hide search data, and a search
resource failure must not erase freshness. Unmount guards remain effective.

The `loadManifest()` contract itself remains `{ cache: "no-store" }`; this is
request coalescing inside one page lifecycle, not persistent manifest caching.

### Explicit snapshot retention

Replace repository-wide bare-ID scanning with a closed terminal-evidence
contract. Runtime staging always retains:

1. the single snapshot addressed by the current manifest;
2. snapshot resource paths in `docs/contest/coverage-freeze.json`; and
3. qualified `/data/v1/snapshots/<id>/<resource>` paths or canonical absolute
   URLs in `docs/contest/release-evidence.json`.

Bare IDs in `analysis/`, schemas, notebooks, historical markdown, source code,
or queue artifacts do not retain deployable bytes. Missing or malformed
configured evidence files fail closed. A referenced snapshot or resource that
does not exist also fails closed. Source bytes under `public/data` remain
untouched.

The current baseline should fall from nine staged snapshots to the active
snapshot plus the prior release-evidence snapshot. Exact byte savings are
measured after implementation and are not asserted in advance.

### Pages workflow verification

Remove the explicit second `npm run release:runtime-data` after `npm run build`.
Expose `steps.deployment.outputs.page_url` as a job output. A separate
least-privilege `verify-live` job, dependent on `deploy`, checks out the exact
run SHA, installs Node without rebuilding the application, and runs a repository
verifier against that output URL. It checks:

- root response and expected application title;
- `version.json` equals `${{ github.sha }}`;
- the manifest is valid and addresses one snapshot;
- every manifest resource resolves;
- a representative deep link returns the Pages SPA fallback body, accepting
  the host's 404-with-SPA contract; and
- no Caddy-only header assumption is applied to GitHub Pages.

Network propagation receives bounded retries with deterministic maximum time.
The deploy job fails if the live artifact does not match the run SHA.

## Integration and release evidence

The three implementation tracks use disjoint paths until the data regeneration
and final documentation boundary. Frontier reviews every agent diff and runs
focused tests before integration.

After all tracks are integrated:

1. regenerate data, freeze, and rendered contest documents;
2. run license, formatting, lint, full release tests, build, distribution,
   Chromium E2E, and Caddy container smoke checks;
3. push the feature branch and fast-forward `main` only if it remains an
   ancestor-safe update;
4. require a green Pages workflow and verify its live SHA;
5. deploy the same final commit to the VPS and verify its live SHA;
6. update `docs/contest/NEXT_SESSION.md` and release evidence with observed
   facts; and
7. keep all human approval flags false and leave submission unauthorized.

Release evidence may refer to the product commit it verifies even when the
evidence-only recording commit is later. It must distinguish Pages and VPS
observations and may not mark the release fully synchronized until both hosts
serve the same product SHA.

## Testing strategy

- Red-green unit tests for Home request count and independent error states.
- Red-green staging fixtures for active, terminal-evidence, bare historical ID,
  missing reference, malformed evidence, and source immutability cases.
- Red-green tests for the Pages live verifier and workflow ordering.
- Red-green mapping, restore, graph, queue, distribution, freeze, and rendered
  submission expectations for the exact twelve relation keys.
- Shell contract tests for clean-tree enforcement, archive contents, remote
  command ordering, five-release retention, cleanup, and verifier invocation.
- Full local release gates followed by the real remote workflow and live SHA
  checks. Agent reports are never accepted without independent Frontier tests.

## Security and privacy constraints

- No private key, credential, token, participant data, or consent material may
  enter the repository, logs, agent prompts, or telemetry.
- The new SSH key grants only the existing approved deployment account's
  permissions; this wave does not redesign VPS authorization.
- No contest submission, portal mutation, human identity completion, participant
  recruitment, recording, or public quote publication is authorized.
- Runtime V4 remains `ANALYSIS_ONLY`; no signed-provenance or REQUIRED claim is
  introduced.
