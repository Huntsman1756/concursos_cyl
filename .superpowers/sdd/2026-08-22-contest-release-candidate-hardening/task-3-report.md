# Tarea 3 — Informe de implementación correctiva

## Estado

`CORRECTIVE_CYCLE_3_WITH_GATES_NOTED`

No se declara aprobación: este informe registra el último ciclo correctivo para
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

## Último ciclo correctivo P3

Este apéndice registra el ciclo posterior sobre `HEAD` con los cuatro hallazgos
P3 y el residual de lectura directa del CLI. No se declara aprobación.
La base observada al iniciar este ciclo fue `1d49999`.

- `coverage-freeze.json` ahora exige exactamente un mapa completo de
  `resourceSnapshots` y lo compara por las 21 claves y sus triples. El
  `release-evidence.json` mantiene deliberadamente su contrato actual de
  identidad escalar (`manifest.snapshotId` + `manifest.sha256`); no se fabrica
  un mapa duplicado allí. La validación del mapa propio de release evidence
  permanece en el validador de evidencia de Task 7.
- Las claims arrastran un anclaje SEPE a la cláusula siguiente separada por
  punto y coma, pero solo hasta ese límite; por tanto falla `SEPE no se
  licencia como JCyL o MIT; es propiedad de la Junta bajo MIT`.
- `classifyCandidateReference` decodifica percent-encoding de `pathname` de
  forma fail-closed antes de clasificar certificados y occupation-market.
- El inventario de directorios usa `opendir`/iteración asíncrona, aplica el
  límite de entradas antes de ordenar y no materializa el resultado de
  `readdir`.
- El entrypoint CLI lee el manifest con el mismo descriptor seguro, límite de
  16 MiB, UTF-8 fatal y parseo estricto que el validador.

### RED → GREEN y gates del ciclo P3

RED observado antes del parche: 6 regresiones (mapa coverage ausente, claim
implícita, clasificación de certificado codificado, walker materializante y
lectura directa del CLI; la clasificación se cubrió tanto en allowlist como en
boundary). GREEN focalizado: 2 archivos, 53 tests pasados.

Gates ejecutados: la suite focalizada quedó en 53/53; la misma suite agregada
quedó en 139/139 (los seis nuevos tests elevan la base previa de 133); el CLI
salió 0 con `21 resources, 116 SEPE records`; typecheck, lint, format:check y
diff-check salieron 0. Se mantiene la instrucción de no ejecutar build,
`data:build` ni E2E en este ciclo.

El diff de este ciclo queda acotado a los cuatro archivos de código/test
permitidos más este informe ignorado; no se ha hecho staging ni commit todavía
por coordinación con el índice compartido.
