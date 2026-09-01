# SALIDA CyL · revisión de diseño v2

`CURRENT_DESIGN_VERDICT: NEEDS_WORK`

Esta entrega replantea la experiencia como un servicio de orientación: una persona llega con una titulación, una ocupación o una oferta y necesita decidir el siguiente paso. El frontend de producción no se ha modificado en esta fase.

## BENCHMARK_REFERENCES

### 1. GOV.UK Service Manual — scoping your service

- `REFERENCE`: [Scoping your service](https://www.gov.uk/service-manual/design/scoping-your-service)
- `PATTERN`: Diseñar alrededor de una tarea de usuario concreta y mantener la orientación separada de la transacción salvo que sea necesaria en ese momento.
- `WHY_IT_WORKS`: Reduce la carga mental y evita que la estructura interna de la organización dicte la navegación.
- `RELEVANCE_TO_SALIDA`: La primera pantalla debe preguntar “¿qué quieres hacer?” y llevar a una sola ruta comprensible.
- `DO_NOT_COPY`: La literalidad institucional ni una arquitectura extensa de páginas de ayuda.

### 2. GOV.UK Design System — task-focused components

- `REFERENCE`: [GOV.UK Design System components](https://design-system.service.gov.uk/components/) y [patterns](https://design-system.service.gov.uk/patterns/)
- `PATTERN`: Componentes sencillos, consistentes y accesibles para breadcrumbs, radios, inputs, detalles, tablas, paginación y navegación por tareas.
- `WHY_IT_WORKS`: Los componentes codifican estados, foco, errores y responsive; la interfaz se puede escanear sin aprender un lenguaje visual nuevo en cada pantalla.
- `RELEVANCE_TO_SALIDA`: Sustituir tarjetas heterogéneas por filas, tablas, disclosures y un único control primario por tarea.
- `DO_NOT_COPY`: El aspecto gubernamental completo; tomar las reglas de interacción, no una copia visual.

### 3. National Careers Service

- `REFERENCE`: [Explore careers](https://nationalcareers.service.gov.uk/explore-careers)
- `PATTERN`: Búsqueda de puesto como entrada principal y rutas alternativas diferenciadas: sector, categoría, evaluación de habilidades y apoyo de orientación.
- `WHY_IT_WORKS`: Sirve tanto a quien llega con una palabra concreta como a quien todavía no sabe qué buscar.
- `RELEVANCE_TO_SALIDA`: Ofrecer “titulación”, “ocupación” y “oferta” como puntos de partida equivalentes, con una ruta explícita de descubrimiento.
- `DO_NOT_COPY`: La cantidad de enlaces auxiliares ni un buscador como única explicación del producto.

### 4. France Travail

- `REFERENCE`: [Recherche d’offre](https://candidat.francetravail.fr/rechercheoffre/emploi)
- `PATTERN`: Consulta por puesto y ubicación, seguida de sectores, regiones y refinamiento de resultados.
- `WHY_IT_WORKS`: La geografía y la intención se convierten en filtros visibles desde el inicio.
- `RELEVANCE_TO_SALIDA`: En Ofertas, hacer visibles ocupación, localidad, provincia, fecha y fuente antes del CTA.
- `DO_NOT_COPY`: La densidad completa de un portal de empleo generalista ni su número de enlaces de exploración.

### 5. O*NET OnLine

- `REFERENCE`: [O*NET OnLine](https://www.onetonline.org/) y [Browse all occupations](https://www.onetonline.org/help/online/browse_all)
- `PATTERN`: Búsqueda por palabra o código, navegación por taxonomía y crosswalks entre ocupaciones, educación y otros sistemas.
- `WHY_IT_WORKS`: Permite entrar por distintos vocabularios sin perder la estructura experta del dato.
- `RELEVANCE_TO_SALIDA`: CNO-11 debe aparecer como evidencia navegable y no como un código escondido en una tarjeta.
- `DO_NOT_COPY`: La interfaz legacy, la densidad de enlaces y la exposición simultánea de todas las herramientas.

### 6. TodoFP

- `REFERENCE`: [Qué estudiar](https://www.todofp.es/que-estudiar.html)
- `PATTERN`: Taxonomía educativa clara —grados, familias y acreditación— con búsqueda global y navegación por categorías.
- `WHY_IT_WORKS`: Permite orientarse por lenguaje educativo familiar antes de entrar en detalle.
- `RELEVANCE_TO_SALIDA`: La ficha de FP debe conservar familia, código y nivel como contexto estable, pero llevar rápido a salidas y centros.
- `DO_NOT_COPY`: La repetición de módulos visuales y tiles como sustituto de una jerarquía de contenido.

### 7. Datos.gob.es

- `REFERENCE`: [Catálogo de conjuntos de datos](https://datos.gob.es/es/catalogo/conjuntos-datos?is_hvd=true)
- `PATTERN`: Búsqueda de catálogo con filtros por categoría, formato, publicador, frecuencia, etiquetas y orden.
- `WHY_IT_WORKS`: Hace visible cómo acotar un universo grande y cómo volver a consultar o descargar.
- `RELEVANCE_TO_SALIDA`: La lista de ofertas y centros necesita filtros explícitos, recuento de resultados y fecha de consulta.
- `DO_NOT_COPY`: La experiencia de catálogo como pantalla de inicio; SALIDA empieza por una decisión, no por una base de datos.

### 8. ESCO

- `REFERENCE`: [ESCO search](https://esco.ec.europa.eu/en/search)
- `PATTERN`: Exploración semántica de ocupaciones, habilidades y cualificaciones con búsqueda y filtros por tipo.
- `WHY_IT_WORKS`: Ayuda a conectar términos que la persona usa con una taxonomía común.
- `RELEVANCE_TO_SALIDA`: El resultado debe explicar la relación entre el nombre cotidiano, el código CNO y la fuente, sin ocultar la traducción conceptual.
- `DO_NOT_COPY`: La amplitud de un portal europeo como IA principal para una consulta local.

### 9. Job Bank Canada

- `REFERENCE`: [Occupation search](https://www.jobbank.gc.ca/occupation_search-eng.do) y [trend analysis](https://www.jobbank.gc.ca/trend-analysis)
- `PATTERN`: Perfil de ocupación con tareas, formación, salarios, perspectivas y contexto geográfico; permite comparar y consultar outlooks.
- `WHY_IT_WORKS`: Convierte una etiqueta de ocupación en una decisión informada y contextual.
- `RELEVANCE_TO_SALIDA`: La ficha de FP debe separar “relación documentada”, “señal de ofertas” y “contexto” en ese orden, evitando prometer resultados.
- `DO_NOT_COPY`: Incorporar salarios o pronósticos que las fuentes de SALIDA no sostienen.

### 10. European Data Portal

- `REFERENCE`: [Dataset search](https://data.europa.eu/data/datasets/?locale=en)
- `PATTERN`: Catálogo masivo con búsqueda, filtros combinables, orden, número de resultados y exportación.
- `WHY_IT_WORKS`: Hace operable un volumen grande sin perder el estado de la consulta.
- `RELEVANCE_TO_SALIDA`: Reutilizar el principio de “estado de consulta visible” en Ofertas y Dónde estudiar.
- `DO_NOT_COPY`: Su escala y lenguaje de dataset; el producto debe seguir hablando de próximos pasos profesionales.

## DESIGN_PROBLEMS_BY_SCREEN

### `final-home-desktop.png`

- El hero editorial ocupa la mayor parte de la primera pantalla y desplaza la acción; el H1 serif domina antes de explicar el modelo de decisión.
- La composición izquierda/derecha crea dos centros de atención: manifiesto grande y panel de formulario, sin un orden de tarea evidente.
- Radio cards, panel, chips, bordes y botones repiten el mismo rectángulo; la interfaz se percibe como una colección de componentes, no como una ruta.
- La paleta beige/burdeos y la tipografía de display comunican una publicación editorial cuando el producto necesita confianza operativa y lectura rápida.
- El footer repite navegación y tiene demasiado peso visual para una pantalla de entrada.

### `final-home-mobile-390.png`

- El H1 ocupa demasiada altura y empuja el primer control útil fuera de la zona de decisión inmediata.
- Las tres opciones se convierten en bloques seriales y los ejemplos aparecen tarde; falta una acción compacta, seleccionable y claramente progresiva.
- Hay demasiados contenedores con borde y separadores para una pantalla estrecha; la densidad percibida aumenta aunque haya poca información.
- El footer consume una fracción desproporcionada del recorrido móvil.

### `final-fp-result-desktop.png`

- La ficha concatena datos, ocupaciones, ofertas, centros e ingresos en módulos equivalentes; no queda claro qué debe leer primero.
- Las ocupaciones y las ofertas repiten CTAs y cajas de información, mientras que la evidencia queda subordinada al volumen de contenido.
- El “en un vistazo” no funciona como resumen operativo porque compite con varios paneles de igual peso.
- La jerarquía debe pasar a: relación documentada → señal de empleo → dónde continuar → contexto y método.

### `final-offers-desktop.png`

- La cuadrícula de tres tarjetas obliga a comparar alturas, posiciones y cantidades de texto; es un patrón de escaparate, no de resultados.
- El título de oferta, ubicación, fecha, fuente y CTA no comparten columnas; el ojo no puede recorrer la lista de forma estable.
- Los cuadrados de información y los botones repetidos añaden ruido sin aportar decisión.
- Faltan un estado de consulta más visible, filtros con recuento y una única acción consistente por fila.

### `final-centers-desktop.png`

- Cada provincia se presenta como una regla horizontal de ancho completo y deja una gran zona vacía a la derecha.
- La tarjeta estrecha de cada centro no aprovecha el viewport ni permite comparar provincia, modalidad y dirección.
- La repetición de encabezado + regla + tarjeta produce ritmo vertical sin mejorar el escaneo.
- Un listado tabular/responsive con provincia como columna y búsqueda arriba resuelve la misma tarea con menos desplazamiento.

## PROPOSED_INFORMATION_ARCHITECTURE

### Modelo mental

SALIDA es una ruta de decisión con evidencia: `partir de algo → relacionar → comprobar → decidir`. No es un catálogo de tarjetas ni una página editorial sobre datos abiertos.

### Navegación

- `PRIMARY`: **Explorar**, **Ofertas**, **Dónde estudiar**.
- `SECONDARY`: dentro de una ficha, **Salidas**, **Ofertas relacionadas**, **Dónde estudiar**, **Datos y método**.
- `UTILITY`: **Datos y método**, **Accesibilidad y fuentes**, estado de actualización y, cuando exista, información del proyecto.

### Jerarquía por página

1. Intención y contexto: qué se puede resolver aquí.
2. Entrada o filtro principal: una acción dominante.
3. Resultado principal: lista o tabla escaneable.
4. Evidencia y fuente: suficiente para confiar y verificar.
5. Próximo paso: un CTA claro, no tres CTAs equivalentes.

### Rutas prioritarias

- `Explorar`: titulación → ocupaciones relacionadas → ofertas/centros → método.
- `Ofertas`: ocupación o palabra clave + ubicación → filtros → listado → fuente oficial.
- `Dónde estudiar`: ciclo/familia/centro + provincia → listado → modalidad/dirección → fuente educativa.

## DESIGN_SYSTEM_FOUNDATION

- `TYPOGRAPHY`: sans del sistema (`Segoe UI`, `system-ui`), H1 compacto de 40–60 px en desktop y 36–52 px en mobile, cuerpo 16 px, etiquetas 12 px; peso y espacio hacen la jerarquía, no una serif ornamental.
- `COLOR`: canvas `#F5F7FA`, superficie `#FFFFFF`, tinta `#102A43`, texto secundario `#52606D`, primario teal `#0B7285`, primario oscuro `#075C6B`, foco/acento amarillo `#E9B949`, verificado verde `#2F855A`, error `#C53030`.
- `LAYOUT`: max-width 1240 px, grid principal 8/4, una columna en mobile, spacing 4/8/12/16/24/32/48, divisores de 1 px; radio máximo 6 px.
- `COMPONENTS`: header compacto, task rows, input + CTA, breadcrumbs, tabs contextuales, summary list, result rows, filtros con recuento, tabla responsive, details/disclosure, status chips y estados de error/foco/loading.
- `EVIDENCE`: cada relación muestra estado revisado, código/fuente y fecha; la copia distingue señal, relación y garantía.
- `INTERACTION`: hover suave, foco visible de 3 px, filas seleccionadas con fondo teal pálido, estados vacíos/error explícitos y botones con una sola intención.

## DIRECTION_A

### Ruta clara · service-first

- `HOME_DESKTOP`: encabezado compacto; H1 breve; tres tareas como filas numeradas; formulario contextual en un panel único; rail de cobertura y método debajo.
- `HOME_MOBILE`: tareas como lista vertical con índice y flecha; el formulario se actualiza bajo la selección; navegación reducida y footer ligero.
- `HEADER`: SALIDA CyL + contexto corto; Explorar, Ofertas y Dónde estudiar; Datos y método como utilidad.
- `PRIMARY_INTERACTION`: escoger intención y completar un único campo; el sistema lleva al siguiente paso sin pedir un formulario completo.
- `RESULTS`: filas y tabla con columnas estables, recuentos, filtros y CTA de fuente oficial.
- `FP_DETAIL`: relaciones documentadas primero; señales de mercado después; centros como próximo paso; contexto en aside/disclosure.
- `OFFERS`: buscador oscuro, rail de filtros y lista densa de resultados alineados.
- `CENTERS`: tabla responsive con centro, provincia, modalidad y dirección; sin huecos artificiales.
- `EVIDENCE`: chips de revisión, código CNO, fuentes y fecha junto al resultado.
- `VISUAL_SYSTEM`: sans, blanco/canvas frío, navy-teal-amarillo, divisores, superficies puntuales, casi ninguna tarjeta.
- `PROS`: menor carga cognitiva, mejor escaneo, escala a muchos resultados y hace visible el método.
- `CONS`: menos “impacto editorial” y necesita un buen trabajo de copy para que la ruta no parezca un formulario administrativo.

## DIRECTION_B

### Mapa de conexiones · exploratory graph

- `HOME_DESKTOP`: una pregunta central con mapa de nodos titulación → ocupación → oferta/centro y un buscador lateral.
- `HOME_MOBILE`: mapa convertido en una secuencia horizontal de pasos y relaciones expandibles.
- `HEADER`: Explorar como espacio principal; Ofertas y Centros como vistas derivadas.
- `PRIMARY_INTERACTION`: seleccionar un nodo para expandir sus relaciones y comparar caminos.
- `RESULTS`: resultados agrupados por relación, con “por qué está conectado” como acción principal.
- `FP_DETAIL`: visualización de red con lista accesible equivalente debajo; ocupaciones como nodos primarios.
- `OFFERS`: agrupación por ocupación/provincia y trazado visual de qué FP llevó al resultado.
- `CENTERS`: mapa geográfico + lista, con provincia y modalidad como filtros.
- `EVIDENCE`: cada arista abre fuentes y reglas de relación; se prioriza la procedencia.
- `VISUAL_SYSTEM`: nodos, líneas, teal/amarillo para estados, paneles laterales y más interacción visual.
- `PROS`: explica muy bien la propuesta de “conectar” datos y favorece el descubrimiento.
- `CONS`: riesgo alto de complejidad, accesibilidad y mala comprensión en mobile; el mapa puede convertirse en decoración.

## DIRECTION_C

### Mesa de decisión · evidence dashboard

- `HOME_DESKTOP`: tablero con tres entradas grandes —FP, ocupación, oferta— y un resumen de cobertura, actualización y calidad de evidencia.
- `HOME_MOBILE`: selector superior de entrada y bloques de resumen apilados; la acción siempre permanece visible.
- `HEADER`: navegación corta + selector persistente de consulta + acceso destacado a método.
- `PRIMARY_INTERACTION`: buscar y después comparar señales en paralelo con filtros persistentes.
- `RESULTS`: tabla analítica con métricas, badges de fuente, filtros avanzados y ordenación.
- `FP_DETAIL`: resumen de métricas arriba; ocupaciones, ofertas y centros como paneles de análisis.
- `OFFERS`: tabla de trabajo con filtros persistentes, guardado/descarga y estado de consulta.
- `CENTERS`: tabla comparativa de modalidad, provincia, dirección y disponibilidad cuando exista.
- `EVIDENCE`: drawer o panel lateral de trazabilidad por fila.
- `VISUAL_SYSTEM`: navy y grises, acento amarillo, números grandes controlados, densidad informativa alta y componentes de datos.
- `PROS`: muy útil para personas expertas, revisores y futuras comparaciones; muestra cobertura y límites.
- `CONS`: puede parecer backoffice, exige más alfabetización de datos y adelanta información antes de que exista una intención clara.

## RECOMMENDED_DIRECTION

**Direction A — Ruta clara · service-first.** Es la única que resuelve primero la pregunta humana y deja que la densidad crezca después. Conserva la fortaleza de SALIDA —conectar fuentes— pero cambia la forma de presentarla: una ruta, una acción dominante, resultados alineados y evidencia cercana. B puede incorporarse más adelante como visualización opcional y C como modo avanzado para análisis.

## PROTOTYPE_FILES

- [index.html](./index.html) — cinco vistas navegables por hash: home, ficha de FP, ofertas, centros y método.
- [prototype.css](./prototype.css) — sistema visual aislado y responsive.
- [prototype.js](./prototype.js) — navegación, selección de tarea, estados de formulario y filtros de demostración.

## SCREENSHOTS

Capturas verificadas en el navegador local, en 1440 px para desktop y 390 px para mobile:

- `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v2\home-desktop-1440.png`
- `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v2\home-mobile-390.png`
- `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v2\fp-detail-desktop.png`
- `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v2\offers-desktop.png`
- `F:\CodexHome\visualizations\2026\08\31\01a0585e-d8e4-7793-917f-cfd24b1fba23\design-review-v2\centers-desktop.png`

## WHY_THIS_IS_BETTER

- Cambia la entrada de “leer un manifiesto” a “elegir una tarea”.
- Sustituye la estética editorial beige/serif/burdeos por una interfaz operativa, accesible y más propia de un servicio público digital.
- Cambia tarjetas y mosaicos por filas, columnas y tablas que permiten comparar títulos, ubicaciones, fechas y fuentes.
- Hace que la evidencia —revisión, código, fuente y fecha— esté junto al resultado y no relegada a una caja secundaria.
- Usa la misma lógica en desktop y mobile: la composición se refluye, no se convierte en una larga serie de paneles equivalentes.
- Añade estados de foco, error, selección y filtros, para que la interacción sea revisable antes de tocar producción.

## OPEN_QUESTIONS

1. ¿Se aprueba **Ruta clara · service-first** como dirección para la siguiente iteración de frontend?
2. ¿La búsqueda global debe aceptar indistintamente FP, ocupación y oferta, o se prefieren tres entradas estrictamente separadas para medir cada ruta?
3. ¿El modo avanzado de comparación de relaciones/ofertas queda fuera de la primera implementación y se reserva para una fase posterior?
