# Auditoría 2026 — «Biblioteca antes de comprar»

**Fecha de corte:** 3 de agosto de 2026  
**Categoría examinada:** Productos y Servicios  
**Veredicto:** **superviviente condicional, no finalista confirmado**. Solo debe desarrollarse si RABEL ofrece acceso público, documentado y estable al catálogo **y a la disponibilidad por ejemplar**. Sin ese acceso, el núcleo no es demostrable y la propuesta debe descartarse, no sustituirse por otra idea dentro de este informe.

## 1. Qué haría la aplicación

Antes de pagar por un libro o una película, la persona escanea su ISBN/EAN, comparte el producto desde otra aplicación o escribe el título. El sistema contesta con estados verificables:

1. **Disponible ahora en digital**, mediante eBiblio, CineCyL o la Biblioteca Digital de Castilla y León.
2. **Disponible físicamente**, indicando ejemplar, centro y estado observado en RABEL.
3. **Prestado pero reservable**, únicamente cuando la política real del centro lo permita.
4. **No encontrado o estado desconocido**, sin inventar disponibilidad.

Los resultados se guardan en una lista. El modo **«mínimos viajes»** agrupa varios títulos en el menor número de centros o visitas posibles. En el medio rural puede cruzar la lista con la próxima parada publicada del bibliobús, pero nunca prometer que el vehículo lleva o reservará un documento si ese dato no existe. La decisión terminada es sencilla: **usar ahora un acceso público, reservar cuando sea posible, planificar una recogida o comprar**.

No es un recomendador literario ni un chatbot. Su valor está en cotejar una obra concreta con un estado bibliotecario vigente justo en el momento de compra.

## 2. Materia prima real de Castilla y León

- [RABEL](https://gobiernoabierto.jcyl.es/web/jcyl/GobiernoAbierto/es/Plantilla100Detalle/1284621684532/Catalogo/1285036684832/) declara cerca de **tres millones de títulos** —libros, publicaciones, películas, grabaciones, mapas y otros materiales—. Es la única fuente regional con capacidad potencial para cambiar la decisión de compra de una obra concreta.
- El conjunto [Puntos de servicio móvil de los bibliobuses](https://analisis.datosabiertos.jcyl.es/explore/dataset/relacion-de-puntos-de-servicio-movil-de-los-bibliobuses-de-castilla-y-leon/information/) contiene **733 paradas**, con ruta, periodicidad, horas, fechas e incidencias y actualización diaria.
- El inventario [Bibliotecas, bibliobuses y puntos de servicio móvil](https://analisis.datosabiertos.jcyl.es/explore/dataset/bibliotecas-bibliobuses-y-puntos-de-servicio-movil-geolocalizados/information/) reúne **1.126 centros o puntos**.
- La propia Junta mantiene [eBiblio Castilla y León](https://castillayleon.ebiblio.es/home), [CineCyL](https://cinecyl.efilm.info/es/cinecyl/) y la [Biblioteca Digital de Castilla y León](https://bibliotecadigital.jcyl.es/).

La auditoría histórica local comprende **256 candidaturas netas** extraídas de los siete libros aportados. No aparece el flujo completo `escanear antes de pagar → cotejar acceso público multiformato → formar lista → minimizar desplazamientos`. Esto reduce la colisión funcional histórica, pero no elimina la colisión con productos oficiales existentes.

## 3. Colisión que impide venderla como «nueva app de bibliotecas»

[Biblio JCyL](https://play.google.com/store/apps/details?id=com.bibliotecas.bibliojcyl), de la Junta, supera 50.000 descargas y fue actualizada el 25 de junio de 2026. Ya ofrece catálogo colectivo, reservas y renovaciones, eBiblio, acceso a la Biblioteca Digital, carnés familiares, propuestas de compra y agenda. Además, la candidatura histórica **BibliobusCyL** ya ocupó horarios, incidencias y novedades del servicio móvil.

Por tanto, catálogo, cuenta, reserva, mapa, horario o aviso **no son innovación defendible**. La mejora solo sobrevive si empieza fuera de la biblioteca —en una librería, comercio electrónico o conversación donde aparece una obra— y resuelve la comparación antes de comprar más el agrupamiento de una lista.

La propia política limita la promesa transaccional: en RABEL [solo se reservan ejemplares prestados o ya reservados](https://bibliotecas.jcyl.es/web/es/bibliotecaleon/servicios/renovaciones-reservas.html), y los [bibliobuses de Burgos no admiten reservas](https://bibliotecas.jcyl.es/web/es/bibliotecaburgos/bibliotecas-burgos/prestamo-personal-bibliobuses-burgos.html). «Disponible» no equivale, por tanto, a «apartado para mí».

## 4. Referentes oficiales y diferencia legítima

La operación no es hipotética. Las aplicaciones públicas de [Lambeth](https://libraries.lambeth.gov.uk/-/lambeth-libraries-app) y [Leicester](https://news.leicester.gov.uk/news-articles/2024/february/leicester-libraries-launch-new-app/) permiten escanear en una librería y comprobar si la biblioteca tiene el libro; [Hampshire](https://www.hants.gov.uk/librariesandarchives/library/membership/spydus-app) escanea ISBN fuera de la biblioteca y consulta copias disponibles. La National Library Board de Singapur documenta una [API oficial de catálogo y disponibilidad por ejemplar](https://openweb.nlb.gov.sg/api/swagger/index.html).

El mecanismo transferible es `identificador comercial → catálogo público → disponibilidad real → alternativa gratuita accionable`. La aportación específica de Castilla y León sería cruzar en una sola decisión los fondos físicos, digitales y patrimoniales y optimizar una lista para un territorio disperso. No debe afirmarse que el escaneo en sí es novedoso.

## 5. Bloqueo técnico decisivo

No se ha localizado documentación de una API pública de RABEL. Su [robots.txt](https://rabel.jcyl.es/robots.txt) bloquea `/cgi-bin/`; esto no demuestra que una API no exista, pero sí impide justificar un producto apoyado en extracción frágil o contraria a las condiciones del servicio. Tampoco se ha acreditado una API pública común para disponibilidad en eBiblio y CineCyL.

Antes de construir hay una única puerta de continuidad: obtener de la Junta documentación o permiso de reutilización con consulta por ISBN/título, identificador de edición, centro, tipo de material, estado del ejemplar y fecha de actualización. Debe probarse además la correspondencia entre ediciones, los límites de frecuencia y la estabilidad del servicio. **No vale presentar scraping como arquitectura.**

## 6. Evaluación según los siete criterios de 2026

La convocatoria de [2026](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html) no publica ponderaciones numéricas para Productos y Servicios. La escala siguiente, de 1 a 5 y con criterios tratados por igual, es una estimación comparativa interna.

| Criterio | Con API pública de disponibilidad | Sin API pública |
|---|---:|---:|
| Utilidad | 4,5 | 2,0 |
| Valor económico | 4,0 | 1,5 |
| Valor público/social | 4,5 | 3,0 |
| Originalidad e innovación | 3,5 | 2,0 |
| Variedad de conjuntos | 4,5 | 2,0 |
| Facilidad de uso y accesibilidad | 4,5 | 3,0 |
| Calidad técnica | 4,5 | 1,0 |
| **Total interno /35** | **30,0** | **14,5** |

Con API, la utilidad, el ahorro potencial, el acceso cultural rural y una demostración escáner-a-acción pueden compensar una originalidad solo media. Sin API, la aplicación no conoce el estado decisivo, no puede probar ahorro ni minimizar visitas y termina como buscador, directorio o envoltorio de enlaces: categorías ya cubiertas y poco competitivas.

## Decisión

**Mantener únicamente como superviviente condicional durante una validación técnica corta.** La condición no es conseguir una futura colaboración institucional, sino demostrar ahora un canal público y reutilizable. Si no aparece una API o exportación autorizada con disponibilidad por ejemplar, se mata el concepto. Si aparece, el prototipo debe competir por el momento «antes de comprar» y por la lista de mínimos viajes; nunca como reemplazo de Biblio JCyL ni como mapa de bibliotecas.
