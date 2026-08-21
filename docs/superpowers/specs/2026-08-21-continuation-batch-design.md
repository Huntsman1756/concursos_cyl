# Continuation batch design

## Scope

This batch completes five independently reviewable outcomes on the existing `codex/priority-fp-coverage-20260821` branch:

1. verify and finish the committed mobile navigation/touch/listbox change;
2. load only the foundation resources each route consumes;
3. add a fail-closed, aggregate-only anonymous pilot kit without creating results;
4. research and publish only evidence-backed mappings for the next highest-priority FP programs;
5. stage runtime data with the active snapshot, flat compatibility resources, and every snapshot referenced by a terminal evidence artifact, while keeping repository history unchanged.

## Boundaries

- The public manifest remains `cache: "no-store"`; immutable snapshot resources may be memoized separately only in a later batch.
- No participant-level data, consent records, quotations, recordings, screenshots, identities, or fabricated pilot outcomes enter Git.
- No FP mapping is published from lexical similarity alone. Ambiguous candidates remain documented gaps.
- Runtime pruning never deletes repository snapshots. It affects only the deploy staging directory and retains the active snapshot plus snapshots referenced by freeze, pilot, alias-review, expansion, or other terminal evidence.
- The official contest submission, external contact, and any claim of adoption remain blocked until Dani gives separate explicit authorization and real evidence exists.
- Existing product design, markup, ARIA semantics, URLs, and visual language remain unchanged except for the approved mobile geometry fixes.

## Verification and delivery

Each subsystem follows red-green TDD and receives an independent commit. The final gate runs formatting, lint, the full Vitest suite, Chromium E2E, build, submission check, asset/distribution checks, and a branch review. Only after all required gates pass may the branch be pushed and deployed to GitHub Pages/VPS. Deployment evidence must record the observed commit and workflow; no contest form is submitted.
