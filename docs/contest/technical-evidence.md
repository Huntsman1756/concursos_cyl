# Evidencia técnica

## Freeze de cobertura

<!-- prettier-ignore -->
| Campo | Valor |
| --- | --- |
| Commit fuente | `03b34e43a2e9293d4afb722841001eacb29149d3` |
| Manifest | `public/data/v1/manifest.json` |
| SHA-256 del manifest | `3c14a8710f6817d19f7066b0cdd1cd8b9c471ad87010ff2e6bae41c9905cadd1` |
| Generado | 2026-08-12T17:09:14.964Z |
| Snapshot | `20260812170914964-b136734b1f03` |
| Estado de calidad | passed |
| Centros | 229 |
| Programas | 187 |
| Ofertas formativas | 1294 |
| Ofertas laborales | 1054 |

### Recursos inmutables del snapshot

<!-- prettier-ignore -->
| Recurso | Ruta | Registros | SHA-256 |
| --- | --- | ---: | --- |
| centers | `/data/v1/snapshots/20260812170914964-b136734b1f03/centers.json` | 229 | `593b7780f6cb9511c02edb26a769e5e1f951624f6e4b923a8e34caacb230c87a` |
| jobOffers | `/data/v1/snapshots/20260812170914964-b136734b1f03/job-offers.json` | 1054 | `d31e64af3ac58360c2326e332a9789b33d48c624ac31da574743ad523a62b92d` |
| mappingCoverage | `/data/v1/snapshots/20260812170914964-b136734b1f03/mapping-coverage.json` | 209 | `f1e450ed999c5806d283e4a772622b5c7ec5cbeaa63e4e1cd17e80374529b0ee` |
| officialOccupations | `/data/v1/snapshots/20260812170914964-b136734b1f03/official-occupations.json` | 502 | `76fa213f97c98e5af0f9bf120323ba3abb32df78e797c381e5454cadc858f64b` |
| occupationAliases | `/data/v1/snapshots/20260812170914964-b136734b1f03/occupation-aliases.json` | 102 | `b7fec28a533a6c18e9c1832bd3f9d1c09c0871fc2c1209b7e8f536ebe2eb9f72` |
| occupations | `/data/v1/snapshots/20260812170914964-b136734b1f03/occupations.json` | 82 | `5def10d5faf1715d29c0a01b45cafab7172592443be62b9a32b3e68b197078cc` |
| outcomeIndicators | `/data/v1/snapshots/20260812170914964-b136734b1f03/outcome-indicators.json` | 22170 | `4f2c6b73fc4171bb9daf21583712ab2ec99bcaa7d27b1f2fd0c070b9079ab3e2` |
| programs | `/data/v1/snapshots/20260812170914964-b136734b1f03/programs.json` | 187 | `90df87b283b5ff003dda20c9c4f7eac52b903e611753d107d4b927bbc4e19b72` |
| publishedRequirements | `/data/v1/snapshots/20260812170914964-b136734b1f03/published-requirements.json` | 322 | `fbf95ee4801f76af0f8cfad5465034a75a543f2e3d8a78c73cd4692afd33a3ad` |
| trainingOccupationLinks | `/data/v1/snapshots/20260812170914964-b136734b1f03/training-occupation-links.json` | 131 | `fcd029a59e30a14d5615426886378bc643f19a5b50328f305a45fc951032de30` |
| trainingOfferings | `/data/v1/snapshots/20260812170914964-b136734b1f03/training-offerings.json` | 1294 | `0948871f993a4f0a03ed42ccef060c4a395e0898dc230086f234345fee7e880a` |

## Recomputación de cobertura

- 36 cualificaciones distintas: `qualification:ADG01B, qualification:ADG02S, qualification:AFD01S, qualification:AGA01M, qualification:AGA03M, qualification:COM01B, qualification:COM01M, qualification:COM02M, qualification:ELE01B, qualification:ELE01M, qualification:ELE02M, qualification:ELE03S, qualification:EOC01M, qualification:FME01M, qualification:FME02M, qualification:HOT01B, qualification:HOT01M, qualification:IFC01B, qualification:IFC01M, qualification:IFC01S, qualification:IFC02S, qualification:IFC03S, qualification:IMA02M, qualification:IMA03S, qualification:IMP01B, qualification:IMP02M, qualification:MAM01M, qualification:SAN02M, qualification:SAN08S, qualification:SAN21, qualification:SSC01M, qualification:SSC01S, qualification:SSC03S, qualification:TMV01B, qualification:TMV01M, qualification:TMV01S`.
- 46 claves de modalidad: `ADG01B, ADG02S, ADG02SD, AFD01S, AFD01SD, AGA01M, AGA03M, COM01B, COM01M, COM02M, ELE01B, ELE01M, ELE01MD, ELE02M, ELE03S, EOC01M, FME01M, FME02M, HOT01B, HOT01M, IFC01B, IFC01M, IFC01MD, IFC01S, IFC01SD, IFC02S, IFC02SD, IFC03S, IFC03SD, IMA02M, IMA03S, IMP01B, IMP02M, MAM01M, SAN02M, SAN08S, SAN08SD, SAN21, SSC01M, SSC01S, SSC01SD, SSC03S, SSC03SD, TMV01B, TMV01M, TMV01S`.
- 131 relaciones aprobadas y 102 alias aprobados.
- 6 programas con coincidencias y 40 programas revisados sin coincidencias.
- 6 relaciones alcanzadas y 125 relaciones revisadas sin oferta alcanzada.
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
