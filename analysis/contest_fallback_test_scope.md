# Alcance de pruebas del fallback de concurso

La auditoría independiente del 16 de agosto de 2026 no ratificó la publicación 76/220. El release vuelve al límite 6/46 y, por tanto, las suites cuyo contrato exige que la oleada expandida siga publicada ya no son una garantía válida del despliegue actual.

Las suites históricas llevan `describe.skip` y un comentario que enlaza este documento. Siguen versionadas, Vitest las descubre y las muestra explícitamente como omitidas, pero ya no convierten `npm test` en una ejecución roja por exigir una publicación que fue revocada. No se cuentan como aprobadas ni se borran.

GitHub Pages usa `test:release`, que ejecuta la misma suite que `npm test`, además de `contest:submission:check`, build, lint y E2E. La matriz y la muestra independiente tienen pruebas propias dentro de la suite activa.
