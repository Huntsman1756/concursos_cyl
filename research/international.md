# Patrones internacionales de proyectos Open Data y Civic Tech de alto valor

## Alcance y criterio de selección

Esta nota prioriza fuentes primarias: páginas de los concursos, organismos públicos y fichas oficiales de producto. No todos los casos son “ganadores” en sentido estricto: se incluyen también productos destacados y finalistas cuando aportan un mecanismo especialmente transferible. La selección no pretende copiar temas, sino aislar patrones útiles para un proyecto de Castilla y León basado en **dato oficial → análisis → recomendación personalizada → decisión → impacto verificable**.

## Casos seleccionados

### 1. CROZ renEUwable — EU Datathon 2022 (Unión Europea)

**Estatus.** Primer premio del reto European Green Deal y premio del público del EU Datathon 2022.

- **Problema:** hogares que quieren ahorrar energía reciben información genérica, difícil de convertir en acciones priorizadas.
- **Usuario:** residentes que deben decidir qué medida de ahorro adoptar.
- **Innovación:** recomendaciones personalizadas de ahorro energético, en vez de limitarse a visualizar consumos o emisiones.
- **Mecanismo transferible:** convertir variables del hogar y datos públicos en una lista ordenada de acciones, acompañada de ahorro o beneficio estimado.
- **Qué no copiar:** el tema “consejos de eficiencia energética” sin acceso a datos suficientemente granulares; degeneraría en recomendaciones obvias.
- **Principio adaptable:** el resultado debe ser una **decisión priorizada y explicable**, no una puntuación abstracta.
- **Fuente oficial:** [Ganadores del EU Datathon 2022 — data.europa.eu](https://data.europa.eu/en/news-events/news/meet-winners-eu-datathon-2022)

### 2. Hermix — EU Datathon 2022 (Unión Europea)

**Estatus.** Primer premio del reto de oportunidades de contratación pública para jóvenes.

- **Problema:** la contratación business-to-government se monitorizaba y analizaba en gran medida de forma manual, pese a la abundancia de datos abiertos.
- **Usuario:** pymes y profesionales que necesitan decidir en qué mercados públicos competir y cómo posicionarse.
- **Innovación:** limpia y normaliza TED, CORDIS y Financial Transparency System; aplica segmentación y análisis de afinidad para producir inteligencia accionable, no alertas de licitaciones sin contexto.
- **Mecanismo transferible:** combinar conocimiento de dominio con datos administrativos heterogéneos para estimar **encaje, oportunidad y siguiente acción**.
- **Qué no copiar:** un buscador de convocatorias o contratos; el propio equipo identifica que ese servicio ya existía. Tampoco una capa de IA sin una taxonomía de mercado diseñada por expertos.
- **Principio adaptable:** la ventaja no está en acceder al dato, sino en **normalizarlo y traducirlo a una decisión para un segmento concreto**.
- **Fuentes oficiales:** [Perfil de Hermix — data.europa.eu](https://data.europa.eu/en/news-events/news/eu-datathon-2022-teams-behind-apps-meet-hermix) · [Resultados del EU Datathon 2022](https://data.europa.eu/en/news-events/news/meet-winners-eu-datathon-2022)

### 3. PRADOS — The Opportunity Project (Estados Unidos)

**Estatus.** Caso destacado del sprint del U.S. Census Bureau.

- **Problema:** las convenciones locales de direcciones de Puerto Rico no encajaban bien en los estándares federales, dificultando respuesta de emergencias, reparto y reconstrucción.
- **Usuario:** responsables municipales del dato de direcciones y, aguas abajo, servicios de emergencia y comunidades.
- **Innovación:** una plataforma de gobernanza que “traduce” prácticas locales a esquemas federales sin borrar su contexto cultural; usa TIGER, National Address Database y datos postales.
- **Mecanismo transferible:** tratar la interoperabilidad y la calidad del dato como parte del producto; permitir que quien conoce el territorio corrija y valide la base oficial.
- **Qué no copiar:** imponer desde arriba un identificador o esquema que invalide denominaciones locales; tampoco construir primero una app ciudadana sobre direcciones defectuosas.
- **Principio adaptable:** cuando el dato base es incompleto, el producto ganador puede **cerrar el bucle de calidad** y a la vez habilitar decisiones críticas.
- **Fuente oficial:** [Caso PRADOS — The Opportunity Project, U.S. Census Bureau](https://opportunity.census.gov/prados/)

### 4. Sille — The Opportunity Project (Estados Unidos)

**Estatus.** Caso destacado del sprint geoespacial de FEMA/DHS.

- **Problema:** responsables de emergencias no saben qué infraestructuras pueden haber sufrido desplazamientos y presentar mayor riesgo de fallo antes o durante un desastre.
- **Usuario:** responsables de crisis, primeros intervinientes y administraciones locales.
- **Innovación:** combina interferometría radar Sentinel-1 con bloques censales para señalar cambios en puentes o edificios vulnerables.
- **Mecanismo transferible:** fusionar observación de la Tierra con datos administrativos para producir una **cola de inspección o intervención priorizada**.
- **Qué no copiar:** presentar la predicción como diagnóstico estructural concluyente; debe funcionar como señal de triaje con incertidumbre y validación humana.
- **Principio adaptable:** la analítica tiene más valor cuando termina en **dónde actuar primero y por qué**.
- **Fuente oficial:** [Caso Sille — The Opportunity Project, U.S. Census Bureau](https://opportunity.census.gov/sille/)

### 5. El propio modelo de sprint de The Opportunity Project (Estados Unidos)

**Estatus.** Programa del Census Open Innovation Labs; el sitio oficial contabiliza 283 productos y más de 450 conjuntos de datos utilizados desde 2016.

- **Problema:** los concursos de ideas suelen separar a desarrolladores, usuarios afectados, expertos del dato y organismos capaces de implantar la solución.
- **Usuario:** equipos de producto y administraciones que quieren resolver un reto público, además del usuario final de cada sprint.
- **Innovación:** ciclos de 12–14 semanas con investigación de usuarios, descubrimiento de datos, revisión de concepto, asesor de producto, beta y MVP; incorpora “user advocates” y “data stewards”.
- **Mecanismo transferible:** formalizar desde el inicio un triángulo **usuario vivido + custodio del dato + responsable de implementación**.
- **Qué no copiar:** un hackathon de fin de semana cuyo éxito sea la demo; TOP insiste en estrategia de mantenimiento y llegada al usuario tras el sprint.
- **Principio adaptable:** la credibilidad ante un jurado aumenta si el prototipo incluye evidencia de co-diseño, piloto y propietario operativo.
- **Fuentes oficiales:** [Proceso TOP](https://opportunity.census.gov/sprint-process/) · [Impacto TOP](https://opportunity.census.gov/impact/)

### 6. Re-Fill City — Presidential Hackathon 2023 (Taiwán/Tailandia)

**Estatus.** Team of Excellence del Presidential Hackathon International Track 2023; posteriormente pilotado en Nakhon Si Thammarat.

- **Problema:** consumo de botellas de un solo uso y dificultad para localizar agua potable gratuita y fiable.
- **Usuario:** personas que se desplazan por la ciudad y comercios o administraciones que operan puntos de agua.
- **Innovación:** combina una app para localizar fuentes limpias con incentivos por reutilizar botellas y una alianza entre universidad, agencia de economía digital y empresa de smart city; la red genera además información urbana.
- **Mecanismo transferible:** conectar recomendación, infraestructura física, incentivo y telemetría de impacto en un mismo bucle.
- **Qué no copiar:** una app de puntos de agua sin asegurar disponibilidad, calidad y mantenimiento; el mapa por sí solo no cambia conducta.
- **Principio adaptable:** cada recomendación debe poder desembocar en una **acción física verificable** y producir una métrica de resultado.
- **Fuentes oficiales:** [Presidential Hackathon International Track — ficha y seguimiento](https://presidential-hackathon.taiwan.gov.tw/en/international-track/index.html) · [Listado oficial de equipos excelentes 2023](https://presidential-hackathon.taiwan.gov.tw/en/international-track/en-file/PHIT-Excellent%20Teams%20List.pdf)

### 7. FarmABetterFish / HysonTech — Presidential Hackathon 2023 (Taiwán/India)

**Estatus.** Team of Excellence del Presidential Hackathon International Track 2023.

- **Problema:** producción acuícola con decisiones tardías o intuitivas sobre condiciones de cultivo, con riesgo económico y ambiental.
- **Usuario:** explotaciones acuícolas y sus técnicos.
- **Innovación:** sistema AIoT que une sensores y análisis para gestionar la producción; el programa facilitó validación y conexiones con empresas acuícolas de varios países.
- **Mecanismo transferible:** combinar dato abierto contextual con observación local de bajo coste para emitir alertas y recomendaciones operativas.
- **Qué no copiar:** llamar “open data” a un producto basado casi enteramente en sensores privados, o desplegar IoT antes de probar qué decisión mejora.
- **Principio adaptable:** usar dato público para aportar contexto y sensores para cerrar la brecha local, siempre ligado a un protocolo de actuación.
- **Fuentes oficiales:** [Presidential Hackathon — ficha y estado del proyecto](https://presidential-hackathon.taiwan.gov.tw/en/international-track/index.html) · [Listado oficial 2023](https://presidential-hackathon.taiwan.gov.tw/en/international-track/en-file/PHIT-Excellent%20Teams%20List.pdf)

### 8. newRoots — Canadian Open Data Experience 2014 (Canadá)

**Estatus.** Gran premio y premio del público de la primera competición nacional CODE.

- **Problema:** una persona recién llegada debe elegir ciudad sin poder comparar de forma integrada empleo, vivienda, fiscalidad y contexto socioeconómico.
- **Usuario:** nuevos residentes en Canadá.
- **Innovación:** combina datos de empleo, Statistics Canada, Canada Revenue Agency y Canada Mortgage and Housing Corporation para emparejar perfil y ciudad.
- **Mecanismo transferible:** recomendador multicriterio para una decisión vital, con fuentes oficiales cruzadas y personalización.
- **Qué no copiar:** otro recomendador genérico de “municipio ideal”: es un patrón ya maduro y muy próximo a propuestas de repoblación saturadas. También debe evitar prometer “éxito” a partir de correlaciones agregadas.
- **Principio adaptable:** conservar la arquitectura de decisión multicriterio, pero aplicarla a una decisión menos explorada y con un resultado verificable a corto plazo.
- **Fuente oficial:** [Anuncio de ganadores CODE — Gobierno de Canadá](https://www.canada.ca/en/news/archive/2014/03/team-from-ontario-wins-code-top-prize.html)

### 9. Shien Mitsumori Yadokari-kun — Governor’s Cup Open Data Hackathon 2023 (Japón)

**Estatus.** Gran premio del hackathon de datos abiertos del Gobierno Metropolitano de Tokio 2023.

- **Problema:** hogares vulnerables no saben a qué prestaciones pueden acceder ni cuál sería el importe aproximado.
- **Usuario:** familias y personas que necesitan apoyo, además de profesionales de intervención social.
- **Innovación:** simulador basado en reglas que, a partir de datos del hogar, estima prestaciones y cuantías; el artefacto abierto OpenFisca-Japan cubre ayudas infantiles, discapacidad, vivienda, desastres, impuestos y cotizaciones.
- **Mecanismo transferible:** codificar normativa y datos oficiales como reglas auditables; devolver elegibilidad, estimación y vía de acceso en una sola experiencia.
- **Qué no copiar:** un chatbot de ayudas o una estimación opaca presentada como resolución administrativa; fechas de vigencia, jurisdicción, supuestos y límites deben ser visibles.
- **Principio adaptable:** transformar normativa dispersa en una **simulación explicable que active un derecho**.
- **Fuentes primarias:** [Resultados oficiales 2023 — Gobierno Metropolitano de Tokio](https://odhackathon.metro.tokyo.lg.jp/collection/2023/) · [OpenFisca-Japan, artefacto del proyecto](https://pypi.org/project/openfisca-japan/)

### 10. Shipping Note — competición nacional de datos públicos 2024 (Corea del Sur)

**Estatus.** Finalista de la fase integrada de la 12.ª competición interministerial de emprendimiento con datos públicos; no se presenta aquí como ganador final.

- **Problema:** importadores y exportadores necesitan seguir en un solo lugar transporte marítimo y avance del despacho aduanero.
- **Usuario:** empresas de comercio exterior y equipos logísticos.
- **Innovación:** plataforma que monitoriza y comparte información en tiempo real de transporte y trámites aduaneros.
- **Mecanismo transferible:** reconstruir un “viaje” administrativo entre organismos y convertir eventos dispersos en estado, alertas y siguiente paso.
- **Qué no copiar:** limitarse a agregar estados de expediente; la utilidad diferencial exige detectar bloqueos, estimar tiempos y recomendar acciones.
- **Principio adaptable:** diseñar alrededor de un **proceso longitudinal**, no alrededor del catálogo o del organigrama productor del dato.
- **Fuentes oficiales:** [Finalistas 2024 — NIA](https://www.nia.or.kr/site/nia_kor/ex/bbs/View.do?bcIdx=27274&cbIdx=27974&parentSeq=27274) · [Modelo de la competición y evaluación — Ministerio del Interior y Seguridad](https://mois.go.kr/frt/sub/a06/b02/openData_5/screen.do)

### 11. data.gov.sg como producto medido — Open Government Products (Singapur)

**Estatus.** Producto GovTech activo; caso de referencia, no ganador de concurso.

- **Problema:** empresas, investigadores y ciudadanía esperaban semanas para obtener datos y no podían confiar fácilmente en frescura o escalabilidad.
- **Usuario:** reutilizadores profesionales, servicios públicos y ciudadanos que toman decisiones con datos de vivienda, transporte, clima o economía.
- **Innovación:** trata el portal como infraestructura de producto: más de 5.000 datasets de más de 70 organismos, APIs escalables, monitorización de frescura, investigación de usuarios y métricas públicas; declara 148 millones de llamadas API y 307.000 vistas de datasets mensuales.
- **Mecanismo transferible:** publicar un “report card” con uso, coste, satisfacción, cambios y problemas; medir el valor aguas abajo, por ejemplo, datos de precios de vivienda reutilizados por servicios inmobiliarios.
- **Qué no copiar:** construir otro portal de catálogo; el aprendizaje relevante es la disciplina de fiabilidad, métricas y co-creación con productores y reutilizadores.
- **Principio adaptable:** diseñar desde el principio un **contrato de servicio medible**: frescura, cobertura, disponibilidad, adopción y coste por uso.
- **Fuentes oficiales:** [Ficha y métricas de data.gov.sg — Open Government Products](https://reports.open.gov.sg/datagovsg/overview) · [Actualizaciones del producto](https://reports.open.gov.sg/datagovsg/updates) · [Modelo de report cards](https://products.open.gov.sg/)

### 12. BlindSquare — Apps4Finland 2012 (Finlandia)

**Estatus.** Ganador de la categoría de aplicaciones de Apps4Finland 2012.

- **Problema:** personas con discapacidad visual necesitan conocer lugares próximos y orientarse en entornos urbanos.
- **Usuario:** personas ciegas o con baja visión.
- **Innovación:** combina geodatos abiertos/globales con síntesis de voz del smartphone; su alcance se vuelve internacional por no depender de una base local cerrada.
- **Mecanismo transferible:** explotar capacidades nativas del dispositivo y accesibilidad para convertir geodatos en orientación contextual, no en mapa visual.
- **Qué no copiar:** el proyecto comenzó “al revés”, desde la combinación tecnológica antes de conocer al usuario; después recurrió a blogs y beta testers. Esa secuencia no debe replicarse.
- **Principio adaptable:** co-diseñar desde el primer día con usuarios afectados y usar accesibilidad como función central, no como adaptación final.
- **Fuente oficial:** [Apps4Finland y BlindSquare — Helsinki Region Infoshare](https://hri.fi/2years/3-apps4finland.html)

### 13. MyHelsinki Open API — premio HRI a la mejor apertura de datos 2018 (Finlandia)

**Estatus.** Mejor iniciativa de apertura de datos de HRI 2018.

- **Problema:** pequeños negocios y lugares de interés no pueden distribuir su oferta a grandes plataformas internacionales, y los datos turísticos se duplican y envejecen.
- **Usuario:** pequeños establecimientos, gestores de destinos y plataformas que redistribuyen información; indirectamente, visitantes.
- **Innovación:** formulario de contribución, revisión editorial municipal, base canónica y API abierta; permitió que lugares y eventos llegaran incluso al ecosistema WeChat.
- **Mecanismo transferible:** una única cadena **aportación local → validación → dato estructurado → distribución multicanal**.
- **Qué no copiar:** una nueva guía turística o catálogo de lugares; el activo valioso es la infraestructura de distribución y gobernanza.
- **Principio adaptable:** hacer que el dato local validado viaje a los canales donde el usuario ya toma decisiones, en vez de obligarle a visitar otro portal.
- **Fuente oficial:** [MyHelsinki Open API — Helsinki Region Infoshare](https://hri.fi/en_gb/best-open-data-initiative-of-2018-shares-helsinkis-data-to-a-billion-users/)

### 14. Hackathon de data.norge.no 2024 (Noruega)

**Estatus.** Iniciativa oficial de Digdir; caso de innovación pública, no concurso con un único ganador.

- **Problema:** publicar y encontrar descripciones de datasets y APIs exige demasiado trabajo técnico; la mala metadata reduce la reutilización.
- **Usuario:** productores de datos públicos y desarrolladores/reutilizadores.
- **Innovación:** equipos trabajaron directamente sobre el código abierto del portal: importación desde Excel u otros catálogos con validación automática, ejemplos DCAT-AP-NO y mejoras en la presentación de APIs; las contribuciones se orientaron a producción.
- **Mecanismo transferible:** abrir no solo los datos, sino también el código y el backlog del servicio público, para que un sprint produzca mejoras integrables.
- **Qué no copiar:** un hackathon desconectado del equipo propietario del sistema o sin ruta de incorporación a producción.
- **Principio adaptable:** competir sobre **problemas operativos reales del ecosistema de datos** y aceptar como resultado valioso una mejora reusable de infraestructura.
- **Fuente oficial:** [Resultados del hackathon — Digitaliseringsdirektoratet](https://www.digdir.no/datadeling/hackathon-pa-datanorgeno-apen-kildekode-og-crowdsourcing-i-praksis/6359)

## Patrones ganadores que se repiten

| Patrón | Evidencia internacional | Implicación para Castilla y León |
|---|---|---|
| Una decisión estrecha, no un tema amplio | renEUwable prioriza medidas; Hermix prioriza mercado; Sille prioriza inspecciones | Formular “¿qué debe hacer este usuario ahora?” antes de elegir datasets |
| Personalización con explicación | newRoots, Yadokari-kun, renEUwable | Mostrar variables, reglas, incertidumbre y alternativas que cambian la recomendación |
| Datos heterogéneos normalizados con conocimiento experto | Hermix, PRADOS, Shipping Note | La normalización y el modelo de dominio pueden ser más innovadores que el algoritmo |
| Bucle físico y verificable | Re-Fill City, FarmABetterFish, Sille | Instrumentar acción completada y resultado, no contar solo visitas o consultas |
| Usuario afectado + custodio del dato + implantador | TOP, Presidential Hackathon, Tokio | Presentar cartas de colaboración, entrevistas, prueba de campo y responsable de continuidad |
| El producto mejora el dato que consume | PRADOS, MyHelsinki, data.norge.no | Añadir validación, feedback o captura de huecos para que el sistema gane calidad con el uso |
| Distribución donde ya está el usuario | MyHelsinki API, data.gov.sg | API, integración o exportación a flujos existentes antes que otro portal aislado |
| Métricas de producto y costes transparentes | report cards de Singapur | Definir línea base, adopción, precisión, tiempo ahorrado, resultado y coste desde el MVP |
| Camino explícito de demo a servicio | TOP, Tokio, Taiwán | El jurado debe ver piloto, mantenimiento, gobernanza y siguiente organismo adoptante |
| Accesibilidad como innovación funcional | BlindSquare | Diseñar una modalidad accesible que cambie realmente la decisión, no solo cumplir formalmente |

## Antipatrones: lo que los referentes aconsejan evitar

1. **Mapa, dashboard o chatbot como propuesta completa.** Son interfaces; no sustituyen una decisión, una regla de priorización ni una acción.
2. **“Municipio ideal” genérico.** newRoots y el ganador de Tokio 2022 muestran que el recomendador territorial ya es un arquetipo internacional maduro; en Castilla y León tendría alto riesgo de saturación.
3. **IA decorativa.** Hermix gana por taxonomía, limpieza y conocimiento B2G; Yadokari-kun por reglas auditables. La IA solo debe aparecer donde supere una alternativa simple y verificable.
4. **Predicción sin protocolo.** Una puntuación de riesgo vale poco si no define quién actúa, en cuánto tiempo y cómo se valida.
5. **Datos abiertos como adorno.** En los mejores casos, el dato oficial modifica materialmente la recomendación y se puede trazar desde la salida hasta la fuente.
6. **Prototipo sin propietario.** TOP, Tokio y Taiwán premian o apoyan validación, alianzas e implantación; una demo aislada es una señal de fragilidad.
7. **Ignorar calidad y vigencia.** PRADOS y data.norge.no convierten esos límites en parte de la solución; ocultarlos destruye confianza.

## Principios de diseño directamente adaptables

Para maximizar diferenciación y atractivo ante jurado, el proyecto castellano-leonés debería cumplir simultáneamente estas condiciones:

- **Decisión de alto coste o alto riesgo:** el usuario pierde dinero, tiempo, acceso a un derecho o seguridad si decide mal.
- **Ventana de acción clara:** la recomendación llega cuando todavía se puede actuar.
- **Intersección de datos difícil de replicar:** al menos una unión entre fuentes que exija modelo de dominio, normalización o geocodificación no trivial.
- **Salida accionable:** “haz A antes de B”, con alternativa, motivo, fuente y grado de confianza.
- **Cierre del bucle:** registrar si la acción se realizó y, cuando sea posible, su resultado.
- **Prueba con usuario real:** evidencia cualitativa y cuantitativa, aunque el piloto sea pequeño.
- **Gobernanza:** responsable de reglas/datos, frecuencia de actualización, tratamiento de errores y ruta de sostenibilidad.
- **Impacto auditable:** una métrica pública más fuerte que tráfico —derechos activados, euros/horas ahorrados, incidencias evitadas, cobertura lograda o emisiones/residuos realmente reducidos—.

## Conclusión estratégica

La inspiración más fértil no es un tema internacional concreto, sino una arquitectura de valor: **detectar un momento de decisión desatendido, fusionar datos oficiales que hoy viven separados, producir una recomendación explicable, conectarla con una acción real y medir el resultado**. Los casos que más destacan además convierten limitaciones del ecosistema —calidad, interoperabilidad, vigencia o falta de coordinación— en parte del propio producto. Esa combinación ofrece más diferenciación que otra visualización territorial, recomendador de municipio, portal informativo o asistente genérico.
