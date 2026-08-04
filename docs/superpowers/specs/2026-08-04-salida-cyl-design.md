# SALIDA CyL — Product and technical design

**Date:** 2026-08-04  
**Status:** ready for user review  
**Contest:** X Premios Datos Abiertos de Castilla y León, category “Productos y Servicios”

## 1. Product definition

SALIDA CyL is a responsive public web application that turns official education and employment data into an auditable next decision. It serves two audiences with equal prominence:

1. **I finished vocational training:** exact training program → reviewed occupations → current ECYL offers → published requirements → declared gaps → reliable next actions.
2. **I want to work as…:** confirmed official occupation → reviewed training routes → programs, centers and modalities available in Castilla y León.

The product does not predict eligibility, recommend a person through an opaque score, or claim that an unpublished requirement is unnecessary. Every conclusion must preserve its source, scope and update date.

## 2. Goals and release boundaries

### Goals

- Help recent vocational-training graduates understand which current offers are occupationally related to their studies.
- Explain the evidence behind every relationship and requirement.
- Convert a published gap into a small, reliable action.
- Let prospective students explore official training routes from a profession.
- Compare observed employment and income indicators without manufacturing a `training program × Castilla y León` statistic that does not exist.
- Produce a public, accessible, open-source service with a stable URL for the contest.

### Non-goals

- Job applications, accounts, CV storage or candidate scoring.
- Automatic course recommendations from `formacion-del-ecyl`.
- Private academy recommendations.
- Generative-AI interpretation of occupations or offers at runtime.
- A promise of employability, admission, salary or legal eligibility.
- A single synthetic ranking of training programs.
- A map-first experience. A center map may be added later as a secondary view.
- English UI in the contest MVP. Source code, identifiers and technical documentation are written in English; the public UI is Spanish.

## 3. Approved experience

### 3.1 Home

The home uses the approved **equal-entry layout**. Two cards have equal visual weight:

- **He terminado FP** — “Título → ofertas → requisitos → acciones”.
- **Quiero trabajar de…** — “Ocupación → ciclos y centros de CyL”.

Below them, three compact promises explain the product: visible sources, no opaque score and dated data. The primary navigation contains `Inicio`, `Comparar estudios` and `Metodología`.

### 3.2 Training-first flow

1. The user selects an exact program from the official Castilla y León catalog.
2. The user may set a province or search area. This is a filter, not profile data.
3. The application finds approved program–occupation relationships.
4. Current ECYL offers are matched through reviewed occupation aliases and deterministic rules.
5. Results use the approved **vertical evidence layout**:
   - why this offer appears;
   - what the offer publishes;
   - what the user declares in this session;
   - the gap, when one exists;
   - the next reliable action.
6. A technical evidence disclosure exposes source quotes and mapping provenance.

The user can answer `Lo tengo`, `No lo tengo` or `No estoy seguro`. These answers remain only in in-memory browser state. They are not written to local storage, session storage, URLs, analytics or a server.

### 3.3 Occupation-first flow

The input is a controlled autocomplete, not an unrestricted AI prompt:

1. The user writes an everyday term.
2. The application proposes official occupations through a reviewed synonym dictionary.
3. The user must confirm one official occupation before continuing.
4. The result uses a vertical “explained routes” layout: confirmed occupation → programs with justified links → centers and modalities in Castilla y León.

Program relationships are not ordered from “best” to “worst”. The UI distinguishes:

- **Official output:** the occupation is named in the official professional profile or employment environment of the program.
- **Reviewed relationship:** the relationship is supported by cited shared competencies and has passed human review.

No unreviewed relationship is visible in production. If an occupation has no approved route, the product says so and offers a new search; it does not improvise one.

### 3.4 Evidence language

The approved evidence system uses three layers:

1. **Relationship evidence:** why the program or occupation is connected to the offer.
2. **Published offer evidence:** exact requirements stated in the offer, with a source quote.
3. **Session declaration:** the user’s answer about a published requirement.

The result states are:

- **Explicit fit:** the offer publishes a relevant qualification or an exact occupational link supported by the approved mapping.
- **Occupational relationship; requirements incomplete:** the occupation is related but the offer does not publish enough information to assess a requirement.
- **Declared explicit gap:** the offer publishes a requirement and the user answers that they do not have it.

Green/red traffic-light scoring and compatibility percentages are forbidden. Color supports labels but never replaces their text.

## 4. Closed action catalog

Every action has an internal `actionType`, `targetKind`, `datasetKey` and validated target. Similar visible labels cannot point to interchangeable sources.

| `actionType` | Trigger | Visible action | `targetKind` | `datasetKey` / target |
| --- | --- | --- | --- | --- |
| `open_original_offer` | Any visible offer | Abrir oferta original | `external_offer` | `ofertas-de-empleo.enlace_al_contenido` |
| `verify_offer_requirements` | Requirements missing or ambiguous | Comprobar requisitos en la oferta | `external_offer` | Same original ECYL offer; never a training dataset |
| `adjust_search_area` | Location is unsuitable and remote work is not explicitly published | Cambiar zona de búsqueda | `internal_filter` | Client-side offer snapshot |
| `explore_unpublished_requirement` | The user lacks an explicitly published requirement | Ver ofertas relacionadas donde no se publica este requisito | `internal_offer_search` | `ofertas-de-empleo` snapshot |
| `view_regulated_training_route` | An official qualification or specialization is missing | Ver ruta formativa y centros | `regulated_training` | `oferta-de-formacion-profesional` |
| `open_official_procedure` | A permit, license or regulated accreditation is explicitly required | Consultar trámite oficial | `official_procedure` | Human-curated official procedure URL |
| `add_session_check` | No reliable action exists | Añadir a comprobaciones de esta sesión | `in_memory_checklist` | Browser memory only |

The wording for `explore_unpublished_requirement` is mandatory: the destination contains related offers where the requirement **is not published**. The application never says “offers without this requirement”.

`formacion-del-ecyl` is prohibited as an automatic action target in the MVP because its dates, requirements and deadlines are not complete enough to promise an executable route.

Before location affects filtering or creates a gap, the offer parser checks explicit remote, hybrid or on-site wording. An unknown modality is displayed as unknown and does not justify silently discarding the offer.

## 5. “Comparar estudios” and income indicators

The product includes a top-level tab named **Comparar estudios**, with a section titled **Empleo e ingresos**. It is inspired by the decision value of que-estudio but uses vocational-training sources and preserves their different scopes.

### Employment indicators

Employment outcomes retain the corrected architecture already agreed:

- **Your professional family in Castilla y León:** regional affiliation and other indicators that the official table publishes at `professional family × autonomous community` level.
- **Your program or official program group in Spain:** national indicators published at `program/program-group × Spain` level.

These cards remain separate and carry the visible sentence:

> Mostramos ambos indicadores por separado porque combinarlos daría una cifra que no existe en ningún informe oficial.

The interface never labels either card as an exact `program × Castilla y León` result.

### National program card

**Ingresos observados de titulados de este ciclo o grupo en España** displays:

- the exact official program or program-group label;
- graduation cohort;
- first, second, third or fourth year after graduation;
- mean and quintile boundaries;
- the permanent label `Base de cotización anualizada · jornada completa · España`;
- a visible methodology link.

### Regional reference card

**Referencia de titulados de [Grado Medio/Grado Superior] en Castilla y León** displays the same cohort and post-graduation year where available. It is a reference by training level, not by program, family, workplace or province.

The mandatory sentence under the cards is:

> Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.

The application uses “base de cotización anualizada” or “ingresos observados, aproximados mediante la base de cotización”, not an unqualified “salary”. It never combines the two cards mathematically, imputes a group value to one program without naming the group, or compares different cohorts and post-graduation years as if equivalent.

For Basic Vocational Training, where no equivalent program-level income table exists, the UI shows only the official scopes that are available and explains the absence.

## 6. Data sources and provenance

### Core Junta de Castilla y León sources

- `oferta-de-formacion-profesional`: programs, centers, provinces, modalities and ownership. The verified 2026-08-03 snapshot contained 1,294 offerings, 187 program keys, 223 centers and 22 professional families.
- `ofertas-de-empleo`: current offers, publication date, province/locality, free-text description and original link; updated daily.

### Official complementary sources

- Ministry EDUCAbase, vocational-training graduate employment statistics: administrative education and Social Security linkage; program/program-group national indicators and training-level regional income references.
- Official professional profiles and employment environments published by TodoFP/BOE for program–occupation relationships.
- Official occupation classifications and reviewed aliases for occupation autocomplete.
- The Castilla y León 2019–2020 vocational-training insertion study only where its survey scope is explicitly useful. It is a CAWI/CATI survey with `n=2,024`, not an administrative Social Security linkage.

Every normalized record carries `sourceId`, `sourceUrl`, `sourceUpdatedAt`, `snapshotFetchedAt`, `schemaVersion` and, when applicable, `sourceQuote`.

## 7. Domain model

The implementation uses explicit domain types:

- `TrainingProgram`: official key, title, level and family.
- `TrainingOffering`: program, center, province, locality and modality.
- `EducationCenter`: official code and public contact/location fields.
- `Occupation`: stable official identifier and preferred Spanish label.
- `OccupationAlias`: reviewed search synonym linked to one or more occupations.
- `TrainingOccupationLink`: relationship type, source citation, excerpt, review status and version.
- `JobOffer`: official identifier, title, location, publication date, sanitized description and original URL.
- `OfferOccupationLink`: deterministic match evidence and parser version.
- `PublishedRequirement`: category, normalized value, exact source quote and parsing rule.
- `SessionAnswer`: ephemeral `has | lacks | unsure`; it is never serialized.
- `OutcomeIndicator`: scope, cohort, post-graduation year, measure, value, suppression state and official label.
- `ActionDefinition`: the closed action contract in section 4.
- `SourceSnapshot`: source contract, counts, hash, fetch date and quality status.

## 8. Requirement categories and extraction

The closed categories are:

- qualification or specialization;
- experience;
- driving license or vehicle;
- certificate, professional license or regulated accreditation;
- language;
- schedule availability;
- mobility, remote work or on-site presence;
- unclassified requirement requiring verification.

The pipeline sanitizes offer HTML, identifies explicit requirement sections and runs deterministic, versioned parsing rules. A structured requirement is displayed only when the system can preserve an exact source quote. Ambiguous text becomes `unclassified` or remains unpublished; it is not forced into a category.

Runtime generative AI is excluded. AI may assist offline research or propose mapping candidates, but a human must approve the mapping and its source before publication.

## 9. Technical architecture

### Application

A static client-rendered web application is the default architecture:

- React + TypeScript + Vite;
- React Router for stable public routes;
- Zod for data-contract validation;
- MiniSearch for accent-insensitive local search and controlled aliases;
- Radix UI primitives for accessible behavior without adopting a visual brand;
- Lucide for real, consistent open-source icons;
- Observable Plot only where an income distribution or time series materially benefits from a chart, always paired with an accessible table.

CSS uses project-owned semantic tokens and focused component styles rather than a generic template. No server is needed for personal interaction. Generated, compressed JSON snapshots are fetched as static assets.

### Data pipeline

TypeScript build scripts:

1. fetch official datasets;
2. validate upstream schemas;
3. normalize identifiers and labels;
4. sanitize source HTML;
5. extract published requirements with source quotes;
6. join only approved mappings;
7. write versioned snapshots and a manifest;
8. run quality gates before replacing the last known good snapshot.

Static data contracts follow selected SBB API principles even without a runtime API:

- stable identifiers and domain names;
- versioned schemas under `/data/v1/`;
- a self-describing manifest;
- backward-compatible additive changes;
- a new major path for semantic breaks;
- documented filters if a public API is later added;
- source and freshness metadata in every resource family.

The project does not install SBB SwiftUI, Flutter or Angular packages and does not reuse SBB branding or assets.

### Repository shape

```text
src/
  app/                 routes, shell and providers
  components/          accessible shared primitives
  features/
    training-first/
    occupation-first/
    compare-studies/
    methodology/
  domain/              types, rules and action engine
  data/                generated-data clients and schemas
  styles/              tokens and global foundations
scripts/
  data/                 ingestion, normalization and quality gates
data/
  curated/              reviewed aliases, mappings and procedures
  schemas/              versioned source and output schemas
public/data/v1/         generated snapshots and manifest
tests/
  fixtures/             representative official-source fragments
  e2e/                  complete public journeys
docs/
  methodology/          source contracts and limitations
```

## 10. Visual and content system

SALIDA CyL uses its own identity. SBB is a reference for reduction, consistency, inclusivity, self-explanation and task orientation—not a template.

- Deep green is the primary structural color; terracotta is reserved for primary actions and declared gaps; neutrals carry incomplete or unpublished information.
- All semantic states have text labels and meet WCAG AA contrast.
- Icons support recognition; they do not decorate empty space or replace an unfamiliar concept. Critical actions retain text labels. Icon-only controls require an accessible name and tooltip.
- UI text follows `title → evidence → limitation → action`. Long methodology lives behind a disclosure or on the methodology page.
- No emoji, ornamental icon clouds, synthetic illustrations or long AI-style explanatory paragraphs.
- Motion is limited to state feedback and disclosure continuity, normally under 300 ms, using transform/opacity where appropriate and honoring `prefers-reduced-motion`.
- Layouts work at 360 px, 768 px and 1280 px without hiding evidence.
- Keyboard navigation, visible focus, 200% zoom, screen-reader labels and touch targets are release requirements.

The external skills are design-review inputs, not runtime dependencies: `emil-design-eng` for microinteractions, `ui-ux-pro-max` as a secondary accessibility/responsive checklist and `design-taste-frontend` only for the public-facing home presentation.

## 11. Privacy and security

- No account, cookies, analytics, advertising or fingerprinting.
- No session answers leave the browser.
- No requirement state is placed in URL parameters or browser storage.
- Public program/occupation selections may appear in routes because they are catalog navigation, not a personal profile.
- Hosting access logs cannot reconstruct requirement answers because those answers are never transmitted.
- External offer and procedure links are clearly marked and opened safely.
- Source HTML is sanitized during ingestion; the app never renders untrusted upstream HTML directly.
- A restrictive Content Security Policy, dependency lockfile and automated dependency/license audit are part of release.

## 12. Error and incomplete-data behavior

- **Upstream refresh failure:** keep the last known good snapshot and display its date.
- **Stale data:** show a visible freshness warning; never silently relabel old offers as current.
- **No approved mapping:** explain that no reviewed relationship is available and offer a new search.
- **No current offers:** distinguish “no offers in this snapshot” from “no employment opportunities exist”.
- **Missing requirement:** display “La oferta no lo publica” and link to the original offer.
- **Parser ambiguity:** do not create a gap; use the verification action.
- **Broken external link:** keep the record’s provenance, report the unavailable destination and do not redirect elsewhere.
- **Suppressed income value:** explain that the Ministry does not publish it because of representativeness or availability rules.
- **Recent cohort:** mark provisional data and disable unobserved later years.
- **No reliable action:** add the item to the in-memory session checklist and say that no verified action is available.

## 13. Testing and quality gates

### Domain tests

- An unpublished requirement can never become a declared gap.
- A declared gap requires an exact published quote and `lacks` session answer.
- `verify_offer_requirements` always targets the original offer.
- `view_regulated_training_route` always targets the regulated FP dataset.
- Remote or hybrid wording is evaluated before a location gap.
- National program-group indicators and regional training-level indicators cannot be combined.

### Data tests

- Schema validation for every upstream and generated snapshot.
- Stable identifier uniqueness and referential integrity.
- Snapshot counts, null-rate monitoring and unexpected-field-change detection.
- Golden fixtures for HTML sanitization and requirement extraction.
- Every visible mapping has an approved review status, citation and excerpt.
- Every visible action resolves to its declared target kind.

### UI and journey tests

- Home → exact program → offer evidence → session answer → reliable action.
- Home → occupation alias → explicit confirmation → explained routes → centers.
- Compare studies → same cohort/year → two separate scope cards → methodology.
- Empty, stale, suppressed, ambiguous and broken-link states.
- Keyboard-only, screen-reader semantics, focus order, reduced motion and 200% zoom.
- Responsive visual checks at the three target widths.

Vitest, Testing Library, Playwright and axe-core are the default open-source test tools. Release targets are no critical accessibility violations, no failed data contracts, no unreviewed visible mappings and a Lighthouse accessibility score of at least 95 on the principal routes.

## 14. Open-source and licensing policy

- Runtime and development software packages must use an approved open-source or permissive license.
- Reviewed data-only exceptions are `CC-BY-4.0` for `caniuse-lite` and `CC0-1.0` for `mdn-data`; reviewed `lru-cache` and `minimatch` packages use the permissive `BlueOak-1.0.0` license.
- Versions are locked; the complete dependency tree and licenses are checked against the automated repository allowlist.
- Project code is published under MIT unless a later legal review requires a compatible alternative.
- Curated mappings and generated exports preserve source attribution and are published under a compatible open-data license documented in `DATA_LICENSE.md`.
- `THIRD_PARTY_NOTICES.md` records reused packages, agent skills and source terms.
- SBB principles may be cited and selectively adapted under Apache-2.0; SBB names, logos, fonts and visual assets are not reused.

## 15. Delivery scope and acceptance criteria

The contest release includes:

- all current Castilla y León training offerings and centers from the official snapshot;
- only reviewed program–occupation links, with a visible coverage statement;
- current ECYL offers with source dates and original links;
- the seven action types defined in this specification;
- controlled occupation autocomplete and explicit confirmation;
- the `Comparar estudios` tab with EDUCAbase income data and separate regional reference;
- a public methodology page and downloadable source manifest;
- a public web URL and open repository;
- no personal-data backend or analytics.

The release is acceptable when both principal journeys work end to end, every visible conclusion is traceable, all data and action quality gates pass, the app remains usable on mobile and keyboard, and a reviewer can answer “where did this number or statement come from?” without reading source code.

## 16. Sources supporting this design

- [SALIDA CyL gate audit](../../../research/salida-cyl-gate-audit-2026.md)
- [Official salary and income source review](../../../research/salida-cyl-salary-sources-2026.md)
- [Design-system and skills source review](../../../research/salida-cyl-design-sources-2026.md)
- [2026 contest call](../../../tmp/convocatoria.pdf)
