# SALIDA CyL — Reference analysis (public-service design systems)

Phase: visual direction research for `feature/competition-visual-redesign`.
Method: principles, not visual copying. No external branding is reproduced.
Sources: live inspection of nationalcareers.service.gov.uk (fetched during this
phase) and established knowledge of the cited systems (GOV.UK Frontend,
DSFR, USWDS, France Travail 2024 rebrand, TodoFP, Jobs and Skills Australia).

## REFERENCE_POLICY (binding — corrects earlier ambiguity)

This section is normative for the implementation. The comparison table above is
observation; the rules below are what SALIDA may and may not do.

### DSFR (Système de design de l'État, France)

**NOT reusable. NOT a copyable visual source.**

- Its licence and scope restrict usage to **services of the French State**
  (sites de l'État and `.gouv.fr`). SALIDA is not a French State service and
  does not operate under that framework.
- Allowed: **conceptual observation of patterns only** (how DSFR sequences
  header/utility, media ratios, state colors) as documented research input.
- Forbidden:
  - importing any DSFR **component** (code, HTML/CSS, Web Components);
  - importing DSFR **tokens** (colors, spacing, type scale — including
    Marianne and the state palette);
  - copying DSFR **branding** (bloc-marque, Marianne block, république
    branding, déclinaisons);
  - importing any DSFR **asset** (fonts, icons, pictograms, illustrations).

DSFR stays in this document as a **study reference**, never as an
implementation source.

### GOV.UK (Design System + Frontend)

**Practical referent** (study AND compliant reuse) for:

- **forms** (label/hint/error anatomy, progressive disclosure);
- **errors** (error summary, inline validation patterns);
- **tables** (numeric right-alignment, captions, scope, hover states);
- **content hierarchy** (one thing per page, task headings, plain language);
- **accessibility** (focus states, target sizes, WCAG 2.1 AA discipline).

Its Frontend code is **MIT-licensed**: it may be studied and reused in
conformity with the licence. Even so, SALIDA's default is its own
implementation per `SALIDA-DESIGN.md`; copy specific interaction rules, not
wholesale bundles.

### USWDS (U.S. Web Design System)

**Practical referent** (study AND compliant reuse) for:

- **Public Sans** (the chosen SALIDA typeface; OFL, designed for government
  UIs — already self-hosted in the prototypes);
- **tokens** philosophy (role-based naming, closed scales);
- **spacing** (4px base grid, semantic aliases);
- **accessibility** (508-derived practices, focus discipline);
- **form/filter patterns** (visible state, remove-all, result counts).

### Installation rule

Do **not** automatically install `govuk-frontend`, `@uswds/uswds` or any DSFR
package. SALIDA is a **React** product. Preferred stack, in order:

1. current project components;
2. semantic HTML;
3. **Radix** (already installed) where it contributes accessible behavior
   (dialogs/popovers/tabs) — styled with SALIDA tokens;
4. own implementation conforming to `SALIDA-DESIGN.md`.

No new framework or CSS system enters the bundle without a written
demonstration of net benefit (accessibility, size, maintenance) approved as a
contract change.

## Comparison table

| Dimension       | National Careers Service (UK)                                                                                                                                           | Jobs and Skills Australia                                                               | France Travail / MétierScope                                                         | TodoFP / SoyFP                                                                                      | GOV.UK                                                                  | DSFR                                                                        | USWDS                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Navigation**  | Flat top nav, 5 task-based items (Explore careers, Skills assessment, Find a course…); menu kept minimal; beta banner separate from nav                                 | Agency-style top nav split: programs/research vs data tools; deep publication hierarchy | DSFR header: official brand block + primary nav + search; service sub-brands inline  | Dense institutional directories; navigation by familia profesional lists; link-heavy, low hierarchy | Task-oriented top nav, ruthless pruning, one concept per page           | Standardized header (bloc marque + intitulé), nav slots fixed by the system | Header + primary nav patterns with strict spacing; sitemap-first thinking |
| **Hero**        | Full-width photo band with H1 + one explanatory sentence; separate desktop/mobile header images; below it a **situation triage** ("select your situation → See advice") | Campaign-style heroes for reports; quieter product pages                                | Service hero with DSFR utility classes; search-forward on home                       | Institutional banner, low visual energy                                                             | No marketing hero: white page, H1 + lede first                          | Editorial hero patterns with strict media ratios                            | Hero pattern exists but discouraged; content-first pages                  |
| **Search**      | Site-level plus per-section finders; search as explicit user task                                                                                                       | Search across publications and data tools                                               | Global search prominent in DSFR header; metier search is a first-class tool          | Big institutional search box on home; filters by título/familia                                     | Search field on every page, consistent placement                        | DSFR search inputs standardized site-wide                                   | Search bar component with strict label/hint rules                         |
| **Photography** | Real people at work (headline image, video case study "Meet pharmacist Julie" with transcript); photography = human warmth over a GOV.UK base                           | Workplace/report photography; charts dominate over photos                               | DSFR-compliant editorial photography, restrained, no decorative excess               | Almost none — institutional graphics only                                                           | Essentially none by principle                                           | Governed photo guidelines; media ratios and captions standardized           | Photography optional and tightly governed; illustrations discouraged      |
| **Results**     | Job profiles as structured fact sheets (hours, tasks, routes); course finder results as scannable rows                                                                  | Data-rich publication tables and chart cards                                            | Fiches métier with structured sections; MétierScope = maps/charts for exploration    | Tables and lists of ciclos/títulos; utilitarian density                                             | Structured rows, summary lists, definition tables                       | Standardized tables/cards with mandatory states                             | Tables/lists components with sortable, responsive patterns                |
| **Filters**     | Triage dropdowns (education/work status) before content; course filters simple and visible                                                                              | Facet filters on data catalogs                                                          | DSFR selects/checkboxes; visible active state                                        | Filter lists by familia/nivel/provincia, functional but dated                                       | Details/summary progressive filters; checkboxes over dropdowns          | Filter panels standardized incl. expandable                                 | Filter combos with clear "remove all" and result counts                   |
| **Typography**  | GOV.UK heritage stack; generous body size (~19px), strong headings                                                                                                      | Modern humanist sans, data-dense but legible                                            | **Marianne** (state font, non-distributable outside France) + Spectral serif accents | Institutional sans (ministry web conventions), smaller sizes                                        | **GDS Transport** — excellent but license-restricted, non-distributable | **Marianne** — identity font tied to French state                           | **Public Sans** — open OFL font designed FOR government UIs               |
| **Colour**      | GOV.UK black/white/blue base + brighter rebrand accents; link blue carries action                                                                                       | Teal/navy government palette with data-viz accents                                      | French state blue `#000091` + Marianne red `#E1000F`                                 | Ministry blues; low chroma variety                                                                  | Black/white + blue links + green start; grey for structure              | Strict state palette; focus orange; no arbitrary hex                        | Tokenized palette (primary blue, state colors) with documented contrast   |
| **Trust**       | Beta labeling, contact phone, adviser access, OGL licence, information-sources page                                                                                     | Methodology pages, data licences, ABS sourcing                                          | Official header, SIRET/institutional footer, source footnotes on data                | Institutional footer, ministry attribution                                                          | "Where data comes from", plain-language provenance                      | Officiel branding, mandatory footer mentions                                | 508 accessibility, provenance in data docs                                |
| **Mobile**      | Dedicated mobile header image; triage and cards stack cleanly; strong tap targets                                                                                       | Responsive publications, readable tables                                                | DSFR mobile patterns are first-class                                                 | Tables squeeze poorly; dense on small screens                                                       | Mobile-first by constitution                                            | Mobile-first system                                                         | Mobile-first grid with documented breakpoints                             |

## Extracted reusable rules (what SALIDA adopts)

1. **Situation triage over menus** (NCS, GOV.UK): entry by "who am I / what do
   I have", not by org chart. SALIDA: the three paths (FP / profesión / oferta).
2. **One promise per hero** (NCS, DSFR): H1 + one sentence + one action;
   photography carries humanity, never information.
3. **Search is a first-class citizen** (all): persistent, labeled, with real
   placeholder examples — never placeholder-as-label.
4. **Results as structured facts, not cards-for-decoration** (GOV.UK, USWDS):
   rows on desktop, cards on mobile; actions at the end; provenance one tap
   away.
5. **Filters show their state** (USWDS, DSFR): active chips, result counts,
   obvious removal; dropdown count is capped by data reality.
6. **Typography is a trust signal**: one family, big-enough body (16px+),
   strict weights. Public Sans gives the USWDS lesson — an open font designed
   for public interfaces, distributable without license risk (unlike GDS
   Transport or Marianne).
7. **Provenance is designed, not bolted on** (GOV.UK, JSA): sources page,
   snapshot dates, licence notes; SALIDA extends this with its reviewed-
   relationship evidence layer at three disclosure levels.
8. **Restrained colour with one action hue** (GOV.UK): link/action blue does
   the work; state colors exist only for states. SALIDA: Azul Duero + Trigo.
9. **Mobile is not a squeezed table** (NCS, DSFR): dedicated result-card
   pattern, bottom-sheet filters, 44px targets.
10. **Photography needs governance or it becomes noise** (DSFR, USWDS): fixed
    ratios, fixed slots, no per-result photos — exactly the editorial-asset
    policy already approved for SALIDA's five images.

## Explicit anti-patterns to avoid (observed in weaker corners of referents)

- Directory-link walls with no hierarchy (parts of TodoFP) → SALIDA keeps
  lists short, labeled and task-scoped.
- Institution-first heroes (ministry banner syndrome) → SALIDA hero speaks to
  the user's situation, not to the organization.
- Data-viz decoration without a question (dashboard drift, some JSA marketing
  pages) → SALIDA's DataStat exists only to support a decision.
