# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `6b37a4c3eb5be85bd6eb7fe4892e9d8a904f9ed9` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `dc05d74a626d90c87a18ea88f1e0bd9e1762b41876c367e173412f4a4276a0f4` |
| Generado | 2026-08-11T22:22:21.076Z |
| Snapshot | `20260811222221076-727a2dfa2791` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260811222221076-727a2dfa2791/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260811222221076-727a2dfa2791/job-offers.json` | 1054 | `65ff8914517e770d15e4f3b1a7413988c85207cf73b36993be99296e31866493` |
| mappingCoverage | `/data/v1/snapshots/20260811222221076-727a2dfa2791/mapping-coverage.json` | 209 | `0d76a4c1bac0a90defc3555bdb748e0504b6c78ca8aab813a0321a12cae09baa` |
| officialOccupations | `/data/v1/snapshots/20260811222221076-727a2dfa2791/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260811222221076-727a2dfa2791/occupation-aliases.json` | 21 | `4f37bc7c6ff4d76140c79d9e9245c7155ff5f77d5b3bc397796985e13c2fbe7c` |
| occupations | `/data/v1/snapshots/20260811222221076-727a2dfa2791/occupations.json` | 31 | `561ec60aa1daf07a8781ccf38ea88ed0ca815638c7e4f1b53e46ca7fc7aacd2e` |
| outcomeIndicators | `/data/v1/snapshots/20260811222221076-727a2dfa2791/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260811222221076-727a2dfa2791/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260811222221076-727a2dfa2791/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260811222221076-727a2dfa2791/training-occupation-links.json` | 36 | `993e32b68313e24c2a13bb3cd0c4f1c95a0b1d550dedf13272b13546e1cfa2bd` |
| trainingOfferings | `/data/v1/snapshots/20260811222221076-727a2dfa2791/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 13 cualificaciones distintas: `qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM02M, qualification:ELE03S, qualification:EOC01M, qualification:FME02M, qualification:HOT01M, qualification:IFC03S, qualification:IMA02M, qualification:SAN21, qualification:SSC01M, qualification:TMV01M`.
- 14 claves de modalidad: `AGA01M, AGA03M, COM01B, COM02M, ELE03S, EOC01M, FME02M, HOT01M, IFC03S, IFC03SD, IMA02M, SAN21, SSC01M, TMV01M`.
- 36 relaciones aprobadas y 21 alias aprobados.
- 2 programas con coincidencias y 12 programas revisados sin coincidencias.
- 2 relaciones alcanzadas y 34 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 43 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 8 completado, 6 diferidos, 0 descartados; 0 reservas no intentadas.

La cifra de ofertas es una unión de IDs de ofertas que pasan las reglas de matching con los datos publicados. No es un recuento de todo el mercado ni una proyección.

## Reproducibilidad

Comandos ejecutados sobre el commit congelado:

```text
npm run data:build
npm test -- --run
npm run test:e2e -- --workers=2
npm run lint
npm run build
npm run license:check
npm run format:check
npm run analysis:aliases:validate
npm run analysis:aliases:report:check
npm run analysis:pilot:validate
npm run analysis:pilot:report:check
npm exec -- tsx scripts/release/validateContestFreeze.ts
```

La revisión independiente confirmó el manifest, sus 11 recursos, los conjuntos de relaciones y la ausencia de cambios en `data/curated`, `public/data`, `src/domain` y `src/features` desde el commit fuente.

## Despliegue

- URL raíz esperada: [https://salida-cyl.157-90-22-40.sslip.io/](https://salida-cyl.157-90-22-40.sslip.io/)
- Commit desplegado: `0914a8b926f97f79d4965879779692c8ee476b91`.
- Run del workflow: `31549229861`.

El release público se verificó con el commit `0914a8b926f97f79d4965879779692c8ee476b91` y el run `31549229861` el 2026-08-12T00:22:22Z.
