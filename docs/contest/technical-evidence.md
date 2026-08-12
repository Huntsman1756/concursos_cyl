# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `097e350d684037d0c8ca10e9f80678df273e125e` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `9a628b2399ebe54607c8c69bf9388c2cf6e4fb81a8dcd6b0e6e83ae2ff07bfb2` |
| Generado | 2026-08-12T13:23:31.937Z |
| Snapshot | `20260812132331937-38e1812a9531` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812132331937-38e1812a9531/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812132331937-38e1812a9531/job-offers.json` | 1054 | `25120973e1f1b4ee47e7c271611167ec9415c0c35b8cc3605fc7334caf80af6c` |
| mappingCoverage | `/data/v1/snapshots/20260812132331937-38e1812a9531/mapping-coverage.json` | 209 | `c89335e9d67d15ffe8b19e0b12ba2f5b0e08415d22201f421f6b96a1ffaade00` |
| officialOccupations | `/data/v1/snapshots/20260812132331937-38e1812a9531/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812132331937-38e1812a9531/occupation-aliases.json` | 28 | `8e7f2fe7eff6b42973491c479da545819cdc98c790205935c13fdf2ec45f7a64` |
| occupations | `/data/v1/snapshots/20260812132331937-38e1812a9531/occupations.json` | 39 | `0434df32e8959c7f92ebaf5ddb02d2606b63256fb3b3ab46be4fa96477806dee` |
| outcomeIndicators | `/data/v1/snapshots/20260812132331937-38e1812a9531/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812132331937-38e1812a9531/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812132331937-38e1812a9531/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812132331937-38e1812a9531/training-occupation-links.json` | 44 | `3e053edda2dca92a60fdff9ac41c204913495b0c665f9240434ba25800f6f876` |
| trainingOfferings | `/data/v1/snapshots/20260812132331937-38e1812a9531/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 17 cualificaciones distintas: `qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01M, qualification:IFC03S, qualification:IMA02M, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN21, qualification:SSC01M, qualification:TMV01M`.
- 18 claves de modalidad: `AGA01M, AGA03M, COM01B, COM02M, ELE03S, EOC01M, FME01M, FME02M, HOT01M, IFC03S, IFC03SD, IMA02M, IMP02M, MAM01M, SAN02M, SAN21, SSC01M, TMV01M`.
- 44 relaciones aprobadas y 28 alias aprobados.
- 5 programas con coincidencias y 13 programas revisados sin coincidencias.
- 5 relaciones alcanzadas y 39 relaciones revisadas sin oferta alcanzada.
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
