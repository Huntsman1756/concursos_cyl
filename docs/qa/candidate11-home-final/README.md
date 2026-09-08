# Candidate.11 — final Home polish

Base: `6f2d49554501aff58f1f623b4b0733973b46cf78`, including comparator fix
`a10bcfa37f29a88f7e80b0722f59d029a189f9ac`. Work performed on the new branch
`fix/candidate11-home-final`; no changes incorporated from the dirty
`candidate11-polish` worktree. Candidate.10 remains
`4b67443c4cb1b29347eef38d751eb4f8d02cb2a9`.

## Changes

The lower Home section now explains outcomes: the cycle's career options,
the training related to a profession, and an offer's requirements. It retains
all three explanations, images, destinations and accessible links. Small
images, unframed articles, no decorative numbering and normal-weight links
make it secondary to the unchanged hero selector. The styles are scoped to Home.

Home's final transparency block now presents the data providers and the existing
methodology/open-data links without repeating the review model or copy date.
The metric help trigger remains beside a descriptive label; its disclosure,
all metric dates, freshness states and claim-specific caveats are unchanged.

## Provenance inventory

Counts are case-insensitive whole terms in the loaded default desktop Home,
including the unchanged header/footer. They exclude accessible-only labels,
closed disclosures and transient loading text. Singular and plural terms are
counted separately, not stemmed. The table covers all requested terms, including
zero occurrences. The two shell links account for two of the three occurrences
of “metodología”; Home itself retains one.

| Term            | Before | After |
| --------------- | -----: | ----: |
| fuente          |      3 |     2 |
| fuentes         |      2 |     0 |
| evidencia       |      1 |     1 |
| evidencias      |      0 |     0 |
| revisada        |      3 |     3 |
| revisado        |      0 |     0 |
| revisión        |      1 |     0 |
| copia           |      4 |     3 |
| actualización   |      0 |     0 |
| metodología     |      3 |     3 |
| fecha           |      3 |     1 |
| datos oficiales |      1 |     1 |

### A — essential claim/metric interpretation, retained

- “relación revisada” in the profession explanation: limits the promise to
  reviewed relationships.
- “fuente consultada el” twice, with 22 August 2026 dates: identifies the
  source consultation dates for 187 cycles and 229 centers.
- “ofertas con relación FP revisada” and “evidencia generada el 30 de agosto
  de 2026”: defines the 138-offer subset and its evidence date.
- “Relaciones revisadas · copia consultada el 22 de agosto de 2026”: scopes
  the relationship freshness separately from the active build.
- “Copia activa generada el 30 de agosto de 2026”: identifies the active copy
  without presenting its generation date as every source's update date.
- “Relación oficial revisada”, its 12 August 2026 date and TodoFP attribution
  in the concrete example.
- “Oferta de la copia consultada” and its ECYL publication date: does not
  imply the example remains an open vacancy today.

### B — useful trust and transparency, retained once in Home's editorial body

- Hero: “Datos oficiales, revisados y con fecha”. The plural “revisados” is
  not included in the separate singular “revisado” row.
- One provider attribution: Junta de Castilla y León (ECYL), SEPE, TodoFP and
  BOE, now available without waiting for the freshness request.
- The existing Metodología and Datos abiertos destinations. Shared shell
  navigation remains untouched.
- The AI-image disclaimer remains precise and unchanged.

### C — repetition, removed or simplified

- “Cada cifra indica la fecha de su propia fuente” becomes “Relaciones entre
  ciclos y profesiones”, a useful label for the unchanged explanatory disclosure.
  Each figure still carries its own date and date-kind label.
- “Cada dato, con su origen y su fecha” becomes the quieter “Sobre los datos”.
- The paragraph explaining public sources and review criteria is replaced by
  the single named-provider attribution; detailed criteria remain in Metodología.
- The final provider/date sentence no longer repeats “Relaciones revisadas:
  copia del 22 de agosto de 2026”; that dated fact remains by the metrics.

### Conditional and on-demand content, unchanged

- Selecting a profession adds the existing “Las rutas FP solo se muestran
  cuando su relación está revisada” caveat (A).
- The “Qué es una relación revisada” help explains a reviewed relationship,
  its official source, date and published review (A). Its two “revisada”, one
  “fuente”, one “fecha” and one “revisión” are outside the closed-state counts.
- Loading date announcements, accessible region labels, legacy source-date
  fallback and the stale-copy warning remain unchanged (A).
- The offer-mode “Copia el puesto…” string in the task definition is not
  rendered; it is not a visible provenance occurrence.

## Visual inspection

Full-page Chromium captures were inspected for both default and selected
profession states at every required viewport. These are visual self-review
results, supplemented by DOM geometry/overflow measurements and Axe, not an
independent-context review or a new general product audit.

| Viewport   | Default                     | Profession selected            | Result                                                                                         |
| ---------- | --------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| 1440 × 900 | [Capture](1440-default.png) | [Capture](1440-profession.png) | Hero primary; explanations secondary; transparency balanced; no overflow or new visual defects |
| 1280 × 900 | [Capture](1280-default.png) | [Capture](1280-profession.png) | Same; aligned explanation links and no card imbalance                                          |
| 390 × 844  | [Capture](390-default.png)  | [Capture](390-profession.png)  | Same; readable stacking without duplicated primary CTAs                                        |
| 360 × 800  | [Capture](360-default.png)  | [Capture](360-profession.png)  | Same; wrapping and transparency links remain readable                                          |
| 320 × 568  | [Capture](320-default.png)  | [Capture](320-profession.png)  | Same; no clipping in changed content or horizontal overflow                                    |

[Before, 1440px](before-1440.png) shows the previous competing numbered cards
and repeated transparency block. No text-size token was reduced in the lower
explanations. The final transparency block uses existing supporting-text and
heading styles instead of landing-page lead typography.

Hero image width × height is identical to the base and unchanged by profession
selection: 529.203125 × 661.5, 525.609375 × 657, 358 × 268.5, 328 × 246 and
288 × 216 pixels respectively. On mobile the selected form naturally moves
the image downward; its dimensions and crop remain unchanged.

[Measurement record](visual-checks.json) records zero horizontal overflow,
zero Axe violations in all five selected states, and zero observed console
errors or HTTP error responses during these local Home captures. Default
desktop/mobile Axe is also covered by the unchanged Home E2E suite.

## Data identity

[Data verification](data-integrity.json) checks all 22 manifest-addressed
resource hashes against both the manifest and the pre-edit records. No drift.
Manifest SHA-256:
`e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df`.
Snapshot: `20260830120000000-8c6c79fbd2a1`.
Actual records: 187 programs, 229 centers, 1058 offers, 138 offers with reviewed
relations, 264 approved training/occupation relations, 35 aliases.

## Validation

| Command                                                           | Result                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| `npm test -- src/features/home/HomePage.test.tsx`                 | 14 passed                                                |
| `npm run test:e2e:chromium -- tests/e2e/home.spec.ts --workers=2` | 26 passed                                                |
| `npm run test:release -- --maxWorkers=2`                          | 1347 passed; 178 existing skips across 22 suites         |
| `npm run test:e2e:chromium -- --workers=2`                        | Final run: 264 passed; 6 existing project-specific skips |
| `npm run typecheck`                                               | Passed                                                   |
| `npm run lint`                                                    | Passed                                                   |
| `npm run format:check`                                            | Passed                                                   |
| `npm run build`                                                   | Passed                                                   |
| `npm run qa:assets:check`                                         | Passed: 3,509,014 / 3,600,000 bytes                      |
| `npm run qa:distribution:check`                                   | Passed: 22 resources, 25 files, no duplicate content     |
| `npm run release:candidate:verify`                                | Passed: 22 resources, 116 SEPE records                   |
| `npm run license:check`                                           | Passed: 363 locked entries                               |
| `npm run contest:submission:check`                                | Passed                                                   |
| `git diff --check`                                                | Passed                                                   |

The first full E2E attempt exposed an old Home link-name expectation in the
scroll-restoration test. Only that directly affected name was updated; the
navigation and restoration assertions remain unchanged. Three other transient
load failures occurred in that attempt while another build ran concurrently.
The final complete E2E run above used a stable build without concurrent
compilation and passed without retries or test weakening. The unit run emits
the existing jsdom `scrollTo` diagnostic; it completed successfully.

The existing candidate.11 regression suites verify unchanged hero keyboard/tab
semantics and image geometry, numbered comparator fieldset headings without
fake progress circles, no nested picker scroll, one “Media anual” per series,
“En esta página” profession navigation, historical More Training wording,
10-offer/25-center page sizes and textual “Fuente y revisión” disclosures.
No non-Home product source or behavior was changed.

No release, tag, deployment, main reconciliation or documentary-package edit
is part of this task. No additional product improvements were pursued.
