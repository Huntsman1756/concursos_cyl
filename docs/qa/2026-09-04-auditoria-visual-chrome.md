# Auditoría visual y funcional en Chrome — 4 de septiembre de 2026

## Alcance

- Sitio revisado: `https://salida-cyl.157-90-22-40.sslip.io/`
- Navegador: Chrome, escritorio, ventana aproximada de 1252 px de ancho.
- Recorrido: inicio, tres pestañas del hero, buscador principal, bloque de datos, Explorar FP, Desde una profesión, Ofertas, Dónde estudiar, Comparar estudios, Más formación, Datos abiertos, Metodología, Accesibilidad y Para organizaciones.
- Tipo de revisión: UX, coherencia visual, redacción, ortotipografía y riesgos visibles de accesibilidad.

## Veredicto

La base visual es buena y suficientemente seria para un concurso: paleta sobria, jerarquía clara, componentes consistentes y una navegación comprensible. Antes de presentarla conviene resolver tres fallos de prioridad alta: la ruta de Ofertas no carga, el desplegable de «Qué es una relación revisada» se sale de la pantalla y genera desplazamiento horizontal, y algunas navegaciones conservan el scroll anterior y abren la página nueva con el título cortado.

## Hallazgos priorizados

### P0 — bloqueantes para la candidatura

1. **La sección Ofertas no funciona.** `/desde-oferta` mostró «No hemos podido abrir las ofertas» y «La copia de ofertas no está disponible». El fallo se reprodujo después de recargar. En la portada, el contador asociado permanece en `…` y «comprobando fecha…». Esto rompe una de las cuatro rutas principales y debilita la confianza en las cifras.

2. **El desplegable de “relación revisada” desborda el viewport.** En el bloque «Datos del catálogo», al abrir «Qué es una relación revisada», la caja queda cortada por el borde derecho y aparece una barra de desplazamiento horizontal en toda la página. Debe posicionarse dentro del viewport, aceptar salto de línea y no modificar el ancho del documento.

3. **El scroll no se restablece siempre al cambiar de ruta.** Al navegar desde una zona baja de una página hacia «Desde una profesión» y «Para organizaciones», la nueva ruta apareció a media altura, incluso con el H1 parcialmente fuera de pantalla. Todas las navegaciones internas deberían llevar al inicio o al foco principal de forma predecible.

### P1 — impacto alto en claridad y confianza

4. **Mensaje de fuentes demasiado insistente.** La frase exacta «Fuentes públicas y trazabilidad» solo aparece una vez en `src/features/home/HomePage.tsx`, pero la misma idea se repite con «relaciones revisadas», «fuente», «copia», «evidencia», «procedencia» y «límites» en casi todas las pantallas. La transparencia es un punto fuerte, pero ahora compite con la tarea del usuario y puede sonar defensiva o pedante.

   Propuesta editorial:

   - Portada: una sola promesa breve, por ejemplo «Datos oficiales, revisados y con fecha».
   - Bloque de cifras: «Datos y actualización» en lugar de «Fuentes públicas y trazabilidad».
   - Páginas de tarea: mostrar solo la fecha necesaria y un enlace «Cómo se comprueba».
   - Metodología y Datos abiertos: concentrar allí la explicación técnica completa.
   - Reservar «trazabilidad» para público técnico; para alumnado y familias usar «origen de los datos».

5. **La jerarquía de títulos cambia demasiado entre páginas.** «Accesibilidad» y «Para centros y administraciones» usan H1 mucho más grandes que «Dónde estudiar», «Ingresos observados» o «Metodología y fuentes». Definir una única escala de H1 de escritorio y otra móvil daría una identidad más unitaria.

6. **La página Metodología es excesivamente técnica.** El párrafo sobre `offerEvidence` expone un identificador interno y una justificación larga que parece escrita para una auditoría técnica, no para una persona que busca orientación. Cambiar por una explicación de dos frases en lenguaje natural y mover el detalle técnico al repositorio o a un acordeón.

7. **Fechas y mayúsculas no están normalizadas.** Conviven «22 ago 2026», «22 de agosto de 2026» y «12/08/2026», además de «Grado superior» y «Grado Superior». Recomendación: usar en interfaz «22 de agosto de 2026» y nombres de nivel en minúscula (`grado medio`, `grado superior`, `curso de especialización`).

8. **La tabla de centros duplica información.** En las filas revisadas, «Pública» aparece dentro de Modalidad («Presencial / Pública») y otra vez en Titularidad. La celda Modalidad debería contener solo «Presencial», «A distancia» o «Mixta».

9. **“Más formación” puede mostrar convocatorias ya vencidas como abiertas.** El 4 de septiembre de 2026 seguía encabezando «Empleo público abierto al 22 ago 2026» con plazos hasta el 24 de agosto. Aunque se explica que es una copia, la lectura rápida induce a pensar que siguen abiertas. Mejor: «Convocatorias que figuraban abiertas en la copia del 22 de agosto» y una alerta si la fecha límite ya pasó respecto al día de consulta.

### P2 — pulido visual y editorial

10. **Espaciado apretado en filtros desplegados.** En Explorar FP, la etiqueta «Familia profesional» queda demasiado cerca del selector anterior. Aplicar un espacio vertical constante entre grupos de campo.

11. **La comparación reordena la lista al seleccionar.** Al marcar «Administración y gestión», el elemento salta al principio. Es útil para ver seleccionados, pero puede desorientar y mover el foco visual. Mantener el orden o separar los elegidos en una zona fija titulada «Seleccionados».

12. **Lista con scroll dentro de una página con scroll.** Comparar estudios introduce un contenedor interno largo. Funciona, pero el teclado `Fin/End` actúa sobre la lista cuando conserva el foco, no sobre la página. Conviene limitar la altura con claridad, mostrar un final visual y ofrecer búsqueda eficaz.

13. **Ortotipografía procedente de datos externos.** Se vieron «Ats/due», «Guia por itinerarios en bicicleta» y «Actividades de floristeria». Si son literales de la fuente, normalizar solo la presentación (`ATS/DUE`, `Guía`, `floristería`) o indicar que se conserva la denominación original.

14. **Espacios antes de signos.** En el contenido accesible aparecen construcciones como «Relaciones revisadas : copia…» y «30 ago 2026 ;». Eliminar los espacios anteriores a `:` y `;` en la composición de textos.

15. **Algunas líneas son demasiado largas.** En Para organizaciones y Metodología hay párrafos que atraviesan casi todo el ancho. Limitar el texto corrido a unas 65–75 letras por línea mejora lectura y sensación de acabado.

## Lo que funciona bien

- Las tres pestañas del hero mantienen estable la imagen y la geometría principal; no se observaron saltos de tamaño de pequeño a grande.
- Las tarjetas 01/02/03 tienen alturas, imágenes, bordes y llamadas a la acción coherentes.
- Tipografía, color y estilo de borde son uniformes en la mayor parte del sitio.
- El buscador principal ofrece resultados claros, admite selección por teclado y mantiene un foco visible.
- Tabs, radios, checkboxes, tablas, encabezados y enlaces tienen una estructura semántica reconocible en Chrome.
- Los textos alternativos de las imágenes editoriales son descriptivos.
- Comparar estudios explica bien que los ingresos observados no son una predicción personal y diferencia España de Castilla y León.
- Datos abiertos es la pantalla más equilibrada: compacta, verificable y con llamadas a la acción claras.
- La declaración de accesibilidad evita afirmar una certificación total y reconoce límites.

## Recorrido y salud por paso

1. **Inicio y hero — bien.** Jerarquía clara, CTA visible e imagen estable.
2. **Pestañas Tengo una FP / Busco una profesión / Estoy mirando una oferta — bien.** Cambio estable, sin redimensionado de imagen; el alto del formulario varía de forma razonable.
3. **Autocompletado de ciclos — bien.** Resultados legibles, selección con flechas y `Enter`, foco visible.
4. **Tarjetas 01/02/03 — bien.** Cuadrícula y proporciones consistentes.
5. **Datos del catálogo — mal.** Contador de ofertas sin resolver y ayuda emergente fuera de pantalla.
6. **Explorar FP — bien con ajustes.** Ejemplos claros y filtros funcionales; falta aire entre campos.
7. **Desde una profesión — correcto con incidencia de navegación.** Formulario claro, pero la ruta puede abrirse con el H1 cortado por scroll heredado.
8. **Ofertas — bloqueado.** Error persistente de carga tras reintento.
9. **Dónde estudiar — usable.** Filtros completos y tabla entendible; duplicación de «Pública» y densidad alta.
10. **Comparar estudios — bien.** Flujo guiado y resultados comprensibles; revisar reordenación y scroll interno.
11. **Más formación — usable con riesgo editorial.** Contenido amplio, pero fechas vencidas pueden parecer vigentes y hay textos de fuente sin normalizar.
12. **Datos abiertos — muy bien.** Buena síntesis de alcance, descarga, licencia e integridad.
13. **Metodología — completa pero densa.** Buena transparencia; exceso de lenguaje técnico y carga cognitiva.
14. **Accesibilidad — bien.** Foco visible y semántica clara; no se verificaron contraste numérico ni lector de pantalla real.
15. **Para organizaciones — bien con ajustes.** Propuesta de valor coherente; H1 sobredimensionado y prosa algo institucional.

## Riesgos de accesibilidad observables

- Confirmado: foco de teclado visible en navegación, buscador y CTA.
- Confirmado: tabs y formularios exponen nombres accesibles; las imágenes tienen texto alternativo.
- Riesgo: el overflow horizontal del desplegable dificulta ampliación, reflow y uso móvil.
- Riesgo: conservar el scroll entre rutas puede desorientar a usuarios de teclado o ampliación y dejar el encabezado fuera del campo visual.
- Riesgo: los contenedores con scroll anidado pueden atrapar la navegación por teclado o producir desplazamientos inesperados.
- Pendiente de prueba técnica: ratios de contraste, zoom al 200/400 %, reflow móvil, orden completo de tabulación, anuncios de cambios dinámicos y lector de pantalla.

## Orden recomendado de corrección

1. Recuperar `/desde-oferta` y el contador de portada.
2. Corregir posicionamiento del desplegable y eliminar overflow horizontal.
3. Restablecer scroll/foco en todas las transiciones de ruta.
4. Eliminar duplicación de titularidad y normalizar fechas, niveles y tildes.
5. Reducir la repetición sobre fuentes; concentrar detalle en Metodología/Datos abiertos.
6. Unificar escala tipográfica, ancho de lectura y espaciado de formularios.

## Límites de esta revisión

La auditoría se realizó visualmente en Chrome de escritorio y con el árbol de accesibilidad expuesto por el navegador. No equivale a una certificación WCAG, no midió colores con herramientas de contraste y no cubrió en esta pasada Safari, Firefox, lector de pantalla real ni todos los breakpoints móviles.
