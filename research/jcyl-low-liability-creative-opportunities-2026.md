# Auditoría JCyL: datos para una aplicación ciudadana creativa y de bajo riesgo (2026)

Fecha de verificación: **2 de agosto de 2026**  
Ámbito: catálogo analítico de Datos Abiertos de Castilla y León, campos y registros consultados mediante la API oficial, y colisión con el corpus local de **256 candidaturas históricas**.

## Conclusión ejecutiva

La auditoría cambia la dirección de búsqueda:

- La base más firme no está en salud, seguridad, trámites ni recomendaciones. Está en **convertir la estructura real de cada municipio en un artefacto creativo**, utilizando las superficies de usos del suelo y la geometría municipal. En 2022 existe una matriz completa de **2.248 municipios × 13 categorías**, enlazable al **100 %** con 2.248 geometrías municipales. La salida puede ser un SVG, patrón, póster, animación o composición sonora; el dato no adorna el resultado, lo determina.
- Hay dos reservas técnicamente buenas y de bajo riesgo: el **pulso de uso de las webs públicas** y la **serie mensual de visitantes de museos**. Ambas permiten experiencias generativas, pero todavía necesitan demostrar una utilidad ciudadana superior a “ver datos bonitos”.
- La idea intuitiva de remezclar patrimonio visual **no está sustentada por el portal**. De 430 conjuntos, solo seis contienen campos explícitos de imagen o fotografía; monumentos, museos, bibliotecas y fondos de archivo no publican un corpus de obras/imágenes reutilizables. La agenda cultural sí enlaza imágenes, pero los derechos de cada fichero no están declarados individualmente.
- Las rutas de agenda cultural, monumentos y bibliobuses están además muy saturadas por candidaturas anteriores. Cambiarles la interfaz o añadir IA no elimina la colisión.
- La fecha de modificación del catálogo no equivale a actualidad del contenido. Ejemplos críticos: cultivos llega a **2022** aunque se reprocesó en 2026; monumentos se procesó por última vez en **2024** aunque sus metadatos se modificaron en 2026; las estadísticas de bibliotecas solo contienen **2019**.

Por tanto, el orden de trabajo recomendado es:

1. probar una experiencia creativa basada en **huella municipal de usos del suelo + forma del municipio**;
2. someter a prueba una experiencia basada en **atención digital pública**;
3. conservar **visitantes de museos** como capa secundaria;
4. no desarrollar todavía ninguna aplicación de remezcla patrimonial, agenda, monumentos o bibliobuses.

## Puerta de seguridad jurídica y de producto

Una dirección solo pasa esta auditoría si cumple simultáneamente:

- no diagnostica, puntúa ni recomienda una actuación sobre salud, seguridad, derecho, dinero o emergencias;
- no clasifica a personas ni usa datos personales del usuario;
- produce una salida expresiva, reversible y opcional, no una instrucción que pueda causar perjuicio;
- diferencia claramente dato histórico de dato actual;
- atribuye cada fuente y no reutiliza imágenes enlazadas sin comprobar los derechos del propio fichero;
- no convierte una correlación o una métrica de uso en una afirmación sobre toda la ciudadanía;
- usa el dato JCyL como materia estructural del resultado, no como decoración o requisito nominal del concurso.

## Las ocho mejores familias encontradas

| # | Familia y conjuntos JCyL | Evidencia de aptitud | Limitación real | Colisión histórica | Veredicto |
|---:|---|---|---|---|---|
| 1 | **Huella municipal del territorio**: [superficies de cultivos municipales](https://analisis.datosabiertos.jcyl.es/explore/dataset/superficies-de-cultivos-municipales/information/) + [límites municipales](https://analisis.datosabiertos.jcyl.es/explore/dataset/municipio-limites-categorias-est/information/) | 313.367 filas, 13 categorías de uso; en 2022 hay 29.224 filas = 2.248 municipios × 13. Las 2.248 claves enlazan con las 2.248 geometrías: **100 % de cobertura**, sin duplicados de municipio. CC BY 4.0. | Último año sustantivo: 2022; geometrías de 2023. Antes de 2020 la ausencia de categoría no siempre está representada con cero y hay etiquetas antiguas mal codificadas. | Cuatro antecedentes sobre mapas/análisis/recomendación de cultivos, pero ninguno genera un artefacto personal desde la composición y forma del municipio. | **Pasa, con condición de presentarlo como huella histórica y no como recomendación agraria.** |
| 2 | **Pulso de atención digital pública**: [páginas](https://analisis.datosabiertos.jcyl.es/explore/dataset/estadisticas-web-paginas/information/) + [visitas](https://analisis.datosabiertos.jcyl.es/explore/dataset/estadisticas-web-visitas/information/) | 492.153 filas de páginas (2020-06-23 a 2026-08-01) y 179.823 de visitas (2019-01-01 a 2026-08-01), actualización diaria, CC BY 4.0. Puede alimentar una pieza diaria cambiante sin perfilar personas. | Solo aparecen páginas con más de 100 vistas/día. La vista comodín `www.*.jcyl.es` se solapa con sitios concretos; sumar todo duplica tráfico. Campos de nuevos usuarios y salidas dejan de informarse tras 2023-07-10. | No se encontró candidatura histórica equivalente. | **Pasa como reserva**, usando series por sitio y sin afirmar que “esto interesa a Castilla y León”. |
| 3 | **Ritmo cultural de museos**: [visitantes mensuales](https://analisis.datosabiertos.jcyl.es/explore/dataset/visitantes-museos-mensuales/information/) | 2.918 filas mensuales, enero de 2012 a junio de 2026, 0 nulos, 0 negativos y 0 duplicados en la clave museo-mes. Actualización mensual, CC BY 4.0. | No contiene imágenes ni colecciones. Hay 75 ceros que incluyen cierres reales y un cambio de nombre del anexo de San Marcos que parte una única serie en dos etiquetas. | Existen localizadores de museos y varias aplicaciones culturales, pero no una experiencia generativa basada en su pulso temporal. | **Pasa como capa secundaria o segunda reserva**; por sí sola aún tiene utilidad débil. |
| 4 | **Agenda cultural como materia prima viva**: [eventos culturales](https://analisis.datosabiertos.jcyl.es/explore/dataset/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/information/) | 473 ocurrencias en la captura; 458 identificadores de evento; actualización cada cuatro horas. 468 registros enlazan imagen y todos contienen título, descripción, categoría, fecha, lugar y enlace. CC BY 4.0 a nivel de conjunto. | Un identificador puede tener varias fechas: la clave correcta es evento + fecha. Cuatro registros tienen latitud/longitud intercambiadas. `fecha_fin` solo aparece en 26/473 y `hora_fin` en 34/473. No debe suponerse que la licencia del conjunto cubre cada cartel enlazado. | Colisión muy alta: ACCYLE, Eventualcyl, CYLAC, Eventos CyL, bot de agenda, Eventia, Gurú y otras aplicaciones culturales. | **No pasa como agenda, recomendador o calendario.** Solo podría usarse como señal efímera dentro de otro mecanismo ya distinto. |
| 5 | **Retrato generacional histórico**: población por edad/sexo, población provincial y nacimientos | Población por edad: 2.632 filas, 1996–2019. Población provincial: 594 filas, 1986–2019, 18 filas por año. Nacimientos: 378 filas, 1980–2021, nueve provincias por año. CC BY 4.0. Permite personalizar un recuerdo por año y provincia sin pedir datos sensibles. | Falta 1997 en las series de población; los valores de edad están almacenados como texto. No hay actualidad posterior a 2019/2021. Matrimonios y defunciones se descartan por obsolescencia, sesgo y sensibilidad. | Evolución de población, análisis poblacional y “Conoce Castilla y León” ya cubrieron mapa, gráfica y relato general. | **Solo pasa para una cápsula histórica explícita**, nunca como retrato actual ni como simple visualización demográfica. |
| 6 | **Corpus narrativo de monumentos**: [relación de monumentos](https://analisis.datosabiertos.jcyl.es/explore/dataset/relacion-monumentos/information/) | 1.378 filas; 1.368 descripciones, mediana de 461 caracteres; periodo, tipo y coordenadas completos en gran medida. CC BY 4.0. | No incluye imágenes, adjuntos ni URL del objeto. Hay cuatro identificadores duplicados. El dato se procesó en abril de 2024 pese a que la ficha afirma actualización diaria; el cambio de 2026 es de metadatos. | Colisión extrema: buscadores de monumentos, CYLTUR, reconocimiento por foto, GuiameValladolid, Casual Learn, Otto Wunderlich y otros. | **Descartar como núcleo.** Es buen texto auxiliar, no una oportunidad ganadora nueva. |
| 7 | **Fondos documentales de archivo**: [fichas ISAD](https://analisis.datosabiertos.jcyl.es/explore/dataset/fondos-documentales-fichas-isad/information/) | 1.254 fichas con título, fecha, institución, productor, volumen, acceso y enlace. 1.254 enlaces de contenido únicos y bastante texto narrativo. | **No declara licencia.** Solo dos fichas enlazan documentos; no hay corpus de imágenes/objetos digitalizados. `identificador` no es clave de registro (solo 28 valores); debe usarse el enlace único. | No se encontró una aplicación histórica centrada exactamente en fondos de archivo, por lo que la originalidad sería alta. | **Bloqueada jurídicamente** hasta que JCyL declare licencia y disponibilidad de objetos digitales reutilizables. |
| 8 | **Constelación de bibliotecas y bibliobuses**: [red geolocalizada](https://analisis.datosabiertos.jcyl.es/explore/dataset/bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados/information/) + [estadísticas](https://analisis.datosabiertos.jcyl.es/explore/dataset/datos-estadisticos-bibliotecas/information/) | Red actual: 1.126 registros, 733 puntos móviles, 362 bibliotecas y 31 bibliobuses; identificadores y coordenadas completos. CC BY 4.0. | La red no incluye horarios de paso ni obras. Las estadísticas son solo 46 filas de 2019 y muchas columnas solo se informan para uno de los cinco tipos, por lo que no permiten una experiencia longitudinal fiable. | `Cultura CyL` y `BibliobusCyL` son colisiones directas; también existen mapas de edificios culturales. | **Descartar como núcleo.** Volvería a ser directorio/mapa y ya está presentado. |

## Evidencia detallada y riesgos analíticos

### 1. La matriz territorio–forma es la única base estructuralmente completa

El conjunto de superficies municipales contiene los años 2010–2022. Los tres últimos años tienen exactamente 29.224 filas cada uno. Para 2022:

- 2.248 municipios;
- 13 códigos de uso por municipio;
- 29.224 combinaciones municipio–uso;
- cuatro valores nulos de superficie de secano, **0,014 %** de las filas;
- ningún valor negativo;
- 8.846.194 ha de secano y 564.899 ha de regadío al sumar las categorías publicadas.

La tabla de límites contiene 2.248 municipios, sin duplicados en provincia + código municipal y sin nulos en municipio, código INE, población o geometría. Tras normalizar acentos y ceros a la izquierda, el cruce con cultivos de 2022 devuelve **2.248 de 2.248 municipios**.

Esto permite una regla reproducible como:

`13 proporciones de uso + contorno municipal + año elegido → patrón/forma/color/sonido descargable`

El resultado deja de existir si se retira el dato, por lo que el uso es central. Para evitar convertirse en otro mapa agrícola, la interfaz no debe localizar, comparar rendimiento ni decir qué cultivar. Debe producir un objeto propio y trazable —por ejemplo SVG o animación— con la leyenda exacta de las 13 proporciones y la atribución de fuente.

Riesgos a corregir:

- presentar 2022 como último año disponible, no como situación actual;
- usar `codigo_producto`, no la etiqueta, porque parte del histórico contiene mojibake como `LEÃ‘OSOS`;
- antes de 2020 faltan filas de categorías con valor cero; no convertir ausencia en cero sin validar la regla;
- fijar tests de 2.248 municipios, 13 categorías en 2020–2022, unicidad municipio–año–código y no negatividad.

### 2. El tráfico web ofrece actualidad, pero no representa a la población

El dato es grande, frecuente y anónimo, pero presenta solapamiento estructural. El 1 de agosto de 2026 había 200 filas de páginas y solo 123 URL distintas. Setenta y siete URL aparecían tanto bajo una vista concreta como bajo `www.*.jcyl.es`. La suma bruta era 74.364 vistas; una deduplicación conservadora por máximo daba 46.291, una diferencia de 28.073.

Además, la propia ficha solo publica páginas con más de 100 vistas diarias. Por tanto:

- se puede crear un pulso de **actividad observada en webs JCyL**;
- no se puede afirmar que sea “lo que preocupa/interesa a los castellanos y leoneses”;
- no se deben sumar vistas comodín y específicas;
- `usuarios_nuevos`, `porcentaje_salidas` y `porcentaje_nuevas_sesiones` están nulos en 86.184 filas y su última fecha informada es 10 de julio de 2023, probablemente por un cambio de analítica.

El uso más seguro es escoger una vista individual o representar el cambio relativo dentro de cada sitio. El uso más peligroso sería elaborar rankings sociales o inferir necesidades ciudadanas.

### 3. Museos es una serie limpia, pero carece de contenido cultural reutilizable

Las 18 etiquetas cubren hasta 17 instalaciones efectivas en el último mes; dos etiquetas corresponden al mismo anexo de San Marcos antes y después de 2015. La clave museo–mes es única y no hay valores nulos ni negativos. Los ceros no deben imputarse automáticamente: varios corresponden a cierres, obras o la pandemia, hechos mencionados en la ficha.

La familia funciona bien para ritmo, estacionalidad, comparación con el mismo mes o una pieza audiovisual. No sirve para remezclar colecciones porque no ofrece obras, miniaturas ni derechos de imagen.

### 4. La agenda tiene imágenes, pero no concede automáticamente derecho de remezcla

El 98,9 % de las ocurrencias enlaza una imagen alojada en `datosabiertos.jcyl.es`. La ficha del conjunto declara CC BY 4.0 ES, pero no aparece una licencia por fichero ni autoría del cartel. Para una aplicación de bajo riesgo jurídico, hasta recibir confirmación expresa se puede:

- mostrar el enlace original o usar gráficos propios derivados de categoría/fecha;
- no recortar, entrenar, transformar ni redistribuir esos carteles como materia creativa;
- corregir las cuatro coordenadas invertidas con una validación territorial;
- tratar las repeticiones de ID como sesiones distintas, no como duplicados erróneos.

La saturación histórica hace que incluso una implementación técnicamente buena puntúe mal en originalidad si su acción principal sigue siendo descubrir eventos.

### 5. El patrimonio textual no equivale a un archivo creativo

La relación de monumentos contiene texto descriptivo útil, pero ningún campo de imagen o enlace de contenido. El Catálogo Colectivo del Patrimonio Bibliográfico tampoco resuelve el problema: son solo 169 filas con año, provincia, localidad e institución; no son fichas de libros ni objetos digitalizados. Las fichas ISAD sí son ricas, pero carecen de licencia y solo dos enlazan documentos.

Conclusión: cualquier “Rijksstudio castellano y leonés” necesitaría hoy una fuente externa de objetos con licencia clara. Si las imágenes externas cargan el valor creativo y JCyL solo aporta una etiqueta o ubicación, existe riesgo de que el dato autonómico sea decorativo para el concurso.

## Escasez de medios reutilizables en el catálogo

La revisión de los 430 esquemas devuelve:

- 392 conjuntos con CC BY 4.0 ES;
- 35 sin licencia declarada;
- 2 con `LICENCIA-IGCYL-NC`;
- 1 con Creative Commons Attribution 3.0;
- solo 6 conjuntos con campos explícitos de imagen/fotografía: alojamientos juveniles, presas/balsas, agenda cultural, cooperación al desarrollo, altos cargos y formación ECYL.

De esos seis, solo la agenda pertenece al ámbito cultural general buscado. Esta escasez es una limitación material, no un problema que se resuelva añadiendo IA.

## Colisiones históricas relevantes

El corpus local se comprobó en `tmp/extracted/workbooks/*.tsv`. Los choques más importantes son:

- **cultivos**: “Análisis de cultivos”, “Agromapa”, “Ubicación óptima del cultivo” y “Los cultivos de Castilla y León”; debe evitarse mapa, análisis y recomendación;
- **agenda/cultura**: ACCYLE, Eventualcyl, CYLAC, Eventos de Castilla y León, Agenda Cultural Bot, Castilla y León Gurú, Eventia CyL y la app general de cultura y entretenimiento;
- **monumentos/patrimonio**: Museos de Castilla y León, Monumentos de Castilla y León, Castilla y León MONUMENTAL, CYLTUR, Casual Learn, reconocimiento de monumentos por foto, GuiameValladolid, CHEST y Otto Wunderlich;
- **bibliotecas**: Cultura CyL y BibliobusCyL;
- **población**: evolución de la población, análisis de población y relato general de Castilla y León;
- **toponimia/juego**: nombres geográficos y transmisión oral, Conoce tus topónimos, Con la toponimia sí se juega y varios triviales de datos abiertos.

No se encontró una candidatura anterior basada en el tráfico agregado de las webs JCyL ni una que convierta las 13 proporciones de uso y el contorno municipal en un artefacto generativo descargable. Esa ausencia no prueba originalidad absoluta, pero sí reduce la colisión interna del concurso.

## Qué merece un prototipo de descarte rápido

### A. Huella municipal generativa — prioridad 1

Prueba mínima: elegir un municipio y un año 2020–2022; generar un SVG cuyo contorno sea la geometría real y cuya trama, densidad y paleta dependan matemáticamente de las 13 superficies. Debe incluir un “pasaporte del dato” con porcentajes, año, enlaces y atribución.

Preguntas que el prototipo debe resolver antes de convertirlo en proyecto:

- ¿el resultado es suficientemente distinto entre municipios para que una persona quiera guardarlo o compartirlo?;
- ¿la experiencia ofrece algo más valioso que un póster decorativo —por ejemplo, comparar dos años como díptico o crear una pieza familiar de varios municipios—?;
- ¿la transformación se entiende sin parecer un mapa o una clase de geografía?;
- ¿hay una vía económica razonable —impresión, licencias de plantillas, uso por creadores— sin depender de una red previa?

### B. Pulso digital JCyL — prioridad 2

Prueba mínima: una composición diaria que cambia con cinco webs seleccionadas, sin ranking social y sin sumar vistas solapadas. Debe explicar la cobertura de más de 100 vistas y permitir abrir la página fuente.

Pregunta decisiva: ¿produce una acción o artefacto que la ciudadanía quiera usar, o se queda en una visualización artística del tráfico institucional?

### C. Ritmo de museos — prioridad 3

Prueba mínima: convertir una serie mensual elegida en sonido/movimiento y permitir superponer el mismo mes de varios años. Debe normalizar el cambio de nombre de San Marcos y anotar cierres.

Pregunta decisiva: ¿puede integrarse como capa cultural de A o B sin convertir la aplicación en turismo o didáctica?

## Decisión final de esta auditoría

No hay ocho rutas firmes. Hay **una base de datos claramente defendible**, dos reservas y cinco familias que deben descartarse o quedar bloqueadas. El hallazgo más útil es negativo: una aplicación de remezcla patrimonial visual no es hoy viable con datos JCyL centrales y jurídicamente claros.

La dirección que merece el siguiente esfuerzo es una aplicación donde:

`municipio + año + 13 usos reales + geometría → artefacto ciudadano único, descargable y atribuible`

No recomienda, no puntúa riesgos, no tramita, no necesita datos personales, no depende de colaboradores y no repite los mapas agrícolas ya presentados. Su debilidad no es legal ni técnica, sino de producto: todavía hay que demostrar que el artefacto resuelve una necesidad suficientemente importante para ganar.

