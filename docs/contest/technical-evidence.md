# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `d2f7099d5036337bd776824f9b602f05d49718f6` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `07e4758f42d404c82b4aefc0f10dc816e8b9853f013434bdd723bdc35e0e8112` |
| Generado | 2026-08-13T08:11:56.559Z |
| Snapshot | `20260813081156559-b3abe3e1e8b5` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1044 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/job-offers.json` | 1044 | `4c67d384d6c7e9c9b6791ede56a0001169474ebffc8d1c322595214c597c0632` |
| mappingCoverage | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/mapping-coverage.json` | 209 | `fb5808031d03ffca0b364bd6cf92163f373346b8b82ff47ccb2ee336e4613eba` |
| officialOccupations | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/occupation-aliases.json` | 113 | `71d2b317fdaa4776864d67e7d463dea1e28e86c0b7afccc4ba060852833af5c9` |
| occupations | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/occupations.json` | 83 | `a060ed8f00d7414f7e0b7a6e410c02da13f1de58d1e2e48ef62ef8bb7ae52ae6` |
| outcomeIndicators | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/published-requirements.json` | 320 | `39e458bb581492931b2964ba85cb37d71f0f7360141d359c05951b63c2283765` |
| trainingOccupationLinks | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/training-occupation-links.json` | 141 | `45c1000d7121674a4b8cf64b7b6107081a54c928a930e2386652f9cbba65f3a0` |
| trainingOfferings | `/data/v1/snapshots/20260813081156559-b3abe3e1e8b5/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 40 cualificaciones distintas: `qualification:ADG01B, qualification:ADG01M, qualification:ADG02S, qualification:AFD01S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:COM04S, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S, qualification:TMV02M`.
- 52 claves de modalidad: `ADG01B, ADG01M, ADG01MD, ADG02S, ADG02SD, AFD01S, AFD01SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, COM04S, COM04SD, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, EOC01M, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S, TMV02M`.
- 141 relaciones aprobadas y 113 alias aprobados.
- 19 programas con coincidencias y 33 programas revisados sin coincidencias.
- 21 relaciones alcanzadas y 120 relaciones revisadas sin oferta alcanzada.
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
