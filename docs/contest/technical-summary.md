# Resumen técnico de evidencia

## Candidato actual

- Estado: C15 publicado en VPS, commit `02d6805e5cb661f3289ade47ad2364b26fd346f8`; candidatura no enviada. [Registro completo](release-c15.md).
- Commit fuente de la frontera de datos: `36659e6a2e127630e72b14b8641504d5dbea7a9e`.
- Commit documental del freeze: `064d10ed5f48df9e8deec3322f38be7372de5b01`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- SHA-256 del manifest: `e70a1853ac0f2cf5d25e6192776f88b400aca1536a58380044a8aa1ebc2794df`.
- Inventario: 22 recursos; 187 programas, 229 centros, 1.294 ofertas formativas y 1.058 ofertas laborales.

## Resultado de datos

El grafo conserva 264 relaciones FP–ocupación aprobadas, 35 alias y 0 programas diferidos. El recurso `offerEvidence` está integrado en el manifest y contiene 1.058 registros, 196 relaciones y 138 ofertas con relación FP revisada. La unión de ofertas alcanzadas es 138 IDs; el delta de cinco frente al matcher proviene exclusivamente de las dos revisiones curadas documentadas en `docs/contest/expansion-v1-candidate-20260830.md`.

La cobertura es deliberadamente fail-closed: una relación no revisada, una categoría ambigua o una oferta sin evidencia suficiente permanece visible como límite, no se convierte en una recomendación automática.

## Evidencia y reproducibilidad

La fuente de verdad es [`public/data/v1/manifest.json`](../../public/data/v1/manifest.json), el snapshot referenciado y [`coverage-freeze.json`](coverage-freeze.json). La validación de esquema, hashes, allowlist, relaciones aprobadas, runtime y bundle forma parte de los gates locales. El inventario A4 anterior es histórico. Las capturas públicas C15 y los resultados efectivos están en [release-c15.md](release-c15.md).

`release-evidence.json` registra deployment y publicVerification como verified. El estado raíz pending pertenece al gate conjunto del esquema v1, no al despliegue. C15: 1.351 unitarias PASS (178 omitidas), 130 E2E de regresión PASS (2 omitidas), 105/105 hashes públicos, 44 comprobaciones de páginas y 19 estados interactivos. NVDA y piloto siguen pendientes; hay comprobaciones Axe incomplete.

## Límites humanos

Adopción, piloto, identidad, contacto, consentimiento y envío externo requieren evidencia o autorización humana. No se presentan como hechos técnicos del producto.
