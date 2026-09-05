# Resumen técnico de evidencia

## Candidato actual

- Estado: candidato local unificado; sin push, tag, release, deploy ni envío externo.
- Commit fuente de la frontera de datos: `36659e6a2e127630e72b14b8641504d5dbea7a9e`.
- Commit documental del freeze: `064d10ed5f48df9e8deec3322f38be7372de5b01`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- SHA-256 del manifest: `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df`.
- Inventario: 22 recursos; 187 programas, 229 centros, 1.294 ofertas formativas y 1.058 ofertas laborales.

## Resultado de datos

El grafo conserva 264 relaciones FP–ocupación aprobadas, 35 alias y 0 programas diferidos. El recurso `offerEvidence` está integrado en el manifest y contiene 1.058 registros, 196 relaciones y 138 ofertas con relación FP revisada. La unión de ofertas alcanzadas es 138 IDs; el delta de cinco frente al matcher proviene exclusivamente de las dos revisiones curadas documentadas en `docs/contest/expansion-v1-candidate-20260830.md`.

La cobertura es deliberadamente fail-closed: una relación no revisada, una categoría ambigua o una oferta sin evidencia suficiente permanece visible como límite, no se convierte en una recomendación automática.

## Evidencia y reproducibilidad

La fuente de verdad es [`public/data/v1/manifest.json`](../../public/data/v1/manifest.json), el snapshot referenciado y [`coverage-freeze.json`](coverage-freeze.json). La validación de esquema, hashes, allowlist, relaciones aprobadas, runtime y bundle forma parte de los gates locales. La evidencia visual existente de la release pública anterior queda histórica y no se cuenta como captura del candidato actual.

Los resultados de la ejecución de readiness se entregan junto con este estado documental. `release-evidence.json` permanece en `pending` hasta que una persona autorice publicación y se capture el candidato desplegado en un contexto anónimo.

## Límites humanos

Adopción, piloto, identidad, contacto, consentimiento y envío externo requieren evidencia o autorización humana. No se presentan como hechos técnicos del producto.
