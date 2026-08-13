# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `ab9144a655d758e3d5041397f4be50453c1ff4bb` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `cfe79d81e1f62d6b5c09a3cdcf6add5857dd9c1b0f4fc8822b0517a742a707fe` |
| Generado | 2026-08-13T13:21:03.035Z |
| Snapshot | `20260813132103035-eb57640834e9` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1044 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260813132103035-eb57640834e9/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260813132103035-eb57640834e9/job-offers.json` | 1044 | `cad1648d9890eb2d49c7b4e89d3937c9244369f57eb6262880c92dd442220e0a` |
| mappingCoverage | `/data/v1/snapshots/20260813132103035-eb57640834e9/mapping-coverage.json` | 209 | `b0636d6ff742f7edbab757bcd7b243000eaa1e8cac7ada9a9214e4b28ffa21c1` |
| officialOccupations | `/data/v1/snapshots/20260813132103035-eb57640834e9/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260813132103035-eb57640834e9/occupation-aliases.json` | 113 | `71d2b317fdaa4776864d67e7d463dea1e28e86c0b7afccc4ba060852833af5c9` |
| occupations | `/data/v1/snapshots/20260813132103035-eb57640834e9/occupations.json` | 91 | `f6c4b34a6fd5760c967273e4cc085abf6a3865baadfa2c721ac07dcd90fe3f09` |
| outcomeIndicators | `/data/v1/snapshots/20260813132103035-eb57640834e9/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260813132103035-eb57640834e9/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260813132103035-eb57640834e9/published-requirements.json` | 320 | `39e458bb581492931b2964ba85cb37d71f0f7360141d359c05951b63c2283765` |
| trainingOccupationLinks | `/data/v1/snapshots/20260813132103035-eb57640834e9/training-occupation-links.json` | 151 | `fb0a308147cc72ad9375035f314266bc69e1a8a421668c0395a787bad5df58e0` |
| trainingOfferings | `/data/v1/snapshots/20260813132103035-eb57640834e9/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 43 cualificaciones distintas: `qualification:ADG01B, qualification:ADG01M, qualification:ADG02S, qualification:AFD01S, qualification:AFD02S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:COM04S, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:ELE04S, qualification:EOC01M, qualification:FME01B, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S, qualification:TMV02M`.
- 56 claves de modalidad: `ADG01B, ADG01M, ADG01MD, ADG02S, ADG02SD, AFD01S, AFD01SD, AFD02S, AFD02SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, COM04S, COM04SD, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, ELE04S, EOC01M, FME01B, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S, TMV02M`.
- 151 relaciones aprobadas y 113 alias aprobados.
- 19 programas con coincidencias y 37 programas revisados sin coincidencias.
- 21 relaciones alcanzadas y 130 relaciones revisadas sin oferta alcanzada.
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
