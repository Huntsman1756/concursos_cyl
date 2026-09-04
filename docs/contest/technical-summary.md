# Resumen técnico de evidencia

## Candidato actual

- Producto publicado: `v2026.09.04-candidate.10`, tag anotado `ac5d9a8a961c4566c5bee65a565739c8176c0760` sobre el commit `4b67443c4cb1b29347eef38d751eb4f8d02cb2a9`, con GitHub Release pública.
- Despliegue público verificado en la raíz VPS: `version.json` y manifest observados coinciden con ese commit. El despliegue se ejecutó con el script VPS (`scripts/release/deployVps.ps1`), sin run de GitHub Actions.
- Commit fuente de la frontera de datos: `36659e6a2e127630e72b14b8641504d5dbea7a9e`.
- Commit documental del freeze: `064d10ed5f48df9e8deec3322f38be7372de5b01`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- SHA-256 del manifest: `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df`.
- Inventario: 22 recursos; 187 programas, 229 centros, 1.294 ofertas formativas y 1.058 ofertas laborales.

## Resultado de datos

El grafo conserva 264 relaciones FP–ocupación aprobadas, 35 alias y 0 programas diferidos. El recurso `offerEvidence` está integrado en el manifest y contiene 1.058 registros, 196 relaciones y 138 ofertas con relación FP revisada. La unión de ofertas alcanzadas es 138 IDs; el delta de cinco frente al matcher proviene exclusivamente de las dos revisiones curadas documentadas en `docs/contest/expansion-v1-candidate-20260830.md`.

La cobertura es deliberadamente fail-closed: una relación no revisada, una categoría ambigua o una oferta sin evidencia suficiente permanece visible como límite, no se convierte en una recomendación automática.

## Evidencia y reproducibilidad

La fuente de verdad es [`public/data/v1/manifest.json`](../../public/data/v1/manifest.json), el snapshot referenciado y [`coverage-freeze.json`](coverage-freeze.json). La validación de esquema, hashes, allowlist, relaciones aprobadas, runtime y bundle forma parte de los gates locales. Las 13 capturas de `docs/contest/evidence-capture.json` se regeneraron contra el sitio desplegado del candidato actual y quedan ligadas a su commit de publicación.

Los resultados de los gates ejecutados sobre el commit de producto, el despliegue por script VPS y la verificación pública están registrados en `release-evidence.json` (schemaVersion 2, estado `verified`). Los campos de aprobación humana siguen en falso hasta que una persona autorice el envío externo.

## Límites humanos

Adopción, piloto, identidad, contacto, consentimiento y envío externo requieren evidencia o autorización humana. No se presentan como hechos técnicos del producto.
