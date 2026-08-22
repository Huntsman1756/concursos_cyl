# Tarea 2 — Retención de snapshots independiente de evidencia

## Resultado

Implementada la retención runtime declarativa mediante
`config/runtime-snapshot-retention.json` y el cargador validado
`scripts/release/runtimeSnapshotRetention.ts`.

`prepareRuntimeData()` y la limpieza de `buildSnapshots()` ya no leen
documentos de concurso ni artefactos de análisis para decidir qué snapshots
conservar. Ambos conservan el snapshot activo direccionado por el manifest y
unen los históricos configurados. Se mantienen los checks existentes de
manifest, rutas, symlinks/traversal, cuarentena, `ignoredDirectories`,
preservación byte-identical de snapshots activos revocados y el contrato de
distribución `{ ignoredDirectories, historicalSnapshotDirectories }`.

## Cambios

- Añadida la configuración con los diez IDs históricos exactos del brief.
- Añadidos `RuntimeSnapshotRetention`, `parseRuntimeSnapshotRetention()` y
  `loadRuntimeSnapshotRetention()`.
- Eliminada la extracción recursiva desde evidencia y los extractores de
  snapshots desde `analysis/` y `docs/contest/`.
- Adaptados los fixtures y regresiones para verificar que mutar evidencia no
  altera el árbol runtime.

## Validación RED → GREEN

- RED observado antes de implementar: el test nuevo falló porque faltaba
  `./runtimeSnapshotRetention`; los 105 tests preexistentes pasaron.
- GREEN final:
  `rtk npm exec -- vitest run scripts/release/runtimeSnapshotRetention.test.ts scripts/release/prepareRuntimeData.test.ts scripts/data/buildSnapshots.test.ts`
  — 3 archivos, 106 tests pasados.

## Gates

- `rtk npm run release:runtime-data` — salida 0; 11 snapshots retenidos
  (10 históricos configurados + el activo
  `20260822085631889-7bbe69380f6d`).
- `rtk npm run typecheck` — salida 0.
- ESLint focalizado — salida 0; el JSON fue ignorado por no tener configuración
  ESLint aplicable.
- Prettier focalizado — salida 0.
- `rtk git diff --check` — salida 0.

## Preocupaciones

Ninguna conocida dentro del contrato de Tarea 2. La retención histórica
ordinaria de dos snapshots se conserva como comportamiento existente; la
selección documental de evidencia/análisis queda eliminada.

## Corrección de integración — separación source/runtime

### Diagnóstico

La integración posterior a `e7e6a57` reveló que `snapshotIds` se consumía tanto
en la limpieza del árbol fuente como en la preparación del runtime. Por eso los
diez históricos terminaban en `dist`, excediendo los límites fijos con
`132903216/125000000` bytes totales y `87269591/75000000` deduplicables. El
contrato corregido separa `sourceSnapshotIds` (los diez históricos exactos) de
`runtimeSnapshotIds` (vacío para este candidato); el snapshot activo sigue
siendo implícito en ambos flujos y el runtime queda restringido al subconjunto
source.

### RED → GREEN

- RED TDD: con las pruebas de la interfaz nueva y la implementación legacy, el
  focused run falló en 18 de 30 tests (5 de runtime-retention y 13 de
  prepareRuntimeData) por exigir las claves antiguas `schemaVersion,
  snapshotIds`.
- GREEN: el loader valida las dos listas exactas, ordenadas y únicas, directorios
  físicos existentes y la inclusión runtime→source; `buildSnapshots` usa solo
  `sourceSnapshotIds`; `prepareRuntimeData` usa solo `runtimeSnapshotIds` más
  referencias del manifest activo. La regresión nueva verifica que un histórico
  source-only sobrevive la limpieza fuente pero no se prepara, mientras un
  histórico opt-in sí se copia.
- GREEN final:
  `rtk npm exec -- vitest run scripts/release/runtimeSnapshotRetention.test.ts scripts/release/prepareRuntimeData.test.ts scripts/data/buildSnapshots.test.ts`
  — 3 archivos, 109 tests pasados.

### Gates exactos

- `rtk npm run release:runtime-data` — salida 0; `retainedSnapshots: 1` y solo
  `20260822085631889-7bbe69380f6d`.
- `rtk npm run build` — salida 0; asset budget `696994/700000`, distribution
  check `21` recursos, `28` ficheros y `22494862` bytes, sin cambios de
  límites.
- `rtk npm run typecheck` — salida 0.
- `rtk npm run lint` — salida 0.
- `rtk git diff --check` — salida 0.

### Preocupaciones

Ninguna conocida. Los diez históricos continúan retenidos físicamente en el
árbol fuente para comparación/recuperación, no se distribuyen en este
candidato, y no se modificaron presupuestos, snapshots, evidencia ni archivos
de Tarea 3.
