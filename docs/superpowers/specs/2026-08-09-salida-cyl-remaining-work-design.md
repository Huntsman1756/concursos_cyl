# SALIDA CyL Remaining Work Design

**Date:** 2026-08-09

**Status:** proposed for written review

## Goal

Finish the contest submission through two controlled parallel tracks: improve FP coverage only where official evidence supports it, while preparing the invariant submission and quality evidence. Synchronize both tracks at one coverage freeze before producing final figures, screenshots, release evidence, and application material.

## Current verified baseline

- Public application: `https://huntsman1756.github.io/concursos_cyl/`.
- Deployment workflow and live root are green; the submission must use the root URL rather than a deep link.
- Current manifest snapshot: `20260809014318761-5b22c488ce4b`.
- Public curated resources: 11 occupations, 20 aliases, 12 approved training–occupation links, and 209 coverage rows.
- Five distinct qualifications have reviewed occupational relationships: Desarrollo de Aplicaciones Web, Cuidados Auxiliares de Enfermería, Cocina y Gastronomía, Atención a Personas en Situación de Dependencia, and Construcción. The distance DAW key is public but does not count as a sixth distinct qualification.
- COM01M is truthfully deferred and uncovered.
- The official multiword alias pass accepted 10 aliases and rejected 44; it produced no new offers for HOT01M, SSC01M, or EOC01M.
- The trusted lexical inventory found 41 `cocinero(s)`, 24 `albañil(es)`, and 2 `encofradores` offer IDs, union 67. This is a lexical ceiling, not public coverage.
- The ArliAI implementation pilot was rejected after one correction. No delegated simulator remains in HEAD, and ArliAI is not an implementation route for the remaining contest work.
- The family-ranking contamination fix remains protected by an executable notebook test, including the SAN21 `AUXILIARES DE ENFERMERÍA` regression.

## Success definition

The work is complete when all of the following are true:

1. Every one of the 67 frozen lexical candidate identities has an auditable disposition; no count is accepted without exact IDs and titles.
2. Any published one-word behavior is explicitly allowlisted, source-backed, candidate-audited, collision-checked, program-link-scoped, and fail-closed. A general one-word policy is forbidden.
3. Coverage expansion attempts to reach 12 distinct reviewed qualifications, but only evidence-supported completions count. Distance or modality variants do not inflate the number.
4. Deferred or rejected candidates remain visible in machine-readable audit results but absent from public approved mappings.
5. The submission pack derives volatile counts from the frozen manifest and validated analysis artifacts rather than copying provisional figures by hand.
6. A final GitHub Pages deployment passes unit, browser, build, license, formatting, manifest integrity, container smoke, and live-root checks.
7. The official application uses the root URL and receives explicit human approval before any irreversible portal submission.

## Parallel architecture

### Track A — evidence and coverage

Track A owns research and product data behavior:

- `analysis/` FP audit artifacts and rendered reports;
- `scripts/analysis/` validators and renderers;
- `data/schemas/` curated mapping contracts;
- `data/curated/` occupations, aliases, and training links;
- `scripts/data/` curated validation and snapshot publication;
- `src/domain/offerMatching.ts` and its tests only if an approved bounded one-word policy requires it;
- generated `public/data/v1/` artifacts only through the standard pipeline;
- coverage-specific UI tests or copy only after exact public results exist.

Track A first disposes the 67 lexical candidates. Only then may it alter the one-word policy. It subsequently reviews new qualifications until seven additional distinct qualifications are completed or the evidence/time budget is exhausted. Each unsupported qualification is deferred; a reserve candidate replaces it without weakening evidence standards.

### Track B — submission readiness

Track B owns invariant delivery material:

- `docs/contest/` source inventory, claim ledger, submission checklist, and evidence index;
- deployment and methodology documentation that does not depend on final coverage counts;
- browser journeys for already stable routes and privacy/accessibility assertions;
- a capture manifest describing required final screenshots without taking provisional screenshots;
- application-field drafts that use renderer tokens for volatile values.

Track B must not edit curated mappings, matching logic, generated public data, FP analysis results, or provisional coverage numbers. It can verify the live application throughout the work, but final screenshots and numerical claims wait for the freeze.

### Shared-file rule

The tracks do not modify the same file concurrently. `package.json`, `README.md`, `src/features/methodology/MethodologyPage.tsx`, release workflows, and shared Playwright configuration are freeze-owned files. A task that needs one of them queues its patch for the next synchronization point rather than editing it from both tracks.

Parallel work should use separate named worktrees/branches. Track A merges first at the coverage freeze. Track B then rebases or merges that frozen state and renders final materials. No generated snapshot is cherry-picked independently from its manifest and complete resource directory.

## Synchronization gates

### Gate 0 — baseline lock

Both tracks record the same base commit, manifest path, current snapshot ID, resource hashes, reviewed qualification list, live URL, and workflow run. A mismatch stops parallel execution.

### Gate 1 — lexical publication decision

Track A produces an exact 67-row review and recomputation. For each proposed form, it reports accepted/rejected counts, collision classes, requirement conflicts, mixed-role titles, non-target program deltas, and current/future-policy limitations.

If no form achieves the strict publication contract, one-word publication stops and the result is documented. If forms pass, a separate schema/matcher task implements only those literal forms and proves no additional form is enabled.

### Gate 2 — coverage freeze

The freeze occurs after:

- the 67-row decision is complete;
- coverage expansion has completed seven evidence-supported qualifications or exhausted its approved time/reserve list;
- the standard data build is green and manifest integrity passes;
- every reviewed base qualification and modality count is derived and clearly separated;
- public results pages show honest matched, zero, unavailable, and deferred states.

After this gate, feature work and routine data refreshes stop. Only Critical or Important corrections may change product/data state, and any such correction invalidates final screenshots and numerical submission artifacts.

### Gate 3 — submission release

Track B consumes the frozen manifest and validated reports, writes final counts, captures desktop/mobile evidence, runs the complete release matrix, deploys the exact reviewed commit, verifies the live root, and presents the application pack for human approval.

## Bounded one-word publication policy

The existing multiword policy remains the default. A one-word alias may be approved only when all of these hold:

1. The literal form is one of `cocinero`, `cocineros`, `albañil`, `albañiles`, or `encofradores`; expanding this inventory requires a new design review.
2. The linked occupation and training-program relationship are already approved from primary official sources.
3. Every current snapshot hit has an explicit review disposition tied to offer ID and exact title.
4. Degree/license exclusions take unconditional precedence.
5. Mixed occupations, requirements that contradict the mapped occupation, and ambiguous municipal or combined roles are rejected rather than silently counted.
6. Simulation over every approved program proves zero unintended non-target delta.
7. Schema and runtime distinguish `strict_multiword` from `approved_single_token`; absence of the new policy means multiword behavior.
8. Public distribution validation recomputes the policy from audit artifacts; hand-edited aliases or counts fail.
9. Historical pilot and alias reports keep historical tense and are not rewritten as if the one-word results existed at their original snapshots.

The known `Albañil-Conductor/a` record must appear explicitly in the review/report regardless of disposition.

## Coverage-to-12 policy

- Baseline: five distinct reviewed qualifications.
- Target: up to seven additional distinct qualifications.
- Modalities such as distance reuse may be published when the official program relationship is identical, but do not count toward 12.
- Candidate selection uses the corrected family ranking, current title signals, official-output lexical correspondence, source availability, and collision risk. Family volume alone is insufficient.
- Electricity/Electronics and Installation/Maintenance enter the first shortlist because their occupational terminology is likely standardized, but no specific relationship is approved until official output and CNO evidence are audited.
- Each candidate receives at most 60 modeled active minutes before it is completed, deferred, or discarded. Wall-clock waiting and independent review time are recorded separately.
- A completed qualification requires exhaustive official-output audit, exact CNO boundary evidence, curated/public absence of rejected candidates, deterministic offer delta, tests, standard build, and independent review.
- When a candidate is deferred, the next approved reserve candidate is attempted. The process stops when 12 distinct completions are reached, the reserve list is exhausted, or the contest freeze date is reached.

## Submission pack

The submission pack contains:

- root production URL and exact deployed commit/workflow run;
- concise problem, audience, solution, and evidence narrative;
- data-source and license ledger with Ministry, Junta, INE, SEPE, TodoFP/BOE boundaries kept separate;
- privacy statement: no accounts, analytics, cookies, or browser persistence;
- accessibility/responsive evidence for home, FP search/results, comparison, and methodology;
- coverage statement distinguishing reviewed qualifications, modality keys, matched offers, zero-result relationships, deferred programs, and lexical experiments;
- limitations: snapshot dates, representativeness, official terminology coverage, contribution-base semantics, and GitHub Pages deep-link behavior;
- desktop and 360px screenshots captured only after coverage freeze;
- reproducible commands and green gate summary;
- human sign-off checklist for application fields and final submit action.

No document may call the 67 lexical ceiling public coverage, salary, all-graduate income, employment rate, or a guarantee. No deep route is used as the primary submitted URL.

## Error handling and stop conditions

- Official source unavailable or contradictory: defer; never infer.
- Snapshot source drift or unstable pagination: fail closed and preserve last-known-good publication.
- Curated/public/recomputed mismatch: stop before build or report rendering.
- One-word candidate collision or non-target delta: reject that form; do not add an exception silently.
- Coverage target not reached with evidence: publish the truthful final number and limitation.
- Track B detects a product/data issue: file a blocking finding for Track A; do not patch its owned files concurrently.
- Any final-deployment failure: do not submit; fix, rerun the complete matrix, redeploy, and recapture evidence.
- External application portal action: stop for explicit human approval.

## Testing strategy

Track A uses RED→GREEN tests for strict schemas, exact frozen IDs/titles, deterministic non-locale ordering, audit completeness, candidate-policy parity, non-target deltas, matcher precedence, generated distribution, stale artifacts, and exact reports.

Track B uses static claim-ledger tests, exact source-link checks, forbidden-claim scans, component tests, Playwright desktop/mobile journeys, Axe checks, overflow checks, Pages base/fallback tests, container verification, and live post-deploy checks.

Final release gates are:

```powershell
rtk npm test
rtk npm run test:e2e
rtk npm run lint
rtk npm run build
rtk npm run license:check
rtk npm run format:check
rtk npm run analysis:pilot:validate
rtk npm run analysis:pilot:report:check
rtk npm run analysis:aliases:validate
rtk npm run analysis:aliases:report:check
rtk npm run release:caddy:verify
rtk proxy git diff --check
```

The standard data build runs only in tasks that intentionally publish a new immutable snapshot. CI-specific test margins remain CI-only.

## Time and provenance accounting

Every evidence/coverage task records:

- `startedAt` before research;
- `completedAt` after the final gate;
- modeled active minutes;
- end-to-end wall-clock interval;
- independent reviewer time separately;
- correction rounds;
- commit SHA and reviewed range;
- provider/model tokens only when actually reported by that provider.

Deferred and discarded attempts count against the cost per completed qualification. OpenCode-displayed zero cost is never treated as billing evidence.

## Non-goals

- No broad one-word matching relaxation.
- No stemming, lemmatization, fuzzy matching, embeddings, or AI inference in production matching.
- No ArliAI implementation work before the contest deadline.
- No invented CNO/program mappings to reach a numeric target.
- No new analytics, accounts, persistence, employment indicators, or salary predictions.
- No submission portal action without the user.
