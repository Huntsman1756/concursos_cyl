# Aplicaciones ciudadanas sobre temáticas repetidas: mejoras verificables sobre productos oficiales

**Fecha de revisión:** 3 de agosto de 2026  
**Ámbito:** fuentes oficiales o primarias; Castilla y León como territorio de aplicación.  
**Restricción de producto:** aplicación que entrega una decisión o plan concreto. Quedan fuera mapas, paneles, directorios, chatbots y simples visualizadores de datos.

## Veredicto ejecutivo

| Familia | Veredicto | Razón decisiva |
|---|---|---|
| A. Repostaje por ruta con coste real del desvío | **GO CONDICIONAL — prioridad 1** | La búsqueda de estaciones en ruta ya existe, pero no se ha verificado en los productos oficiales un optimizador global que decida parada, litros exactos y coste neto considerando depósito, reserva, consumo y desvío. La dispersión real de precios observada en Castilla y León hace que la mejora sea medible. |
| B. Planificador doméstico de cargas por franjas | **GO CONDICIONAL — prioridad 2** | Puede transformar un precio oficial conocido de antemano en un plan doméstico ejecutable. Queda por detrás de A porque necesita aclarar reutilización de eSIOS y su conexión causal con datos de Castilla y León es débil fuera de climatización. |
| C. Recomendador ciudadano de riego | **NO-GO** | InfoRiego ya calcula cuánto y cuándo regar con ETo, cultivo, estado y sistema de riego. Adaptarlo a jardín o macetas simplifica el público, pero no constituye una mejora radical y añade dependencia de predicción meteorológica externa. |

La conclusión cambió al contrastar precios y rutas reales de Castilla y León: **A pasa a ser la primera opción para una validación técnica acotada; B queda como alternativa y C se archiva**. No es todavía una autorización de desarrollo. A solo sobrevivirá si demuestra que su optimización completa produce una decisión distinta y mejor que Ruta-e y que un simple orden por precio.

---

## A. Optimizador de repostaje por ruta con coste real

### 1. Decisión ciudadana que intentaría resolver

El usuario introduce ruta, vehículo, consumo, combustible, autonomía, litros que desea comprar y, opcionalmente, valor de su tiempo. La aplicación no devuelve un mapa de gasolineras: compara paradas factibles y responde, por ejemplo:

> **Reposta 34 litros en X.** El desvío añade 7 minutos y 4,2 km; el ahorro neto estimado frente a repostar en la estación más cercana es 5,80 €.

El cálculo correcto no debe ordenar por precio por litro. Debe comparar:

`coste neto = compra de combustible + combustible consumido en el desvío + penalización de tiempo + efecto de incidencias`

Esta formulación sí mejora una búsqueda básica por proximidad o precio.

### 2. Datos oficiales españoles disponibles

#### Precios y características de estaciones

- El Ministerio publica el conjunto de alto valor **«Instalaciones de suministro de combustibles a vehículos con venta pública»**, con ubicación, precios, horarios y otros atributos. El catálogo ofrece distribuciones actuales e históricas y declara licencia **CC BY 4.0**: [catálogo oficial en datos.gob.es](https://datos.gob.es/es/catalogo/e05068001-instalaciones-de-suministro-de-combustibles-a-vehiculos-con-venta-publica).
- El servicio REST oficial de estaciones terrestres está operativo en [Servicios REST de Precios de Carburantes](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/). En una consulta realizada el 3 de agosto de 2026 devolvió `Resultado: OK`, una marca temporal `03/08/2026 14:59:00` y 11.519 estaciones. La cifra es una fotografía de esa consulta, no una constante del conjunto.
- El filtro oficial de Castilla y León, [FiltroCCAA/08](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroCCAA/08), devolvió en esa misma comprobación 927 estaciones; el histórico oficial del 2 de agosto devolvió 924. Entre los valores válidos de la instantánea autonómica había 906 precios de gasóleo A —mínimo 1,547 €/l, mediana 1,916 €/l y máximo 2,019 €/l— y 878 de gasolina 95 E5 —mínimo 1,483 €/l, mediana 1,766 €/l y máximo 1,990 €/l—. La amplitud observada confirma que optimizar puede producir un beneficio material; no prueba por sí sola que toda ruta lo tenga.
- El catálogo histórico describe frecuencia diaria: [«Precio de carburantes en las gasolineras españolas»](https://datos.gob.es/es/catalogo/e05068001-precio-de-carburantes-en-las-gasolineras-espanolas). Sin embargo, la obligación legal es comunicar los cambios de precio cuando se producen: artículo 5 del [Real Decreto-ley 6/2000](https://www.boe.es/eli/es/rdl/2000/06/23/6/con/20130223). Además, la FAQ oficial de Ruta-e indica que la aplicación refresca la información cada cinco minutos: [preguntas frecuentes de Ruta-e](https://www.miteco.gob.es/es/energia/hidrocarburos-nuevos-combustibles/app-movil/preguntas-frecuentes.html).

**Lectura correcta de la latencia.** Hay tres conceptos distintos: obligación de comunicación del operador, refresco del producto y frecuencia declarada por un catálogo antiguo. Puede calcularse con una instantánea actual, pero no prometer que cada precio observado represente necesariamente el surtidor en el segundo de llegada.

#### Incidencias de carreteras de Castilla y León

- La Junta publica [«Incidencias en la red de carreteras titularidad de la Junta de Castilla y León»](https://analisis.datosabiertos.jcyl.es/explore/dataset/incidencias-en-la-red-de-carreteras-titularidad-de-la-junta-de-castilla-y-leon/api/), con licencia **CC BY 4.0 ES** y frecuencia declarada de actualización cada diez minutos.
- La [API de registros](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/incidencias-en-la-red-de-carreteras-titularidad-de-la-junta-de-castilla-y-leon/records) expone carretera, puntos kilométricos inicial y final, tramo, tipo, causa, fechas, posible texto de ruta alternativa y más información. En la comprobación del 3 de agosto de 2026 devolvió 166 registros y una última modificación de datos el 29 de julio de 2026.
- El conjunto de incidencias no aportaba geometría ni caja geográfica en los metadatos consultados. No obstante, las capas oficiales de puntos kilométricos y red viaria localizables en el [catálogo de IDECyL](https://idecyl.jcyl.es/geonetwork/static/search?keyword=Redes+de+transporte) permiten geolocalizar la combinación carretera + PK. Esto reduce el bloqueo de datos, aunque todavía exige ajuste espacial, control de sentidos y comprobación de que el tramo afectado coincide con la ruta calculada.
- El catálogo autonómico también contiene [intensidades medias de tráfico y velocidades de la red regional](https://analisis.datosabiertos.jcyl.es/explore/dataset/intensidades-medias-de-trafico-y-velocidades-red-regional-de-carreteras/information/) —14.617 registros en la comprobación, con último año 2024— y [anchura de carreteras](https://analisis.datosabiertos.jcyl.es/explore/dataset/anchura-de-carreteras/information/) —1.560 registros, actualizados en mayo de 2026—. Son útiles para modelar o explicar un coste de desvío, pero **no son tráfico en tiempo real**; utilizarlos como si describieran la velocidad actual sería incorrecto.

#### Matriz de disponibilidad

| Elemento | Acceso | Frecuencia/latencia | Licencia | Limitación principal |
|---|---|---|---|---|
| Precio y estación | REST y descargas oficiales | Cambios comunicados; Ruta-e refresca cada 5 min | CC BY 4.0 en catálogo actual | No hay precio futuro vinculante |
| Incidencias JCyL | API Explore | Cada 10 min declarados | CC BY 4.0 ES | Sin geometría directamente utilizable para routing |
| Red vial/ruta | Capas IDECyL + motor de rutas | Depende de la fuente | Debe verificarse por capa | PK y SHP oficiales permiten geolocalizar; el cálculo de ruta aún requiere motor |
| Consumo/autonomía | Dato del usuario | En cada consulta | No aplica | El consumo real cambia con vía, carga, clima y conducción |

### 3. Producto oficial equivalente y colisión

La colisión es alta:

- [Ruta-e](https://www.miteco.gob.es/es/energia/hidrocarburos-nuevos-combustibles/app-movil.html) es la aplicación oficial española. Permite consultar estaciones y puntos de recarga, precio, horarios, servicios, favoritos y puntos a lo largo de una ruta según preferencias. La página ministerial de [aplicaciones móviles](https://www.miteco.gob.es/en/ministerio/servicios/aplicaciones-dispositivos-moviles.html) describe expresamente el cálculo de ruta y la visualización de estaciones situadas en ella.
- La anterior aplicación oficial [GeoGasolineras](https://datos.gob.es/es/aplicaciones/geogasolineras) ya incluía rutas y capa de tráfico.
- El portal gubernamental de reutilización cataloga [FuelMaps](https://datos.gob.es/es/aplicaciones/fuelmaps), un producto de terceros que muestra estaciones en ruta y las ordena por precio actual. No es un producto público, pero demuestra que la combinación ruta-precio no está vacía.
- La relación oficial de candidaturas de 2025 incluye [**DondeEchoGasolina**](https://www.dondeechogasolina.com/comunidad-autonoma/castilla-y-leon), centrada en precio, ubicación y GPS. Esa colisión impide repetir una aplicación de consulta, pero no cubre por sí misma la optimización global con estado inicial del depósito, reserva, autonomía, número de paradas, litros en cada parada y coste completo. La pertenencia a la edición se comprobó en el fichero oficial local [CandidaturasWeb2025.xlsx](G:/_Descargas/CandidaturasWeb2025.xlsx).

Por tanto, **«gasolineras baratas en mi ruta» no es una propuesta diferencial**. La candidatura solo sobrevive si el núcleo es el problema completo de abastecimiento: con cuánto combustible se sale, qué reserva mínima se exige, dónde parar, cuánto comprar en cada parada y cuál es el coste neto final.

### 4. Precedentes gubernamentales fuera de España

- El Gobierno de Nueva Gales del Sur ofrece [FuelCheck](https://www.nsw.gov.au/legal-and-justice/consumer-rights-and-protection/advertising-product-packaging-and-pricing-laws/fuel-pricing-discounts-and-signage/check-fuel-prices), con precios en tiempo real, estación más barata/cercana, alertas y la función **My Trip**, que traza una ruta para encontrar combustible. Su [ficha de datos](https://data.nsw.gov.au/data/en/dataset/fuel-check) identifica datos en tiempo real y API; Fair Trading confirma la disponibilidad de datos brutos y condiciones de acceso en la [página oficial de FuelCheck](https://www.fairtrading.nsw.gov.au/help-centre/online-tools/fuelcheck).
- Australia Occidental opera [FuelWatch](https://www.fuelwatch.wa.gov.au/about/works). Los minoristas notifican antes de las 14:00 el precio del día siguiente, se publica después de las 14:30 y ese precio queda fijo durante 24 horas desde las 06:00. El servicio ofrece [feeds RSS oficiales](https://www.fuelwatch.wa.gov.au/tools/rss) para precios de hoy y mañana. Este mecanismo funciona por una obligación regulatoria específica, no por una predicción algorítmica.
- Francia publica una instantánea oficial con antigüedad inferior a diez minutos, cierres, rupturas de existencias e históricos bajo licencia abierta: [open data de prix-carburants.gouv.fr](https://www.prix-carburants.gouv.fr/index.php/rubrique/opendata/). El [servicio oficial para ciudadanos](https://www.prix-carburants.gouv.fr/index.php/rubrique/guide/) ya incluye rutas favoritas y alertas de precio.

**Transferencia imposible sin nueva regulación.** FuelWatch puede decir «compra hoy o mañana» porque mañana está declarado y bloqueado. España solo proporciona el precio actual comunicado por el operador; no existe en las fuentes revisadas un precio vinculante para el día siguiente. Una predicción propia introduciría riesgo y rompería la promesa verificable.

No se ha localizado, dentro de las fuentes primarias revisadas, un premio oficial internacional que demuestre que el cálculo de coste del desvío sea por sí mismo una innovación ganadora. Los precedentes fuertes son servicios públicos desplegados y confirman precisamente la elevada colisión.

### 5. Mejora objetiva posible

Una prueba local con OSRM —usada como ensayo técnico, no como fuente oficial— calculó 138,4 km entre Valladolid y León y encontró 109 estaciones con gasóleo A a cinco kilómetros o menos de la ruta. El mínimo fue 1,617 €/l frente a una mediana de 1,864 €/l: una diferencia bruta de **14,82 € en 60 litros** antes de descontar el desvío. Este caso no debe generalizarse, pero demuestra que hay una señal económica suficientemente grande para probar el optimizador.

Un prototipo podría medirse mediante:

- euros de ahorro neto por viaje frente a «repostar en la estación más cercana»;
- diferencia frente a elegir ingenuamente el precio por litro más bajo;
- kilómetros y minutos de desvío evitados;
- porcentaje de recomendaciones factibles según autonomía y horario;
- porcentaje de incidencias correctamente asociadas al recorrido.

La salida sería una única recomendación y una alternativa de respaldo, no un mapa. Debe indicar parada, litros exactos, combustible previsto al llegar y al salir, desvío, coste total y ahorro frente a dos líneas base: la estación más próxima y la estación con menor precio por litro elegida sin coste de desvío.

### 6. Dependencias y riesgos

1. **Motor de rutas.** La API de combustible no calcula rutas. Las capas oficiales permiten construir la base geográfica, pero no entregan directamente navegación. Un motor libre como OSRM reduce la dependencia comercial; aun así, deben fijarse procedencia, licencia y fecha de la red usada.
2. **Geocodificación de incidencias.** Carretera más punto kilométrico puede localizarse con las capas oficiales, pero el cruce con una ruta debe validarse y no inferirse solo por proximidad.
3. **Precio a la llegada.** El dato actual no garantiza el precio después de un viaje largo.
4. **Consumo estimado.** Un valor medio del vehículo no reproduce conducción, pendiente, temperatura o carga.
5. **Colisión de producto.** Ruta-e y productos extranjeros ya resuelven gran parte del recorrido ciudadano.

### 7. Puertas de validación antes de desarrollo

**Puerta 1 — diferencia visible:** en los primeros treinta segundos debe quedar probado que Ruta-e/DondeEchoGasolina localizan estaciones, mientras la candidatura resuelve un abastecimiento completo y devuelve litros y coste neto. Si la demo termina siendo mapa + lista, **NO-GO**.

**Puerta 2 — beneficio generalizable:** repetir el cálculo en al menos 50 rutas representativas —largas/cortas, urbanas/rurales y nueve provincias—. Debe superar de forma material a «más cercana» y «precio por litro más bajo» después de incluir el desvío. Un único Valladolid–León no basta.

**Puerta 3 — factibilidad:** ninguna recomendación puede violar capacidad de depósito, combustible inicial, reserva mínima, horario de apertura o autonomía entre paradas. Deben probarse rutas sin solución y datos incompletos.

**Puerta 4 — incidencias:** verificar el ajuste carretera + PK a la red oficial y medir falsos positivos/negativos. Las intensidades históricas no pueden presentarse como tráfico actual.

### 8. Veredicto A: GO CONDICIONAL

La temática está repetida, pero ahora existe una hipótesis de mejora radical y cuantificable: **no mostrar dónde hay combustible, sino calcular el plan global de repostaje de menor coste real**. La dispersión de precios y la disponibilidad de estaciones, red, PK e incidencias permiten validarlo con datos reales.

Su clasificación exacta es:

> **GO para prototipo algorítmico desechable / NO DEVELOPMENT si no supera Ruta-e y las dos líneas base en 50 rutas.**

No debe incorporar una promesa «hoy o mañana»: España carece del precio futuro vinculante de FuelWatch. La decisión válida es para la instantánea y ruta actuales, mostrando fecha del dato y sensibilidad al posible cambio.

---

## B. Planificador doméstico de cargas y aparatos por franjas

### 1. Decisión ciudadana que resolvería

El usuario introduce las tareas que necesita completar al día siguiente:

- lavadora: 1,1 kW, 2 horas, terminada antes de las 08:00;
- lavavajillas: 1,4 kW, 90 minutos, después de cenar;
- termo o acumulador: potencia y duración necesarias;
- carga de vehículo o bicicleta: energía objetivo y hora de salida;
- límite de potencia contratada y posibilidad o no de interrumpir cada tarea.

La aplicación devuelve un plan ejecutable:

> **Lavavajillas 01:10; lavadora 05:45; carga 02:40–04:55.** Coste variable previsto: 1,34 €. Ahorro frente a empezar cada tarea al quedar disponible: 0,47 €. Pico simultáneo evitado: 1,4 kW.

No es un gráfico de precios. Es un problema de optimización con restricciones: duración continua, fecha límite, solapamientos, potencia máxima y preferencias domésticas.

### 2. Fuente oficial de precio y conocimiento anticipado

- El [MITECO explica el PVPC](https://www.miteco.gob.es/gl/energia/energia-electrica/electricidad/contratacion-suministro/precio-voluntario.html): varía por hora y, desde 2024, incorpora señales de mercados a plazo además del mercado diario. Pueden acogerse personas físicas y microempresas con potencia contratada igual o inferior a 10 kW, sujeto a las condiciones vigentes.
- El método consolidado establece que el operador del sistema publica antes de las 20:15 los componentes horarios aplicables a las 24 horas del día siguiente: [Real Decreto 216/2014, texto consolidado](https://www.boe.es/eli/es/rd/2014/03/28/216/con).
- [eSIOS publica el PVPC](https://www.esios.ree.es/en/pvpc), muestra el término horario de energía activa y permite descargar datos. Su [documentación de API](https://api.esios.ree.es/doc/index.html) contempla indicadores y archivos, pero exige solicitar un token personal; una llamada con las credenciales ilustrativas de la documentación no proporcionó acceso productivo.
- Red Eléctrica confirma que eSIOS y redOS publican los precios del día siguiente a las 20:15 y que redOS permite alertas por encima o por debajo de un umbral: [nota oficial de Red Eléctrica](https://www.redeia.com/es/sala-de-prensa/actualidad/nota-de-prensa/2021/05/red-electrica-publica-los-precios-de-la-nueva-tarifa-pequeno-consumidor).

#### Licencia: puerta obligatoria

La disponibilidad técnica no equivale a licencia abierta. El [aviso legal de Red Eléctrica](https://www.ree.es/es/aviso-legal) permite usos informativos, corporativos y académicos con atribución y fecha, pero no se ha encontrado en la revisión una licencia abierta inequívoca para extraer y redistribuir de forma continuada el indicador PVPC en una aplicación pública. La puesta en producción necesita confirmación escrita de reutilización o una distribución oficial con licencia explícita.

La [API REData](https://www.ree.es/en/datos/apidata) sí ofrece otros datos eléctricos por JSON y sin autenticación, pero generación o demanda del sistema no sustituyen el precio PVPC. Red Eléctrica indica que demanda y producción se actualizan cada cinco minutos en su [página de tiempo real](https://www.ree.es/es/operacion/sistema-electrico/demanda-y-produccion-en-tiempo-real); estos datos podrían contextualizar, pero no deben mezclarse con el cálculo de ahorro económico.

### 3. Datos de Castilla y León: qué es causal y qué sería decorativo

#### Certificados de eficiencia energética

- La Junta publica [«Certificados de eficiencia energética»](https://analisis.datosabiertos.jcyl.es/explore/dataset/certificados-de-eficiencia-energetica/api/) con licencia **CC BY 4.0** y actualización diaria.
- En la consulta del 3 de agosto de 2026 el catálogo contenía aproximadamente 348.864 registros y señalaba modificación el 31 de julio. Los campos revisados incluyen uso del edificio, calificaciones/ratios, emisiones y demandas modelizadas de calefacción y refrigeración, además de localización.
- No aporta directamente potencia del aparato, superficie útil de forma uniforme para el cálculo propuesto, inercia térmica, patrón de ocupación ni consumo horario real. Por ello, **un certificado no permite decidir por sí solo a qué hora encender climatización**.

El dato puede ser causal únicamente en un módulo acotado de climatización o almacenamiento térmico si:

1. el usuario identifica o aporta voluntariamente su certificado;
2. introduce superficie, tipo y rendimiento del equipo, límites de confort y horarios de presencia;
3. la aplicación expresa el resultado como estimación con rango, no como falsa precisión;
4. la recomendación se valida frente a consumos reales o un método técnico reproducible.

#### Auditoría de otros conjuntos energéticos de la Junta

La revisión del catálogo encontró consumos de centros administrativos, hospitales, series regionales, certificados y [auditorías energéticas empresariales](https://analisis.datosabiertos.jcyl.es/explore/dataset/auditorias-energeticas-en-castilla-y-leon/api/). Las auditorías responden a obligaciones de grandes empresas y no describen hogares. Ningún conjunto revisado aporta consumo doméstico horario, aparatos de un hogar o tarifa del ciudadano.

**Consecuencia:** para lavadora, lavavajillas, termo o vehículo, el dato causal es el precio nacional de eSIOS más la información que introduce el usuario. Añadir una estadística energética regional al resultado sería un uso ornamental y no debe hacerse. Si el concurso exige que el dato de Castilla y León sea central en todas las funciones, esta candidatura cae.

### 4. Producto oficial equivalente y espacio real de mejora

redOS ya muestra el precio horario del día siguiente y permite alertas por umbral. En las funciones oficiales revisadas no aparece un planificador que reciba varias tareas, duración, fecha límite, interrupciones, potencia contratada y preferencias, y devuelva el horario conjunto óptimo.

Ese es el hueco defendible:

`24 precios oficiales + restricciones domésticas → horario completo → coste y ahorro auditables`

Una simple función «mueve la lavadora a la hora más barata» sería insuficiente: puede ignorar que un ciclo ocupa varias horas, que hay que acabar antes de una hora concreta o que dos cargas simultáneas superan la potencia contratada.

### 5. Precedentes oficiales premiados fuera de España

- En el **EU Datathon 2022**, CROZ **renEUwable** obtuvo el primer premio de la categoría European Green Deal y el premio del público: [ganadores oficiales del EU Datathon 2022](https://data.europa.eu/en/news-events/news/meet-winners-eu-datathon-2022). El perfil oficial explica que ofrecía recomendaciones personales concretas con estimaciones de ahorro económico, ahorro energético e inversión: [perfil de CROZ renEUwable](https://data.europa.eu/en/news-events/news/eu-datathon-2022-teams-behind-apps-meet-croz-reneuwable).
- En **GovHack 2022**, **Dirty Watts** ganó dos categorías de Nueva Zelanda relacionadas con alfabetización tecnológica y uso creativo de datos ESG: [palmarés oficial de GovHack 2022](https://govhack.org/2022-winners/). La candidatura ayudaba a conocer cuándo la red utilizaba carbón o petróleo; la [Electricity Authority de Nueva Zelanda](https://www.ea.govt.nz/data-and-insights/tools-and-apis/) ofrece datos y APIs oficiales de despacho, generación y demanda casi en tiempo real.

Estos premios no prueban que este planificador concreto vaya a ganar. Sí prueban un patrón apreciado: **convertir datos energéticos difíciles en una acción personal cuantificada**, no limitarse a mostrarlos.

### 6. Mejora objetiva y evaluación reproducible

La propuesta debe competir contra dos líneas base:

1. **inicio inmediato:** cada aparato comienza cuando el usuario dice que queda disponible;
2. **heurística ingenua:** todos los aparatos se desplazan a la hora con el precio individual más bajo, sin optimización conjunta.

Métricas:

- euros/día y euros/año evitados en el término variable de energía;
- porcentaje de tareas terminadas dentro de sus ventanas;
- potencia pico simultánea evitada;
- diferencia de coste frente a las dos líneas base;
- error de la estimación de consumo por aparato;
- para climatización, desviación entre consumo previsto y observado y porcentaje de tiempo fuera del rango de confort.

El cálculo puede reproducirse sobre 365 días históricos. Debe separar claramente ahorro en el término horario de energía de impuestos, cargos fijos y otros conceptos de factura que no cambian por mover la tarea.

### 7. Dependencias y riesgos

1. **Solo sirve económicamente a tarifas con señal horaria aplicable.** No debe prometer ahorro PVPC a un hogar con precio fijo.
2. **Token y derechos de eSIOS.** Son bloqueos de producción, no trámites secundarios.
3. **Datos introducidos por el usuario.** La potencia nominal o la etiqueta del aparato pueden diferir del ciclo real.
4. **Sin control del aparato.** La primera versión entrega un horario y recordatorios; no debe prometer encendido remoto ni integraciones domóticas.
5. **Valor de la Junta débil para cargas genéricas.** El certificado solo puede sostener un componente técnico de climatización, no toda la aplicación.
6. **Predicción meteorológica para climatización.** Si se incorpora, requerirá AEMET u otra fuente externa; sin ella no debe fingirse una optimización térmica anticipada.
7. **Ahorro posiblemente pequeño.** Debe demostrarse empíricamente con días reales y aparatos representativos antes de presentar la candidatura.

### 8. Puertas de validación antes de desarrollo

**Puerta 1 — acceso y reutilización:** obtener token funcional de eSIOS y confirmación escrita de que el indicador puede consumirse y mostrarse en una aplicación pública con la frecuencia necesaria. Si no se consigue, **NO-GO**.

**Puerta 2 — relevancia para Castilla y León:** probar con una muestra de 100 certificados si los campos y cobertura permiten un uso causal y comprensible en climatización. Debe existir un método que use realmente demanda/calificación y datos voluntarios del hogar; si la Junta solo aparece como contexto, **NO-GO para este concurso**.

**Puerta 3 — beneficio:** ejecutar una simulación retrospectiva de 365 días con perfiles de tareas realistas. Debe superar inicio inmediato y la heurística de la hora más barata, cumplir restricciones y mostrar ahorro material sin exagerar la factura total.

**Puerta 4 — comprensión ciudadana:** en una prueba breve, una persona debe poder introducir tres tareas y ejecutar el plan sin comprender mercados eléctricos ni gráficos horarios.

### 9. Veredicto B: GO CONDICIONAL

Es la única familia con una mejora de producto nítida sobre lo oficial: redOS informa y alerta; esta aplicación **organizaría decisiones domésticas interdependientes**. La salida es verificable y el dato del día siguiente existe antes de que el ciudadano actúe.

Sin embargo, no debe desarrollarse aún. Su clasificación exacta es:

> **GO para validación desechable / NO DEVELOPMENT hasta superar acceso eSIOS y causalidad JCyL.**

Si el concurso no exige centralidad de datos autonómicos, la idea gana solidez. Si sí la exige, el módulo causal basado en certificados debe sostenerse técnicamente o la candidatura debe descartarse.

---

## C. Recomendador de riego de jardín, macetas o huerto ciudadano

### 1. Decisión ciudadana que intentaría resolver

El usuario declara superficie o tamaño de recipientes, tipo de planta/cultivo, fase, suelo, sistema de riego y caudal. La aplicación convierte milímetros en una acción:

> **Hoy aplica 42 litros entre las 21:00 y las 22:00. Mañana no riegues: la lluvia prevista cubriría la necesidad.**

Para macetas podría traducirlo a litros por recipiente; para aspersión o goteo, a minutos según caudal. Un registro de agua aplicada permitiría corregir el balance posterior.

### 2. InfoRiego: datos, acceso, frecuencia y licencia

- La Junta cataloga [«Consultas InfoRiego»](https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-rural-pesca/consultas-inforiego/1284807462534), mantenido por ITACyL, con actualización continua, formato JSON y licencia actual declarada **CC BY 4.0**. El acceso se describe como limitado y exige solicitar clave de desarrollador.
- La documentación técnica disponible, [API de acceso InfoRiego v2.3](https://www.inforiego.org/opencms/export/sites/Inforiego/info_meteo/webservice/ITA-WEBRIE-Descripcion_API_acceso_v2.3.pdf), está fechada en 2016. Describe autenticación, consultas diarias y horarias, estaciones y estación más cercana; limita periodos de consulta y ofrece fecha de modificación para recuperar correcciones incrementales.
- Sus variables incluyen evapotranspiración de referencia Penman–Monteith, precipitación, humedad, radiación, insolación, viento y temperaturas. Son los insumos agronómicos relevantes para un balance hídrico.
- Existe una **inconsistencia de licencia que debe resolverse**: el catálogo actual declara CC BY 4.0, mientras que el anexo de la documentación de API de 2016 menciona ODbL 1.0 y atribución visible a ITACyL. Antes de producción habría que obtener de ITACyL la condición aplicable al servicio actual.

#### Matriz de disponibilidad

| Elemento | Fuente | Situación | Limitación |
|---|---|---|---|
| ETo, lluvia y meteorología observada | InfoRiego | API con clave; actualización continua declarada | Acceso limitado y documentación antigua |
| Parámetros de cultivo y sistema | InfoRiego + usuario | El servicio oficial ya los usa | Taxonomía orientada a agricultura |
| Lluvia futura | AEMET u otra predicción | API externa a la Junta | InfoRiego observado no basta para «espera mañana» |
| Humedad real del suelo o maceta | Sensor/usuario | No disponible en el conjunto | Sin hardware, el balance parte de supuestos |
| Superficie y caudal doméstico | Usuario | Fácil de solicitar | Error de medida afecta directamente a litros/minutos |

### 3. Producto oficial equivalente: colisión directa

InfoRiego no es solo una estación meteorológica ni un panel:

- La [recomendación de riego oficial](https://www.inforiego.org/opencms/opencms/recomendacion_riego/index.html) se personaliza por estación, población o zona, periodo, cultivo, estado de desarrollo y sistema de riego.
- La [ayuda oficial](https://www.inforiego.org/opencms/opencms/ayuda/ayu_recomenda_riego.htm) explica el uso de cultivo, fase y eficiencia del sistema.
- La metodología del [balance hídrico y agronomía](https://www.inforiego.org/opencms/opencms/info_tecnica/6_agronomia/index.html) ya busca determinar cuánto y cuándo regar.
- La [portada de InfoRiego](https://www.inforiego.org/opencms/opencms/) ofrece recomendaciones y comunicaciones de consumo hídrico de cultivo por web, correo o SMS.

Por ello, el núcleo propuesto coincide casi exactamente con un servicio oficial vigente. Cambiar «cultivo agrícola» por «jardín, huerto y macetas», simplificar términos y convertir milímetros en minutos mejora la accesibilidad, pero no altera el mecanismo decisional.

### 4. Dependencia de pronóstico

InfoRiego aporta principalmente observaciones y cálculos basados en ellas. Para responder «no riegues hoy porque lloverá mañana» se necesita pronóstico:

- [AEMET OpenData](https://opendata.aemet.es/dist/) documenta endpoints de predicción diaria y horaria por municipio y requiere API key.
- El [centro de descargas de productos AEMET](https://opendata.aemet.es/centrodedescargas/productosAEMET) reúne productos oficiales; AEMET publica sus condiciones de reutilización en [Datos abiertos](https://www.aemet.es/es/datos_abiertos).

Esta dependencia es legítima, pero aumenta puntos de fallo y no resuelve la incertidumbre central: el sistema desconoce la humedad real del suelo, el agua aplicada anteriormente, sombra, drenaje y microclima de cada jardín o maceta salvo que el ciudadano lo registre o instale sensores.

### 5. Precedentes oficiales premiados fuera de España

NASA anunció entre los ganadores globales de **International Space Apps Challenge 2024** a:

- **Waterwise**, premio Best Use of Data, para gestionar disponibilidad de agua frente a sequía, plagas y enfermedades;
- **2plant**, premio Galactic Impact, que utiliza humedad superficial del suelo y evapotranspiración para evaluar condiciones de plantación.

Fuente primaria: [NASA International Space Apps Challenge — 2024 Global Winners](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/).

Son precedentes sólidos de que el balance hídrico y la traducción de datos ambientales a decisiones pueden ser premiables. También muestran el problema competitivo: las propuestas fuertes añaden observación terrestre o humedad del suelo, mientras que una adaptación doméstica de InfoRiego tendría menos evidencia física, no más.

### 6. Mejora objetiva posible

Una evaluación podría medir:

- litros recomendados frente a un calendario fijo;
- riegos evitados antes de lluvia;
- porcentaje de recomendaciones que el usuario puede ejecutar con su sistema;
- diferencia entre agua prevista y aplicada;
- tasa de fallo cuando el pronóstico de lluvia no se cumple;
- supervivencia o estado declarado de plantas, solo como indicador secundario y no como prueba agronómica rigurosa.

La salida debe ser litros/minutos y «riega/espera», nunca un panel meteorológico.

### 7. Dependencias y riesgos

1. **Colisión exacta con InfoRiego.** Ya existe recomendación personalizada oficial de cuánto y cuándo regar.
2. **Clave y licencia.** Acceso limitado y contradicción entre CC BY 4.0 y ODbL histórica.
3. **Predicción externa.** AEMET es necesaria para decisiones anticipadas sobre lluvia.
4. **Estado hídrico desconocido.** Sin sensor o historial fiable, la humedad del suelo es una estimación.
5. **Variabilidad doméstica.** Maceta, sustrato, sombra, viento y drenaje pueden cambiar la necesidad más que la estación meteorológica cercana.
6. **Audiencia y urgencia.** Es útil, pero menos universal que una decisión energética cotidiana y puede percibirse como función estacional.

### 8. Veredicto C: NO-GO

La aplicación sería útil y demostrable, pero no es una mejora radical sobre el producto oficial: esencialmente traduce y simplifica InfoRiego para otro segmento. Al mismo tiempo, pierde precisión por carecer de humedad de suelo y necesita AEMET para mirar hacia delante. **No debe pasar a desarrollo ni presentarse como innovación principal.**

---

## Comparación final y decisión recomendada

| Criterio | A. Repostaje | B. Cargas domésticas | C. Riego ciudadano |
|---|---|---|---|
| Problema entendible en 10 segundos | Alto | Alto | Alto |
| Acción concreta, no visualización | Sí | Sí | Sí |
| Dato conocido antes de actuar | Parcial: precio actual | **Sí: 24 horas siguientes** | Parcial: observado; pronóstico externo |
| Producto oficial ya equivalente | Alto para localizar; no se verificó optimización global | Parcial: informa/alerta, no planifica | **Muy alto** |
| Mejora objetivamente medible | **Sí: coste neto contra dos líneas base** | **Sí y reproducible** | Sí, con incertidumbre física |
| Uso causal de datos JCyL | **Incidencias + PK + red; ajuste factible** | Débil; posible solo en climatización con certificado | Fuerte, pero el producto oficial ya lo explota |
| Dependencia externa crítica | Motor de rutas; puede ser libre | Token/licencia eSIOS; quizá AEMET | AEMET + clave InfoRiego |
| Resultado | **GO CONDICIONAL — prioridad 1** | **GO CONDICIONAL — prioridad 2** | **NO-GO** |

### Recomendación operativa

No diseñar todavía interfaces ni arquitectura. Ejecutar primero las cuatro puertas de validación de A. La candidatura solo debe sobrevivir si puede demostrar, con datos reales:

1. optimización conjunta de depósito, autonomía, paradas y litros, no una lista de estaciones;
2. ahorro neto material frente a «más cercana» y «menor €/l» después de pagar el desvío;
3. recomendaciones factibles en 50 rutas y casos límite;
4. uso causal y validado de incidencias, PK y red de Castilla y León.

Si A falla las dos primeras puertas, se archiva sin reinterpretarla como mapa y se ejecutan las puertas de B. B solo podrá sustituirla si resuelve tanto los derechos de eSIOS como la debilidad causal de los datos autonómicos. C no debe reabrirse con los datos actuales.
