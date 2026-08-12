# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `e68f2ca7bb98af290dd6d25797398cf4d778d590` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `90f96ed747c3d369c54c816701783cd0473e07d8a80d2b63f63cb9a1f6dec149` |
| Generado | 2026-08-12T18:28:23.819Z |
| Snapshot | `20260812182823819-b36dc2a9111a` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/job-offers.json` | 1054 | `9a7c56e441e300d90b42a20cf7da5a345bc91069c11a635e27c211107ac3d7e4` |
| mappingCoverage | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/mapping-coverage.json` | 209 | `a1b3a62cadaa7adee6d86a7f18ae971bf807fd620df57f8b117e23db68979c2b` |
| officialOccupations | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/occupation-aliases.json` | 102 | `b7fec28a533a6c18e9c1832bd3f9d1c09c0871fc2c1209b7e8f536ebe2eb9f72` |
| occupations | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/occupations.json` | 82 | `5def10d5faf1715d29c0a01b45cafab7172592443be62b9a32b3e68b197078cc` |
| outcomeIndicators | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/training-occupation-links.json` | 135 | `d9e31ea9a2a82214e8e6f1fc83b0e6c4cf0f4b2d631d3381aec8f62991f2e08c` |
| trainingOfferings | `/data/v1/snapshots/20260812182823819-b36dc2a9111a/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 39 cualificaciones distintas: `qualification:ADG01B, qualification:ADG01M, qualification:ADG02S, qualification:AFD01S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S, qualification:TMV02M`.
- 50 claves de modalidad: `ADG01B, ADG01M, ADG01MD, ADG02S, ADG02SD, AFD01S, AFD01SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, EOC01M, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S, TMV02M`.
- 135 relaciones aprobadas y 102 alias aprobados.
- 6 programas con coincidencias y 44 programas revisados sin coincidencias.
- 6 relaciones alcanzadas y 129 relaciones revisadas sin oferta alcanzada.
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
