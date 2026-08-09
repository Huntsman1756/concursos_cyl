# FP One-Word Candidate Publication Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dispose every frozen one-word lexical match and, only if the strict audit passes, publish an explicit allowlist without enabling general one-word matching.

**Architecture:** A trusted validator reconstructs the 67 fixed offer/candidate identities from the pinned snapshot and compares them with a strict review artifact. Publication is a separate conditional layer: approved single tokens require an explicit policy field, exact audit parity, approved program links, zero non-target deltas, and standard generated-data publication.

**Tech Stack:** TypeScript 6, Zod 4, Vitest 4, existing curated mapping schemas, `offerMatching`, manifest-addressed JSON, standard snapshot builder, Markdown renderer.

## Global Constraints

- Base design: `docs/superpowers/specs/2026-08-09-salida-cyl-remaining-work-design.md`.
- Pinned input snapshot: `20260809014318761-5b22c488ce4b`, 1,077 job offers, SHA-256 `5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba`.
- Closed forms: `cocinero`, `cocineros`, `albañil`, `albañiles`, `encofradores` only.
- Expected lexical counts: 41, 24, 2; union 67.
- `Albañil-Conductor/a` identity `1285664848132` must remain explicit.
- Use strict normalized code-point ordering with `<`/`>` plus raw-string tiebreaker; no locale APIs.
- ArliAI is forbidden. A fresh trusted executor implements this plan and a fresh Sol reviewer checks every task.
- No production/curated/public/UI edit before Task 3's audit decision.
- If no form passes, Tasks 4–6 become an explicit no-publication terminal report rather than forced implementation.

---

### Task 1: Restore the trusted closed inventory and validator

**Files:**

- Create: `data/schemas/fpOneWordPublicationReview.ts`
- Create: `scripts/analysis/validateFpOneWordPublicationReview.ts`
- Create: `scripts/analysis/validateFpOneWordPublicationReview.test.ts`
- Create: `analysis/fp_one_word_publication_reviews.json`

**Interfaces:**

- Consumes: pinned snapshot bytes and the exact ID/title arrays preserved in commit `c5315ed`.
- Produces: `validateFpOneWordPublicationReview(rootDirectory)` and a strict 67-row audit artifact.

- [ ] **Step 1: Record provenance before research**

Create the ignored Task 1 report and record `startedAt`, `git rev-parse HEAD`, snapshot path/hash/count, commit `c5315ed`, and zero-diff baselines for `src`, `data/curated`, and `public`.

- [ ] **Step 2: Write the strict schema**

Define this exact shape with `.strict()` at every object:

```ts
const ReviewRowSchema = z.object({
  candidateId: z.enum(["cocinero-s", "albanil-es", "encofradores"]),
  form: z.enum([
    "cocinero",
    "cocineros",
    "albañil",
    "albañiles",
    "encofradores",
  ]),
  programKey: z.enum(["HOT01M", "EOC01M"]),
  occupationId: z.enum([
    "occupation:cno11:5110",
    "occupation:cno11:7111",
    "occupation:cno11:7121",
  ]),
  offerId: z.string().regex(/^\d+$/u),
  offerTitle: z.string().trim().min(1),
  disposition: z.enum(["accepted", "rejected", "needs_human_review"]),
  reasonCode: z.enum([
    "exact_occupation_title",
    "mixed_role",
    "contradictory_requirement",
    "degree_or_license_led",
    "outside_program_boundary",
    "insufficient_title_evidence",
  ]),
  rationale: z.string().trim().min(20).max(500),
  requirementQuotes: z.array(z.string().trim().min(3)).max(8),
});
```

Top-level fields are `schemaVersion`, `snapshotId`, `rows`, and `publicationDecision`. `publicationDecision` contains one entry per literal form with `status: accepted|rejected`, exact accepted/rejected offer IDs, and reason.

- [ ] **Step 3: Write RED validator tests**

Tests must fail for missing rows, extra rows, altered IDs/titles/forms/program/CNO, duplicate identities, non-locale ordering, unresolved `needs_human_review` in a terminal artifact, count drift, accepted/rejected list drift, missing `1285664848132`, changed snapshot bytes, and a hand-edited publication decision.

- [ ] **Step 4: Run RED**

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/validateFpOneWordPublicationReview.test.ts
```

Expected: FAIL resolving the missing validator or missing 67-row artifact.

- [ ] **Step 5: Implement deterministic reconstruction**

Read raw bytes, verify SHA before parsing, map strict `{id,title}`, normalize NFD/diacritics/lowercase/non-alphanumeric spaces, match padded whole tokens, sort with `<`/`>`, and compare exact reconstructed pairs against the 67 identities recovered from `c5315ed`. Do not import or adapt the rejected ArliAI module.

- [ ] **Step 6: Seed all rows as unresolved**

Write all 67 exact identities with `needs_human_review`, `insufficient_title_evidence`, an explicit rationale, and requirement quotes extracted from the same pinned offer payload. The validator accepts unresolved rows only with `--allow-in-progress`; default terminal validation rejects them.

- [ ] **Step 7: Run GREEN structural tests**

Run focused tests with `--allow-in-progress`, then lint, build, Prettier, and diff check.

- [ ] **Step 8: Commit**

```powershell
rtk git add data/schemas/fpOneWordPublicationReview.ts scripts/analysis/validateFpOneWordPublicationReview.ts scripts/analysis/validateFpOneWordPublicationReview.test.ts analysis/fp_one_word_publication_reviews.json
rtk git commit -m "test: lock FP one-word publication review"
```

### Task 2: Audit every lexical candidate

**Files:**

- Modify: `analysis/fp_one_word_publication_reviews.json`
- Create: `analysis/fp_one_word_publication_reviews.md`
- Create: `scripts/analysis/renderFpOneWordPublicationReview.ts`
- Test: `scripts/analysis/renderFpOneWordPublicationReview.test.ts`

**Interfaces:**

- Consumes: the exact 67 rows and existing approved HOT01M/EOC01M program–CNO evidence.
- Produces: terminal row dispositions and exact per-form precision/collision tables.

- [ ] **Step 1: Audit HOT01M rows 1–41 one by one**

For each offer, inspect title, requirements, functions, and conditions. Confirm CNO 5110/program relationship is already approved. Reject degree/license-led, ownership/supervisory, mixed occupation, or contradictory-requirement records. Never mark all repeated titles through a bulk replace without checking IDs.

- [ ] **Step 2: Audit EOC01M albañil rows 1–24 one by one**

Apply the same checks for CNO 7121. Review `1285664848132` separately and quote the exact combined-role wording in rationale and report.

- [ ] **Step 3: Audit EOC01M encofrador rows 1–2 one by one**

Confirm CNO 7111/program relationship and inspect requirements independently.

- [ ] **Step 4: Resolve every row**

Default validation must show zero `needs_human_review`. Accepted rows use `exact_occupation_title`; every rejection uses the narrowest other reason code and a specific rationale.

- [ ] **Step 5: Derive form decisions**

A form is publishable only if all known hits are semantically acceptable or every rejected hit is excluded by an existing unconditional product rule that is proven to run before inclusion. A proposed new offer-ID blacklist is forbidden. Any unresolved future collision risk is documented and may force rejection.

- [ ] **Step 6: Write report RED/GREEN tests**

The renderer reads only validated JSON and must show 67 total, each form's accepted/rejected counts, all rejected titles, `Albañil-Conductor/a`, zero/general-policy disclaimer, and conditional publish/no-publish decision. Exact checked Markdown bytes are enforced.

- [ ] **Step 7: Run terminal validation and independent review**

Run validator without `--allow-in-progress`, renderer check, focused tests, and request a fresh Sol source/semantics review. Any Important finding returns to the affected row; do not weaken the schema.

- [ ] **Step 8: Commit**

```powershell
rtk git add analysis/fp_one_word_publication_reviews.json analysis/fp_one_word_publication_reviews.md scripts/analysis/renderFpOneWordPublicationReview.ts scripts/analysis/renderFpOneWordPublicationReview.test.ts
rtk git commit -m "docs: audit FP one-word offer candidates"
```

### Task 3: Implement the bounded policy only when approved

**Files:**

- Modify: `data/schemas/curatedMappings.ts`
- Modify: `scripts/data/validateCuratedMappings.ts`
- Modify: `scripts/data/validateCuratedMappings.test.ts`
- Modify: `src/domain/offerMatching.ts`
- Modify: `src/domain/offerMatching.test.ts`
- Modify: `scripts/analysis/validateFpOneWordPublicationReview.ts`

**Interfaces:**

- Consumes: terminal accepted form decisions.
- Produces: optional `matchPolicy: "approved_single_token"` while unchanged aliases behave as `strict_multiword`.

- [ ] **Step 1: Apply the decision gate**

If every form is rejected, add a terminal no-publication test/report, skip Steps 2–7, commit `docs: close FP one-word publication review`, and proceed to Task 6. Otherwise continue only with accepted literal forms.

- [ ] **Step 2: Write schema RED tests**

Prove a one-word alias without `matchPolicy` fails; `approved_single_token` fails unless exact audit parity exists; multiword aliases remain valid without a new field; unknown policies fail.

- [ ] **Step 3: Write matcher RED tests**

Prove exact whole-token matching, no substrings/stemming, unconditional degree/license precedence, deduplication by offer ID rather than title, one result for equal titles with different IDs, and zero non-target program deltas.

- [ ] **Step 4: Implement minimal schema/runtime changes**

Make `matchPolicy` optional in the curated schema. Treat absence as `strict_multiword`. Permit a normalized single token only for `approved_single_token`, then require the validator to locate the exact accepted form and occupation in the terminal 67-row artifact.

- [ ] **Step 5: Preserve evidence identities**

Include `matchPolicy` in alias audit identity hashing so a policy change cannot reuse old evidence bytes.

- [ ] **Step 6: Run focused GREEN**

Run curated, matcher, publication-review, public-distribution, and existing official-alias-pass suites. The old alias report must remain historically correct.

- [ ] **Step 7: Independent review and commit**

Require fresh Sol spec then quality review. Commit only after no Critical/Important findings:

```powershell
rtk git add data/schemas/curatedMappings.ts scripts/data/validateCuratedMappings.ts scripts/data/validateCuratedMappings.test.ts src/domain/offerMatching.ts src/domain/offerMatching.test.ts scripts/analysis/validateFpOneWordPublicationReview.ts
rtk git commit -m "feat: allow audited single-token occupation aliases"
```

### Task 4: Integrate accepted curated aliases and recompute

**Files:**

- Modify conditionally: `data/curated/occupation-aliases.json`
- Modify: `scripts/analysis/validateFpOneWordPublicationReview.test.ts`
- Generated: `public/data/v1/manifest.json`
- Generated: one immutable `public/data/v1/snapshots/<id>/` directory

- [ ] **Step 1: Add exactly accepted forms**

Each record uses its audited occupation ID, `reviewStatus: approved`, `reviewedAt`, mapping version, and `matchPolicy: approved_single_token`. Add no rejected form.

- [ ] **Step 2: Prove parity before build**

Focused test compares normalized accepted form set exactly with curated one-word aliases; missing or extra records fail.

- [ ] **Step 3: Recompute in memory**

Assert exact accepted offer IDs, union, zero non-target deltas, and that equal titles retain distinct IDs.

- [ ] **Step 4: Run one standard data build**

Run `rtk npm run data:build` once after all curated edits. Record upstream counts, new snapshot ID, hashes, and retention changes. Do not format immutable generated payloads.

- [ ] **Step 5: Validate generated distribution**

Run manifest hashes, curated/public parity, runtime matching, historical pin retention, pilot validator, official alias validator, and publication review.

- [ ] **Step 6: Commit atomically**

Stage curated alias, manifest, complete generated snapshot directory, and owned tests together. Commit `feat: publish audited FP single-token aliases`.

### Task 5: Update public behavior and methodology evidence

**Files:**

- Modify only if counts changed: `src/features/training-first/TrainingResultsPage.test.tsx`
- Modify only if copy is needed: `src/features/methodology/MethodologyPage.tsx`
- Modify: `src/features/methodology/MethodologyPage.test.tsx`
- Create: `tests/e2e/fp-one-word-publication.spec.ts`

- [ ] **Step 1: Write manifest-addressed component assertions**

Derive exact HOT01M/EOC01M counts from the frozen manifest. Assert zero/unavailable text disappears only where actual matches exist; never hard-code the old 67 ceiling as coverage.

- [ ] **Step 2: Add methodology limitation**

Explain literal audited single-token allowlisting, no stemming/fuzzy inference, snapshot dependence, and per-offer collision review. If no form published, explain the rejected experiment instead.

- [ ] **Step 3: Add desktop/mobile journeys**

Cover HOT01M, EOC01M, matched offer IDs/counts, Axe serious/critical zero, no overflow at 360px, and honest terminology.

- [ ] **Step 4: Run GREEN and commit**

Run focused component/E2E tests, build, lint, Prettier, diff. Commit `docs: explain bounded FP title matching`.

### Task 6: Terminal review and handoff to coverage expansion

- [ ] Run full Vitest serial with CI margins only where already established.
- [ ] Run full Playwright desktop/mobile.
- [ ] Run lint, build, license, global format, all analysis validators/report checks, public distribution, and diff check.
- [ ] Prove no unplanned forms, programs, occupations, or aliases changed.
- [ ] Record final accepted/rejected counts, actual new coverage union, active/wall/reviewer time, correction rounds, and commit SHAs.
- [ ] Obtain two fresh Sol reviews over the complete range.
- [ ] Produce the Gate 1 terminal commit and notify Track A2/Track B without changing submission figures yet.

## Appendix: exact 67-row human review checklist

Each checkbox is one required review action. Mark it only after the JSON row contains title/requirements/functions inspection, disposition, reason code, and specific rationale.

### `cocinero-s` (41)

- [ ] `1285614233577` — COCINEROS, EN GENERAL
- [ ] `1285626761329` — COCINEROS, EN GENERAL
- [ ] `1285627823296` — COCINEROS, EN GENERAL
- [ ] `1285637347955` — COCINEROS, EN GENERAL
- [ ] `1285639495437` — COCINEROS, EN GENERAL
- [ ] `1285640091376` — COCINEROS, EN GENERAL
- [ ] `1285640170324` — COCINEROS, EN GENERAL
- [ ] `1285645512831` — COCINEROS, EN GENERAL
- [ ] `1285655155784` — COCINEROS, EN GENERAL
- [ ] `1285659376390` — COCINEROS, EN GENERAL
- [ ] `1285659956971` — COCINEROS, EN GENERAL
- [ ] `1285660807038` — COCINEROS, EN GENERAL
- [ ] `1285662378630` — COCINEROS, EN GENERAL
- [ ] `1285663812475` — COCINEROS, EN GENERAL
- [ ] `1285664451544` — COCINEROS, EN GENERAL
- [ ] `1285665562689` — COCINEROS, EN GENERAL
- [ ] `1285665634431` — COCINEROS, EN GENERAL
- [ ] `1285665790208` — COCINEROS, EN GENERAL
- [ ] `1285666442607` — COCINEROS, EN GENERAL
- [ ] `1285666499205` — COCINEROS, EN GENERAL
- [ ] `1285666617717` — COCINEROS, EN GENERAL
- [ ] `1285666617827` — COCINEROS, EN GENERAL
- [ ] `1285666878773` — COCINEROS, EN GENERAL
- [ ] `1285666909272` — COCINEROS, EN GENERAL
- [ ] `1285666909300` — COCINEROS, EN GENERAL
- [ ] `1285666999271` — COCINEROS, EN GENERAL
- [ ] `1285667211184` — COCINEROS, EN GENERAL
- [ ] `1285667333359` — COCINEROS, EN GENERAL
- [ ] `1285667333387` — COCINEROS, EN GENERAL
- [ ] `1285667926910` — COCINEROS, EN GENERAL
- [ ] `1285667926938` — COCINEROS, EN GENERAL
- [ ] `1285667926966` — COCINEROS, EN GENERAL
- [ ] `1285668256453` — COCINEROS, EN GENERAL
- [ ] `1285668323029` — COCINEROS, EN GENERAL
- [ ] `1285668911911` — COCINEROS, EN GENERAL
- [ ] `1285669059164` — COCINEROS, EN GENERAL
- [ ] `1285669380024` — COCINEROS, EN GENERAL
- [ ] `1285669380068` — COCINEROS, EN GENERAL
- [ ] `1285669482753` — COCINEROS, EN GENERAL
- [ ] `1285669506800` — Oficial de Oficios/Cocinero/a Pinche de cocina para Residencia Universitaria Duques de Soria (Soria)
- [ ] `1285669719137` — COCINEROS, EN GENERAL

### `albanil-es` (24)

- [ ] `1285613685343` — ALBAÑILES
- [ ] `1285614585114` — ALBAÑILES
- [ ] `1285658958752` — ALBAÑILES
- [ ] `1285662949857` — ALBAÑILES
- [ ] `1285663783370` — ALBAÑILES
- [ ] `1285663974168` — ALBAÑILES
- [ ] `1285664082111` — ALBAÑILES
- [ ] `1285664848132` — 3 Oficial/a Segunda Oficios (Especialidad Albañil-Conductor/a) para Ayto. de Palencia
- [ ] `1285664861533` — ALBAÑILES
- [ ] `1285665269105` — ALBAÑILES
- [ ] `1285665380724` — ALBAÑILES
- [ ] `1285665380790` — ALBAÑILES
- [ ] `1285665634810` — ALBAÑILES
- [ ] `1285667539516` — ALBAÑILES
- [ ] `1285667539544` — ALBAÑILES
- [ ] `1285667590834` — ALBAÑILES
- [ ] `1285667964750` — ALBAÑILES
- [ ] `1285668256677` — ALBAÑILES
- [ ] `1285668256705` — ALBAÑILES
- [ ] `1285668323262` — ALBAÑILES
- [ ] `1285668412750` — ALBAÑILES
- [ ] `1285668877598` — ALBAÑILES
- [ ] `1285669061589` — Albañil para reformas en Valladolid
- [ ] `1285669638729` — ALBAÑILES

### `encofradores` (2)

- [ ] `1285667539377` — ENCOFRADORES
- [ ] `1285668256621` — ENCOFRADORES
