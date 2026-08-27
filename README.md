# SALIDA CyL

SALIDA CyL is an independent, open-source web application for exploring reviewed links between vocational training and occupations in Castilla y León. It also compares official annualized contribution-base evidence without merging incompatible national and regional scopes.

The public interface is in Spanish. Code and technical documentation are in English. The application has no accounts, cookies, analytics, runtime AI, or transmission of requirement answers. It stores only the non-sensitive search-mode preference in `localStorage`; selections, searches, comparison answers, and results are not persisted.

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

Generated public data is rebuilt only through `npm run data:build`. See [DATA_LICENSE.md](DATA_LICENSE.md) and [the EDUCAbase method](docs/methodology/educabase-income.md) for source scope and attribution.

## Publish

Every push to `main` runs the `Deploy GitHub Pages` workflow: license, contest proof, lint, unit and E2E tests, a Caddy header check and a production build all run on `ubuntu-latest`. Pull requests run the same verification without deploying.

The primary deployment is the VPS at `https://salida-cyl.157-90-22-40.sslip.io/`, a root-based Caddy build with the project's verified security-header policy (checked by `npm run release:caddy:verify`). GitHub Pages at `https://huntsman1756.github.io/concursos_cyl/` is the fallback deployment; GitHub controls that host's response headers, so the deployed URL must be checked after every release. Both serve `version.json` with the deployed commit, and both must be verified after every deployment. Operational details and verification commands are in [docs/deployment.md](docs/deployment.md).

Project code is MIT licensed. Source data retains the terms declared by each publisher.
