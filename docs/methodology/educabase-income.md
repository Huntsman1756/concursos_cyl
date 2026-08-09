# EDUCAbase: evidencia de ingresos de titulados de FP

## Alcance aprobado

SALIDA CyL publica dos referencias que se mantienen separadas:

1. ciclo o grupo oficial en España; y
2. nivel formativo (Grado Medio o Grado Superior) en Castilla y León.

No existe en estas tablas una celda que cruce ciclo con Castilla y León. El
producto no fabrica ese cruce, no transforma un grupo agregado en un ciclo y
no presenta la referencia como una predicción personal.

La medida es la base de cotización por contingencias comunes anualizada de
personas afiliadas por cuenta ajena que trabajan a jornada completa. Es una
aproximación oficial a la remuneración bruta anual observada de esa población,
no una estimación para casos individuales.

La operación estadística parte de un cruce administrativo entre los registros
educativos de titulación y los registros de la Seguridad Social. No procede de
una encuesta ni realiza seguimiento individual desde la aplicación. La
**cohorte** es el curso académico en el que se obtuvo la titulación. El
**periodo de análisis** es el primer, segundo, tercer o cuarto año posterior a
la graduación.

La población cubierta se limita a personas graduadas que figuran afiliadas por
cuenta ajena con jornada completa. Por tanto, quedan fuera de esta medida el
trabajo por cuenta propia, la jornada parcial y cualquier situación que no
forme parte de esa población administrativa. El producto no completa esos
huecos con estimaciones.

## Tablas oficiales

Solo se admiten estas cuatro tablas. Cada una se obtiene en CSV y PC-Axis
desde su URL oficial exacta con `?nocab=1`:

| Tabla          | Alcance                                            | Catálogo                                                                                                                                                                                                                                                                 | Celdas esperadas |
| -------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------: |
| `famprof_2_08` | Grado Medio, ciclo/grupo, España                   | [EMLIN0000090080](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090080)                |            8.160 |
| `famprof_3_08` | Grado Superior, ciclo/grupo, España                | [EMLIN0000090094](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-periodo-de-analisis-medida-y-ciclo-grupo-emlin0000090094)             |           14.880 |
| `ccaa_2_07`    | Grado Medio, comunidad del centro de titulación    | [EMLIN0000090044](https://datos.gob.es/es/catalogo/e05230301-fp-grado-medio-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090044)    |           13.680 |
| `ccaa_3_07`    | Grado Superior, comunidad del centro de titulación | [EMLIN0000090057](https://datos.gob.es/es/catalogo/e05230301-fp-grado-superior-distribucion-de-las-bases-de-cotizacion-de-los-afiliados-por-cuenta-ajena-con-jornada-a-tiempo-completo-por-cohorte-comunidad-autonoma-sexo-periodo-de-analisis-y-medida-emlin0000090057) |           13.680 |

Las tablas nacionales no son un censo de todos los ciclos. La nota del
Ministerio indica que solo muestra ciclos o grupos de ciclos cuya información
es representativa. Algunos resultados agrupan ciclos dentro de una familia
profesional y la etiqueta oficial agregada se conserva sin atribuir el valor a
un ciclo individual.

Las notas oficiales identifican además estas inclusiones agrupadas:

- en Grado Medio, ciclos de **Edificación y Obra Civil**, **Energía y Agua** e
  **Industrias Extractivas**;
- en Grado Superior, ciclos de **Madera, Mueble y Corcho** y **Textil,
  Confección y Piel**.

Esta selección representativa explica por qué la aplicación dice «ciclos o
grupos incluidos» y no «cada ciclo». Las omisiones no se interpretan como un
valor cero ni como evidencia desfavorable.

En las tablas territoriales se seleccionan literalmente `Castilla y León` y
`AMBOS SEXOS`. Comunidad autónoma significa ubicación del centro docente donde
se obtuvo la titulación; no significa residencia, lugar de trabajo, empleador
ni ubicación de un puesto posterior.

## Medidas, quintiles y periodos

Se publican la media y los límites inferiores de los quintiles segundo,
tercero, cuarto y quinto. Estos límites corresponden a los percentiles 20, 40,
60 y 80; no son medias de cada quintil.

La cohorte identifica el curso académico de titulación y cada periodo cuenta
los años posteriores a esa graduación. Las cohortes hasta `2020-2021` tienen
cuatro años observados. `2021-2022 (p)`
tiene tres y `2022-2023 (p)` tiene dos. `(p)` marca provisionalidad sin cambiar
la disponibilidad. Los periodos posteriores a la ventana no se emiten: son
aún no observados, no celdas ausentes.

El token literal `..` se normaliza como valor nulo con el estado combinado
`no disponible o no representativo`, porque la fuente no permite separar las
dos causas. Nunca se convierte en cero.

## Descarga y verificación cerrada

El navegador no descarga los ficheros brutos. La compilación realiza ocho GET
binarios acotados a las URLs permitidas, con límite de 5 MiB, timeout y
reintentos limitados. Una redirección solo se acepta si termina por HTTPS en el
host y ruta oficiales permitidos.

- El CSV debe comenzar con BOM UTF-8. Se conserva el `Content-Type` declarado
  como evidencia, pero no se confía en su charset ISO erróneo.
- PC-Axis debe declarar `CODEPAGE="iso-8859-15"`, `DECIMALS=2` y
  `SHOWDECIMALS=0`, y se decodifica como ISO-8859-15.
- Cabeceras, dimensiones, etiquetas, notas, cardinalidades y celdas deben
  coincidir con el contrato. HTML, cuerpos vacíos, filas duplicadas, campos
  desconocidos o secuencias inválidas abortan la compilación.
- CSV y PC-Axis deben representar exactamente las mismas celdas. Los céntimos
  de PC-Axis se analizan como enteros decimales y se redondean half-up al euro
  mostrado por CSV; no se usa coma flotante para reconciliarlos.

No se incorporan otras tablas ni tasas ajenas a este contrato verificado.

## Publicación, manifiesto y última copia válida

La salida normalizada se publica como un único
`outcome-indicators.json` inmutable. El manifiesto incluye su ruta, fecha de
captura, número de registros y SHA-256, además de ocho entradas de procedencia
con tabla, formato, URL, ficha de catálogo, tipo de contenido, bytes,
codificación y SHA-256 del fichero bruto.

La compilación valida todos los datos antes de mover el manifiesto. Si falla
cualquier descarga, reconciliación o validación, el manifiesto anterior y su
recurso permanecen intactos. Una aplicación con un manifiesto histórico sin el
recurso opcional muestra la comparación como no disponible; no sustituye la
fuente.

## Condiciones y atribución

El publicador es el Ministerio de Educación, Formación Profesional y Deportes.
El catálogo oficial remite al
[aviso legal del Ministerio](https://www.educacionyfp.gob.es/comunes/aviso-legal.html),
que se registra sin cambiar su calificación ni sugerir respaldo institucional.
La licencia MIT del repositorio se aplica al código del proyecto, no a los
datos de origen.
