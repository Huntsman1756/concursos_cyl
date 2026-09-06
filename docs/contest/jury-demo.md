# Demostración del jurado: tres minutos sobre C15

Objetivo: que se entienda una utilidad concreta, cómo comprobar su procedencia y qué ocurre cuando falta evidencia. No es una sesión de usuario ni prueba de impacto. No requiere NVDA para ensayar visualmente; la validación auditiva sigue pendiente.

## Preparación

Abrir una ventana sin sesión personal, zoom 100 % y la [portada pública](https://salida-cyl.157-90-22-40.sslip.io/). Confirmar en [version.json](https://salida-cyl.157-90-22-40.sslip.io/version.json) el SHA `02d6805e5cb661f3289ade47ad2364b26fd346f8`. Si cambia, revisar el guion antes de atribuirle las evidencias C15. Ocultar notificaciones personales. No hace falta entrar en una cuenta ni enviar formularios.

Preparar las siguientes páginas en pestañas para no depender de escribir rápido. No actualizar datos ni modificar filtros del producto para hacer que aparezca un resultado favorable.

## Recorrido cronometrado

| Tiempo    | Acción                                                                                                                                      | Explicación sugerida                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:25 | Portada: mostrar las tres intenciones                                                                                                       | «SALIDA ayuda a explorar estudios y profesiones con información pública que normalmente está repartida entre varias fuentes.»                                                |
| 0:25–1:05 | [CNO 2713](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A2713): abrir una FP relacionada visible            | «Puedo empezar por una profesión y consultar relaciones con FP revisadas. La relación es una pista documentada para orientarse, no una garantía de acceso o contratación.»   |
| 1:05–1:35 | Abrir «Fuente y revisión» y mostrar el enlace hacia centros o las ofertas de la ficha                                                       | «Se ve de dónde sale el vínculo, cuándo se revisó y cómo dar el siguiente paso. Las ofertas pertenecen a una copia fechada.»                                                 |
| 1:35–2:05 | [Comparador](https://salida-cyl.157-90-22-40.sslip.io/comparar): usar dos ciclos con datos disponibles; mostrar etiquetas de ámbito/periodo | «Estas son referencias agregadas de la fuente, con su alcance. No son el salario que recibirá una persona ni una clasificación del mejor estudio.»                           |
| 2:05–2:35 | [CNO 2111](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A2111)                                              | «La copia no contiene relaciones FP revisadas para este caso. No inventamos una relación ni concluimos que no exista empleo; tampoco determinamos habilitación profesional.» |
| 2:35–3:00 | [Datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos)                                                                   | «La aportación se puede inspeccionar y reutilizar: ocho conjuntos JCyL, un grafo con fuentes y datos descargables. El servicio está publicado y sus límites son explícitos.» |

Ensayar la duración real antes de presentar. Si el comparador requiere demasiado tiempo, preparar sus selecciones y declararlo como estado preparado para la demostración. Si no hay dato disponible, mostrar la ausencia; no cambiar a una combinación favorable sin explicar el motivo.

## Si falla la conexión

Usar las [capturas públicas C15](release-c15.md#capturas-públicas-seleccionadas), identificándolas como capturas del 6 de septiembre, no como navegación en directo. No presentar la URL histórica de Pages como fallback C15 sin verificar antes su identidad.

## Respuestas breves a preguntas previsibles

- **¿Está todo relacionado?** No. 138 de 1.058 ofertas tienen FP revisada; 70 de 1.055 requisitos están clasificados. Catálogo y cobertura revisada son cosas diferentes.
- **¿Son ofertas abiertas ahora?** La información pertenece a una copia fechada. La vigencia debe consultarse en la fuente.
- **¿Son correctas todas las relaciones?** Hay evidencia y controles estructurales; no se declara una certificación semántica independiente de las 264 relaciones.
- **¿Está validado con usuarios?** El piloto está preparado; mientras no se realice, no se atribuyen resultados a participantes.
- **¿Es accesible?** Hay comprobaciones automáticas y de teclado. NVDA y algunos resultados incompletos de Axe siguen pendientes de revisión humana.
- **¿Cómo se sostiene?** Arquitectura estática y plan de mantenimiento condicionado a recursos reales. No hay clientes ni ingresos acreditados. [Plan económico](economic-sustainability.md).

## Ensayo y cierre

Pendiente: una persona realiza el recorrido cronometrado y confirma que puede explicarlo sin leer los textos íntegros. No se ha grabado ni enviado una presentación. Revisar junto con la [memoria por criterios](jury-memo.md), evitando convertir el número de tests en la explicación principal del producto.
