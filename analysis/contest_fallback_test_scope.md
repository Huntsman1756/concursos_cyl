# Alcance de pruebas del fallback de concurso

La auditoría independiente del 16 de agosto de 2026 no ratificó la publicación 76/220. El release vuelve al límite 6/46 y, por tanto, las suites cuyo contrato exige que la oleada expandida siga publicada ya no son una garantía válida del despliegue actual.

`npm run test:release` conserva la suite unitaria general y excluye únicamente los archivos enumerados en `vitest.release.config.ts`. Esos archivos siguen versionados y disponibles para auditar el proceso histórico; no se cuentan como aprobados ni se borran. `npm test` continúa ejecutándolos y muestra de forma visible su incompatibilidad con el fallback.

GitHub Pages usa `test:release`, además de `contest:submission:check`, build, lint y E2E. La matriz y la muestra independiente tienen pruebas propias dentro de la suite de release.
