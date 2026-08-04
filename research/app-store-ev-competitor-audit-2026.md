# Auditoría de colisión en Google Play y App Store: repostaje y recarga en ruta

**Fecha de comprobación:** 3 de agosto de 2026  
**Candidata auditada:** optimizador de abastecimiento en ruta para combustión y vehículo eléctrico  
**Veredicto:** **NO-GO / ARCHIVAR**

## Pregunta de control

La promesa que debía sobrevivir era:

> Introducir ruta, vehículo y combustible o batería disponibles para recibir las paradas óptimas, la cantidad que conviene comprar o cargar en cada una y el coste real, incluidos desvío, tiempo y estado de la red.

La búsqueda se hizo sobre fichas actuales de Google Play y del App Store español, complementadas con documentación del propio desarrollador o del organismo titular. Las fichas de tienda son declaraciones del proveedor, no una prueba independiente de calidad o precisión. Tampoco permiten demostrar la inexistencia absoluta de cualquier aplicación. Sí permiten falsar la afirmación necesaria para el concurso —que el mecanismo central no existe— porque aparecen varios productos que cubren directamente sus partes decisivas.

## Resultado ejecutivo

La extensión a eléctricos no abre un hueco: lo cierra.

- **Eléctrico:** MapaREVE, ABRP, Google Maps, Chargemap, ChargeFinder y QuantumDrive ya calculan, con distinto alcance, ruta, batería o vehículo, paradas de carga, duración, energía, coste o batería al llegar.
- **Combustión:** GasAll ya incorpora vehículo, depósito, consumo, estaciones en ruta y coste de llegar a una estación y llenar allí. Litro ya optimiza hasta seis paradas considerando precio y kilómetros de desvío.
- **Ambas energías:** GRID ya se presenta como una sola aplicación para combustible y recarga, con precio, disponibilidad, vehículo, navegación y planificación multiparada.
- **El supuesto último diferencial:** pedir “litros exactos en cada parada” sería una mejora de cálculo pequeña y difícil de defender como innovación ciudadana cuando la elección de estaciones, el coste del desvío, el combustible necesario y las paradas factibles ya están repartidos entre productos actuales.

La puerta de colisión falla antes de ejecutar el ensayo de 50 rutas propuesto en el informe anterior.

## Matriz de productos encontrados

| Producto | Tienda y situación comprobada | Funciones declaradas relevantes | Colisión con la candidata |
|---|---|---|---|
| **MapaREVE** — Red Eléctrica de España | [Google Play](https://play.google.com/store/apps/details?hl=es&id=es.ree.mapareve) y [App Store](https://apps.apple.com/es/app/mapareve/id6755523551) | Configura capacidad de batería, potencia máxima, consumo y estados de carga; calcula ruta, paradas necesarias, distancia, tiempo, consumo, coste aproximado, batería al llegar y tiempo recomendado en cada recarga. Cuando el operador está integrado, muestra disponibilidad y tarifas dinámicas. | **Crítica.** Es un producto oficial español y coincide con casi toda la promesa eléctrica. |
| **A Better Routeplanner (ABRP)** | [Google Play](https://play.google.com/store/apps/details?id=com.iternio.abrpapp) y [App Store](https://apps.apple.com/es/app/a-better-routeplanner-abrp/id1490860521) | Modelo de vehículo y destino producen un plan completo con paradas y duración; dispone de navegación, seguimiento y recálculo. Su [documentación del producto](https://abetterrouteplanner.com/home/ca) añade perfiles de consumo, batería en tiempo real, temperatura, relieve y optimización de carga; la versión Premium incorpora tráfico, meteorología y disponibilidad en vivo. | **Crítica.** Resuelve el problema algorítmico difícil del vehículo eléctrico y lo adapta durante el viaje. |
| **Google Maps para VE** | Aplicación general; [ayuda oficial](https://support.google.com/maps/answer/9773205?hl=es) | En vehículos y regiones compatibles estima batería al llegar, añade automáticamente puntos si no se alcanza el destino, incluye el tiempo de carga en la duración y filtra por conector, red y velocidad. Apple ofrece una función análoga, con alcance limitado, en su [soporte de rutas para VE](https://support.apple.com/en-lamr/guide/iphone/iphc5e3a4b4b/ios). | **Alta.** La función se integra en la navegación que el ciudadano ya utiliza. |
| **Chargemap** | [Google Play](https://play.google.com/store/apps/details?id=com.chargemap_beta.android) y [App Store](https://apps.apple.com/es/app/chargemap-puntos-de-recarga/id438176982) | Planificador según vehículo y preferencias, terminales rápidos en ruta, potencia, conector, valoraciones, precios y seguimiento de gastos mediante Chargemap Pass. | **Alta.** Cubre planificación, adecuación al vehículo, elección y coste de la carga. |
| **ChargeFinder** | [App Store](https://apps.apple.com/es/app/chargefinder-public-charging/id1434206736) | Calcula ruta óptima, distancia a estaciones y longitud del desvío; permite seleccionar coche y editar curva de carga y consumo para obtener sugerencias óptimas; muestra precios y disponibilidad para redes compatibles. | **Crítica para el supuesto “desvío”.** Declara expresamente la longitud del desvío y la optimización según el vehículo. |
| **QuantumDrive** | [App Store](https://apps.apple.com/es/app/quantumdrive-planificador-ev/id6759058361) | Batería, salud, estilo de conducción y más de 500 modelos; paradas, tiempo, consumo, coste, batería al llegar y disponibilidad en tiempo real. | **Alta.** Reproduce prácticamente la pantalla de resultado que se iba a presentar como diferencial. |
| **Chargeprice** | [Google Play](https://play.google.com/store/apps/details?id=fr.chargeprice.app) | Compara tarifas según coche, nivel de batería, hora y tarjetas; declara planificador de rutas en su versión de 2026. | **Alta para precio real.** Demuestra que comparar el coste efectivo de recarga tampoco constituye un hueco aislado. |
| **GRID** | [Google Play](https://play.google.com/store/apps/details?hl=es&id=com.grid.application) y [App Store](https://apps.apple.com/es/app/grid-punto-de-carga-y-cargar/id6443472010) | Una aplicación para repostar y cargar; busca la estación o cargador más barato en ruta, usa precios y disponibilidad, admite vehículo, replanifica si un punto deja de estar disponible y ofrece planificador multiparada. | **Crítica para la versión unificada.** Ya formula explícitamente la promesa “combustible + electricidad + ruta + precio + multiparada”. |
| **GasAll** | [Google Play](https://play.google.com/store/apps/details?hl=es&id=com.gasall) y [App Store](https://apps.apple.com/es/app/gasall-gasolineras-espa%C3%B1a/id296739784) | Estaciones a lo largo de la ruta, precios oficiales actualizados, horarios, vehículos, combustible, capacidad del depósito, consumo y descuentos. Su calculadora indica cuánto cuesta llegar a una estación y llenar allí. | **Crítica para combustión.** Ya internaliza el consumo del desvío que el informe anterior trataba como el principal salto sobre un buscador. |
| **Litro** | [App Store](https://apps.apple.com/es/app/litro/id6761688926) | Permite elegir hasta seis paradas; analiza las gasolineras de la ruta y calcula la combinación más económica teniendo en cuenta precio, consumo y kilómetros de desvío. En junio de 2026 añadió puntos de carga para eléctricos. | **Crítica para la optimización multiparada.** Coincide de forma casi literal con la mejora propuesta. |
| **Fuelio** | [Google Play](https://play.google.com/store/apps/details?hl=es_US&id=com.kajda.fuelio) y [App Store](https://apps.apple.com/es/app/fuelio-combustible-y-gastos/id1487753318) | Registro y aprendizaje del consumo, estaciones y precios, estaciones en ruta, combustible necesario y gasto estimado del viaje; soporta unidades para combustión y electricidad. | **Media-alta.** No declara el mismo optimizador global, pero cubre los cálculos y el perfil real de consumo que se pretendían añadir. |
| **FarthestFuel** | [App Store](https://apps.apple.com/es/app/farthestfuel/id6757995607) | Parte del nivel actual del depósito y del vehículo, calcula cuándo y dónde parar, minimiza el número de paradas y aplica un margen de reserva. | **Alta para factibilidad.** El depósito inicial, alcance y reserva tampoco son elementos novedosos por separado. |

Otros productos revisados —Electromaps, PlugShare, Electra y varias calculadoras de carga— refuerzan la saturación, aunque no son necesarios para el descarte. [Electromaps](https://play.google.com/store/apps/details?hl=es_419&id=com.enredats.electromaps) y [PlugShare](https://apps.apple.com/es/app/plugshare-puntos-de-recarga/id421788217) ya cubren puntos compatibles en ruta, estado actual y, en redes compatibles, activación o pago.

## Evaluación de los tres alcances posibles

### 1. Solo vehículo eléctrico — NO-GO

La parte difícil no es dibujar cargadores, sino modelar consumo, curva de carga, estado inicial, potencia aceptada, relieve, clima, tráfico, disponibilidad, coste y tiempo. ABRP lleva años haciéndolo; MapaREVE ya ofrece en España una versión oficial con datos dinámicos; Google lo integra en coches compatibles. Un prototipo de concurso no puede prometer ser mejor con los datos y plazo actuales.

### 2. Combustión + eléctrico — NO-GO

GRID ya ocupa la posición de una sola aplicación para ambos tipos. Además, la solución unificada tendría que igualar simultáneamente la calidad de GasAll/Litro en carburantes y la modelización de ABRP/MapaREVE en eléctricos. La amplitud aumenta el riesgo técnico y reduce la credibilidad del prototipo.

### 3. Solo combustión con litros exactos — NO-GO

Es la variante con una diferencia literal residual, pero no una diferencia de producto suficiente:

- GasAll calcula el coste de llegar y llenar según depósito y consumo.
- Litro elige combinaciones de hasta seis paradas considerando precio y desvío.
- FarthestFuel usa nivel inicial, alcance y reserva para decidir paradas.
- Fuelio calcula combustible necesario y gasto del viaje.

No se ha verificado en las fichas una aplicación que declare exactamente una compra óptima expresada en litros para **cada** una de varias paradas de combustión. Esa ausencia en las descripciones no prueba que no exista y, aunque fuera cierta, solo deja una optimización marginal. Obligar al usuario a fraccionar el repostaje para ahorrar unos céntimos puede empeorar la experiencia y es una historia débil frente al jurado.

## Por qué los datos de Castilla y León no rescatan la idea

Añadir incidencias de la red autonómica no crea por sí solo una nueva decisión:

- ABRP y Google ya incorporan tráfico o recálculo en sus ámbitos compatibles.
- La capa de incidencias de la Junta cubre su propia red y necesita geocodificación por carretera y punto kilométrico; no sustituye un servicio integral de tráfico.
- Una procedencia pública y una explicación auditable son cualidades valiosas, pero no constituyen beneficio ciudadano suficiente si el resultado ya lo ofrecen aplicaciones consolidadas.
- Para recarga eléctrica, la disponibilidad y las tarifas dinámicas más valiosas están en REVE y en integraciones de operadores; no se ha demostrado una API abierta y estable que permita a una candidatura igualar la aplicación oficial.

## Decisión

Se revoca el anterior **GO condicional** del optimizador de repostaje.

> **Lo Justo: NO-GO por colisión de mercado demostrada. No desarrollar, no ejecutar el ensayo de 50 rutas y no ampliar a eléctricos.**

La auditoría no dice que las aplicaciones existentes sean perfectas. Dice algo más relevante para el concurso: ya no puede defenderse que esta candidatura transforme los datos en una acción que el mercado no resuelva. Combinar funciones conocidas o añadir “litros exactos” no alcanza el umbral de innovación buscado.

## Nueva puerta obligatoria para futuras ideas

Antes de elevar cualquier concepto a finalista:

1. Formular la promesa en una sola pregunta ciudadana.
2. Buscar esa pregunta y sus verbos funcionales en español e inglés en Google Play y App Store.
3. Revisar al menos productos oficiales, líderes de categoría y aplicaciones pequeñas recientes; Litro demuestra que mirar solo a las marcas conocidas no basta.
4. Construir una matriz de funciones, no comparar nombres o sectores.
5. Descartar si un producto oficial cubre el núcleo o si dos productos existentes cubren conjuntamente la supuesta ventaja sin que la nueva combinación produzca una decisión materialmente distinta.
6. Solo después validar datos y construir prototipo.

