# FP One-Word Matcher Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the two known family-ranking contaminations and measure an explicitly approved one-word title matcher without changing production matching, curated data, public snapshots, or UI.

**Architecture:** A trusted analysis layer fixes the snapshot, candidate inventory, exact expected offers, validators, and reports. ArliAI receives only a synthetic, read-only work contract and returns one pure TypeScript function as text; Codex alone patches the repository and runs the hidden real-data tests. Notebook corrections and the simulator are separate commits and independently reviewable.

**Tech Stack:** TypeScript 5, Vitest, Zod, Node.js crypto/fs, Jupyter/nbconvert, Python/pandas already used by the notebook, OpenCode with `arliai/DeepSeek-V4-Flash-0731`, and `agent-orchestration-starter` as the temporary OpenCode role compiler.

## Global Constraints

- Fixed offer snapshot: `20260809014318761-5b22c488ce4b`.
- Fixed job-offer SHA-256: `5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba`.
- Fixed job-offer count: `1077`.
- Closed candidates: HOT01M/CNO 5110/`cocinero`,`cocineros`; EOC01M/CNO 7121/`albañil`,`albañiles`; EOC01M/CNO 7111/`encofradores`.
- Matching is normalization plus whole tokens only. No stemming, fuzzy matching, scores, substring fallback, description matching, or inferred forms.
- Sorting uses normalized strings with `<` and `>` only. `localeCompare`, `Intl.Collator`, locale-sensitive case conversion, and ICU-dependent ordering are forbidden.
- ArliAI cannot read the repository, real offers, official audits, acceptance tests, validators, or expected offer IDs. It cannot write any repository file.
- ArliAI may implement only `scripts/analysis/simulateFpOneWordMatches.ts` from a synthetic contract. It cannot choose candidates or publish results.
- `data/curated/**`, `public/data/v1/**`, `src/domain/offerMatching.ts`, and `src/features/**` must have zero diff from the pre-experiment base.
- SSC01M and new source research are out of scope.
- Every production or analysis behavior change follows RED → GREEN. A passing test that was never observed failing is not evidence.
- Record separately: modeled work minutes, real wall-clock time, OpenCode-reported input/output tokens, first-test outcome, and correction rounds. Never combine or relabel these measures.
- All shell commands begin with `rtk`; use `rtk proxy npx` for direct `npx` invocations.

---

### Task 1: Correct and re-execute the family-ranking notebook

**Files:**

- Modify: `analysis/ecyl_fp_family_pilot_ranking.ipynb`
- Modify: `analysis/ecyl_fp_family_pilot_ranking.md`
- Create: `scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts`

**Interfaces:**

- Consumes: existing `title_normalized`, `sector_candidate`, `fp_candidate_family`, and fixed notebook source data.
- Produces: a fully executed notebook whose stored assertions prove unconditional degree/license exclusion and three explicit EOC exclusions; regenerated Markdown consistent with those outputs.

- [ ] **Step 1: Add the focused notebook contract test and observe RED**

Run `rtk git rev-parse HEAD` before editing and record that exact SHA as `experimentBase` in the ignored Task 1 report. This is the later zero-diff baseline.

Create `scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts`. The test copies the notebook to a temporary filename, spawns `jupyter nbconvert --to notebook --execute` with repository root as the child working directory and a 300-second timeout, and asserts a successful exit with no notebook error output. The checked-in Markdown is a curated analytical report rather than raw `nbconvert` output, so update its affected counts and findings explicitly instead of pretending that the two formats are byte-equivalent. The test exercises notebook behavior; it must not grep implementation source.

The test must name these exact examples:

```ts
const DEGREE_LED_FALSE_POSITIVE =
  "Trabajador/a social - coordinador/a de ayuda a domicilio para León";
const EOC_FALSE_POSITIVES = [
  "MECÁNICOS REPARADORES DE MAQUINARIA DE CONSTRUCCIÓN, MOVIMIENTO DE TIERRAS Y/O MINERÍA",
  "PINTORES DE ESTRUCTURAS METÁLICAS Y CASCOS DE BUQUES",
  "PINTORES-DECORADORES DE RÓTULOS",
] as const;
```

Before changing classification rules, add a code cell immediately after classification that selects each exact normalized title and asserts:

```python
import unicodedata

def classified_family(raw_title):
    normalized = unicodedata.normalize("NFKD", raw_title).encode(
        "ascii", errors="ignore"
    ).decode("ascii").lower()
    matching = df.loc[df["title_normalized"].eq(normalized), "fp_candidate_family"]
    assert len(matching) == 1, (raw_title, len(matching))
    return matching.iloc[0]

assert classified_family(
    "Trabajador/a social - coordinador/a de ayuda a domicilio para León"
) == "No FP o relación insuficiente desde el título"
for title in EOC_KNOWN_FALSE_POSITIVES:
    assert classified_family(title) != "Edificación y Obra Civil"
```

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts
```

Expected: FAIL because the real executed classifier violates all four assertions.

- [ ] **Step 2: Preserve the notebook RED evidence**

The test must use the notebook's real classifier/dataframe rather than a test-only classifier. Run it once before the rule change so the committed notebook is not left half-executed:

```powershell
rtk jupyter nbconvert --to notebook --execute analysis/ecyl_fp_family_pilot_ranking.ipynb --output ecyl_fp_family_pilot_ranking.red.ipynb --ExecutePreprocessor.timeout=300
```

Expected: non-zero exit from at least the degree-led assertion and the three EOC assertions. Remove only the temporary RED output with a verified exact path.

- [ ] **Step 3: Apply the minimal classification corrections**

In the existing classification cell:

```python
mask_degree_or_license_led = df["title_normalized"].str.contains(
    degree_or_license_led,
    na=False,
)
df.loc[
    mask_degree_or_license_led,
    "fp_candidate_family",
] = "No FP o relación insuficiente desde el título"
```

Delete `fp_specific_overrides` from this exclusion. Add a separate `eoc_known_false_positive` regex containing only the three approved pattern families and apply it only when `fp_candidate_family == "Edificación y Obra Civil"`:

```python
eoc_known_false_positive = re.compile(
    r"mecanic.*reparador.*maquinaria de construccion|"
    r"pintor.*estructuras metalicas.*cascos de buques|"
    r"pintor.*decorador.*rotulos",
    re.I,
)
```

Map matches to `No FP o relación insuficiente desde el título`. Do not change the broad family candidate regex in this task.

- [ ] **Step 4: Execute the notebook and reconcile the curated Markdown**

Run:

```powershell
rtk jupyter nbconvert --to notebook --execute --inplace analysis/ecyl_fp_family_pilot_ranking.ipynb --ExecutePreprocessor.timeout=300
```

Expected: the command exits 0 and all embedded assertions pass. Reconcile the curated Markdown's affected counts, percentages, dates, and conclusions against the executed notebook without replacing the report with raw notebook output.

- [ ] **Step 5: Run notebook and repository gates**

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts
rtk npm run lint
rtk npm run build
rtk npm run license:check
rtk npm run format:check
rtk git diff --check
```

Expected: all pass. Record the corrected family counts in the task report, explicitly distinguishing them from the prior notebook figures.

- [ ] **Step 6: Commit the notebook correction**

```powershell
rtk git add analysis/ecyl_fp_family_pilot_ranking.ipynb analysis/ecyl_fp_family_pilot_ranking.md scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts
rtk git commit -m "fix: remove FP family ranking contamination"
```

---

### Task 2: Lock the trusted experiment contract and exact RED expectations

**Files:**

- Create: `scripts/analysis/fpOneWordMatchExperimentContract.ts`
- Create: `scripts/analysis/fpOneWordMatchExperimentExpected.ts`
- Create: `scripts/analysis/simulateFpOneWordMatches.test.ts`

**Interfaces:**

- Produces: `APPROVED_ONE_WORD_CANDIDATES`, `FP_ONE_WORD_SNAPSHOT_CONTRACT`, exact expected candidate match arrays, and failing behavior tests for `simulateApprovedOneWordCandidates`.
- Consumes later: Task 3's pure simulator and Task 4's trusted runner.

- [ ] **Step 1: Write the closed contract**

Define readonly literal constants:

```ts
export const FP_ONE_WORD_SNAPSHOT_CONTRACT = {
  snapshotId: "20260809014318761-5b22c488ce4b",
  resourcePath:
    "public/data/v1/snapshots/20260809014318761-5b22c488ce4b/job-offers.json",
  sha256: "5c8ca9fde40e1fe8d58097ffd6f8823ff70f7de04abcab20d7e35c600b6ef5ba",
  recordCount: 1077,
} as const;

export const APPROVED_ONE_WORD_CANDIDATES = [
  {
    candidateId: "cocinero-s",
    programKey: "HOT01M",
    occupationId: "occupation:cno11:5110",
    forms: ["cocinero", "cocineros"],
  },
  {
    candidateId: "albanil-es",
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7121",
    forms: ["albañil", "albañiles"],
  },
  {
    candidateId: "encofradores",
    programKey: "EOC01M",
    occupationId: "occupation:cno11:7111",
    forms: ["encofradores"],
  },
] as const;
```

Add strict Zod schemas for offers, candidates, per-candidate results, and union results. Reject unknown fields.

- [ ] **Step 2: Freeze the exact expected offers independently**

Use Node's UTF-8 decoder and a one-off trusted extraction that normalizes NFD, removes `\p{Diacritic}`, lowercases with `toLowerCase()`, replaces non-letter/number runs, and checks padded whole tokens. Inspect every non-repeated title manually. Paste the exact `{ id, title }` arrays into `fpOneWordMatchExperimentExpected.ts`.

The fixed cardinalities are:

```ts
export const EXPECTED_MATCH_COUNTS = {
  "cocinero-s": 41,
  "albanil-es": 24,
  encofradores: 2,
  union: 67,
} as const;
```

The albañilería array must retain, not hide, `3 Oficial/a Segunda Oficios (Especialidad Albañil-Conductor/a) para Ayto. de Palencia` for later semantic review.

- [ ] **Step 3: Write pure behavior tests before the module exists**

Create tests for:

- exact synthetic whole-token matches;
- no substring match (`cocinero` must not match `precocinero`);
- explicit singular/plural only (`albañiles` matches, an invented derived form does not);
- accent normalization;
- deduplication when two approved forms hit one offer;
- strict rejection of an altered program, occupation, candidate ID, multiword form, empty form, or empty inventory;
- code-point ordering independent of locale using inputs containing `n`, `ñ`, and `á`;
- successful deterministic output while `String.prototype.localeCompare` and `Intl.Collator` are temporarily replaced with throwing sentinels, proving the implementation does not depend on them;
- exact real-snapshot candidate IDs/titles and union count 67.

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/simulateFpOneWordMatches.test.ts
```

Expected: FAIL resolving missing `./simulateFpOneWordMatches`. This is the RED evidence to preserve in the task report.

- [ ] **Step 4: Commit only the trusted contract and RED tests**

```powershell
rtk git add scripts/analysis/fpOneWordMatchExperimentContract.ts scripts/analysis/fpOneWordMatchExperimentExpected.ts scripts/analysis/simulateFpOneWordMatches.test.ts
rtk git commit -m "test: lock one-word matcher experiment"
```

Do not create the simulator in this task.

---

### Task 3: Compile an isolated OpenCode executor and obtain the ArliAI implementation

**Files:**

- Create outside repository: `C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/`
- Create in repository only after review: `scripts/analysis/simulateFpOneWordMatches.ts`
- Create ignored report: `.superpowers/sdd/2026-08-09-fp-one-word-matcher-experiment/task-3-report.md`

**Interfaces:**

- Consumes: the public TypeScript interface and synthetic examples from Task 2, copied without candidates, real offers, expected IDs, sources, or tests.
- Produces: one pure implementation of `simulateApprovedOneWordCandidates`; executor provenance metrics.

- [ ] **Step 1: Create a fresh isolated package with an exact allowlist**

Resolve a new absolute temp directory and verify it is outside the repository. It may contain only:

```text
orchestration.yaml
profile.yaml
work-contract.yaml
contract.md
AGENTS.md                        # generated by the starter
.opencode/agents/*              # generated by the starter
.agent-orchestration/*          # generated inventory
```

The work contract must set `maxTurns: 2`, `maxFilesChanged: 0`, and request a textual TypeScript response only. The OpenCode executor permissions are `read: true`, `write: false`; shell, network, and web-fetch permissions are denied. `contract.md` contains the type signature, normalization/matching rules, rejection rules, code-point comparator, and synthetic examples only.

- [ ] **Step 2: Compile and verify the OpenCode role with the starter**

From the verified clone `C:\Users\rome_\AppData\Local\Temp\agent-orchestration-starter-review-20260809`, run:

```powershell
rtk npm run validate
rtk node dist/cli/main.js init --target C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809 --policy C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/orchestration.yaml --profile C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/profile.yaml --harnesses opencode
rtk node dist/cli/main.js check --target C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809 --policy C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/orchestration.yaml --profile C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/profile.yaml
```

`profile.yaml` assigns `provider: arliai`, `model: DeepSeek-V4-Flash-0731`, `tier: economy`, `reasoningEffort: low` to the executor. Inspect the generated agent and manifest; abort if write, shell, or network is allowed.

- [ ] **Step 3: Invoke ArliAI once and capture machine-readable metrics**

Record `startedAt` immediately before invocation and `completedAt` immediately after. Run from the isolated directory:

```powershell
rtk opencode run --pure --dir C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809 --agent executor --model arliai/DeepSeek-V4-Flash-0731 --format json --file C:/Users/rome_/AppData/Local/Temp/salida-cyl-one-word-20260809/contract.md "Return only the complete TypeScript module requested by the contract. Do not create or modify files."
```

Capture the session ID, model, reported input/output/cache tokens, wall-clock seconds, and full textual answer. Do not treat OpenCode's displayed dollar cost as billing evidence.

- [ ] **Step 4: Review and patch only the proposed module**

Reject the response if it contains file access, environment access, network access, dynamic imports, dependencies, `localeCompare`, `Intl.Collator`, extra candidates, publication code, or markdown outside a removable code fence. Compare the interface exactly with Task 2. Apply the reviewed module to `scripts/analysis/simulateFpOneWordMatches.ts` using `apply_patch`; never copy any other generated file into the repository.

- [ ] **Step 5: Run the hidden real-data suite and count correction rounds**

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/simulateFpOneWordMatches.test.ts
```

If GREEN on the first run, record `firstTestStatus: passed` and `correctionRounds: 0`. If it fails, send at most one continuation to the same OpenCode session containing only the original contract plus the exact failing assertion/error; never attach tests or real data. Apply only a reviewed replacement module and rerun. A second failure ends the delegation as unsuccessful and Codex does not silently repair the implementation.

- [ ] **Step 6: Commit the accepted delegated module**

```powershell
rtk git add scripts/analysis/simulateFpOneWordMatches.ts
rtk git commit -m "feat: simulate approved one-word title matches"
```

The ignored report records executor metrics separately as `wallClock`, `openCodeReportedTokens`, `modeledWork`, and `correctionRounds`.

---

### Task 4: Add trusted recomputation, checked artifacts, and report

**Files:**

- Create: `scripts/analysis/validateFpOneWordMatchExperiment.ts`
- Create: `scripts/analysis/validateFpOneWordMatchExperiment.test.ts`
- Create: `scripts/analysis/renderFpOneWordMatchExperimentReport.ts`
- Create: `scripts/analysis/renderFpOneWordMatchExperimentReport.test.ts`
- Create: `analysis/fp_one_word_match_experiment_results.json`
- Create: `analysis/fp_one_word_match_executor_metrics.json`
- Create: `analysis/fp_one_word_match_experiment_results.md`
- Modify: `package.json`

**Interfaces:**

- Consumes: fixed contract, exact expectations, pure simulator, fixed snapshot, and captured executor metrics.
- Produces: deterministic results JSON, validated non-deterministic provenance JSON, exact Markdown, and four CLI scripts.

- [ ] **Step 1: Write RED tests for stale results and provenance separation**

Tests must require:

- snapshot bytes hash exactly to the pinned SHA and contain 1077 strict offers;
- recomputation equals all exact expected ID/title arrays and union count 67;
- checked result JSON equals deterministic serialization byte for byte;
- changing a count, ID, title, candidate, SHA, or order fails validation;
- metrics contain ISO timestamps with `completedAt >= startedAt`, non-negative wall time and token counts, model/session strings, `firstTestStatus`, and correction count;
- deterministic results never contain timestamps, token counts, cost, or modeled time;
- rendering derives every count and title from validated artifacts;
- changing whitespace, CRLF, final newline, or any result makes report check fail.

Run:

```powershell
rtk proxy npx vitest run scripts/analysis/validateFpOneWordMatchExperiment.test.ts scripts/analysis/renderFpOneWordMatchExperimentReport.test.ts
```

Expected: FAIL because validator, artifacts, and renderer do not exist.

- [ ] **Step 2: Implement the trusted validator**

Use `createHash("sha256")` over raw bytes before JSON parsing. Validate the snapshot contract, invoke the pure simulator with the closed candidates, compare every result with the exact expected fixture, compute the sorted union, and serialize with:

```ts
export function serializeFpOneWordMatchResults(value: FpOneWordMatchResults) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
```

Default CLI behavior compares the checked file byte-for-byte; `--write-results` is the only write mode. Reject all other arguments.

- [ ] **Step 3: Implement the metrics schema without claiming recomputability**

Store the actual OpenCode capture from Task 3 with explicit fields:

```ts
type ExecutorMetrics = {
  model: "arliai/DeepSeek-V4-Flash-0731";
  sessionId: string;
  startedAt: string;
  completedAt: string;
  wallClockSeconds: number;
  openCodeReportedInputTokens: number | null;
  openCodeReportedOutputTokens: number | null;
  openCodeReportedCacheTokens: number | null;
  firstTestStatus: "passed" | "failed";
  correctionRounds: 0 | 1;
  modeledWorkMinutes: number;
  billingCostVerified: false;
};
```

The validator checks shape and chronology but labels these fields as captured provenance, not deterministic recomputation or billing truth.

- [ ] **Step 4: Implement exact report rendering**

Required sections:

```markdown
## Contrato bloqueado

## Coincidencias léxicas por candidato

## Revisión de títulos alcanzados

## Resultado y límites

## Coste del ejecutor

## Decisión siguiente
```

The report must state that 67 is a lexical match union, not published coverage; show the `Albañil-Conductor/a` title explicitly; state SSC01M is excluded; and display modeled minutes, wall-clock seconds, and OpenCode-reported tokens on separate labeled lines.

- [ ] **Step 5: Add package commands and generate twice**

Add:

```json
"analysis:one-word:validate": "tsx scripts/analysis/validateFpOneWordMatchExperiment.ts",
"analysis:one-word:write": "tsx scripts/analysis/validateFpOneWordMatchExperiment.ts --write-results",
"analysis:one-word:report:check": "tsx scripts/analysis/renderFpOneWordMatchExperimentReport.ts",
"analysis:one-word:report:write": "tsx scripts/analysis/renderFpOneWordMatchExperimentReport.ts --write"
```

Run write commands twice, hash both artifacts after each run, and require identical hashes.

- [ ] **Step 6: Run focused GREEN and commit**

```powershell
rtk proxy npx vitest run scripts/analysis/validateFpOneWordMatchExperiment.test.ts scripts/analysis/renderFpOneWordMatchExperimentReport.test.ts scripts/analysis/simulateFpOneWordMatches.test.ts
rtk npm run analysis:one-word:validate
rtk npm run analysis:one-word:report:check
rtk git add scripts/analysis/validateFpOneWordMatchExperiment.ts scripts/analysis/validateFpOneWordMatchExperiment.test.ts scripts/analysis/renderFpOneWordMatchExperimentReport.ts scripts/analysis/renderFpOneWordMatchExperimentReport.test.ts analysis/fp_one_word_match_experiment_results.json analysis/fp_one_word_match_executor_metrics.json analysis/fp_one_word_match_experiment_results.md package.json
rtk git commit -m "docs: report one-word matcher experiment"
```

---

### Task 5: Full regression, isolation audit, and final evidence

**Files:**

- Modify ignored report: `.superpowers/sdd/2026-08-09-fp-one-word-matcher-experiment/final-report.md`
- No production/public data files may change.

**Interfaces:**

- Consumes: all prior commits.
- Produces: a release-quality evidence bundle and a bounded recommendation; no deployment.

- [ ] **Step 1: Prove forbidden paths have zero diff**

Use the exact pre-Task-1 commit recorded in the ignored Task 1 report as `$experimentBase` and run:

```powershell
rtk git diff --exit-code $experimentBase..HEAD -- data/curated public/data/v1 src/domain/offerMatching.ts src/features
```

Expected: exit 0 with no output. Also scan new experiment files for `SSC01M`, network APIs, filesystem writes inside the delegated module, `localeCompare`, `Intl.Collator`, fuzzy/stemming terms, and publication code. Only the report's explicit SSC exclusion sentence may mention SSC01M.

- [ ] **Step 2: Run all focused historical and new analysis gates**

```powershell
rtk proxy npx vitest run scripts/analysis/simulateFpOneWordMatches.test.ts scripts/analysis/validateFpOneWordMatchExperiment.test.ts scripts/analysis/renderFpOneWordMatchExperimentReport.test.ts scripts/analysis/validateEcylFpFamilyPilotNotebook.test.ts scripts/analysis/validateFpOfficialAliasPass.test.ts scripts/analysis/validateFpCoveragePilot.test.ts src/domain/offerMatching.test.ts scripts/data/validateCuratedMappings.test.ts scripts/data/validatePublicDistribution.test.ts
rtk npm run analysis:one-word:validate
rtk npm run analysis:one-word:report:check
rtk npm run analysis:aliases:validate
rtk npm run analysis:aliases:report:check
rtk npm run analysis:pilot:validate
rtk npm run analysis:pilot:report:check
```

Expected: all pass with historical pilot/alias outputs unchanged.

- [ ] **Step 3: Run full repository gates**

```powershell
rtk npm test
rtk npm run test:e2e
rtk npm run lint
rtk npm run build
rtk npm run license:check
rtk npm run format:check
rtk git diff --check
rtk git status --short
```

Expected: all pass and status is clean except the intentionally ignored SDD reports.

- [ ] **Step 4: Write the final decision evidence**

Record:

- corrected family counts and the four removed contaminations;
- raw lexical counts 41/24/2 and union 67, or fail closed if exact expectations disagree;
- every semantically questionable reached title, including `Albañil-Conductor/a`;
- ArliAI model/session, modeled minutes, wall-clock time, token fields, first-test outcome, and correction rounds as separate measures;
- whether the experiment justifies drafting a later publishable allowlist spec;
- the mandatory human source check for any future SSC01M or genuinely new regulatory mapping.

Do not convert the lexical result into public coverage or deploy.

- [ ] **Step 5: Commit only any final authored evidence not already committed**

If all public evidence was committed in Task 4 and the final report is ignored, do not create an empty commit. Verify clean status and report the exact commit range.

---

## Execution choice already approved

The user selected inline orchestration with an isolated ArliAI executor for Task 3. Codex owns Tasks 1, 2, 4, and 5 and all reviews. No Codex subagent or ArliAI process may broaden the candidate inventory, modify sources/tests, or publish data.
