# Auditoría de oportunidades ciudadanas masivas en los 430 conjuntos JCyL

**Fecha de corte:** 2 de agosto de 2026 (Europe/Madrid)  
**Catálogo auditado:** `tmp/extracted/catalog_all.tsv`, contrastado con el catálogo y las APIs oficiales que están en producción.  
**Objeto:** encontrar materias primas capaces de cambiar una decisión o una acción de una persona, no de producir otro mapa, directorio, buscador, calendario, panel o chatbot.

## Veredicto ejecutivo

Sí hay datos para productos ciudadanos amplios, pero no donde sugieren los títulos del catálogo. Los activos más fértiles son la siniestralidad laboral mensual, el comercio y los servicios de proximidad, los controles de seguridad alimentaria, las altas hospitalarias de fractura de cadera y los resultados electorales a nivel de mesa. Permiten, respectivamente, **calcular una tarjeta preventiva antes del turno**, **simular una interrupción de suministros esenciales**, **convertir una etiqueta de alimento en tres comprobaciones concretas**, **priorizar medidas de prevención de caídas** y **simular el efecto marginal de participación y reparto de escaños**.

El catálogo oficial en vivo devuelve exactamente **430 conjuntos**. El TSV también contiene 430 registros lógicos; el conjunto `casos-de-arbitraje-de-consumo` está partido en tres líneas físicas, de modo que una lectura TSV ingenua produce 432 líneas y 429 filas bien formadas. La cuenta oficial se verificó contra la [API de catálogo JCyL](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets?limit=1).

La conclusión importante no es «hay 430 ideas». Gran parte del catálogo son directorios, registros, datos para gestión administrativa, series COVID, materias expresamente excluidas o agregados sin acción ciudadana. Después de aplicar los filtros, quedan **18 bloques de capacidad accionable**; solo cinco justifican hoy una prueba de producto de alcance masivo.

### Los cinco bloques más fértiles

| Puesto | Capacidad | Salida y acción ciudadana | Por qué el dato JCyL es material | Límite que puede matarla |
|---|---|---|---|---|
| 1 | Riesgo preventivo antes del turno | Tarjeta visual con nivel absoluto/relativo y tres comprobaciones de seguridad para el turno que empieza | JCyL aporta 198.696 celdas mensuales por actividad, provincia y gravedad hasta junio de 2026; cambia la intensidad, el mes y la prioridad | No contiene causa ni exposición; necesita afiliados de Seguridad Social como denominador y causas INSST. No debe llamarse probabilidad personal de accidente |
| 2 | Continuidad de suministros esenciales | Simulación «si el municipio pierde durante 48 h uno o dos puntos de venta» y cesta mínima, no una lista de comercios | Los registros JCyL vigentes aportan sector, CNAE, municipio, población, estado y fecha de revisión; cambian qué categorías tienen punto único | No hay stock, horario ni apertura real. Solo puede estimar redundancia estructural, nunca prometer disponibilidad |
| 3 | Decisión de seguridad alimentaria | Escaneo de etiqueta/entrada manual que genera tres verificaciones o una acción de devolución/consulta | Los controles JCyL cambian la prioridad por sector y tipo de incumplimiento; las EDO cambian el contexto regional | Los controles son dirigidos y llegan a 2024: una tasa de no conformidad no es riesgo de una marca ni prevalencia de mercado |
| 4 | Microplan de prevención de caídas | Tres cambios concretos esta semana y un disparador meteorológico de precaución | Las 26.460 altas por fractura de cadera, con fecha, edad, sexo y territorio, cambian la estacionalidad y el grupo al que se intensifica el consejo | Ingreso no equivale a caída ocurrida en ese lugar o día; no debe producir un diagnóstico ni un score clínico sin validación |
| 5 | Contrafactual electoral verificable | Simulador de participación, umbral y escaños con supuestos visibles; acción: votar o movilizar participación | 580.751 registros a nivel de mesa, 1983-2026, permiten reconstruir cada escenario real | Uso episódico, neutralidad estricta y riesgo de inducir voto táctico; no debe recomendar partido ni predecir resultado |

El 112 **no es el núcleo de un producto probabilístico**. Su conjunto tiene 2.423 historias de 2022-2025, mientras el propio 112 informa de **952.222 llamadas solo en 2025**. Es una selección editorial de incidentes publicables, no el universo de llamadas. Sí es muy valioso como corpus para extraer los datos que suelen desbloquear la coordinación y para generar una tarjeta familiar offline; no permite estimar incidencia, probabilidad, tiempo de respuesta, eficacia de un recurso ni riesgo relativo entre municipios. La cifra de llamadas procede del [portal oficial 112 JCyL](https://www.112.jcyl.es/web/es/emergencias-castilla-leon.html) y los campos del [API del conjunto de emergencias](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/emergencias-solo-ultimo-ano-historico).

## Método de auditoría

Se revisaron título, descripción y enlace de los 430 registros. Para los candidatos se consultó el esquema del API Opendatasoft v2.1, el número de registros, muestras de valores y la fecha máxima del dato. No se tomó `modified` o `data_processed` como frescura: varios conjuntos fueron reprocesados en julio de 2026 aunque sus observaciones terminan años antes.

Cada capacidad tuvo que pasar cinco puertas:

1. Una persona puede realizar una acción concreta después de ver la salida.
2. Al menos un dato JCyL cambia materialmente esa salida; no basta con una cifra decorativa o una mención regional.
3. Los campos permiten calcular el resultado sin inventar una variable ausente.
4. La forma de producto no es mapa, directorio, panel, chatbot, buscador, calendario ni verificador de registro.
5. No invade ninguna materia o concepto expresamente excluido.

Las combinaciones externas propuestas son solo fuentes públicas oficiales. Se priorizaron APIs o descargas automatizables: [API JSON del INE](https://ine.es/dyngs/DAB/index.htm?cid=1100), [AEMET OpenData](https://opendata.aemet.es/dist/), [PXWeb de afiliación de la Seguridad Social](https://w6.seg-social.es/PXWeb/pxweb/es/Afiliados%20en%20alta%20laboral/), [CIMA REST de AEMPS](https://cima.aemps.es/cima/resources/docs/CIMA_REST_API.pdf), [RASFF Open Data API](https://webgate.ec.europa.eu/imsoc-guide/rasff-window-help/en/public-portal/homepage.html) y los servicios WMS/descargas del [MITECO](https://www.miteco.gob.es/es/cartografia-y-sig/ide/directorio_datos_servicios/agua.html). SINAC y RASVE son fuentes oficiales actuales, pero su interfaz pública no ofrece una API estable documentada; ese coste operativo se trata como límite.

## Qué contiene realmente la materia prima útil

| Familia JCyL | Campos y granularidad comprobados | Cobertura real en registros | API y dictamen |
|---|---|---|---|
| [Siniestralidad laboral](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/estadisticas-de-siniestralidad-laboral) | CNAE/actividad, sector, provincia, mes/año; accidentes en jornada e `in itinere`, leves, graves y mortales | 198.696 filas, enero 2004-junio 2026; mensual | Excelente para numerador y tendencia; requiere denominador externo y causas detalladas |
| [Resultados electorales](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/resultados-electorales-1983-actualidad) | año, código de mesa, provincia, municipio, distrito, sección, censo, avances, votantes, nulos, blancos, partido y votos | 580.751 filas, 1983-2026 | Excelente para simulación y validación exacta de escenarios históricos |
| [Establecimientos comerciales](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/establecimientos-comerciales), [servicios de proximidad](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/servicios-proximidad) y [establecimientos farmacéuticos](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/registro-de-establecimientos-farmaceuticos-de-castilla-y-leon) | sector/CNAE, municipio, población, estado, revisión; farmacia por municipio | 24.415 + 4.208 + 1.590 registros; comercio revisado hasta 30-06-2026 | Bueno para conteos y redundancia agregada. No exponer nombres ni presentarlo como directorio |
| [Emergencias publicadas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/emergencias-solo-ultimo-ano-historico) | título y narrativa HTML, fecha, localidad/coordenada, tipo genérico, medios movilizados | 2.423 historias, 31-12-2022 a 31-12-2025 | Corpus NLP útil, muestra editorial radicalmente sesgada; no sirve para tasas |
| [Fractura de cadera](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/altas-hospitalarias-fractura-cadera), [IAM](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/altas-hospitalarias-infarto-miocardio), [ictus](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/altas-hospitalarias-ictus), [insuficiencia cardiaca](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/altas-hospitalarias-con-diagnostico-de-insuficiencia-cardiaca) y [EPOC](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/altas-hospitalarias-con-diagnostico-de-epoc) | fecha/hora de ingreso y alta, día, ZBS, procedencia, hospital, área, provincia, edad y sexo; cada fila declara representar un ingreso | 26.460 + 20.908 + 5.362 + 50.073 + 6.320; máximos en diciembre de 2025 | Alto valor analítico, pero cuasi-identificadores sensibles; servir solo agregados y aplicar umbral mínimo de celda |
| [Actividad de medicina familiar](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/actividad-medicina-familia-consultorio) y [enfermería](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/actividad-enfermeria-consultorio) | día, consultorio, ZBS, área, provincia y consultas presenciales/no presenciales/domicilio | 1.901.992 + 1.792.496, enero 2020-junio 2026; actualización mensual | Describe volumen y canal, no resolución, demora ni calidad. Solo complemento contextual |
| [Consumo farmacéutico por receta](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/consumo-de-productos-farmaceuticos-por-receta) | mes, provincia, área, edad, sexo, envases e importe PVP-IVA | 115.118 celdas, enero 2022-enero 2026 | Utilizable para presión agregada. Sin ATC, principio activo, receta individual ni copago |
| [EDO por provincia](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/enfermedades-de-declaracion-obligatoria-casos-y-tasas-por-provincia) y [por edad](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/enfermedades-de-declaracion-obligatoria-casos-por-grupo-de-edad) | año, enfermedad, provincia, casos y tasa; en la otra tabla, grupo de edad y casos | 10.645 + 16.992, 2008-2024; anual | Buen prior histórico, no señal de brote actual; provincia y edad no están juntas |
| [Control alimentario sector/fase](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/control-oficial-de-productos-alimenticios-sectorfase), [residuos por provincia](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/control-oficial-de-productos-alimenticios-provincias) y [laboratorios](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/actividad-analitica-de-los-laboratorios-de-control-oficial) | establecimientos, controles, muestras, no conformidades, incumplimientos, sanciones; muestras/determinaciones por provincia | 280 + 126 hasta 2024; 153 hasta 2025 | Útil con suavizado y cobertura. El muestreo es dirigido y no estima prevalencia de mercado |
| [Calidad del agua de consumo](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/calidad-de-las-aguas-de-consumo-humano) | provincia/año; redes, análisis, aptitud/no aptitud y conteos de determinaciones para metales, nitrato, radiactividad y otros | 162 filas, 2008-2025; anual | Muy ancho pero solo provincial y con conteos, no concentraciones ni red concreta |
| [Cultivos municipales](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/superficies-de-cultivos-municipales), explotaciones [bovinas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/explotaciones-ganaderas-de-bovino), [porcinas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/explotaciones-ganaderas-de-porcino), [avícolas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/explotaciones-ganaderas-de-avicola) y [ovino-caprinas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/explotaciones-ganaderas-de-ovino-caprino) | municipio/cultivo/superficie secano-regadío; municipio y censos parciales por especie | cultivos 2010-2022; ganadería hasta 2024; algunas fichas se reprocesan en 2026 sin datos nuevos | Solo exposición estructural; demasiado atrasado para predicción viva de cosecha o brote |
| [Ejecución de gastos](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/ejecucion-del-presupuesto-de-la-administracion-de-la-comunidad-gastos) | año, sección, servicio, programa/subprograma, clasificación económica, crédito y autorizado/comprometido/obligado | 41.508 filas, 2018-2026; mensual | Permite contrafactual financiero, no estimar por sí solo efectos sociales |

## Fallos de calidad que invalidan ideas aparentes

1. Los conjuntos `prevalencia-de-diabetes-tipo-2-2025`, `prevalencia-de-hta-2025`, `prevalencia-de-dislipemia-2025`, `prevalencia-de-epoc-2025` e `prevalencia-de-insuficiencia-cardiaca-2025` **no tienen campo de número de pacientes ni tasa**. El esquema solo contiene periodo, provincia, área, edad y sexo; en la consulta agrupada hay una fila por combinación. No se puede calcular prevalencia. Véase el [esquema oficial de HTA](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/prevalencia-de-hta-2025).
2. `poblacion-de-referencia-2026` tampoco contiene población: solo periodo y categorías territoriales/demográficas. Sus 49.959 filas son combinaciones de ZBS, edad y sexo, no 2,4 millones de personas. No es denominador. [Esquema oficial](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/poblacion-de-referencia-2026).
3. En `tratamientos_antibioticos_por_receta_2024_2025`, las **54.947 filas valen 1** en `n_de_tratamientos_de_antibioticos_por_paciente`; es la matriz de celdas mes-área-edad-sexo, no una medida de consumo. El conjunto 2026 repite el problema. No se puede detectar sobreuso ni tendencia. [Esquema oficial](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/tratamientos_antibioticos_por_receta_2024_2025).
4. El supuesto IPC mensual JCyL termina en diciembre de 2021 y el comercio minorista en diciembre de 2023, pese a reprocesarse en julio de 2026. No son motores de inflación actual. [IPC](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/indice-de-precios-de-consumo) e [índices minoristas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/indices-de-comercio-al-por-menor).
5. La fecha de proceso no demuestra frescura. Cultivos municipales llega a 2022; registros ganaderos, en general, a 2024; núcleos zoológicos a 2023. Toda salida debe mostrar `fecha máxima observada`, no «actualizado» del metadato.

## Dieciocho bloques de capacidad que sí terminan en acción

### 1. Calcular riesgo preventivo antes de un turno

Normalizar accidentes por afiliados de la Seguridad Social en la misma provincia, mes y CNAE; aplicar un modelo beta-binomial para no sobrerreaccionar a celdas pequeñas y separar frecuencia de severidad. El usuario indica actividad, provincia y tipo de turno; recibe una tarjeta de tres comprobaciones procedentes de las causas nacionales de [MITES/INSST](https://www.mites.gob.es/es/estadisticas/condiciones_trabajo_relac_laborales/EAT/welcome.htm). **Acción:** revisar equipo, procedimiento o pausa antes de empezar. JCyL cambia intensidad y prioridad; Seguridad Social aporta el denominador mediante su [PXWeb/CSV por provincia y actividad](https://datos.gob.es/es/catalogo/e05072501-afiliados-ss-al-ultimo-dia-del-mes-por-prov-seccion-actividad-cnae-25-y-regimen). No incluir transporte ni riesgo `in itinere` en el producto por la exclusión temática.

### 2. Simular continuidad de suministros esenciales

Agregar comercio, servicios de proximidad y farmacias por municipio y categoría, sin mostrar empresas. Simular cierre de uno o dos nodos durante 24/48 horas, ponderado por habitantes y avisos oficiales AEMET/RAN. **Acción:** preparar solo los alimentos, higiene o medicación imprescindibles para el escenario y acordar un apoyo vecinal. JCyL decide qué categoría tiene cero, uno o varios puntos; [AEMET OpenData](https://opendata.aemet.es/centrodedescargas/info) y la [Red de Alerta Nacional](https://www.proteccioncivil.es/coordinacion/redes/ran) activan el escenario. No afirmar stock ni recomendar acaparamiento.

### 3. Escanear una compra alimentaria y priorizar tres comprobaciones

OCR/código de barras o entrada manual clasifica el producto; controles JCyL aportan una tasa suavizada de no conformidad e incertidumbre por sector/fase, y las alertas actuales proceden de [AESAN](https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/controlOficial.htm) y [RASFF Open Data API](https://webgate.ec.europa.eu/imsoc-guide/rasff-window-help/en/public-portal/homepage.html). **Acción:** comprobar lote/retirada, frío, alérgeno o cocción; devolver o no consumir solo si existe alerta oficial aplicable. El dato JCyL cambia qué controles se ponen arriba, no declara insegura una marca. Es un cálculo con incertidumbre, no un buscador de registros.

### 4. Generar un plan doméstico contra infecciones alimentarias

Combinar las tasas provinciales de campilobacteriosis, salmonelosis, yersiniosis y otras EDO con la edad/vulnerabilidad aportada por el hogar y con no conformidades de carne, leche, especias o cereales. Comparar contra RENAVE 2024 del [ISCIII](https://cne.isciii.es/servicios/enfermedades-transmisibles/informes). **Acción:** elegir las dos prácticas de conservación/cocinado más relevantes para ese hogar durante la compra y preparación. Nunca inferir que los casos proceden de los sectores muestreados ni que un incremento fue causado por una no conformidad.

### 5. Generar un microplan de prevención de caídas

Calcular tasas de ingreso por edad, sexo, provincia y estación usando altas de fractura de cadera y denominadores INE; comprobar asociación meteorológica fuera de muestra con AEMET. Las acciones se seleccionan exclusivamente del [consenso y materiales 2026 del Ministerio de Sanidad](https://www.sanidad.gob.es/areas/promocionPrevencion/envejecimientoSaludable/fragilidadCaidas/home.htm). **Acción:** ejecutar esta semana tres cambios concretos de iluminación, obstáculos, calzado, ejercicio o revisión profesional. JCyL decide cuándo y a quién intensificar; no sustituye evaluación de fragilidad.

### 6. Calcular una ventana segura de continuidad de medicación

El usuario aporta código nacional y días restantes. CIMA REST informa del problema de suministro e impacto; JCyL aporta presión agregada de envases por grupo edad-sexo-área y redundancia de farmacias. **Acción:** consultar farmacia o prescriptor con antelación proporcional al impacto, sin alterar dosis ni comprar de más. La [API oficial de problemas de suministro](https://www.aemps.gob.es/informa/notasInformativas/medicamentosUsoHumano/problemasSuministro/2019/docs/CIMA-problemas-suministro.pdf) es automatizable. Límite: JCyL no ofrece consumo por principio activo ni stock local, por lo que el ajuste regional debe ser conservador y nunca afirmar escasez local.

### 7. Detectar prioridad para una revisión de medicación

Calcular envases mensuales per cápita por provincia, edad y sexo con INE, suavizar áreas pequeñas y combinar con utilización de atención primaria. **Acción:** si el perfil y la lista introducida superan umbrales clínicos oficiales, pedir una revisión estructurada y llevar una lista única de medicamentos. JCyL cambia la intensidad contextual; la decisión clínica sigue siendo profesional. No usar PVP como gasto personal ni inferir polifarmacia individual a partir del agregado.

### 8. Generar una tarjeta offline para llamar al 112

Aplicar extracción de entidades a las narrativas para identificar qué hechos cambian los recursos movilizados: ubicación exacta y acceso, número/edad aproximada de personas, atrapamiento, fuego/humo/gas, consciencia y riesgos presentes. El hogar completa sus datos y obtiene una tarjeta offline, no un asistente conversacional. **Acción:** guardarla y practicar una llamada de ejemplo. Los campos se validan con el flujo de [organismos integrados del 112 JCyL](https://112.jcyl.es/web/es/organismos-integrados.html) y el [Plan Familiar de Emergencias](https://ficheros.proteccioncivil.es/unidadesFormativas/Plan_Familiar_Emergencias_Creacion_propia_UnidadPsicologiaDGPCYE.pdf). El corpus solo enseña vocabulario y secuencia; no mide eficacia.

### 9. Detectar patrones domésticos prevenibles en narrativas de emergencia

Clasificar de forma auditable incendio de cocina, intoxicación, caída, atrapamiento, agresión y otros incidentes; cruzar únicamente con composición del hogar aportada por el usuario y recomendaciones oficiales. **Acción:** corregir los tres riesgos aplicables y registrar fecha de verificación. La JCyL aporta ejemplos regionales que cambian el checklist. Debe presentarse como «patrones observados en noticias del 112», nunca como ranking de riesgos locales, porque la muestra es editorial.

### 10. Generar el panel de análisis para un pozo privado

La localización se cruza con intensidad estructural de cultivo/ganado JCyL, zonas vulnerables a nitratos MITECO, lluvia reciente AEMET y actividad analítica/no aptitud provincial JCyL. **Acción:** encargar al laboratorio un panel priorizado de microbiología, nitrato y, cuando proceda, arsénico/radiactividad, y repetirlo tras el disparador indicado. Las [zonas vulnerables MITECO 2025](https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/agua/zonas-vulnerables.html) están descargables. El resultado es prioridad de ensayo, nunca «agua segura»; cultivos y ganado están atrasados.

### 11. Calcular confianza en la evidencia del agua de red

Combinar el último boletín de la red concreta en [SINAC](https://sinac.sanidad.gob.es/CiudadanoWeb/ciudadano/ayuda.do) con la intensidad provincial de análisis, no aptitudes y cobertura de parámetros JCyL. **Acción:** descargar el boletín, solicitar al operador un parámetro atrasado o seguir una declaración oficial de no aptitud. JCyL cambia el nivel de confianza por cobertura de vigilancia; SINAC decide la aptitud concreta. No convertirlo en verificador binario ni extrapolar la provincia a la red.

### 12. Activar precauciones respiratorias antes de un episodio frío/infeccioso

Modelar ingresos EPOC por edad, sexo, provincia y fecha contra temperaturas AEMET y vigilancia respiratoria oficial; solo desplegar el disparador si supera validación temporal y provincial. **Acción:** revisar con antelación el plan prescrito, medicación disponible y señales de alarma oficiales. JCyL cambia el umbral regional. Se excluyen aire y polen por la restricción expresa; no pronostica una exacerbación individual.

### 13. Activar una tarjeta cardiovascular de precaución meteorológica

Usar IAM, ictus e insuficiencia cardiaca como resultados separados, con denominadores INE, control de estacionalidad y AEMET. **Acción:** ejecutar medidas oficiales previamente acordadas y no demorar atención ante señales de alarma. JCyL decide si existe evidencia regional para intensificar la tarjeta. No unir diagnósticos en un score clínico, no atribuir causalidad al tiempo sin diseño cuasi-experimental y no reducir nunca el consejo nacional.

### 14. Priorizar una prueba de salud sexual sin reducir recomendaciones nacionales

Las EDO JCyL aportan tendencia y tasa provincial de sífilis, gonococia, clamidia y VIH; edad y provincia están en tablas separadas, por lo que solo puede estimarse un prior ecológico. **Acción:** ante exposición personal que ya cumple criterios oficiales, adelantar o programar una prueba y conversación profesional. JCyL puede elevar la prioridad, jamás dar «bajo riesgo» ni sustituir historia sexual. RENAVE/ISCIII aporta comparación oficial; los datos regionales terminan en 2024.

### 15. Generar bioseguridad doméstica para mascotas o aves de autoconsumo

Cruzar densidad municipal estructural de explotaciones y núcleos zoológicos con focos actuales de [RASVE](https://servicio.mapa.gob.es/rasve/Publico/Publico/ultimosfocos.aspx?currentpage=1), especie del hogar y recomendaciones oficiales de la enfermedad. **Acción:** separar animales, reforzar higiene o avisar al veterinario cuando el foco oficial y el perfil lo requieran. JCyL cambia exposición estructural; RASVE activa. El registro de núcleos llega a 2023 y los censos a 2024, así que no sirve para probabilidad viva ni para mostrar titulares.

### 16. Generar sustituciones alimentarias equivalentes ante presión de precio

El usuario aporta cesta y restricciones. Precios actuales proceden de INE/MAPA, composición de [microdatos AESAN](https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/alimentosBebidas.htm) y consumo del [panel oficial MAPA](https://www.mapa.gob.es/es/alimentacion/temas/consumo-tendencias/panel-de-consumo-alimentario/base-de-datos-de-consumo-en-hogares/ayuconsum). Producción de leche y superficie de cultivos JCyL ponderan sustitutos con base regional. **Acción:** cambiar dos productos manteniendo objetivos nutricionales y presupuesto. Es una simulación de cesta, no una recomendación de tienda. La producción local no demuestra disponibilidad ni precio; por eso el bloque es experimental y no puede prometer ahorro.

### 17. Simular participación y reparto electoral

Reconstruir cada mesa/provincia, aplicar la normativa electoral vigente y permitir escenarios de participación, blancos/nulos y distribución de voto con todos los supuestos visibles. **Acción:** decidir participar y comprender qué escenarios son matemáticamente posibles. JCyL cambia íntegramente el cálculo; la [Ley Electoral de Castilla y León](https://www.boe.es/eli/es-cl/l/1987/03/30/3/con) aporta las reglas. No recomendar candidatura, no usar perfilado político y no presentar un escenario como predicción.

### 18. Simular un intercambio presupuestario y generar una petición concreta

El usuario mueve una cantidad entre dos programas; el motor calcula porcentaje de ejecución, coste por habitante y qué otra partida debe reducirse para mantener saldo. **Acción:** descargar una tarjeta de propuesta con cifra, fuente y contrapartida para remitirla a un proceso de participación o representante. JCyL determina el presupuesto real. No estimar vidas, empleos o bienestar si no existe evaluación oficial del programa; sin esa evaluación la salida es financiera, no causal.

## Capacidades eliminadas después de intentar formular una acción

| Hipótesis descartada | Motivo de muerte |
|---|---|
| Calculadora de prevalencia o cribado regional | Los conjuntos de prevalencia y población carecen de magnitud; además colisiona con ideas preventivas anteriores |
| Detector de sobreuso de antibióticos | El único valor de tratamiento es 1 en todas las celdas; no hay consumo calculable |
| Recomendador de hora/canal para urgencias | Hay triaje, hora y volumen, pero no espera, resolución ni resultado; podría retrasar atención necesaria |
| Inflación personal JCyL en tiempo real | IPC JCyL termina en 2021 y comercio minorista en 2023; INE actual haría decorativo el dato autonómico |
| Predicción de precio/cosecha | Cultivos termina en 2022 y superficie no es rendimiento, oferta comercial ni precio |
| Predictor municipal de emergencias 112 | El conjunto es selección de noticias; no hay universo, denominador ni resultado |
| Ranking de calidad de consultorios/hospitales | Actividad y ocupación no miden espera, continuidad, seguridad ni resultado |
| Predicción de foco ganadero | Censos estructurales atrasados y RASVE público sin API estable; solo admite un disparador oficial de bioseguridad |
| Derivaciones a ayudas, trámites, reclamaciones, empleo/formación, vivienda, turismo, energía, transporte, aire/polen, caza o directorios | Exclusión expresa del encargo, aunque algunos datos sean técnicamente reutilizables |

## Inferencias que la aplicación no debe hacer

- «En este municipio hay más emergencias» a partir de las historias publicadas por el 112.
- «Este comercio/farmacia tendrá existencias» a partir de un registro administrativo.
- «Este alimento o esta marca es peligroso» a partir de controles dirigidos por sector.
- «Esta persona tiene más riesgo clínico» por vivir en un área con más ingresos o EDO.
- «Este centro es mejor o está menos saturado» por volumen de actividad u ocupación.
- «Habrá escasez o subirá el precio» por superficie cultivada o producción regional.
- «El dato está actualizado» por la fecha de reproceso del portal.
- «Una diferencia temporal es causal» sin denominadores, control de edad, estacionalidad, exposición y validación fuera de muestra.

## Recomendación de inversión

Para un producto de uso verdaderamente masivo, la mejor materia prima no es el 112. La opción con mayor continuidad de uso es **continuidad de suministros esenciales**, porque convierte registros vigentes en una simulación doméstica y no muestra un directorio. La opción con datos estadísticos más sólidos es **riesgo preventivo antes del turno**, con la condición de obtener denominadores de afiliación. La mejor interacción de escaneo es **seguridad alimentaria**, siempre que la salida sea una acción respaldada por alerta oficial o una precaución, no una acusación de riesgo. **Prevención de caídas** ofrece el vínculo acción-evidencia más limpio. **Simulación electoral** tiene el dato más completo y verificable, pero es estacional.

El 112 debe quedar como una capacidad auxiliar: excelente corpus regional para redactar una tarjeta familiar de hechos que comunicar y para ilustrar protocolos, inútil como motor de frecuencia o predicción. Hacerlo central convertiría una muestra editorial en falsa estadística y debilitaría toda la candidatura.

Antes de diseñar interfaz, las tres pruebas de muerte recomendadas son: (1) conseguir y normalizar denominadores Seguridad Social por CNAE/provincia/mes; (2) medir con usuarios si una simulación de redundancia comercial cambia una compra/preparación sin fomentar acopio; y (3) validar con AESAN/Salud Pública que el escaneo alimentario comunica incertidumbre sin convertir inspecciones dirigidas en riesgo de producto.
