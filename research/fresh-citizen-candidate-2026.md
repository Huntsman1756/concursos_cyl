# Nueva criba ciudadana tras HORAS A FAVOR

**Fecha de corte:** 3 de agosto de 2026  
**Ámbito:** X Concurso de Datos Abiertos de Castilla y León, categoría Productos y Servicios.  
**Resultado actualizado:** **CARTERA PAU es la única candidata autorizada para prototipo técnico, con PASS CONDICIONAL FUERTE**. La prueba posterior confirmó fuente BOCYL/JCyL causal, descubrimiento API de las seis resoluciones vigentes y extracción tabular automatizable. Las demás candidatas siguen descartadas.

## Veredicto ejecutivo

Esta ronda buscó una aplicación ciudadana que funcionase sin cuenta, datos personales, acuerdos institucionales, API privada, comunidad previa ni una revisión manual masiva. También se excluyeron las familias ya rechazadas: mapas, directorios, paneles, chatbots, IA genérica, ayudas, registros, calendarios, quejas, vehículo, vivienda/energía, residuos, escolarización, bibliotecas, archivos, inflación, compraventa agraria y reparto de horas.

Se sometieron tres mecanismos nuevos a prueba:

1. **AGUA A MEDIDA** — tejado + consumo no potable + lluvia diaria real → curva de tamaño/fiabilidad de un depósito y ficha descargable. **NO-GO por colisión exacta**: SimTanka ya usa lluvia diaria histórica, presupuesto de agua y propone el tamaño óptimo del depósito; además existen calculadoras oficiales y aplicaciones en ambas tiendas.
2. **GRUPO ESPEJO** — población oficial + bolsa local anónima → panel sorteado con cuotas, semilla verificable y sustituciones. **NO-GO por dato insuficiente y colisión**: el conjunto JCyL 2026 carece de campo de población/multiplicidad y StratifySelect ya resuelve la selección estratificada justa con software abierto.
3. **ÁRBOL A 30 AÑOS** — ubicación + suelo + objetivo → especies compatibles y ficha de plantación. **NO-GO por colisión histórica y cobertura**: JCyL solo publica cuatro especies en una capa de 2016 y `reförest` ya se presentó al concurso en 2024 con diagnóstico de idoneidad de parcela para reforestación.

Se añadió después **CARTERA PAU** — varios grados objetivo + rangos de nota por materia → combinación robusta de exámenes y sensibilidad. El primer kill-test dio `NO-GO`, pero nueva evidencia lo corrige a **PASS CONDICIONAL FUERTE**: el feed BOCYL/JCyL descubre las cuatro resoluciones basales y dos altas vigentes, y las seis tablas son detectables por coordenadas sin transcripción. Quedan como puertas cero tokens ambiguos, precedencia de altas, versionado y bloqueo automático ante cambios.

La conclusión inicial era que ninguna cumplía simultáneamente originalidad, centralidad del dato JCyL y las restricciones impuestas. **La prueba técnica posterior cambia únicamente CARTERA PAU**: ahora sí justifica un prototipo acotado, todavía sujeto a validación cerrada antes de convertirse en producto público.

## Puertas duras

Las [bases consolidadas](https://datosabiertos.jcyl.es/web/jcyl/binarios/742/958/IAPA_2377_BBRR_TRA_483_2020_yModificaci%C3%B3n,1.pdf?blobheader=application%2Fpdf%3Bcharset%3DUTF-8&blobnocache=true) valoran utilidad, valor económico, valor público/social, originalidad, variedad de datos —con especial consideración a fuentes JCyL—, facilidad/accesibilidad y calidad técnica. Además se aplicaron estas puertas eliminatorias:

- **Dato causal:** sin el conjunto JCyL, la respuesta individual debe cambiar materialmente.
- **Acción cerrada:** el resultado debe ser una decisión, configuración o documento; no una exploración.
- **Autonomía:** el primer usuario debe obtener valor sin captar previamente a otra persona u organización.
- **Responsabilidad baja:** nada que parezca dictamen jurídico, médico, financiero o de seguridad.
- **Colisión:** no basta traducir o regionalizar un producto ya resuelto.
- **Preparación automática:** nada que exija transcribir centenares de celdas o mantener contenido editorial a mano.

## Matriz adversarial

Escala interna de 1 a 5 por criterio oficial. La suma orienta; un fallo de puerta mata la candidata aunque puntúe alto.

| Concepto | Utilidad | Económico | Social | Originalidad | Datos | UX | Técnica | Total / 35 | Puerta fatal |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **AGUA A MEDIDA** | 4 | 4 | 4 | 1 | 4 | 5 | 4 | **26** | SimTanka ya ejecuta lluvia diaria histórica → presupuesto → depósito óptimo; vivienda además está fuera de alcance |
| **MENOS VUELTAS** | 2 | 4 | 3 | 4 | 4 | 2 | 4 | **23** | Cero valor sin varios titulares de acuerdo; SIGPAC no acredita derechos ni equivalencia; la salida entra en negociación patrimonial |
| **GRUPO ESPEJO** | 3 | 2 | 5 | 2 | 1 | 4 | 4 | **21** | La fuente JCyL no contiene los recuentos necesarios y el algoritmo/producto ya existe |
| **ÁRBOL A 30 AÑOS** | 3 | 3 | 4 | 1 | 2 | 4 | 3 | **20** | Solo cuatro especies, capa antigua y colisión directa con `reförest` 2024 |
| **CARTERA PAU** | 5 | 2 | 4 | 4 | 4 | 4 | 4 | **27** | **PASS condicional:** cerrar cinco tokens USAL y demostrar invariantes, altas y versionado `fail-closed` |

## 1. AGUA A MEDIDA

### Operación propuesta

Una persona elige la estación InfoRiego más cercana e introduce superficie horizontal de captación, coeficiente de pérdidas, capacidad actual o candidata y demanda diaria no potable. La aplicación reproduce cada día observado y devuelve:

- litros captados, usados y desbordados;
- días en que el depósito quedó vacío;
- curva `capacidad → fiabilidad` para no fingir que existe un único tamaño “correcto”;
- resultado para años secos, medianos y húmedos;
- ficha PDF/CSV con entradas, fórmula, estación, huecos y fecha de corte.

La salida sería accionable y visual: antes de comprar un depósito, comparar 500, 1.000, 2.000 y 5.000 litros con el mismo historial real.

### Datos JCyL: técnicamente excelentes

El conjunto [Climatología](https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-ambiente/climatologia/1284225649821) declara observaciones horarias y diarias desde 2001, actualización diaria, CSV y licencia CC-BY. El directorio oficial de [datos diarios](https://ftp.itacyl.es/Meteorologia/Datos_observacion_Red_InfoRiego/DatosDiarios/) contiene carpetas de 2001 a 2026; la carpeta de [2026](https://ftp.itacyl.es/Meteorologia/Datos_observacion_Red_InfoRiego/DatosDiarios/2026/) llegaba materialmente al 28 de julio al revisar la fuente. La [red InfoRiego](https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-ambiente/estaciones-meteorologia-inforiego/1285064328974) declara 54 estaciones.

Una descarga real, [20 de julio de 2026](https://ftp.itacyl.es/Meteorologia/Datos_observacion_Red_InfoRiego/DatosDiarios/2026/20260720_RedClimaITACYL_Diario.zip), contiene código, ubicación, fecha, precipitación, evapotranspiración, temperaturas, humedad, viento y radiación. No hay que transcribir celdas: una ingesta automática puede recorrer los ZIP diarios.

Existe, no obstante, una alerta de calidad que el prototipo tendría que hacer visible: algunos ZIP contienen solo cabecera; por ejemplo [12 de enero de 2026](https://ftp.itacyl.es/Meteorologia/Datos_observacion_Red_InfoRiego/DatosDiarios/2026/20260112_RedClimaITACYL_Diario.zip). Un resultado serio debe excluir o imputar explícitamente esos huecos, nunca tratarlos como lluvia cero.

### Colisión que la mata

La diferencia prevista —simular día a día en vez de multiplicar lluvia anual por tejado— ya está ocupada:

- [SimTanka en App Store](https://apps.apple.com/in/app/simtanka/id6446281690) descarga lluvia diaria histórica, deja fijar presupuesto diario, propone tamaños óptimos, examina ciclos secos y conserva un diario del sistema.
- La web oficial de [SimTanka](https://simtanka.org/page0/page0.html) explica la misma mecánica: cinco o más años de lluvia diaria, demanda, tamaño óptimo y probabilidad de disponer de agua.
- [IWRD–RWH en Google Play](https://play.google.com/store/apps/details?id=in.integritytechsolutions.iwrdapp) calcula captación y capacidad del depósito sin registro.
- [Rainfall Calculator en App Store](https://apps.apple.com/us/app/rainfall-calculator/id1446150880) calcula volumen capturable, ahorro y tamaño mínimo.
- La administración local de [West Torrens](https://www.westtorrens.sa.gov.au/Environment-and-Sustainability/Water/Rainwater-tanks) ya ofrece una calculadora pública de tamaño de depósito; [Kent County Council](https://www.kent.gov.uk/about-the-council/strategies-and-policies/service-specific-policies/economic-regeneration-and-planning-policies/flooding-drainage-and-water-management-policies-and-guidance/water-management-policies/rainwater-harvesting-calculator) calcula beneficios de agua y ahorro.

La ventaja de datos oficiales castellanos, 25 años y español es real, pero es **localización de una solución existente**, no un nuevo mecanismo. Además el usuario había dejado fuera vivienda. Añadir una curva marginal o un PDF no cambia esa conclusión.

**Veredicto: NO-GO competitivo.** Solo sería rescatable si se relajase expresamente la prohibición temática y una prueba comparativa demostrase una operación esencial ausente en SimTanka; la revisión actual no la encuentra.

## 2. GRUPO ESPEJO

### Operación propuesta

Una asociación, centro educativo, medio local o colectivo necesita escoger 8–30 personas de una bolsa de voluntarios sin que el grupo quede formado solo por quienes más se parecen entre sí. La PWA recibiría identificadores aleatorios y atributos mínimos guardados solo en el dispositivo, calcularía cuotas frente a la población y produciría:

- un panel sorteado;
- probabilidad individual y semilla verificable;
- lista ordenada de sustituciones;
- recibo que distingue “diverso según estas variables” de “estadísticamente representativo”.

Es un resultado concreto, sin mapa, recomendación sensible ni servidor con nombres.

### El dato regional falla

El conjunto [Población de referencia 2026](https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-de-referencia-2026/information/) publica 49.959 registros con periodo, provincia, área, ámbito, zona básica de salud, edad y sexo. La [API de metadatos](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/poblacion-de-referencia-2026) confirma que **no hay un campo de número de personas**. La ficha dice que cada registro representa una tarjeta sanitaria, pero 49.959 filas no equivalen a la población regional; contar combinaciones o filas como ciudadanos produciría cuotas falsas.

Las otras dos fuentes separan dimensiones que la aplicación necesita juntas: [población por edades y sexo](https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-total-por-edades-y-sexo/information/) es regional, mientras [población por provincias y sexo](https://analisis.datosabiertos.jcyl.es/explore/dataset/poblacion-total-por-provincias-y-sexo/information/) no cruza edad. Con INE podría repararse, pero entonces JCyL dejaría de determinar la asignación local.

### Colisión y responsabilidad

El mecanismo tampoco es nuevo. La [Sortition Foundation](https://www.sortitionfoundation.org/its_official_we_use_the_fairest_selection_algorithm) mantiene `StratifySelect`, software abierto que satisface cuotas y busca igualar las probabilidades de selección; su [documentación del algoritmo](https://sortitionfoundation.github.io/sortition-algorithms/modules/) expone selección estratificada y validación de cuotas. La [Asamblea Ciudadana de Irlanda](https://citizensassembly.ie/about/faq/) describe selección aleatoria estratificada por edad, género y residencia. En App Store, [Groups](https://apps.apple.com/us/app/groups-random-team-generator/id1160022250) ya equilibra género, separa incompatibilidades, sortea y exporta grupos.

El producto podría simplificar una tecnología profesional, pero usar edad o sexo para seleccionar personas también exige gobernanza y explicación. No debe convertirse en un “certificado de representatividad” para una muestra pequeña o autoseleccionada.

**Veredicto: NO-GO.** Dato JCyL no utilizable para cuotas locales exactas, audiencia organizativa y equivalente funcional maduro.

## 3. ÁRBOL A 30 AÑOS

### Operación propuesta

El usuario indica ubicación, suelo conocido, espacio disponible y objetivo —sombra, fruto, biodiversidad o repoblación—. La aplicación descarta configuraciones incompatibles y genera una ficha de plantación con tres opciones, necesidades y razones del descarte. El mapa sería una entrada interna; el producto final sería una decisión y una ficha, no un visor.

### La fuente regional es demasiado estrecha

El conjunto [Mapas de Potencialidad Termopluviométrica de Especies Forestales](https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-ambiente/potencialidad-termopluviometrica-especies-forestales-cyl/1284688160570) solo cubre fresno, cerezo, nogal y serbal común. La ficha del catálogo indica actualización material de 19 de julio de 2016, formato SHP y licencia IGCYL-NC. Es una capa de probabilidad termopluviométrica para implantación forestal, no una recomendación urbana o doméstica: faltan espacio radicular, instalaciones, suelo detallado, procedencia del material, plagas y restricciones concretas.

### Colisión local e internacional

El corpus histórico aportado contiene en 2024 **`reförest: gestión forestal y reforestación`**, descrito como una aplicación que descarga y analiza fuentes oficiales y científicas para informar sobre la idoneidad de una parcela para reforestación. Ese solape es directo.

Fuera de Castilla y León, [Ecological Site Classification de Forest Research](https://www.forestresearch.gov.uk/tools-and-resources/fthr/ecological-site-classification/) ya combina localización y suelo para elegir especies e incorpora escenarios climáticos 2050/2080; la provincia de Columbia Británica mantiene una [Tree Species Selection Tool](https://www2.gov.bc.ca/gov/content/industry/forestry/managing-our-forest-resources/silviculture/tree-species-selection/tool-introduction) oficial basada en adecuación ecológica y riesgos.

**Veredicto: NO-GO inmediato.** Menos cobertura, menos actualidad y menos originalidad que un antecedente del propio concurso.

## 4. Por qué MENOS VUELTAS tampoco debe avanzar con las órdenes actuales

La idea es técnicamente más original que las tres anteriores: varios propietarios importan sus parcelas SIGPAC, fijan parcelas bloqueadas y tolerancias, y el solucionador devuelve alternativas que reducen fragmentación o distancia preservando restricciones. El [SIGPAC JCyL](https://datosabiertos.jcyl.es/web/jcyl/set/es/urbanismo-infraestructuras/SIGPAC/1284225645888) dispone de cartografía municipal y la [Concentración Parcelaria](https://datosabiertos.jcyl.es/web/jcyl/set/es/medio-rural-pesca/concentrac_parcelaria/1284216032773) demuestra que la fragmentación es un problema regional real.

Sin embargo, choca con tres órdenes duras:

1. **No es autónoma.** Una persona sola no puede intercambiar nada. El valor depende de que dos o más titulares ya estén identificados, quieran negociar y aporten todas sus parcelas y restricciones.
2. **SIGPAC no demuestra lo necesario.** Describe parcela/recinto y uso agrícola, pero no titularidad, cargas, arrendamientos, servidumbres, accesos reales, derechos de agua ni valor económico. Conservar superficie y uso no significa que nadie pierda valor.
3. **La frontera no se arregla con un aviso legal.** La FAO explica que la concentración voluntaria coordina preferencias de múltiples propietarios y que los participantes deben quedar al menos igual que antes; sus [directrices](https://www.fao.org/tenure/activities/transfers-and-changes-of-rights/land-consolidation/en/) y [descripción operativa](https://www.fao.org/4/y4954e/y4954e06.htm) incluyen inventario de derechos y valores, negociación y acuerdo de todos. Son precisamente las piezas que la aplicación no puede verificar con datos abiertos.

Puede existir como herramienta profesional o institucional de pre-negociación, pero no cumple la orden de una aplicación ciudadana individual, sin cooperación imprescindible y de baja responsabilidad.

**Veredicto: NO-GO bajo el encargo actual.** No es una reserva ciudadana equivalente a SIETE; requeriría cambiar el público, aceptar cooperación multiusuario y diseñar un proceso jurídico/profesional externo.

## 5. Kill-test urgente: CARTERA PAU

### Qué resolvería de verdad

No sería otro buscador de carreras. El alumno seleccionaría varios grados y campus que contempla, indicaría un rango realista de nota por materia y cuántos exámenes voluntarios está dispuesto a preparar. Un optimizador determinista devolvería:

- la combinación de materias que conserva más opciones;
- qué grados se pierden si una nota baja uno o dos puntos;
- materias “robustas” que ponderan bien para varios destinos;
- la nota de admisión por escenario y la fuente oficial exacta;
- un informe descargable con curso académico y fecha de actualización.

La operación es comprensible, accionable y de baja responsabilidad si se presenta como simulación, no como garantía de admisión. Es además **materialmente más avanzada** que *Elige tu Universidad (Castilla y León)*, premiada en Ideas en 2022, cuya descripción histórica era un sitio centralizado con información sobre universidades, estudios y ciudades. Aquí sí habría una decisión multiobjetivo y análisis de sensibilidad.

### Objeción inicial de datos y evidencia que la revierte

El conjunto abierto [Grados y programas conjuntos ofertados](https://datosabiertos.jcyl.es/web/jcyl/set/es/sector-publico/grados-universitarios/1284527126015) declara frecuencia anual, pero en la revisión del 3 de agosto de 2026 solo ofrecía nueve CSV, de 2015-2016 a **2023-2024**. El último fichero contiene 372 titulaciones y únicamente cinco campos: universidad, campus, centro, denominación y rama. No contiene ponderaciones, notas de corte, plazas ni reglas de admisión.

La Junta sí centraliza una página oficial de [parámetros de ponderación 2026-2027](https://www.educa.jcyl.es/universidad/es/servicio-ensenanza-universitaria/admision-ensenanzas-universitarias-oficiales-grado-universi/parametros-ponderacion-curso-2025-2026), pero enlaza **seis PDF**: Burgos, León, Salamanca, una modificación de Veterinaria, Valladolid y una modificación de Biotecnología. No hay CSV ni API. Son al menos 16 páginas de matrices densas; una de las tablas ni siquiera conserva texto extraíble de forma utilizable. La propia existencia de dos modificaciones separadas publicadas después de las tablas principales demuestra que no basta una carga inicial.

Con aproximadamente 372 títulos y unas tres decenas de materias potenciales, la superficie lógica supera **10.000 cruces título-materia**. Aunque un extractor reduzca la transcripción, una recomendación educativa exige verificar cada valor `0,1`, `0,2` o vacío y volver a hacerlo cuando se publique una corrección. Esto excede ampliamente el umbral de 200 celdas que ya dejó a SIETE como reserva. Sin esa verificación, un único desplazamiento de columna puede recomendar al alumno preparar la materia equivocada.

La consecuencia competitiva es seria: el dato JCyL reutilizable sería una lista antigua de grados usada como adorno; la decisión real dependería de información no estructurada y de notas de corte externas. La aplicación podría existir técnicamente, pero no cumple la puerta de **preparación automática** ni maximiza el criterio de variedad y centralidad de datos abiertos de la Junta.

### Colisión histórica y de mercado

No hay colisión exacta con *Elige tu Universidad*: pasar de información centralizada a optimización robusta sí es un salto funcional. Sin embargo, el espacio que rodea ese salto ya está muy ocupado:

- [Calculadora Nota EvAU en Google Play](https://play.google.com/store/apps/details?id=appinventor.ai_juanan3caceress.Calculadora_Nota_EvAU2) permite introducir notas, consultar ponderaciones de las universidades españolas, variar escenarios y ver carreras al alcance; declara más de 10.000 descargas.
- [Notaspau en App Store](https://apps.apple.com/es/app/notaspau-acceso-universidad/id6761384675) cruza la nota del usuario con más de 15.000 notas de corte, 80 universidades, favoritos y notas objetivo.
- El simulador oficial de la [Universidad Politécnica de Madrid](https://www.upm.es/FuturosEstudiantes/Ingresar/Acceso/EvAU/SimuladorAdmision) aplica automáticamente las dos ponderaciones más altas; la [Universidad de Alcalá](https://www.uah.es/es/admision-y-ayudas/grados/pruebas-de-acceso/Evaluacion-para-el-Acceso-a-la-Universidad/simulador-de-notas-de-admision/index.html) calcula la admisión para todas sus titulaciones.
- [Qué Carrera Estudio](https://quecarreraestudio.com/calculadora-pau/) ya muestra en una vista carreras y universidades con opciones reales a partir de una simulación PAU.

La optimización simultánea de una **cartera** de grados y sus rangos conserva una diferencia defendible, pero es incremental frente a estas calculadoras, no suficiente para compensar el fallo de datos.

### Puntuación probable y decisión

| Criterio 2026 | Nota / 5 | Motivo |
|---|---:|---|
| Utilidad | 5 | Decide qué combinación preparar y muestra sensibilidad |
| Valor económico | 2 | Ahorra orientación y preparación mal dirigida, pero no crea una economía clara |
| Valor público/social | 4 | Ayuda a alumnos y familias en una decisión relevante, aunque estacional |
| Originalidad | 3 | La cartera multiobjetivo es nueva respecto a 2022, pero existen simuladores muy cercanos |
| Variedad/centralidad de datos | 1 | El CSV JCyL termina en 2023-2024; el núcleo actual está en PDF y faltan cortes vigentes estructurados |
| Facilidad y accesibilidad | 4 | Puede ser una PWA sencilla, sin cuenta ni datos personales |
| Calidad técnica | 3 | El solver es auditable; la ingesta y validación anual son frágiles |
| **Total estimado** | **22/35** | Una puerta fatal invalida la suma |

**Veredicto actualizado con la prueba técnica posterior: PASS CONDICIONAL FUERTE.** El feed API del BOCYL descubre exactamente las cuatro resoluciones basales y las dos altas vigentes, con URL y fecha. `pdfplumber` detecta las seis tablas: UBU `38 × 31`; ULE con 32 columnas `x` estables; USAL con 33 —cinco tokens aún sospechosos— y su alta de Veterinaria; UVa `70 × 37` más `27 × 37` y su alta de Biotecnología `4 × 37`. Ya no hay fundamento para presumir transcripción masiva ni dato JCyL decorativo. Se autoriza el prototipo técnico; el producto público queda condicionado a cero valores ambiguos, precedencia correcta de las dos altas, versionado y bloqueo automático ante cambios de estructura.

Con la evidencia técnica posterior, **CARTERA PAU pasa por delante de SIETE**: mantiene una diferencia funcional defendible y ya no exige transcripción. SIETE continúa como reserva bloqueada por su revisión manual.

## Decisión final

| Dirección | Decisión |
|---|---|
| AGUA A MEDIDA | **Descartar:** mejor dato y mejor UX de la ronda, pero colisión funcional exacta y tema fuera de alcance |
| GRUPO ESPEJO | **Descartar:** fuente regional sin recuentos, audiencia organizativa y software existente |
| ÁRBOL A 30 AÑOS | **Descartar:** fuente de 2016 con cuatro especies y antecedente `reförest` |
| MENOS VUELTAS | **Descartar con las restricciones actuales:** cooperación y verificación patrimonial son esenciales |
| CARTERA PAU | **PASS condicional fuerte:** fuente BOCYL causal, seis tablas detectables y diferencia preexamen defendible; publicar solo tras cerrar cinco tokens, altas, versionado e invariantes `fail-closed` |

No se recomienda diseñar interfaz, marca ni arquitectura para las cuatro direcciones descartadas. **CARTERA PAU sí debe pasar ahora a un prototipo técnico acotado** de ingesta, rectificaciones, invariantes y solver; la interfaz pública solo procede si ese gate termina sin valores ambiguos ni excepciones manuales.
