# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `e16cefe809b703ccab24dccd9c0b4c7863f5233b` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `872f7afe0bb344553fd3442736cb93c5f657caad69b2fb04f43c3cf2c0f3d2ff` |
| Generado | 2026-08-13T11:57:11.843Z |
| Snapshot | `20260813115711843-f7ea169cda29` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1044 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260813115711843-f7ea169cda29/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260813115711843-f7ea169cda29/job-offers.json` | 1044 | `a7d783406e4e35ebf747f4d133d763da00b4818987767abadd148824950feb11` |
| mappingCoverage | `/data/v1/snapshots/20260813115711843-f7ea169cda29/mapping-coverage.json` | 209 | `38f16571fc5b53e37545ff6cee0db018b757d10ea7402bee2da6ef0c0eec1276` |
| officialOccupations | `/data/v1/snapshots/20260813115711843-f7ea169cda29/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260813115711843-f7ea169cda29/occupation-aliases.json` | 113 | `71d2b317fdaa4776864d67e7d463dea1e28e86c0b7afccc4ba060852833af5c9` |
| occupations | `/data/v1/snapshots/20260813115711843-f7ea169cda29/occupations.json` | 85 | `6040b036aa534f103b3de38dee48b307fbd55cdc7984d71dcfe4a8861b9b5525` |
| outcomeIndicators | `/data/v1/snapshots/20260813115711843-f7ea169cda29/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260813115711843-f7ea169cda29/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260813115711843-f7ea169cda29/published-requirements.json` | 320 | `39e458bb581492931b2964ba85cb37d71f0f7360141d359c05951b63c2283765` |
| trainingOccupationLinks | `/data/v1/snapshots/20260813115711843-f7ea169cda29/training-occupation-links.json` | 145 | `3365384ee168244d2bfeea7369a001107fc1c3dc78249589f687b1299f937ce3` |
| trainingOfferings | `/data/v1/snapshots/20260813115711843-f7ea169cda29/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 42 cualificaciones distintas: `qualification:ADG01B, qualification:ADG01M, qualification:ADG02S, qualification:AFD01S, qualification:AFD02S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:COM04S, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01B, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S, qualification:TMV02M`.
- 55 claves de modalidad: `ADG01B, ADG01M, ADG01MD, ADG02S, ADG02SD, AFD01S, AFD01SD, AFD02S, AFD02SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, COM04S, COM04SD, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, EOC01M, FME01B, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S, TMV02M`.
- 145 relaciones aprobadas y 113 alias aprobados.
- 19 programas con coincidencias y 36 programas revisados sin coincidencias.
- 21 relaciones alcanzadas y 124 relaciones revisadas sin oferta alcanzada.
- Unión de coincidencias: 69 IDs; delta marginal de la ampliación: 0 IDs.
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
