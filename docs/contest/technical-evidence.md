# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `b6d195c66e9ac3fce447f7e7e3f56cd173d94b6f` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `e703eeaa92c829ad820d89b4407643131f3471f8de9f4846fa776073d2a5e2cf` |
| Generado | 2026-08-13T01:40:01.646Z |
| Snapshot | `20260813014001646-8616fc30ab76` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1044 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260813014001646-8616fc30ab76/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260813014001646-8616fc30ab76/job-offers.json` | 1044 | `fa011e5e0c866a424f941dd6dddc0713edaafcbb42f617353ba79330425c45ee` |
| mappingCoverage | `/data/v1/snapshots/20260813014001646-8616fc30ab76/mapping-coverage.json` | 209 | `a1b3a62cadaa7adee6d86a7f18ae971bf807fd620df57f8b117e23db68979c2b` |
| officialOccupations | `/data/v1/snapshots/20260813014001646-8616fc30ab76/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260813014001646-8616fc30ab76/occupation-aliases.json` | 107 | `60641f7dbb2f570da4ce463d47a4287dd9314a5041ff9543191032dcda1ef5f6` |
| occupations | `/data/v1/snapshots/20260813014001646-8616fc30ab76/occupations.json` | 82 | `5def10d5faf1715d29c0a01b45cafab7172592443be62b9a32b3e68b197078cc` |
| outcomeIndicators | `/data/v1/snapshots/20260813014001646-8616fc30ab76/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260813014001646-8616fc30ab76/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260813014001646-8616fc30ab76/published-requirements.json` | 320 | `39e458bb581492931b2964ba85cb37d71f0f7360141d359c05951b63c2283765` |
| trainingOccupationLinks | `/data/v1/snapshots/20260813014001646-8616fc30ab76/training-occupation-links.json` | 135 | `d9e31ea9a2a82214e8e6f1fc83b0e6c4cf0f4b2d631d3381aec8f62991f2e08c` |
| trainingOfferings | `/data/v1/snapshots/20260813014001646-8616fc30ab76/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 39 cualificaciones distintas: `qualification:ADG01B, qualification:ADG01M, qualification:ADG02S, qualification:AFD01S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S, qualification:TMV02M`.
- 50 claves de modalidad: `ADG01B, ADG01M, ADG01MD, ADG02S, ADG02SD, AFD01S, AFD01SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, EOC01M, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S, TMV02M`.
- 135 relaciones aprobadas y 107 alias aprobados.
- 11 programas con coincidencias y 39 programas revisados sin coincidencias.
- 11 relaciones alcanzadas y 124 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 56 IDs; delta marginal de la ampliación: 0 IDs.
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
