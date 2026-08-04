# Ronda v4 — reinicio adversarial de aplicación ciudadana (2026)

## Veredicto ejecutivo

**Cero supervivientes autorizadas para desarrollo.** Esta ronda no encuentra una candidata que, al mismo tiempo, sea una aplicación ciudadana amplia, complete una acción real, dependa materialmente de datos abiertos de Castilla y León, funcione sin acuerdos externos y evite los terrenos ya descartados.

No faltan mecanismos interesantes. Falta el activo operativo que los hace verdaderamente útiles. Los productos oficiales sólidos encontrados disponen de al menos uno de estos cuatro activos:

1. precios o transacciones actuales por producto;
2. disponibilidad, reserva o capacidad en tiempo casi real;
3. un identificador oficial adoptado por quienes deben actuar;
4. reglas completas y computables conectadas a una transacción oficial.

El catálogo JCyL ofrece sobre todo estadísticas, directorios, registros administrativos, textos y calendarios. Forzar cualquiera de ellos a responder una pregunta individual produciría exactamente lo que ya se prohibió: mapa, directorio, verificador, asistente general o recomendación insegura.

La criba deja **tres finalistas de investigación, pero las tres mueren**: un preflight de expedientes, un simulador de conflictos de consumo y una tarjeta rural de últimos 100 metros. Las puntuaciones narrativas no levantan una puerta dura fallida.

## 1. Puertas duras aplicadas

Una idea solo podía sobrevivir si cumplía las siete condiciones siguientes:

- la entiende una persona en menos de treinta segundos;
- termina una tarea, no solo informa, enseña o alerta;
- el dato JCyL cambia el resultado central; al retirarlo, la aplicación deja de funcionar;
- no necesita convenio, inventario privado, expediente autenticado, comunidad previa ni adopción institucional;
- no da consejo jurídico, médico, financiero, técnico o de seguridad;
- no es sustituible por Google Maps, una hoja de cálculo, un editor de PDF o un LLM general;
- no repite las categorías ni las ideas ya descartadas en esta investigación.

La puntuación de concurso se usa después de esas puertas, no al revés.

## 2. Qué enseñan los productos oficiales de otros países

| Continente / producto oficial | Acción que sí completa | Activo invisible que la hace posible | Consecuencia para Castilla y León |
|---|---|---|---|
| América del Sur — [Menor Preço Brasil](https://receita.fazenda.rs.gov.br/conteudo/20858/) y [Nota Paraná](https://www.notaparana.pr.gov.br/servicos/Cidadao/Nota-Parana-e-Menor-Preco/Pesquisar-precos-Menor-Preco-do-Nota-Parana-dYo9jKNL) | Buscar por nombre o código de barras y ver precios cercanos recién practicados | Flujo fiscal de ventas; Paraná actualiza cada vez que un comercio vende y el sistema brasileño declara haber procesado decenas de miles de millones de facturas | Una interfaz parecida sin tickets fiscales abiertos sería una maqueta, no una comparación de precios |
| África — [MOPRI, Mauricio](https://mopri.govmu.org/frequently-asked-questions) | Crear una cesta y comparar dos supermercados | Encuesta pública mensual de 100 productos, 462 marcas y 51 comercios; además hubo colaboración institucional con comercios y asociaciones | El catálogo JCyL no contiene precios, marcas comparables, tamaños ni disponibilidad |
| Asia — [Unpacked, Singapur](https://www.hack.gov.sg/2025/unpacked/) | Vivir una estafa ficticia completa y recibir un post mortem | Guion diseñado, secuencia, audio/documentos simulados y objetivos de aprendizaje; estado oficial: lanzamiento limitado | Valida el mecanismo didáctico, pero no convierte casos jurídicos antiguos en una decisión segura para una compra real |
| Asia — [AisleFind, Singapur](https://www.hack.gov.sg/2026/aislefind/) | Recomendar productos según una petición alimentaria | Base de 200.000 productos, pero sin inventario local; el propio equipo informa que 3 de 5 usuarios no guardaron la recomendación porque no sabían si encontrarían el producto | Es la prueba oficial de que catálogo sin disponibilidad no cierra la compra; el proyecto figura como **no activo** |
| Europa — [Eircode, Irlanda](https://www.gov.ie/en/department-of-culture-communications-and-sport/policy-information/eircode/) | Dar un identificador único a cada domicilio para que servicios y entregas lo localicen | Sistema nacional asignado a cada propiedad, base de direcciones mantenida e integración pública/privada; en 2025 el Gobierno comunicó un [97 % de conocimiento validado](https://www.gov.ie/en/department-of-culture-communications-and-sport/press-releases/irelands-national-postcode-system-eircode-celebrates-10th-anniversary/) | Un QR creado por una aplicación no adquiere por sí solo reconocimiento postal, logístico o de emergencias |
| Norteamérica — [USDA Food Buying Guide](https://www.fns.usda.gov/tn/fbg/app) | Comparar rendimientos y calcular cuánto alimento comprar | Tablas ensayadas de rendimiento comestible, formas de compra y porciones para programas de nutrición estadounidenses | El mecanismo es bueno, pero los productos/formas estadounidenses no enlazan con los productos JCyL ni con el comercio español |
| España — [Mi Carpeta Ciudadana](https://estaticoscarpeta.carpetaciudadana.gob.es/) | Consultar documentos, escritos, notificaciones y expedientes y continuar en el registro oficial | Identidad Cl@ve e interoperabilidad con organismos públicos | Una aplicación externa puede preparar archivos, pero no certificar que el expediente está completo ni cerrar su presentación |

Conclusión transversal: **la innovación ganadora no está en el escáner, el chatbot o el QR; está en el dato operativo y en el cierre de la acción.**

## 3. Auditoría del sustrato real JCyL

Se volvió a revisar el [catálogo oficial mediante su API](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets?limit=1), que en el corte contiene 430 conjuntos. Los activos más cercanos a una aplicación masiva presentan estas fronteras:

- [Trámites](https://analisis.datosabiertos.jcyl.es/explore/dataset/tramites/information/) tiene 845 registros y actualización diaria. Incluye solicitantes, requisitos, formularios, plazos, legislación y documentos, pero buena parte del contenido es HTML narrativo, con condiciones y excepciones no modeladas como reglas. Tampoco publica un esquema uniforme de nombres, formatos, tamaños y canales de subida que permita certificar un paquete.
- [Casos de arbitraje de consumo](https://analisis.datosabiertos.jcyl.es/explore/dataset/casos-de-arbitraje-de-consumo/information/) contiene 102 casos y sí separa relato del consumidor, respuesta de la empresa y decisión arbitral. Sin embargo, la [consulta agregada de fechas](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/casos-de-arbitraje-de-consumo/records?select=min%28fecha_de_modificacion%29%20as%20minfecha%2Cmax%28fecha_de_modificacion%29%20as%20maxfecha&limit=1) devuelve la misma modificación, 18 de febrero de 2014, para todo el corpus.
- [Productos Tierra de Sabor](https://analisis.datosabiertos.jcyl.es/explore/dataset/productos-de-la-marca-tierra-de-sabor/information/) suma 4.905 filas, pero sus campos son producto, marca, empresa, sección, categoría, variedad y figura de calidad: no hay GTIN/EAN, presentación, peso, precio, comercio ni stock.
- [Establecimientos comerciales](https://analisis.datosabiertos.jcyl.es/explore/dataset/establecimientos-comerciales/information/) localiza comercios y CNAE, pero no publica horario efectivo, inventario ni precios; por tanto, solo permite directorio o contexto.
- [IPC JCyL](https://analisis.datosabiertos.jcyl.es/explore/dataset/indice-de-precios-de-consumo/information/) tiene 240 observaciones y termina en diciembre de 2021, aunque el portal lo haya reprocesado después. No puede alimentar una decisión de compra en 2026.
- [Límites municipales](https://analisis.datosabiertos.jcyl.es/explore/dataset/municipio-limites-categorias-est/information/) y [registro de municipios](https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-municipios-de-castilla-y-leon/information/) no constituyen una base de puntos de domicilio, entradas de finca o identificadores aceptados por operadores.

## 4. Embudo amplio antes de elegir finalistas

| Mecanismo explorado | Pregunta ciudadana | Descarte adversarial |
|---|---|---|
| Cesta de precios actual | «¿Dónde me cuesta menos esta compra hoy?» | No existe flujo abierto de precios/ventas; MOPRI y Menor Preço demuestran que ese flujo es el producto |
| Memoria personal de precios | «¿Está este envase más caro que la última vez?» | Funciona con datos introducidos por la persona, pero el dato JCyL desaparece sin cambiar nada; es un tracker genérico |
| Compra por rendimiento comestible | «¿Qué formato da más comida útil por euro?» | USDA aporta medias estadounidenses; Tierra de Sabor no aporta EAN, peso, precio o merma; transferencia no auditable |
| Recomendación de productos | «¿Qué producto cumple lo que busco y dónde está?» | Chatbot/catálogo genérico; AisleFind confirma que sin disponibilidad local la acción se corta |
| Comparación de combustible | «¿Compensa desviarme para repostar?» | Fuente causal estatal, varias aplicaciones existentes y candidatura regional previa; JCyL queda secundaria |
| Mantener, reparar o sustituir | «¿Qué hago con este aparato?» | EPREL describe el modelo, no el estado de la unidad ni la vida añadida por reparar; ya descartada |
| Comprobar retirada o alerta | «¿Este producto está afectado?» | Verificador y riesgo; el dato autonómico no identifica la unidad concreta |
| Acceso público a libros/cine | «¿Puedo obtenerlo públicamente antes de comprar?» | Bloqueada por falta de API autorizada de disponibilidad y reserva; ya auditada como Público Primero |
| Preflight documental | «¿Tengo preparados los archivos explícitos de este trámite?» | Pasa al top 3 y muere en la prueba específica de la sección 5 |
| Simulación de conflicto | «¿Detectaría la escalada antes de aceptar?» | Pasa al top 3 y muere por utilidad didáctica, antigüedad y responsabilidad |
| Dirección rural compartible | «¿Cómo consigo que lleguen a la entrada correcta?» | Pasa al top 3 y muere por colisión y falta de identificador adoptado |
| QR de objeto perdido | «¿Cómo pueden avisarme sin ver mis datos?» | Necesita registro y adopción física; el dato público solo justifica el problema |
| Transporte en contexto | «¿Cuándo pasa el siguiente servicio aquí?» | API/horario operativo y señal física; colisión con apps existentes y categoría transporte saturada |
| Residuos con siguiente paso | «¿Dónde aceptan hoy este objeto?» | El registro autoriza gestores, pero no garantiza atención doméstica, horario, cita o capacidad; Residuo Claro descartada |
| Calendario familiar integrado | «¿Qué días quedan sin cobertura?» | Operación resoluble con calendario común y dirección ya descartada |
| Simulación de riesgo doméstico o rural | «¿Qué debería hacer ante este riesgo?» | Responsabilidad técnica/seguridad expresamente excluida |
| Ayudas, empleo o formación | «¿Qué me corresponde o qué elijo?» | Ámbitos saturados y excluidos; los productos fuertes necesitan reglas o expedientes que no están abiertos |
| Artefacto, juego o cuestionario estadístico | «¿Qué aprendo o creo con estos datos?» | Demostrable pero no termina una necesidad importante; categorías creativa/didáctica ya rechazadas por el promotor |

## 5. Las tres finalistas y la causa exacta de muerte

### 5.1 Expediente Cero — preflight local de documentos

**Pregunta ciudadana:** «Ya he elegido este trámite: ¿tengo localizados y ordenados los documentos que la ficha oficial menciona explícitamente antes de abrir la sede?»

**Operación propuesta:**

`IAPA/SIA o enlace elegido → extracción literal de requisitos y adjuntos publicados → la persona añade archivos localmente → comprobación de presencia, extensión, tamaño y caducidad solo cuando la fuente lo expresa → nombres ordenados + manifiesto con citas → apertura de la presentación oficial`

**Datos exactos:** [Trámites](https://analisis.datosabiertos.jcyl.es/explore/dataset/tramites/information/), sus documentos asociados y enlaces a la sede. El procesamiento sería local; la aplicación no leería un expediente ni declararía elegibilidad.

**Por qué no sería un editor PDF ni una herramienta administrativa:** no modifica contenido, no rellena formularios, no decide requisitos y no sirve al órgano gestor. Su única función defendible sería preparar, en el dispositivo del ciudadano, los archivos que la ficha pública enumera y conservar un manifiesto reproducible de fuente y fecha.

**Causa exacta de muerte:** esa versión prudente no puede decir «expediente completo». Los requisitos y excepciones están expresados en lenguaje natural, dependen de circunstancias personales y la sede puede imponer restricciones técnicas no estructuradas en el dataset. Un falso positivo puede provocar una subsanación o pérdida de plazo. Si se elimina esa promesa y solo comprueba que hay un archivo con cierto nombre/extensión, el producto cae a **checklist + renombrador**, no termina la presentación ni supera a un gestor de archivos y la información/archivo oficial disponible en [Mi Carpeta Ciudadana](https://estaticoscarpeta.carpetaciudadana.gob.es/). Un ZIP tampoco es un resultado universal: cada procedimiento puede exigir cargas separadas y el catálogo no ofrece un contrato de subida común.

**Veredicto:** **NO-GO**. No muere por ser para la Administración —el usuario sería ciudadano— ni por ser editor PDF. Muere porque la única promesa de alto valor es jurídicamente insegura y su versión segura es demasiado pequeña y colisiona con utilidades comunes.

### 5.2 Caso a Caso — simulación de conflictos de consumo

**Pregunta ciudadana:** «¿Reconocería las señales y conservaría las pruebas adecuadas antes de que un conflicto cotidiano empeore?»

**Operación propuesta:**

`elegir materia → vivir una versión fiel y anonimizada de un caso → tomar 3–5 decisiones → revelar relato del consumidor, respuesta empresarial y laudo real → tarjeta de aprendizaje y enlace oficial`

**Datos exactos:** 102 [casos de arbitraje de consumo JCyL](https://analisis.datosabiertos.jcyl.es/explore/dataset/casos-de-arbitraje-de-consumo/information/). Competidor/mecanismo: [Unpacked](https://www.hack.gov.sg/2025/unpacked/), simulación oficial de estafa en lanzamiento limitado.

**Causa exacta de muerte:** puede reconstruir casos fieles, pero no resolver un conflicto actual. Los 102 registros tienen fecha de modificación de 2014; un laudo depende de hechos, pruebas, empresa, adhesión arbitral y normativa de su momento. Si la aplicación extrapola «qué hacer» entra en consejo jurídico; si no extrapola, termina en aprendizaje didáctico, categoría ya rechazada. Además, Unpacked demuestra que la simulación en sí no es original.

**Veredicto:** **NO-GO**. Buen uso narrativo del dato, mala adecuación a la exigencia de una acción ciudadana terminada y segura.

### 5.3 Últimos 100 m — tarjeta de llegada rural

**Pregunta ciudadana:** «¿Cómo comparto la entrada exacta, el último giro y una referencia visible para que una visita o entrega llegue a la primera?»

**Operación propuesta:**

`marcar entrada → añadir fotografía y dos instrucciones → generar tarjeta ligera/offline con coordenada, código y QR → compartir → abrir navegación hasta la entrada`

**Datos exactos:** límites y municipios JCyL como contexto; ortofoto/cartografía pública para representar el acceso. Referentes: [Eircode](https://www.gov.ie/en/department-of-culture-communications-and-sport/policy-information/eircode/) y [Plus Codes](https://maps.google.com/pluscodes/).

**Causa exacta de muerte:** Plus Codes ya genera gratuitamente un código para cualquier punto, funciona offline y se comparte desde Google Maps. Añadir foto e instrucciones es útil, pero es una capa sobre el pin. Eircode no ganó utilidad por el formato del código: la obtuvo porque Irlanda asignó un identificador a cada domicilio, lo mantiene y consiguió adopción de servicios y operadores. JCyL no publica en el catálogo una base equivalente de domicilios/entradas ni la aplicación del concurso puede imponer su aceptación. Los límites municipales no cambian la tarjeta y quedan decorativos.

**Veredicto:** **NO-GO**. Problema real y especialmente rural, pero colisión directa, uso autonómico no material y dependencia de adopción ajena.

## 6. Puntuación homogénea

Escala 0–5 por criterio: `U` utilidad, `E` valor económico, `S` valor público/social, `O` originalidad, `V` variedad/uso de datos, `F` facilidad/accesibilidad y `T` calidad técnica.

| Finalista | U | E | S | O | V | F | T | Total / 35 | Puerta dura |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Expediente Cero | 4 | 3 | 4 | 3 | 4 | 4 | 3 | **25** | Responsabilidad si certifica; trivialidad si no certifica |
| Caso a Caso | 3 | 2 | 4 | 3 | 3 | 5 | 3 | **23** | No cierra acción; dato antiguo y frontera jurídica |
| Últimos 100 m | 4 | 3 | 4 | 2 | 2 | 5 | 4 | **24** | Colisión Plus Codes; JCyL decorativo; adopción externa |

Ninguna alcanza siquiera 28/35 y las tres incumplen al menos una condición no negociable. No deben conservarse como «reservas» para reinterpretarlas más tarde.

## 7. Qué dato nuevo cambiaría de verdad el resultado

Esta auditoría permite especificar, sin más brainstorming, qué publicación abriría una dirección competitiva:

1. **Compra:** flujo anonimizado de producto/GTIN, presentación, precio, comercio y hora, como el sistema fiscal brasileño; o un observatorio con método y cobertura como MOPRI.
2. **Servicios culturales:** API pública documentada de disponibilidad, edición, reserva y deep-link de RABEL/eBiblio/CineCyL.
3. **Trámites:** requisitos condicionados como reglas versionadas más un esquema técnico de adjuntos y handoff oficial que devuelva recibo; el HTML descriptivo no basta.
4. **Dirección rural:** puntos de domicilio/entrada con identificador oficial, mantenimiento y compromiso de uso de operadores públicos; un nuevo QR no basta.

Hasta que exista uno de esos activos, cambiar el nombre o añadir IA no corrige la carencia.

## Decisión final de la ronda v4

> **NO DEVELOPMENT. Cero supervivientes.**

La mejor decisión posible con la evidencia disponible es no gastar tiempo en prototipar estas tres direcciones. La siguiente acción racional no es otra lluvia de nombres: es elegir qué restricción se permite relajar o conseguir la publicación/acceso de un dato operativo concreto. Mantener todas las restricciones y exigir simultáneamente una aplicación ciudadana masiva, novedosa, segura y materialmente JCyL conduce, con el catálogo actual, a cero candidatas honestas.

## 8. Comprobación histórica completa y colisiones propias

Se revisaron las 183 entradas contenidas en los cinco ficheros históricos `tabla*.xlsx`, además de las candidaturas de 2024 y 2025. La revisión no encontró una mecánica ciudadana valiosa que hubiese quedado sin explotar; confirmó una saturación especialmente alta en:

- turismo, patrimonio, naturaleza, rutas y agendas culturales;
- movilidad, transporte y optimización de recorridos;
- empleo, formación, universidad, emprendimiento y ayudas;
- energía, calidad del aire, polen, salud y predicción de riesgos;
- comercio local, consumo, residuos y directorios;
- BOCYL, chatbots, alertas y simplificación de información pública;
- juegos, cuestionarios y recursos didácticos genéricos.

También se comprobaron dos productos ya desarrollados por el promotor. [Madrid Refugio](https://madridrefugio.es/) ya calcula rutas con menor exposición térmica usando edificios, arbolado, agua y refugios. [València Proactiva](https://vlcproactiva.es/) ya transforma eventos y movilidad en impacto estimado y alternativa verificable. Esto elimina como supuesta novedad tanto las rutas de sombra o confort como los planificadores de alternativas ante eventos y tráfico.

## 9. Auditoría de flujos operativos del catálogo completo

La inspección de los 430 conjuntos del catálogo confirma que los pocos flujos suficientemente actuales se concentran en ámbitos ya saturados o excluidos:

- agenda cultural, con actualización cada cuatro horas;
- incidencias viarias;
- trámites y BOCYL, con actualización diaria;
- estaciones climáticas de InfoRiego;
- empleo y formación;
- polen y otros datos de salud;
- certificados energéticos;
- horarios y rutas de bibliobuses.

El conjunto de colectas de sangre no puede sostener una aplicación de oportunidad actual: en el corte del 3 de agosto de 2026, su fecha más reciente es el 30 de junio de 2026. Además, ya existe la candidatura histórica «Soy Donante Castilla y León». El inventario de información pública tampoco descubre un flujo oculto de capacidad o reserva: de 598 activos, 296 son anuales, 123 puntuales y solo 13 diarios, 9 semanales y 1 se actualiza cada cuatro horas.

## 10. Gate técnico definitivo de Público Primero

La [aplicación oficial Biblio JCyL](https://play.google.com/store/apps/details?id=com.bibliotecas.bibliojcyl) se actualizó en julio de 2026 y permite consultar el catálogo y operar con reservas. Se verificó su implementación para comprobar si utilizaba una interfaz técnica distinta del catálogo web.

Resultado:

1. La aplicación no consulta una API pública de títulos o ejemplares; abre el WebView oficial `https://rabel.jcyl.es/cgi-bin/opacmovil`.
2. El flujo público permite iniciar sesión anónima, buscar una obra y abrir su ficha.
3. La ficha sí contiene ejemplares, biblioteca, sucursal y estado operativo, incluidas fechas como «Disponible después de 19/08/2026».
4. Sin embargo, las rutas son sesiones HTML efímeras bajo `/cgi-bin/`; el propio `robots.txt` excluye esa zona, no existe contrato de API, licencia específica de reutilización, esquema estable ni enlace de reserva interoperable.
5. El antiguo servidor Z39.50 documentado ya no resuelve; el servidor actual responde, pero no se ha publicado una base o perfil que permita consultar existencias de forma autorizada.

Por tanto, la existencia del dato visible no resuelve el gate. Utilizarlo como backend exigiría scraping de una ruta excluida y dependiente de sesión. **Público Primero conserva una buena propuesta de valor, pero sigue en NO-GO técnico y jurídico para el concurso.**

## 11. Última búsqueda internacional: qué sí se puede transferir y qué no

La revisión adicional de proyectos oficiales vuelve a confirmar que los productos ciudadanos fuertes poseen un activo operativo que aquí falta:

- los comparadores de precios disponen de tickets fiscales o encuestas institucionales;
- los recomendadores de productos necesitan inventario o disponibilidad;
- los planificadores de transporte necesitan horarios y capacidad utilizables;
- los simuladores de prestaciones codifican reglas y conectan con el trámite real;
- las aplicaciones cívicas de votación necesitan decisiones nominales estructuradas, no únicamente diarios de sesiones en PDF;
- los sistemas de reparto justo requieren una plataforma oficial que asigne realmente las plazas.

También se evaluó un calculador electoral inspirado en herramientas checas. Castilla y León publica resultados electorales de 2026, pero las Cortes no ofrecen un conjunto estructurado de votaciones nominales por procurador o grupo. Basarlo en programas electorales reintroduciría datos no abiertos, sesgo editorial y una utilidad episódica. No supera el gate.

## 12. Veredicto consolidado

La nueva investigación no produce una idea mejor; produce una conclusión más firme:

> **Con todos los requisitos actuales, no existe en los datos disponibles una candidata que sea simultáneamente masiva, novedosa, accionable, segura, técnicamente independiente y causalmente JCyL.**

Presentar ahora otra marca supondría ocultar una de estas cuatro carencias: disponibilidad, capacidad/reserva, reglas ejecutables o identificadores adoptados. El avance correcto exige relajar una condición de producto o conseguir uno de esos activos; no otra ronda de nombres.
