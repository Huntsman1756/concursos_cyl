# Third-party notices

## Locked software and compatibility data

The complete package inventory and exact versions are recorded in
`package-lock.json`. `npm run license:check` enforces the policy documented in
`LICENSE_POLICY.md`.

The current dependency tree includes these reviewed non-OSI or data-specific
license cases:

- `caniuse-lite` browser-compatibility data — `CC-BY-4.0`.
- `mdn-data` web-platform data — `CC0-1.0`.
- `lru-cache` and `minimatch` — `BlueOak-1.0.0`.

All remaining locked package entries use an approved open-source software
license listed in `LICENSE_POLICY.md`.

## Official data

Junta de Castilla y León legal terms and attribution are centralized in
`DATA_LICENSE.md` and this notice. Generated snapshot metadata preserves the
technical provenance needed to audit a publication, including source IDs,
source URLs, freshness timestamps, record counts, and hashes; it does not copy
the full license terms or attribution into every generated resource.

The FP income evidence comes from four EDUCAbase tables published by the
Ministerio de Educación, Formación Profesional y Deportes: `famprof_2_08`,
`famprof_3_08`, `ccaa_2_07`, and `ccaa_3_07`. Their catalog entries, exact
scope, transformations, provenance fields, and the catalog-declared Ministry
legal notice are recorded in `DATA_LICENSE.md` and
`docs/methodology/educabase-income.md`. These source data are not covered by
the project's MIT software license, and their use does not imply Ministry
endorsement.

## Design and agent inputs

SBB principles were considered as design-review guidance under Apache-2.0. No
SBB package, name, logo, font, pictogram, or visual asset is redistributed.

The three referenced agent-skill inputs were `emilkowalski/skills`
(`emil-design-eng`), `design-taste-frontend`, and `ui-ux-pro-max`. They were
used only for design-time QA and review checklists. They are not runtime
dependencies, and no skill implementation, package, source code, or asset was
copied into the application or its generated data.
