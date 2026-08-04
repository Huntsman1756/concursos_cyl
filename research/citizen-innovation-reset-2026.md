# Reinicio de concepto ciudadano — IX Concurso de Datos Abiertos de Castilla y León (2026)

Fecha de análisis: 2 de agosto de 2026.

## Veredicto

La dirección con mejor combinación de utilidad masiva, originalidad, centralidad del dato de la Junta, demostración memorable y viabilidad antes del 21 de septiembre es **OJO**, una aplicación web móvil que convierte una fotografía de una situación cotidiana en una corrección preventiva verificable.

No es un mapa, un buscador, un panel, un chatbot, un comparador, un calendario ni una aplicación para que la Administración gestione expedientes. La usa directamente una persona en su cocina, escalera, garaje, terraza o antes de una actividad: fotografía, comprende un indicio visible, ve un incidente real análogo de Castilla y León, corrige ese indicio y toma una segunda fotografía para comprobar el cambio.

La segunda dirección, claramente por detrás, es **ContraGráfico**, que reconstruye un gráfico recibido por redes o mensajería, detecta deformaciones visuales y lo contrasta con la serie oficial completa. Debe conservarse como reserva, no desarrollarse en paralelo.

## Puertas de entrada aplicadas

Una idea solo sobrevive si cumple simultáneamente:

1. Puede ser entendida y utilizada sin profesión, expediente, enfermedad, condición familiar ni relación previa con la Junta.
2. El verbo principal es **examinar, ensayar, corregir, crear o comprobar**, no consultar, buscar, ordenar o resumir.
3. Evita una pérdida, un daño o una decisión equivocada y termina en una acción concreta.
4. Al menos un dato de la Junta cambia materialmente el resultado; no sirve como adorno local.
5. Funciona sin datos internos, convenio institucional, red previa de colaboradores ni masa crítica de usuarios.
6. Admite un producto público y convincente en unas seis semanas.
7. Cada resultado puede explicar su fuente y sus límites.
8. No colisiona con las 256 candidaturas históricas revisadas.
9. Puede demostrarse en menos de un minuto y el resultado cambia ante el jurado.
10. No promete una precisión que los datos no permiten.

## Embudo de conceptos

| Mecanismo | Resultado | Motivo principal |
|---|---|---|
| Foto de una escena → indicio → corrección → segunda foto | **Sobrevive: OJO** | Acción inmediata, ciudadanía general, dato 112 explicable y demostración visual |
| Captura de un gráfico → reconstrucción → contexto oficial | **Reserva: ContraGráfico** | Alta originalidad y valor social; menor valor económico y mayor dificultad para enlazar cualquier gráfico con su fuente |
| Plan personal → simulación ramificada de un incidente 112 | Se integra en OJO | Solo como producto independiente se acerca demasiado a juego o recurso didáctico |
| Escáner de productos retirados o códigos QR | Descartado | Verificador de registro; patrón ya excluido y dato JCyL débil |
| Foto de ticket → inflación personal → cesta alternativa | Descartado | No hay precios de sustitutos ni catálogo comercial vivo; el resultado sería aproximado o trivial |
| Foto de contrato → consecuencias a doce meses | Descartado | Riesgo jurídico, dependencia de interpretación generativa y dato JCyL decorativo |
| Foto de despensa o nevera → plan de consumo | Descartado | Producto genérico, datos externos incompletos y eje ambiental ya descartado |
| Escáner de botiquín | Descartado | Riesgo médico, identificación poco fiable y datos autonómicos no causales |
| Generación visual de futuros para espacios públicos | Descartado | La acción termina dependiendo de la Administración y de participación colectiva |
| Juego de redistribución de 100 euros de presupuesto | Descartado | Didáctico; no cambia una decisión real del usuario |
| Simulador contrafactual electoral | Descartado | Uso cíclico, neutralidad delicada y resultado principalmente didáctico |
| Escáner de accesibilidad de habitaciones | Descartado | Necesidad real, pero uso condicionado y sin dato JCyL suficientemente central |
| Reconstrucción de archivos o fotografías históricas | Descartado | Colisión parcial con proyectos anteriores y utilidad práctica baja |
| Simulación de demanda hospitalaria | Descartado | Riesgo de inducir decisiones sanitarias y orientación hacia gestión pública |
| Tarjeta de riesgo antes del turno laboral | Descartado | Conjunto de datos sólido, pero limitado a una profesión o sector |
| Simulador de continuidad del comercio local | Descartado | No existen existencias ni horarios fiables; deriva en directorio |

## Concepto recomendado: OJO

### Promesa

**“Haz una foto. OJO te enseña qué indicio visible conviene corregir, qué ocurrió en un caso real parecido y comprueba que lo has cambiado.”**

La aplicación no certifica que un lugar sea seguro ni detecta peligros invisibles. Detecta únicamente una taxonomía limitada de **indicios observables**, con umbral de confianza alto. Nunca muestra “todo seguro”; muestra “este indicio concreto ya no aparece”.

### Experiencia de usuario

1. La persona entra sin registro y elige una escena: cocina, baño/escalera, garaje/bricolaje o preparación de una salida.
2. Hace o sube una fotografía.
3. OJO marca como máximo tres indicios visibles y permite confirmar o descartar cada uno. Si aparece un aparato de combustión u otro objeto cuyo riesgo no pueda deducirse de la imagen, formula una pregunta cerrada; jamás afirma detectar monóxido, gas, temperatura, tensión eléctrica o estabilidad estructural mediante una foto.
4. Para cada indicio muestra:
   - **Lo que veo**, con evidencia visual y nivel de confianza.
   - **La cadena que puede iniciarse**, sin asignar probabilidad.
   - **Un caso real análogo**, enlazado al 112 de Castilla y León.
   - **Una acción de menos de dos minutos**, procedente de una regla preventiva oficial versionada.
5. La persona corrige la escena y repite la fotografía.
6. OJO compara antes/después y confirma solo la desaparición del indicio elegido. Las fotografías se eliminan por defecto; la tarjeta compartible no contiene la imagen del hogar.

Ejemplo de demostración: paño u objeto combustible demasiado próximo a una fuente de calor → relato local de incendio de cocina → separar el objeto y despejar la zona → segunda foto → “proximidad corregida”.

### Por qué el dato de Castilla y León es central

El conjunto [Emergencias solo último año histórico](https://analisis.datosabiertos.jcyl.es/explore/dataset/emergencias-solo-ultimo-ano-historico/information/) contiene **2.423 relatos** fechados entre el 31 de diciembre de 2022 y el 31 de diciembre de 2025, con título, narración, localidad, fecha, medios movilizados y enlace al incidente. Frente a esa selección, el [portal oficial del 112](https://www.112.jcyl.es/web/es/emergencias-castilla-leon.html) informa de **952.222 llamadas solo en 2025**.

Una clasificación exploratoria por expresiones de los títulos —categorías solapadas, no estadísticas oficiales— encontró al menos 201 menciones de vivienda/hogar, 257 de fuego, humo o gas y 515 de rescate o accidente exterior. Una búsqueda conservadora en los textos encontró alrededor de 150 narraciones con alguna formulación explícita de causa o desencadenante. Esto permite construir manualmente una primera biblioteca de cadenas **contexto → indicio/desencadenante → consecuencia → respuesta**, pero no calcular tasas ni probabilidades.

Casos aptos para una demostración trazable incluyen:

- [Incendio de una sartén en Villardeciervos](https://112.jcyl.es/web/jcyl/112/es/Plantilla100Detalle/1284178030391/Incidente/1285532987359/Emergencia).
- [Intoxicación por monóxido en una vivienda en Ocejo de la Peña](https://112.jcyl.es/web/jcyl/112/es/Plantilla100Detalle/1284178030391/Incidente/1285594069555/Emergencia).
- [Dos intoxicados por monóxido en una vivienda en Ponferrada](https://112.jcyl.es/web/jcyl/112/es/Plantilla100Detalle/1284178030391/Incidente/1285570207083/Emergencia).

El corpus es una selección editorial de incidentes comunicados, no el universo de llamadas al 112. Por tanto, OJO puede recuperar **análogos reales**, pero no afirmar “este riesgo es frecuente”, estimar una probabilidad personal ni comparar municipios. Tampoco puede decidir por sí solo qué peligros deben priorizarse. Su función material es otra: **delimita la taxonomía inicial a situaciones para las que existe un caso regional trazable y determina qué relato y qué cadena de respuesta se muestran**. Si no hay caso suficientemente análogo y regla oficial, OJO no produce esa advertencia.

Las acciones preventivas se obtendrían de fuentes técnicas como la [guía del INSST para identificar y reducir riesgos en el hogar](https://www.insst.es/documentacion/material-tecnico/documentos-tecnicos/buenas-practicas-preventivas-en-servicio-domestico-ano-2021) y los materiales del [Ministerio de Sanidad sobre seguridad en el hogar y el ocio](https://www.sanidad.gob.es/areas/promocionPrevencion/lesiones/ocioHogar/). La IA localiza indicios; no inventa recomendaciones.

### Inspiración internacional, sin copia literal

- El Ministerio de Gestión de Emergencias de China lanzó en mayo de 2026 [“Quiero fotografiar un peligro”](https://www.mem.gov.cn/xw/yjglbgzdt/202605/t20260512_603206.shtml): una persona fotografía su entorno, el sistema identifica posibles peligros y ofrece prevención. No publica todavía métricas de uso o precisión ni incorpora comprobación posterior.
- La FAO y Penn State demostraron con [PlantVillage Nuru](https://www.fao.org/newsroom/detail/Nuru-becomes-African-farmers-newest-ally-against-Fall-Armyworm/es) que una cámara puede convertir una señal difícil de reconocer en diagnóstico y acción inmediata, incluso sin conexión, aunque se dirige a agricultura.
- La Oficina del Gabinete de Japón ofrece un [simulador de prevención y evacuación](https://www.bousai.go.jp/simulator/) basado en decisiones dentro de un incidente; OJO toma de ahí el ensayo de consecuencias, no el formato de juego.

La aportación nueva es la combinación completa: **escena real del ciudadano → indicio limitado y explicable → incidente local trazable → acción oficial → verificación antes/después**.

### Colisión histórica

No se encontró ese flujo entre las 256 candidaturas revisadas. Los proyectos más próximos son distintos:

- `SEGUR APP Castilla y León` (2025): prevención del delito.
- `Ambulanc-IA`: gestión de emergencias sanitarias.
- Mapa de desfibriladores: directorio geográfico.
- `Fire Monitor CyL`: información y predicción de incendios forestales.
- `GuiameValladolid`: reconocer monumentos mediante una foto.
- Detección de vertederos ilegales con imágenes aéreas: vigilancia ambiental.

Ninguno examina una escena privada cotidiana, recupera un incidente 112 análogo, prescribe una microcorrección oficial y comprueba visualmente el cambio.

### Viabilidad técnica hasta el 21 de septiembre

Un MVP serio debe limitarse a **8–12 indicios observables** en cuatro escenas. Una revisión inicial del corpus sí encuentra material explícito sobre cocina/sartenes, aparatos de combustión, caídas desde tejados o forjados y determinados accidentes con herramientas; no hay evidencia narrativa suficiente para prometer veinte clases fiables. Arquitectura mínima:

- PWA accesible, sin cuenta, con cámara y carga de archivo.
- Modelo visual restringido que devuelve etiquetas, evidencia y confianza en JSON.
- Reglas preventivas versionadas y revisables; ninguna recomendación libre generada por el modelo.
- Índice semántico de incidentes 112 previamente curados.
- Comparación antes/después sobre el indicio concreto.
- Fotografías transitorias, sin entrenamiento ni almacenamiento por defecto.
- Banco de prueba etiquetado y publicación de precisión, falsos positivos y límites por clase.

La salida de baja confianza se oculta. La aplicación nunca retrasa una emergencia: si el usuario indica que el incidente está ocurriendo, abandona el análisis y muestra la instrucción de llamar al 112.

### Ajuste provisional a los siete criterios

| Criterio de las bases | OJO | ContraGráfico |
|---|---:|---:|
| Utilidad y número potencial de usuarios | 4,5/5 | 4/5 |
| Valor económico | 4/5 | 2,5/5 |
| Valor social y público | 5/5 | 4,5/5 |
| Originalidad | 4,5/5 | 4,5/5 |
| Variedad y relevancia de datos, especialmente JCyL | 3,5/5 | 4,5/5 |
| Facilidad, accesibilidad y usabilidad | 4,5/5 | 4/5 |
| Calidad técnica demostrable | 4/5 | 3,5/5 |
| **Total interno orientativo** | **30/35** | **27,5/35** |

No es una predicción del jurado. Sirve para no sacrificar seis criterios por una idea llamativa en uno solo.

## Reserva: ContraGráfico

La persona comparte una captura de un gráfico. La aplicación extrae ejes y valores, detecta trucos mecánicos —eje truncado, proporciones incoherentes, intervalos desiguales, acumulados presentados como flujo— y reconstruye la misma información sin esa deformación. Cuando identifica una serie del portal de la Junta, añade el periodo completo, denominador y consulta reproducible. Nunca emite un veredicto genérico de “verdadero/falso”.

Tiene respaldo conceptual: `BiasLenz` ganó en 2023 el reto de detección de desinformación de [GovHack](https://govhack.org/2023-winners/), y el portal europeo explica por qué [un gráfico puede engañar aun usando datos correctos](https://data.europa.eu/ga/publications/datastories/honest-charts-ethics-and-integrity-data-visualisation). No aparece una candidatura equivalente en el histórico de Castilla y León.

Queda segunda porque el emparejamiento automático entre una imagen cualquiera y uno de 430 conjuntos es frágil, el valor económico es menos directo y un MVP fiable tendría que limitarse a barras y líneas. OJO tiene una acción física, una demostración más clara y un beneficio más fácil de defender.

## Decisión recomendada

Abandonar las familias anteriores y avanzar únicamente con **OJO**. La siguiente fase no debe ser programar de inmediato, sino cerrar una prueba de concepto de riesgo: seleccionar entre 8 y 12 indicios que tengan a la vez un caso 112 regional suficientemente explícito y una regla preventiva oficial, y comprobar con un lote de imágenes si la precisión permite una demostración responsable. La prueba debe incluir una revisión adversarial de si el dato JCyL cambia de verdad la experiencia o queda como simple ilustración. Si falla cualquiera de esas dos condiciones, se activa ContraGráfico; no se vuelve a los mapas, buscadores o trámites.
