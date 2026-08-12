# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `2709cfc0bb1945f99c4500e0e7d4e29bcb5d02b8` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `273a5da8b250568c4bdd1077cd049109cec55b7a3a46477c07012df882fe1d6d` |
| Generado | 2026-08-12T12:32:18.779Z |
| Snapshot | `20260812123218779-818012d7bffb` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812123218779-818012d7bffb/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812123218779-818012d7bffb/job-offers.json` | 1054 | `c57832fcca4b851c39f281dda950ce0d541dfdb743fe9282322445d358f8f681` |
| mappingCoverage | `/data/v1/snapshots/20260812123218779-818012d7bffb/mapping-coverage.json` | 209 | `abb39556c2ba688e46b0880efacf038daf48d8746615eb1bb0780d74f2d2fc8a` |
| officialOccupations | `/data/v1/snapshots/20260812123218779-818012d7bffb/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812123218779-818012d7bffb/occupation-aliases.json` | 22 | `500a8659e47895888067636c932be01cd66917c79b0744b400b49901c992afc1` |
| occupations | `/data/v1/snapshots/20260812123218779-818012d7bffb/occupations.json` | 36 | `1448b222abad2dd827e334eadde2584365ee1d3cd4042da9ce23fdc1e1f103d2` |
| outcomeIndicators | `/data/v1/snapshots/20260812123218779-818012d7bffb/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812123218779-818012d7bffb/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812123218779-818012d7bffb/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812123218779-818012d7bffb/training-occupation-links.json` | 41 | `5e805ce2d9c58c3fe182c5969bcef9c2f38ebc65cbafbb59c7f03ff77ca47980` |
| trainingOfferings | `/data/v1/snapshots/20260812123218779-818012d7bffb/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 15 cualificaciones distintas: `qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01M, qualification:IFC03S, qualification:IMA02M, qualification:MAM01M, qualification:SAN21, qualification:SSC01M, qualification:TMV01M`.
- 16 claves de modalidad: `AGA01M, AGA03M, COM01B, COM02M, ELE03S, EOC01M, FME01M, FME02M, HOT01M, IFC03S, IFC03SD, IMA02M, MAM01M, SAN21, SSC01M, TMV01M`.
- 41 relaciones aprobadas y 22 alias aprobados.
- 3 programas con coincidencias y 13 programas revisados sin coincidencias.
- 3 relaciones alcanzadas y 38 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 44 IDs; delta marginal de la ampliación: 0 IDs.
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
