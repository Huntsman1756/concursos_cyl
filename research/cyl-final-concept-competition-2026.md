# Criba definitiva de conceptos — Concurso Datos Abiertos Castilla y León 2026

Fecha de corte: 2 de agosto de 2026.

## Resultado ejecutivo

Se cruzaron mecanismos observados en proyectos públicos internacionales con el catálogo real de Castilla y León y con 256 candidaturas históricas. Después se aplicaron cuatro puertas de descarte: viabilidad con datos abiertos actuales, colisión histórica, dependencia externa y puntuación probable según la rúbrica del concurso.

De doce conceptos, sobreviven tres:

1. **Preaviso 012** — previsión operativa de picos de demanda del 012 y calendario de comunicación preventiva.
2. **GuardiaFutura** — previsión horaria de llegadas a urgencias por hospital y nivel de triaje.
3. **Colecta Óptima** — previsión de asistencia a campañas de donación y priorización de refuerzo informativo.

La recomendación es **Preaviso 012**. Es el concepto con mejor equilibrio competitivo: problema público nítido, datos propios actuales, prueba retrospectiva objetiva, baja colisión histórica, utilidad institucional y ciudadana, y un MVP que no necesita convenio, sensores ni datos privados.

## Método de evaluación

La nota sobre 70 es una estimación interna, no una puntuación oficial. Se valoran de 1 a 10: utilidad (U), valor económico (E), valor público/social (S), originalidad (O), variedad de datos (D), facilidad de uso (F) y calidad técnica (T).

La nota no basta para sobrevivir. Un concepto se descarta aunque puntúe bien si falla cualquiera de estas puertas:

- **Viabilidad:** la decisión principal debe poder demostrarse con los campos realmente publicados.
- **Colisión:** no debe parecer una repetición de una candidatura anterior o de un tema saturado.
- **Dependencia:** el MVP no puede necesitar datos privados, sensores, acuerdos o adopción institucional previa.
- **Defendibilidad:** no puede convertir correlaciones en causalidad ni inferir necesidades que los datos no observan.

## Las doce opciones sometidas a descarte

| # | Concepto | Decisión que produce | Viabilidad | Colisión histórica | Dependencia externa | Nota /70 | Resultado |
|---:|---|---|---|---|---|---:|---|
| 1 | **Preaviso 012** | Anticipar qué días y canales del 012 requieren preparación y comunicación preventiva | Alta | Baja | Ninguna en MVP | **60** | **Supervive — recomendado** |
| 2 | **GuardiaFutura** | Anticipar llegadas por hospital, hora y triaje para revisar preparación operativa | Alta | Media-alta en sanidad | Ninguna en MVP | **61** | **Supervive con límites clínicos** |
| 3 | **Colecta Óptima** | Detectar campañas con asistencia esperada baja o composición atípica y decidir dónde reforzar difusión | Alta | Media: existe “Soy Donante”, pero era otro mecanismo | Ninguna en MVP | **59** | **Supervive con límites de inventario** |
| 4 | Conciliar 6M | Simular si una combinación de calendario, coste y cuidado permite aceptar formación o empleo | Media | Media | Datos laborales y de transporte mejorarían el cálculo | 56 | Reserva: demasiados supuestos personales |
| 5 | Dato Vivo | Priorizar qué conjuntos abiertos necesitan actualización, mejor esquema o documentación | Muy alta | Baja | Ninguna | 58 | Reserva: técnicamente fuerte, impacto ciudadano indirecto |
| 6 | Vacuna Ritmo | Identificar grupos territoriales donde una campaña pierde ritmo | Alta | Muy alta por saturación COVID/salud | Denominadores y estrategia de campaña | 53 | Descartado |
| 7 | Prevención 52 | Elegir semanas y sectores para reforzar prevención de accidentes laborales | Media | Media | Faltan causas detalladas y exposición laboral | 54 | Descartado |
| 8 | ABX Señal | Señalar patrones de prescripción antibiótica que merecen revisión | Alta | Media-alta en sanidad | Necesita contexto clínico y denominadores | 56 | Descartado por riesgo de interpretación |
| 9 | Control Muestra | Repartir inspecciones o muestras de control alimentario | Baja-media | Baja | Faltan volumen de actividad y riesgo por establecimiento | 52 | Descartado por granularidad insuficiente |
| 10 | ConsultaMix | Revisar la mezcla presencial, remota y domiciliaria de consultorios comparables | Alta | Muy alta en atención primaria | Validación organizativa | 57 | Descartado por colisión |
| 11 | Servicio Móvil en Riesgo | Avisar de campañas o servicios móviles afectados por incidencias viarias | Media | Alta en mapas/movilidad | Faltan rutas y cobertura de todas las vías | 53 | Descartado |
| 12 | Pacto en Prueba | Contrastar compromisos públicos con acciones e indicadores antes/después | Media | Media-alta en ayudas/impacto | Necesita contrafactuales externos | 54 | Descartado por antigüedad y riesgo causal |

## 1. Preaviso 012 — recomendación

### Qué hace

Convierte la actividad diaria del 012 en una previsión de demanda para los próximos 7, 14 y 30 días. No se limita a dibujar llamadas pasadas: entrega un calendario operativo con volumen esperado por canal, intervalo de incertidumbre, anomalías comparables y eventos públicos próximos que podrían justificar una comunicación preventiva.

### Usuario y decisión

- **Usuario principal:** coordinación del servicio 012 y responsables de comunicación digital de la Junta.
- **Decisión:** qué días preparar especialmente, qué canal observar y qué información publicar antes de que llegue el pico.
- **Beneficio ciudadano:** menos intentos fallidos y mejor elección del canal o momento de contacto.

### Datos reales disponibles

- **Actividad diaria 012:** 2.372 observaciones diarias; incluye llamadas, buzón de voz, correo, alertas, chat, nivel de atención y tiempo medio de operación.
- **Trámites:** 845 procedimientos actuales con público, plazos y detalle.
- **BOCYL:** más de 63.000 publicaciones con fecha, título y enlaces estructurados.
- Calendario laboral y administrativo publicado por la propia Junta.

### Prueba de que funciona

Se entrena siempre con el pasado y se simula una predicción como si todavía no se conocieran las semanas posteriores. Se compara contra tres bases simples: repetir la semana anterior, media del mismo día de la semana y media estacional. El proyecto solo puede afirmar mejora si reduce el error fuera de muestra y acierta más picos que esas bases.

### Límite que lo hace defendible

El dataset del 012 no contiene el motivo de cada consulta. Por tanto, el producto **no afirmará que un trámite o una publicación causó un pico**. Mostrará asociaciones temporales y eventos próximos como contexto explicable, separados de la predicción cuantitativa.

### MVP competitivo

1. Previsión diaria por llamadas, correo y chat.
2. Probabilidad de superar umbrales históricos, con incertidumbre visible.
3. Calendario de eventos administrativos extraídos de trámites y BOCYL.
4. Ficha retrospectiva de cada alerta: qué se predijo y qué ocurrió.
5. Recomendación limitada a “preparar/revisar/comunicar”, nunca a dimensionar plantilla automáticamente.

### Por qué puede ganar

Es una transformación clara de dato público en una decisión verificable; ofrece utilidad institucional y ciudadana; permite una demo viva y una evaluación matemática; y no aparece un precedente equivalente entre las candidaturas históricas revisadas.

## 2. GuardiaFutura — segunda dirección

### Qué hace

Pronostica el patrón de llegadas a urgencias por hospital, día, hora y nivel de triaje. La salida es un parte de demanda esperada y de desviaciones respecto a semanas comparables, no un mapa ni un diagnóstico clínico.

### Datos reales disponibles

- **Urgencias hospitalarias 2025–2026:** aproximadamente 1,69 millones de registros con fecha, día de la semana, hora, triaje, origen, hospital, área, provincia, edad y sexo.
- **Plantilla estructural de urgencias:** 59 registros para 14 hospitales.
- Actividad agregada de medicina de familia y enfermería, además de población y calendario.

### Prueba y límites

La prueba retrospectiva es fuerte: error por hospital/hora/triaje y capacidad para anticipar colas altas de llegadas. Sin embargo, los datos abiertos no publican cuadrantes, ocupación, tiempos de espera o camas disponibles. Por ello no puede afirmar “saturación”, indicar cuántos profesionales contratar ni prometer reducción de espera. Solo señala demanda esperada y franjas que merecen revisión.

### Por qué queda segunda

Tiene los mejores datos y enorme valor social, pero el territorio competitivo sanitario está muy ocupado y cualquier lenguaje impreciso sobre capacidad o seguridad clínica sería atacable por el jurado.

## 3. Colecta Óptima — tercera dirección

### Qué hace

Estima la asistencia esperada a una colecta programada según localidad, lugar, día, horario, estacionalidad e historial; también puede estimar la mezcla agregada de tipos de donación y grupos sanguíneos. Su salida es una lista de campañas que conviene reforzar informativamente y la razón de esa prioridad.

### Datos reales disponibles

- **Donaciones de sangre y aféresis:** aproximadamente 910.000 registros con fecha, lugar, edad, sexo, grupo sanguíneo y tipo de donación.
- **Colectas:** cerca de 19.700 registros con fecha, horario, provincia, localidad, ubicación, dirección y coordenadas.
- Población y calendario como denominadores y factores contextuales.

### Prueba y límites

Puede validarse ocultando campañas pasadas y comparando asistencia prevista con asistencia observada. Pero los datos abiertos no contienen inventario clínico, reservas actuales ni necesidades hospitalarias. Por tanto, el producto no dirá que “falta sangre” ni decidirá necesidades clínicas: anticipará rendimiento de campaña y necesidad de difusión.

### Por qué queda tercera

El beneficio social se entiende al instante y la demo sería convincente. Pierde posición porque “Soy Donante Castilla y León” ya ocupó el tema, aunque fuera una app de motivación y no un sistema predictivo de campañas, y porque la ausencia de inventario limita la historia de impacto.

## Por qué caen los anteriores supuestos finalistas

- **Tramo Primero / Puentes Primero:** además de la saturación histórica de movilidad y carreteras, recuperaba una dirección que ya había sido rechazada. Su puntuación no justifica ignorar esa señal.
- **Alta 90:** un alta por ictus, infarto o fractura no demuestra necesidad posterior de rehabilitación o cuidados. El concepto dependería de coeficientes externos y mezclaría escalas sanitarias y sociales.
- **Cuida Relevo:** los datos agregados de dependencia no observan plazas, demanda no atendida ni capacidad de respiro. Sin esas variables, acabaría como panel descriptivo.
- **Dato Vivo:** queda como plan B técnico. Es viable y original, pero optimiza el portal de datos más que una decisión cotidiana de alto valor público.

## Decisión recomendada

Avanzar con **Preaviso 012** y someterlo, antes de diseñar interfaz, a una auditoría breve de tres pruebas:

1. comprobar continuidad y cambios de definición de la serie diaria;
2. medir si existen patrones predictivos por canal por encima de bases simples;
3. verificar cuántos plazos y eventos futuros pueden extraerse de Trámites y BOCYL sin interpretación manual.

Si supera las tres, merece desarrollo. Si falla la segunda, se descarta sin coste hundido y se pasa a GuardiaFutura. Esta regla evita enamorarse del concepto antes de que los datos lo sostengan.

## Fuentes oficiales principales

- [Catálogo de datos abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/catalogo-datos/listado-conjuntos-datos.html)
- [Actividad diaria del servicio 012](https://analisis.datosabiertos.jcyl.es/explore/dataset/actividaddiaria012/)
- [Trámites de la Administración de Castilla y León](https://analisis.datosabiertos.jcyl.es/explore/dataset/tramites/)
- [Urgencias hospitalarias atendidas 2025–2026](https://analisis.datosabiertos.jcyl.es/explore/dataset/urgencias-hospitalarias-atendidas-20252026/)
- [Plantilla estructural de urgencias hospitalarias](https://analisis.datosabiertos.jcyl.es/explore/dataset/hospitales-plantilla-urgencias/)
- [Donaciones de sangre y aféresis](https://analisis.datosabiertos.jcyl.es/explore/dataset/donaciones-de-sangre-y-aferesis/)
- [Colectas de donación de sangre](https://analisis.datosabiertos.jcyl.es/explore/dataset/colectas-de-donacion-de-sangre/)
- [Ediciones anteriores del concurso](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/ediciones-anteriores.html)
- [Corpus internacional de mecanismos](./global-official-innovation-corpus.md)

