# Design QA — home SALIDA CyL

- Source visual truth: `G:\_Descargas\ChatGPT Image 11 ago 2026, 22_13_40.png`
- Implementation screenshot: `F:\castilla_leon_rev2\.worktrees\salida-cyl-development\home-redesign-desktop.png`
- Mobile screenshot: `F:\castilla_leon_rev2\.worktrees\salida-cyl-development\home-redesign-mobile.png`
- Viewports: desktop 1440 × 900 CSS px; mobile 390 × 844 CSS px.
- Pixel dimensions: source 1672 × 941 px (includes browser chrome); the implementation captures exclude the in-app browser scrollbar gutter.
- Density normalization: screenshots were compared at 1× CSS density by proportional page geometry. The source browser chrome was excluded from layout judgments; the in-app browser screenshot excludes its scrollbar gutter.
- State: home loaded with the current manifest; selectors empty; no stale-data warning; three deterministically selected reviewed programs visible.

## Full-view comparison evidence

The reference and final desktop screenshot were opened together. Both use the same visual order and near-equivalent proportions: compact white header, two-line left-aligned hero, two primary entry cards plus one coverage panel, one trust strip, one divided secondary-access surface, one methodology strip and a compact burgundy footer. The implementation preserves the reference's low density, neutral border treatment, restrained shadows, 34/34/32 workspace balance and burgundy/gold emphasis.

Intentional differences are required by product truth: the implementation omits the Junta shield and copyright, identifies SALIDA CyL as independent, uses the current manifest date, shows only real reviewed programs, and omits invented itinerary counts. The regional background uses the original project asset `src/assets/hero-castilla-leon-line.webp`: a low-contrast cathedral, old-city skyline and bridge illustration created specifically for this home.

## Focused region comparison evidence

- Hero: display weight, compact line height, two-line wrap and burgundy emphasis match the source hierarchy. The supporting sentence remains two lines on desktop and wraps naturally on mobile.
- Primary workspace: all three panels share their top edge and visual height on desktop. Inputs and full-width actions occupy equivalent positions. Mobile order is FP, occupation, coverage, with no horizontal page overflow.
- Lower bands: trust content is a single divided strip; secondary actions are a single divided surface; methodology remains subordinate; the footer closes the page in dark burgundy.
- Typography: system sans stack is intentionally used because the source typeface is not bundled. Weight, size, line height and wrapping were matched without adding a font dependency.
- Colors: near-black text, warm white background, burgundy `#951126`, dark burgundy `#761020`, restrained gold and warm neutral borders reproduce the source balance while retaining accessible focus states.
- Assets: no institutional logo or third-party architectural illustration was reused. The cathedral scene was generated specifically for the project, compressed to a 93 KB WebP and kept decorative. Existing Lucide icons provide the few functional line icons.
- Copy: all app-specific claims remain prudent; no promise of employment, fabricated salary, invented count or false official affiliation appears.

## Comparison history

1. First desktop comparison
   - [P2] Empty-form buttons were neutral grey and weakened the reference's burgundy/gold balance.
   - Fix: retained disabled semantics but restored burgundy and gold surfaces with reduced opacity.
   - Post-fix evidence: final desktop screenshot keeps both actions visibly color-coded while their disabled state remains apparent.

2. First mobile comparison
   - [P2] The header and methodology copy consumed excess vertical space and the methodology sentence wrapped as competing columns.
   - Fix: removed the nonessential descriptor at the mobile breakpoint, kept the trust action compact, and changed methodology copy to normal block flow.
   - Post-fix evidence: final mobile screenshot has no page overflow, preserves the requested content order and reads as one continuous sentence.

3. Regional identity review
   - [P2] The original contour texture was functionally invisible and did not provide the architectural counterweight present in the reference.
   - Fix: replaced it with an original cathedral, skyline and bridge line illustration, positioned behind the right half of the hero and hidden on mobile.
   - Post-fix evidence: the final desktop capture shows a clearly readable but subordinate architectural scene without reducing headline or panel contrast.

4. Final density and copy review
   - [P3] The coverage heading could be read as live availability, and the lower action icons and primary panels retained slightly more visual weight than necessary.
   - Fix: renamed the panel to `Cobertura revisada`, tightened both primary panels, reduced the secondary icons, and made the hero and occupation copy more precise.
   - Post-fix evidence: the final captures preserve the reference hierarchy while communicating reviewed coverage rather than current job or course availability.

## Findings

No actionable P0, P1 or P2 differences remain. Residual differences are expected and deliberate: no official crest, no Junta copyright, no fabricated coverage metrics, current data/date, and an original regional illustration rather than the mockup's exact architecture.

## Primary interactions and technical evidence

- FP selector: selected `IFC03S`; `Ver mis opciones` enabled and navigated to `/desde-fp/IFC03S`.
- Occupation search: searched `Programación web`, selected the official CNO-11 result, and navigated to `/desde-ocupacion/occupation%3Acno11%3A2713`.
- Keyboard skip link, responsive overflow and both viewport layouts are covered by the home E2E suite.
- Axe: no automated violations in desktop or mobile home runs.
- Browser console: no warnings or errors after load and both primary interactions.

## Follow-up polish

- No remaining P3 visual issue is necessary for this pass. The repeated `oficial` wording was removed from the visible settled home; source provenance remains concentrated in the trust and methodology areas.

## Closure QA

- Interaction: disabled FP and occupation actions expose native disabled semantics; selecting a valid item enables the action. The burgundy FP action changes from `0.68` opacity to solid `#951126`, hover applies the intended brightness treatment, and keyboard focus exposes the shared focus ring.
- Keyboard: the occupation combobox supports typing, Arrow Down, Enter and CTA activation by Enter; the skip link moves focus to the main content.
- Responsive: 360 × 800, 768 × 1024 and 1024 × 768 pass without document or body overflow. A 23 px tablet overflow from the decorative hero art was found and fixed by clipping that art to the hero boundary.
- Data and claims: the displayed update timestamp comes from the manifest-addressed job-offer snapshot; every featured coverage link is backed by a `program` row whose `coverageStatus` is `reviewed` in the manifest-addressed mapping coverage resource.
- Automated evidence: 24 existing desktop/mobile home tests and 3 focused closure checks passed.

## Compare studies redesign QA

- Source visual truth: `F:\castilla_leon_rev2\.worktrees\salida-cyl-development\audit-compare-tables-before.png` (the user-supplied issue was also inspected at `C:\Users\rome_\AppData\Local\Temp\codex-clipboard-f7c62c48-4b03-48b9-8eff-48de9f808d67.png`).
- Implementation screenshots: `F:\castilla_leon_rev2\.worktrees\salida-cyl-development\compare-results-after.png` and `F:\castilla_leon_rev2\.worktrees\salida-cyl-development\compare-results-mobile.png`.
- Viewports: desktop 1440 × 900 CSS px; mobile 360 × 800 CSS px; tablet layout checked at 768 × 1024 CSS px.
- Density normalization: source and implementation browser captures use the same 1× CSS density and exclude the browser chrome. The screenshot pixel area excludes the in-app scrollbar gutter.
- State: grado medio, latest provisional cohort, first post-graduation year, and the same two selected groups (`Actividades comerciales` and `Actividades físicas y deportivas`).

### Full-view comparison evidence

The before/after captures were inspected together at the same desktop viewport and state. The implementation retains the two truthful source scopes, cohort context, published values, burgundy/warm-neutral palette and compact evidence hierarchy. It intentionally replaces the repeated raw table rows with one grouped card per selected series, a single reading guide and proportional bars on a shared scale within each source card.

### Focused region comparison evidence

- Selector: the old compact pills and two-column scrolling checkbox wall became two large level cards plus a single-column alphabetical result list with visible native checkboxes. Source labels are displayed in sentence case while their stored official values remain unchanged.
- Results: each group name appears once; the mean is prominent; the four published boundaries are labelled `Corte del 20 %`, `40 %`, `60 %` and `80 %`; technical quintile terminology remains available in an expandable semantic table.
- Data integrity: a non-progressive source sequence is not reordered or corrected. The affected group receives an explicit source-data warning.
- Responsive: the source cards stack at tablet and mobile widths. Browser measurements returned zero body and document overflow at 360 px and 768 px.

### Required fidelity surfaces

- Typography: the existing system stack, weights and scale are preserved; sentence case removes the previous mixed uppercase/lowercase noise.
- Spacing and layout: selection targets are larger, result rows read top-to-bottom, and evidence cards use the established radii, borders and spacing tokens.
- Colors and tokens: burgundy remains the selected/brand color, gold identifies the mean, muted burgundy represents distribution cuts, and all additions are centralized in `tokens.css`.
- Image quality and assets: no image asset is required in this data screen; no placeholder, generated image, custom SVG or icon substitute was introduced.
- Copy and content: quintiles are explained in plain language without removing the exact published term, scope, value or limitation.
- Interaction and accessibility: level controls remain radios, group choices remain checkboxes, technical data remains a semantic table, and all visual charts retain adjacent text values and explanations.

### Comparison history

1. [P1] Raw tables repeated every selected group five times and exposed statistical jargon as the primary reading path.
   - Fix: grouped observations by series, added plain-language distribution bars and moved the exact terminology into expandable technical tables.
   - Post-fix evidence: the final desktop capture communicates group, mean and distribution without requiring the user to decode `quintil`.
2. [P2] Level and group selection had weak click affordance, mixed source casing and a visually unordered two-column list.
   - Fix: enlarged level cards, visible native checkboxes, single-column alphabetical results and display-only sentence-case normalization.
   - Post-fix evidence: the browser accessibility tree exposes normalized labels in stable reading order and the selected state remains native.
3. [P2] The first result iteration repeated the quintile guide inside both source cards.
   - Fix: moved the guide once above the evidence grid.
   - Post-fix evidence: the final screenshot has one concise explanation serving both scopes.

No actionable P0, P1 or P2 visual issue remains. The exact technical table is intentionally secondary but fully available.

final result: passed

---

## Closure QA — 2026-08-16 · home hierarchy and results / breaches

- Evidence path: `docs/contest/evidence/design-qa-20260816/`
- Source visual truth: `G:\_Descargas\ChatGPT Image 11 ago 2026, 22_13_40.png`
- Viewports: desktop 1440 × 900 CSS px; mobile 360 × 800 CSS px.
- Density normalization: screenshots compared at 1× CSS density by proportional page geometry.

### Evidence captures (12 tracked items)

1. `home-desktop-1440x900.png`
2. `home-mobile-360x800.png`
3. `home-mobile-360x800-entry-alternatives.png`
4. `results-desktop-1440x900.png`
5. `results-desktop-1440x900-gap.png`
6. `results-desktop-1440x900-unpublished.png`
7. `results-mobile-360x800.png`
8. `results-mobile-360x800-gap.png`
9. `results-mobile-360x800-unpublished.png`
10. `home-reference-vs-implementation.png`
11. `results-states-desktop.png`
12. `results-states-mobile.png`

### Source-reference transparency

There is no prior visual reference capture for results / breaches in the historical register.
No source image is invented or implied. Results / breaches QA compares the live screen against
the brief evidence contract and the existing token system directly, supplemented by the two
state composites (`results-states-desktop.png` / `results-states-mobile.png`) as implementation evidence.

### Comparison by region

| Region                       | Observation                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero                         | Copy renders exactly: «SALIDA CyL conecta FP, salidas profesionales y evidencia pública; no es un buscador general de empleo ni de cursos.»                         |
| Reviewed coverage            | The three deterministically selected reviewed programmes appear first in both semantic and visual order, preceding any interaction.                                 |
| FP / Occupation alternatives | Selectors are equal burgundy alternative cards; mobile stacking remains alternative rather than sequential.                                                         |
| Visible 'o'                  | Present in the hero and primary panel text as designed, no truncation or overflow.                                                                                  |
| Result quote                 | Evidence blockquotes render as visible blockquotes before collapsed provenance metadata.                                                                            |
| Evidence states              | «Requisito no cumplido» uses burgundy; «Requisito no publicado» uses gold — visually distinct.                                                                      |
| Palette                      | `#951126`, `#761020`, gold `#bf7700` / `#995f00` and warm neutrals confirmed across the audited site; no green / terracotta remnants in audited styles or features. |
| Responsive overflow          | Body and document horizontal overflow at 0 px in all four views (desktop / mobile × 1440×900 / 360×800).                                                            |

### Findings / history

| #   | Item                                             | Finding                                                                                                           |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Semantic home reorder (FP/occupation first)      | **Implementation fix applied.**                                                                                   |
| 2   | Mobile stacking mode (alternative vs sequential) | Confirmed no-change — stacking is alternative as requested.                                                       |
| 3   | Hero copy fidelity                               | Confirmed match — exact copy as specified in the brief.                                                           |
| 4   | Result evidence blockquotes                      | Confirmed — blockquotes visible before collapsed provenance.                                                      |
| 5   | Requirement state colours                        | Confirmed — burgundy / gold distinct as specified.                                                                |
| 6   | Results / breaches reference capture             | **No prior capture exists.** QA relies on brief evidence contract plus token system and the two state composites. |
| 7   | Compare Studies                                  | Unchanged.                                                                                                        |
| 8   | Matching engine                                  | Unchanged.                                                                                                        |
| 9   | Catalogs / manifests                             | Unchanged.                                                                                                        |
| 10  | Snapshots                                        | Unchanged.                                                                                                        |
| 11  | Result rendering                                 | Unchanged.                                                                                                        |

### Palette confirmation

| Token                                     | Value                 | Status                                      |
| ----------------------------------------- | --------------------- | ------------------------------------------- |
| Burgundy primary                          | `#951126`             | Confirmed                                   |
| Burgundy dark                             | `#761020`             | Confirmed                                   |
| Gold highlight / Requirement no published | `#bf7700` / `#995f00` | Confirmed                                   |
| Warm neutrals (backgrounds, borders)      | Warm neutral palette  | Confirmed                                   |
| Green remnants                            | —                     | None detected in audited styles or features |
| Terracotta remnants                       | —                     | None detected in audited styles or features |

### Accessibility (Axe)

- Axe Core: **0 violations** on home in desktop 1440 × 900.
- Axe Core: **0 violations** on home in mobile 360 × 800.
- Axe Core: **0 violations** on results / breaches in desktop 1440 × 900.
- Axe Core: **0 violations** on results / breaches in mobile 360 × 800.

### Keyboard coverage

- Skip link moves focus to main content.
- Alternative entry cards are sequentially focusable.
- Exact-citation disclosure toggles via Enter / Space.
- Requirement answer (no cumplido / no publicado) is focusable.
- Existing E2E also covers `ArrowRight` navigation and related-offers interactions.

### Console / network

- Browser console errors: **0**.
- Console warnings: **0**.
- Page-level errors: **0**.
- Failed requests: **0**.
- HTTP error responses: **0**.

### Overflow

- Body horizontal overflow: **0 px** (all four views).
- Document horizontal overflow: **0 px** (all four views).

### Test evidence

| Suite                                | Passed / Total | Notes                                                    |
| ------------------------------------ | -------------- | -------------------------------------------------------- |
| `HomePage` unit (focused)            | 2 / 2          |                                                          |
| `TrainingResultsPage` unit (focused) | 12 / 12        |                                                          |
| Home + training E2E (focused)        | 32 / 32        |                                                          |
| Exact-capture QA                     | 4 / 4          |                                                          |
| Full Vitest suite                    | 95 / 95        | `npm test` (maxWorkers: 2); 95 archivos, 880 / 880 tests |
| Full E2E suite                       | 88 / 88        | Includes keyboard, overflow, Axe runs                    |

> **Nota:** La suite unitaria completa está verde: `npm test` ejecutó 95 archivos (/ 95)
> y 880 tests (/ 880) exitosamente con `maxWorkers: 2` configurado y sin flags adicionales.

### Final line

final result: passed

---

## Buscador único «decide primero, busca después» — 2026-08-20

- Referencia visual: `C:\Users\rome_\.codex\generated_images\01a01d4b-d9ac-7373-aeb2-970068ec4424\exec-82613655-fd3c-4ccf-83f2-af9873c36817.png`.
- Implementación, escritorio: `C:\Users\rome_\.codex\visualizations\2026\08\20\01a01d4b-d9ac-7373-aeb2-970068ec4424\home-desktop-1488.png`.
- Implementación, móvil: `C:\Users\rome_\.codex\visualizations\2026\08\20\01a01d4b-d9ac-7373-aeb2-970068ec4424\home-mobile-390.png`.
- Comparación lado a lado: `C:\Users\rome_\.codex\visualizations\2026\08\20\01a01d4b-d9ac-7373-aeb2-970068ec4424\design-qa-comparison.png`.
- Viewports: 1488 × 1058 px y 390 × 844 px, densidad 1×.

La referencia corresponde a una ficha de resultado, no a la portada. La comparación valida la continuidad del sistema visual —burdeos, superficies cálidas, tipografía editorial, bordes finos, jerarquía y densidad— y no una clonación de estructura o contenido.

### Estados verificados

- Modo inicial «Tengo un título de FP», con un único formulario y un único CTA primario.
- Cambio a «Tengo un empleo en mente», con montaje exclusivo del combobox correspondiente.
- Navegación del grupo radio con flechas; la opción activa queda marcada y enfocada.
- Persistencia y restauración del modo mediante `localStorage`, incluida la recuperación segura ante un valor inválido.
- Estado deshabilitado con una pista explícita de lo que falta.
- Vista móvil sin desbordamiento horizontal.
- Consola sin errores ni advertencias durante el flujo principal.

### Hallazgos y correcciones

- En la primera revisión interactiva, el cambio con flechas dependía del comportamiento nativo del navegador y no dejaba una evidencia consistente de foco. Se añadió manejo explícito para Flecha izquierda/arriba y derecha/abajo, y se volvió a verificar el estado marcado y enfocado.
- No quedan discrepancias accionables P0, P1 o P2.
- No fue necesario un recorte adicional: el módulo completo es legible a resolución nativa en la comparación de escritorio y la captura móvil cubre el comportamiento responsive.

final result: passed
