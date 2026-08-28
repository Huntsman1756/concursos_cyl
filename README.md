# SALIDA CyL

**Explore reviewed, traceable links between vocational training and occupations in Castilla y León — with public evidence.**

SALIDA CyL is an independent, open-source web application for the [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) (Products and Services category). It answers a question that scattered public data make hard to follow:

> _What professional outlets does a given vocational training (FP) actually lead to, what training leads to a given occupation, and what public evidence supports it — in both directions._

## The problem

The data for FP programs, occupational classifications, study centers, employment offers and graduate income already exist, but they are published as separate datasets in different catalogs. Following `FP → occupation → evidence` requires jumping across those silos, and nothing separates **verified relationships** from plausible guesses.

## What SALIDA CyL does

It builds a **navigable, two-way relationship** between the 187 official FP programs and the 502 CNO-11 primary groups, then anchors each relationship in identified public evidence:

- **From FP:** pick a program to see its reviewed occupations, related offers from a dated snapshot, study centers, provincial context and official sources.
- **From occupation:** pick a CNO-11 group and see which FP leads to it, with the same evidence trail.
- **Compare:** separate national and regional EDUCAbase income references, without conflating scopes or presenting a table as an individual salary.

## What makes it different

SALIDA CyL does **not** invent equivalences, use fuzzy/semantic matching, or expand results by textual similarity. It publishes only relationships that can be **justified and traced to an official source**, and it explicitly shows the cases where evidence is insufficient rather than filling them in. Each reviewed relationship keeps its source, date, status and limits.

## Public data it reuses

All eight Junta de Castilla y León datasets used are visible in the product and identified in [docs/contest/source-ledger.md](docs/contest/source-ledger.md). They are combined with national classifications and evidence:

| Data                       | Source                                                            | Purpose in SALIDA CyL                  |
| -------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| FP study offer             | JCyL open data (`oferta-de-formacion-profesional`)                | FP programs, modalities, study centers |
| Employment offers          | JCyL open data (`ofertas-de-empleo`)                              | dated snapshot of related offers       |
| ECYL training courses      | JCyL open data (`formacion-del-ecyl`)                             | additional training paths              |
| Professional certificates  | JCyL open data (`certificados-profesionalidad`)                   | qualification context                  |
| Public employment calls    | JCyL open data (`convocatorias-de-empleo-publico`)                | public-sector opportunities            |
| Provincial contracts       | JCyL open data (`contratos-realizados-en-las-provincias...`)      | aggregated regional context            |
| Municipal registry         | JCyL open data (`registro-de-municipios...`)                      | territorial context                    |
| Education center directory | JCyL open data (`directorio-de-centros-docentes`)                 | study locations                        |
| CNO-11                     | [BOE RD 1591/2010](https://www.boe.es/eli/es/rd/2010/11/26/1591)  | searchable occupational classification |
| SEPE occupation market     | [SEPE](https://www.sepe.es/)                                      | linked occupation-market evidence      |
| TodoFP                     | [TodoFP](https://www.todofp.es/)                                  | literal professional outputs           |
| EDUCAbase                  | [Ministerio de Educación](https://estadisticas.educacion.gob.es/) | separate income reference tables       |

Methodology and interpretation boundaries for each source are in [docs/methodology/educabase-income.md](docs/methodology/educabase-income.md) and [docs/methodology/sepe-occupation-market.md](docs/methodology/sepe-occupation-market.md).

## Open data it produces

The reviewed FP↔occupation graph is returned to the community as a **derived open dataset** — JSON and CSV — with source per relationship, open license and SHA-256 integrity, downloadable from the [open-data page](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos).

## Quality

- Published from an immutable snapshot (`20260822085631889-fc9bf2ba23f9`) with a per-resource SHA-256 manifest.
- Reviewed relationships are conservative and fail-closed; a weak match is never published by similarity.
- Unit, release and E2E tests, lint, license and format gates run in CI on every push to `main`.
- Accessibility (Axe), privacy (no accounts, cookies, analytics or runtime AI) and reproducibility are automated.
- See the [jury memo](docs/contest/jury-memo.md) and [technical evidence](docs/contest/technical-evidence.md) for full detail, capture evidence and limits.

## Limitations

- Offers are a **dated snapshot**, not the whole labor market; a reviewed relationship without a current offer match is shown honestly instead of hidden.
- Coverage is limited to reviewed relationships: **133 of 1,058 offers** in the snapshot are reached by published relations, and only relations that can be justified are shown.
- EDUCAbase references keep their statistical scope and are **never** presented as an individual salary, employment probability or guarantee.

## Concurso

[X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) — Productos y Servicios. Verifiable candidate release `v2026.08.27-candidate.4` at commit `a59a788a39bc8d300c66fee39ea2f2469f588112` (snapshot `20260822085631889-7bbe69380f6d`, manifest `92afc80f…`).

- Application: <https://salida-cyl.157-90-22-40.sslip.io/>
- Derived open data: <https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos>
- Methodology: <https://salida-cyl.157-90-22-40.sslip.io/metodologia>
- Jury memo and evidence: [`docs/contest/`](docs/contest/)

## Run locally

Requires Node.js 24.

```sh
npm ci
npm run dev
```

Quality gates:

```sh
npm run license:check
npm run lint
npm test
npm run build
npm run test:e2e
```

Generated public data is rebuilt only through `npm run data:build`. See [DATA_LICENSE.md](DATA_LICENSE.md) for source terms, which retain the terms declared by each publisher.

## Publish

Every push to `main` runs the `Deploy GitHub Pages` workflow: license, contest proof, lint, unit and E2E tests, a Caddy header check and a production build all run on `ubuntu-latest`. Pull requests run the same verification without deploying.

The primary deployment is the VPS at <https://salida-cyl.157-90-22-40.sslip.io/>; GitHub Pages at <https://huntsman1756.github.io/concursos_cyl/> is the fallback. Both serve `version.json` with the deployed commit, and both are verified after every deployment. Operational details are in [docs/deployment.md](docs/deployment.md).

Project code is MIT licensed. Source data retains the terms declared by each publisher.
