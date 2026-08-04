# Reinicio desde cero: alternativas ciudadanas 2026

**Fecha de corte:** 3 de agosto de 2026  
**Ámbito:** aplicación web ciudadana para el X Concurso de Datos Abiertos de Castilla y León.  
**Resultado:** **ninguna de las doce rutas nuevas autoriza desarrollo**. `MARGEN` es la menos débil; `CIRCUITO DE FERIAS`, la mejor de las dos rutas económicas examinadas en detalle. Ninguna supera el producto de reserva ya validado en rondas anteriores.

## Veredicto ejecutivo

Esta ronda no encuentra una idea ganadora oculta. Encuentra algo más útil que otro falso positivo:

1. **ANTES DE ABRIR es NO-GO.** El punto de equilibrio lo determinan los costes y márgenes que introduce el usuario. Los datos JCyL no contienen demanda, ventas, alquiler, ticket, cierres ni supervivencia empresarial. Añadir densidad comercial o turismo provincial no convierte esa aritmética en una predicción territorial válida. Además, calculadoras actuales ya entregan clientes o unidades mínimas y escenarios.
2. **CIRCUITO DE FERIAS es NO-GO competitivo.** La fuente regional es operativa —415 ferias de 2026 con fechas, lugar, contacto y enlace— y sí modifica el calendario posible. Pero omite canon, plazo de solicitud, admisibilidad, aforo, asistencia y ventas; justo las variables que deciden si acudir. Herramientas actuales para feriantes ya combinan calendario, distancia, gastos, punto de equilibrio y rentabilidad.
3. **MARGEN queda como reserva de investigación, no de desarrollo.** Los 580.751 registros electorales permiten un cálculo exacto y reproducible que ningún otro activo del catálogo iguala. Sin embargo, la experiencia central colisiona con simuladores D'Hondt existentes, su uso es episódico y su acción ciudadana es débil. No vence al concepto de reserva anterior.

La clasificación honesta es:

> **0 supervivientes de inversión / 1 reserva de investigación (MARGEN) / NO DEVELOPMENT.**

Forzar dos o tres finalistas para cumplir una cuota produciría precisamente el error que esta búsqueda debía evitar.

## 1. Filtros aplicados

Las [bases consolidadas](https://datosabiertos.jcyl.es/web/jcyl/binarios/742/958/IAPA_2377_BBRR_TRA_483_2020_yModificaci%C3%B3n,1.pdf?blobheader=application%2Fpdf%3Bcharset%3DUTF-8&blobnocache=true) y la [convocatoria 2026](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) exigen al menos una fuente del Portal. En Productos y Servicios pesan por igual utilidad, valor económico, valor público/social, originalidad, variedad de datos, facilidad/accesibilidad y calidad técnica.

Además de esos criterios se impusieron cinco puertas de muerte:

- **Dato causal:** retirar los datos JCyL debe cambiar materialmente la respuesta individual.
- **Acción cerrada:** la salida debe terminar en una decisión o artefacto utilizable, no en mapa, directorio, panel, buscador, chatbot o calendario.
- **Autonomía:** sin acuerdos institucionales, inventarios privados ni red previa de colaboradores.
- **Responsabilidad baja:** sin dictamen jurídico, médico, financiero o de seguridad.
- **Ventaja demostrable:** no basta una adaptación regional de una aplicación ya resuelta en tiendas o web.

También se descartaron expresamente SIETE, HORAS A FAVOR, Público Primero, vehículo eléctrico, residuos, vivienda/energía, reclamaciones, ayudas, bibliobuses, administración, seguridad y asistentes de IA genéricos.

## 2. Realidad del catálogo que condiciona la ideación

La auditoría de los 430 conjuntos del portal de análisis descubre mucha estadística y pocos activos transaccionales. Los datos más relevantes para esta ronda son:

| Activo oficial | Cobertura comprobada | Lo que sí causa | Lo que no contiene |
|---|---:|---|---|
| [Resultados electorales 1983–actualidad](https://analisis.datosabiertos.jcyl.es/explore/dataset/resultados-electorales-1983-actualidad/information/) | **580.751 filas**, incluida 2026, por mesa y candidatura | Reconstrucción exacta de participación, votos y reparto provincial | Motivación del voto, intención futura o efecto de una campaña |
| [Establecimientos comerciales](https://analisis.datosabiertos.jcyl.es/explore/dataset/establecimientos-comerciales/information/) | **24.415 registros**; fecha de modificación máxima observada: 30-06-2026 | Provisión comercial documentada por CNAE/sector y municipio | Apertura efectiva, ventas, precios, horarios, demanda o supervivencia |
| [Registro de municipios](https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-municipios-de-castilla-y-leon/information/) | **2.248 municipios**, población y coordenadas | Denominador territorial y distancia | Población flotante, poder de compra o clientes potenciales de una actividad |
| [Demanda turística](https://analisis.datosabiertos.jcyl.es/explore/dataset/demanda-boletin-coyuntura-turistica/information/) | **17.172 filas**, mensual hasta junio de 2026, por provincia y alojamiento | Estacionalidad turística provincial observada | Flujo peatonal municipal, gasto o conversión a clientes de un negocio |
| [Ferias comerciales](https://analisis.datosabiertos.jcyl.es/explore/dataset/relacion-de-ferias-comerciales/information/) | **4.908 históricas; 415 en 2026**. En 2026: 100 % con inicio/fin, lugar, contacto y enlace | Qué citas existen y cuáles se solapan | Localidad estructurada (0 %), canon, solicitud, requisitos, aforo, asistencia y ventas |
| [Talleres artesanos](https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-talleres-artesanos-de-castilla-y-leon/information/) + [artesanos alimentarios](https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-artesanos-alimentarios/information/) | **482 + 419 registros**, con posible solapamiento | Universo profesional y actividad declarada | Productos disponibles, costes, inventario, canal de venta o interés por una feria |
| [Productos Tierra de Sabor](https://analisis.datosabiertos.jcyl.es/explore/dataset/productos-de-la-marca-tierra-de-sabor/information/) | **4.905 productos** por marca/categoría | Evidencia de producto registrado | EAN, precio, stock, comercio vendedor o disponibilidad actual |
| [Agenda cultural](https://analisis.datosabiertos.jcyl.es/explore/dataset/eventos-de-la-agenda-cultural-categorizados-y-geolocalizados/information/) | 471 registros; 445 futuros; fecha/enlace 100 %, hora de inicio 97 %, precio 95 % | Conjunto vivo de opciones reales | Hora de fin en 92,6 %, plazas y disponibilidad |
| [Pollen actual e histórico](https://analisis.datosabiertos.jcyl.es/explore/dataset/informacion-polinica-actual/information/) | 227 registros actuales y 137.139 históricos | Contexto semanal por estación y taxón | Pronóstico meteorológico horario; el uso médico elevaría responsabilidad |

Dos alertas impiden maquillar datos antiguos como actuales: el [IPC JCyL](https://analisis.datosabiertos.jcyl.es/explore/dataset/indice-de-precios-de-consumo/information/) termina en diciembre de 2021 y cultivos municipales, aunque el metadato se reprocesó en 2026, termina materialmente en 2022.

## 3. Matriz de doce conceptos y descarte adversarial

Escala interna de 1 a 5: utilidad amplia (**U**), dato JCyL causal (**C**), acción cerrada (**A**), originalidad (**O**) y autonomía/viabilidad (**V**). La suma no salva un fallo de puerta.

| # | Concepto y operación | Dato causal pretendido | U | C | A | O | V | Veredicto de muerte |
|---:|---|---|---:|---:|---:|---:|---:|---|
| 1 | **MARGEN**: reproducir una elección y calcular el menor cambio de participación/votos que altera el último escaño | Resultados por mesa 1983–2026 | 3 | 5 | 2 | 3 | 5 | **Reserva de investigación.** Cálculo sólido, pero uso episódico, acción débil y colisión con simuladores electorales |
| 2 | **ANTES DE ABRIR**: costes + margen + días → clientes/día mínimos; estrés por temporada y prueba de campo | Comercio, población, turismo, costes, ferias | 3 | 1 | 4 | 1 | 5 | **NO-GO.** El umbral es una calculadora genérica; el dato regional no demuestra clientes ni supervivencia |
| 3 | **CIRCUITO DE FERIAS**: fechas + radio + margen → circuito sin solapes y ventas mínimas por cita | Ferias 2026, artesanos, productos, turismo | 2 | 3 | 3 | 2 | 4 | **NO-GO.** Faltan canon, convocatoria y demanda; audiencia estrecha y colisión exacta de mercado |
| 4 | **NOS PONEMOS DE ACUERDO**: votos y vetos privados → única actividad cultural de consenso | Agenda cultural viva | 4 | 4 | 3 | 2 | 4 | **NO-GO.** Decide, Howbout y otras apps ya resuelven votación de planes; sin plazas no cierra la asistencia |
| 5 | **VENTANA DE CASA**: tarea doméstica exterior → hacer ahora/esperar + franja | Polen JCyL + AEMET; aire histórico | 4 | 2 | 4 | 1 | 4 | **NO-GO.** Drying Buddy, AirDry y otras aplicaciones cubren exactamente la colada; AEMET, no JCyL, causaría la respuesta |
| 6 | **CAMBIA UNO**: ingrediente habitual → sustituto de menor impacto con producción regional documentada | Cultivos, leche y Tierra de Sabor + factores oficiales externos | 4 | 2 | 3 | 2 | 3 | **NO-GO.** Cultivos llega a 2022 y no prueba temporada, venta o stock; ComidAprueba/Carbon FOODprint ya cubren huella y sustitución |
| 7 | **UNA PARADA**: lista de recados → mínimo número de comercios y recorrido | Comercio + servicios de proximidad | 4 | 3 | 2 | 1 | 3 | **NO-GO.** Sin horario, stock ni servicios exactos; acaba siendo Google Maps con peor información |
| 8 | **PRECIO PÚBLICO**: presupuesto recibido → banda de contratos comparables y preguntas | 125.641 contratos menores + ordinarios | 3 | 2 | 3 | 3 | 2 | **NO-GO.** Los títulos no contienen cantidades/alcance comparables; produciría falsa referencia económica o buscador semántico |
| 9 | **ARCHIVO EN CAJA**: documentos familiares → inventario, nombres y paquete de conservación | Fondos ISAD y reglas archivísticas | 2 | 1 | 4 | 4 | 4 | **NO-GO.** El dato institucional no determina la clasificación personal; utilidad minoritaria y patrimonio ya repetido |
| 10 | **CARNET RENTABLE**: usos previstos → decidir si compensa el Carnet Joven | 303 colaboradores | 2 | 1 | 4 | 2 | 5 | **NO-GO.** El conjunto no publica descuento, precio, vigencia ni condiciones; la cifra sería introducida manualmente |
| 11 | **DONO AHORA**: historial declarado → próxima oportunidad oficial y preparación | Colectas/puntos fijos/donaciones | 2 | 3 | 3 | 1 | 4 | **NO-GO.** Calendario y orientación sanitaria; existe el antecedente Soy Donante y las colectas observadas no estaban al día |
| 12 | **PASE O BILLETE**: viajes mensuales → abono/billetes mínimos | Transportes metropolitanos y demanda | 4 | 1 | 4 | 2 | 3 | **NO-GO.** El dataset solo contiene conteos anuales por ciudad, no tarifas, zonas, trayectos ni horarios |

## 4. Kill-test específico: ANTES DE ABRIR

### Promesa legítima

El usuario introduce inversión, costes fijos, margen por venta, días y horas. La aplicación devuelve ventas o clientes diarios mínimos y obliga a verificar el escenario mediante conteos, entrevistas o preventas. Esa parte es útil y prudente: no predice éxito.

### Por qué el dato JCyL no sostiene la promesa diferencial

La fórmula `coste fijo / margen unitario` usa únicamente datos del usuario. El registro comercial puede mostrar negocios documentados por sector, pero:

- registro no equivale a negocio abierto;
- número de competidores no equivale a demanda;
- población no equivale a mercado accesible;
- viajeros provinciales no equivalen a visitas al municipio ni al local;
- ferias no equivalen a ventas;
- el IPC regional abierto termina en 2021.

Aplicar un “factor estacional” de turismo provincial al número de clientes de una peluquería, tienda o cafetería sería una inferencia sin base. Restringir el producto a alojamiento turístico mejoraría coherencia, pero lo acercaría a turismo —tema saturado— y seguiría sin ocupación, tarifa ni gasto por establecimiento.

### Colisión

La colisión local es alta por **StartUp CyL**, premiado en 2024, y por los títulos Emprende con Base y MercaCyL del inventario suministrado; no se atribuyen funciones no publicadas a esos títulos, pero sí marcan saturación temática. En mercado, [CalculatorBiz en App Store](https://apps.apple.com/es/app/calculatorbiz/id797810351) y [EXSTA Break-Even Calculator en Google Play](https://play.google.com/store/apps/details?id=com.exstaconsult.exstabreak_evencalculator) calculan ya punto de equilibrio; herramientas web llegan a cubiertos/clientes mínimos diarios y escenarios.

### Gate imposible con los datos actuales

Para sobrevivir debería backtestear al menos 100 aperturas/cierres reales por sector y municipio y demostrar que la señal regional mejora de forma estable a la aritmética base. El catálogo no contiene apertura, cierre, facturación o supervivencia. No existe variable objetivo.

**Veredicto: NO-GO.** No supera a MARGEN; tampoco justifica un prototipo.

## 5. Kill-test específico: CIRCUITO DE FERIAS

### Lo que sí funciona

El dataset ofrece un activo real poco habitual. Para 2026 se observaron **415 citas**, todas con título, descripción, temática, inicio, final, lugar, contacto y enlace. Con el registro municipal puede extraerse automáticamente una localidad desde el texto y calcular distancia. Un optimizador puede evitar solapes y devolver el coste mínimo de desplazamiento.

### Lo que impide cerrar la decisión

No se publican estructuradamente:

- fecha límite o canal de solicitud;
- actividades o productos admitidos;
- canon por metro/puesto;
- seguro, potencia, montaje o documentación;
- plazas de expositor disponibles;
- aforo, visitantes o ventas históricas.

Por tanto, la aplicación puede decir “estas fechas caben y el viaje cuesta X”, pero no “puedes solicitar estas ferias” ni “necesitas vender Y” hasta que el usuario consiga e introduzca manualmente el canon y condiciones. El turismo provincial no es un sustituto válido de la asistencia a una feria.

### Colisión

[PopUp Profit en Google Play](https://play.google.com/store/apps/details?id=com.popupprofitapp.app) ya permite estimar beneficio antes de reservar, introducir canon, producto, viaje y ventas, comparar eventos y calcular punto de equilibrio. [TheCraftMap](https://www.thecraftmap.com/pricing) combina más de 4.000 ferias, distancia, calendario, gastos, ventas y ROI; [BoothKeeper](https://www.boothkeeper.com/) calcula rentabilidad y salario horario. La cobertura regional oficial sería mejor en Castilla y León, pero el mecanismo no sería nuevo.

La población potencial es además estrecha: 482 talleres artesanos y 419 artesanos alimentarios registrados, con solapamiento desconocido. Los 4.905 productos Tierra de Sabor no equivalen a 4.905 vendedores interesados ni habilitados para ferias.

### Gate previo

Solo merecería revisarse si, sin acuerdos, los enlaces oficiales permiten extraer automáticamente para al menos el 80 % de las 415 citas: convocatoria, plazo, canon, admisibilidad y solicitud; y si una muestra de 30 profesionales demuestra que el circuito cambia tres decisiones reales respecto de su método actual. La ficha abierta no ofrece esos campos y la extracción web heterogénea reintroduce mantenimiento editorial.

**Veredicto: NO-GO competitivo.** Es mejor que ANTES DE ABRIR en causalidad regional, pero no supera a MARGEN ni cumple audiencia amplia.

## 6. Comparación final con MARGEN

| Puerta | MARGEN | ANTES DE ABRIR | CIRCUITO DE FERIAS |
|---|---|---|---|
| Audiencia ciudadana amplia | **Media-alta:** electorado | Baja: futuros emprendedores | Muy baja: feriantes/productores |
| Dato JCyL cambia el cálculo | **Muy alta** | Muy baja | Media: fechas/distancias sí; rentabilidad no |
| Salida cerrada | Baja-media: contrafactual, no transacción | Media: umbral + prueba | Media: circuito + contacto, sin admisión |
| Preparación automática | **Muy alta** | Muy alta | Media-alta; localidad está en texto |
| Dependencia externa | **Ninguna relevante** | Ninguna, porque el usuario aporta costes | Baja para rutas; alta para condiciones reales de participación |
| Riesgo sensible | Medio por neutralidad política | Medio por apariencia de viabilidad financiera | Bajo-medio |
| Colisión histórica/mercado | Media-alta | **Muy alta** | **Muy alta** |
| Uso recurrente | Muy bajo | Una vez por proyecto | Estacional y profesional |
| Resultado | **Reserva de investigación** | **NO-GO** | **NO-GO** |

MARGEN ocupa el primer lugar solo por descarte. Su versión mínima defendible no sería una calculadora D'Hondt genérica, sino:

> **Resultado real → menor perturbación que cambia el último escaño → intervalo de estabilidad → repetición sobre todas las elecciones 1983–2026, sin recomendar partido ni introducir encuestas.**

Aun así, [Simulador Electoral](https://simuladorelectoral.com/) ya incluye Castilla y León y sus provincias, [ElectoSIM](https://beta.electosim.com/) permite mover voto y ver el hemiciclo, Google Play aloja un [simulador de escaños](https://play.google.com/store/apps/details?id=com.ElectoralSimulator) y varias administraciones publican calculadoras D'Hondt. El mínimo cambio y el replay histórico son mejoras, no una nueva categoría de producto. La acción “comprender y quizá participar” no compensa su bajo valor económico y frecuencia.

## 7. Decisión

No se recomienda invertir tiempo en interfaz, arquitectura ni ingestión productiva de ninguna ruta de esta ronda.

- **ANTES DE ABRIR:** descartada por dato no causal y saturación.
- **CIRCUITO DE FERIAS:** descartada por campos operativos ausentes, audiencia estrecha y equivalente funcional actual.
- **MARGEN:** conservar únicamente como experimento de cálculo de una tarde; matar si una comparación de veinte escenarios contra Simulador Electoral/ElectoSIM no demuestra una operación esencial que aquellos no permiten.

La conclusión estratégica no es que falte imaginación. Es que, tras retirar salud, seguridad, administración, vivienda, energía, empleo, calendarios, directorios y dependencias externas, los flujos restantes del Portal son principalmente registros y estadísticas. Una aplicación ciudadana fuerte necesita además **precio, disponibilidad, regla computable o transacción**. En las rutas examinadas, esas piezas no existen o ya sustentan productos equivalentes.

> **Recomendación final: no sustituir una reserva imperfecta por una idea nueva peor. Ninguna de estas doce debe presentarse como “la mejor opción posible”.**

## Apéndice A — Auditoría adversarial de RASTRO / RAÍZ ABIERTA

### Promesa sometida a prueba

El usuario introduce una persona o acontecimiento familiar, municipio, año aproximado y objetivo —nacimiento, matrimonio, defunción, testamento, propiedad o estudios—. La aplicación debería cruzar fondos e instituciones y entregar **fondos concretos con solape temporal, condiciones de acceso, archivo responsable y una consulta ya preparada**. No construiría un árbol genealógico ni afirmaría haber encontrado a la persona.

El mecanismo sería valioso solo si convierte esos datos en una ruta documental que el ciudadano no puede obtener navegando un directorio. La prueba concluye que el corpus permite **orientar una consulta**, pero no resolver de forma automática el enlace decisivo `municipio + evento + año → fondo pertinente`.

### Auditoría cuantitativa de las fuentes JCyL

Medición directa de la API a 3 de agosto de 2026:

| Prueba | Resultado | Consecuencia de producto |
|---|---:|---|
| [Fichas ISAD](https://analisis.datosabiertos.jcyl.es/explore/dataset/fondos-documentales-fichas-isad/) | **1.254**; 1.253 son de nivel `Fondo` y una es `Grupo de fondos` | Describen conjuntos documentales, no partidas, escrituras ni personas |
| Instituciones presentes en las fichas | **29**; todas enlazan por nombre con el directorio | La selección de archivo sí se puede automatizar |
| [Directorio de archivos](https://analisis.datosabiertos.jcyl.es/explore/dataset/directorio-de-archivos-de-castilla-y-leon/) | 121 filas, pero **30 son nodos de clasificación** y 91 instituciones reales; 84 publican correo y 87 condiciones de acceso | El contacto y las advertencias son utilizables, pero «121 archivos» exageraría la cobertura operativa |
| Fecha de fondo | 1.254 no vacías; **1.136 (90,6 %)** siguen un intervalo simple `año–año` | El solape temporal es automatizable en la mayoría, con 118 casos que requieren reglas o revisión |
| Condiciones de acceso | **1.209 (96,4 %)** no vacías, con 191 textos distintos | Se pueden citar literalmente; no se debe convertirlas en una decisión jurídica de acceso |
| Identificación | 39 códigos de referencia y 28 valores de `identificador`, frente a **1.254 enlaces de ficha únicos** | El código no identifica inequívocamente cada fondo; el enlace oficial es la clave fiable |
| Objetos/documentos asociados | **2 de 1.254** fichas | La app no puede mostrar ni verificar el documento buscado |
| Licencia | La [metaficha API](https://analisis.datosabiertos.jcyl.es/api/explore/v2.1/catalog/datasets/fondos-documentales-fichas-isad) mantiene `license: null` | Gate jurídico de reutilización pendiente; no asumir CC BY por pertenecer al portal |

La geografía es el fallo principal. Las fichas no contienen municipio, código INE ni ámbito territorial estructurados. Un cruce conservador de los 2.248 nombres del [Registro de municipios](https://analisis.datosabiertos.jcyl.es/explore/dataset/registro-de-municipios-de-castilla-y-leon/api/) contra título y productor de los fondos solo encuentra **82 nombres explícitos (3,6 %)**. Esto no demuestra que los restantes municipios carezcan de documentación: demuestra precisamente que el dataset no permite saber qué distrito histórico, parroquia, partido judicial o registro los cubre.

La cobertura por objetivo también es desigual:

- nacimiento, matrimonio o defunción: 18 fondos clasificados como Registro Civil y 4 como Parroquias;
- testamento: 145 fondos de Protocolos Notariales, que pueden contener testamentos pero no los indexan por otorgante;
- propiedad: 42 fondos de Contadurías de Hipotecas y 34 de Registros de la Propiedad;
- estudios: 7 fondos de Escuela Pública, 9 de Instituto de Enseñanza Secundaria y 2 de Universidades.

Por tanto, RASTRO podría decir «este fondo parece compatible con tu año», pero no «aquí está la partida» ni siquiera «este fondo cubre con certeza tu municipio». Para salvarlo haría falta una tabla histórica externa de jurisdicciones civiles, eclesiásticas, notariales, registrales y escolares; no existe en estos conjuntos y mantenerla sería trabajo editorial especializado.

### Qué recorrido sí puede automatizarse

`objetivo → clasificador probable → intervalo temporal → ficha ISAD → institución → correo/horario/acceso → texto de consulta`

Ese recorrido produce un PDF o correo trazable con los términos de búsqueda, fondos candidatos y enlaces oficiales. Es mejor que devolver pines. Sin embargo, el resultado honesto sigue siendo una **consulta preparada con candidatos**, no un expediente que localiza evidencia. El propio Portal JCyL ya permite navegar el cuadro de organización hasta cada ficha ISAD y ofrece una [solicitud de copias](https://archivoscastillayleon.jcyl.es/web/jcyl/ArchivosCastillaYLeon/es/Plantilla100/1284239314585/_/_/) que pide personas, lugares, fechas, tipo de documento, archivo y signatura, y contempla restricciones y tasas. RASTRO precompletaría ese flujo; no lo cerraría.

### Colisión oficial, web y tiendas

| Servicio actual | Operación que ya resuelve | Margen real para RASTRO |
|---|---|---|
| [Portal de Archivos de Castilla y León](https://archivoscastillayleon.jcyl.es/web/es/nuestros-archivos/zamora/cuadro-organizacion.html) | Navegación jerárquica por fondos hasta ficha ISAD; directorio, consulta por correspondencia, reproducción y formulario de copias | Simplificar objetivo/año y preparar el texto; depende de inferir cobertura no publicada |
| [PARES](https://pares.cultura.gob.es/pares/es/inicio.html) | Busca documentos y autoridades; la [ayuda oficial](https://pares.cultura.gob.es/pares/preguntas-frecuentes.html) permite acotar archivo, fechas y signatura | El foco autonómico sería más estrecho, pero el patrón de búsqueda archivística ya existe |
| [FamilySearch Catalog](https://www.familysearch.org/en/search/catalog) y [guía de investigación en España](https://www.familysearch.org/en/help/helpcenter/spain) | Búsqueda por lugar, apellido, título, autor, materia y palabra clave; guía PARES, registros civiles, parroquiales y testamentos | Puede orientar hacia fondos JCyL no indexados, pero FamilySearch ya enseña el siguiente paso y busca personas en miles de millones de registros |
| [FamilySearch Árbol en App Store](https://apps.apple.com/es/app/familysearch-%C3%A1rbol/id885982973) y [Google Play](https://play.google.com/store/apps/details?id=org.familysearch.mobile) | Árbol, fuentes, documentos y búsqueda automática de antepasados; más de 10 millones de descargas en Google Play | RASTRO no competiría en árbol ni registros; su nicho sería únicamente la petición a archivos castellanos y leoneses |
| [Ancestry en App Store](https://apps.apple.com/es/app/ancestry-family-history-dna/id349554263) y [Google Play](https://play.google.com/store/apps/details?id=com.ancestry.android.apps.ancestry) | Árbol, sugerencias y acceso declarado a más de 30.000 millones de registros; más de 10 millones de descargas en Google Play | Ventaja pública/local y sin suscripción, pero corpus muchísimo menor y sin registros nominales |

No apareció una aplicación llamada exactamente RASTRO o RAÍZ ABIERTA que genere solicitudes a archivos de Castilla y León. Esa ausencia nominal no compensa la colisión funcional: búsqueda por persona/lugar/año, guía de fuentes, próximos pasos y solicitud ya están repartidos entre servicios maduros.

### Colisión histórica local

En el inventario suministrado de 256 candidaturas no aparece un producto de genealogía ni un motor `evento familiar → fondo → consulta`. La colisión exacta es, por tanto, **baja**. Los antecedentes más cercanos son culturales —`Nombres geográficos y su transmisión oral`, `Casual Learn`, reconocimiento de monumentos y `Otto Wunderlich en Segovia`—, sin atribuirles funciones que sus fichas no publican. Esto protege algo la originalidad, pero también confirma que la ruta cae en una familia patrimonial recurrente y con utilidad cotidiana limitada.

### Puntuación probable y comparación con MARGEN

Estimación interna, no nota oficial, sobre 5 puntos por cada criterio de Productos y Servicios:

| Criterio | RASTRO | MARGEN | Razón decisiva |
|---|---:|---:|---|
| Utilidad y usuarios potenciales | 2,5 | 3,0 | Genealogía motivadora pero episódica; electorado más amplio |
| Valor económico | 1,0 | 1,0 | Ambos ahorran tiempo; ninguno genera una ventaja económica fuerte |
| Valor público/social | **4,0** | 3,0 | RASTRO mejora acceso a memoria y archivos públicos |
| Originalidad | 2,5 | 2,0 | El dossier de consulta es diferencial, pero búsqueda y guía ya existen |
| Variedad de datos | **4,0** | 2,0 | Tres conjuntos JCyL coherentes frente al núcleo electoral único |
| Facilidad/accesibilidad | 3,5 | **4,0** | Formulario sencillo, pero resultados con incertidumbre territorial |
| Calidad técnica demostrable | 2,0 | **5,0** | MARGEN calcula resultados exactos; RASTRO depende de inferencias y texto |
| **Total orientativo** | **19,5/35** | **20/35** | La cercanía numérica no elimina las puertas de muerte |

RASTRO supera a MARGEN en relato social, variedad y artefacto final. MARGEN conserva la ventaja decisiva: cada salida se deriva exactamente del dato regional, sin curación jurisdiccional, licencias ausentes ni falsos positivos sobre una persona. Ninguno alcanza nivel ganador; MARGEN sigue siendo la reserva técnicamente más segura.

### Veredicto

> **NO-GO. No guardar como candidata.**

RASTRO no es solo un directorio en su formulación, pero **se convierte en directorio asistido + plantilla** cuando se eliminan las promesas que los datos no permiten verificar. Falla cuatro gates: cobertura municipal expresada, unidad documental/firmas individualizadas, licencia explícita y ventaja suficiente frente al flujo oficial y FamilySearch/PARES.

Solo debería reabrirse si JCyL publica una fuente normalizada `municipio histórico → jurisdicción/fondo/serie`, inventarios o unidades documentales con signatura y una licencia explícita; y si una prueba ciega de 100 casos logra al menos 80 rutas correctas confirmadas por archiveros sin edición manual. Con los datos actuales no debe consumir diseño ni desarrollo.
