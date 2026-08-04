# Task 8 report — Final foundation hardening

## Delivered

- Added a referenced strict TypeScript project for `scripts/data/**`,
  `data/schemas/**`, and their tests. The production build now typechecks the
  data pipeline, with `@types/node` as the only new dependency.
- Locked both official source record signatures at the build boundary. The
  training source accepts exactly 21 documented fields and the employment
  source exactly 15; missing, renamed, or additive upstream fields stop
  publication before the last-known-good snapshot is replaced.
- Preserved all 1,294 official FP rows. Training-offering identity now includes
  program, center, modality, teaching type, and center ownership, so official
  differentiators cannot collapse into one record.
- Reconciled duplicated program and center evidence by normalized majority with
  deterministic Spanish/binary tie-breaking and non-null preference. Material
  conflicts are emitted as structured quality-report anomalies, and every
  offering is gated against its canonical program and center.
- Preserved each employment record's official metadata update time separately
  from the dataset fetch evidence internally. The v1 adapter serializes the
  record timestamp into the existing nested
  `sourceSnapshot.sourceUpdatedAt` slot, without adding or removing public
  JobOffer keys; the manifest retains the dataset-wide maximum.
- Made current manifests additive for future kebab-case JSON resource families
  while retaining the four required foundation resources, same-origin path
  checks, traversal rejection, immutable publication, retention, physical-path
  guards, and the cooperative fail-closed lock.
- Retained legacy and transitional v1 recovery. Contract inference is made at
  resource-set level from unambiguous payload schemas, so the exact fixed-point
  immutable manifest can keep its pre-hardening payloads as a browser-loadable
  stale snapshot after a failed refresh.
- Added an automated dependency-license gate, MIT project license, official
  data attribution, third-party notices, and the narrowly reviewed open-content
  and BlueOak exceptions required by the locked dependency tree.

Final implementation SHA:
`17e08fae998427682ebc49260c7b6dbd255e0f62`.

Implementation commits after the accepted Task 7 fixed point:

- `958ac05` — `feat: harden foundation data contracts`
- `a156e0f` — `fix: enforce source signatures at build boundary`
- `0d90450` — `data: refresh official foundation snapshots`
- `ebe142b` — `refactor(data): centralize validation primitives`
- `423feac` — `fix(data): preserve legacy v1 resource compatibility`
- `1f06ff8` — `fix(data): migrate transitional offer snapshots`
- `09fe4aa` — `data: refresh compatible official snapshots`
- `136797f` — `refactor(data): clarify compatibility boundaries`
- `cc5b57f` — `fix(data): accept fixed-point snapshot upgrades`
- `f51765d` — `fix(data): load retained legacy payloads`
- `17e08fa` — `refactor(data): reuse validated client payloads`

## RED / GREEN evidence

- Baseline Vitest passed 96/96 before Task 8 changes. The original application
  build passed while a direct strict pipeline check failed on missing Node
  types and unchecked data scripts, reproducing the TypeScript-project gap.
- Tests written against the unchanged implementation produced 15 expected
  assertion failures with 79 passes across eight loaded files, plus the missing
  license-policy module. The failures covered offering loss/identity, canonical
  disagreement, reconciliation evidence, record timestamps, additive
  manifests, source drift, and the dependency gate.
- The first dependency-policy command failed because `license:check` did not
  exist. After implementation it evaluated all 364 locked package entries and
  passed.
- A phone-equivalence regression initially emitted one false anomaly for
  whitespace-only variants. Normalized comparison removed it while retaining
  material phone conflicts.
- A custom-fetch drift regression initially resolved instead of rejecting,
  proving that endpoint-only validation was insufficient. Re-parsing at the
  build boundary made the same test fail closed before publication.
- Legacy client compatibility was RED with 2 failures and 29 passes: the fixed
  JobOffer shape and flat-resource loader were not accepted. The compatibility
  implementation then passed the focused 83-test set.
- A transitional snapshot containing the retired top-level offer timestamp was
  RED with 1 failure and 33 passes. Descriptor-owned read-only migration made
  the builder suite pass 34/34 without weakening new staging validation.
- The exact fixed-point upgrade test was RED because its immutable manifest was
  paired with pre-hardening center/offering payloads. The test reproduces the
  original manifest paths, counts, and hashes; its reconstructed 1,033-offer
  bytes hash to the historical
  `65e3a987b302e2ebba345351ab0c409a1a83393e0bba83466c55b6822c818147`.
  Payload-set inference made the builder suite pass 35/35 and preserves every
  resource byte when marking the snapshot stale.
- The browser-client follow-up was RED because immutable paths were treated as
  inherently current. Payload-schema inference made the stale immutable plus
  legacy-payload regression pass and kept a discriminated
  `contract: "legacy" | "current"` return. Final focused build/client tests
  passed 58/58.

## Live official build

`npm run data:build` completed against both configured Junta de Castilla y León
endpoints at `2026-08-04T18:10:28.910Z`. It published immutable snapshot
`20260804181028910-6e07eafedc96` with:

- 187 canonical training programs;
- 229 canonical education centers;
- 1,294 training offerings;
- 1,033 current employment offers.

The exact source-signature gates passed on the current official responses. No
fallback snapshot was used for this publication.

## Artifact and graph audit

Every generated resource count equals its manifest count and every exact file
hash equals its manifest hash:

| Resource           | Count | SHA-256                                                            |
| ------------------ | ----: | ------------------------------------------------------------------ |
| programs           |   187 | `b3757d75ad7f42cab5db515dd889bd9fb169c9a73aa4a440d41e823b8dbe1242` |
| centers            |   229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| training offerings | 1,294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |
| job offers         | 1,033 | `a3befafc81d30087079a46a68a1f7e1660f1fbbdd9cb44fb7ae17ad55a20083a` |

Independent JSON inspection found 1,294 unique offering IDs and zero duplicated
attribute mismatches against canonical programs/centers. The two required
`AFD02M` records remain distinct:

- `AFD02M:47011115:on_site:concerted:private`
- `AFD02M:47011115:on_site:private:private`

`INA01M` is canonically `INA`; every published `INA01M` offering also has
family code `INA`. The selected value is backed by six `INA` source rows versus
one conflicting `HOT` row.

The quality report contains the three material conflicts observed in the live
source and the deterministic selected values:

- center `05000701`, phone: 10 × `920 222185` versus 1 × `920 221 875`;
- center `47004937`, website: 12 × `http://gregoriofer.com/` versus 4 ×
  `https://gregoriofer.com/`;
- program `INA01M`, family code: 6 × `INA` versus 1 × `HOT`.

Representative employment offer `1285604113258` reports official
`actualizacionmetadatos` `2026-02-04`; the published nested record timestamp is
exactly `2026-02-04T00:00:00.000Z`, while the manifest dataset maximum remains
`2026-07-31T00:00:00.000Z`. JobOffer top-level keys remain identical to the
accepted v1 fixed point, and an independent scan found zero raw-HTML
descriptions.

## License evidence

- Project code is MIT licensed. `DATA_LICENSE.md` attributes both official Junta
  datasets under CC BY 4.0 ES and separates their terms from the software
  license.
- The package allowlist covers `0BSD`, `Apache-2.0`, `BSD-2-Clause`,
  `BSD-3-Clause`, `ISC`, `MIT`, `MIT-0`, and `MPL-2.0`.
- Reviewed narrow exceptions cover `caniuse-lite` (`CC-BY-4.0` data),
  `mdn-data` (`CC0-1.0` data), and `lru-cache`/`minimatch`
  (`BlueOak-1.0.0`). Missing metadata, unreviewed exceptions, and proprietary
  licenses fail the gate.
- `npm install` continued to report two high-severity React Router advisories
  concerning React Server Components/server actions. This Vite SPA uses neither;
  the observation is non-blocking and must be reassessed before any SSR work.

## Final verification

All commands were rerun on the final implementation:

```text
rtk npm run lint
passed

rtk npm test
13 files passed; 116 tests passed

rtk npm run build
passed; strict data TypeScript project and Vite production build completed

rtk npm run license:check
364 locked package entries passed

rtk npm run test:e2e
16 Playwright tests passed across desktop and mobile Chromium

targeted Prettier
all changed implementation and test files formatted correctly

working/staged diff checks
passed

post-Playwright port check
port 4173 released
```

The final artifact audit also reconfirmed all four counts/hashes, unique
offering identities, zero canonical mismatches, both AFD rows, consistent
`INA01M`, the representative record timestamp, the unchanged v1 JobOffer key
set, and zero raw-HTML descriptions.

Independent final review passed with no definite Task 8 specification findings
and zero actionable engineering-standards findings.

No analytics, cookies, client storage, fingerprinting, runtime generative AI,
raw HTML, proprietary dependency, or SBB asset/package was introduced.
