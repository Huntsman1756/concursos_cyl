# Evidence-Conditioned FP Coverage to Twelve Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attempt seven additional distinct FP qualification reviews, using reserves when necessary, and freeze the truthful evidence-supported total without counting modalities twice.

**Architecture:** A deterministic shortlist separates candidate selection from regulatory curation. Each numbered slot is an independent, timeboxed audit with exact official-output/CNO evidence and in-memory coverage deltas. Curated changes accumulate but one standard snapshot publication occurs after the terminal set is independently reviewed.

**Tech Stack:** TypeScript/Zod/Vitest, existing FP pilot audit patterns, TodoFP/BOE/INE/SEPE official sources, curated mapping pipeline, manifest snapshots, Playwright.

## Global Constraints

- Start after the one-word plan reaches Gate 1; read-only shortlist research may overlap.
- Baseline is five distinct reviewed qualifications; IFC03S/IFC03SD count once.
- Target is up to seven additional distinct qualifications; evidence can stop the final number below 12.
- Every qualification gets at most 60 modeled active minutes before completed/deferred/discarded disposition.
- StartedAt is recorded before research, not after evidence is found.
- No title signal, family volume, or plausible wording is itself a CNO relationship.
- Exact TodoFP/BOE outputs and exact INE/SEPE classification boundaries are required.
- Modal variants may reuse a reviewed relationship only after exact qualification identity is proven; they never increase the distinct count.
- Do not run `data:build` per slot; use trusted in-memory overlays and publish once after terminal review.

---

### Task 1: Build and freeze the candidate ranking

**Files:**

- Create: `data/schemas/fpCoverageExpansion.ts`
- Create: `scripts/analysis/rankFpCoverageExpansionCandidates.ts`
- Create: `scripts/analysis/rankFpCoverageExpansionCandidates.test.ts`
- Create: `analysis/fp_coverage_expansion_candidates.json`
- Create: `analysis/fp_coverage_expansion_candidates.md`

**Interfaces:**

- Produces: seven ordered `primaryCandidates`, at least seven ordered `reserveCandidates`, and frozen scoring evidence.

- [ ] **Step 1: Define strict candidate schema**

Each candidate contains `rank`, `programKey`, `baseQualificationIdentity`, `programTitle`, `familyCode`, `level`, `familySignalCount`, `exactTitleSignalCount`, `officialOutputLabels`, `sourceUrls`, `classificationCandidates`, `collisionCount`, `sourceReadiness`, and `selectionReason`. Reject unknown fields and duplicate base qualifications.

- [ ] **Step 2: Write RED ranking tests**

Reject counting distance variants, already reviewed bases, COM01M without new evidence, unknown program keys, hand-entered scores, unstable locale ordering, fewer than 14 candidates, and missing Electricity/Electronics or Installation/Maintenance representation.

- [ ] **Step 3: Implement deterministic scoring**

Use this lexicographic score tuple, not a summed opaque score:

```ts
[
  sourceReadiness === "exact_program_to_cno" ? 0 : 1,
  collisionCount,
  -exactTitleSignalCount,
  -familySignalCount,
  programKey,
];
```

Sort with strict `<`/`>`. Program/title signals come from the corrected notebook/current manifest. Source readiness is `exact_program_to_cno | exact_output_plus_cno | output_only`; `output_only` may enter reserves but cannot complete without classification evidence.

- [ ] **Step 4: Generate and manually review shortlist**

Run the ranker, inspect all 14 rows, confirm official URLs resolve, and have Sol approve candidate order before any curation. The checked JSON is then immutable for this expansion wave.

- [ ] **Step 5: Render exact candidate report**

Report seven primary/seven reserve candidates, why modalities were collapsed, signal limitations, and selection tuple components. Byte-check Markdown.

- [ ] **Step 6: Commit**

Commit `docs: rank FP coverage expansion candidates` after focused tests, lint, build, format, diff, and independent review.

### Task 2: Add the shared expansion audit contract

**Files:**

- Create: `scripts/analysis/validateFpCoverageExpansion.ts`
- Create: `scripts/analysis/validateFpCoverageExpansion.test.ts`
- Create: `analysis/fp_coverage_expansion/README.md`

**Interfaces:**

- Consumes: frozen candidate ranking and current approved catalogs/links/aliases.
- Produces: `validateExpansionAttempt(root, programKey)` and terminal aggregate counts.

- [ ] **Step 1: Define attempt state machine**

States are `not_started`, `in_progress`, `completed`, `deferred`, `discarded`. Only `not_started→in_progress→terminal` is valid. Store startedAt/completedAt, modeled minutes, exclusion of reviewer time, evidence rows, accepted/rejected CNOs/aliases, baseline/current match IDs, limitation, and commit provenance.

- [ ] **Step 2: Require exhaustive official-output reviews**

Every exact TodoFP/BOE output appears once, in official order, with accepted/rejected disposition, candidate occupation IDs, exact output quote, classification evidence for accepts, and reason.

- [ ] **Step 3: Require public fail-closed parity**

Completed attempts equal their approved curated relations; deferred/discarded attempts publish none. Rejected occupations/aliases/links are absent from manifest-addressed public resources.

- [ ] **Step 4: Require deterministic deltas**

Load the frozen baseline offers and simulate accepted overlays. Store exact newly reached IDs per program and union; reject hand-entered counts and any non-target delta.

- [ ] **Step 5: Add adversarial RED/GREEN matrix**

Cover missing output, fake quote/domain, contradictory accepted/rejected IDs, broadened alias, one-word alias without approved policy, stale snapshot/hash, incomplete timing, modality double-count, public leak, and altered match ID.

- [ ] **Step 6: Commit**

Commit `test: add FP coverage expansion contract` with focused validator gates.

### Tasks 3–9: Execute primary/reserve review slots 1–7

Each slot is a separate agent task, report, review, and commit. Slot `N` consumes `primaryCandidates[N-1]`; if terminal state is deferred/discarded, it immediately consumes the next unused reserve without changing earlier ranks.

For **each** slot 1, 2, 3, 4, 5, 6, and 7, perform every checkbox:

- [ ] Record `startedAt` and transition only that attempt to `in_progress`; run validator.
- [ ] Open the exact TodoFP profile and BOE title/output source; record identity and every output in order.
- [ ] Open official INE CNO notes and qualification-specific SEPE evidence where available.
- [ ] Build candidate CNO boundary table: direct, indirect, contradictory, absent.
- [ ] Write focused RED test proving no approved relation exists yet for the slot program.
- [ ] Add strict attempt JSON with one disposition per official output.
- [ ] Add only exact official aliases that pass the existing policy or the separately approved bounded one-word policy.
- [ ] Add approved occupations/links to curated catalogs; keep rejected evidence only in analysis.
- [ ] Run in-memory overlay and record exact program/non-target deltas.
- [ ] Transition to `completed`, `deferred`, or `discarded` with completedAt after final local gates.
- [ ] Run expansion validator, curated validator, matcher/runtime tests, pilot/alias historical validators, lint, build, license, Prettier, and diff check.
- [ ] Verify earlier slot attempts are byte-identical.
- [ ] Commit `feat: review <PROGRAM_KEY> occupation coverage` (or `docs: defer <PROGRAM_KEY> occupation coverage`).
- [ ] Obtain fresh Sol spec and quality reviews; address findings in a separate narrow commit.
- [ ] Record active/wall/reviewer time and correction rounds in the ignored slot report.

Slot stop rule: at 60 modeled active minutes without exact relationship evidence, defer and use a reserve. Never extend by hiding research time.

### Task 10: Reconcile seven slots and distinct qualification count

**Files:**

- Create: `analysis/fp_coverage_expansion_results.json`
- Create: `analysis/fp_coverage_expansion_results.md`
- Create: `scripts/analysis/renderFpCoverageExpansionReport.ts`
- Test: `scripts/analysis/renderFpCoverageExpansionReport.test.ts`

- [ ] Recompute completed/deferred/discarded counts from attempt files.
- [ ] Collapse modality keys to `baseQualificationIdentity` and prove no double count.
- [ ] Report baseline 5 + newly completed distinct qualifications = truthful terminal total.
- [ ] Recompute exact per-program and union offer deltas.
- [ ] Include every attempted primary/reserve and its cost in denominator.
- [ ] State why the total is below 12 if evidence or reserves stopped work.
- [ ] Byte-check report and default validator against checked JSON.
- [ ] Obtain independent aggregate review and commit `docs: report FP coverage expansion`.

### Task 11: Publish the terminal curated state once

**Files:**

- Generated: `public/data/v1/manifest.json`
- Generated: one complete immutable snapshot directory
- Modify as required: snapshot retention/pin tests, exact public coverage tests

- [ ] Run full curated and expansion validation before network/data build.
- [ ] Run exactly one intentional `rtk npm run data:build` after all approved slot changes.
- [ ] Record upstream counts, generated snapshot ID, all resource hashes, retention changes, and last-known-good behavior.
- [ ] Assert manifest-addressed occupations/aliases/links/coverage exactly match completed attempts and contain none from terminal non-completions.
- [ ] Assert distinct qualification count separately from public modality-key count.
- [ ] Run full snapshot build/distribution tests and verify prior historical pins.
- [ ] Commit curated + manifest + complete snapshot atomically as `feat: publish expanded FP coverage`.

### Task 12: Coverage freeze and handoff

- [ ] Run full 54+ file Vitest suite with established CI margin/serial mode if Windows I/O requires it.
- [ ] Run full Playwright desktop/mobile, lint, build, license, global format, all analysis checks, Caddy verifier, and diff check.
- [ ] Obtain two fresh full-range Sol reviews.
- [ ] Create freeze record containing commit SHA, manifest generatedAt, resource paths/hashes/counts, distinct qualifications, modality keys, matched/zero/deferred counts, and live URL expected after deployment.
- [ ] Commit `docs: freeze contest FP coverage`.
- [ ] Notify Track B that final figures/screenshots may now be rendered; prohibit routine data refresh after this point.
