# SALIDA CyL Decision Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement both approved decision journeys with reviewed occupation mappings, quote-backed requirement extraction, ephemeral user answers and the closed reliable-action engine.

**Architecture:** Pure domain modules produce evidence and actions from generated snapshots plus versioned curated mappings. React feature modules render the approved vertical evidence layouts; no session answer is serialized or transmitted.

**Tech Stack:** React, TypeScript, Zod, MiniSearch, Radix UI, Lucide, Vitest, Testing Library and Playwright.

## Global Constraints

- Complete `2026-08-04-salida-cyl-foundation-data.md` first.
- Source code and identifiers are English; public UI is Spanish.
- No runtime AI, compatibility percentage, traffic-light eligibility or hidden ranking.
- A declared gap requires an exact published source quote and an in-memory `lacks` answer.
- Only mappings with `reviewStatus: "approved"` are visible.
- `formacion-del-ecyl` is never an automatic action target.
- Every shell command starts with `rtk`; every task follows test-first development and ends in a commit.

---

## File structure locked by this plan

```text
data/curated/occupations.json              controlled occupation catalog
data/curated/occupation-aliases.json       reviewed everyday synonyms
data/curated/training-occupation-links.json approved cited relationships
data/curated/official-procedures.json       regulated-action targets
src/domain/occupation.ts                    occupation and mapping schemas
src/domain/requirements.ts                  categories and extracted evidence
src/domain/offerMatching.ts                 deterministic occupation matching
src/domain/actionEngine.ts                  closed action catalog
src/domain/session.ts                       ephemeral answers and checklist
src/features/training-first/                exact-program journey
src/features/occupation-first/              controlled-occupation journey
src/components/EvidenceDisclosure.tsx       auditable source detail
src/components/RequirementRow.tsx           published requirement + answer
src/components/ActionPanel.tsx              action rendering by target kind
```

### Task 1: Reviewed occupation catalog and relationship contracts

**Files:**
- Create: `src/domain/occupation.ts`
- Create: `data/schemas/curatedMappings.ts`
- Create: `data/curated/occupations.json`
- Create: `data/curated/occupation-aliases.json`
- Create: `data/curated/training-occupation-links.json`
- Create: `scripts/data/validateCuratedMappings.ts`
- Test: `scripts/data/validateCuratedMappings.test.ts`

**Interfaces:**
- Consumes: `TrainingProgram` IDs from the foundation snapshot.
- Produces: `Occupation`, `OccupationAlias`, `TrainingOccupationLink`, `loadApprovedMappings()`.

- [ ] **Step 1: Write failing mapping-validation tests**

```ts
it("rejects a visible relationship without approval and citation", () => {
  expect(() => validateTrainingOccupationLinks([{ 
    trainingProgramKey: "IFC03S",
    occupationId: "occupation:web-development",
    relationshipType: "official_output",
    reviewStatus: "draft",
    sourceUrl: "",
    sourceQuote: ""
  }])).toThrow(/approved mapping requires source/i);
});

it("accepts multiple reviewed aliases only after occupation confirmation", () => {
  const index = buildOccupationIndex(occupations, aliases);
  expect(index.search("desarrollador web")[0].occupationId).toBe("occupation:web-development");
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- scripts/data/validateCuratedMappings.test.ts`  
Expected: FAIL because schemas and validators are missing.

- [ ] **Step 3: Implement schemas and review gate**

```ts
export const RelationshipTypeSchema = z.enum(["official_output", "reviewed_relationship"]);
export const ReviewStatusSchema = z.enum(["draft", "approved", "rejected"]);

export const TrainingOccupationLinkSchema = z.object({
  trainingProgramKey: z.string().min(1),
  occupationId: z.string().min(1),
  relationshipType: RelationshipTypeSchema,
  reviewStatus: ReviewStatusSchema,
  sourceUrl: z.string().url(),
  sourceQuote: z.string().min(12),
  reviewedAt: z.string().date(),
  mappingVersion: z.string().regex(/^\d+\.\d+\.\d+$/)
});
```

Validation checks that referenced program and occupation IDs exist and filters production output to `approved` only.

- [ ] **Step 4: Seed a citation-backed vertical slice**

Create approved mappings for representative programs used by the demo and tests, including `Desarrollo de Aplicaciones Web` and `Gestión Administrativa`. Each relationship must contain the exact official source URL and a short source excerpt. Mark all candidate mappings without completed review as `draft`; drafts are excluded from generated public data.

- [ ] **Step 5: Integrate curated validation into snapshot generation**

`buildSnapshots.ts` calls `validateCuratedMappings` after training normalization and writes:

```text
public/data/v1/occupations.json
public/data/v1/occupation-aliases.json
public/data/v1/training-occupation-links.json
public/data/v1/mapping-coverage.json
```

Coverage reports exact counts by program, family and review status without pretending that uncovered programs have no occupational outputs.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- scripts/data/validateCuratedMappings.test.ts
rtk npm run data:build
rtk npm run build
rtk git add data/curated data/schemas scripts/data src/domain public/data/v1
rtk git commit -m "feat: add reviewed occupation mapping contracts"
```

### Task 2: Quote-backed requirement extraction

**Files:**
- Create: `src/domain/requirements.ts`
- Create: `scripts/data/extractRequirements.ts`
- Modify: `data/schemas/generated.ts`
- Modify: `scripts/data/normalizeOffers.ts`
- Create: `tests/fixtures/requirements/qualification.json`
- Create: `tests/fixtures/requirements/experience.json`
- Create: `tests/fixtures/requirements/license-language-mobility.json`
- Create: `tests/fixtures/requirements/ambiguous.json`
- Test: `scripts/data/extractRequirements.test.ts`

**Interfaces:**
- Consumes: an official offer ID and `SanitizedOfferDescription.sections.requirements`.
- Produces: `extractPublishedRequirements(offerId, description): PublishedRequirement[]`.

- [ ] **Step 1: Write failing category and ambiguity tests**

```ts
it("preserves an exact quote for a published driving-license requirement", () => {
  expect(extractPublishedRequirements("offer:1", requirements(["Permiso de conducir B y vehículo propio."])))
    .toContainEqual(expect.objectContaining({
      category: "driving_license_or_vehicle",
      sourceQuote: "Permiso de conducir B y vehículo propio.",
      normalizedValue: "B"
    }));
});

it("does not force ambiguous prose into a structured category", () => {
  expect(extractPublishedRequirements("offer:2", requirements(["Se valorarán capacidades adecuadas."])))
    .toEqual([{ category: "unclassified", sourceQuote: "Se valorarán capacidades adecuadas.", normalizedValue: null }]);
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- scripts/data/extractRequirements.test.ts`  
Expected: FAIL because the extractor is missing.

- [ ] **Step 3: Implement the closed requirement union**

```ts
export type RequirementCategory =
  | "qualification_or_specialization"
  | "experience"
  | "driving_license_or_vehicle"
  | "certificate_or_regulated_license"
  | "language"
  | "schedule_availability"
  | "mobility_or_work_mode"
  | "unclassified";

export interface PublishedRequirement {
  id: string;
  category: RequirementCategory;
  normalizedValue: string | number | null;
  sourceQuote: string;
  parserRule: string;
  parserVersion: "1.0.0";
}
```

IDs are deterministic hashes of offer ID, category and source quote. Each rule is explicit and named, such as `experience.months`, `license.driving_b`, `language.cefr`, `work_mode.remote`.

- [ ] **Step 4: Implement conservative rules**

Parse only explicit phrases in the requirements section. Preserve every matched sentence or list item as `sourceQuote`. When two rules conflict or a normalized value cannot be proven, return `unclassified`. Absence produces no requirement object.

- [ ] **Step 5: Add extraction to the data pipeline**

`normalizeOffers` attaches `publishedRequirements` after sanitization. Store remote/hybrid/on-site evidence separately in the same requirement union so location logic can inspect it before filtering.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- scripts/data/extractRequirements.test.ts
rtk npm run data:build
rtk npm test
rtk git add src/domain/requirements.ts scripts/data tests/fixtures/requirements public/data/v1
rtk git commit -m "feat: extract quote-backed offer requirements"
```

### Task 3: Deterministic offer matching and evidence states

**Files:**
- Create: `src/domain/offerMatching.ts`
- Create: `src/domain/evidence.ts`
- Test: `src/domain/offerMatching.test.ts`
- Test: `src/domain/evidence.test.ts`

**Interfaces:**
- Consumes: approved occupations/aliases, `JobOffer`, `PublishedRequirement`, `SessionAnswer`.
- Produces: `matchOffersForProgram(programKey, data): OfferMatch[]` and `deriveEvidenceState(match, answers): EvidenceState`.

- [ ] **Step 1: Write failing deterministic matching tests**

```ts
it("matches an offer through a reviewed occupation alias and records the evidence", () => {
  const matches = matchOffersForProgram("ADG01M", fixtureData);
  expect(matches[0]).toMatchObject({
    offerId: "offer:1",
    occupationId: "occupation:administrative-assistant",
    matchRule: "title_alias_exact",
    relationshipType: "official_output"
  });
});

it("never creates a gap from an unpublished requirement", () => {
  expect(deriveEvidenceState(matchWithoutLicenseRequirement, {})).toBe("occupational_relationship_incomplete");
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- src/domain/offerMatching.test.ts src/domain/evidence.test.ts`  
Expected: FAIL because matching and evidence modules are missing.

- [ ] **Step 3: Implement closed match rules**

Allowed rules are `title_alias_exact`, `title_alias_phrase`, `published_qualification_exact` and `human_override`. Normalize case, diacritics and punctuation. Whole words and reviewed phrases are required; generic one-word aliases such as `técnico` are rejected by curated validation.

- [ ] **Step 4: Implement evidence-state derivation**

```ts
export type EvidenceState =
  | "explicit_fit"
  | "occupational_relationship_incomplete"
  | "declared_explicit_gap";
```

`declared_explicit_gap` requires a `PublishedRequirement.id` and an in-memory answer of `lacks`. `explicit_fit` requires published qualification evidence or an exact approved occupation match with no declared gap. Everything else stays incomplete; there is no score.

- [ ] **Step 5: Verify deterministic ordering**

Sort results by evidence state group, publication date descending and stable offer ID. Do not sort by a fabricated numerical compatibility value.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- src/domain/offerMatching.test.ts src/domain/evidence.test.ts
rtk npm test
rtk git add src/domain
rtk git commit -m "feat: derive auditable offer evidence states"
```

### Task 4: Closed action engine and in-memory session state

**Files:**
- Create: `src/domain/actionEngine.ts`
- Create: `src/domain/session.ts`
- Create: `data/curated/official-procedures.json`
- Test: `src/domain/actionEngine.test.ts`
- Test: `src/domain/session.test.ts`

**Interfaces:**
- Consumes: `EvidenceState`, `PublishedRequirement`, location/work-mode evidence and official procedure mappings.
- Produces: `deriveActions(context): ReliableAction[]`, `useDecisionSession()`.

- [ ] **Step 1: Write failing target-contract tests**

```ts
it("sends requirement verification to the original offer", () => {
  expect(deriveActions(incompleteContext)[0]).toMatchObject({
    actionType: "verify_offer_requirements",
    targetKind: "external_offer",
    datasetKey: "ofertas-de-empleo",
    href: incompleteContext.offer.originalUrl
  });
});

it("sends regulated education to the official FP offering dataset", () => {
  expect(deriveActions(missingQualificationContext)).toContainEqual(expect.objectContaining({
    actionType: "view_regulated_training_route",
    targetKind: "regulated_training",
    datasetKey: "oferta-de-formacion-profesional"
  }));
});

it("checks remote evidence before producing a location action", () => {
  expect(deriveActions(remoteOfferOutsideProvince).map((item) => item.actionType))
    .not.toContain("adjust_search_area");
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- src/domain/actionEngine.test.ts src/domain/session.test.ts`  
Expected: FAIL because engine and session store are absent.

- [ ] **Step 3: Implement the seven-action discriminated union**

Define exactly the seven `actionType` values from the approved specification. `ReliableAction` is a discriminated union whose `targetKind` and `datasetKey` are fixed for each action type; TypeScript must make an invalid pairing impossible.

- [ ] **Step 4: Implement ephemeral session state**

`useDecisionSession` stores answers and checklist items in React state only. `SessionAnswer` is the exact union `"has" | "lacks" | "unsure"`. The hook exposes `answerRequirement`, `addChecklistItem`, `removeChecklistItem` and `clearSession`. Do not call `localStorage`, `sessionStorage`, `fetch`, `sendBeacon` or history state.

- [ ] **Step 5: Add a forbidden-API privacy test**

Render the hook, answer a requirement and assert that spies for `Storage.prototype.setItem`, `window.fetch` and `navigator.sendBeacon` receive no calls.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- src/domain/actionEngine.test.ts src/domain/session.test.ts
rtk npm test
rtk git add src/domain data/curated/official-procedures.json
rtk git commit -m "feat: add reliable action engine and private session state"
```

### Task 5: Training-first vertical evidence experience

**Files:**
- Create: `src/features/training-first/TrainingSearchPage.tsx`
- Create: `src/features/training-first/TrainingResultsPage.tsx`
- Create: `src/features/training-first/OfferEvidenceCard.tsx`
- Create: `src/components/RequirementRow.tsx`
- Create: `src/components/EvidenceDisclosure.tsx`
- Create: `src/components/ActionPanel.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/features/training-first/TrainingResultsPage.test.tsx`

**Interfaces:**
- Consumes: generated-data client, `matchOffersForProgram`, `deriveEvidenceState`, `deriveActions`, `useDecisionSession`.
- Produces: `/desde-fp` and `/desde-fp/:programKey` routes.

- [ ] **Step 1: Write the failing complete-card test**

```tsx
it("renders evidence in the approved narrative order", async () => {
  render(<TrainingResultsPage programKey="ADG01M" data={fixtureData} />);
  const headings = screen.getAllByRole("heading").map((node) => node.textContent);
  expect(headings).toEqual(expect.arrayContaining([
    "Por qué aparece",
    "Qué publica la vacante",
    "Tu comprobación",
    "Siguiente acción"
  ]));
  expect(screen.queryByText(/% de compatibilidad/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Verify red test**

Run: `rtk npm test -- src/features/training-first/TrainingResultsPage.test.tsx`  
Expected: FAIL because feature components are missing.

- [ ] **Step 3: Implement exact-program search**

Use a labeled combobox over official program titles and keys. The route is not entered until the user selects a valid option. Province is an optional labeled filter. The submit action keeps a visible text label and search icon.

- [ ] **Step 4: Implement the vertical card**

Each card renders relationship evidence, published requirements with exact quote disclosures, three answer controls and an adjacent action panel. `EvidenceDisclosure` includes source URL, source date, mapping version and parser rule. Long explanations stay collapsed by default.

- [ ] **Step 5: Implement empty and stale states**

Use the exact distinctions:

- `No hay ofertas relacionadas en la instantánea del <date>.` — never “there are no jobs”.
- `Aún no hay una relación revisada para este ciclo.` — link back to program search.
- Stale snapshot warning remains visible above results.

- [ ] **Step 6: Verify interaction and commit**

Run:

```powershell
rtk npm test -- src/features/training-first/TrainingResultsPage.test.tsx
rtk npm run build
rtk git add src/features/training-first src/components src/app/routes.tsx
rtk git commit -m "feat: add training-first evidence journey"
```

### Task 6: Occupation-first confirmed autocomplete and explained routes

**Files:**
- Create: `src/features/occupation-first/OccupationSearchPage.tsx`
- Create: `src/features/occupation-first/OccupationResultsPage.tsx`
- Create: `src/features/occupation-first/OccupationCombobox.tsx`
- Create: `src/features/occupation-first/TrainingRouteCard.tsx`
- Modify: `src/app/routes.tsx`
- Test: `src/features/occupation-first/OccupationSearchPage.test.tsx`
- Test: `src/features/occupation-first/OccupationResultsPage.test.tsx`

**Interfaces:**
- Consumes: approved occupations, aliases, training links, programs, offerings and centers.
- Produces: `/desde-ocupacion` and `/desde-ocupacion/:occupationId` routes.

- [ ] **Step 1: Write failing confirmation test**

```tsx
it("requires confirmation of a controlled occupation", async () => {
  const user = userEvent.setup();
  render(<OccupationSearchPage data={fixtureData} />);
  await user.type(screen.getByRole("combobox", { name: /ocupación/i }), "desarrollador web");
  expect(screen.getByRole("option", { name: /programación web/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /ver rutas/i })).toBeDisabled();
  await user.click(screen.getByRole("option", { name: /programación web/i }));
  expect(screen.getByRole("button", { name: /ver rutas/i })).toBeEnabled();
});
```

- [ ] **Step 2: Verify red tests**

Run: `rtk npm test -- src/features/occupation-first`  
Expected: FAIL because feature modules do not exist.

- [ ] **Step 3: Implement accessible controlled autocomplete**

Use MiniSearch over preferred labels and approved aliases. Results announce count through an `aria-live="polite"` region. Typing never changes the confirmed occupation; only selecting an option does. An unmatched term displays `No encontramos una ocupación revisada con ese nombre.`

- [ ] **Step 4: Implement explained route cards**

Cards display the confirmed occupation, official/reviewed relationship label, cited explanation, program level, available centers and modalities. They are sorted by `official_output` before `reviewed_relationship`, then official program title—not by score.

- [ ] **Step 5: Add center disclosure**

The `Ver dónde estudiarlo` action expands or links to official offerings grouped by province, with center name, modality and source freshness. No map is required in this release.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
rtk npm test -- src/features/occupation-first
rtk npm run build
rtk git add src/features/occupation-first src/app/routes.tsx
rtk git commit -m "feat: add confirmed occupation training routes"
```

### Task 7: End-to-end privacy and decision-flow checkpoint

**Files:**
- Create: `tests/e2e/training-first.spec.ts`
- Create: `tests/e2e/occupation-first.spec.ts`
- Create: `tests/e2e/privacy.spec.ts`

**Interfaces:**
- Consumes: both completed public journeys.
- Produces: browser-verified decision flows and privacy regression coverage.

- [ ] **Step 1: Write both successful journey tests**

Training test selects `Gestión Administrativa`, opens a result, marks a published requirement `No lo tengo`, verifies `Brecha declarada` and checks that the action wording says `no se publica este requisito`.

Occupation test types an alias, confirms the controlled occupation, opens a route and verifies an official center and modality from the generated snapshot.

- [ ] **Step 2: Write the network privacy test**

Record all requests after initial static data loading. Answer requirements and modify the checklist. Assert there are no POST/PUT/PATCH/DELETE requests and no request URL contains requirement IDs or answer values.

- [ ] **Step 3: Run tests and fix only observed failures**

Run: `rtk npx playwright test tests/e2e/training-first.spec.ts tests/e2e/occupation-first.spec.ts tests/e2e/privacy.spec.ts`  
Expected: PASS on desktop and mobile projects.

- [ ] **Step 4: Run the complete decision-flow gate**

```powershell
rtk npm run lint
rtk npm test
rtk npm run data:build
rtk npx playwright test
rtk npm run build
```

Expected: all exit 0; no unreviewed mapping is present in `public/data/v1/training-occupation-links.json`.

- [ ] **Step 5: Commit checkpoint**

```powershell
rtk git add tests/e2e
rtk git commit -m "test: verify private end-to-end decision flows"
```
