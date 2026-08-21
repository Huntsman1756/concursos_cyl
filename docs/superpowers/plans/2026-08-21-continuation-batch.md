# Continuation Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the approved mobile, runtime-loading, anonymous-pilot, FP-coverage, and deploy-staging work and deploy the verified branch without submitting the contest entry.

**Architecture:** Keep each outcome in a separate commit and preserve existing public contracts. Route loaders request typed subsets from the current manifest; pilot evidence is aggregate-only and fail-closed; FP publication uses official sources and the existing restore/freeze pipeline; deploy staging copies only contractually retained runtime data without deleting source snapshots.

**Tech Stack:** TypeScript 5, React, Zod, Vitest, Playwright, Vite, Node.js 24, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-21-continuation-batch-design.md`

## Global Constraints

- Keep `loadManifest()` at `cache: "no-store"`.
- Do not store participant-level data or fabricate pilot results.
- Publish FP mappings only from primary official evidence.
- Do not delete repository snapshots or break evidence-referenced snapshot URLs in staged deploy data.
- Do not contact third parties or submit the contest entry.
- Follow red-green TDD and commit each task independently.

---

### Task 1: Verify the committed mobile geometry fix

**Files:**

- Verify: `src/styles/global.css`
- Verify: `tests/e2e/home.spec.ts`
- Verify: `tests/e2e/occupation-first.spec.ts`

**Interfaces:**

- Consumes: existing `.site-nav`, `.site-footer`, `.training-page__header`, and `.occupation-options` selectors.
- Produces: mobile navigation without internal overflow, touch targets at least 40 px high, and an in-flow occupation listbox.

- [ ] Run `rtk npx prettier --check src/styles/global.css tests/e2e/home.spec.ts tests/e2e/occupation-first.spec.ts` and require exit 0.
- [ ] Run `rtk npx eslint tests/e2e/home.spec.ts tests/e2e/occupation-first.spec.ts` and require exit 0.
- [ ] Run `rtk npm run build` and require exit 0.
- [ ] Run `rtk npx playwright test tests/e2e/home.spec.ts tests/e2e/occupation-first.spec.ts --project=chromium-mobile` and require the geometry assertions to execute and pass.
- [ ] Inspect fresh 390×844 screenshots for wrapping, touch spacing, focus, and listbox flow; amend only with a new failing geometry assertion.

### Task 2: Add typed selective foundation loaders

**Files:**

- Modify: `src/data/generatedDataClient.ts`
- Modify: `src/data/generatedDataClient.test.ts`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/training-first/TrainingSearchPage.tsx`
- Modify: `src/features/training-first/TrainingRoutePage.tsx`
- Modify: `src/features/occupation-first/OccupationSearchPage.tsx`
- Modify: `src/features/occupation-first/OccupationResultsPage.tsx`
- Test: the corresponding page test files already colocated with these components.

**Interfaces:**

- Produces: `FoundationResourceKey`, `LoadedFoundationResourceSubset<K>`, and `loadFoundationResourceSubset<const K extends FoundationResourceKey>(manifest, keys)`.
- Preserves: `loadFoundationResources(manifest)` for consumers needing all four resources.

- [ ] Add failing client tests proving a `programs + trainingOfferings` subset makes exactly two requests, skips centers/job offers, and still identifies legacy payloads behind immutable paths.
- [ ] Run `rtk npm test -- src/data/generatedDataClient.test.ts` and confirm the new tests fail because the API is absent.
- [ ] Implement the generic subset loader with the existing current/legacy schemas and `manifestAddressedFoundationContract()` tie-breaker.
- [ ] Run the client tests and require them to pass.
- [ ] Add failing page tests asserting Home/Search request only programs, TrainingRoute skips job offers, OccupationSearch requests no foundation resource, and OccupationResults skips centers/job offers.
- [ ] Update the five call sites with exact key lists; leave TrainingResultsPage unchanged.
- [ ] Run the six focused suites and commit the loader task.

### Task 3: Add the anonymous aggregate pilot kit

**Files:**

- Create: `docs/pilot/anonymous-protocol.md`
- Create: `docs/pilot/anonymous-task-script.md`
- Create: `docs/pilot/anonymous-consent-template.md`
- Create: `scripts/pilot/anonymousPilotSchema.ts`
- Create: `scripts/pilot/validateAnonymousPilot.ts`
- Create: `scripts/pilot/validateAnonymousPilot.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces: `AnonymousPilotAggregateSchema` and `validateAnonymousPilotAggregate(value, { requireComplete })`.
- CLI: `tsx scripts/pilot/validateAnonymousPilot.ts --input <path> [--require-complete]`.

- [ ] Write failing tests for an empty draft, a complete aggregate, unknown/participant keys, PII patterns, minors, recording, task/count invariants, completion review gates, blockers, and missing files.
- [ ] Run `rtk npm test -- scripts/pilot/validateAnonymousPilot.test.ts` and confirm failures are caused by missing production modules.
- [ ] Implement strict Zod enums and aggregate invariants; scan leaf strings without printing the input.
- [ ] Write the adult-only protocol, five fixed tasks, and unsigned consent template; do not create a results file.
- [ ] Add `pilot:anonymous:test` and `pilot:anonymous:validate` scripts.
- [ ] Run the focused tests and commit the kit.

### Task 4: Publish the next evidence-backed FP batch

**Files:**

- Modify only after research: `data/curated/occupations.json`, `data/curated/training-occupation-links.json`, `analysis/fp_coverage_research_outcomes.json`, queue artifacts, restore script/tests, mapping tests, manifest/snapshot, freeze and rendered contest documents.
- Create: one dated evidence directory under `analysis/` with sources, proposals, and Frontier review.

**Interfaces:**

- Consumes: the current 57-item research queue and primary BOE/TodoFP/INE evidence.
- Produces: exact approved relationship keys or explicit `reviewed-no-publishable-match` outcomes bound to the occupation-catalog hash.

- [ ] Assign independent top-priority programs to read-only Luna Max researchers and require primary sources, candidate strength, and ambiguity notes.
- [ ] Frontier selects only unambiguous mappings and records rejected alternatives.
- [ ] Add exact failing mapping/outcome expectations and run them red.
- [ ] Add the minimal curated data/evidence and run focused mapping, graph, queue, and distribution tests green.
- [ ] Regenerate queue and snapshot, update the restore source commit/key list, rebake freeze and submission documents, then commit each reproducible boundary.

### Task 5: Stage only contractually retained runtime data

**Files:**

- Create: `scripts/release/prepareRuntimeData.ts`
- Create: `scripts/release/prepareRuntimeData.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-pages.yml`

**Interfaces:**

- CLI: `tsx scripts/release/prepareRuntimeData.ts --source public/data/v1 --destination <staging>/data/v1`.
- Produces: manifest, flat compatibility resources, active snapshot, and all snapshot IDs referenced by terminal evidence artifacts.

- [ ] Write failing fixture tests proving active/flat/referenced resources are retained, unreferenced history is omitted, traversal/symlink inputs fail closed, and source bytes are untouched.
- [ ] Run the focused test red.
- [ ] Implement deterministic copy-to-staging with a generated retention report and no source deletion.
- [ ] Integrate staging into Pages build before artifact upload and add a package check.
- [ ] Run focused tests, distribution validation against staging, and commit.

### Task 6: Whole-branch verification and deployment

**Files:**

- Modify only generated deployment evidence after observing successful remote state.

**Interfaces:**

- Consumes: all task commits.
- Produces: a reviewed branch, GitHub workflow result, GitHub Pages deployment, and VPS deployment at the exact verified commit.

- [ ] Run `rtk npm run format:check`, `rtk npm run lint`, `rtk npm test`, `rtk npm run build`, `rtk npm run contest:submission:check`, and Chromium E2E.
- [ ] Run a whole-branch code review against `main` and resolve Critical/Important findings.
- [ ] Push the feature branch, merge only after green CI, then verify `origin/main`, Pages, `/version.json`, manifest, and VPS report the same commit.
- [ ] Record deployment evidence without changing human approval flags or submitting the contest entry.
