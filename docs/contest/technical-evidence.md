# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `e699d50d06d9513dd42a1b6d6d4c281b71ed413a` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `090d68ae09af54bfb484fb44ee83a50a21331663fee9aae707e5a413e490394e` |
| Generado | 2026-08-12T16:03:20.251Z |
| Snapshot | `20260812160320251-68effb257b28` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812160320251-68effb257b28/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812160320251-68effb257b28/job-offers.json` | 1054 | `41022423f185311a9b98833497aa908d13ec24e0f125a69f022eb72047204300` |
| mappingCoverage | `/data/v1/snapshots/20260812160320251-68effb257b28/mapping-coverage.json` | 209 | `880a033576396e6dd255bef5a37f4eb001cca0cd094e30976bd121afa2b15480` |
| officialOccupations | `/data/v1/snapshots/20260812160320251-68effb257b28/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812160320251-68effb257b28/occupation-aliases.json` | 71 | `0277820bea7de529d9166913479ae0a9824549a45054cc532d23fca64896d2a0` |
| occupations | `/data/v1/snapshots/20260812160320251-68effb257b28/occupations.json` | 66 | `865d1bd84d1b8bfe056b39c1c3f7c473f512440ff8dbf13858f6606a97808f3f` |
| outcomeIndicators | `/data/v1/snapshots/20260812160320251-68effb257b28/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812160320251-68effb257b28/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812160320251-68effb257b28/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812160320251-68effb257b28/training-occupation-links.json` | 100 | `00229e114a19cd30cf7383c986ba191959b6be05852e87a4891cdf4a6e8fa0a6` |
| trainingOfferings | `/data/v1/snapshots/20260812160320251-68effb257b28/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 28 cualificaciones distintas: `qualification:ADG01B, qualification:ADG02S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM02M, qualification:ELE01B, qualification:ELE01M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M`.
- 36 claves de modalidad: `ADG01B, ADG02S, ADG02SD, AGA01M, AGA03M, COM01B, COM02M, ELE01B, ELE01M, ELE01MD, ELE03S, EOC01M, FME01M, FME02M, HOT01B, HOT01M, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMP02M, MAM01M, SAN02M, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M`.
- 100 relaciones aprobadas y 71 alias aprobados.
- 5 programas con coincidencias y 31 programas revisados sin coincidencias.
- 5 relaciones alcanzadas y 95 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 46 IDs; delta marginal de la ampliación: 0 IDs.
- Intentos terminales: 11 completado, 3 diferidos, 0 descartados; 0 reservas no intentadas.

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
