# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `4fdf078c87905fe7adf84b07850789306f87b3f1` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `8cd5c5bcbd53ea7fca0cec11d7a7866e1d7dcfebdee2d3bf58dad15825001321` |
| Generado | 2026-08-09T18:54:38.334Z |
| Snapshot | `20260809185438334-e9ea8694331b` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1077 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260809185438334-e9ea8694331b/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260809185438334-e9ea8694331b/job-offers.json` | 1077 | `0631d0880485df26e2f450ee7da70ce7a0b210fe088eca02398a9474a2e6907b` |
| mappingCoverage | `/data/v1/snapshots/20260809185438334-e9ea8694331b/mapping-coverage.json` | 209 | `bec38d839c701074a755d92f3b8eb5d984d2002605d2b78ceba84af3458a0503` |
| officialOccupations | `/data/v1/snapshots/20260809185438334-e9ea8694331b/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260809185438334-e9ea8694331b/occupation-aliases.json` | 21 | `fbd4ca379e14c5152ee1620de5b4176d8102fc554c4e31139a98550d8855dd68` |
| occupations | `/data/v1/snapshots/20260809185438334-e9ea8694331b/occupations.json` | 91 | `f6c4b34a6fd5760c967273e4cc085abf6a3865baadfa2c721ac07dcd90fe3f09` |
| outcomeIndicators | `/data/v1/snapshots/20260809185438334-e9ea8694331b/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260809185438334-e9ea8694331b/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260809185438334-e9ea8694331b/published-requirements.json` | 337 | `cb9e2383f4f3ad92e9f6c26f6843d8e5de143098e8d69c46ca09092f8148ee40` |
| trainingOccupationLinks | `/data/v1/snapshots/20260809185438334-e9ea8694331b/training-occupation-links.json` | 14 | `6905d125dd051934d1bf3efca0fe04dca45204a7464317f9634d1e753c6098ef` |
| trainingOfferings | `/data/v1/snapshots/20260809185438334-e9ea8694331b/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 6 cualificaciones distintas: `qualification:COM02M, qualification:EOC01M, qualification:HOT01M, qualification:IFC03S, qualification:SAN21, qualification:SSC01M`.
- 7 claves de modalidad: `COM02M, EOC01M, HOT01M, IFC03S, IFC03SD, SAN21, SSC01M`.
- 14 relaciones aprobadas y 21 alias aprobados.
- 2 programas con coincidencias y 5 programas revisados sin coincidencias.
- 3 relaciones alcanzadas y 11 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 46 IDs; delta marginal de la ampliación: 0 IDs.
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
