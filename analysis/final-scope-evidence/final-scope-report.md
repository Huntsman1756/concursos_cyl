# SALIDA CyL — final scope + evidence closure

Fecha de captura: 2026-09-03. La implementación técnica y el QA automatizado quedan cerrados. La única decisión que cambia el producto es retirar la tarjeta pública de `offerEvidence` de `/datos-abiertos` para candidate.8; el dataset y sus artefactos permanecen intactos.

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

Clasificación: **D — INSUFFICIENTLY_DOCUMENTED**.

La auditoría confirma propósito, procedencia, snapshot, esquema, hash y cobertura de tests, pero no encuentra una declaración propia de licencia/reutilización del recurso derivado en su manifest o catálogo, ni una explicación proporcional en Metodología sobre su alcance de 1.058 ofertas, sus límites y qué está revisado. El origen documentado es `CC BY 4.0 ES` en `docs/data-audit-jcyl-open-data.md:128-141`, pero eso no resuelve por sí solo la documentación pública del derivado.

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

## METHODOLOGY_COVERAGE

`ABSENT` para `offerEvidence`. No se editó Metodología porque el recurso no se mantiene como superficie pública candidate.8 y la decisión es retirarlo, no justificarlo con documentación retroactiva.

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
- Asset budget: `3,497,186 / 3,600,000` bytes raw en `77` archivos
- Distribution: `22` recursos de manifest, `25` ficheros de datos, `22,712,737` bytes raw, `0` bytes duplicados
- Candidate boundary: PASS, `22` recursos y `116` registros SEPE

## GIT_DIFF

El diff queda limitado a:

- `src/features/open-data/OpenDataPage.tsx`: retirada de las 48 líneas de superficie pública de `offerEvidence`.
- `tests/e2e/home.spec.ts`: gate pequeño para las tres imágenes editoriales y sus respuestas de red.
- `tests/e2e/open-data.spec.ts`: aserción de que la tarjeta retirada no reaparece.
- `package.json`: comandos reproducibles de auditoría/captura.
- `scripts/release/auditOfferEvidenceScope.ts` y `scripts/release/captureFinalScopeEvidence.mjs`: tooling de cierre.
- `analysis/final-scope-evidence/`: JSON, Markdown y las tres capturas actuales.

No hay cambios en datos canónicos, rutas, assets editoriales aprobados ni artefactos internos del dataset.

## COMMITS

`bbe6c775b7b4081b225372103e7dbd6ea16d96bf` — `chore(qa): close final scope evidence`.
El informe se actualiza a continuación en un segundo commit local de documentación; no se hará push.

## REMAINING_BLOCKERS

No quedan blockers técnicos ni de integridad. Queda pendiente únicamente la aceptación humana final. Candidate.8 no se declara todavía.

HOME_THREE_EDITORIAL_IMAGES: PASS
OPEN_DATA_LABELS_CURRENT: PASS
OFFER_DATASET_SCOPE: REMOVE_FROM_CANDIDATE
OFFER_DATASET_METHODOLOGY: NOT_APPLICABLE
FULL_TEST_SUITE: PASS
READY_FOR_FINAL_HUMAN_ACCEPTANCE: YES
READY_FOR_RELEASE_CANDIDATE: NO

No push.
No deploy.
No release.
