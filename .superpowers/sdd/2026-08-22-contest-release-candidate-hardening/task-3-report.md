# Tarea 3 — Informe de implementación correctiva

## Estado

`CORRECTIVE_CYCLE_2_WITH_GATES_NOTED`

No se declara aprobación: este es el segundo y último ciclo correctivo para
revisión del padre y de un tercer revisor.

## Base y alcance

Se reabrió sobre `ab618a3` y se mantuvieron exclusivamente las rutas
contratadas de Task 3:

- `data/schemas/candidateResourceAllowlist.ts` conserva la allowlist exacta de
  21 claves, incluida `sepeOccupationMarket`; `CandidateResourceKey` queda
  como unión literal generada, no como `string`.
- `scripts/release/validateCandidateBoundary.ts` canonicaliza y valida la raíz,
  rechaza symlinks/traversal físicos, y centraliza las lecturas en un descriptor
  `O_RDONLY|O_NOFOLLOW`, con `fstat` regular, comparación de inode antes de
  leer y revalidación de la ruta física después de leer.
- La lectura/parseo aplica UTF-8 fatal, límite de 16 MiB por fichero, límites
  explícitos de profundidad y entradas JSON/directorios, y duplicados JSON
  incluso cuando las claves están escapadas.
- La evidencia de recursos reconocida exige `manifest.snapshotId` y
  `manifest.sha256` exactos; compara cada `resourceSnapshots` directo o anidado
  con el manifest público y rechaza representaciones keys/snapshots mixtas.
- El bundle compara los bytes completos del manifest, los ficheros top-level de
  `data/v1` y el árbol del snapshot activo con `public`; faltantes, extras,
  metadatos divergentes o recursos alterados fallan. Los snapshots históricos
  que `public` conserva y `dist` no publica quedan fuera de ese inventario
  activo, como exige el layout actual.
- Las opciones de runtime se validan como objeto exacto: root, manifest,
  recurso SEPE, cardinalidad/valores de documentos y `dist` no pueden omitirse
  ni sustituirse desde JavaScript/`any`.
- Los claims recorren todas las hojas string JSON y documentos de evidencia;
  auditan SEPE, URLs publisher-owned/certificados y el anclaje literal
  `occupation-market` por cláusula. Las negaciones solo eximen su propia
  cláusula; una afirmación posterior falla. Hosts `occupation-market` no
  oficiales, incluido `evil.example`, no se clasifican como fuente oficial.

No se modificaron schema/parser/resolver/capture, datos curados, manifest
público, loader, UI SEPE ni artefactos de build/data. No se publicó, desplegó,
pusheó, mezcló ni tocó el worktree antiguo.

## TDD RED → GREEN

1. RED observado antes del parche sobre `ab618a3`:
   `rtk npm exec -- vitest run scripts/release/validateCandidateBoundary.test.ts data/schemas/candidateResourceAllowlist.test.ts --reporter=dot`
   terminó con 17 regresiones rojas (root/options, bundle, evidencia,
   claims, UTF-8 y límites, además de la clasificación de `evil.example`).
2. GREEN focalizado:
   `rtk npm exec -- vitest run scripts/release/validateCandidateBoundary.test.ts data/schemas/candidateResourceAllowlist.test.ts --reporter=dot`
   terminó con 2 archivos y 47 tests pasados.

## Validaciones ejecutadas

- Suite agregada de frontera, catálogo, SEPE, loader y UI:
  `rtk npm exec -- vitest run scripts/release/validateCandidateBoundary.test.ts data/schemas/candidateResourceAllowlist.test.ts data/schemas/generatedResourceCatalog.test.ts data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx --reporter=dot`
  — 10 archivos, 133 tests pasados.
- Regresión SEPE acotada:
  `rtk npm exec -- vitest run data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx --reporter=dot`
  — 5 archivos, 38 tests pasados.
- CLI:
  `rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist`
  — salida 0: 21 recursos y 116 registros SEPE.
- `rtk npm run typecheck` — salida 0.
- `rtk npm run lint` — salida 0.
- `rtk npm run format:check` — salida 0.
- `rtk git diff --check` — salida 0.

Por la instrucción de no colisionar con Task 2, no se ejecutaron build,
`data:build` ni E2E en este ciclo.

## Revisión y riesgo residual

El diff funcional queda en cuatro archivos permitidos, con 826 líneas añadidas
y 116 eliminadas antes del commit. Cada bloque corresponde a una regresión o a
su primitive mínima: lectura segura/root, límites/parseo, evidencia, claims,
árbol bundle y options. No se introdujo un parser/framework general.

El riesgo residual documentado es la sustitución simultánea de un directorio
padre entre las comprobaciones de ruta: Node no ofrece `openat`/handles de
directorio portables en esta primitive. El fichero final se lee por descriptor,
se verifica regularidad/inode y se revalidan padres después; la sustitución de
directorio durante esa ventana no puede eliminarse completamente sin una API
de directorio segura del host.
