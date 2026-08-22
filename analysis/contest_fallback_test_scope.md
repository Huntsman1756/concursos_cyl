# Alcance de pruebas de la evidencia del concurso

La auditoría independiente del 16 de agosto de 2026 no ratificó la publicación
histórica 76/220. Sus hallazgos se usaron para retirar seis relaciones y
corregir una cita antes del límite `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`.
El freeze activo publica 248 relaciones aprobadas; el fallback histórico 6/46
no describe el snapshot actual y queda únicamente como referencia de auditoría.

Las suites históricas llevan `describe.skip` y un comentario que enlaza este
documento. Siguen versionadas, Vitest las descubre y las muestra explícitamente
como omitidas, pero no convierten `npm test` en una ejecución roja por exigir
una publicación que fue revocada. No se cuentan como aprobadas ni se borran.

La matriz y la muestra independiente separan el suelo del validador de la
suficiencia semántica. La muestra determinista vigente registra 15 PASS y 0
FAIL tras una segunda revisión independiente de la URL oficial y la cita
registrada. Las otras 233 relaciones quedan `not_sampled`; el resultado no
autoriza afirmaciones de cobertura total.
