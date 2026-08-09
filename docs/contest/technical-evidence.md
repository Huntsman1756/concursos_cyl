# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `27e7b2ec5996868df6c05edd02d3434a2559c44b` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `27942a492d4f62fb9a3d1e448dfb708663000270564b1e0cb87f15ae86677da1` |
| Generado | 2026-08-09T18:54:38.334Z |
| Snapshot | `20260809185438334-65ce4d3c4e14` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1077 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/job-offers.json` | 1077 | `0631d0880485df26e2f450ee7da70ce7a0b210fe088eca02398a9474a2e6907b` |
| mappingCoverage | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/mapping-coverage.json` | 209 | `f880762313875dbb899343f16ec48df75119f8b3e084aca02716f45c02939634` |
| occupationAliases | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/occupation-aliases.json` | 21 | `4f37bc7c6ff4d76140c79d9e9245c7155ff5f77d5b3bc397796985e13c2fbe7c` |
| occupations | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/occupations.json` | 13 | `204cb90ac21433d11f6c9ae9289d24d5dacd6b4a53315dcf7a9be87d60c2b6f7` |
| outcomeIndicators | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/published-requirements.json` | 337 | `0a9061ecea0e25ef0038ec93839941c8584246e280e0453b4be816ce2d9e3a65` |
| trainingOccupationLinks | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/training-occupation-links.json` | 14 | `f53dab591ec336fb9b64cdbf6616a26a500866e08cae1abe466a3f9b1217ede3` |
| trainingOfferings | `/data/v1/snapshots/20260809185438334-65ce4d3c4e14/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 6 cualificaciones distintas: `qualification:COM02M, qualification:EOC01M, qualification:HOT01M, qualification:IFC03S, qualification:SAN21, qualification:SSC01M`.
- 7 claves de modalidad: `COM02M, EOC01M, HOT01M, IFC03S, IFC03SD, SAN21, SSC01M`.
- 14 relaciones aprobadas y 21 alias aprobados.
- 2 programas con coincidencias y 5 programas revisados sin coincidencias.
- 3 relaciones alcanzadas y 11 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 46 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 1 completado, 7 diferidos, 0 descartados; 6 reservas no intentadas.

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

La revisión independiente confirmó el manifest, los diez recursos, los conjuntos de relaciones y la ausencia de cambios en `data/curated`, `public/data`, `src/domain` y `src/features` desde el commit fuente.

## Despliegue

- URL raíz esperada: [https://huntsman1756.github.io/concursos_cyl/](https://huntsman1756.github.io/concursos_cyl/)
- Commit desplegado: `5e4510ca230daaedf8e2a769d66781a2b319ef1b`.
- Run del workflow: `31338739210`.

El release público se verificó con el commit `5e4510ca230daaedf8e2a769d66781a2b319ef1b` y el run `31338739210` el 2026-08-09T22:21:22.5248634Z.
