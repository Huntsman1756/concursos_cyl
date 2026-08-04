# Casos internacionales recientes de productos construidos con datos públicos

Fecha de investigación: 2 de agosto de 2026  
Ventana principal: 2022-2026  
Criterio de fuentes: únicamente organismos públicos, organizadores oficiales y repositorios oficiales de los concursos.

## Objetivo y filtro

Se buscaron ganadores o productos oficialmente seleccionados que puedan construirse y demostrarse con datos públicos, sin convenios, pilotos institucionales ni datos privados. Se excluyeron expresamente los casos ya estudiados: renEUwable, Hermix, PRADOS, Sille, Re-Fill City, FarmABetterFish, newRoots, Yadokari-kun, Shipping Note, data.gov.sg, BlindSquare, MyHelsinki API y data.norge.no.

La independencia indicada en cada ficha no significa que el producto final no se beneficie de usuarios o socios. Significa que su propuesta esencial y una demostración evaluable no dependen de obtenerlos previamente.

## Resumen ejecutivo

Los mejores precedentes no son portales generalistas ni simples mapas. Repiten seis mecanismos:

1. **Convertir texto público denso en contexto situado**, sin ocultar la fuente original.
2. **Transformar registros administrativos en grafos de relaciones** que revelan patrones invisibles fila a fila.
3. **Traducir estadísticas abstractas a una escala humana y memorable**.
4. **Convertir series ambientales en ventanas de decisión**, no solo en predicciones o gráficos.
5. **Hacer explícito el umbral o riesgo de una decisión territorial** mediante escenarios editables.
6. **Reducir una búsqueda institucional fragmentada a una acción concreta**, conservando procedencia y fecha.

Los tres mecanismos con mejor transferencia a Castilla y León, sin dependencia externa previa, son:

- traducir proyecciones climáticas a cambios de frecuencia y consecuencias territoriales comprensibles;
- una capa de contexto normativo que explique automáticamente referencias y cambios dentro de trámites, convocatorias o normativa autonómica;
- señales territoriales accionables que condensen varias fuentes públicas actualizadas sin pedir datos privados.

## Matriz de casos

| Caso | País/equipo | Concurso y estatus exacto | Producto demostrable solo con datos públicos | Dependencia externa previa |
|---|---|---|---|---|
| Période de retour vers le futur | Francia | Hackathon Le climat en données 2025; **primer premio** | Sí | Baja |
| LegalLink Insight | Japón | Hackathon de APIs de leyes y ordenanzas 2023; **Business and Legal Award** | Sí | Baja |
| TEDective | Alemania | EU Datathon 2022; **1.º del reto Transparency in Public Procurement** | Sí | Baja |
| 100 Europeans | Grecia | EU Datathon 2022; **2.º del reto A Europe fit for the digital age** | Sí | Baja |
| 2plant | Ucrania | NASA Space Apps 2024; **Galactic Impact Award** | Sí | Baja |
| Landsat Connect | España | NASA Space Apps 2024; **Best Mission Concept Award** | Sí | Baja |
| SkySense | México | NASA Space Apps 2025; **Best Use of Technology Award** | Sí | Baja-media |
| Dirty Watts | Nueva Zelanda | GovHack 2022; **ganador de dos retos** | Sí | Baja |
| GovSnacks | Australia | GovHack 2024; **ganador internacional de AI in Governance** y **ganador australiano de Use AI to transform bureaucratic jargon into plain English** | Sí, sustituyendo la API comercial por un modelo local o controlado | Media |
| F.A.S.T. Internship Search | Estados Unidos | The Opportunity Project 2024; **producto oficial del sprint/showcase**, no premio competitivo | Sí | Baja |
| Dashboard de susceptibilidad a incendios de Columbia Británica | Canadá | OSDP UX Hackathon 2024; **tercer puesto** | Sí | Baja |
| Stella | Reino Unido | Hack for Impact 2026; **equipo ganador**, sin posición ordinal publicada | Parcialmente | Baja-media |

## 1. Période de retour vers le futur: traducir el clima futuro a una frecuencia presente

**País y concurso.** Francia; hackathon público “Le climat en données”, organizado por Météo-France y la Direction interministérielle du numérique en diciembre de 2025. Obtuvo el **primer premio**. Fuente: [data.gouv.fr — recapitulación oficial del hackathon](https://www.data.gouv.fr/posts/le-recap-du-hackathon-le-climat-en-donnees).

**Problema y usuario.** Responsables territoriales y ciudadanía encuentran difícil convertir proyecciones climáticas de alta resolución en una consecuencia comprensible para un lugar o infraestructura.

**Datos públicos empleados.** Nuevas proyecciones climáticas públicas de Météo-France, con series largas y resolución espacial fina, aplicadas al análisis de lluvias extremas.

**Qué hace.** Calcula cómo cambia con el calentamiento el periodo de retorno de episodios extremos. Traduce, por ejemplo, una “lluvia de cada 50 años” histórica a la frecuencia con la que podría repetirse bajo otro escenario climático.

**Por qué es diferencial.** No añade otro mapa de temperatura o precipitación. Convierte una proyección abstracta en un cambio de frecuencia que se puede relacionar con mantenimiento, dimensionamiento, protección o calendario.

**Mecanismo transferible a Castilla y León.** “Lo excepcional deja de ser excepcional”: introducir un municipio, carretera, cultivo, instalación o bien patrimonial y mostrar cómo cambia la recurrencia de calor, sequía o precipitación extrema entre periodos y escenarios. La aplicación debe separar claramente observación histórica, proyección y supuesto, sin emitir una certificación técnica.

**Dependencia externa.** **Baja.** Puede demostrar análisis, escenarios y explicaciones con series públicas. Una obra o decisión real necesitaría estudio profesional, pero el producto competitivo no depende de conseguirlo.

## 2. LegalLink Insight: la ley aparece donde hace falta

**País y concurso.** Japón; hackathon de APIs de leyes y ordenanzas de la Digital Agency, celebrado en noviembre de 2023. Obtuvo el **Business and Legal Award**. La página oficial distingue expresamente los tres premios y advierte que los prototipos no son servicios autorizados por la agencia. Fuente: [Digital Agency — Laws and ordinances Hackathon](https://www.digital.go.jp/en/policies/legal-practice/hackathon).

**Problema y usuario.** Profesionales jurídicos y administrativos pierden el contexto al saltar repetidamente entre un artículo y todas las disposiciones que este referencia.

**Datos públicos empleados.** Prototipo oficial de la API japonesa de leyes y ordenanzas y texto estructurado de las normas.

**Qué hace.** Es una extensión de navegador que reconoce una referencia normativa dentro de la interfaz ya existente de e-Gov y muestra el artículo referido en una ventana emergente. En lugar de reconstruir todo el portal jurídico, añade una función puntual sobre la interfaz que el usuario ya utiliza.

**Por qué es diferencial.** No resume toda la legislación ni obliga a formular preguntas a un chatbot. Resuelve una fricción repetida y verificable: perder el hilo al seguir referencias cruzadas. El texto oficial continúa siendo la autoridad.

**Mecanismo transferible a Castilla y León.** Una extensión o vista enriquecida para trámites, convocatorias y normativa autonómica que, al encontrar “según el artículo…”, muestre el texto vigente, su fecha de actualización y si existe una modificación posterior. También podría explicar referencias entre bases reguladoras, extractos y convocatoria sin generar una respuesta jurídica nueva.

**Dependencia externa.** **Baja.** La demostración solo necesita documentos normativos públicos estructurados o previamente procesados. No requiere usuarios reales, convenios ni datos personales.

## 3. TEDective: transformar contratación pública en una red investigable

**País y concurso.** Alemania; EU Datathon 2022. El equipo de Free Software Foundation Europe obtuvo el **primer puesto del reto “Transparency in public procurement”**. Fuentes: [anuncio oficial de ganadores](https://data.europa.eu/en/news-events/news/meet-winners-eu-datathon-2022) y [ficha oficial del equipo y aplicación](https://data.europa.eu/en/news-events/news/eu-datathon-2022-teams-behind-apps-meet-free-software-foundation-europe).

**Problema y usuario.** Periodistas, organizaciones civiles, empresas y responsables públicos no pueden comprender fácilmente relaciones y recurrencias dentro de miles de anuncios de contratación.

**Datos públicos empleados.** Datos XML de Tenders Electronic Daily (TED). El proyecto describió una canalización XML → PostgreSQL → Neo4j, una API de consulta y un frontal de grafos. También buscó publicar datos limpios y deduplicados como JSON compatible con Open Contracting Data Standard.

**Qué hace.** Visualiza vínculos entre empresas, administraciones y personas relacionadas con contratación pública, con el objetivo de aumentar transparencia, trazabilidad y capacidad de exploración.

**Por qué es diferencial.** La innovación no es un buscador de contratos, sino un modelo relacional navegable. La combinación de limpieza, deduplicación, actualización y representación en grafo convierte registros aislados en preguntas como “¿qué adjudicadores repiten proveedor?”, “¿qué contratos conectan estas entidades?” o “¿dónde se concentra un determinado objeto contractual?”.

**Mecanismo transferible a Castilla y León.** Un grafo autonómico de adjudicadores, adjudicatarios, lotes, CPV, importes, modificaciones y municipios. Para evitar acusaciones automáticas, debería presentar hechos, recurrencias y enlaces a expedientes, no una “puntuación de corrupción”. Una variante especialmente útil sería ayudar a pymes a entender redes de lotes y compradores públicos sin convertirse en otro recomendador genérico de licitaciones.

**Dependencia externa.** **Baja.** El prototipo se construye con contratación pública abierta. Las relaciones societarias profundas podrían añadir valor, pero no son imprescindibles para demostrar el núcleo.

## 4. 100 Europeans: convertir porcentajes en personas

**País y concurso.** Grecia; EU Datathon 2022. Obtuvo el **segundo puesto del reto “A Europe fit for the digital age”**. Fuentes: [anuncio oficial de ganadores](https://data.europa.eu/en/news-events/news/meet-winners-eu-datathon-2022) y [entrevista oficial del proyecto](https://data.europa.eu/en/news-events/news/eu-datathon-2022-teams-behind-apps-meet-100-europeans).

**Problema y usuario.** La ciudadanía entiende mal fenómenos climáticos, sanitarios o socioeconómicos cuando se comunican mediante porcentajes abstractos, promedios o informes extensos.

**Datos públicos empleados.** Conjuntos e informes públicos europeos sobre clima y salud para las dos primeras historias. La aplicación añadía un cuestionario para medir comprensión y orientar futuras historias.

**Qué hace.** Reimagina Europa como una comunidad de exactamente 100 personas y narra problemas complejos mediante desplazamiento, animación, comparaciones y preguntas. El prototipo estaba operativo durante la competición.

**Por qué es diferencial.** Mantiene rigor estadístico, pero utiliza una unidad cognitiva constante. Esto permite comparar asuntos muy distintos sin que el usuario tenga que interpretar escalas incompatibles.

**Mecanismo transferible a Castilla y León.** “100 habitantes de Castilla y León” o, más potente, “100 personas de tu provincia/comarca”: envejecimiento, acceso digital, movilidad, vivienda, empleo, incendios o cuidados traducidos a una comunidad de cien. Para ser un producto y no una infografía, debe permitir comparar territorio, periodo y escenario y revelar el denominador y la fuente de cada figura.

**Dependencia externa.** **Baja.** Funciona con estadísticas públicas agregadas. Las respuestas voluntarias a cuestionarios pueden mejorar temas y comprensión, pero no son necesarias para la demostración.

## 5. 2plant: de datos ambientales a riesgo de plantación

**País y concurso.** Ucrania; NASA International Space Apps Challenge 2024. Ganó el **Galactic Impact Award** entre 9.996 proyectos presentados. Fuente: [NASA — ganadores globales de 2024](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/).

**Problema y usuario.** Agricultores que deben elegir cuándo plantar bajo incertidumbre de sequía y condiciones cambiantes.

**Datos públicos empleados.** Humedad superficial del suelo y evapotranspiración obtenidas mediante observación terrestre de NASA.

**Qué hace.** Evalúa condiciones de plantación y convierte variables satelitales en una aplicación para gestionar riesgo de siembra.

**Por qué es diferencial.** No presenta una capa satelital genérica. Traduce dos variables físicas a una decisión agronómica situada y explicable.

**Mecanismo transferible a Castilla y León.** “Ventanas de labor”: combinar humedad, evapotranspiración, previsión meteorológica y tipo de cultivo para marcar ventanas prudentes de siembra, tratamiento o entrada de maquinaria. El MVP debe formularlo como riesgo relativo y evidencia disponible, no como prescripción agronómica exacta.

**Dependencia externa.** **Baja.** La demostración puede realizarse sobre datos públicos históricos y actuales. No necesita datos de explotación, aunque estos podrían personalizarla posteriormente.

## 6. Landsat Connect: saber cuándo habrá evidencia nueva de un lugar

**País y concurso.** España; NASA International Space Apps Challenge 2024. El equipo AsturExplorers obtuvo el **Best Mission Concept Award**. Fuente: [NASA — ganadores globales de 2024](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/).

**Problema y usuario.** Personas no expertas que necesitan imágenes terrestres recientes desconocen qué satélite observará su zona y cómo acceder a la reflectancia de superficie.

**Datos públicos empleados.** Órbitas y productos de reflectancia de superficie de Landsat.

**Qué hace.** Permite seguir satélites Landsat, fijar una localización objetivo, consultar datos de reflectancia y recibir avisos cuando un satélite pasará sobre ella.

**Por qué es diferencial.** Añade el eje temporal a la consulta geográfica. No solo responde “qué se ve aquí”, sino “cuándo tendremos una observación nueva para comprobarlo”.

**Mecanismo transferible a Castilla y León.** Un expediente temporal de evidencia territorial: el usuario marca una parcela, monte, embalse o núcleo y obtiene la próxima observación útil, el historial comparable y una comprobación antes/después para sequía, incendios, vegetación, agua o cambios de cubierta. Es más defendible que un mapa ambiental estático.

**Dependencia externa.** **Baja.** Los datos y calendarios satelitales son públicos. Las notificaciones pueden demostrarse sin colaboración institucional.

## 7. SkySense: la previsión se convierte en una ventana segura

**País y concurso.** México; NASA International Space Apps Challenge 2025. Ganó el **Best Use of Technology Award** entre más de 11.500 proyectos. Fuente: [NASA — ganadores globales de 2025](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/).

**Problema y usuario.** Una previsión meteorológica general no responde bien cuándo conviene realizar una actividad concreta en una ubicación concreta.

**Datos públicos empleados.** Observación terrestre de NASA y variables meteorológicas: lluvia, viento, temperatura, humedad y visibilidad.

**Qué hace.** Genera predicción hiperlocal, evaluación de riesgo y ventanas temporales recomendadas para actividades.

**Por qué es diferencial.** Su unidad de salida no es “el tiempo”, sino una ventana de decisión acompañada de variables y riesgo.

**Mecanismo transferible a Castilla y León.** Ventanas para actividades rurales muy específicas: quemas autorizadas, trabajos forestales, aplicación de tratamientos, rutas escolares en nieve, turismo de naturaleza o eventos municipales. La mayor oportunidad no está en competir con una aplicación meteorológica, sino en codificar condiciones públicas y explicables de una tarea concreta.

**Dependencia externa.** **Baja-media.** Datos públicos suficientes para una demostración histórica y prospectiva. La hiperlocalidad real puede exigir calibración; por ello el MVP debería presentar intervalos y nivel de confianza, no seguridad garantizada.

## 8. Dirty Watts: muchos datos se convierten en una señal presente

**País y concurso.** Nueva Zelanda; GovHack 2022. Fue **ganador de “Technology Literacy in a Digital First World”** y **ganador de “Best Creative Use of Data in Response to ESG (NZ)”**. Fuentes: [palmarés oficial de GovHack 2022](https://govhack.org/2022-winners/) y [ficha oficial de Dirty Watts](https://2022.hackerspace.govhack.org/projects/dirty_watts).

**Problema y usuario.** La mezcla eléctrica y sus emisiones cambian durante el día, pero el ciudadano no puede interpretar fácilmente datos de generación, despacho y suministro.

**Datos públicos empleados.** Datos de despacho eléctrico, puntos de suministro y mezcla de generación publicados por Electricity Authority y Transpower, actualizados cada 15 minutos.

**Qué hace.** Publica un panel y una API que condensan los datos en una señal comprensible. La señal puede incluso activar luces o dispositivos cuando aumenta la generación con carbón o petróleo, aunque el hardware es opcional.

**Por qué es diferencial.** No exige que el usuario estudie un dashboard: reduce un sistema complejo y cambiante a un estado actual con significado operativo.

**Mecanismo transferible a Castilla y León.** Construir una “señal territorial” basada en reglas transparentes: momento favorable para determinada labor exterior, tratamiento agrícola, riego, visita natural o precaución ambiental. La señal debe poder desplegarse para cada municipio, explicar qué variables la originan y conservar acceso al detalle.

**Dependencia externa.** **Baja.** El indicador y su histórico funcionan con datos públicos; el dispositivo físico no es necesario. El reto en Castilla y León será encontrar fuentes con actualización suficiente y una decisión cuyo umbral sea defendible.

## 9. GovSnacks: seguimiento temático del parlamento en lenguaje comprensible

**País y concurso.** Australia; GovHack 2024. Fue **ganador internacional de “AI in Governance”** y **ganador australiano de “Use AI to transform bureaucratic jargon into plain English”**. Fuentes: [palmarés oficial de GovHack 2024](https://govhack.org/2024-winners/) y [ficha oficial de GovSnacks](https://2024.hackerspace.govhack.org/projects/govsnacks).

**Problema y usuario.** La ciudadanía no puede seguir miles de páginas de transcripciones parlamentarias, proyectos legislativos y resúmenes cargados de jerga.

**Datos públicos empleados.** Informes Hansard del Parlamento australiano publicados en XML, incluidos resúmenes diarios y sesiones presupuestarias.

**Qué hace.** El usuario selecciona un informe o un tema —por ejemplo discapacidad— y recibe fragmentos y resúmenes breves, con enlaces a la fuente. El prototipo era abierto y ejecutable localmente, aunque utilizaba una clave de API de OpenAI.

**Por qué es diferencial.** La personalización no depende del perfil privado del usuario: es un filtro temático explícito sobre documentos oficiales. La salida mantiene vínculo con el texto original.

**Mecanismo transferible a Castilla y León.** Un seguidor temático de BOCYL, Cortes, acuerdos y convocatorias: “dime qué cambió esta semana sobre vivienda rural, cuidados o autónomos”, con extractos, fechas y documentos fuente. Para diferenciarse de un chatbot, debería incorporar línea temporal, detección de cambios, cobertura declarada y citas por fragmento.

**Dependencia externa.** **Media en el prototipo original**, por la API comercial. El mecanismo puede hacerse independiente con extracción determinista, modelos locales o resúmenes preprocesados. No requiere datos privados ni acuerdos.

## 10. F.A.S.T. Internship Search: agregación orientada a una acción concreta

**País y programa.** Estados Unidos; The Opportunity Project 2024, programa de sprints del Census Open Innovation Labs. F.A.S.T. fue un **producto oficialmente incorporado al showcase del sprint**, no un ganador competitivo. El programa define sus sprints como ciclos de 12 semanas para crear productos públicos con datos abiertos. Fuentes: [TOP 2024 Sprints](https://opportunity.census.gov/sprints/2024-sprints/) y [showcase oficial de productos](https://opportunity.census.gov/showcase/?search=career-pathways).

**Problema y usuario.** Estudiantes encuentran oportunidades científicas públicas repartidas entre múltiples agregadores y organismos, con campos y lenguaje diferentes.

**Datos públicos empleados.** Oportunidades de NASA, USDA, Smithsonian Institution, NOAA, U.S. Naval Research Laboratory, National Park Service y USAJOBS.

**Qué hace.** F.A.S.T. —Federal Aggregator of Science & Technology Internship Search— normaliza oportunidades y reduce la densidad de información para que estudiantes puedan encontrar prácticas públicas relevantes.

**Por qué es diferencial.** Limita radicalmente el dominio y la acción: no intenta indexar “todas las oportunidades”, sino una transición concreta de estudiante a primeras prácticas científicas públicas.

**Mecanismo transferible a Castilla y León.** Un agregador de primera oportunidad territorial: becas, prácticas, formación dual, empleo público temporal y programas de retorno dirigidos a una situación concreta. Su valor tendría que estar en normalización, elegibilidad legible, calendario y detección de incompatibilidades, no solo en reunir enlaces.

**Dependencia externa.** **Baja.** Una demostración completa puede generarse con convocatorias públicas vigentes e históricas. Las valoraciones voluntarias posteriores podrían informar sobre claridad y resultado, sin ser necesarias para funcionar.

## 11. Dashboard canadiense de susceptibilidad a incendios: explicar el riesgo multivariable

**País y concurso.** Canadá; Open Science and Data Platform UX Hackathon 2024, organizado por Natural Resources Canada y Dalhousie University. Un dashboard de susceptibilidad de distintas zonas de Columbia Británica obtuvo el **tercer puesto**. Fuente: [Open Science and Data Platform — resultados oficiales del hackathon](https://osdp-psdo.canada.ca/en/teams-across-canada-compete-open-science-and-data-platform-hackathon-challenge).

**Problema y usuario.** Ciudadanía y usuarios ambientales necesitan entender por qué unas zonas presentan mayor susceptibilidad a incendios que otras.

**Datos públicos empleados.** Variables del Open Science and Data Platform, entre ellas incendios históricos y tendencias meteorológicas actuales.

**Qué hace.** Integra múltiples factores que afectan a la propagación, visualiza áreas con mayor susceptibilidad y permite explorar el origen del resultado.

**Por qué es diferencial.** El mapa es la salida de una explicación multivariable, no el producto completo. Su utilidad está en mostrar qué factores elevan el riesgo y cómo cambia la lectura al combinarlos.

**Mecanismo transferible a Castilla y León.** Un “por qué aquí” de vulnerabilidad forestal o municipal que permita separar combustible, antecedentes, pendiente, sequedad, meteorología y exposición de población o bienes. Para no replicar visores de riesgo existentes, la interfaz debería responder qué factor domina en cada lugar y qué evidencia cambiaría la conclusión.

**Dependencia externa.** **Baja.** Puede demostrarse con datos abiertos históricos y actuales. No necesita sensores propios ni reportes ciudadanos.

## 12. Stella: combinar oportunidad administrativa y riesgo operativo

**País y concurso.** Reino Unido; Hack for Impact 2026, organizado por el Department for Science, Innovation and Technology y NVIDIA. Stella aparece oficialmente entre los **equipos ganadores**, aunque la nota no publica una clasificación ordinal. Fuente: [GOV.UK — Hack for Impact winning teams](https://www.gov.uk/government/news/new-backing-for-open-source-ai-builders-data-centre-design-challenge-and-robotics-partnership).

**Problema y usuario.** Pequeños negocios de calle pueden desconocer bonificaciones o ayudas y, al mismo tiempo, sufrir cambios de afluencia por transporte, obras o meteorología.

**Datos públicos empleados.** Datos abiertos de la City of London utilizados durante el hackathon: ayudas o reglas públicas y señales territoriales sobre transporte, obras y tiempo.

**Qué hace.** Identifica posibles bonificaciones y ayudas no reclamadas, ayuda a redactar solicitudes y alerta sobre posibles caídas de afluencia debidas a acontecimientos públicos.

**Por qué es diferencial.** Une dos horizontes que normalmente están separados: una acción administrativa que puede mejorar la posición del negocio y riesgos operativos de la semana inmediata.

**Mecanismo transferible a Castilla y León.** Un panel para pequeños establecimientos que no solo enumere ayudas, sino que explique una actuación pública aplicable y avise de eventos verificables —obras, cortes, eventos o meteorología— que pueden afectar su operación. Debe evitar afirmar elegibilidad o pérdida de ventas; la salida correcta es “posible acción a comprobar” y “exposición documentada”.

**Dependencia externa.** **Baja-media.** La demostración puede funcionar con datos públicos y supuestos introducidos por el usuario. Confirmar elegibilidad o impacto económico real exige comprobación posterior, pero no un convenio ni datos privados.

## Casos descartados tras la revisión

- Propuestas que necesitaban sensores o drones propios para producir su dato esencial.
- Plataformas de coordinación asistencial o social cuyo valor solo aparece al incorporar profesionales, familias o expedientes privados.
- Predictores médicos entrenados con registros sanitarios no libremente reproducibles.
- Aplicaciones cuyo único diferencial era un chatbot general sobre documentos públicos.
- Marketplaces o rutas que requieren oferta, transacciones o compromisos reales para demostrar que funcionan.
- Simples buscadores, mapas o cuadros de mando sin una decisión, comprobación o experiencia claramente distinta.

## Qué enseñan estos precedentes para una nueva candidatura

### 1. Debe existir una unidad de salida inequívoca

Los proyectos más defendibles entregan algo que se puede nombrar: una referencia normativa explicada, un vínculo contractual, una ventana de actividad, una próxima observación satelital, un escenario jugable o una oportunidad normalizada. “Un panel con mucha información” no es una unidad de salida.

### 2. La independencia no obliga a producir un producto estático

Todos estos mecanismos funcionan inicialmente con datos públicos, pero pueden mejorar con preferencias o aportaciones voluntarias: temas seguidos, escenarios guardados, correcciones propuestas o resultados comunicados. La aportación ciudadana es una mejora, no una condición de arranque.

### 3. La precisión debe expresarse como evidencia, no autoridad

Los ejemplos ambientales más transferibles trabajan con riesgo, condiciones o ventanas. En Castilla y León conviene mostrar variables, fecha, cobertura y confianza y evitar órdenes como “planta ahora”, “esta zona es segura” o “esta empresa es sospechosa”.

### 4. La mejor reutilización puede ser pequeña

LegalLink Insight ganó resolviendo una interacción diminuta dentro de una herramienta existente. Es una advertencia contra confundir ambición con número de módulos. Una sola fricción frecuente, demostrada sobre cientos de documentos, puede tener más valor que una plataforma amplia.

### 5. La narrativa ganadora combina antes y después

La demostración ideal permite enseñar el mismo caso antes y después: una referencia sin contexto/frente a contexto inmediato; registros aislados/frente a una red; previsión general/frente a ventana de decisión; porcentaje abstracto/frente a cien personas. Esa transformación es visible sin testimonios ni pilotos.

## Ranking de mecanismos transferibles

1. **Cambio de periodo de retorno → consecuencia territorial.** Es el mecanismo más novedoso y autosuficiente: convierte proyecciones complejas en una comparación que cualquier jurado entiende y puede verificarse históricamente.
2. **Referencia pública → contexto inmediato y vigente.** Es pequeño, repetible y demostrable sobre muchos documentos; evita el riesgo de construir otro asistente general.
3. **Múltiples fuentes actuales → una señal operativa explicable.** Responde “qué significa ahora” y conserva el detalle para quien quiera auditarla.
4. **Registros administrativos → red de relaciones neutral.** Produce una transformación visual fuerte y preguntas nuevas, pero exige una resolución de entidades rigurosa.
5. **Serie espacial → expediente temporal y próxima evidencia.** Añade el “cuándo” y permite demostrar antes/después, especialmente en medio rural y ambiental.

## Conclusión

La búsqueda internacional no respalda construir otro recomendador general, mapa de carencias o asistente conversacional. Sí respalda explorar productos autónomos cuyo núcleo sea uno de estos tres:

1. **Cambio climático traducido a recurrencia y consecuencia local.**
2. **Contexto normativo verificable en el punto de uso.**
3. **Datos actualizados convertidos en señales y ventanas de decisión.**

Los tres pueden probarse exhaustivamente con casos históricos, tienen una transformación visual clara y admiten aportaciones voluntarias futuras sin depender de ellas.
