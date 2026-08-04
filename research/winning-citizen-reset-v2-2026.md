# Reinicio adversarial: candidatura ciudadana para el X Concurso de Datos Abiertos JCyL 2026

**Fecha de corte:** 2 de agosto de 2026  
**Veredicto:** desarrollar conceptualmente **Cifra Clara**: una aplicación con tres salidas inseparables —**Cifra, Corte y Recibo**— que convierte una afirmación numérica en un cálculo reproducible, revela hasta qué fecha llega realmente el dato, comprueba cuánto depende del periodo o denominador elegido y conserva la versión consultada para mostrar revisiones posteriores.

No se recomienda construir todavía una interfaz completa. La siguiente inversión debe ser una prueba técnica de 48 horas sobre cinco series reales. Si esa prueba falla, la idea se descarta.

## 1. Las puertas reales del concurso

El [X Concurso de Datos Abiertos](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) admite Productos y Servicios que reutilicen al menos un conjunto del Portal JCyL, estén disponibles mediante una URL pública y se acompañen de una memoria de un máximo de 1.000 palabras. La convocatoria termina el **21 de septiembre de 2026**. Los siete criterios publicados son utilidad y usuarios potenciales, valor económico, valor social/público, originalidad, variedad de datos —especialmente JCyL—, facilidad/accesibilidad y calidad técnica.

La revisión local comprende los **430 conjuntos** del catálogo descargado y **256 candidaturas históricas netas** extraídas de los siete libros aportados. No aparece una candidatura que realice conjuntamente cálculo reproducible, análisis exhaustivo de cortes y conservación de la versión observada.

## 2. Filtro de muerte aplicado

Se eliminaron todas las familias ya rechazadas por el promotor: mapas, directorios, paneles, buscadores, asistentes, resúmenes, ayudas, trámites, empleo, vivienda, turismo, transporte, energía, contratación, reclamaciones, salud/riesgo, calendarios, juegos, generación creativa, proyectos administrativos y productos que necesiten datos internos o construir primero una red de colaboradores.

También se aplicó una nueva regla: **si ChatGPT, Gemini o una herramienta generativa puede producir casi el mismo resultado en una conversación, la propuesta muere**.

Por esta razón se descartan:

- un auditor de capturas de gráficos como producto principal: en 2026 ya existen prototipos basados en LLM que detectan y corrigen gráficos engañosos;
- un simple archivo de versiones: el Portal Europeo de Datos estrenó en junio de 2026 un [historial de datasets](https://data.europa.eu/it/news-events/news/history-datasets-tracking-change-and-ensuring-reliable-reuse) que permite recuperar y comparar versiones;
- un sistema genérico de alertas: colisiona con candidaturas históricas como *Ideia* y *OpoAlerta*;
- seguimiento de contratación: además de estar excluido, desplaza el producto hacia control administrativo;
- optimización de entregas de residuos: el dataset acredita autorizaciones LER, pero no que un hogar pueda entregar allí, ni horario, vigencia o capacidad;
- micro-misiones de ciencia ciudadana: sin una comunidad previa no generan valor inmediato y violan la puerta de autonomía.

## 3. La candidata: Cifra Clara

### Problema ciudadano

Una cifra puede estar correctamente calculada y aun así producir una impresión falsa porque se eligió un año excepcional, se omitió el denominador, se mezclaron granularidades, el periodo actual está incompleto o la fuente fue revisada después. Además, «procesado en 2026» no significa «contiene datos de 2026». Una captura o un enlace normal no permite reproducir qué datos y filtros se usaron.

La auditoría del catálogo JCyL encontró el problema en fuentes reales:

- `indice-de-precios-de-consumo` fue procesado el 4 de julio de 2026, pero sus observaciones terminan en diciembre de 2021;
- `indices-de-comercio-al-por-menor` fue procesado el mismo día, pero termina en diciembre de 2023 y mezcla números con al menos un decimal almacenado como texto;
- `superficies-de-cultivos-municipales` fue modificado el 30 de julio de 2026, pero termina en 2022;
- el campo `update_frequency` del `catalogo-de-datos` está vacío en los 430 registros de la extracción, y 35 no declaran licencia.

Esto da a la aplicación un problema concreto que resolver desde el primer día: separar **fecha técnica de procesamiento**, **última observación sustantiva**, **cobertura** y **versión citada**.

La Comisión Europea documenta precisamente este problema en [*Honest charts*](https://data.europa.eu/ga/publications/datastories/honest-charts-ethics-and-integrity-data-visualisation): una misma serie puede sostener relatos muy distintos al cambiar inicio, fin o granularidad, y recomienda publicar fuente, transformaciones, alcance y limitaciones.

### Qué hace la aplicación

El usuario entra por una de dos puertas:

1. **He visto una cifra.** Pega una afirmación o introduce indicador, territorio, periodo y valor. La aplicación propone una serie oficial y obliga al usuario a confirmarla.
2. **Voy a publicar una cifra.** Elige una serie y define filtros y operación mediante controles sencillos, sin escribir una consulta.

El motor realiza tres operaciones inseparables:

1. **Cifra.** Reejecuta el cálculo en la API oficial y muestra numerador, denominador, fórmula, filtros, unidad y fecha de acceso. Después enumera todas las ventanas comparables permitidas por reglas públicas —misma duración, años completos, comparación interanual y, cuando exista un denominador compatible, valor absoluto y tasa—. No elige ejemplos a favor o en contra: muestra el rango completo y si el signo cambia.
2. **Corte.** Indica la última observación realmente utilizada, la cobertura temporal y geográfica, nulos/tipos anómalos y licencia, separándolos de la fecha en que el portal reprocesó el dataset. Si no existe un campo temporal inequívoco, responde «corte no identificable» y no lo inventa.
3. **Recibo.** Genera una URL/QR permanente con los registros usados, huella, consulta y resultado. Si el dato oficial cambia después, conserva el original y muestra el antes/ahora y qué registros se añadieron, eliminaron o modificaron.

Las únicas conclusiones automáticas serían objetivas y prudentes:

- **reproducible con este corte**;
- **sensible al periodo o denominador**;
- **dato disponible hasta esta fecha, aunque el portal lo procesó después**;
- **no coincide con el cálculo seleccionado**;
- **fuente revisada desde la consulta**.

Nunca declararía que una persona miente, que una noticia es verdadera/falsa ni qué interpretación política debe aceptarse.

### Ejemplo de experiencia

Una persona ve «los nacimientos bajaron un 18 %». Comparte el texto con Cifra Clara, confirma *nacimientos, provincia, 2020–2025* y recibe:

- el porcentaje exacto obtenido con esa selección;
- todas las comparaciones de igual longitud que admite la serie;
- la evolución por provincia y el resultado por población solo si existe un denominador oficial compatible;
- un enlace de prueba que otra persona puede abrir y recalcular;
- una marca visible si JCyL revisa posteriormente cualquiera de los valores usados.

El ejemplo es funcional, no una afirmación sobre el porcentaje real: los valores solo se mostrarán tras consultar la API.

## 4. Por qué no lo sustituye una IA generalista

Un LLM puede explicar qué es el *cherry-picking* y hasta sugerir otro gráfico. No aporta por sí solo las propiedades que constituyen el producto:

- enumeración exhaustiva y determinista de todos los cortes válidos, no una selección narrativa;
- consulta reejecutable contra la API oficial con reglas y tolerancias versionadas;
- conservación del estado exacto observado en una fecha;
- comparación futura registro a registro;
- URL pública estable verificable por terceros;
- batería de pruebas que garantiza el mismo resultado para el mismo dato y versión.

La IA puede usarse opcionalmente para extraer una frase o sugerir una serie; nunca decide el resultado. Si se elimina esa capa, el producto sigue funcionando íntegramente.

## 5. Datos que sí son causales

El MVP debe comenzar con 10–15 series temporales JCyL con semántica clara, no con todo el catálogo. Candidatos confirmados:

- [Número de nacimientos en Castilla y León](https://analisis.datosabiertos.jcyl.es/explore/dataset/numero-de-nacimientos-en-castilla-y-leon/), anual y provincial.
- [Superficies de cultivos municipales](https://analisis.datosabiertos.jcyl.es/explore/dataset/superficies-de-cultivos-municipales/), anual, municipal y con más de 300.000 registros.
- [Ejecución presupuestaria de gastos](https://analisis.datosabiertos.jcyl.es/explore/dataset/ejecucion-del-presupuesto-de-la-administracion-de-la-comunidad-gastos/), mensual desde 2018 y desagregada hasta subconcepto. Se utilizaría como cifra pública, no como nuevo panel presupuestario.
- series de población de referencia por año, provincia, área, sexo y edad, únicamente como denominadores cuando definición y periodo coincidan.
- el [Catálogo de datasets](https://analisis.datosabiertos.jcyl.es/explore/dataset/catalogo-de-datos/) para detectar fuente, fecha de procesamiento, esquema y cambios del inventario.

La demostración de frescura debe incluir también [IPC](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/indice-de-precios-de-consumo) e [índices de comercio minorista](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/indices-de-comercio-al-por-menor), precisamente porque prueban que fecha de proceso y corte material pueden divergir varios años.

Pueden añadirse series neutrales de cultura, agricultura, demografía y actividad pública tras una auditoría semántica. INE o Eurostat solo aportarían contraste/denominadores; JCyL debe seguir siendo la fuente que determina el cálculo principal.

## 6. Originalidad defendible

La innovación no es «comprobar datos», «hacer un gráfico» ni «guardar versiones» por separado. Es el flujo ciudadano completo:

`afirmación → cálculo oficial → corte material → todos los periodos comparables → recibo reproducible → revisión futura visible`

El nuevo historial europeo valida que versionar datos es una necesidad pública real, pero opera a nivel de dataset. Cifra Clara baja a **la cifra, los filtros y la afirmación concreta**, y añade el análisis adversarial del corte. La [guía de citación del US Census Bureau](https://www.census.gov/about/policies/citation.html) confirma que versión/vintage, tabla, URL y fecha de acceso son elementos necesarios para descubrimiento, reutilización y replicación; la aplicación los convierte en un objeto usable por cualquier persona.

No hay colisión funcional entre las 256 candidaturas históricas. Las visualizaciones previas publican resultados; Cifra Clara permite impugnarlos o reproducirlos. Los verificadores previos consultan registros; Cifra Clara audita transformaciones numéricas y conserva evidencia.

## 7. Encaje con los siete criterios

| Criterio | Valoración adversarial | Motivo |
|---|---:|---|
| Utilidad/usuarios | 8/10 | Ciudadanos, asociaciones, docentes, estudiantes, periodistas, investigadores y creadores de contenido |
| Valor económico | 7/10 | Reduce trabajo de comprobación y permite insignias/recibos reutilizables; no debe inventarse un modelo comercial |
| Valor social/público | 10/10 | Alfabetización de datos, transparencia y debate basado en evidencia |
| Originalidad | 9/10 | Combinación sin colisión local; precedentes parciales, no clon |
| Variedad de datos | 9/10 | Núcleo multi-dataset JCyL y denominadores oficiales compatibles |
| Facilidad/accesibilidad | 8/10 | Dos entradas sencillas, sin consultas técnicas; requiere buen diseño de confirmación |
| Calidad técnica | 9/10 | Motor determinista, snapshots, hashes, diffs, pruebas y API reproducible |
| **Total orientativo** | **60/70** | No es una puntuación oficial ni una garantía de premio |

Su debilidad real es la utilidad masiva: si la interfaz parece una herramienta para analistas, fracasa. Por eso la puerta principal debe ser «he visto esta cifra» y el resultado debe comprenderse en menos de un minuto.

## 8. Alcance viable antes del 21 de septiembre

MVP obligatorio:

- web pública accesible y responsive;
- 10–15 series JCyL mediante adaptadores auditados;
- cuatro operaciones: valor, suma, media y variación porcentual;
- ventanas comparables predefinidas por serie;
- snapshots de filas usadas y comparación antes/ahora;
- recibo público con consulta, fórmula, fecha y hash;
- exportación de cita, CSV de evidencia y tarjeta accesible;
- sin cuentas; correo opcional solo para avisar de una revisión;
- tests deterministas y explicación de límites por dataset.

Fuera del MVP: OCR de gráficos arbitrarios, verificación universal de noticias, opiniones generativas, índice opaco de honestidad, blockchain, análisis causal y recomendaciones políticas.

## 9. Prueba de muerte de 48 horas

Antes de diseñar marca o pantallas completas:

1. Elegir cinco series JCyL de al menos dos temas y documentar unidad, fecha, geografía, agregaciones válidas y denominadores compatibles.
2. Construir 50 afirmaciones sintéticas: correctas, errores de cálculo, periodos incompletos, año excepcional, denominador incompatible y revisión de filas.
3. Exigir 100 % de reproducción del cálculo y cero comparaciones semánticamente inválidas.
4. Demostrar al menos diez casos donde el contexto añade información material sin afirmar «verdadero/falso».
5. Crear un recibo, modificar una copia del dataset y demostrar recuperación del original y diff exacto.
6. Probar con diez personas: ocho deben explicar correctamente, en menos de 60 segundos, qué respalda la cifra y de qué depende.

Si no se cumplen los puntos 3, 4 o 6, **Cifra Clara se descarta**. Si se cumplen, es la primera dirección de esta búsqueda que merece pasar a diseño de producto.

## 10. Decisión entre tres enfoques

1. **Cifra Clara — recomendada.** Une prueba, contexto y recibo; mejor equilibrio de ciudadanía, innovación y defensa anti-IA.
2. **Fuente Viva — reserva.** Solo archivo/diff/cita. Muy sólida técnicamente, pero demasiado cercana a la nueva función europea y más orientada a especialistas.
3. **ContraGráfico — descartada como núcleo.** Tiene demostración visual potente, pero OCR/visión aumenta el riesgo y ya existen herramientas de IA que detectan/corrigen gráficos.

La decisión recomendada es avanzar únicamente con la prueba de muerte de **Cifra Clara**, no con desarrollo completo ni con una nueva ronda de nombres.
