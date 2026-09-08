# Revisión ampliada antes del piloto — 8 de septiembre de 2026

El candidato usa la instantánea `20260908152239149-2a613b74a192`. Su publicación y
comprobación externa se registran por separado; este documento no acredita sesiones
con personas ni presentación oficial.

## Evidencia y cobertura

- Revisión Qwen3.6/Gemma4: 528 dictámenes sobre 264 relaciones existentes y 98 sobre 49 propuestas seleccionadas. La entrega íntegra se verificó exportando cada sesión de OpenCode. Los primeros ensayos truncados se invalidaron.
- 44 correcciones de cita/fuente; seis correcciones CNO; ocho relaciones pendientes y dos rechazadas. No se aprobaron relaciones por votación de modelos.
- Candidato: 320 relaciones aprobadas, 185/187 claves con relación, 307/1.032 ofertas conectadas y 549 vínculos de evidencia. Dos programas siguen sin relación precisa. Las claves incluyen modalidades y no equivalen a titulaciones distintas.
- Cinco denominaciones completas SISPE tienen reglas explícitas, con siete pares título-programa. No se generalizó el cruce a todas las especialidades de cada CNO.
- Las 320 citas de FP aprobadas se localizaron literalmente en las capturas primarias, normalizando solo espacios. El catálogo SISPE de 2018 conserva su edición; no se considera actualizado por la descarga de 2026.

## Producto y rendimiento

La lista resumida de una oferta muestra cada formación una sola vez, aunque tenga
varias evidencias. El detalle conserva las relaciones y sus fuentes. Las pruebas
cubren esta separación, las denominaciones exactas y los límites universitarios.

La ampliación lleva la carga inicial de datos de la ficha FP a 10.060.667 bytes
sin comprimir en la medición de Playwright. El límite de regresión pasa de
10.000.000 a 10.100.000 bytes (+1 %), para conservar la evidencia adicional. Esta
es una concesión explícita de tamaño, no una mejora de rendimiento. Los resultados
EDUCAbase siguen cargándose únicamente al solicitarlos; no se ha aumentado el
presupuesto de JavaScript. El bundle distribuye solo la instantánea activa; las
fuentes históricas retenidas no se copian al sitio.

## Controles

La compilación, integridad de 22 recursos, política de licencias y coherencia de la
memoria HTML/PDF han pasado. La memoria tiene 692 palabras y dos páginas, inspeccionadas
sin desbordamientos en la segunda página. La revisión final de navegador y CI se
incorpora al registro de publicación una vez completada.

El piloto humano sigue en `HUMAN_PILOT_NOT_RUN`. La revisión de modelos no se cuenta
como pilotaje ni como certificación profesional de orientación.
