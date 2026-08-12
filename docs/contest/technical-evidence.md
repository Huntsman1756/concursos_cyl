# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `c7bcdfdf9a0dbad605d44474064c761cd2ef3158` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `f134895c1f9f40f5fc67f0bcd612fba2168b6099abefd92d57d0267fa8011676` |
| Generado | 2026-08-12T15:14:18.614Z |
| Snapshot | `20260812151418614-7a7a10e4ad15` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/job-offers.json` | 1054 | `dc5f3bbc8a5979976a75d8193e7786054fad1d4b7ef3631fe86afb840e63d56b` |
| mappingCoverage | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/mapping-coverage.json` | 209 | `08a3a1ab2a4b8b8d02a757e7861ff66922cb8d7a418f6c967bea20171294e842` |
| officialOccupations | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/occupation-aliases.json` | 37 | `2eb2e431827bee5da72adab949364d4b193b4db264d5e0e502b43b20e1b8376f` |
| occupations | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/occupations.json` | 46 | `20f75adc9e7da76e2dcb730eafbef81542e105e1531889dffe863db2576da373` |
| outcomeIndicators | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/training-occupation-links.json` | 60 | `7bf09adc6b6983bbed609f6ed56afc9b1cf1d7ccf4c5c93785fb70baa5536692` |
| trainingOfferings | `/data/v1/snapshots/20260812151418614-7a7a10e4ad15/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 20 cualificaciones distintas: `qualification:ADG02S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01M, qualification:IFC01M, qualification:IFC03S, qualification:IMA02M, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:TMV01M`.
- 24 claves de modalidad: `ADG02S, ADG02SD, AGA01M, AGA03M, COM01B, COM02M, ELE03S, EOC01M, FME01M, FME02M, HOT01M, IFC01M, IFC01MD, IFC03S, IFC03SD, IMA02M, IMP02M, MAM01M, SAN02M, SAN21, SSC01M, SSC01S, SSC01SD, TMV01M`.
- 60 relaciones aprobadas y 37 alias aprobados.
- 5 programas con coincidencias y 19 programas revisados sin coincidencias.
- 5 relaciones alcanzadas y 55 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 46 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 10 completado, 4 diferidos, 0 descartados; 0 reservas no intentadas.

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
- Commit desplegado: **PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**.
- Run del workflow: **PENDIENTE DE DESPLIEGUE Y VERIFICACIÓN**.

Estos dos campos no se inventan antes de ejecutar y verificar el release.
