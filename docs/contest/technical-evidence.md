# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `e6ae073b1b451c7b9327916b6e4c4aaf5ab52c0d` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `7d9299f15017763d1ec773edd4863df696141856872023022237ade60089ac1d` |
| Generado | 2026-08-11T13:59:33.995Z |
| Snapshot | `20260811135933995-c3db7c242202` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1045 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260811135933995-c3db7c242202/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260811135933995-c3db7c242202/job-offers.json` | 1045 | `8862093c117d7f678c6945c18968eec902a64938f5f3b83f129805080b4ed71c` |
| mappingCoverage | `/data/v1/snapshots/20260811135933995-c3db7c242202/mapping-coverage.json` | 209 | `9f63916e38fcf4e9393a5e2c846d418d3b50c9eab41a54836a4d309d8ddb4808` |
| officialOccupations | `/data/v1/snapshots/20260811135933995-c3db7c242202/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260811135933995-c3db7c242202/occupation-aliases.json` | 21 | `4f37bc7c6ff4d76140c79d9e9245c7155ff5f77d5b3bc397796985e13c2fbe7c` |
| occupations | `/data/v1/snapshots/20260811135933995-c3db7c242202/occupations.json` | 19 | `570dd5c5a16b954126a3327f242ba17f32d5dcafdeb31a54cd59a9a736301937` |
| outcomeIndicators | `/data/v1/snapshots/20260811135933995-c3db7c242202/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260811135933995-c3db7c242202/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260811135933995-c3db7c242202/published-requirements.json` | 329 | `09d9e33424511f6e8a73c6886affd7fb2f84e5adc4bcf70797ebd64371450f50` |
| trainingOccupationLinks | `/data/v1/snapshots/20260811135933995-c3db7c242202/training-occupation-links.json` | 21 | `b95ff6ccaa7afc8d81b0a77d0bb91c399ef142db317b381374d51a7fa190dd08` |
| trainingOfferings | `/data/v1/snapshots/20260811135933995-c3db7c242202/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 9 cualificaciones distintas: `qualification:AGA03M, qualification:COM02M, qualification:EOC01M, qualification:FME02M, qualification:HOT01M, qualification:IFC03S, qualification:IMA02M, qualification:SAN21, qualification:SSC01M`.
- 10 claves de modalidad: `AGA03M, COM02M, EOC01M, FME02M, HOT01M, IFC03S, IFC03SD, IMA02M, SAN21, SSC01M`.
- 21 relaciones aprobadas y 21 alias aprobados.
- 2 programas con coincidencias y 8 programas revisados sin coincidencias.
- 2 relaciones alcanzadas y 19 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 42 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 4 completado, 6 diferidos, 0 descartados; 4 reservas no intentadas.

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
- Commit desplegado: `b71b3a8655d00672fd976dba0f04a81840e44de5`.
- Run del workflow: `31470763926`.

El release público se verificó con el commit `b71b3a8655d00672fd976dba0f04a81840e44de5` y el run `31470763926` el 2026-08-11T08:28:36Z.
