# SALIDA CyL — final scope + evidence closure

Fecha de captura: 2026-09-03. La implementación técnica y el QA automatizado quedan cerrados. La única decisión que cambia el producto es retirar la tarjeta pública de `offerEvidence` de `/datos-abiertos` para candidate.8; el dataset y sus artefactos permanecen intactos.

## STALE_REFERENCES_FOUND / STALE_REFERENCES_FIXED

- `RUNTIME_CODE`: las referencias a `offerEvidence` en manifest, loader, dominio, páginas de ofertas y validadores son legítimas; el recurso sigue siendo runtime.
- `TEST`: las referencias en tests y en el auditor de alcance son legítimas y se conservan para comprobar el contrato del recurso y la ausencia de la tarjeta retirada.
- `INTERNAL_ANALYSIS`: las capturas históricas de normalización y los JSON/Markdown de auditoría conservan el lenguaje observado en su momento; no son copy público vigente.
- `PUBLIC_PRODUCT_COPY`: la tarjeta pública ya no existe; Metodología ahora explica su papel runtime y su no publicación independiente.
- `JURY_DOCUMENTATION`: la promesa de descarga independiente del memo fue corregida y se añadió una única nota técnica proporcional.
- `STALE_DOCUMENTATION`: el estado contractual anterior del informe final fue reemplazado por las cuatro dimensiones actuales.

Resultado: `STALE_PUBLIC_PROMISES: NONE` en las superficies públicas actuales. `/desde-oferta` sigue operativo y continúa cargando el recurso runtime desde el manifest.

## HOME_PATH_IMAGES

La comprobación se ejecutó contra el `dist` actual servido por Vite production preview, en `390×844` y `1440×900`.

|                                  Path | Asset             | `<picture>` | `<img>` | `currentSrc` observado     | Formato | HTTP | Natural mobile | Loaded |
| ------------------------------------: | ----------------- | ----------- | ------- | -------------------------- | ------- | ---: | -------------: | ------ |
|                     01 · Tengo una FP | `path-training`   | YES         | YES     | `path-training-640.avif`   | AVIF    |  200 |      `390×292` | YES    |
| 02 · Quiero dedicarme a una profesión | `path-occupation` | YES         | YES     | `path-occupation-640.avif` | AVIF    |  200 |      `390×292` | YES    |
|              03 · He visto una oferta | `path-offer`      | YES         | YES     | `path-offer-640.avif`      | AVIF    |  200 |      `390×292` | YES    |

Las tres tienen `naturalWidth > 0`, `complete = true`, `display = block`, `visibility = visible`, `opacity = 1`, bounding box no nulo, `alt` no vacío y ninguna petición fallida. En desktop las tres cargan con `475×356`. El gate E2E queda en `tests/e2e/home.spec.ts` y además verifica que la respuesta de red sea 200.

- `PATH_01_IMAGE`: `/images/editorial/path-training-640.avif`
- `PATH_02_IMAGE`: `/images/editorial/path-occupation-640.avif`
- `PATH_03_IMAGE`: `/images/editorial/path-offer-640.avif`
- `CAUSE_IF_MISSING`: `NOT_APPLICABLE`
- `FIX_IF_REQUIRED`: `NONE`

Detalle reproducible: [home-path-images.json](home-path-images.json) · [home-path-images.md](home-path-images.md).

## OFFER_DATASET_INTRODUCED_COMMIT

- Commit: `9bad066a1144e6055e087e2c6e64f371521bf10d`
- Fecha: `2026-09-01 08:00:30 +02:00`
- Mensaje: `chore(contest): converge local release candidate`
- Propósito: activar el recurso derivado de Expansion V1 en el manifest inmutable y exponer su journey de ofertas con evidencia.
- Alcance temporal: el commit es ancestro de `65432e8` y es anterior a la ronda posterior de normalización CSS; la sección ya pertenecía al producto antes de esa ronda.

## OFFER_DATASET_CLASSIFICATION

Clasificación: **D — INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION**.

La auditoría confirma propósito, procedencia, snapshot, esquema, hash y cobertura de tests. La nota proporcional de Metodología ya explica el papel runtime y el estado de no publicación independiente, pero el recurso derivado todavía no declara sus propios términos de licencia/reutilización en el manifest o catálogo. El origen documentado es `CC BY 4.0 ES` en `docs/data-audit-jcyl-open-data.md:128-141`, pero eso no resuelve por sí solo la documentación necesaria para una publicación independiente.

## OFFER_DATASET_PUBLIC_SCOPE

- `PUBLIC_FILE`: `/data/v1/snapshots/20260830120000000-8c6c79fbd2a1/offer-evidence.json`
- `GENERATOR`: `scripts/data/buildOfferEvidenceSnapshot.ts`; `scripts/data/activateOfferEvidenceCandidate.ts`
- `SOURCE_RESOURCES`: `jobOffers`, `occupationAliases`, `occupations`, `professionalCertificates`, `professionalProfiles`, `programs`, `publishedRequirements`, `trainingOccupationLinks`
- `RECORD_COUNT`: `1058` ofertas; `354` con requisitos publicados; `138` con relación FP revisada (`196` relaciones revisadas)
- `SCHEMA`: `data/schemas/offerEvidence.ts:OfferEvidenceResourceSchema`, versión `1.0.0`
- `LICENSE`: fuente documentada como `CC BY 4.0 ES`; términos propios del derivado: `NOT_DECLARED`
- `PROVENANCE`: snapshot `20260830120000000-8c6c79fbd2a1`, base `20260822085631889-fc9bf2ba23f9`, generado `2026-08-30T12:00:00.000Z`, review `1.0.0`
- `HASH`: `80dd7ccb917c75015bf38492cc5baf4bed6ee20a3a4043e3a981a9a6d38c17d4`; coincide con el hash del manifest: YES
- `SNAPSHOT`: manifest y recurso contienen `1058` registros
- `TESTS`: schema, generator, dominio, loader, candidate boundary, distribution y `tests/e2e/offer-first.spec.ts`
- `MANIFEST_RELATIONSHIP`: clave `offerEvidence`, ruta inmutable, `qualityStatus = passed`, dependencia derivada de los ocho recursos anteriores
- `CANONICAL_OR_DERIVED`: `DERIVED`
- `CONTAINS_PRIVATE_EMPLOYERS`: `NO`
- `CONTAINS_PREDICTIONS`: `NO`

Decisión para candidate.8: **retirar únicamente la superficie pública de `/datos-abiertos`**. Se eliminó la sección condicional “Dataset candidato de expansión” y su enlace de descarga, y se añadió una aserción E2E de ausencia. Se conservan `/desde-oferta`, el JSON inmutable, el manifest, los generadores, esquemas y datos internos. No se modificó ningún dato.

Auditoría completa: [offer-dataset-scope.json](offer-dataset-scope.json) · [offer-dataset-scope.md](offer-dataset-scope.md).

## CONTRACTUAL SEMANTICS

OFFER_DATASET_PUBLIC_SURFACE: `REMOVED_FROM_OPEN_DATA_SURFACE`

OFFER_DATASET_RUNTIME_ROLE: `RUNTIME_DERIVED_RESOURCE`

OFFER_DATASET_STANDALONE_PUBLICATION_STATUS: `NOT_PUBLISHED_AS_STANDALONE_REUSABLE_DATASET`

OFFER_DATASET_DOCUMENTATION_CLASSIFICATION: `INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION`

## METHODOLOGY_COVERAGE

`PRESENT`. Se añadió una única nota breve en Metodología: SALIDA genera `offerEvidence` sobre la copia de ofertas para relacionarla con requisitos y relaciones FP revisadas; las páginas de ofertas lo utilizan; no se presenta en esta candidatura como dataset reutilizable independiente; su ausencia de “Datos abiertos” no significa cálculo opaco ni eliminación; y la publicación independiente queda fuera hasta cerrar documentación y licencia de reutilización.

## OPEN_DATA_LABEL_RUNTIME_TEXT

- `OPEN_DATA_LABEL_SOURCE`: `src/features/open-data/OpenDataPage.tsx:143-159`
- `OPEN_DATA_LABEL_RUNTIME_TEXT`: `Relaciones`; `Ciclos en el grafo`; `Ocupaciones CNO-11 en el grafo`; `Familias profesionales`; `Licencia`; `Integridad JSON`; `Integridad CSV`

Los labels de métricas no se tocaron. La evidencia actual es [open-data-metrics-1440.png](open-data-metrics-1440.png).

## SCREENSHOTS

- [home-paths-390-full.png](home-paths-390-full.png)
- [home-paths-1440.png](home-paths-1440.png)
- [open-data-metrics-1440.png](open-data-metrics-1440.png)

Las capturas se generaron desde el build actual y están acompañadas por el script reproducible `scripts/release/captureFinalScopeEvidence.mjs`.

## TESTS

- E2E Chromium completo: `176 passed`
- Unit suite completa: `1298 passed`, `178 skipped`, `152` archivos
- Typecheck: PASS
- Lint: PASS
- Format check: PASS
- License check: PASS
- Build: PASS (`tsc -b`, Vite, runtime data, asset budget, distribution y candidate boundary)
- Asset budget: `3,497,958 / 3,600,000` bytes raw en `77` archivos
- Distribution: `22` recursos de manifest, `25` ficheros de datos, `22,712,737` bytes raw, `0` bytes duplicados
- Candidate boundary: PASS, `22` recursos y `116` registros SEPE

## GIT_DIFF

El diff queda limitado a:

- `src/features/open-data/OpenDataPage.tsx`: retirada de las 48 líneas de superficie pública de `offerEvidence`.
- `src/features/methodology/MethodologyPage.tsx`: una nota proporcional sobre el papel runtime y la no publicación independiente.
- `docs/contest/jury-memo.md`: corrección de la promesa de descarga y una nota técnica breve.
- `tests/e2e/home.spec.ts`: gate pequeño para las tres imágenes editoriales y sus respuestas de red.
- `tests/e2e/open-data.spec.ts`: aserción de que la tarjeta retirada no reaparece.
- `tests/e2e/methodology.spec.ts` y `tests/e2e/jury-walkthrough.spec.ts`: gates de consistencia documental y walkthrough.
- `package.json`: comandos reproducibles de auditoría/captura.
- `scripts/release/auditOfferEvidenceScope.ts` y `scripts/release/captureFinalScopeEvidence.mjs`: tooling de cierre.
- `analysis/final-scope-evidence/`: JSON, Markdown y las tres capturas actuales.

No hay cambios en datos canónicos, rutas, assets editoriales aprobados ni artefactos internos del dataset.

## COMMITS

Commit de esta ronda: `docs(contest): clarify offer evidence publication role`.

## REMAINING_BLOCKERS

No quedan blockers técnicos ni de integridad. Queda pendiente únicamente la aceptación humana final. Candidate.8 no se declara todavía.

OFFER_DATASET_PUBLIC_SURFACE: REMOVED_FROM_OPEN_DATA_SURFACE
OFFER_DATASET_RUNTIME_ROLE: RUNTIME_DERIVED_RESOURCE
OFFER_DATASET_STANDALONE_PUBLICATION_STATUS: NOT_PUBLISHED_AS_STANDALONE_REUSABLE_DATASET
OFFER_DATASET_DOCUMENTATION_CLASSIFICATION: INSUFFICIENTLY_DOCUMENTED_FOR_STANDALONE_PUBLICATION
STALE_PUBLIC_PROMISES: NONE
DOCUMENTATION_CONSISTENCY: PASS
FULL_TEST_SUITE: PASS
READY_TO_CUT_CANDIDATE_8: NO

No push.
No deploy.
No release.
