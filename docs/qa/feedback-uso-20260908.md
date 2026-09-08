# Ajustes derivados del feedback de uso — 8 de septiembre de 2026

El titular del proyecto aportó observaciones de navegación y presentación en la web pública. Este registro describe ese feedback de uso y sus correcciones; no atribuye una auditoría de relaciones, participantes adicionales ni resultados de un estudio controlado.

## Cambios

- Formularios de portada con acción debajo del campo; nombre SALIDA CyL uniforme.
- Contraste de ayudas y enlaces de oferta mantenido al activar, enfocar y visitar; separación del icono respecto a su texto.
- Cabecera con descripción del servicio, repositorio público en el pie y una sola declaración sobre imágenes editoriales.
- Código oficial del centro identificado; se conserva «Cómo llegar» y se retira la lista técnica de coordenadas de la ficha.
- Recursos de ECYL y certificados en secciones sucesivas; usos profesionales con jerarquía y separación coherentes.
- Ingresos observados accesibles desde la cabecera de FP. La comparación ya contiene gráficos y tablas; mantiene ámbito, cohorte y límites, sin prometer salarios personales.
- Ofertas con relación FP revisada primero y, dentro de cada grupo, fecha descendente. La clasificación no puntúa la calidad del empleo ni garantiza cumplir requisitos.
- «Otra» se explica como ubicación indicada por la fuente, sin borrar registros ni atribuirles una provincia inventada.
- La memoria explica la asistencia de IA y la comprobación por un coordinador también de IA; los modelos concretos siguen documentados en el informe técnico. Se refuerzan beneficiarios, territorio y trazabilidad sin comparar capacidades no comprobadas de competidores.

## Datos y distribución

Se conserva el snapshot `20260908155911229-c72920ec4fed`: 320 relaciones, 185/187 claves cubiertas y 301/1032 ofertas con 536 vínculos. Las cifras 307/549 correspondían a una versión de trabajo anterior; el README de revisión ya contenía las cifras finales.

La ficha FP deja de solicitar el catálogo de municipios que no utiliza: 470.256 bytes sin comprimir menos por entrada, manteniendo el límite de 10 MB. Los indicadores de ingresos siguen bajo demanda. Las mediciones de bytes descomprimidos no se confunden con transferencia comprimida.

Pages materializa rutas conocidas como archivos índice y conserva el 404 para rutas desconocidas. Las rutas CNO contienen dos puntos: su materialización completa se verifica en Linux, como el workflow de publicación; Windows no admite esos nombres de directorio.

La prueba de datos `aggregateEvidence.test.ts` comprueba que ninguna relación aprobada usa como única fuente uno de los recursos agregados de contexto del manifiesto activo. Esto comprueba separación de fuentes; no acredita la corrección semántica de una cita.

## Decisiones de alcance

Se mantienen el listado territorial, sus filtros y los enlaces para llegar a cada centro. Un mapa adicional requiere una pregunta geográfica concreta y una alternativa accesible; véase la [guía de mapas de GOV.UK](https://brand.design-system.service.gov.uk/data/maps/). No se añade por imitación de otros concursantes.

No se transforma este feedback en cifras de impacto, una auditoría profesional del catálogo ni una comparación de superioridad frente a otros proyectos.

## Verificación local

La suite unitaria completa terminó con 1.374 aprobadas y 178 omitidas. Las pruebas nuevas de orden de ofertas, separación de agregados y materialización de rutas se ejecutaron además de forma focalizada (6 aprobadas). Chromium completó 292 pruebas y detectó cuatro expectativas obsoletas sobre coordenadas; los tres archivos afectados y las nuevas regresiones de contraste y alineación se repitieron completos, con 30 aprobadas. La memoria HTML/PDF se regeneró con 762 palabras y dos páginas.

Las seis pantallas de portada, ficha FP, recursos, organizaciones, ofertas e ingresos se capturaron a 390 y 1440 px sin desbordamiento horizontal. Las pruebas adicionales verifican la misma posición de los botones de portada y el contraste al abrir ayudas o enfocar enlaces oficiales.

La repetición sobre el commit publicado `ca8289ebe12c888af7765a212ce44b3754f838ca`, desde una copia limpia externa, terminó con 1.377 pruebas unitarias aprobadas y 178 omitidas, y 30 comprobaciones Chromium de los recorridos afectados aprobadas. La publicación principal devolvió el commit esperado; sus 22 recursos coincidieron con el manifiesto y las seis comprobaciones públicas no detectaron errores de página ni infracciones de Axe.

El build de Pages incorpora 42 bytes adicionales en CSS por su prefijo de URL (157.984 bytes en raíz; 158.026 en Pages). El gate conserva el límite raíz de 158.000 y aplica a CSS la reserva de 100 bytes que ya distingue el prefijo exacto de Pages en JavaScript. Las pruebas rechazan superar esa reserva o utilizarla en otra ruta. No se modifican los límites agregados ni el de transferencia inicial.
