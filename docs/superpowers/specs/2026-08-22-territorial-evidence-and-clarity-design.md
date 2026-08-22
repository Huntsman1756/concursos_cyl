# SALIDA CyL — Territorial evidence and clarity design

**Date:** 2026-08-22  
**Status:** ready for user review  
**Base commit:** `085faca66dee67b9f2ca56aed11d32e0522eeb97`

## 1. Decision

SALIDA CyL keeps its current purpose: help a person move from a vocational
training program to supported occupations, or from an occupation to reviewed
training routes in Castilla y León. This release improves that decision with
territorial labour evidence. It does not become a generic statistical
dashboard and it does not rank programs, predict employment, or manufacture a
salary for a program, occupation, or province.

The product uses progressive disclosure:

1. show the answer and the next action first;
2. show the minimum evidence needed to interpret it;
3. expose exact definitions, dates, sources, and limitations on demand;
4. keep methodology details available without repeating them in every card.

## 2. Considered approaches

### A. Evidence-first decision page — selected

Keep the existing two journeys and add only evidence that changes a decision:
official training routes, where to study, observed contribution bases,
occupation-specific SEPE records where available, and clearly labelled
province-wide context. Tables and lists remain the accessible source of truth;
small charts are optional summaries.

This approach best supports utility, accessibility, source variety, technical
quality, and honest interpretation while preserving the established product.

### B. Statistical dashboard

Add multiple charts, maps, time series, rankings, and cross-source indicators.
Rejected because the available sources mix flows, stocks, surveys, occupations,
economic activities, and territories. A dense dashboard would encourage false
comparisons, increase the bundle, and obscure the user's next action.

### C. Copy-only refinement

Keep all current data and only shorten labels and explanations. Rejected as the
final direction because it would not exploit the verified SEPE occupation
evidence or materially improve the territorial usefulness of the service.

## 3. Information architecture

### Home

- Preserve the equal entry points: `Tengo un título de FP` and
  `Tengo un empleo en mente`.
- Replace the 187-option native selector with the existing searchable pattern,
  while preserving an exact official selection before navigation.
- Label update dates by resource, never as a date for the whole page.
- Present coverage as a measured scope. Any highlighted programs are labelled
  as examples, not as the coverage itself.
- Compress repeated trust statements into one evidence line with links to
  sources, methodology, and limitations.

### Training result

The reading order is:

1. program identity and decision direction;
2. compact evidence summary;
3. observed contribution-base evidence;
4. where to study;
5. official professional outputs and reviewed occupations;
6. current offers, when supported;
7. sources and limitations.

A compact section navigation may be used on long results. On mobile it must
wrap or scroll without hiding destinations and must preserve 40-pixel targets.

Province-wide contracts are labelled
`Contexto provincial — no específico de esta ocupación`. A province filter may
not appear to filter centers or occupation evidence unless it actually does.

### Occupation result

The reading order is:

1. official CNO occupation identity;
2. compact route summary;
3. occupation-specific SEPE evidence, if published;
4. reviewed training routes, grouped by evidence type;
5. centers and modalities;
6. sources and limitations.

Dates shared by every route card appear once at section level. The explanation
of `Salida profesional oficial` and `Relación revisada` appears once per group,
not inside every repeated card.

## 4. Evidence contract

Every visible indicator must expose or link to:

- metric name and definition;
- value and unit;
- period and access date;
- territory and geographic level;
- classification and version when applicable;
- official source and licence/attribution;
- suppression or missing-data state;
- a short limitation that prevents the most likely misreading.

The following distinctions are mandatory:

- contracts are registered contracts, not people or vacancies;
- registered unemployment is a stock, not a probability;
- demandants are not interchangeable with registered unemployment;
- Social Security affiliation counts affiliations, not necessarily unique
  people;
- contribution base, gross salary, and employer labour cost are different
  measures;
- province-wide indicators are not occupation-specific;
- an absent source record is unknown, never zero;
- ESCO describes occupations and skills; it does not measure the Castilla y
  León labour market.

No synthetic employability index, probability of employment, program ranking,
or automatic CNO-to-CNAE equivalence is published.

## 5. Source scope

### Release priority

1. Existing Junta program, offering, center, contract, and ECYL offer sources.
2. Existing EDUCAbase contribution-base evidence, preserving its separate
   national program/group and Castilla y León level scopes.
3. SEPE labour-market records by CNO when the official page publishes a record.
4. Existing official CNO and reviewed FP-to-occupation relationships.

### Subsequent source expansion

- Junta provincial affiliation and registered-unemployment context may be
  added only if it replaces, rather than duplicates, existing province-wide
  context.
- ESCO may add skills, translations, and European occupation equivalences in a
  separate mobility section with a fixed source version.
- EURES and Eurostat may provide separate European mobility or comparison
  context. Foreign observations are never transformed into Castilla y León
  estimates.
- Municipal data, wage agreements, and free-text offer salaries remain out of
  the first release because their interpretation and maintenance cost is not
  proportionate to the immediate decision value.

## 6. Visualisation decisions

### Keep

- The existing lightweight income comparison bars, paired with exact values
  and the technical table.
- Semantic tables and grouped lists as the primary representation.

### Replace

The current center plot is not presented as a map. It lacks territorial
boundaries, labels, orientation, collision handling, and a keyboard-equivalent
relationship between points and centers. Replace it with a component titled
`Distribución de centros` whose primary content is:

- center count by province;
- grouped center list by province and locality;
- explicit count of records without coordinates;
- visible course/source date.

A secondary point distribution may remain only as progressive enhancement. It
must not suggest routes, distances, travel times, or geographic precision.

### Conditional

SEPE province bars may be added after occupation coverage is broad enough to
make them a normal product state. They must use horizontal bars, exact values,
the full nine-province table, and visible period/unit. They are not shipped for
a one-record demonstration.

### Reject

- charts of general provincial contracts as if they were occupation demand;
- maps of ECYL offers without published official coordinates;
- charts with no textual equivalent;
- decorative charts or third-party map tiles;
- animation needed to understand a value.

## 7. Data and component boundaries

The release extends the existing generated-resource architecture rather than
introducing a dashboard framework.

- The SEPE resource remains a versioned, validated static resource referenced
  by the manifest.
- Capture resolves canonical official CNO records through the SEPE results
  endpoint, using `list-mode=detail`, the four-digit CNO identifier, year, and
  month. It follows the official URL returned by that endpoint instead of
  deriving a slug from the occupation label.
- Capture limits concurrency to four requests and records the requested CNO,
  requested period, resolved URL, access time, attribution, and source hash.
- The parsed page heading and period must match the requested CNO and period.
  An HTTP 200 shell without a matching occupation heading is not a valid
  record.
- Unsupported CNO codes remain absent; the UI renders an honest missing state.
- Presentation components receive validated domain records. They do not join
  CNO, CNAE, geography, or salary sources at render time.
- No chart library or remote map dependency is added.

## 8. Accessibility and responsive contract

- Core meaning is available without colour, hover, animation, or a pointer.
- Every chart has a semantic table or list containing the same values.
- Headings follow a consistent hierarchy and every region has an accessible
  name.
- Controls and links have a minimum 40-pixel target on mobile.
- There is no document or component overflow at 320, 360, or 390 CSS pixels.
- The interface remains usable at 200% zoom and with keyboard-only navigation.
- `prefers-reduced-motion` is respected.
- Loading, error, stale, suppressed, missing, and zero are distinct states.

## 9. Content rules

- Lead with plain Spanish and the decision the number supports.
- Keep one limitation near the metric; put the full method in disclosure or the
  methodology page.
- Avoid repeating the same source date and evidence-type definition inside
  every card.
- Use `base de cotización observada de titulados` instead of a bare salary
  label. The visible qualifier is `No es salario personal ni una predicción`.
- Use active, specific actions such as `Ver centros y modalidades`, not generic
  `Más información`.

## 10. Implementation slices

### Slice 1 — semantic clarity and density

- Correct contribution-base, provincial-context, update-date, and coverage
  labels.
- Deduplicate route-card dates and relationship explanations.
- Add or refine compact section navigation where the result length requires it.

### Slice 2 — accessible territorial distribution

- Make province counts and grouped centers the primary representation.
- Retire the map-like grid or demote a clearly labelled point distribution to
  progressive enhancement.

### Slice 3 — SEPE coverage

- Replace label-derived URLs with the canonical SEPE result resolver. The
  current derived-slug probe resolves 46 of 116 linked CNO codes and one record
  is curated; the remaining responses are unresolved until this resolver is
  applied and must not be reported as source absences.
- Capture all supported records without treating unsupported records as zero.
- Surface dataset-wide coverage and source period honestly.

### Slice 4 — optional European mobility

- Add ESCO skills/equivalences only after the first three slices are stable.
- Keep EURES/Eurostat context in a separate section and do not mix its metrics
  with Castilla y León observations.

## 11. Testing and acceptance

Implementation follows test-driven development. Each changed behaviour first
gets a failing test.

Required acceptance evidence:

1. Unit tests prove labels, scopes, periods, missing states, and the territorial
   list contract.
2. Data tests prove schema validation, deterministic capture, canonical source
   identity, absence handling, and manifest integrity.
3. Page tests prove repeated dates and definitions are not duplicated per card.
4. E2E covers the two decision journeys, a CNO with SEPE data, a CNO without
   data, keyboard navigation, Axe, mobile overflow, and 200% zoom.
5. Visual review covers Home, a training result, an occupation result with and
   without SEPE evidence, and the territorial component in desktop and mobile.
6. Bundle and distribution checks pass without a chart or map dependency.
7. Contest submission checks preserve source attribution, public URLs, honest
   claims, and the application-memory limit.

## 12. Release boundary

The implementation may be committed, pushed, and deployed to the existing
GitHub Pages and VPS targets after all automated and visual gates pass. It does
not submit the official contest form, assert adoption, add participant data, or
publish personal identity/declarations. Those remain explicit human actions.
