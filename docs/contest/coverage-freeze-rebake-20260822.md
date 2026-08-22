# Coverage freeze rebake — 2026-08-22

El freeze se regeneró contra el límite exacto
`e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`, después de aplicar las
remediaciones de evidencia y regenerar el snapshot activo. El rebake no
modifica `data/curated`, `public/data` ni `src/domain`/`src/features`.

## Resultado

- Manifest: `public/data/v1/manifest.json`
- SHA-256 del manifest: `ce47c7cf7011a3dcebddf2a3dac01c3e34ee175a18ac133211b5b5ca3fb3ba11`
- Snapshot: `20260822021233066-9d8fa948959b`
- Calidad: `passed`
- Cobertura: 104 cualificaciones, 121 claves de modalidad, 248 relaciones y 21 alias
- Ofertas alcanzadas: 38 de 1.058, como unión de IDs
- Relaciones revisadas sin oferta alcanzada: 245
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
cita registrada. Las otras 233 relaciones no fueron muestreadas, por lo que el
resultado no es una auditoría exhaustiva.
