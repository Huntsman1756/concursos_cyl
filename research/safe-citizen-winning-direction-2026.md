# Nueva dirección ciudadana de bajo riesgo — Concurso de Datos Abiertos de Castilla y León 2026

Fecha de revisión: 2 de agosto de 2026.

## Veredicto

**OJO queda descartada sin reutilizar ninguna de sus piezas.** Una aplicación que detecta un peligro o propone una respuesta puede ser interpretada como asesoramiento de seguridad y crear una responsabilidad innecesaria.

La dirección más firme que queda es **TRAMA 2248**, una aplicación de creación que convierte los datos territoriales reales de cualquiera de los 2.248 municipios de Castilla y León en un **kit gráfico editable y descargable**. No diagnostica, recomienda, puntúa ni decide por nadie.

Dos cribas independientes generaron y descartaron 26 y 27 mecanismos respectivamente. Ninguna encontró otra vía que superase a TRAMA al mismo tiempo en utilidad ciudadana, originalidad, centralidad del dato JCyL, viabilidad y baja exposición jurídica.

Su promesa en lenguaje sencillo es:

> **Elige los lugares de tu vida y crea en tres minutos un cartel, una invitación, un fondo para redes o un patrón editable cuya forma procede de esos lugares reales.**

No debe presentarse como «arte generativo» ni como «un póster de tu pueblo». Resuelve una tarea concreta: una persona, familia, peña, asociación, club o pequeño creador necesita material gráfico local y reutilizable, pero no sabe diseñar, no dispone de imágenes propias o no quiere depender de fotografías ajenas, stock genérico o una imagen generada por IA.

## Qué hace exactamente la aplicación

1. La persona elige uno, dos o tres municipios significativos para ella y el año 2020, 2021 o 2022.
2. El contorno municipal y trece categorías publicadas de uso del territorio generan una trama única mediante reglas visibles y deterministas.
3. La persona escoge un uso: cartel A4, invitación, publicación vertical, fondo, patrón repetible o SVG para continuar editando.
4. Puede cambiar texto, paleta, grosor, rotación y composición, pero no alterar los valores de origen.
5. Descarga PNG, PDF o SVG junto con un «pasaporte del dato»: municipios, año, valores, transformación aplicada, fuente, fecha y atribución.

El MVP no necesita cuentas, cargas de fotografías, publicación comunitaria, IA generativa ni servidor pesado. Todo puede generarse en el navegador.

## El dato de la Junta es el motor, no decoración

La base combina:

- [Superficies de cultivos municipales](https://analisis.datosabiertos.jcyl.es/explore/dataset/superficies-de-cultivos-municipales/information/): 313.367 registros entre 2010 y 2022. Para 2022 hay exactamente **2.248 municipios × 13 categorías = 29.224 filas**.
- [Municipio, límites y categorías estadísticas](https://analisis.datosabiertos.jcyl.es/explore/dataset/municipio-limites-categorias-est/information/): **2.248 geometrías municipales** y atributos territoriales.

La auditoría local obtuvo un cruce completo: **2.248 de 2.248 municipios**. Ambos conjuntos declaran CC BY 4.0. En el MVP se usarán 2020–2022, cuando están presentes las trece categorías para cada municipio.

Reglas posibles:

- el contorno municipal define el área de recorte;
- la proporción de cada uso define área y densidad;
- secano y regadío modifican orientación o ritmo;
- el año determina la versión temporal;
- al combinar dos o tres municipios se genera un díptico o una trama entrelazada, nunca un promedio presentado como dato oficial.

Si se retiran estos datos, la pieza deja de existir. Eso la diferencia de una plantilla genérica a la que se añade el nombre de un municipio.

La salida debe decir siempre **«huella territorial publicada para 2022»**, no «situación actual», porque el último año sustantivo disponible es 2022.

## Por qué no es Canva, un mapa ni otra infografía

- **Canva/Figma** proporcionan lienzos y elementos genéricos; TRAMA genera un lenguaje visual a partir de datos regionales exactos y adjunta procedencia automáticamente.
- **Un mapa** sirve para localizar o navegar; aquí la geometría se transforma en material editable y el resultado se utiliza fuera de la aplicación.
- **Una infografía** comunica una conclusión cerrada; aquí el ciudadano crea un activo propio sin que la aplicación interprete los datos por él.
- **Una IA de imágenes** inventa píxeles desde un modelo; aquí la misma entrada produce una transformación reproducible y auditable.
- **Un recomendador** termina en «haz esto»; TRAMA termina en un archivo que el usuario puede guardar, imprimir o seguir editando.

Esto evita también la colisión con «Mini Dosis de Datos» de 2024 y con las visualizaciones generales ya presentadas.

## Precedentes oficiales que validan el mecanismo

- [Build Your Own Singaporean v2](https://www.hack.gov.sg/2025/build-your-own-singaporean--byos--v2/), de Open Government Products de Singapur, permite a ciudadanos y empleados públicos crear personajes y escenas locales y exportarlos. Su problema declarado es que los recursos existentes eran inconsistentes, poco representativos y difíciles de personalizar por personas no diseñadoras. El equipo produjo 51 escenas editables en 3,5 semanas.
- [BDnF — La fabrique à BD](https://editions.bnf.fr/bdnf-la-fabrique-a-bd), de la Biblioteca Nacional de Francia, convierte materiales públicos en obras editables y exportables. El informe de actividad de la BnF de 2022 registra 460.000 usuarios y cerca de 860.000 proyectos.
- [Chicago Design System](https://design.chicago.gov/start/) fue concebido por la ciudad como un sistema de diseño para uso público y gubernamental y como medio de expresión de orgullo personal, comunitario y cívico. La propia página advierte que hoy no se mantiene activamente, por lo que se usa como precedente conceptual, no como prueba de adopción actual.
- [NASA Space Jam](https://science.nasa.gov/science-research/astrophysics/space-jam-app/) demuestra que parámetros reales pueden convertirse en controles creativos comprensibles; superó un millón de visitas después de su lanzamiento de 2022.

TRAMA no copia ninguno. Une tres mecanismos que no aparecen juntos: **identidad local abierta + parámetros territoriales reales + editor ciudadano + archivo reutilizable con procedencia**.

## Seguridad jurídica y reputacional por diseño

- No emite diagnóstico, predicción, recomendación ni puntuación.
- No interviene en salud, seguridad, derecho, dinero o emergencias.
- No pide datos personales; el texto introducido se procesa localmente y no se guarda.
- No permite subir imágenes, voz o documentos en el MVP.
- No aloja una galería pública; por tanto no necesita moderar contenido de terceros.
- Utiliza vectores originales, tipografías abiertas y datos con licencia declarada.
- La atribución y la fecha viajan con cada exportación.
- No genera escudos, logotipos ni sellos que puedan confundirse con identidad institucional.
- Cada archivo se marca como **«creación ciudadana basada en datos abiertos; no es una imagen oficial»**.
- No promete exclusividad de marca ni ofrece conclusiones jurídicas sobre la reutilización.

## Colisión con candidaturas anteriores

El corpus de 256 candidaturas contiene «Análisis de cultivos», «Agromapa», «Ubicación óptima del cultivo» y «Los cultivos de Castilla y León». Todos tratan el dato como mapa, análisis o recomendación agraria. También existen relatos generales, widgets y muchas visualizaciones.

No se encontró una candidatura que transforme el contorno y las trece proporciones de cada municipio en un **sistema gráfico editable y exportable**. Para conservar esa diferencia, el producto no incluirá mapas, búsqueda de lugares cercanos, rendimiento agrario, consejos de cultivo ni una sección de indicadores.

## Evaluación contra los siete criterios del concurso

La siguiente escala de 0 a 5 es interna; la convocatoria establece criterios con el mismo peso, pero no esta puntuación numérica.

| Criterio | Puntuación | Razón |
|---|---:|---|
| Utilidad y usuarios | 4/5 | Produce materiales que pueden usar ciudadanos, familias, asociaciones, clubes y pequeños creadores. |
| Valor económico | 4/5 | Ahorra preparación gráfica y genera SVG reutilizable para impresión, comunicación o creación. |
| Valor público/social | 4/5 | Da la misma capacidad de representación a los 2.248 municipios, no solo a las localidades con más recursos visuales. |
| Originalidad | 5/5 | No hay precedente interno de identidad visual generativa gobernada por la huella territorial completa. |
| Datos | 4/5 | Dos conjuntos JCyL centrales, voluminosos, licenciados y unidos al 100 %; resta un punto por llegar solo a 2022. |
| Facilidad y accesibilidad | 5/5 | Flujo corto, sin cuenta, controles acotados, contraste comprobado, teclado y descripción textual de la pieza. |
| Calidad técnica | 4/5 | SVG paramétrico, reglas reproducibles, exportación multiformato y trazabilidad; es viable antes del cierre. |
| **Total interno** | **30/35** | Es una expectativa comparativa, no una predicción del jurado. |

La [convocatoria oficial de 2026](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) exige una URL pública y el uso de al menos un conjunto del portal. El plazo termina el 21 de septiembre de 2026. TRAMA puede cumplir ambos sin cooperación institucional.

## Debilidad real y prueba de muerte

La principal amenaza no es legal ni técnica: **que el público lo considere bonito, pero innecesario**. Por eso no debe construirse todavía toda la aplicación.

Primero se debe generar una prueba con doce municipios muy distintos y tres encargos reales:

1. una invitación personal que alguien vaya a enviar;
2. un cartel o publicación que una asociación, peña o club vaya a utilizar;
3. un patrón/SVG que una persona creadora quiera reutilizar.

Condiciones mínimas para continuar:

- una persona no diseñadora termina una pieza sin ayuda en menos de tres minutos;
- entiende que el dibujo deriva de datos de 2022 y no es un mapa actual;
- puede explicar para qué va a usar el archivo;
- el resultado se distingue de una plantilla genérica sin leer la memoria del concurso;
- al menos tres piezas terminan en un uso real, no solo en «me gusta».

Si la prueba solo genera elogios estéticos y ninguna reutilización, **TRAMA también se descarta**. Ese control es imprescindible para no repetir el error de invertir primero y justificar la utilidad después.

## Alternativas rechazadas en esta ronda

- **DATO A ESCENA**: editor de tiras y clips con datos. Tiene utilidad, pero corre demasiado riesgo de parecer «Mini Dosis de Datos» con animación.
- **LATIDO 2248**: instrumento musical basado en la huella municipal. Es muy original y seguro, pero para buena parte del público sería una curiosidad.
- **PLIEGA**: objeto de papel generado desde la misma huella. Es una salida maker interesante, pero exige impresión y plegado; solo tendría sentido como ampliación posterior, no en el MVP.
- **Tus 100 €**: simulador de presupuesto autonómico. Se descarta porque trata como intercambiables partidas que el conjunto no demuestra que lo sean, no abre una decisión real al ciudadano y colisiona con la visualización presupuestaria de 2025.
- **Remezcla patrimonial**: bloqueada por falta de un corpus visual JCyL con derechos de reutilización inequívocos.
- **Fábrica gráfica genérica**: el dato autonómico sería prescindible y colisionaría con widgets y relatos ya presentados.

## Decisión recomendada

La única inversión justificada ahora es un **prototipo de descarte de TRAMA 2248**, no el desarrollo completo. Si supera la prueba de uso real, ofrece una candidatura diferenciada, segura, técnicamente alcanzable y defendible en los siete criterios. Si no la supera, se abandona sin haber consumido el calendario del concurso.
