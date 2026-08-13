# Propuesta de correspondencias COM01S → CNO-11 (batch 2)

**Familia profesional:** Marketing y Publicidad (Técnico Superior)  
**Fuente oficial:** TodoFP — Ministerio de Educación, Formación Profesional y Deportes  
**URL:** https://www.todofp.es/que-estudiar/familias-profesionales/comercio-marketing/marketing-publicidad.html  
**Fecha de consulta fuente:** 2026-08-13  
**Catálogo CNO-11 utilizado:** `data/curated/occupations.json` (v1.0.0)  
**Fecha del catálogo:** 2026-08-13

## 1. Salidas con candidato válido en el catálogo

_Ninguna._ Tras aplicar el criterio conservador que rechaza sustituciones basadas en mera proximidad comercial, mediática o estadística, no existe ninguna ocupación en el catálogo curado cuya etiqueta (`preferredLabel`) contenga coincidencia léxica directa ni función compartida suficientemente estrecha como para justificar una correspondencia. El catálogo CNO-11 disponible no incluye ningún epígrafe que mencione "marketing", "publicidad", "relaciones públicas", "encuestas", "censos", "producto" (en contexto de gestión comercial), "eventos", "medios de comunicación", "investigación de mercados" ni "trabajos de campo".

---

## 2. Salidas sin correspondencia suficiente (rechazadas)

Las 12 salidas profesionales de TodoFP **no tienen** un equivalente válido en el catálogo `data/curated/occupations.json`. Todas las sustituciones posibles se basan exclusivamente en proximidad comercial, mediática o estadística y, por tanto, se rechazan según el criterio del contrato.

| #   | Salida TodoFP                                                                 | Código CNO candidato | Etiqueta exacta del catálogo                                              | Base del vínculo                                                                         | Motivo del rechazo                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `"agente de encuestas y censos"`                                              | 4113                 | "Empleados de oficina de servicios estadísticos, financieros y bancarios" | Proximidad estadística: encuestas y censos generan datos estadísticos.                   | La etiqueta CNO cubre servicios financieros y bancarios; el vínculo con encuestas/censos es puramente temático-estadístico, sin coincidencia léxica ni funcional demostrable en la definición de 4113. Se rechaza por **mera proximidad estadística**.                                               |
| 2   | `"asistente del jefe o jefa de producto"`                                     | 2640                 | "Profesionales de ventas técnicas y médicas (excepto las TIC)"            | Proximidad comercial: gestión de producto vinculada a ventas técnicas.                   | Ningún epígrafe CNO menciona "producto" en contexto de marketing. 2640 se centra en ventas técnicas/médicas; no existe cobertura para asistencia de gestión de producto. Se rechaza por **mera proximidad comercial**.                                                                               |
| 3   | `"auxiliar de medios en empresas de publicidad"`                              | 5492                 | "Promotores de venta"                                                     | Proximidad comercial/publicitaria: medios publicitarios vinculados a promoción de venta. | La etiqueta "promotores de venta" se limita a promoción presencial; no cubre planificación de medios, compra de espacios ni gestión publicitaria. Se rechaza por **mera proximidad comercial/mediática**.                                                                                            |
| 4   | `"codificador o codificadora de datos para investigaciones de mercados"`      | 4301                 | "Grabadores de datos"                                                     | Proximidad estadística: codificación de datos para investigación de mercados.            | "Grabadores de datos" (4301) implica captura mecánica; la codificación para investigación incluye clasificación analítica y tabulación especializada. El vínculo es estadístico-funcional, no léxico. Se rechaza por **mera proximidad estadística**.                                                |
| 5   | `"controlador o controladora de cursaje o emisión en medios de comunicación"` | 5420                 | "Operadores de telemarketing"                                             | Proximidad mediática: control de emisión en medios de comunicación.                      | "Operadores de telemarketing" se centra en venta telefónica; el control de emisión (TV/radio/publicidad) no tiene cobertura en este epígrafe ni en ninguno del catálogo. Se rechaza por **mera proximidad mediática**.                                                                               |
| 6   | `"inspector o inspectora de encuestadores"`                                   | 4301                 | "Grabadores de datos"                                                     | Proximidad estadística: supervisión de encuestadores vinculada a verificación de datos.  | "Grabadores de datos" no incluye supervisión de personal ni control de calidad de encuesta. El único vínculo es el dato recogido. Se rechaza por **mera proximidad estadística**.                                                                                                                    |
| 7   | `"organizador u organizadora de eventos de marketing y comunicación"`         | 3724                 | "Monitores de actividades recreativas y de entretenimiento"               | Proximidad comercial/de entretenimiento: eventos de marketing como actividad organizada. | "Monitores de actividades recreativas y de entretenimiento" cubre ocio, no eventos comerciales/promocionales. No existe "organizadores de eventos" en el catálogo. Se rechaza por **mera proximidad comercial/de entretenimiento**.                                                                  |
| 8   | `"técnico o técnica de marketing"`                                            | 3510                 | "Agentes y representantes comerciales"                                    | Proximidad comercial: marketing como actividad comercial/promocional.                    | La etiqueta "agentes y representantes comerciales" se limita a ventas; el marketing incluye investigación, estrategia y planificación no cubiertas. Se rechaza por **mera proximidad comercial**.                                                                                                    |
| 9   | `"técnico o técnica en estudios de mercado y opinión pública"`                | 4113                 | "Empleados de oficina de servicios estadísticos, financieros y bancarios" | Proximidad estadística: estudios de mercado basados en datos estadísticos.               | La etiqueta se extiende a financiero y bancario; no menciona "estudios de mercado" ni "opinión pública". El procesamiento estadístico no equivale a investigación de mercados. Se rechaza por **mera proximidad estadística**.                                                                       |
| 10  | `"técnico o técnica en publicidad"`                                           | 5492                 | "Promotores de venta"                                                     | Proximidad comercial: publicidad como promoción.                                         | "Promotores de venta" no cubre creación de campañas, diseño creativo ni estrategia publicitaria. No existe "publicitario" ni "especialista en medios" en el catálogo. Se rechaza por **mera proximidad comercial/mediática**.                                                                        |
| 11  | `"técnico o técnica en relaciones públicas"`                                  | 4411                 | "Empleados de información al usuario"                                     | Proximidad funcional: RR.PP. como información al público.                                | "Información al usuario" se centra en atención/orientación básica; las relaciones públicas incluyen gestión de imagen, comunicación estratégica y planificación. Se rechaza por **mera proximidad funcional/comunicativa** (no comercial/mediática directa, pero insuficiente para correspondencia). |
| 12  | `"técnico o técnica en trabajos de campo"`                                    | 4113                 | "Empleados de oficina de servicios estadísticos, financieros y bancarios" | Proximidad estadística: trabajos de campo como fuente de datos estadísticos.             | La etiqueta CNO es de oficina; los trabajos de campo son externos. El vínculo estadístico no sostiene una correspondencia sin cobertura explícita en el epígrafe. Se rechaza por **mera proximidad estadística**.                                                                                    |

### Nota metodológica sobre los rechazos

Todas las sustituciones propuestas como candidatos se descartan porque el único fundamento es la pertenencia al mismo ámbito **comercial** (salidas 2, 3, 7, 8, 10), **mediático** (salidas 3, 5, 10) o **estadístico** (salidas 1, 4, 6, 9, 12). La salida 11 (relaciones públicas) se descarta por insuficiencia funcional. El contrato exige rechazar estas sustituciones y no admitir correspondencias basadas exclusivamente en dicha proximidad.

---

## 3. Resumen cuantitativo

| Métrica                                 | Valor                                              |
| --------------------------------------- | -------------------------------------------------- |
| Salidas de TodoFP (COM01S)              | 12                                                 |
| Vinculadas a código CNO curado          | 0                                                  |
| Rechazadas (sin candidato viable)       | 12                                                 |
| Códigos CNO evaluados como candidatos   | 8 (2640, 3510, 3724, 4113, 4301, 4411, 5420, 5492) |
| Códigos CNO únicos finalmente asignados | 0                                                  |

---

## 4. Notas metodológicas

1. **Conservadurismo estricto:** Solo se utilizan `occupationId` que aparecen en `data/curated/occupations.json` con `reviewStatus` cualquiera (approved, draft o rejected). No se inventan códigos ni se crean entradas nuevas.
2. **Criterio de emparejamiento:** Se prima la equivalencia léxica exacta. Dado que ningún epígrafe CNO-11 curado contiene "marketing", "publicidad", "relaciones públicas", "encuestas", "censos", "producto" (en contexto de gestión de producto), "eventos", "investigación de mercados" ni "trabajos de campo", no existe cobertura léxica directa.
3. **Rechazo de proximidad:** Siguiendo el contrato, se rechazan todas las sustituciones basadas en **mera proximidad comercial, mediática o estadística**, que son las únicas vías de vínculo posibles con el catálogo actual.
4. **Fuente del catálogo:** Todos los `occupationId`, `classificationCode` y `preferredLabel` provienen únicamente de `data/curated/occupations.json` (v1.0.0).
5. **Fuente de las salidas:** Cita literal de TodoFP (sección 1), familia "Marketing y Publicidad" (Técnico Superior), consultada el 2026-08-13.

---

_Documento generado por worker NAN (DeepSeek). No modifica datos curados. Solo lectura validada de `data/curated/occupations.json` y `analysis/fp_coverage_batch_parallel_2/sources/COM01S.txt`._
