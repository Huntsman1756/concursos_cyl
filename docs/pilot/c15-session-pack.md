# Piloto C15 listo para moderación

Estado: preparado, no ejecutado. No hay participantes reclutados ni resultados reales registrados. NVDA queda fuera de esta sesión por ahora; este piloto visual no sustituye la revisión con lector de pantalla.

## Qué hace falta

Cinco personas adultas, con al menos una persona que esté eligiendo formación (`learner`) y una que oriente a otras (`counsellor`). Objetivo práctico: cuatro del primer perfil y una del segundo, sin exigir esa distribución. Una persona moderadora; entre 30 y 45 minutos reservados por sesión como estimación logística, no duración medida.

No hace falta pedir nombres, centros educativos, correos ni currículos. La persona responsable organiza las sesiones fuera del repositorio. Este documento no autoriza mensajes a terceros.

## Material y versión

- [Protocolo](anonymous-protocol.md), [consentimiento verbal](anonymous-consent-template.md), [cinco tareas](anonymous-task-script.md).
- URL: https://salida-cyl.157-90-22-40.sslip.io/
- SHA C15: `02d6805e5cb661f3289ade47ad2364b26fd346f8`.
- Snapshot: `20260830120000000-8c6c79fbd2a1`.
- [Plantilla vacía](c15-aggregate-template.json): todos los ceros significan «sin observaciones», no resultados positivos. No copiarla a la ruta de resultados hasta realizar el piloto.

## Moderación

1. Verificar version.json, una ventana sin sesión personal y la ausencia de grabación. Mostrar el consentimiento y confirmar verbalmente mayoría de edad y participación voluntaria.
2. Explicar: «Estamos comprobando la página, no tus conocimientos. Puedes detenerte. No necesitamos información personal.»
3. Leer las cinco tareas tal como están escritas, sin explicar qué botón usar. Si una persona pide ayuda, registrar el bloqueo antes de mostrar una pista; un recorrido completado con ayuda no se contabiliza como éxito autónomo.
4. Observar si diferencia una relación revisada de una garantía de empleo, y una ausencia de datos de ausencia de trabajo. Registrar solo categorías y conteos, nunca sus palabras literales.
5. Consolidar conteos por tarea. No conservar fichas individuales ni IDs. Si una sesión se retira, sus contribuciones se descartan antes de incorporarlas al agregado; si no es posible reconstruir el agregado sin ella, no se usa ese agregado.

El guion común no fija un ciclo para evitar enseñar el resultado. Si no puede continuar, el moderador puede usar ADG02S o CNO 2713 después de registrar el bloqueo; ese ejemplo asistido no cuenta como finalización autónoma. CNO 2111 es útil para explicar límites después de observar la interpretación de T2.

## Reglas de registro

Para cada tarea, `completed + blocked + abandoned = attempted`. Una interpretación errónea puede coexistir con un bloqueo y se cuenta una sola vez en `misinterpretations` por intento. Cada intento tiene una banda de tiempo. No sumar varias incidencias de la misma categoría y severidad dentro de una tarea de la misma sesión.

Las categorías admitidas son navigation, label_comprehension, scope_confusion, accessibility, loading_or_error, privacy_concern y other. Las acciones son none, clarify_copy, adjust_navigation, add_limit_disclosure, run_accessibility_review e investigate_bug. Consultar el esquema para los campos exactos; no añadir notas libres al JSON.

## Decisión prevista antes de observar resultados

- Cualquier bloqueo que impida una tarea esencial: reproducirlo y valorar su gravedad antes de declarar el recorrido listo.
- Dos o más personas con la misma confusión de alcance: investigar el texto o la jerarquía implicada; no generalizar su frecuencia a la población.
- Una interpretación de salario garantizado, ausencia de empleo o habilitación profesional: revisar el recorrido concreto, aunque solo aparezca una vez.
- Un hallazgo aislado menor: documentar la categoría y decidir si merece cambio; no abrir automáticamente otra ronda de diseño.

Son criterios internos de decisión, no requisitos normativos ni umbrales estadísticos. Con cinco sesiones se describen casos observados y conteos, no porcentajes representativos ni causalidad.

## Cierre

Tras ejecutar las sesiones, completar el agregado real, revisar consentimiento y ausencia de datos personales, y guardarlo únicamente en `analysis/pilot/anonymous/results-aggregate.json`. Ejecutar `npm run pilot:anonymous:validate`. Solo marcar `complete` si cumple todas las invariantes y las revisiones humanas se han realizado.

Después, incorporar a la memoria los conteos reales por tarea, bloqueos, límites de la muestra y decisiones tomadas. Hasta entonces la frase correcta es «piloto preparado, pendiente de realización».
