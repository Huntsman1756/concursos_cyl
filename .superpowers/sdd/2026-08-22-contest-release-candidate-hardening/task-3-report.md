# Tarea 3 — Informe de implementación

## Estado

`DONE_WITH_GATES_NOTED`

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
  snapshots, valida hashes y recuentos de recursos, comprueba el payload SEPE
  estricto, recorre `dist` rechazando symlinks/traversal y detecta afirmaciones
  de propiedad/licencia contradictorias.
- La regresión de catálogo y la prueba E2E verifican que el recurso SEPE
  público permanece en el candidato con periodo `2026-07`, 116 registros y
  cero CNO no publicados.

No se modificaron el parser, schema, resolver, captura, datos curados,
manifest público, loader ni UI/evidencia SEPE. La ejecución solicitada de
`data:build` generó una instantánea nueva temporal; se retiró ese artefacto y
se restauró el manifest original para respetar esta frontera.

## TDD RED → GREEN

1. RED observado con
   `rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts
   --reporter verbose --maxWorkers 1`: fallo de resolución porque aún no
   existía `candidateResourceAllowlist.ts`.
2. GREEN inicial: 3 archivos, 11 tests pasados, incluyendo el rechazo de la
   captura SEPE de una fila y la validación de los recursos actuales.

## Validaciones independientes

- `rtk npm exec -- vitest run data/schemas/candidateResourceAllowlist.test.ts data/schemas/generatedResourceCatalog.test.ts scripts/release/validateCandidateBoundary.test.ts scripts/data/buildSnapshots.test.ts src/data/generatedDataClient.test.ts src/features/occupation-first/OccupationResultsPage.test.tsx`
  — 6 archivos, 135 tests pasados.
- `rtk npm exec -- vitest run data/schemas/sepeOccupationMarket.test.ts scripts/data/parseSepeOccupationMarket.test.ts scripts/data/resolveSepeOccupationMarketUrl.test.ts scripts/data/captureSepeOccupationMarket.test.ts src/features/occupation-first/OccupationMarketEvidence.test.tsx`
  — 5 archivos, 38 tests pasados.
- `rtk npm run data:build` — salida 0; artefacto temporal retirado para no
  cambiar el manifest público contratado.
- `rtk npm exec -- tsx scripts/release/validateCandidateBoundary.ts --bundle-root dist`
  — salida 0: 21 recursos y 116 registros SEPE.
- `rtk npm run typecheck` — salida 0.
- ESLint focalizado, Prettier focalizado y `rtk git diff --check` — salida 0.
- `rtk npm run format:check` global queda bloqueado por el fichero de plan
  preexistente `docs/superpowers/plans/2026-08-22-contest-release-candidate-hardening.md`;
  ningún archivo de la Tarea 3 produce ese warning.

## Gates y preocupaciones

- `rtk npm run build` compiló TypeScript/Vite y preparó runtime data, pero
  terminó en el gate de distribución existente: `132903216/125000000` bytes y
  `87269591/75000000` bytes deduplicables.
- El comando E2E literal del brief (`--project=chromium`) no existe en esta
  configuración; los proyectos son `chromium-desktop` y `chromium-mobile`.
  El proyecto equivalente tampoco pudo iniciar porque su `webServer` ejecuta
  el build anterior y hereda el mismo límite de distribución.
- No se publicaron, desplegaron, pushearon ni tocaron el worktree antiguo.
