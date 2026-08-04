# Reinicio v3: aplicaciones ciudadanas oficiales cruzadas con datos JCyL

**Fecha de corte:** 3 de agosto de 2026  
**Alcance:** investigación y descarte; no se ha implementado ningún producto.  
**Veredicto actualizado tras los gates:** **MismoPliego queda descartada**. La cobertura y vigencia del registro CEE sí eran suficientes, pero el conjunto no contiene mediciones, composición constructiva ni alcance técnico para generar una solicitud de obra realmente comparable sin inventar datos o pedir al ciudadano que haga el trabajo de un técnico. La búsqueda ampliada deja una nueva candidata condicional, **AGUANTA**, que transforma la etiqueta oficial de móviles y tabletas en un objetivo personal de años de uso, conserva una ficha local durante la propiedad y termina en una instalación autorizada de Castilla y León. No se considera ganadora todavía: debe demostrar una diferencia de uso sustancial frente al comparador de EPREL y Repair Score.

Las secciones 5–7 conservan la hipótesis y el gate original de MismoPliego para dejar trazabilidad. Las secciones 8–10 documentan su muerte y la nueva dirección; **prevalecen sobre el veredicto anterior**.

## 1. Qué exige realmente el concurso

El [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) exige que Productos y Servicios use al menos un conjunto del Portal JCyL, sea accesible por una URL pública y documente sus méritos en una memoria de hasta 1.000 palabras. Según las [bases vigentes](https://datosabiertos.jcyl.es/web/jcyl/binarios/742/958/IAPA_2377_BBRR_TRA_483_2020_yModificaci%C3%B3n,1.pdf?blobheader=application%2Fpdf%3Bcharset%3DUTF-8&blobnocache=true), los siete criterios de Productos pesan por igual: utilidad, valor económico, valor público/social, originalidad, variedad de datos, facilidad/accesibilidad y calidad técnica. La originalidad puede consistir en una mejora relevante frente a un servicio existente; no obliga a inventar un sector jamás tratado.

La criba se cruzó con:

- el palmarés oficial de las [ediciones I–IX](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/ediciones-anteriores.html);
- las candidaturas aportadas en `CandidaturasWeb2024.xlsx` y `CandidaturasWeb2025.xlsx`;
- los 430 conjuntos devueltos por la [API del catálogo JCyL](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets?limit=1);
- el esquema, muestras y cobertura efectiva de cada conjunto candidato, no solo su título.

### Puertas de descarte

Una idea muere si falla cualquiera de estas puertas, aunque su puntuación narrativa parezca buena:

1. **Dato JCyL material:** una fila de la Junta debe cambiar el resultado. No basta para justificar el problema.
2. **Operación ciudadana completa:** entrada corta → cálculo o transformación → salida utilizable → acción posible.
3. **Autonomía del MVP:** la demostración no puede depender de que antes cooperen comercios, operadores, policía, centros, instaladores o una masa crítica de usuarios.
4. **Responsabilidad acotada:** no diagnosticar, certificar, interpretar jurídicamente ni garantizar seguridad, ahorro o disponibilidad.
5. **Distancia histórica:** una mejora debe cambiar el mecanismo, no solo el nombre o la interfaz.
6. **Ventaja estructural frente a IA generalista:** el valor debe residir en datos actuales, reglas, cálculo, estado o un artefacto reproducible.
7. **Demostración fuerte:** el jurado debe poder completar la acción en pocos minutos con datos reales.

## 2. Mecanismos oficiales nuevos examinados

Los referentes confirman qué convierte un conjunto público en producto y también qué activos faltan en JCyL:

- **Contexto físico → resultado sin búsqueda.** [Better Bus Timing](https://www.hack.gov.sg/2026/bus/) permite escanear o tocar el identificador de una parada y carga directamente llegadas en vivo. Su ventaja no es un mapa, sino eliminar la búsqueda mediante QR/NFC y usar una API operativa.
- **Simulación completa → post mortem.** [Unpacked](https://www.hack.gov.sg/2025/unpacked/) hace vivir una estafa ficticia y explica la manipulación al final. La innovación está en la secuencia, los estados y las consecuencias, no en resumir consejos.
- **Recursos limitados → sacrificios visibles.** [Tamagotcha](https://www.hack.gov.sg/2025/tamagotcha/) obliga a repartir dinero y vidas ante dilemas de cuidado; cada elección altera el estado del juego.
- **Responder antes de ver el dato.** [100 Europeans](https://data.europa.eu/en/news-events/news/eu-datathon-2022-teams-behind-apps-meet-100-europeans) contrasta la intuición del usuario con datos europeos normalizados. Es una buena experiencia didáctica, pero no resuelve por sí sola una tarea cotidiana.
- **Etiqueta física → registro oficial comparable.** [EPREL](https://energy-efficient-products.ec.europa.eu/eprel_en), de la Comisión Europea, enlaza el QR obligatorio de una etiqueta energética con datos normalizados de más de un millón de productos y permite compararlos.
- **Simular → exportar para actuar.** El servicio público francés [Mes Aides Réno](https://mesaides.france-renov.gouv.fr/?iframe=1) permite exportar el resultado para compartirlo con asesor o profesional. El archivo reutilizable forma parte de la operación, no es un adorno final.
- **Dato oficial → borrador ciudadano previo al experto.** El artículo 12.6 de la [Directiva (UE) 2024/1275](https://www.boe.es/buscar/doc.php?id=DOUE-L-2024-80664&lang=es) contempla una herramienta con la que propietarios puedan simular un proyecto simplificado de pasaporte de renovación. El pasaporte real, en cambio, debe expedirlo una persona cualificada tras visita in situ; esa frontera es esencial.
- **Un clic → artefacto mediático.** El finalista oficial de Tokio [5秒インフルエンサー](https://odhackathon.metro.tokyo.lg.jp/collection/40/?year=2025) genera un vídeo corto a partir de noticias y datos del zoo. Es una transformación clara, pero hoy una capa generativa común puede copiar gran parte de su valor.
- **QR propio → devolución.** El proyecto de Tokio [sistema de objetos perdidos](https://odhackathon.metro.tokyo.lg.jp/collection/44/?year=2025) genera etiquetas QR que permiten identificar y avisar a quien perdió un objeto. El dato público solo cuantifica el problema; la solución necesita un registro nuevo y adopción.
- **Prueba física → recompensa.** [Journey to the North](https://2024.hackerspace.govhack.org/projects/journey_to_the_north), reconocido por [GovHack 2024](https://govhack.org/2024-winners/), usa localización y fotografías para verificar retos. Funciona porque dispone de imágenes, lugares e incentivos; trasladarlo a patrimonio regional repite turismo y necesita moderación o colaboradores.
- **Conducta situada → incentivo.** [OFF PEAK LINER](https://odhackathon.metro.tokyo.lg.jp/collection/93/?year=2024) comprueba lugar y franja horaria antes de entregar una ventaja. Sin validaciones de uso ni presupuesto de incentivos, el mecanismo no existe.

La inferencia común es simple:

`datos descriptivos ≠ producto operativo`

Para cerrar una acción hace falta al menos uno de estos activos: estado vivo, inventario o plaza, transacción, prueba verificable, modelo causal válido o un artefacto calculado con restricciones reales.

## 3. Lo que el catálogo JCyL permite y lo que no

### Activo excepcional que sí permite calcular

El conjunto [Certificados de Eficiencia Energética de Edificios](https://analisis.datosabiertos.jcyl.es/explore/dataset/certificados-de-eficiencia-energetica/information/) contiene **348.864 registros** en la consulta de corte, con datos hasta el 31 de julio de 2026 y actualización diaria. Incluye inscripción, vigencia, provincia, municipio, dirección, referencia catastral, uso y tipo de edificio, normativa, demanda de calefacción/refrigeración, energía primaria, emisiones y calificaciones. Es uno de los pocos activos regionales que puede aportar una línea base oficial individual y, a la vez, cohortes de comparación suficientemente grandes.

Límites que no se pueden maquillar:

- energía primaria no equivale a consumo facturable;
- demanda energética no equivale a factura real;
- un certificado no describe el estado constructivo actual ni sustituye una inspección;
- puede haber varias inscripciones de una misma referencia y certificados caducados;
- no deben mostrarse viviendas vecinas: solo agregados de cohortes con tamaño mínimo.

Otros conjuntos energéticos no deben forzarse para sumar variedad. [Auditorías energéticas](https://analisis.datosabiertos.jcyl.es/explore/dataset/auditorias-energeticas-en-castilla-y-leon/information/) tiene 13.153 resultados hasta junio de 2026, pero corresponden a empresas que comunican auditorías bajo el RD 56/2016 y no detallan tipo de edificio ni actuación; no permiten predecir la reforma de un hogar. [Salas de calderas](https://analisis.datosabiertos.jcyl.es/explore/dataset/calderas/information/) tiene 5.062 registros, pero fue procesado por última vez en 2020 y no representa todas las viviendas. Ambos pueden aportar contexto agregado tras documentar cobertura, nunca una recomendación individual.

### Activos atractivos que no cierran la acción

- Los 733 puntos de [bibliobús](https://analisis.datosabiertos.jcyl.es/explore/dataset/relacion-de-puntos-de-servicio-movil-de-los-bibliobuses-de-castilla-y-leon/information/) sí ofrecen visita programada, hora e incidencia, pero no enlazan públicamente cada parada con disponibilidad por ejemplar. El NO-GO previo de RABEL/eBiblio impide convertir el QR en acceso completo a una obra.
- [Incidencias de carreteras](https://analisis.datosabiertos.jcyl.es/explore/dataset/incidencias-en-la-red-de-carreteras-titularidad-de-la-junta-de-castilla-y-leon/information/) aporta vía, puntos kilométricos, corte, causa y, a veces, alternativa; no incluye geometría. Además, la app ministerial [GeoGasolineras](https://datos.gob.es/es/aplicaciones/geogasolineras) ya sitúa estaciones en una ruta y superpone tráfico.
- [Formación ECYL](https://analisis.datosabiertos.jcyl.es/explore/dataset/formacion-del-ecyl/information/) tiene 761 filas actualizadas, pero en la captura solo 77 informaban fecha de inicio; ninguna informaba fecha límite, fecha final o requisitos en sus campos estructurados. [Certificados de profesionalidad](https://analisis.datosabiertos.jcyl.es/explore/dataset/certificados-profesionalidad/information/) tiene 583 filas, pero su última `fecha_alta` observada es de 2014, y el histórico de [acreditaciones](https://analisis.datosabiertos.jcyl.es/explore/dataset/acreditacion-de-competencias-profesionales/information/) termina en 2023. No existe la cadena vigente y auditable experiencia → estándar → módulo → curso abierto.
- La [agenda cultural](https://analisis.datosabiertos.jcyl.es/explore/dataset/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/information/) está viva, pero no publica capacidad, plaza ni reserva. Los [museos](https://analisis.datosabiertos.jcyl.es/explore/dataset/museos/information/) guardan tarifas y horarios dentro de HTML y sus metadatos observados son de 2019. Cualquier optimización acaba siendo agenda o recomendador sin disponibilidad.
- EPREL sí permite comparar electrodomésticos. Su [interfaz pública](https://energy-efficient-products.ec.europa.eu/eprel_en) ya busca, filtra, ordena y compara modelos, y para algunos grupos enlaza repuestos, coste indicativo, instrucciones de reparación y desmontaje. La [API pública de búsqueda de EPREL](https://eprel.ec.europa.eu/screen/requestpublicapikey) exige clave, aplicación identificada y una declaración sellada o firmada. Sin embargo, la comprobación técnica corrigió un matiz importante: con grupo e ID conocidos, endpoints como [`/api/products/washingmachines2019/1985924`](https://eprel.ec.europa.eu/api/products/washingmachines2019/1985924) responden HTTP 200 con JSON sin clave. Por tanto, el flujo unitario iniciado por QR/ID puede ser autónomo; la dependencia de autorización afecta a búsqueda masiva, no basta por sí sola para matar el MVP.
- El conjunto [Gestores de residuos registrados: canal doméstico](https://analisis.datosabiertos.jcyl.es/explore/dataset/gestores-de-residuos-registrados-en-castilla-y-leon-canal-domestico/) tenía **2.396 filas** en la consulta de corte y un registro por gestor y residuo autorizado. Incluye instalación, operación, proceso, tipo de residuo y código LER, además de dirección y contacto. No publica horario, precio, cita, capacidad, disponibilidad ni una garantía de que un particular pueda entregar allí un aparato concreto ese día. Es un registro de autorizaciones, no un inventario operativo de puntos de entrega.

## 4. Catorce conceptos y descarte adversarial

La puntuación de 0–35 replica los siete criterios del concurso con cinco puntos cada uno. Es una estimación comparativa, no una puntuación oficial. **Una puerta dura fallida prevalece sobre el total.**

| # | Concepto y operación ciudadana exacta | Dato JCyL que tendría que cambiar el resultado | Total | Puerta que falla / veredicto |
|---:|---|---|---:|---|
| 1 | **MismoPliego**: dirección o CEE → línea base y cohorte → solicitud de presupuesto común → introducir hasta tres ofertas → tabla normalizada y preguntas exportables | Certificados energéticos diarios; el CEE y su cohorte determinan la línea base del documento | **30/35 narrativos** | **Descartada tras el gate.** El CEE carece de mediciones y detalle constructivo para fijar un alcance presupuestable; sin ellos la salida es una plantilla genérica o una prescripción técnica insegura |
| 2 | **Aquí Vuelve**: escanear QR en una parada de bibliobús → próxima visita, horario e incidencia → guardar una tarjeta offline de esa parada | Horarios/incidencias de 733 paradas | 24/35 | Es una buena función, no un producto ganador; necesita permiso para etiquetas, choca con BibliobusCyL y no resuelve disponibilidad de obras |
| 3 | **Reposta Exacto**: trayecto, autonomía y consumo → repostar ahora, después o no parar → euros netos tras desvío e incidencias | Incidencias autonómicas por vía/PK; precio procede de MITECO | 27/35 | GeoGasolineras ya busca por ruta y tráfico; candidatura 2025 sobre carburantes y reutilizaciones maduras. JCyL es secundario y la mejora es estrecha |
| 4 | **Oficio en Prueba**: elegir oficio → resolver escenas de trabajo → post mortem contra estándares → índice de evidencias para acreditación | Certificados, acreditaciones y formación ECYL | 25/35 | Repite Acredita Primero con otra interfaz; catálogo regional desactualizado/incompleto y unión semántica no auditable |
| 5 | **Curso Bajo Lupa**: pegar publicidad de un curso → descomponer módulos/horas → lista de diferencias frente al certificado oficial | Certificados de profesionalidad | 23/35 | Es un verificador; datos regionales con última alta en 2014 y transición nacional de estándares. Riesgo de presentar como no válido algo que el portal no puede decidir |
| 6 | **VidaÚtil**: escanear el aparato actual y un sustituto → introducir consumo medido y presupuesto de reparación → umbral mantener/reparar/sustituir → ruta de entrega del residuo | Gestores de residuos domésticos autorizados por tipo y LER | 28/35 | EPREL cubre la comparación del sustituto, pero no el estado ni la vida restante del aparato usado; JCyL solo cambia el paso posterior de residuo y ni siquiera acredita entrega doméstica efectiva. Falla causalidad y materialidad autonómica |
| 7 | **Museo Justo**: grupo, edades y accesibilidad → combinación de entradas y horario menos costosa → hoja de visita | Museos, visitantes y agenda | 23/35 | Tarifas/horarios no estructurados y antiguos, sin capacidad ni reservas; colisión extrema con cultura, turismo y agenda |
| 8 | **Devuélvemelo**: generar etiquetas QR anónimas → quien encuentra avisa sin ver identidad → seguimiento hasta devolución | Estadística de objetos perdidos, si existiera aplicable | 22/35 | El dato público solo justificaría el problema; el valor reside en una nueva base de usuarios y adopción física. Falla autonomía y materialidad |
| 9 | **100 CyL**: responder cuánto cree que representan 100 personas → revelar dato real → resultado personal y explicación | Demografía, salud, educación y economía agregadas | 20/35 | Dataset sólido, pero salida didáctica sin acción posterior; colisiona con juegos, trivial y visualización de datos |
| 10 | **Vívelo Antes**: atravesar una compra/estafa ficticia → tomar decisiones → post mortem y tarjeta de aprendizaje | Casos de arbitraje de consumo | 24/35 | Los datos JCyL no contienen secuencias, mensajes, pérdidas y decisiones; exigiría construir guiones externos y roza consejo jurídico/seguridad. Demasiado cerca de reclamaciones ya rechazadas |
| 11 | **Mascota 30 días**: asignar tiempo y dinero a una mascota virtual → consecuencias acumuladas → coste/compromiso final | Núcleos zoológicos y datos ganaderos no describen mascotas domésticas | 22/35 | No existe modelo regional de costes, cuidados e incidencias. Si se importa, JCyL queda decorativo; si se aconseja, aumenta responsabilidad |
| 12 | **Foto Cumplida**: llegar a un lugar → reproducir una foto oficial → comparación visual → recuerdo verificable | Monumentos y agenda | 23/35 | JCyL carece de corpus fotográfico con derechos claros; turismo/patrimonio está saturado y premios/galería requieren moderación o colaboradores |
| 13 | **Bolsillo Offline**: elegir municipio → generar paquete ligero/offline de servicios, incidencias y próximos hitos → compartir por QR | Varios directorios y flujos JCyL | 22/35 | La innovación técnica es la compresión, pero la experiencia sigue siendo directorio/alertas; no cierra una tarea y colisiona con MuniCyL e Info Salamanca |
| 14 | **Hora Devuelta**: demostrar visita o viaje en franja de baja demanda → recibir recompensa o ventaja | No hay validaciones de acceso, ocupación ni transacciones | 23/35 | Necesita operadores, presupuesto e integración con comercios/centros. Los datos de visitantes son mensuales, no verifican una conducta individual |

### Puntuación homogénea por los siete criterios

`U` utilidad, `E` valor económico, `S` valor público/social, `O` originalidad, `V` variedad de datos, `F` facilidad/accesibilidad y `T` calidad técnica. Cada columna vale 0–5. La puntuación no rescata una idea que falle una puerta dura.

| # | Concepto | U | E | S | O | V | F | T | Total |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | MismoPliego | 5 | 5 | 4 | 4 | 3 | 5 | 4 | **30** |
| 2 | Aquí Vuelve | 4 | 2 | 4 | 3 | 2 | 5 | 4 | 24 |
| 3 | Reposta Exacto | 5 | 5 | 3 | 2 | 3 | 5 | 4 | 27 |
| 4 | Oficio en Prueba | 4 | 4 | 5 | 4 | 3 | 3 | 2 | 25 |
| 5 | Curso Bajo Lupa | 4 | 4 | 4 | 3 | 2 | 4 | 2 | 23 |
| 6 | VidaÚtil | 5 | 5 | 4 | 3 | 3 | 4 | 4 | 28 |
| 7 | Museo Justo | 4 | 3 | 4 | 2 | 3 | 4 | 3 | 23 |
| 8 | Devuélvemelo | 4 | 2 | 4 | 4 | 1 | 4 | 3 | 22 |
| 9 | 100 CyL | 2 | 1 | 4 | 3 | 4 | 4 | 2 | 20 |
| 10 | Vívelo Antes | 4 | 3 | 5 | 4 | 2 | 3 | 3 | 24 |
| 11 | Mascota 30 días | 3 | 3 | 4 | 4 | 1 | 4 | 3 | 22 |
| 12 | Foto Cumplida | 3 | 2 | 3 | 3 | 4 | 4 | 4 | 23 |
| 13 | Bolsillo Offline | 3 | 2 | 4 | 3 | 4 | 4 | 2 | 22 |
| 14 | Hora Devuelta | 4 | 3 | 4 | 4 | 2 | 3 | 3 | 23 |

### Resultado de la criba inicial — posteriormente corregido

- **Pasaron a prueba técnica:** 1; **sobrevivieron al gate: 0**.
- **Reservas sin desarrollar:** 0.
- **Eliminadas:** 13.

No se conserva una segunda opción para aparentar variedad. Las candidatas 3 y 6 obtienen un total alto porque plantean tareas reales, pero incumplen condiciones básicas: ya hay productos oficiales/maduros muy próximos, el dato JCyL no carga la decisión y faltan variables operativas. Las candidatas 2 y 4 tienen una interacción interesante, pero sus activos regionales no permiten terminar el trabajo.

### Gate específico: VidaÚtil (mantener–reparar–sustituir)

Esta fue la alternativa temática repetida con mejor apariencia y se sometió a una prueba separada. El cálculo propuesto no diagnosticaría el aparato: devolvería umbrales transparentes, por ejemplo «reparar sale mejor si añade al menos X meses de vida», usando consumo medido, precio energético y presupuesto introducidos por la persona. Aun con ese diseño prudente, no sobrevive.

| Puerta técnica | Evidencia | Resultado |
|---|---|---|
| Acceso automatizable | La búsqueda masiva requiere [clave y declaración firmada](https://eprel.ec.europa.eu/screen/requestpublicapikey), pero tres endpoints de producto por grupo+ID se probaron sin credenciales y devolvieron HTTP 200/JSON; entre ellos, el de [esta lavadora](https://eprel.ec.europa.eu/api/products/washingmachines2019/1985924) | **GO para el flujo unitario QR/ID.** La búsqueda abierta de alternativas seguiría necesitando clave o que el usuario aportase el modelo candidato |
| Variable causal del aparato usado | EPREL describe el **modelo registrado**, no la condición de esa unidad, su fallo, el éxito de reparar ni los meses de vida recuperados | **NO-GO** para afirmar «repara» o «sustituye». Solo puede producir escenarios condicionados a supuestos del usuario |
| Materialidad JCyL | Retirar el registro de gestores no cambia el umbral económico entre mantener, reparar y sustituir; únicamente quita una salida posterior | **NO-GO**: el dato autonómico no causa la decisión central |
| Cierre real de la entrega | Autorización por LER no equivale a horario, tarifa, cita, capacidad o aceptación directa de un hogar | **NO-GO**: no se puede prometer «llévalo aquí» sin confirmación externa |
| Colisión | EPREL ya permite escanear, buscar, filtrar, ordenar y comparar, e incorpora información de repuestos/reparación en varios grupos | **Débil en originalidad** si se limita a comparar. El umbral de reparación sería distinto, pero descansa en datos que EPREL/JCyL no observan |

**Veredicto de VidaÚtil: descartada con 28/35.** No se elimina por ser mala temática —el problema es universal y económicamente relevante— ni por falta de acceso unitario a EPREL. Se elimina porque la parte diferencial no puede decidirse con fuentes oficiales disponibles y la fila JCyL queda después de la decisión. Podría reabrirse únicamente con dos activos nuevos: un dato verificable de diagnóstico y vida añadida, y un directorio operativo de entrega doméstica. Ninguno existe hoy dentro del alcance del concurso.

## 5. Hipótesis original: MismoPliego — descartada después

### Explicación en una frase

**Pones la dirección o el CEE de tu vivienda, descargas la misma ficha para pedir tres presupuestos y, cuando vuelven, la aplicación coloca precios, alcance, resultado prometido, garantías y omisiones en una tabla comparable.**

No decide qué obra hacer ni qué empresa contratar. Resuelve un problema anterior y más seguro: tres presupuestos que describen cosas distintas no se pueden comparar.

### Flujo ciudadano

1. **Recuperar la línea base.** La persona introduce dirección, referencia catastral o datos manuales del CEE. La aplicación selecciona el certificado vigente más reciente, muestra fecha y cobertura y lo compara solo con una cohorte anónima suficientemente grande de provincia × tipo de edificio × normativa.
2. **Definir el objetivo sin prescribir solución.** La persona marca prioridades observables: reducir demanda de calefacción, mejorar una letra, limitar desembolso, ejecutar en una o varias fases o reducir molestias. El sistema no prescribe aislamiento, ventana, caldera ni proveedor.
3. **Generar una solicitud común.** Produce una ficha para enviar a cualquier profesional con la misma línea base y los mismos campos de respuesta: alcance incluido/excluido, productos y modelos, mano de obra separada, impuestos, plazo, garantías, mantenimiento, indicador energético prometido y supuestos.
4. **Normalizar hasta tres respuestas.** El usuario transcribe o importa los campos de cada presupuesto. La salida muestra diferencias, campos ausentes y aritmética reproducible. No crea un ranking opaco ni afirma que el más barato sea mejor.
5. **Exportar.** Genera un PDF accesible y una tabla CSV con las preguntas que deben aclararse antes de firmar. Todo puede guardarse localmente sin cuenta.

La [guía oficial británica para comprar calefacción verde](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1160832/2.0_Green_home_energy_consumer_guide_FINAL_links.pdf) recomienda recabar al menos tres presupuestos y separar producto, instalación, impuestos, financiación y costes posteriores. La Directiva europea permite un borrador ciudadano simplificado previo, pero el pasaporte real exige experto y visita. MismoPliego combina esos dos mecanismos: **preparar una conversación comparable**, no emitir una evaluación técnica.

### Por qué el dato JCyL es central

Sin el registro regional, el usuario tendría que transcribir la línea base y la aplicación sería una plantilla genérica. Con él:

- se identifica el certificado y su vigencia;
- se detectan duplicados/versiones y se conserva la fuente;
- se construyen percentiles regionales por cohortes equivalentes;
- se fijan unidades y campos energéticos comunes para que las ofertas respondan sobre la misma referencia;
- se puede demostrar con registros reales y actualizados a diario.

La cohorte no se usa para prometer ahorro. Solo responde «este es el punto de partida registrado y así se distribuyen edificios comparables». El coste y consumo reales proceden exclusivamente de documentos que aporta el usuario.

### Diferencia frente a candidaturas anteriores

- **EnergyCyl (ganador 2023)** recopilaba y analizaba el sector energético regional. MismoPliego no es un panel: empieza y termina en una comparación de ofertas de una persona.
- **APP SOLAR-CYL (2021)** y propuestas posteriores sobre predicción/consumo trataban tecnología o estimación energética. MismoPliego no recomienda tecnología ni predice.
- **Casa Clara**, descartada previamente, pretendía apoyar una decisión de compra/alquiler mediante riesgos y comprobaciones. MismoPliego entra después, cuando ya existe una intención de reforma, y solo estandariza una petición y las respuestas.

La mejora relevante defendible es el paso de «consultar energía» a:

`CEE oficial → petición idéntica → tres respuestas normalizadas → dudas antes de firmar`

### Límites jurídicos y técnicos obligatorios

El producto debe incluir estas prohibiciones en su propia especificación:

- no llamarse pasaporte de renovación, certificado, auditoría o dictamen;
- no prescribir medidas ni validar idoneidad constructiva;
- no calcular una factura multiplicando energía primaria o demanda por precio;
- no garantizar ahorro, letra futura, subvención, plazo o cumplimiento normativo;
- no declarar fiable o fraudulento a un profesional;
- no mostrar registros individuales de viviendas comparables;
- no inferir datos ausentes mediante IA sin marcar origen y permitir corrección;
- no almacenar dirección, CEE, facturas o presupuestos en servidor por defecto.

La IA puede ayudar a extraer campos de un PDF, pero debe ser prescindible. Cada cifra de la tabla final debe proceder del registro oficial o de un campo confirmado por el usuario.

### Encaje orientativo con los siete criterios

| Criterio | Puntos / 5 | Defensa y debilidad |
|---|---:|---|
| Utilidad | 5 | Acción concreta antes de un gasto importante; el usuario sale con un documento reutilizable |
| Valor económico | 5 | Hace comparables alcance y precio y reduce iteraciones; no promete ahorro |
| Valor público/social | 4 | Reduce asimetría informativa y facilita que más hogares pidan ofertas entendibles |
| Originalidad | 4 | Tema energético repetido, pero mecanismo ciudadano y entregable no observados en 2024/25 |
| Variedad de datos | 3 | Un conjunto JCyL excelente; no debe forzarse variedad con auditorías empresariales o calderas antiguas |
| Facilidad/accesibilidad | 5 | Tres tareas comprensibles, sin cuenta, salida PDF/CSV y entrada manual alternativa |
| Calidad técnica | 4 | Cohortes, versionado, unidades, trazabilidad y cálculo determinista; OCR añade riesgo si entra en MVP |
| **Total** | **30/35** | No es predicción del jurado ni compensa una prueba técnica fallida |

## 6. Prueba de muerte original de 48 horas

No conviene diseñar marca ni aplicación completa antes de superar todos estos puntos:

1. **Selección de CEE.** Con 50 referencias o direcciones de prueba, resolver duplicados, vigencia y última inscripción sin elegir un registro caducado cuando exista uno vigente.
2. **Cohortes honestas.** Definir provincia × tipo × normativa, exigir mínimo de 100 registros y demostrar que cada percentil usa exactamente las mismas unidades. Si no hay cohorte suficiente, mostrar «sin comparación», no ampliar silenciosamente.
3. **Cero factura inventada.** Revisar tests para garantizar que energía primaria y demanda nunca se convierten directamente en euros. El gasto solo puede usar consumo/precio aportados por el usuario.
4. **Esquema de presupuesto.** Tomar diez presupuestos sintéticos con formatos distintos y recuperar manualmente los campos comunes sin error aritmético. OCR queda fuera si no alcanza precisión campo a campo y confirmación visible.
5. **Comparación útil.** Diez personas deben identificar en menos de tres minutos qué incluye cada oferta, qué falta y qué pregunta harían; al menos ocho deben coincidir en las diferencias factuales.
6. **Trazabilidad.** Cada dato JCyL debe enlazar a inscripción, fecha y consulta; cada dato privado debe aparecer como «aportado por ti».
7. **Frontera legal visible.** Cinco personas deben entender que el documento no es un pasaporte, diagnóstico, recomendación de obra ni garantía de ahorro.
8. **Colisión real.** Revisar una demostración completa de EnergyCyl y las candidaturas energéticas 2024/25. Si ya normalizan presupuestos y generan una petición común, MismoPliego se elimina.

**Causas de muerte automáticas:** no resolver duplicados del CEE; usar valores energéticos para estimar facturas; necesitar que un instalador se adhiera; depender de OCR/LLM para funcionar; terminar siendo un comparador de ayudas; o no superar la prueba de comprensión.

## 7. Decisión original — sustituida por la corrección posterior

La búsqueda no respalda desarrollar tres ideas en paralelo. Respaldaría únicamente una prueba corta de **MismoPliego** porque:

- tiene un problema doméstico claro y una acción posterior inmediata;
- usa un activo JCyL grande, individualizable y actualizado a diario;
- no necesita datos privados de la Administración, convenios ni masa crítica;
- se distingue de mapas, paneles y recomendaciones energéticas;
- puede demostrar valor con un CEE y tres presupuestos ficticios en pocos minutos;
- puede mantenerse por debajo del umbral de asesoría si solo estructura, calcula y evidencia omisiones.

Si esta dirección tampoco convence conceptualmente, la conclusión útil de esta ronda no es inventar una decimoquinta variante. Es que, con todas las exclusiones actuales y los datos operativos que hoy publica JCyL, **no queda una aplicación ciudadana firme**. Para abrir otra búsqueda habría que relajar una sola puerta de forma explícita: aceptar un sector ya tratado con una mejora operativa —como aquí—, admitir una colaboración institucional real o permitir que el dato autonómico sea secundario frente a una fuente nacional/europea más transaccionable.

## 8. Corrección tras el gate: MismoPliego es NO-GO

La comprobación completa del CEE confirmó que el problema no era la cobertura del registro:

- 348.864 filas totales y 256.545 certificados vigentes a 3 de agosto de 2026;
- referencia catastral informada en 256.526 filas vigentes;
- el 95,44 % de las referencias vigentes tenía una sola fila activa;
- las 18 cohortes provincia × tipo residencial superaban 100 registros.

Eso permite identificar un CEE, resolver la mayoría de duplicados y calcular cohortes agregadas. **No permite definir qué debe presupuestar un profesional.** El registro no contiene mediciones de huecos y cerramientos, composición de elementos, equipos instalados con su estado, accesos, patologías, restricciones de obra ni el alcance solicitado. Son precisamente las variables que hacen que dos presupuestos sean o no comparables.

La idea queda atrapada entre dos salidas inválidas:

1. si la aplicación infiere medidas o actuaciones desde demanda, energía primaria y letra, fabrica un alcance técnico que el dato no acredita;
2. si obliga al usuario o a un técnico a introducir esas variables, el CEE deja de ser el motor y el resultado se reduce a una plantilla genérica que una hoja de cálculo o una IA generalista puede reproducir.

**Veredicto definitivo de MismoPliego: descartada.** La buena cobertura no compensa la ausencia de la variable causal. No debe diseñarse ni desarrollarse.

## 9. Nueva candidata condicional: AGUANTA

### Explicación en una frase

**Antes de comprar un móvil o una tableta, indicas cuántos años quieres conservarlo, escaneas su QR oficial y compruebas cuánto te costará por año y qué margen declarado ofrece su batería, reparabilidad y soporte para ese objetivo; si lo compras, guardas una ficha local hasta repararlo o retirarlo en un canal autorizado de Castilla y León.**

No diagnostica la unidad, no predice su vida real y no decide por el comprador. Convierte una intención personal —«quiero que dure cinco años»— en un contraste reproducible contra ensayos y compromisos oficiales del modelo.

### Operación ciudadana exacta

1. **Fijar el objetivo antes de ver el resultado.** Precio real introducido por la persona, años deseados y frecuencia estimada de ciclos completos equivalentes. No se raspan precios de comercios.
2. **Escanear uno o dos QR de la etiqueta UE.** El QR aporta el grupo y el identificador EPREL sin reconciliar nombres ambiguos.
3. **Traducir, no puntuar de forma universal.** Para cada modelo se muestran coste por año objetivo; ciclos equivalentes requeridos frente a ciclos declarados hasta el 80 % de capacidad; reparabilidad; resistencia a caídas; IP; batería reemplazable; garantía comercial; duración mínima declarada de actualizaciones; y enlaces oficiales de reparación, repuestos y precios indicativos. Cada cifra conserva fuente, unidad y fórmula.
4. **Comparar contra el objetivo propio.** La salida dice qué modelo deja más margen en las prioridades elegidas y dónde no hay evidencia. Nunca afirma «durará X años» ni crea un 0–100 opaco.
5. **Guardar un compromiso local.** Si se compra, la PWA conserva en el dispositivo modelo, precio, fecha y objetivo. Durante la propiedad calcula años reales y coste real por año, enlaza a la reparación oficial y permite exportar la ficha; no recomienda reparar o sustituir.
6. **Cerrar el ciclo en Castilla y León.** Cuando la persona decide retirar el aparato, filtra instalaciones autorizadas para LER `20 01 35*` y `20 01 36`, muestra autorización y contacto y obliga a confirmar horario y aceptación antes de desplazarse.

### Datos y viabilidad observada

Las [reglas UE para móviles y tabletas](https://energy-efficient-products.ec.europa.eu/product-list/smartphones-and-tablets_en) se aplican desde el 20 de junio de 2025 y publican en la etiqueta autonomía, ciclos de batería, reparabilidad, resistencia a caídas e IP. El QR enlaza con EPREL. Desde el 20 de julio de 2026, [EPREL también compara modelos](https://energy-efficient-products.ec.europa.eu/news/new-eprel-comparison-tool-support-sustainable-purchasing-2026-07-20_en).

Se tomó una muestra reproducible de 50 modelos pertenecientes a 50 marcas distintas y se consultó el registro oficial por ID:

- 50/50 respondieron y contenían ciclos, clase de reparabilidad, años mínimos de actualizaciones y garantía comercial;
- 43/50 declaraban fecha de fin de puesta en el mercado;
- 47/50 incluían enlaces reales de reparación y de repuestos;
- 46/50 incluían enlace de precios indicativos;
- en los 50 casos el valor interno de ciclos estaba codificado en centenas: el `10` del JSON correspondía a `1.000` ciclos en la ficha pública. La aplicación no puede mostrar el campo crudo sin normalización y contraste con la ficha oficial.

La [API pública de EPREL](https://eprel.ec.europa.eu/screen/requestpublicapikey) exige clave, identificación de la aplicación y declaración firmada o sellada tanto para buscar como para recuperar modelos. Que el endpoint interno por ID responda hoy sin credenciales demuestra accesibilidad técnica, **no autorización ni estabilidad contractual**. Obtener la clave es una puerta previa obligatoria.

Las [condiciones oficiales de la API](https://ec.europa.eu/assets/move-ener/eprel/EPREL%20Public/Public%20API%20Term%20and%20Conditions/API_TERMS_AND_CONDITIONS_EN.pdf) sí permiten expresamente crear obras derivadas e integrar los datos en aplicaciones móviles y comparadores. Exigen atribución, evitar presentaciones engañosas y mantener actualizadas las copias locales cuando haya correcciones, restricciones o borrados. Por tanto, el uso planteado es compatible en principio; la clave y un proceso de refresco siguen siendo requisitos reales.

El conjunto JCyL [Gestores de residuos registrados: canal doméstico](https://analisis.datosabiertos.jcyl.es/explore/dataset/gestores-de-residuos-registrados-en-castilla-y-leon-canal-domestico/) devuelve, para los dos códigos RAEE relevantes, 493 autorizaciones asociadas a 56 instalaciones distintas en las nueve provincias; 55 figuran como punto limpio. El dato cambia la acción final, pero no publica horarios, capacidad ni aceptación en vivo. La salida correcta es «instalación autorizada; confirma antes», nunca «puedes entregarlo ahora».

### La colisión que debe superar

AGUANTA no puede defender como innovación escanear una etiqueta ni comparar reparabilidad:

- EPREL ya busca, filtra, ordena y compara más de dos millones de productos;
- [Repair Score](https://repairscore.app/about/) ya empaqueta 2.362 móviles y tabletas, calcula un índice de longevidad 0–100, estima soporte y ofrece rankings.

La única mejora defendible es el bucle longitudinal y personal:

`objetivo de años + precio + hábito de carga → contraste oficial → compromiso local → coste real por año → reparación documentada o salida autorizada`

EPREL y Repair Score responden «qué características tiene o qué puntuación recibe este modelo». AGUANTA debe responder «¿encaja con el compromiso que tú has fijado y lo cumpliste?». Si los usuarios se limitan a leer especificaciones, la idea muere por colisión.

### Puntuación conservadora

| Criterio | Puntos / 5 | Defensa y debilidad |
|---|---:|---|
| Utilidad | 5 | Compra universal, gasto significativo y resultado entendible antes de pagar |
| Valor económico | 4 | Coste por año y menor sustitución prematura; no conoce precio de reparación ni valor residual |
| Valor público/social | 4 | Consumo durable, reparación y RAEE; el impacto depende de que cambie conducta real |
| Originalidad | 3 | El compromiso longitudinal es distinto, pero EPREL y Repair Score ocupan ya la comparación |
| Variedad de datos | 4 | EPREL + registro JCyL + datos privados locales; JCyL es material al final, no en la compra |
| Facilidad/accesibilidad | 5 | QR, tres entradas, sin cuenta, datos locales y fórmulas visibles |
| Calidad técnica | 4 | Normalización, fechas, unidades, trazabilidad, modo offline; exige clave y vigilancia de esquema |
| **Total actual** | **29/35** | Puede subir en originalidad solo con evidencia de uso diferencial, no con narrativa |

## 10. Gates antes de cualquier diseño o desarrollo

1. **Autorización EPREL.** Obtener una clave para una aplicación identificada y aceptar formalmente sus condiciones. Sin clave, NO-GO; no se construye sobre endpoints internos tolerados.
2. **Escaneo real.** Probar 50 etiquetas físicas o QR actuales y resolver al menos 45 sin búsqueda manual. Un ID ausente debe terminar en «sin datos», nunca en coincidencia aproximada.
3. **Semántica de unidades y fechas.** Contrastar automáticamente cada campo usado con la ficha oficial. Ciclos, fin de mercado, actualización y garantía deben tener pruebas de regresión; un factor ×100 incorrecto mata la candidatura.
4. **Diferencia comprendida.** Diez personas comparan AGUANTA, EPREL y Repair Score. Al menos ocho deben explicar en menos de 30 segundos que aquí fijan un horizonte propio y conservan una ficha durante años.
5. **Cambio de decisión.** Al menos seis de esas diez personas deben usar precio, horizonte o hábito de carga para confirmar o cambiar un criterio de compra. Si solo consultan una nota de reparabilidad, NO-GO.
6. **Acción JCyL honesta.** Verificar manualmente una muestra de 20 instalaciones y presentar siempre autorización, fecha de consulta y botón de contacto; sin prometer horario o admisión.
7. **Privacidad y longevidad.** Precio, fecha, factura y ficha permanecen locales por defecto, con exportación/importación. Ningún documento personal se envía a un servidor.

**Causas de muerte automáticas:** no obtener acceso autorizado a EPREL; acabar siendo una tabla o ranking; inferir vida útil real; calcular soporte con una fecha no acreditada; mostrar el valor crudo de ciclos; usar el registro JCyL como mapa decorativo; o no demostrar que el seguimiento posterior forma parte del uso principal.

### Veredicto actual

**AGUANTA es PASS técnico / PASS temático / PASS CONDICIONAL de producto.** Es la mejor dirección encontrada después de eliminar MismoPliego, pero todavía no justifica desarrollo. Primero debe superar autorización, semántica y diferenciación. Si falla cualquiera de esas tres puertas, esta ronda vuelve honestamente a **cero supervivientes**.
