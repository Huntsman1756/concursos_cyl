# SALIDA CyL Contest Submission Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare, verify, deploy, and present a truthful contest application pack while coverage work proceeds in parallel and final volatile evidence waits for the coverage freeze.

**Architecture:** Early tasks create invariant claims, source/license evidence, stable browser QA, and a screenshot specification without copying provisional coverage. After Track A freezes the manifest, deterministic renderers inject exact figures, evidence is captured, the reviewed commit is deployed, and the external submit action stops for human approval.

**Tech Stack:** Markdown/JSON claim ledger, TypeScript validators/renderers, Vitest, Testing Library, Playwright/Axe, Vite Pages base, GitHub Actions, Caddy verifier, GitHub Pages.

## Global Constraints

- Work in a Track B worktree from the final planning commit containing this plan suite and record Gate 0 provenance; the approved design itself was introduced by `c965278`.
- Do not edit Track A-owned analysis, curated mappings, matcher, schemas, or generated public data.
- Do not write final coverage numbers or capture final screenshots before the coverage freeze.
- Root URL only: `https://huntsman1756.github.io/concursos_cyl/`.
- Keep contribution-base evidence distinct from salary/employment claims.
- Keep Ministry EDUCAbase terms distinct from Junta dataset licensing.
- No accounts, cookies, analytics, or persistence claims unless verified in code/browser.
- External portal submission requires explicit user approval.

---

### Task 1: Create the contest claim and source ledger

**Files:**

- Create: `docs/contest/claim-ledger.json`
- Create: `docs/contest/source-ledger.md`
- Create: `scripts/release/validateContestClaims.ts`
- Test: `scripts/release/validateContestClaims.test.ts`

**Interfaces:**

- Produces: strict claims classified as invariant or freeze-derived, each tied to source/evidence.

- [ ] **Step 1: Define claim schema and write RED tests**

Each claim has `claimId`, `text`, `status: invariant|freeze_derived`, `evidenceType: source_url|manifest_field|test|workflow_run|human_confirmation`, `evidenceRef`, `allowedDocuments`, and `forbiddenParaphrases`. Reject unknown fields, duplicate IDs, missing evidence, provisional numeric text in freeze-derived claims, salary/employment misuse, and deep-link primary URLs.

- [ ] **Step 2: Populate invariant claims**

Include problem/audience, official-source boundaries, privacy, accessibility intent, income scope, CyL graduation-centre meaning, national cycle/group scope, no salary prediction, and root URL. Copy exact official URLs from current methodology/source contracts rather than memory.

- [ ] **Step 3: Create freeze-derived claim tokens**

Use symbolic evidence refs—not prose placeholders—for `manifest.snapshotId`, reviewed distinct qualifications, public modality keys, approved links/aliases, matched offer union, zero-result relationships, deferred programs, and deployment SHA/run.

- [ ] **Step 4: Add forbidden-claim scan**

Scan README, contest docs, methodology, and generated reports for `salario esperado`, unsupported employment rate, 67 as coverage, EDUCAbase CC BY, endorsement, or a deep route as submitted URL.

- [ ] **Step 5: Run focused GREEN and commit**

Run validator tests, existing methodology tests, license check, lint, Prettier, diff. Commit `docs: add contest claim ledger`.

### Task 2: Verify stable product journeys in parallel

**Files:**

- Create: `tests/e2e/contest-readiness.spec.ts`
- Modify only Track B-owned tests: `tests/e2e/release.spec.ts`, `tests/e2e/home.spec.ts`
- Create: `docs/contest/qa-matrix.md`

- [ ] **Step 1: Write desktop/360 RED assertions**

Cover root, `/desde-fp`, one reviewed cycle with matches, HOT/SSC/EOC honest zero state, COM deferred/unavailable state, `/comparar`, and `/metodologia`. Each route checks heading, loading completion, Axe serious/critical zero, document width, no broken resource requests, and no console errors.

- [ ] **Step 2: Preserve base-path/deep-link semantics**

Build with `/concursos_cyl/`, prepare 404 fallback, and test direct route body loads SPA assets. The application form still receives the root URL.

- [ ] **Step 3: Verify privacy behavior**

Browser assertions prove no cookies, local/session storage, analytics request, account UI, or third-party tracking endpoint appears during representative journeys.

- [ ] **Step 4: Write QA matrix**

Record route, viewport, expected state, test name, evidence type, and whether its content is invariant or must be rerun after freeze.

- [ ] **Step 5: Run focused GREEN and commit**

Run new E2E desktop/mobile plus existing release/home suites, build, lint, Prettier, diff. Commit `test: add contest readiness journeys`.

### Task 3: Specify final evidence capture without taking provisional screenshots

**Files:**

- Create: `docs/contest/evidence-capture.json`
- Create: `docs/contest/evidence-capture.md`
- Create: `scripts/release/validateContestEvidenceManifest.ts`
- Test: `scripts/release/validateContestEvidenceManifest.test.ts`

- [ ] Define strict capture entries with `evidenceId`, route, viewport 1440x900 or 360x800, required visible text/role, claim IDs, output filename, freezeRequired, and privacy redaction rule.
- [ ] Require captures for home, FP pre-search reviewed/unavailable status, matched FP result, zero/deferred result, comparison dual scopes, methodology sources/limitations, mobile home, and mobile comparison.
- [ ] Reject an output file that already exists while `freezeRequired` is true and no freeze record is present.
- [ ] Require filenames under `docs/contest/evidence/` and no user profile, browser account, API key, local filesystem path, or portal secret.
- [ ] Render a human capture checklist from validated JSON.
- [ ] Run focused tests/format/diff and commit `docs: specify contest evidence capture`.

### Task 4: Synchronize with the coverage freeze

**Files:**

- Create: `docs/contest/coverage-freeze.json`
- Create: `scripts/release/validateContestFreeze.ts`
- Test: `scripts/release/validateContestFreeze.test.ts`

- [ ] Wait for Track A's `docs: freeze contest FP coverage` commit; do not synthesize it in Track B.
- [ ] Merge/rebase the exact freeze commit and record merge base/range.
- [ ] Parse manifest and Track A terminal reports; store exact commit SHA, generatedAt, resource paths/hashes/counts, distinct qualification count, modality-key count, matched/zero/deferred totals.
- [ ] Recompute every value; default validation byte-compares checked JSON with recomputation.
- [ ] Prove no source/public data changed after freeze and no routine data build runs in later tasks.
- [ ] Run claim-ledger validation so every freeze-derived claim now resolves.
- [ ] Commit `docs: synchronize contest coverage freeze`.

### Task 5: Render the final application pack

**Files:**

- Create: `docs/contest/application-summary.md`
- Create: `docs/contest/technical-evidence.md`
- Create: `docs/contest/limitations.md`
- Create: `docs/contest/submission-checklist.md`
- Create: `scripts/release/renderContestSubmission.ts`
- Test: `scripts/release/renderContestSubmission.test.ts`

- [ ] Write RED exact-byte renderer tests using claim ledger and freeze JSON only.
- [ ] Render concise problem/audience/solution narrative without referring to an academic project or “qué estudio”.
- [ ] Render exact data/source/license/privacy/accessibility/deployment evidence.
- [ ] Render coverage with distinct qualifications separate from modality keys, matched offers separate from zero-result reviewed relationships, and deferred programs explicit.
- [ ] Render limitations: snapshot dates, terminology coverage, no inferred salary/employment, contribution-base population, GitHub Pages fallback, evidence-conditioned target.
- [ ] Include reproducible commands and exact deployed commit/run fields.
- [ ] Add human checklist fields for official contest title, category, applicant identity, contact, declarations, attachments, root URL, and final consent; never invent values absent from repository/user input.
- [ ] Reject extra newline/CRLF/stale values and forbidden claims.
- [ ] Run report check twice for byte stability, focused tests, format/diff, and commit `docs: render contest submission pack`.

### Task 6: Capture final desktop/mobile evidence

**Files:**

- Create generated evidence under: `docs/contest/evidence/`
- Modify: `docs/contest/evidence-capture.json` with SHA-256, capturedAt, route, viewport, deployed/local commit

- [ ] Build the exact freeze commit with Pages base and serve it locally.
- [ ] Execute every validated capture entry using browser automation; no manual cropping or content edits.
- [ ] Inspect each image for loading states, clipping, personal data, browser chrome, stale counts, and misleading empty states.
- [ ] Run Axe and overflow checks in the same route/viewport session.
- [ ] Hash each original image and add immutable provenance.
- [ ] Validate all required captures exist exactly once and no unexpected file exists.
- [ ] Have a fresh reviewer compare images against claims/freeze data.
- [ ] Commit `docs: capture contest product evidence`.

### Task 7: Run final release, deploy, and verify live

**Files:**

- Modify only if a gate proves necessary: freeze-owned `README.md`, `docs/deployment.md`, workflow/release tests
- Create: `docs/contest/release-evidence.json`

- [ ] Run `CI=true` full Vitest serial and record 0 failures.
- [ ] Run full Playwright desktop/mobile and record exact count.
- [ ] Run lint, build, license, global Prettier, all pilot/alias/expansion/publication validators and report checks, data distribution tests, Caddy verifier, actionlint, and diff check.
- [ ] Build Pages with `VITE_PUBLIC_BASE_PATH=/concursos_cyl/`; verify byte-identical 404 fallback and base-prefixed assets.
- [ ] Build pinned Docker image and run real Caddy SPA/header/manifest/outcome smoke.
- [ ] Obtain fresh final spec and quality reviews over the complete range.
- [ ] Push the exact reviewed branch; record commit and workflow run ID.
- [ ] Monitor one workflow to success; do not restart a healthy job.
- [ ] Verify live root HTTP 200/title, manifest hash, methodology, comparison, FP matched/zero/deferred routes, HTTPS, Pages workflow mode, and root URL.
- [ ] Write and validate release-evidence JSON; commit any evidence-only update and redeploy only if the documented SHA must be public.

### Task 8: Human approval and portal submission

- [ ] Present application summary, technical evidence, limitations, screenshots, release URL/SHA/run, and checklist to the user.
- [ ] Ask for missing human-only fields one at a time; never infer legal identity/contact/declarations.
- [ ] Require explicit approval of the final application text and root URL.
- [ ] Require separate explicit authorization immediately before the irreversible submit action.
- [ ] Submit through the official portal only after authorization.
- [ ] Record portal confirmation identifier, timestamp, submitted document hashes, and recovery/download location without exposing personal data in Git.
- [ ] Verify confirmation can be reopened/downloaded.
- [ ] Mark the master index complete and preserve the release branch/tag according to user instruction.
