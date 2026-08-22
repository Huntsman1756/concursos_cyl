# Coverage freeze rebake — 2026-08-22

El freeze se regeneró contra el límite exacto
`7a9a05a2ddcb3a89173a645e7308d327763a4e17`, después de aplicar las
remediaciones de evidencia y regenerar el snapshot activo. El rebake no
modifica `data/curated`, `public/data` ni `src/domain`/`src/features`.

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
- Despliegue: pendiente de observación pública

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
