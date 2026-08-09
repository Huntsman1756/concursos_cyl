# SALIDA CyL Remaining Work Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the linked plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide one restart-safe index for every remaining action through contest submission.

**Architecture:** Two branches/worktrees run in parallel: Track A owns evidence, mappings, matching, and generated data; Track B owns invariant submission documentation and stable QA. They synchronize at a single coverage freeze before final figures, screenshots, deployment, and portal approval.

**Tech Stack:** Git worktrees, TypeScript 6, Zod 4, Vitest 4, React 19, Playwright, Jupyter, standard snapshot pipeline, GitHub Actions/Pages, Node 24, Caddy 2.

## Global Constraints

- Approved design: `docs/superpowers/specs/2026-08-09-salida-cyl-remaining-work-design.md`, introduced by commit `c965278`.
- Run every shell command through `rtk`; use `rtk proxy npx` for `npx`.
- Use `apply_patch` for authored file edits; generated snapshots come only from `npm run data:build`.
- ArliAI may not implement remaining contest work.
- Never invent a CNO, alias, source quote, result count, portal field, or billing value.
- Twelve means distinct qualifications; distance/modal variants do not increase the count.
- Twelve is evidence-conditioned, not mandatory.
- The 67 lexical candidates are not public coverage before the publication review plan completes.
- Track A and Track B must not edit the same file concurrently.
- The submitted URL is always `https://huntsman1756.github.io/concursos_cyl/`.
- No external portal submission occurs without explicit user approval.

---

## Plans and ownership

| Order | Track | Plan                                                                                  | Owner paths                                                                                          | May start                                                   |
| ----- | ----- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| A1    | A     | [One-word candidate publication review](2026-08-09-fp-one-word-publication-review.md) | `analysis/`, FP analysis scripts/schemas, curated mapping validation, matcher, generated public data | Immediately                                                 |
| A2    | A     | [Evidence-conditioned coverage to twelve](2026-08-09-fp-coverage-to-twelve.md)        | expansion analysis/audits, curated mappings, generated public data, coverage tests                   | After A1 Gate 1; selection work may start earlier read-only |
| B1    | B     | [Contest submission readiness](2026-08-09-contest-submission-readiness.md)            | `docs/contest/`, invariant QA tests, evidence manifest                                               | Immediately in a separate worktree                          |
| S     | A+B   | Coverage freeze and final submission tasks in B1                                      | freeze-owned shared files, final screenshots, deployment                                             | A1 and A2 terminal reports merged                           |

## Current baseline checklist

- [x] Production deployment is live and verified.
- [x] Income comparison and methodology are public.
- [x] FP pilot is complete: four completed, one deferred.
- [x] Official multiword alias pass is complete: 10 accepted, 44 rejected, zero marginal offers.
- [x] Family-ranking contamination and SAN21 nursing regression are fixed.
- [x] One-word lexical ceiling is frozen: 41/24/2, union 67.
- [x] ArliAI route is rejected and no delegated module remains.
- [ ] All 67 lexical offer identities have semantic dispositions.
- [ ] The bounded publication decision is complete.
- [ ] Coverage expansion terminal count is frozen.
- [ ] Contest claims and screenshots derive from the frozen manifest.
- [ ] Final workflow deploys the reviewed freeze commit.
- [ ] Human approves and submits the application.

## Parallel execution sequence

### Start

- [ ] Create Track A worktree/branch from the final planning commit containing this index and all three linked plans, using `superpowers:using-git-worktrees`.
- [ ] Create Track B worktree/branch from that exact same final planning commit.
- [ ] In both worktrees record `git rev-parse HEAD`, current manifest generatedAt, current snapshot path, and live workflow run in the task report.
- [ ] Prove the recorded values are byte-identical between tracks.
- [ ] Assign shared files (`package.json`, `README.md`, methodology page, workflows, Playwright config) to freeze ownership; neither early track edits them.

### Parallel phase

- [ ] Execute A1 completely, including the stop decision for one-word publication.
- [ ] Execute A2 candidate ranking and source discovery read-only while A1 runs.
- [ ] Execute B1 Tasks 1–3 only: claim ledger, stable QA, and screenshot specification.
- [ ] Do not capture final screenshots or insert final counts during this phase.

### Synchronization

- [ ] Merge/review A1 terminal state.
- [ ] Execute A2 review slots until seven evidence-supported completions, reserve exhaustion, or freeze date.
- [ ] Run the standard data build only from Track A after intentional curated changes.
- [ ] Produce the Track A terminal manifest/count report.
- [ ] Declare Gate 2 coverage freeze in a dedicated commit; include exact SHA and manifest resource hashes.
- [ ] Merge the frozen Track A state into Track B.
- [ ] Abort if Track B's baseline/claims cannot be reconciled automatically.

### Finalization

- [ ] Execute B1 Tasks 4–7 against the frozen state.
- [ ] Run the complete unit/browser/release matrix.
- [ ] Push the reviewed branch and monitor one exact workflow run to success.
- [ ] Verify the live root, manifest, methodology, comparison, FP search, and one reviewed zero/matched/deferred result.
- [ ] Present the final application pack and root URL for human approval.
- [ ] Submit only after explicit approval; record timestamp and confirmation supplied by the portal.

## Stop/rollback rules

- [ ] If official evidence is absent or contradictory, mark the candidate deferred and continue with a reserve; never broaden semantics.
- [ ] If a one-word form has a collision or non-target delta, reject that form and keep the default multiword policy.
- [ ] If upstream snapshot refresh is unstable, preserve last-known-good data and stop publication.
- [ ] If either track touches the other's owned files, stop and resolve ownership before continuing.
- [ ] If product/data changes after freeze, invalidate final screenshots/counts and return to synchronization.
- [ ] If final deployment fails, do not submit; fix and rerun the whole release matrix.

## Estimate and tracking

| Workstream                                            | Modeled active estimate | Calendar behavior                        |
| ----------------------------------------------------- | ----------------------: | ---------------------------------------- |
| 67-candidate audit and bounded publication decision   |                  6–10 h | Track A critical path                    |
| Seven additional qualification attempts plus reserves |        2–3 focused days | Track A after/alongside source discovery |
| Invariant submission/QA preparation                   |                   4–8 h | Track B parallel                         |
| Freeze, final evidence, release, human review         |                   4–8 h | Serial after Track A                     |

Every task report separates modeled active minutes, end-to-end wall time, reviewer time, correction rounds, and provider-reported tokens. Deferred/discarded work remains in the denominator.
