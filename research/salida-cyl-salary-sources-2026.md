# SALIDA CyL — Fuentes oficiales de salarios e ingresos para FP

**Fecha de verificación:** 8 de agosto de 2026  
**Ámbito:** fuentes primarias u oficiales españolas reutilizables para una posible pestaña de comparación de estudios e ingresos.  
**Conclusión:** **viable para el MVP con alcance limitado y rotulación estricta**.

## Resumen ejecutivo

La fuente oficial para incorporar indicadores salariales a SALIDA CyL es la **Estadística de Inserción Laboral de las personas graduadas en Formación Profesional** del Ministerio de Educación, Formación Profesional y Deportes.

La incorporación **no requiere esperar una autorización individual previa**. Los conjuntos de EDUCAbase figuran en datos.gob.es como datos públicos descargables en CSV, PC-Axis y XLS, con el aviso legal del Ministerio como condición de uso. Además, el [régimen general estatal de reutilización](https://www.boe.es/buscar/act.php?id=BOE-A-2011-17560) permite copia, difusión, extracción, reordenación, combinación y transformación para fines comerciales y no comerciales. El producto debe atribuir la fuente, conservar la fecha de actualización, no desnaturalizar el dato y no sugerir patrocinio o apoyo institucional. Esta conclusión es de producto y cumplimiento documental, no asesoramiento jurídico.

SALIDA CyL debe aplicar directamente las condiciones oficiales de reutilización y utilizar las tablas específicas de FP de EDUCAbase como evidencia estadística y metodológica del producto.

La estadística permite comparar la **base de cotización anualizada** de graduados de FP de Grado Medio y Grado Superior por **ciclo o grupo oficial de ciclos**, cohorte y años transcurridos desde la graduación. Sin embargo, ese detalle existe únicamente a escala **nacional**. Para Castilla y León se publican datos salariales por **grado de FP**, no por ciclo ni familia; tampoco existe un cruce oficial equivalente por provincia.

Por ello, el producto puede mostrar:

1. **Tu ciclo o grupo de ciclos en España:** media y límites de quintiles de la base de cotización anualizada.
2. **Referencia territorial de tu grado de FP en Castilla y León:** una tarjeta separada y claramente rotulada.

No debe calcularse una cifra sintética de «salario de este ciclo en Castilla y León». Ese dato no aparece en ninguna fuente oficial examinada.

## Matriz de disponibilidad

| Fuente                                     |                     Ciclo/título FP |   Familia FP |                       Ocupación |          Castilla y León |                            Provincia | Descarga/API                   | Uso recomendado                                            |
| ------------------------------------------ | ----------------------------------: | -----------: | ------------------------------: | -----------------------: | -----------------------------------: | ------------------------------ | ---------------------------------------------------------- |
| Ministerio / EDUCAbase, inserción FP       | Sí, ciclo-grupo nacional en GM y GS | Sí, nacional |                              No |        Sí, solo grado FP |                                   No | CSV, PC-Axis, XLS              | Fuente principal del MVP                                   |
| JCyL, Estructura Salarial                  |                                  No |           No |     Solo tres niveles agregados |                       Sí |                                   No | PDF/tablas                     | Contexto regional, no asignación individual                |
| INE, Encuesta Anual de Estructura Salarial |                                  No |           No |           Grandes grupos CNO-11 | CCAA en tablas separadas | No en el producto estándar relevante | API JSON y descargas           | Contexto/metodología; fuera del motor MVP                  |
| AEAT, Mercado de trabajo y pensiones       |                                  No |           No | No; utiliza sector de actividad |                       Sí |                                   Sí | Publicación y tablas oficiales | Posible contexto provincial futuro                         |
| SEPE, Perfiles de la oferta                |                      No sistemático |           No |       Ocupaciones seleccionadas |   Variable según estudio |                             Variable | Informes/páginas               | Referencia editorial puntual, no motor                     |
| JCyL/ECYL, ofertas de empleo               |                                  No |           No |      Título y descripción libre |                       Sí |                                   Sí | API Explore 2.1, exportaciones | Mostrar salario solo si la vacante lo publica literalmente |

## 1. Ministerio de Educación / EDUCAbase

### Qué es

La [Estadística de Inserción Laboral de las personas graduadas en enseñanzas de Formación Profesional](https://www.educacionfpydeportes.gob.es/servicios-al-ciudadano/estadisticas/laborales/insercion.html) integra información educativa con registros de afiliación a la Seguridad Social. La edición consultada fue publicada el 26 de noviembre de 2025 y contiene cohortes desde 2011-2012.

La [metodología oficial de 2025](https://www.educacionfpydeportes.gob.es/dam/jcr%3A1ae997fc-346b-4b39-800c-3d8bde091367/metodo-2025.pdf) define la base utilizada como la de contingencias comunes. Como aproximación a la retribución bruta anual, el Ministerio anualiza la base correspondiente a marzo para afiliados por cuenta ajena con contrato a jornada completa. Calcula la media y los límites de los quintiles de la distribución.

Por tanto, la interfaz debe denominar el indicador **«base de cotización anualizada»** o **«ingresos observados, aproximados mediante la base de cotización»**. No debe llamarlo simplemente salario sin una explicación visible.

### Granularidad por ciclo

EDUCAbase publica para Grado Medio y Grado Superior:

- cohorte de graduación;
- primer, segundo, tercer y cuarto año tras graduarse;
- media y límites de los cinco quintiles;
- ciclo individual cuando es representativo o grupo oficial de ciclos cuando ha sido necesario agregar.

Fuentes directas:

- [Tabla de bases de cotización por ciclo-grupo de Grado Medio](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?L=0&file=famprof_2_08.px&path=%2Flaborales%2Finsercion%2Ffamprof%2Fl0%2F)
- [Tabla de bases de cotización por ciclo-grupo de Grado Superior](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?L=0&file=famprof_3_08.px&path=%2Flaborales%2Finsercion%2Ffamprof%2Fl0%2F)
- [Catálogo oficial y descargas CSV/PC-Axis/XLS de Grado Medio](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080)
- [Catálogo oficial y descargas CSV/PC-Axis/XLS de Grado Superior](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094)

En la edición consultada, la tabla presenta 34 categorías de ciclo-grupo para Grado Medio y 62 para Grado Superior. Algunas son ciclos exactos —por ejemplo, Gestión Administrativa o Desarrollo de Aplicaciones Web— y otras agrupan varios ciclos o familias. El producto debe conservar la etiqueta oficial completa del grupo; no puede atribuir a un ciclo individual una cifra publicada para una agrupación.

En FP de Grado Básico no se publica una tabla salarial equivalente por ciclo. Sí existen resultados por familia profesional.

### Granularidad territorial

EDUCAbase también publica bases de cotización por comunidad autónoma, pero el cruce es:

`grado FP × comunidad autónoma × sexo × cohorte × año de análisis × medida`

No incluye ciclo ni familia profesional. Ejemplos:

- [Grado Medio por comunidad autónoma](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?L=0&file=ccaa_2_07.px&path=%2Flaborales%2Finsercion%2Fccaa%2Fl0%2F)
- [Grado Superior por comunidad autónoma](https://estadisticas.educacion.gob.es/EducaJaxiPx/Tabla.htm?L=0&file=ccaa_3_07.px&path=%2Flaborales%2Finsercion%2Fccaa%2Fl0%2F)

Además, la comunidad autónoma de esta estadística es la ubicación del **centro docente donde se obtuvo la titulación**, no necesariamente el territorio donde la persona trabaja después.

La estadística ofrece tasas de afiliación por `familia profesional × comunidad autónoma`, pero no ofrece ese mismo cruce para las bases de cotización. No se deben confundir ambos indicadores.

### Actualización y acceso

- Periodicidad declarada: anual.
- Publicación examinada: 26 de noviembre de 2025.
- Modificación de las tablas principales: noviembre de 2025.
- Cohortes disponibles: 2011-2012 a 2022-2023; las cohortes más recientes contienen resultados provisionales y menos años posteriores observables.
- Formatos: CSV, PC-Axis y XLS mediante EDUCAbase y datos.gob.es.
- El catálogo de datos.gob.es identifica al Ministerio como publicador y enlaza su aviso legal como licencia. La aplicación debe conservar fuente, URL, fecha de actualización y no sugerir respaldo institucional.
- No se condiciona el uso de estas distribuciones a obtener una respuesta individual del Ministerio. La autorización general de reutilización y las condiciones publicadas sustituyen esa espera; si una distribución concreta incorporase en el futuro condiciones adicionales, el build deberá bloquearla hasta revisarlas.

### Limitaciones metodológicas que deben mostrarse

La metodología oficial señala que:

- los ciclos LOGSE con equivalente LOE se publican bajo la rúbrica de su equivalente;
- algunos ciclos se agrupan dentro de una familia profesional;
- se omiten resultados con menos de 50 personas en el denominador o menos de 10 en el numerador;
- `..` puede significar falta de representatividad o dato no disponible;
- no se cubren, entre otros casos, determinados autónomos afiliados a mutualidades profesionales, personas que trabajan en el extranjero y ciertos funcionarios mutualistas;
- el indicador salarial excluye jornada parcial y trabajo por cuenta propia.

Estas condiciones impiden construir rankings absolutos sin normalizar cohorte, año posterior y agrupación oficial.

## 2. Junta de Castilla y León — Estructura Salarial

La operación [Estructura Salarial de Castilla y León](https://estadistica.jcyl.es/web/es/estadisticas-temas/estructura-salarial.html) es anual y se elabora con participación del INE. Su ámbito territorial es autonómico y su unidad de referencia son trabajadores por cuenta ajena en centros de cotización de Castilla y León.

El [informe y anexo de 2023](https://estadistica.jcyl.es/web/jcyl/binarios/693/972/ES%202023.pdf?blobheader=application%2Fpdf%3Bcharset%3DUTF-8&blobnocache=true), publicado el 28 de mayo de 2025, ofrece ganancia anual y por hora. No contiene titulaciones o familias FP. Para ocupaciones tuvo que agregar los grandes grupos CNO-11 en solo tres categorías por falta de observaciones:

- alta: grupos 1, 2 y 3;
- media: grupos 4, 5, 6, 7 y 0;
- baja: grupos 8 y 9.

Este grado de agregación no permite asignar un salario a «programador», «auxiliar administrativo» o cualquier ocupación concreta de SALIDA CyL. Puede utilizarse en metodología o como contexto regional general, nunca como cifra individualizada.

## 3. Instituto Nacional de Estadística

La [Encuesta Anual de Estructura Salarial](https://ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736177025&idp=1254735976596) publica la ganancia bruta anual por trabajador. El último resultado verificado corresponde a 2024 y fue publicado el 28 de mayo de 2026.

La [tabla por sexo y grandes grupos de ocupación](https://ine.es/jaxiT3/Tabla.htm?t=28186) utiliza grandes grupos de la CNO-11. Las tablas regionales y ocupacionales no ofrecen el cruce detallado `ocupación concreta × Castilla y León × provincia` que necesitaría SALIDA CyL.

El INE proporciona una [API JSON oficial](https://ine.es/dyngs/DAB/es/index.htm?cid=1099) y descargas en formatos abiertos. Su [aviso legal](https://www.ine.es/dyngs/AYU/es/index.htm?cid=125) establece, con carácter general para la información estadística cuya fuente sea el propio INE, licencia CC BY 4.0, obligación de atribución, indicación de la fecha de actualización y prohibición de sugerir patrocinio o apoyo del organismo.

Es una fuente fiable y más reciente, pero su agregación ocupacional es insuficiente para el motor de decisión del MVP. Puede servir para contexto o contraste metodológico.

## 4. Agencia Tributaria — salarios por provincia

La estadística oficial [Mercado de trabajo y pensiones en las fuentes tributarias, ejercicio 2024](https://sede.agenciatributaria.gob.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Estadisticas/Publicaciones/sites/mercado/2024/jrubik2f988d6f79ea9247ea3f20c424927b60c7d465dc.html) ofrece asalariados, percepciones, salarios totales y salario medio anual por provincia, sector de actividad y sexo.

Es la fuente oficial examinada con mejor granularidad provincial, pero no contiene ciclo, familia FP ni ocupación CNO. El sector de actividad de una empresa tampoco equivale a la ocupación de una persona. Además, el conjunto actual de ofertas ECYL no proporciona un código CNAE estructurado que permita una unión auditable.

En consecuencia, una cifra `provincia × sector` solo podría presentarse como contexto independiente. Vincularla automáticamente a una titulación u oferta introduciría falsa precisión. Se recomienda posponerla.

## 5. SEPE — Observatorio de las Ocupaciones

El [Observatorio de las Ocupaciones del SEPE](https://www.sepe.es/HomeSepe/que-es-observatorio.html) publica estudios estatales, autonómicos y provinciales. Sus [Perfiles de la Oferta de Empleo](https://sepe.es/HomeSepe/que-es-observatorio/perfiles-de-la-oferta-de-empleo/Informacion-de-los-perfiles-de-la-oferta.html) incluyen condiciones laborales —entre ellas salario— obtenidas de muestras de ofertas para ocupaciones seleccionadas.

Estos perfiles son útiles para investigación cualitativa, pero no forman una tabla salarial completa, homogénea y estable para todas las ocupaciones. Tampoco ofrecen el cruce ciclo FP × ocupación × provincia requerido. No deben alimentar el motor salarial; como máximo pueden enlazarse como información complementaria de una ocupación cubierta.

## 6. JCyL/ECYL — ofertas de empleo

El conjunto [Ofertas de Empleo de Castilla y León](https://analisis.datosabiertos.jcyl.es/explore/dataset/ofertas-de-empleo/api/?flg=es-es) se actualiza diariamente, se consume mediante la API Explore 2.1 y está publicado bajo CC BY 4.0.

Su esquema contiene título, provincia, descripción, fecha de publicación, fuente, localidad, identificador y enlace, pero **no contiene un campo salarial estructurado**. Algunas descripciones pueden mencionar una remuneración.

Regla de producto: cuando una vacante publique salario, SALIDA CyL puede reproducir esa condición con atribución y enlace a la oferta original. No debe inferir importes, extraerlos para construir promedios comparables ni interpretar la ausencia de cifra como ausencia de información salarial en la fuente original.

## Diseño recomendado para el MVP

### Nombre y propósito

Usar **«Comparar estudios»** o **«Estudios e ingresos»**, no simplemente «Salarios». El objetivo es comparar trayectorias observadas, no predecir el sueldo del usuario.

### Tarjeta principal

**Ingresos observados de titulados de este ciclo o grupo en España**

- nombre exacto del ciclo-grupo oficial;
- cohorte seleccionada;
- primer, segundo, tercer o cuarto año después de graduarse;
- media y límites de quintiles;
- etiqueta permanente: «Base de cotización anualizada · jornada completa · España»;
- enlace «Cómo se calcula» a la metodología.

Los quintiles son preferibles a una única media porque hacen visible la dispersión. No se debe presentar un rango como si encerrase a todos los graduados.

### Tarjeta territorial separada

**Referencia de titulados de [Grado Medio/Grado Superior] en Castilla y León**

- misma cohorte y año posterior que la tarjeta nacional cuando existan;
- grado, no familia ni ciclo;
- etiqueta permanente que identifique a Castilla y León como comunidad del centro de titulación.

Texto obligatorio bajo ambas tarjetas:

> Mostramos ambas referencias por separado porque no existe una estadística oficial de ingresos por ciclo formativo en Castilla y León.

### Estados sin dato

- **Ciclo agrupado:** mostrar el grupo oficial y explicar qué ciclos incluye.
- **Dato suprimido:** «El Ministerio no publica esta cifra por falta de representatividad».
- **FP Básica sin ciclo:** ofrecer familia nacional y grado regional, siempre separados.
- **Cohorte reciente:** indicar «dato provisional» y desactivar los años posteriores todavía no observados.

## Reglas que el producto no debe vulnerar

1. No decir «ganarás», «salario esperado» o «salario en Castilla y León» para una cifra nacional por ciclo.
2. No combinar matemáticamente la referencia nacional del ciclo con la referencia regional del grado.
3. No imputar un dato de grupo a uno de sus ciclos sin mostrar la agrupación.
4. No mezclar bases de cotización, ganancia salarial INE y rendimientos tributarios AEAT como si fueran la misma magnitud o población.
5. No construir una comparación entre ciclos con distintas cohortes o distintos años posteriores.
6. No asignar la categoría salarial regional alta/media/baja de JCyL a una ocupación concreta.
7. No derivar salarios provinciales desde el sector AEAT sin un enlace CNAE oficial y explícito.

## Veredicto final

**GO para el MVP**, con EDUCAbase como fuente principal y actualización mediante snapshots CSV versionados. La pestaña añade valor real porque permite comparar no solo inserción, estabilidad y cualificación, sino también la evolución observada de ingresos después de cada ciclo.

Su fortaleza ante el jurado depende de convertir la limitación territorial en una señal visible de rigor: SALIDA CyL puede decir con precisión qué se sabe del ciclo en España y qué se sabe del grado en Castilla y León, sin fabricar el cruce que la estadística oficial no publica.
