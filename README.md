# SALIDA CyL

SALIDA CyL is an independent, open-source web application for exploring reviewed links between vocational training and occupations in Castilla y León. It also compares official annualized contribution-base evidence without merging incompatible national and regional scopes.

The public interface is in Spanish. Code and technical documentation are in English. The application has no accounts, cookies, analytics, browser storage, runtime AI, or transmission of requirement answers.

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

GitHub Pages publishes the development branch at `https://huntsman1756.github.io/concursos_cyl/`. A reproducible Node 24 + Caddy 2 container is also provided. Operational details and verification commands are in [docs/deployment.md](docs/deployment.md).

Project code is MIT licensed. Source data retains the terms declared by each publisher.
