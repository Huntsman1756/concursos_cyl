# SALIDA CyL FP Coverage Pilot Implementation Plan

> **Execution model:** use `superpowers:subagent-driven-development`. Sol orchestrates and reviews; a fresh Terra implementer executes each task sequentially.

**Goal:** Measure the real cost and success rate of extending the reviewed FP coverage beyond DAW, and publish only official, auditable mappings for five prioritized intermediate-level programs.

**Pilot programs:** `SAN21`, `HOT01M`, `SSC01M`, `EOC01M`, `COM01M`.

**Sequence after this plan:** use the observed completion rate, total elapsed effort and marginal offer coverage to choose the next coverage tranche. Only then execute `2026-08-04-salida-cyl-outcomes-release.md`, correcting its EDUCAbase source contract before implementation.

## Global Constraints

- Never mention or link the rejected external project/domain; SALIDA CyL is independently designed from official sources.
- Use authoritative primary sources only: TodoFP for program identity/profile, official CNO/SEPE material for occupations and Junta de Castilla y León datasets for centers/offers.
- A title similarity, keyword rule, model suggestion or market convention is never enough to approve a program–occupation relationship.
- If official evidence is absent, indirect or contradictory, record `deferred` or `discarded`; do not publish a guessed relationship.
- Preserve exact official program keys, occupation codes, source URLs, source review dates and reviewer state. Generated data fails closed.
- Do not weaken existing privacy: no accounts, cookies, analytics, storage, personal endpoints or query-string decision state.
- Code and technical identifiers are English. User-facing copy is concise Spanish.
- Use open-source dependencies only. Do not add a dependency unless existing platform capabilities are insufficient.
- Every shell command starts with `rtk`; production changes are test-first; every task ends in a focused commit and an independent Sol review.
- Do not edit unrelated files or replace user changes. Generated snapshots may change only through the existing build pipeline.

## Pilot evidence and measurement contract

Each attempted program records:

- exact program key, title, family and planned stratum;
- `startedAt`, `completedAt`, research, implementation, test and review elapsed minutes;
- final state: `completed`, `deferred` or `discarded`;
- accepted and rejected program–occupation relationships, each with a coded reason;
- authoritative source URLs and review dates;
- new snapshot offers reached by accepted relationships, with the counting method and snapshot ID;
- ambiguity notes that do not leak into public generated data.

Aggregate results report the observed fractions `x/5`, total effort across all attempts, cost per completed program and marginal offers reached per total hour. They must not claim a stable catalog-wide rate from five attempts.

### Task 0: Remove the rejected external-project association

**Files:**
- Modify: `docs/superpowers/specs/2026-08-04-salida-cyl-design.md`
- Modify: `research/salida-cyl-salary-sources-2026.md`
- Test: repository text scan

- [ ] Replace the two explicit comparison/attribution passages with source-first wording about SALIDA CyL and official EDUCAbase evidence.
- [ ] Preserve the ordinary Spanish phrase `qué estudios` in unrelated research; the gate targets the brand/domain, not normal language.
- [ ] Run `rtk rg -ni "que[-]estudio([.]es)?" . --glob "!node_modules/**" --glob "!.git/**"` and require zero matches.
- [ ] Run changed-file formatting/diff checks and commit `docs: remove unrelated project references`.

### Task 1: Add the pilot measurement and validation contract

**Files:**
- Create: `analysis/fp_coverage_pilot_results.json`
- Create: `scripts/analysis/validateFpCoveragePilot.ts`
- Create: `scripts/analysis/validateFpCoveragePilot.test.ts`
- Modify: `package.json`

- [ ] Write RED tests for the exact five keys, unique attempts, legal state transitions, non-negative phase minutes, completed-attempt evidence, rejected-link reasons and snapshot coverage provenance.
- [ ] Implement a fail-closed validator and `analysis:pilot:validate` command. Seed five `in_progress` attempts with start timestamps only; never pre-fill outcomes or invented effort.
- [ ] Test that `completed` requires at least one accepted official relationship and that `deferred`/`discarded` requires a coded ambiguity reason.
- [ ] Run focused tests, lint, build, license check and commit `test: add FP coverage pilot contract`.

### Task 2: Curate SAN21 — Cuidados Auxiliares de Enfermería

**Files:** existing curated occupation, alias, training-link and evidence files discovered by the implementer; pilot results; generated snapshots through the standard build only.

- [ ] Record the task start before research. Establish program identity from TodoFP and enumerate its official professional outcomes.
- [ ] Verify each proposed CNO relationship against official CNO/SEPE evidence. Record rejected candidates as well as accepted ones.
- [ ] Write a focused RED test proving the reviewed relationship is absent from public output before changing curated data.
- [ ] If evidence is sufficient, add only approved mappings/aliases/evidence and rebuild snapshots. Otherwise mark the attempt `deferred` or `discarded` without production mappings.
- [ ] Record phase effort, review metadata and marginal offer count using the current manifest-addressed snapshot.
- [ ] Run focused mapping/data/runtime tests plus pilot validation and commit `feat: review SAN21 occupation coverage`.

### Task 3: Curate HOT01M — Cocina y Gastronomía

Follow Task 2's evidence, RED/GREEN, fail-closed, measurement and verification procedure for `HOT01M`. Explicitly distinguish cook/kitchen roles from hospitality occupations not justified by the program profile. Commit `feat: review HOT01M occupation coverage`.

### Task 4: Curate SSC01M — Atención a Personas en Situación de Dependencia

Follow Task 2's procedure for `SSC01M`. Treat its multiple official profiles independently; do not collapse home care, institutional care, educational support, personal assistance and telecare into one guessed CNO. Commit `feat: review SSC01M occupation coverage`.

### Task 5: Curate EOC01M — Construcción

Follow Task 2's procedure for `EOC01M`. Separate program-supported construction trades from regulated, licensed, supervisory or university-led roles. Keep the pilot signal subordinate to its family total. Commit `feat: review EOC01M occupation coverage`.

### Task 6: Curate COM01M — Actividades Comerciales

Follow Task 2's procedure for `COM01M`. Treat sales, commerce, warehouse and logistics candidates separately; ambiguity is an expected valid result, never a reason to broaden keyword mappings. Commit `feat: review COM01M occupation coverage`.

### Task 7: Aggregate the pilot and expose truthful coverage

**Files:**
- Create: `analysis/fp_coverage_pilot_results.md`
- Modify: pilot JSON and validator tests
- Modify: home/search coverage components and tests only if generated approved coverage changed
- Add/modify: focused Playwright coverage test

- [ ] Close all five attempts and validate that elapsed phase totals include research, implementation, testing and independent review.
- [ ] Compute completed/deferred/discarded as observed counts, total effort, cost per completion and marginal offers per total hour. Avoid extrapolating a stable catalog rate.
- [ ] Generate a concise evidence-backed report explaining every non-completion and recommending the next coverage tranche from measured results.
- [ ] Verify the home and FP search reveal the exact reviewed coverage before search; an unsupported program must produce an explicit unavailable state, never silent failure.
- [ ] Run `analysis:pilot:validate`, all data validators, Vitest, Playwright desktop/mobile, lint, build, license, Prettier and `git diff --check`.
- [ ] Commit `docs: report FP coverage pilot results`.

### Task 8: Whole-pilot review and handoff

- [ ] Generate one branch review package from the pre-pilot base through Task 7.
- [ ] Have a fresh Sol reviewer verify evidence sufficiency, privacy, public coverage truthfulness, source provenance, test quality and all deferred findings.
- [ ] Route any Critical/Important finding through one Terra fix wave and one scoped Sol re-review.
- [ ] Push the reviewed branch to its configured upstream.
- [ ] Use the measured results to select the next coverage tranche before starting the outcomes/comparison plan.
