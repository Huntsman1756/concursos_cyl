# Tarea 3 — Informe de implementación

## Estado

`CORRECTED_WITH_GATES_NOTED`

## Alcance

Se implementó la frontera de candidato en las rutas contratadas:

- `config/candidate-resource-allowlist.json` contiene exactamente las 21
  claves ordenadas del brief, incluida `sepeOccupationMarket`, sin campos
  `forbidden*` heredados.
- `data/schemas/candidateResourceAllowlist.ts` carga la allowlist como fuente
  única, expone `CandidateResourceKey`, `CANDIDATE_RESOURCE_KEYS`, las
  aserciones de conjunto y de los 116 registros SEPE canónicos, y clasifica
  referencias SEPE/certificados sin relicenciarlas.
- `scripts/release/validateCandidateBoundary.ts` compara el conjunto exacto
  con el manifest, catálogo generado, freeze/evidencia cuando contienen
  snapshots, exige igualdad por clave de `resourcePath`, `sha256` y
  `recordCount` entre `public` y `dist`, valida el payload SEPE estricto,
  recorre `public`/`dist` rechazando symlinks físicos y traversal, rechaza
  claves JSON duplicadas y detecta afirmaciones de propiedad/licencia
  contradictorias aun cuando atraviesan líneas.
- La evidencia JSON reconocida valida forma exacta, compara snapshots directos
  y anidados con el manifest público y liga `manifest.snapshotId` y
  `manifest.sha256` a la instantánea y bytes exactos públicos. Las negaciones
  explícitas de relicencia SEPE se conservan como válidas.
- `classifyCandidateReference()` mantiene SEPE y URLs `occupation-market` como
  fuente de clasificación complementaria y certificados externos como
  publisher-owned.
- La regresión de catálogo y el boundary CLI verifican que el recurso SEPE
  público permanece en el candidato con periodo `2026-07`, 116 registros y
  cero CNO no publicados. La prueba E2E contratada no se reejecutó en esta
  corrección por la regla de no colisión con Task 2.

No se modificaron el parser, schema, resolver, captura, datos curados,
manifest público, loader ni UI/evidencia SEPE. No se generaron artefactos de
build ni snapshots nuevos en esta corrección.

## TDD RED → GREEN

1. RED correctivo observado con
   `rtk npm exec -- vitest run scripts/release/validateCandidateBoundary.test.ts
   --reporter verbose --maxWorkers 1`: 14 regresiones fallaron contra el
   validador anterior (bundle desacoplado, snapshots/evidencia, symlinks,
   duplicados JSON y claims multilínea).
2. GREEN: el mismo archivo terminó con 20 tests pasados; la suite agregada de
   frontera, allowlist y catálogo terminó con 29 tests pasados.

## Validaciones independientes

- `rtk npm exec -- vitest run scripts/release/validateCandidateBoundary.test.ts data/schemas/candidateResourceAllowlist.test.ts data/schemas/generatedResourceCatalog.test.ts data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx --reporter dot --maxWorkers 1`
  — 10 archivos, 113 tests pasados.
- `rtk npm exec -- vitest run scripts/data/buildSnapshots.test.ts --reporter verbose --maxWorkers 1`
  — 1 archivo, 79 tests pasados en 128.87 s.
- `rtk npm exec -- vitest run data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx`
  — 5 archivos, 38 tests pasados.
- `rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist`
  — salida 0: 21 recursos y 116 registros SEPE.
- `rtk npm run typecheck` — salida 0.
- `rtk npm run lint` — salida 0.
- `rtk npm run format:check` — salida 0.
- `rtk git diff --check` — salida 0.

## Gates y preocupaciones

- Build, `data:build` y E2E no se ejecutaron en esta corrección, conforme a la
  instrucción de esperar a la finalización de Task 2 y evitar colisiones con
  sus cambios de retención/runtime. El CLI y los gates estáticos sí se
  ejecutaron de forma independiente.
- No se publicaron, desplegaron, pushearon ni tocaron el worktree antiguo.
