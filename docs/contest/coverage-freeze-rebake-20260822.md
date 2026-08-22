# Coverage freeze rebake — schema 2 — 2026-08-22

El freeze se regeneró contra el límite exacto
`ff9e6197f926e462bea1a3e8ac6a57a23d3f825a`, último commit que cambió una
dependencia real del cálculo de cobertura, después de aplicar las
remediaciones de evidencia y regenerar el snapshot activo. Este SHA es la
frontera inmutable de cobertura y datos candidato; no es la identidad de una
compilación posterior. La frontera enlaza los inputs de config, análisis,
catálogos, datos curados, esquemas, datos públicos y validación, además de
`src/domain/offerMatching.ts` y `src/domain/requirements.ts`; las rutas UI,
search y print quedan fuera.

El documento usa `schemaVersion: "2.0.0"` y no contiene estado de publicación,
despliegue ni mutación live.
Los valores heredados del documento schema 1 fueron descartados y todos los
recursos, hashes, conteos, cobertura, ofertas e intentos se recomputaron desde
el manifest público actual.

## Resultado

- Manifest: `public/data/v1/manifest.json`
- SHA-256 del manifest: `92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18`
- Snapshot: `20260822085631889-7bbe69380f6d`
- Calidad: `passed`
- Inventario: 21 recursos; la evidencia SEPE canónica contiene 116 registros
- Cobertura: 113 cualificaciones, 130 claves de modalidad, 264 relaciones y 21 alias
- Ofertas alcanzadas: 38 de 1.058, como unión de IDs
- Relaciones revisadas sin oferta alcanzada: 261
- Programas diferidos: 0

## Validación

El documento canónico es `docs/contest/coverage-freeze.json`. Se comprobó con:

```text
npm exec -- tsx scripts/release/validateContestFreeze.ts
```

La suficiencia semántica de las relaciones sigue separada del suelo común del
validador. La muestra determinista seleccionada sobre este límite registra 15
PASS y 0 FAIL tras una segunda revisión independiente de la URL oficial y la
cita registrada. Las otras 249 relaciones no fueron muestreadas, por lo que el
resultado no es una auditoría exhaustiva.
