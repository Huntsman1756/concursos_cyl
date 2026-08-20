# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `40d2e4fc7d771f1774926391dd4d2130feb183a6` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `4efd9990fb7e30f466bb592e70616b7ecbaaee8b6539c084660840980f9d9f3f` |
| Generado | 2026-08-20T06:40:24.473Z |
| Snapshot | `20260820064024473-eb120ecc88eb` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1026 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/job-offers.json` | 1026 | `c3c6827f40c0c5fb4178c495f7f739a0510ed2d4eb61a6c2f05cf6453dd85806` |
| mappingCoverage | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/mapping-coverage.json` | 209 | `03647dbc7995f1f6f6984f8ea3e9b0818d5f3cb4e5bc812acafd0c8e3d02b8f9` |
| officialOccupations | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/occupation-aliases.json` | 21 | `4f37bc7c6ff4d76140c79d9e9245c7155ff5f77d5b3bc397796985e13c2fbe7c` |
| occupations | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/occupations.json` | 91 | `f6c4b34a6fd5760c967273e4cc085abf6a3865baadfa2c721ac07dcd90fe3f09` |
| outcomeIndicators | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/published-requirements.json` | 333 | `791ed86a1805afffdea2125fb682b14ab1e67b63d9d759b4af11f86776b8e3a2` |
| trainingOccupationLinks | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/training-occupation-links.json` | 14 | `f53dab591ec336fb9b64cdbf6616a26a500866e08cae1abe466a3f9b1217ede3` |
| trainingOfferings | `/data/v1/snapshots/20260820064024473-eb120ecc88eb/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 6 cualificaciones distintas: `qualification:COM02M, qualification:EOC01M, qualification:HOT01M, qualification:IFC03S, qualification:SAN21, qualification:SSC01M`.
- 7 claves de modalidad: `COM02M, EOC01M, HOT01M, IFC03S, IFC03SD, SAN21, SSC01M`.
- 14 relaciones aprobadas y 21 alias aprobados.
- 2 programas con coincidencias y 5 programas revisados sin coincidencias.
- 3 relaciones alcanzadas y 11 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 39 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 11 completado, 0 diferidos, 0 descartados; 0 reservas no intentadas.

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
