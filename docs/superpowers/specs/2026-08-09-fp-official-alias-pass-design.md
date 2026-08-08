# FP Official Alias Pass — Design

**Date:** 2026-08-09  
**Status:** approved for implementation planning  
**Baseline manifest snapshot:** `20260808215403108-add4c517860c`

## 1. Purpose

The FP pilot completed `HOT01M`, `SSC01M`, and `EOC01M` with approved program–occupation relationships but reached zero offers in the reviewed 1,077-offer snapshot because no alias for their approved occupations passed the evidence threshold. This pass tests that single bottleneck. It may publish an occupation alias only when an authoritative INE or SEPE classification contains that alias literally and the existing deterministic matcher can use it without collision or semantic broadening.

Success is not “make the count go up.” Success is a reproducible decision for every candidate alias, an exact before/after count on one pinned snapshot, and publication only of the candidates that satisfy every evidence, program-boundary, and collision gate. Current source review indicates that all otherwise-valid multiword candidates produce zero matches in the baseline snapshot. The official single-word examples `Encofradores`, `Tejadores`, and the preferred label `Albañiles` could match titles, but the existing multiword policy rejects them. The expected outcome is therefore zero marginal offers unless further in-scope official multiword evidence is found; zero accepted aliases or zero new matches is a valid result.

## 2. Scope

The only target programs and already-approved occupations are:

| Program  | Approved occupation targets in the current curated links                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `HOT01M` | `occupation:cno11:5110`                                                                                                     |
| `SSC01M` | `occupation:cno11:5629`, `occupation:cno11:5710`                                                                            |
| `EOC01M` | `occupation:cno11:7111`, `occupation:cno11:7121`, `occupation:cno11:7193`, `occupation:cno11:7240`, `occupation:cno11:7291` |

The implementation may add approved aliases for those occupation IDs, machine-readable audit evidence, validators, focused tests, generated manifest-addressed snapshots, and a rendered pass report. It may update training-first UI tests only to assert the exact result count or exact empty state produced by the new snapshot.

The pass must not:

- create or change a `TrainingOccupationLink`;
- create an occupation or CNO code;
- add a training program, cycle, family, qualification, or program–qualification link;
- admit aliases for `SAN21`, `COM01M`, DAW, Gestión Administrativa, or any program outside the three targets;
- infer an alias from an offer title, TodoFP/BOE output, model suggestion, search result, trade usage, or third-party classification;
- weaken existing matcher boundaries, review-status filtering, evidence identities, manifest validation, privacy, or empty-state copy;
- add accounts, cookies, analytics, storage, personal endpoints, URL-serialized decision state, or a runtime AI dependency;
- mention or link the rejected external project/domain anywhere in the repository.

## 3. Approved approach

Use separate per-program evidence records, a shared fail-closed validator, and the existing curated alias/matcher/snapshot pipeline.

Each program receives one audit file under `analysis/fp_official_alias_pass/`. A record contains the candidate alias, target occupation ID, disposition, coded reason, INE/SEPE classification URL and exact quote, an exact reference to the program’s accepted professional-output audit, and review date. Accepted records are the only input allowed to add rows to `data/curated/occupation-aliases.json`. The public alias schema remains unchanged; the audit files provide the source and program-boundary evidence that the current compact alias resource does not carry.

An aggregate validator loads all three audits plus the pinned immutable baseline snapshot and current curated data. It proves scope, literal official evidence, referential integrity, normalized uniqueness, cross-program collision safety, zero baseline matches, deterministic candidate matches, and agreement between accepted audits and curated aliases. The existing `matchOffersForProgram` remains the sole offer-counting implementation.

After the evidence and curated data pass, `npm run data:build` publishes the standard immutable resources and manifest last. A renderer writes an exact report from the validated audits and the manifest-addressed resources. No parallel public-data mechanism is introduced.

### Alternatives not selected

1. **Add citation fields to every public alias row.** This would improve the generic alias schema, but strict migration would require unrelated DAW, administrative, and SAN21 alias work. That exceeds the bounded three-program pass.
2. **Hand-edit aliases and assert a few expected titles.** This is faster initially but leaves no machine-readable source decision, no pinned before/after comparison, and no reliable proof that a count increase came only from the reviewed aliases.

## 4. Evidence contract

The audit contract has schema version `1.0.0`, one file per target program, and these record-level fields:

```ts
type AliasDisposition = "accepted" | "rejected";

type AliasReasonCode =
  | "literal_ine_classification"
  | "literal_sepe_classification"
  | "official_evidence_absent"
  | "official_evidence_indirect"
  | "normalized_collision"
  | "cross_occupation_conflict"
  | "matcher_policy_one_word"
  | "semantic_broadening";

interface OfficialAliasReview {
  alias: string;
  occupationId: string;
  disposition: AliasDisposition;
  reasonCode: AliasReasonCode;
  sourceUrl: string;
  sourceQuote: string;
  acceptedProgramOutputLabel: string;
  acceptedProgramOutputSourceUrl: string;
  acceptedProgramOutputSourceQuote: string;
  reviewedAt: string;
  reviewNote?: string;
}

interface ProgramOfficialAliasReview {
  schemaVersion: "1.0.0";
  programKey: "HOT01M" | "SSC01M" | "EOC01M";
  baselineSnapshotId: "20260808215403108-add4c517860c";
  reviews: OfficialAliasReview[];
}
```

Only `https` URLs hosted by `ine.es` or `sepe.es`, including their subdomains, are authoritative for this pass. TodoFP and BOE remain valid evidence for the existing program–occupation links, but they cannot approve an alias in this pass. Search pages, mirrors, aggregators, occupational dictionaries, employer text, and third-party projects are forbidden evidence.

For an accepted record, the alias must be a contiguous, word-bounded phrase in `sourceQuote` after Unicode NFC normalization, Spanish case-folding, and whitespace/punctuation collapsing. Diacritics, lexical tokens, singular/plural form, and word order must agree with the official phrase; stemming, translation, abbreviation expansion, or synonym substitution is not allowed. The stored quote preserves the exact official text. The reason must be `literal_ine_classification` or `literal_sepe_classification` and must agree with the source host.

CNO membership is necessary but not sufficient. The three `acceptedProgramOutput*` fields must exactly reproduce an accepted `professionalOutputReviews` entry for the same program and occupation in `analysis/fp_coverage_pilot_results.json`. The candidate alias must describe that accepted program-output boundary, not merely another occupation grouped under the same four-digit CNO. For example, `Ayudantes de dentista` is an INE label within CNO 5629 but is outside the accepted SSC01M institutional/disability-care boundary and conflicts with SAN21’s explicit dental-support rejection; it must be rejected as `semantic_broadening`.

A rejected record remains in the audit but never enters curated aliases. `official_evidence_absent` is used when neither allowed authority contains the candidate. `official_evidence_indirect` covers material that describes duties without naming the alias. `matcher_policy_one_word` records a literal official term blocked by the unchanged multiword policy. Collision and broadening reasons record other candidates that are literal but unsafe for deterministic matching.

## 5. Collision and non-broadening gates

All accepted aliases must pass the existing generic rules: at least two normalized words, a known approved occupation target, and no duplicate normalized alias. The pass adds the following gates without changing matcher semantics:

- The target occupation must be one of the exact occupation IDs in section 2 and must already have an approved link to that audit’s program.
- The target program and occupation must also have an accepted professional-output audit whose exact label and source fields match the audit record. A four-digit CNO label without this program-specific evidence is rejected.
- The normalized alias must be unique across existing curated aliases and all three proposed audit files, even when two rows target the same occupation.
- The complete proposed alias set must validate in either input order and produce byte-identical sorted matches.
- Running each target program against the baseline with all proposed accepted aliases must not throw `Offer matches conflicting occupations`.
- Because curated aliases are global by occupation ID, the validator must enumerate every approved training link to the candidate CNO, not only the audit’s target program. Publication is allowed only when every linked program has an accepted professional-output audit supporting the same alias boundary. If any linked program lacks that support, the candidate remains audit-only and is rejected.
- The baseline/overlay simulation must run every reviewed program. A candidate is rejected when it creates a new match for a non-target program, changes an existing non-target match’s occupation or evidence identity, or exposes an alias whose program boundary is absent or rejected. This cross-program leakage invariant applies even when the target program’s own matches look correct.
- Every resulting title match must retain the existing bounded-phrase rule, approved alias evidence identity, approved link evidence identity, and deterministic priority (`title_alias_exact` before `title_alias_phrase`, then longest alias and stable identity).
- The implementation must not add a generic one-word exception, substring fallback, fuzzy match, score, stemming rule, or offer-derived alias.
- A literal label is rejected as `semantic_broadening` when the official context identifies a broader group, residual category, supervisory/licensed role, or occupation outside the already-approved target relationship.

Any failed gate invalidates the aggregate and blocks curated publication and snapshot generation. There is no partial validator success. Reviewers may explicitly change an individual record from accepted to rejected and rerun the whole aggregate.

## 6. Deterministic counting and report contract

The controlled comparison uses the retained immutable snapshot `20260808215403108-add4c517860c` for programs, occupations, aliases, training links, offers, and published requirements. It runs the existing `matchOffersForProgram` twice for every program with an approved link:

1. **Before:** the baseline resources exactly as stored. The expected count is `0` for each of the three target programs.
2. **After:** the same baseline resources with only accepted aliases from the three validated audits overlaid. Programs, occupations, links, offers, requirements, qualifications, and human overrides are otherwise byte-equivalent; human overrides remain empty.

Counts are distinct matched offer IDs after the matcher’s existing stable sort. The audit summary records, for each target program, `beforeOfferCount`, `afterOfferCount`, and the sorted `newlyReachedOfferIds`. It also records the union count across the three programs without double-counting an offer ID. For every other reviewed program it proves byte-identical before/after matches and records no delta. The validator recomputes every value; hand-entered or stale counts fail.

Research stops for a program as soon as all literal INE/SEPE labels and examples under its approved CNO targets have one recorded disposition and no accepted multiword candidate yields a match. At that gate, the reviewer records the zero result instead of expanding to single-word aliases, adjacent CNOs, new program links, other cycles, third-party sources, or matcher changes. Opening any of those directions requires a new user-approved design.

The published report at `analysis/fp_official_alias_pass_results.md` is renderer-owned. It names the baseline snapshot, accepted and rejected alias totals by program, exact before/after counts, exact union delta, current published manifest snapshot ID, and limitations. It must say that snapshot counts do not estimate total employment.

The historical pilot JSON and its 43-offer result remain historical evidence and are not rewritten to pretend this later pass happened during the pilot. If the pilot report’s existing prose becomes ambiguous after aliases are published, its renderer and checked-in report must be changed only to label the zero-alias statement explicitly as the pilot snapshot result; its measured counts remain unchanged.

## 7. Publication and UI behavior

Accepted rows are added only to `data/curated/occupation-aliases.json`, with `reviewStatus: "approved"`, `mappingVersion: "1.0.0"`, and the actual review date. No alias is copied from a rejected audit.

The existing pipeline remains authoritative:

```text
program audit files
  → fail-closed alias-pass validator
  → curated occupation-aliases.json
  → validateCuratedMappings/loadApprovedMappings
  → data:build
  → immutable snapshot resources
  → manifest-last publication
  → public training-first matcher
```

The standard build must preserve the logical sets of programs, occupations, and training–occupation links. Their generated record counts must remain unchanged from the pre-pass manifest: 187 programs, 11 occupations, and 12 approved training–occupation links. `mapping-coverage.json` continues to report link coverage, so its six reviewed program keys and their approved-link counts do not change merely because aliases were added. The alias resource count increases only by the number of accepted, normalized-unique aliases.

The training-first pages need no new production component. They already load manifest-addressed aliases and render either an exact list of matched offers or the dated zero-result state. Focused UI and Playwright tests must assert the exact article count for every target with a nonzero published count and the exact existing empty-state copy for every target that remains zero. The home coverage test must continue to show the same six reviewed programs and exclude `COM01M`.

## 8. Failure handling, privacy, and provenance

- Missing audit files, unknown fields, malformed dates, unsupported source hosts, nonliteral quotes, duplicate records, count drift, missing retained snapshots, or curated/audit disagreement stop validation with a program-specific error.
- If the standard data refresh fails, the existing last-known-good behavior remains authoritative; the alias pass is not reported as published until the active manifest resolves to a validated snapshot containing exactly the accepted aliases.
- No research ambiguity is exposed as a public alias. Rejections remain offline analysis evidence.
- No personal information is introduced. Selection routes remain public catalog navigation; requirement answers remain in browser memory and never enter storage, URLs, analytics, or a server.
- Generated files change only through `npm run data:build`; no manifest or snapshot file is edited by hand.

## 9. Verification and orchestration

Implementation is test-first. A Terra implementer handles one bounded task at a time; a fresh Sol reviewer checks spec compliance and code quality before the next dependent task. Once the shared audit contract exists, the HOT01M, SSC01M, and EOC01M evidence tasks may run in parallel because each owns a separate audit and test file and does not edit curated or generated data. Integration, publication, UI/report verification, and whole-branch review remain sequential.

The release gate includes focused audit/validator tests, curated mapping tests, matcher tests, snapshot build and distribution tests, report renderer tests, training-first component tests, desktop/mobile Playwright journeys, `analysis:pilot:validate`, `analysis:pilot:report:check`, lint, build, license check, Prettier, `git diff --check`, and a forbidden-reference scan. A fresh Sol review verifies that no link, occupation, CNO, cycle, privacy behavior, or matcher boundary changed.
