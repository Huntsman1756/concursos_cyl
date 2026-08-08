# FP Official Alias Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine and publish only literal, program-relevant INE/SEPE aliases for HOT01M, SSC01M, and EOC01M, with reproducible zero-to-after offer counts and no cross-program leakage.

**Architecture:** Three independent program audits feed one fail-closed validator that cross-checks literal classification evidence, the existing pilot’s accepted professional-output boundaries, global alias safety, and deterministic matches on pinned snapshot `20260808215403108-add4c517860c`. Accepted audit rows alone may enter the existing curated alias file; the unchanged matcher and standard manifest-last snapshot pipeline publish them, while generated JSON/Markdown results and UI tests expose the exact outcome.

**Tech Stack:** TypeScript 6, Zod 4, Vitest 4, React 19, Testing Library, Playwright 1.62, existing `matchOffersForProgram`, existing immutable snapshot builder, JSON and Markdown audit artifacts.

## Global Constraints

- The only target programs are `HOT01M`, `SSC01M`, and `EOC01M`.
- The only target occupation IDs are `occupation:cno11:5110`, `occupation:cno11:5629`, `occupation:cno11:5710`, `occupation:cno11:7111`, `occupation:cno11:7121`, `occupation:cno11:7193`, `occupation:cno11:7240`, and `occupation:cno11:7291`.
- The controlled baseline snapshot is exactly `20260808215403108-add4c517860c`; its before count is exactly `0` for each target program.
- An accepted alias requires both a literal `https` INE/SEPE classification phrase and an exact accepted professional-output audit for the same program and occupation.
- A global alias must be safe for every approved program link to its CNO; every non-target program’s before/after matches must remain byte-identical.
- Do not add or change program links, occupations, CNO codes, cycles, qualifications, matcher behavior, alias schema, or privacy behavior.
- Preserve the existing multiword alias rule. `Encofradores`, `Tejadores`, and `Albañiles` remain rejected even if they match offer titles.
- Zero accepted aliases and zero newly reached offers are valid outcomes. Stop rather than widening evidence, matching, or product scope.
- Generated snapshots and the manifest change only through `npm run data:build`; never edit them by hand.
- The logical generated counts remain 187 programs, 11 occupations, and 12 approved training–occupation links; the six reviewed program keys and `COM01M` exclusion remain unchanged.
- No accounts, cookies, analytics, browser storage, personal endpoints, runtime AI, or URL-serialized decision state.
- Never mention or link the rejected external project/domain; use only official sources and repository-owned analysis.
- Every shell command starts with `rtk`; every production/data change is test-first; every task ends in a focused commit and an independent Sol review.

## File and ownership map

- `data/schemas/fpOfficialAliasPass.ts`: audit and summary schemas, target constants, and exported types.
- `scripts/analysis/validateFpOfficialAliasPass.ts`: disk loading, official-source checks, pilot-boundary checks, global leakage simulation, deterministic counts, and CLI.
- `scripts/analysis/validateFpOfficialAliasPass.test.ts`: shared contract, integration, collision, and leakage tests.
- `analysis/fp_official_alias_pass/HOT01M.json` plus `scripts/analysis/fpOfficialAliasPass.HOT01M.test.ts`: HOT-only research evidence.
- `analysis/fp_official_alias_pass/SSC01M.json` plus `scripts/analysis/fpOfficialAliasPass.SSC01M.test.ts`: SSC-only research evidence.
- `analysis/fp_official_alias_pass/EOC01M.json` plus `scripts/analysis/fpOfficialAliasPass.EOC01M.test.ts`: EOC-only research evidence.
- `data/curated/occupation-aliases.json`: accepted rows copied from validated audits; the only curated production data changed.
- `analysis/fp_official_alias_pass_results.json`: recomputable machine-readable outcome.
- `scripts/analysis/renderFpOfficialAliasPassReport.ts` and test: exact JSON-to-Markdown renderer/checker.
- `analysis/fp_official_alias_pass_results.md`: renderer-owned human report.
- `public/data/v1/manifest.json` and its new immutable snapshot directory: standard pipeline output only.
- `src/features/training-first/TrainingResultsPage.test.tsx` and `tests/e2e/fp-official-alias-pass.spec.ts`: exact published counts/empty states without production UI changes.

## Execution and review graph

```text
Task 1 shared contract
  ├─ Task 2 HOT01M evidence ─┐
  ├─ Task 3 SSC01M evidence ─┼─ Task 5 aggregate/integrate
  └─ Task 4 EOC01M evidence ─┘          ↓
                                  Task 6 publish/report
                                           ↓
                                  Task 7 exact UI coverage
                                           ↓
                                  Task 8 whole-pass review
```

Use one fresh Terra implementer for each task. After Task 1, Tasks 2–4 may run in parallel because they own separate JSON and test files and must not touch curated/generated data. A fresh Sol reviewer performs a spec-compliance review and then a code-quality review after every task; Critical or Important findings return to a Terra fix wave before dependent work starts.

---

### Task 1: Add the fail-closed audit and counting contract

**Files:**

- Create: `data/schemas/fpOfficialAliasPass.ts`
- Create: `scripts/analysis/validateFpOfficialAliasPass.ts`
- Create: `scripts/analysis/validateFpOfficialAliasPass.test.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: current manifest-addressed resources, `analysis/fp_coverage_pilot_results.json`, curated aliases, and `matchOffersForProgram(programKey: string, input: OfferMatchingData): OfferMatch[]`.
- Produces: `ProgramOfficialAliasReviewSchema`, `FpOfficialAliasPassResultsSchema`, `TARGET_ALIAS_PROGRAMS`, `TARGET_OCCUPATIONS_BY_PROGRAM`, `canonicalAliasIdentity(alias)`, `loadAliasPassValidationContext(rootDirectory?: string)`, `validateProgramOfficialAliasReview(value, context)`, `computeFpOfficialAliasPass(input): FpOfficialAliasPassResults`, and `validateFpOfficialAliasPassFromDisk(rootDirectory?: string)`.

- [ ] **Step 1: Write RED schema and official-source tests**

Create a minimal valid fixture and prove that unknown programs, unknown occupations, non-INE/SEPE hosts, nonliteral quotes, and a source/reason mismatch fail:

```ts
const hotReview = {
  schemaVersion: "1.0.0",
  programKey: "HOT01M",
  baselineSnapshotId: "20260808215403108-add4c517860c",
  reviews: [
    {
      alias: "Cocineros asalariados",
      occupationId: "occupation:cno11:5110",
      disposition: "accepted",
      reasonCode: "literal_ine_classification",
      sourceUrl:
        "https://www.ine.es/daco/daco42/clasificaciones/cno11_notas.pdf",
      sourceQuote: "5110 Cocineros asalariados",
      acceptedProgramOutputLabel: "Cocinero.",
      acceptedProgramOutputSourceUrl:
        "https://todofp.es/dam/jcr%3A63392ee9-4d38-449b-a196-d0efb714b364/n-tcocinagastronomiaes-pdf.pdf",
      acceptedProgramOutputSourceQuote: "Cocinero.",
      reviewedAt: "2026-08-09",
    },
  ],
} as const;

expect(() => ProgramOfficialAliasReviewSchema.parse(hotReview)).not.toThrow();
expect(() =>
  validateProgramOfficialAliasReview(
    {
      ...hotReview,
      reviews: [
        {
          ...hotReview.reviews[0],
          sourceUrl: "https://example.com/cno",
        },
      ],
    },
    fixtureContext,
  ),
).toThrow(/INE or SEPE/i);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `rtk npx vitest run scripts/analysis/validateFpOfficialAliasPass.test.ts`

Expected: FAIL because `data/schemas/fpOfficialAliasPass.ts` and validator exports do not exist.

- [ ] **Step 3: Implement the strict schemas and stable target constants**

Implement strict Zod objects with the exact reason union and target map:

```ts
export const TARGET_ALIAS_PROGRAMS = ["HOT01M", "SSC01M", "EOC01M"] as const;

export const TARGET_OCCUPATIONS_BY_PROGRAM = {
  HOT01M: ["occupation:cno11:5110"],
  SSC01M: ["occupation:cno11:5629", "occupation:cno11:5710"],
  EOC01M: [
    "occupation:cno11:7111",
    "occupation:cno11:7121",
    "occupation:cno11:7193",
    "occupation:cno11:7240",
    "occupation:cno11:7291",
  ],
} as const;

export const AliasReasonCodeSchema = z.enum([
  "literal_ine_classification",
  "literal_sepe_classification",
  "official_evidence_absent",
  "official_evidence_indirect",
  "normalized_collision",
  "cross_occupation_conflict",
  "matcher_policy_one_word",
  "semantic_broadening",
]);

const OfficialAliasReviewBaseSchema = z.object({
  alias: z.string().trim().min(2),
  occupationId: z.string().regex(/^occupation:cno11:\d{4}$/u),
  sourceUrl: z.string().url().startsWith("https://"),
  sourceQuote: z.string().trim().min(2).max(500),
  acceptedProgramOutputLabel: z.string().trim().min(2).max(280),
  acceptedProgramOutputSourceUrl: z.string().url().startsWith("https://"),
  acceptedProgramOutputSourceQuote: z.string().trim().min(2).max(280),
  reviewedAt: z.string().date(),
});

export const OfficialAliasReviewSchema = z.discriminatedUnion("disposition", [
  OfficialAliasReviewBaseSchema.extend({
    disposition: z.literal("accepted"),
    reasonCode: z.enum([
      "literal_ine_classification",
      "literal_sepe_classification",
    ]),
  }).strict(),
  OfficialAliasReviewBaseSchema.extend({
    disposition: z.literal("rejected"),
    reasonCode: z.enum([
      "official_evidence_absent",
      "official_evidence_indirect",
      "normalized_collision",
      "cross_occupation_conflict",
      "matcher_policy_one_word",
      "semantic_broadening",
    ]),
    reviewNote: z.string().trim().min(20).max(500),
  }).strict(),
]);

export const ProgramOfficialAliasReviewSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    programKey: z.enum(TARGET_ALIAS_PROGRAMS),
    baselineSnapshotId: z.literal("20260808215403108-add4c517860c"),
    reviews: z.array(OfficialAliasReviewSchema).min(1),
  })
  .strict();

export const ProgramAliasPassResultSchema = z
  .object({
    programKey: z.enum(TARGET_ALIAS_PROGRAMS),
    beforeOfferCount: z.literal(0),
    afterOfferCount: z.number().int().nonnegative(),
    newlyReachedOfferIds: z.array(z.string().min(1)),
  })
  .strict();

export const FpOfficialAliasPassResultsSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    baselineSnapshotId: z.literal("20260808215403108-add4c517860c"),
    acceptedAliasCount: z.number().int().nonnegative(),
    rejectedAliasCount: z.number().int().nonnegative(),
    programs: z.array(ProgramAliasPassResultSchema).length(3),
    newlyReachedOfferUnionCount: z.number().int().nonnegative(),
    newlyReachedOfferUnionIds: z.array(z.string().min(1)),
    nonTargetProgramDeltas: z.tuple([]),
  })
  .strict();

export type ProgramOfficialAliasReview = z.infer<
  typeof ProgramOfficialAliasReviewSchema
>;
export type FpOfficialAliasPassResults = z.infer<
  typeof FpOfficialAliasPassResultsSchema
>;
```

Keep all objects `.strict()`. Require `reviewNote` of 20–500 characters for rejected rows and forbid it on accepted rows so dispositions are explicit rather than prose-dependent.

- [ ] **Step 4: Write RED pilot-boundary and global-leakage tests**

Add tests that mutate an accepted professional-output quote, try to accept SSC01M alias `Ayudantes de dentista`, add an approved non-target link to the same CNO without an accepted output audit, and reverse every input array:

```ts
expect(() =>
  validateProgramOfficialAliasReview(dentalCandidate, fixtureContext),
).toThrow(/program-output boundary|semantic broadening/i);

expect(() => computeFpOfficialAliasPass(sharedCnoLeakageContext)).toThrow(
  /cross-program leakage|every approved program link/i,
);

expect(JSON.stringify(computeFpOfficialAliasPass(reversedContext))).toBe(
  JSON.stringify(computeFpOfficialAliasPass(fixtureContext)),
);
```

Also assert that every non-target program’s serialized `OfferMatch[]` is identical before/after.

- [ ] **Step 5: Run the focused test and verify the new RED failures**

Run: `rtk npx vitest run scripts/analysis/validateFpOfficialAliasPass.test.ts`

Expected: FAIL because program-output reconciliation, global-link enumeration, overlay matching, and deterministic summary generation are not implemented.

- [ ] **Step 6: Implement validation and controlled matching**

Implement these exact signatures and make the CLI call the disk loader:

```ts
export interface AliasPassValidationContext {
  baselineSnapshotId: string;
  reviews: readonly ProgramOfficialAliasReview[];
  pilotResults: FpCoveragePilotResults;
  programs: readonly TrainingProgram[];
  occupations: readonly Occupation[];
  aliases: readonly OccupationAlias[];
  links: readonly TrainingOccupationLink[];
  offers: readonly JobOffer[];
  publishedRequirements: readonly OfferPublishedRequirements[];
}

export function validateProgramOfficialAliasReview(
  value: unknown,
  context: AliasPassValidationContext,
): ProgramOfficialAliasReview;

export function computeFpOfficialAliasPass(
  context: AliasPassValidationContext,
): FpOfficialAliasPassResults;

export async function loadAliasPassValidationContext(
  rootDirectory = process.cwd(),
): Promise<AliasPassValidationContext>;

export function canonicalAliasIdentity(alias: {
  alias: string;
  occupationId: string;
}): string;

export async function validateFpOfficialAliasPassFromDisk(
  rootDirectory = process.cwd(),
): Promise<FpOfficialAliasPassResults>;
```

Reuse the matcher’s normalization semantics for collision simulation, but use an evidence-specific NFC/case/whitespace comparison that does not erase diacritic, token, number, or inflection differences. Overlay accepted aliases in memory; do not mutate the baseline arrays. Run `matchOffersForProgram` for every approved-link program before and after, stable-sort by program and offer ID, and reject non-target byte drift.

The CLI accepts no flags for validation and exactly one write flag. With `--write-results`, serialize `computeFpOfficialAliasPass(context)` using the repository’s deterministic JSON formatting to `analysis/fp_official_alias_pass_results.json`; reject any other argument. A second write with unchanged inputs must be byte-identical.

- [ ] **Step 7: Add the CLI and pass all focused tests**

Add `"analysis:aliases:validate": "tsx scripts/analysis/validateFpOfficialAliasPass.ts"` to `package.json`.

Run: `rtk npx vitest run scripts/analysis/validateFpOfficialAliasPass.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit and request two-stage Sol review**

```bash
rtk git add data/schemas/fpOfficialAliasPass.ts scripts/analysis/validateFpOfficialAliasPass.ts scripts/analysis/validateFpOfficialAliasPass.test.ts package.json
rtk git commit -m "test: add FP official alias audit contract"
```

The Sol reviewer must first verify exact spec coverage, then inspect normalization, global-link enumeration, and deterministic ordering. Fix Critical/Important findings before Tasks 2–4 start.

---

### Task 2: Audit HOT01M aliases against CNO 5110

**Files:**

- Create: `analysis/fp_official_alias_pass/HOT01M.json`
- Create: `scripts/analysis/fpOfficialAliasPass.HOT01M.test.ts`

**Interfaces:**

- Consumes: Task 1’s `validateProgramOfficialAliasReview`, the HOT01M accepted output audit in `analysis/fp_coverage_pilot_results.json`, and only official INE/SEPE classification material for CNO 5110.
- Produces: one complete `ProgramOfficialAliasReview` for `HOT01M`; it does not edit curated aliases or public data.

- [ ] **Step 1: Write the missing-file RED test**

```ts
import hotReview from "../../analysis/fp_official_alias_pass/HOT01M.json";
import {
  loadAliasPassValidationContext,
  validateProgramOfficialAliasReview,
} from "./validateFpOfficialAliasPass";

it("records a bounded HOT01M/CNO 5110 official-alias decision", async () => {
  const context = await loadAliasPassValidationContext(process.cwd());
  expect(() =>
    validateProgramOfficialAliasReview(hotReview, context),
  ).not.toThrow();
  expect(hotReview.programKey).toBe("HOT01M");
  expect(
    new Set(hotReview.reviews.map(({ occupationId }) => occupationId)),
  ).toEqual(new Set(["occupation:cno11:5110"]));
});
```

- [ ] **Step 2: Run the program test and verify RED**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.HOT01M.test.ts`

Expected: FAIL because `HOT01M.json` does not exist.

- [ ] **Step 3: Perform the bounded official review and create the audit**

Inspect only the CNO 5110 sections of official INE/SEPE classifications. Record `Cocineros asalariados` and every additional literal label/example encountered exactly once. Cross-check each against HOT01M’s accepted `Cocinero.` output. Accept only multiword phrases within that cook boundary; reject restaurant management, pastry/bakery, hospitality service, self-employed categories, duties, and one-word terms with the exact coded reason. Preserve exact quotes and URLs. If no safe candidate remains, keep all reviewed rows rejected.

- [ ] **Step 4: Run the program and shared validator tests**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.HOT01M.test.ts scripts/analysis/validateFpOfficialAliasPass.test.ts`

Expected: PASS, with the baseline HOT01M count still exactly `0` before overlay.

- [ ] **Step 5: Commit and request two-stage Sol review**

```bash
rtk git add analysis/fp_official_alias_pass/HOT01M.json scripts/analysis/fpOfficialAliasPass.HOT01M.test.ts
rtk git commit -m "docs: audit HOT01M official aliases"
```

The Sol reviewer verifies every accepted phrase against both sources and rejects any attempt to optimize for offer titles.

---

### Task 3: Audit SSC01M aliases against CNO 5629 and 5710

**Files:**

- Create: `analysis/fp_official_alias_pass/SSC01M.json`
- Create: `scripts/analysis/fpOfficialAliasPass.SSC01M.test.ts`

**Interfaces:**

- Consumes: Task 1’s validator, SSC01M’s accepted output audits and relationships, and only official INE/SEPE classification material for CNO 5629 and 5710.
- Produces: one complete `ProgramOfficialAliasReview` for `SSC01M`; it does not edit curated aliases or public data.

- [ ] **Step 1: Write the missing-file and dental-leakage RED test**

```ts
it("keeps SSC01M aliases inside accepted disability/home-care boundaries", async () => {
  const context = await loadAliasPassValidationContext(process.cwd());
  expect(() =>
    validateProgramOfficialAliasReview(sscReview, context),
  ).not.toThrow();
  const dental = sscReview.reviews.find(
    ({ alias }) => alias === "Ayudantes de dentista",
  );
  expect(dental).toMatchObject({
    occupationId: "occupation:cno11:5629",
    disposition: "rejected",
    reasonCode: "semantic_broadening",
  });
});
```

- [ ] **Step 2: Run the program test and verify RED**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.SSC01M.test.ts`

Expected: FAIL because `SSC01M.json` does not exist.

- [ ] **Step 3: Perform the bounded official review and create the audit**

Review every literal INE/SEPE label/example under 5629 and 5710. Tie 5629 candidates only to SSC01M’s accepted institutional/disability-care output and 5710 candidates only to its accepted home-care output. Record `Ayudantes de dentista` as rejected despite literal CNO membership because it lies outside SSC01M’s accepted boundary and SAN21 explicitly rejected dental support. Reject unrelated residual health roles, companionship without dependent care, and any label whose setting or duties exceed the accepted output. Preserve every exact source and program-output quote.

- [ ] **Step 4: Run program, shared, and historical pilot tests**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.SSC01M.test.ts scripts/analysis/validateFpOfficialAliasPass.test.ts scripts/analysis/validateFpCoveragePilot.test.ts`

Expected: PASS; historical SSC rejected-output assertions remain intact.

- [ ] **Step 5: Commit and request two-stage Sol review**

```bash
rtk git add analysis/fp_official_alias_pass/SSC01M.json scripts/analysis/fpOfficialAliasPass.SSC01M.test.ts
rtk git commit -m "docs: audit SSC01M official aliases"
```

The Sol reviewer must inspect CNO residual-category leakage and compare the audit with every SSC01M and SAN21 accepted/rejected professional-output record.

---

### Task 4: Audit EOC01M aliases against its five approved CNOs

**Files:**

- Create: `analysis/fp_official_alias_pass/EOC01M.json`
- Create: `scripts/analysis/fpOfficialAliasPass.EOC01M.test.ts`

**Interfaces:**

- Consumes: Task 1’s validator, EOC01M’s accepted output audits, and only official INE/SEPE classification material for CNO 7111, 7121, 7193, 7240, and 7291.
- Produces: one complete `ProgramOfficialAliasReview` for `EOC01M`; it does not edit curated aliases or public data.

- [ ] **Step 1: Write the missing-file and one-word-policy RED test**

```ts
it("records but does not publish EOC01M one-word official terms", async () => {
  const context = await loadAliasPassValidationContext(process.cwd());
  expect(() =>
    validateProgramOfficialAliasReview(eocReview, context),
  ).not.toThrow();
  for (const alias of ["Encofradores", "Tejadores", "Albañiles"]) {
    expect(eocReview.reviews).toContainEqual(
      expect.objectContaining({
        alias,
        disposition: "rejected",
        reasonCode: "matcher_policy_one_word",
      }),
    );
  }
});
```

- [ ] **Step 2: Run the program test and verify RED**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.EOC01M.test.ts`

Expected: FAIL because `EOC01M.json` does not exist.

- [ ] **Step 3: Perform the bounded official review and create the audit**

Review all literal labels/examples inside only the five approved CNOs. Cross-check each against the exact accepted EOC01M outputs for encofrado/hormigón, albañilería, impermeabilización, solado/alicatado, and cubiertas. Explicitly reject `Encofradores`, `Tejadores`, and `Albañiles` as `matcher_policy_one_word`; do not add an exception. Reject supervisory, licensed, regulated, engineering, machinery, adjacent finishing, and broader construction roles. Record every otherwise-valid multiword candidate even when its controlled after count is zero.

- [ ] **Step 4: Run program, shared, matcher, and curated-validator tests**

Run: `rtk npx vitest run scripts/analysis/fpOfficialAliasPass.EOC01M.test.ts scripts/analysis/validateFpOfficialAliasPass.test.ts src/domain/offerMatching.test.ts scripts/data/validateCuratedMappings.test.ts`

Expected: PASS with the generic one-word and bounded-phrase tests unchanged.

- [ ] **Step 5: Commit and request two-stage Sol review**

```bash
rtk git add analysis/fp_official_alias_pass/EOC01M.json scripts/analysis/fpOfficialAliasPass.EOC01M.test.ts
rtk git commit -m "docs: audit EOC01M official aliases"
```

The Sol reviewer verifies every CNO/output pairing and confirms no matcher-policy exception was introduced.

---

### Task 5: Integrate only accepted aliases and freeze controlled results

**Files:**

- Modify: `data/curated/occupation-aliases.json`
- Create: `analysis/fp_official_alias_pass_results.json`
- Modify: `scripts/analysis/validateFpOfficialAliasPass.test.ts`
- Modify: `scripts/data/validateCuratedMappings.test.ts`

**Interfaces:**

- Consumes: the three independently Sol-approved audits and Task 1’s `computeFpOfficialAliasPass`.
- Produces: curated rows in one-to-one correspondence with accepted audits and a validated `FpOfficialAliasPassResults` with exact counts and sorted offer IDs.

- [ ] **Step 1: Write RED audit/curated parity and scope tests**

```ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import eocReview from "../../analysis/fp_official_alias_pass/EOC01M.json";
import hotReview from "../../analysis/fp_official_alias_pass/HOT01M.json";
import sscReview from "../../analysis/fp_official_alias_pass/SSC01M.json";
import curatedAliases from "../../data/curated/occupation-aliases.json";
import {
  TARGET_OCCUPATIONS_BY_PROGRAM,
  canonicalAliasIdentity,
} from "./validateFpOfficialAliasPass";

const reviews = [hotReview, sscReview, eocReview];
const targetOccupationIds = new Set(
  Object.values(TARGET_OCCUPATIONS_BY_PROGRAM).flat(),
);
const curatedTargetAliases = curatedAliases.filter(({ occupationId }) =>
  targetOccupationIds.has(occupationId),
);
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const accepted = reviews
  .flatMap(({ reviews }) => reviews)
  .filter(({ disposition }) => disposition === "accepted")
  .map(({ alias, occupationId }) => ({ alias, occupationId }))
  .sort((left, right) =>
    canonicalAliasIdentity(left).localeCompare(canonicalAliasIdentity(right)),
  );

expect(
  curatedTargetAliases.map(({ alias, occupationId }) => ({
    alias,
    occupationId,
  })),
).toEqual(accepted);
expect(
  sha256(await readFile("data/curated/training-occupation-links.json")),
).toBe("d88a39543a4a9f444a49b4516fd0ce80ffbf28fefdf0cfab127b40ec431fb369");
expect(sha256(await readFile("data/curated/occupations.json"))).toBe(
  "a15ba35b58465e93972f393d2a10dae0c05ee92e67e65c4167a5009dfff41c96",
);
```

Add a negative case where one rejected row is copied into curated data and require `/rejected alias published/i`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `rtk npx vitest run scripts/analysis/validateFpOfficialAliasPass.test.ts scripts/data/validateCuratedMappings.test.ts`

Expected: FAIL when at least one audit is accepted because curated aliases/results do not yet agree; if all reviews are rejected, FAIL because the results artifact is missing.

- [ ] **Step 3: Add only accepted alias rows**

Construct the exact curated rows mechanically from validated accepted reviews, sort with the existing canonical alias identity, and copy the resulting JSON objects without editing their alias or occupation fields:

```ts
const acceptedCuratedRows = validatedReviews
  .flatMap(({ reviews }) => reviews)
  .filter(({ disposition }) => disposition === "accepted")
  .map(({ alias, occupationId }) => ({
    alias,
    occupationId,
    reviewStatus: "approved" as const,
    reviewedAt: "2026-08-09",
    mappingVersion: "1.0.0",
  }))
  .sort((left, right) =>
    canonicalAliasIdentity(left).localeCompare(canonicalAliasIdentity(right)),
  );
```

If `acceptedCuratedRows` is empty, leave `data/curated/occupation-aliases.json` byte-identical.

- [ ] **Step 4: Generate and check the controlled results JSON**

Run: `rtk npm run analysis:aliases:validate -- --write-results`

Expected: writes `analysis/fp_official_alias_pass_results.json` deterministically with baseline ID `20260808215403108-add4c517860c`, before count `0` for each target, exact after counts, sorted newly reached offer IDs, exact union count, and zero non-target deltas. A second run must produce no diff.

- [ ] **Step 5: Run integration, curated, matcher, and pilot gates**

Run: `rtk npx vitest run scripts/analysis/validateFpOfficialAliasPass.test.ts scripts/data/validateCuratedMappings.test.ts src/domain/offerMatching.test.ts scripts/analysis/validateFpCoveragePilot.test.ts`

Run: `rtk npm run analysis:aliases:validate`

Run: `rtk npm run analysis:pilot:validate`

Expected: all PASS. If controlled target counts remain zero, stop alias expansion here and carry the zero result forward; do not open other CNOs, programs, sources, or matching rules.

- [ ] **Step 6: Commit and request two-stage Sol integration review**

```bash
rtk git add data/curated/occupation-aliases.json analysis/fp_official_alias_pass_results.json scripts/analysis/validateFpOfficialAliasPass.test.ts scripts/data/validateCuratedMappings.test.ts
rtk git commit -m "feat: integrate reviewed FP official aliases"
```

The Sol reviewer compares every curated target row to an accepted audit, checks all non-target match bytes, and verifies the diff contains no link, occupation, CNO, cycle, schema, matcher, or privacy change.

---

### Task 6: Publish the standard snapshot and exact report

**Files:**

- Create: `scripts/analysis/renderFpOfficialAliasPassReport.ts`
- Create: `scripts/analysis/renderFpOfficialAliasPassReport.test.ts`
- Create: `analysis/fp_official_alias_pass_results.md`
- Modify: `package.json`
- Modify through pipeline only: `public/data/v1/manifest.json`
- Create through pipeline only: the immutable directory addressed by the new `public/data/v1/manifest.json`
- Modify only if needed to preserve historical tense: `scripts/analysis/renderFpCoveragePilotReport.ts`
- Modify only if the renderer changes: `scripts/analysis/renderFpCoveragePilotReport.test.ts`
- Modify only if the renderer changes: `analysis/fp_coverage_pilot_results.md`

**Interfaces:**

- Consumes: validated results JSON, three audits, current active manifest, and manifest-addressed resources.
- Produces: `renderFpOfficialAliasPassReport(results, manifest): string`, `assertRenderedFpOfficialAliasPassReport(actual, expected): void`, `analysis:aliases:report:check`, and a standard active snapshot containing exactly the accepted aliases.

- [ ] **Step 1: Write RED report and manifest-invariant tests**

```ts
import results from "../../analysis/fp_official_alias_pass_results.json";
import activeManifest from "../../public/data/v1/manifest.json";
import { renderFpOfficialAliasPassReport } from "./renderFpOfficialAliasPassReport";

const report = renderFpOfficialAliasPassReport(results, activeManifest);
expect(report).toContain("20260808215403108-add4c517860c");
for (const program of results.programs) {
  expect(report).toContain(
    `${program.programKey}: ${program.beforeOfferCount} → ${program.afterOfferCount}`,
  );
}
expect(activeManifest.resourceSnapshots.programs.recordCount).toBe(187);
expect(activeManifest.resourceSnapshots.occupations.recordCount).toBe(11);
expect(
  activeManifest.resourceSnapshots.trainingOccupationLinks.recordCount,
).toBe(12);
expect(activeManifest.resourceSnapshots.occupationAliases.recordCount).toBe(
  10 + results.acceptedAliasCount,
);
```

Assert byte-exact Markdown, final newline, sorted program order, zero-result wording, union count, current snapshot ID, limitations, and no stable catalog-wide claim.

- [ ] **Step 2: Run report tests and verify RED**

Run: `rtk npx vitest run scripts/analysis/renderFpOfficialAliasPassReport.test.ts`

Expected: FAIL because the renderer and report do not exist.

- [ ] **Step 3: Implement the exact renderer/checker**

Render these sections from typed data: `Resultado controlado`, `Alias aceptados y rechazados`, `Publicación`, `Límites`, and `Decisión`. When all deltas are zero, the decision sentence is exactly: `La pasada oficial acotada no aumenta las ofertas alcanzadas; no se amplían fuentes, CNO, ciclos ni reglas de coincidencia.`

Add scripts:

```json
"analysis:aliases:report:check": "tsx scripts/analysis/renderFpOfficialAliasPassReport.ts",
"analysis:aliases:report:write": "tsx scripts/analysis/renderFpOfficialAliasPassReport.ts --write"
```

- [ ] **Step 4: Build through the standard pipeline**

Run: `rtk npm run data:build`

Expected: a new immutable manifest-addressed snapshot is published last. Do not edit any generated JSON manually. Verify that target aliases in the active snapshot equal accepted audit aliases and that programs/occupations/training-link logical sets and record counts are unchanged.

- [ ] **Step 5: Regenerate results/report against the published manifest**

Run: `rtk npm run analysis:aliases:validate -- --write-results`

Run: `rtk npm run analysis:aliases:report:write`

Run both commands a second time and require `rtk git diff --exit-code -- analysis/fp_official_alias_pass_results.json analysis/fp_official_alias_pass_results.md` to exit 0.

- [ ] **Step 6: Preserve historical pilot truth**

Run: `rtk npm run analysis:pilot:report:check`

If it fails or its zero-alias sentence reads as a current-state claim, change only the pilot renderer sentence to `En la instantánea histórica del piloto, HOT01M, SSC01M y EOC01M tuvieron 0 ofertas marginales porque todavía no se habían admitido alias.` Regenerate the pilot Markdown and keep its 43-offer total and timing unchanged.

- [ ] **Step 7: Run report, distribution, and build gates**

Run: `rtk npx vitest run scripts/analysis/renderFpOfficialAliasPassReport.test.ts scripts/analysis/renderFpCoveragePilotReport.test.ts scripts/data/buildSnapshots.test.ts scripts/data/validatePublicDistribution.test.ts`

Run: `rtk npm run analysis:aliases:report:check`

Run: `rtk npm run analysis:pilot:report:check`

Expected: all PASS.

- [ ] **Step 8: Commit and request two-stage Sol publication review**

```bash
rtk git add package.json scripts/analysis/renderFpOfficialAliasPassReport.ts scripts/analysis/renderFpOfficialAliasPassReport.test.ts analysis/fp_official_alias_pass_results.json analysis/fp_official_alias_pass_results.md public/data/v1/manifest.json public/data/v1/snapshots scripts/analysis/renderFpCoveragePilotReport.ts scripts/analysis/renderFpCoveragePilotReport.test.ts analysis/fp_coverage_pilot_results.md
rtk git commit -m "docs: publish FP official alias pass results"
```

Git ignores unchanged optional pilot files. The Sol reviewer validates the active manifest paths/hashes, generated-only diff, exact report arithmetic, historical pilot tense, and record-count invariants.

---

### Task 7: Verify exact public UI coverage without changing production UI

**Files:**

- Modify: `src/features/training-first/TrainingResultsPage.test.tsx`
- Create: `tests/e2e/fp-official-alias-pass.spec.ts`
- Modify only if manifest-reviewed keys regress: `tests/e2e/home.spec.ts`

**Interfaces:**

- Consumes: active manifest, manifest-addressed resources, and `analysis/fp_official_alias_pass_results.json`.
- Produces: exact component and desktop/mobile journey assertions for all three targets; no new component or user-facing state.

- [ ] **Step 1: Write RED exact-count component tests**

For each target, install the active resource fixture and assert one of two exact outcomes:

```ts
if (program.afterOfferCount === 0) {
  expect(
    await screen.findByText(
      /No hay ofertas relacionadas en la instantánea del/u,
    ),
  ).toBeVisible();
  expect(screen.queryAllByRole("article")).toHaveLength(0);
} else {
  expect(await screen.findAllByRole("article")).toHaveLength(
    program.afterOfferCount,
  );
}
```

Also assert that every rendered match’s alias evidence is one of the accepted audit rows for that program’s approved CNO.

- [ ] **Step 2: Run the component test and verify RED**

Run: `rtk npx vitest run src/features/training-first/TrainingResultsPage.test.tsx`

Expected: FAIL because the exact target-program cases are absent.

- [ ] **Step 3: Complete fixture wiring without production changes**

Load the active manifest-addressed programs, offers, requirements, occupations, aliases, and links in the test fixture. Do not hard-code a parallel alias list or change `TrainingResultsPage.tsx`.

- [ ] **Step 4: Write and run exact Playwright journeys**

```ts
import results from "../../analysis/fp_official_alias_pass_results.json";

for (const program of results.programs) {
  test(`${program.programKey} exposes the validated alias-pass count`, async ({
    page,
  }) => {
    await page.goto(`/desde-fp/${program.programKey}`);
    await expect(page.getByRole("article")).toHaveCount(
      program.afterOfferCount,
    );
    if (program.afterOfferCount === 0) {
      await expect(
        page.getByText(/No hay ofertas relacionadas en la instantánea/u),
      ).toBeVisible();
    }
  });
}
```

Run: `rtk npx playwright test tests/e2e/fp-official-alias-pass.spec.ts --project=chromium-desktop --project=chromium-mobile`

Expected: PASS with exact counts from validated results.

- [ ] **Step 5: Re-run unchanged home coverage truth**

Run: `rtk npx playwright test tests/e2e/home.spec.ts --project=chromium-desktop --project=chromium-mobile`

Expected: PASS with six reviewed programs, HOT01M/SSC01M/EOC01M still present, and `COM01M` absent. Alias additions must not change link coverage.

- [ ] **Step 6: Commit and request two-stage Sol UI review**

```bash
rtk git add src/features/training-first/TrainingResultsPage.test.tsx tests/e2e/fp-official-alias-pass.spec.ts tests/e2e/home.spec.ts
rtk git commit -m "test: verify FP official alias UI coverage"
```

Git ignores the unchanged home test. The Sol reviewer verifies exact count sourcing, dated zero-state semantics, desktop/mobile coverage, accessibility, and absence of production UI or privacy changes.

---

### Task 8: Run the whole-pass release gate and final independent review

**Files:**

- Review only: all files changed since the pre-pass base
- Modify only through a focused Terra fix commit when a Sol finding requires it

**Interfaces:**

- Consumes: Tasks 1–7 and their reviewed commits.
- Produces: one evidence-backed release decision: publish the bounded result or stop with a validated zero result; no scope expansion.

- [ ] **Step 1: Run the complete deterministic gate**

```bash
rtk npm run analysis:aliases:validate
rtk npm run analysis:aliases:report:check
rtk npm run analysis:pilot:validate
rtk npm run analysis:pilot:report:check
rtk npm test
rtk npm run test:e2e
rtk npm run lint
rtk npm run build
rtk npm run license:check
rtk npm run format:check
rtk git diff --check
rtk rg -ni "que[-]estudio([.]es)?" . --glob "!node_modules/**" --glob "!.git/**"
```

Expected: every command passes; the forbidden-reference scan returns zero matches.

- [ ] **Step 2: Prove the bounded diff invariants**

Compare the pre-pass base with `HEAD` and require:

- no change to `data/curated/training-occupation-links.json`, `data/curated/occupations.json`, matcher source, alias schema, program source, qualification catalogs, privacy code, or production components;
- every new curated alias corresponds one-to-one with an accepted audit and every rejected audit stays unpublished;
- every accepted alias has both literal INE/SEPE evidence and accepted program-output evidence;
- every non-target program has byte-identical before/after matches on the pinned snapshot;
- exact target counts and union delta agree across validator, JSON, Markdown, snapshot, component tests, and Playwright;
- generated resources came from the standard pipeline and the manifest hashes resolve.

- [ ] **Step 3: Dispatch fresh Sol whole-branch reviews**

One Sol reviewer performs spec compliance; a second fresh Sol reviewer performs code/data quality with special attention to CNO residual categories, global alias propagation, deterministic counting, historical report truth, privacy, and forbidden references. Reviewers do not share conclusions before filing findings.

- [ ] **Step 4: Route findings through one bounded Terra fix wave**

Fix only Critical/Important findings. Re-run the smallest relevant RED/GREEN test, then the complete gate in Step 1. Commit each coherent fix as `fix: harden FP official alias pass` and request scoped Sol re-review.

- [ ] **Step 5: Record the decision and stop at the approved boundary**

If the validated union delta is zero, report the bounded zero result and stop. If it is positive, publish only the already-validated aliases and exact snapshot counts. In both cases, do not add single-word exceptions, adjacent CNOs, new program links, new cycles, external sources, or matcher changes; each requires a new approved spec.
