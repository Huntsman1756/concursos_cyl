# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**. Esta memoria responde por separado a los siete criterios de la categoría.

## Resumen

SALIDA CyL conecta Formación Profesional y ocupaciones en los dos sentidos. Una persona puede partir de un ciclo para consultar salidas y ofertas relacionadas, o partir de una ocupación para localizar la FP que conduce a ella. Cada relación publicada conserva fuente, fecha y límites. La consulta no requiere cuenta y el producto no crea perfiles.

## 1. Utilidad

El producto responde a dos preguntas concretas: «¿en qué puedo trabajar con mi FP?» y «¿qué FP me lleva a esta ocupación?». Permite consultar 187 ciclos oficiales y 502 grupos primarios CNO-11. La ficha reúne salidas oficiales, relaciones revisadas, ofertas de la instantánea, centros, modalidades y contexto territorial, y separa la evidencia formativa de la demanda laboral.

La cobertura congelada contiene 113 cualificaciones distintas, 130 claves de modalidad y 264 relaciones FP-ocupación aprobadas. La cifra describe el conjunto revisado publicado, no el universo de relaciones posibles.

La evidencia laboral específica del SEPE añade 116 de 116 grupos CNO consultados para `2026-07` (116 páginas publicadas y 0 respuestas explícitas de «sin documento»). Son contratos y paro registrado administrativos; la cobertura no equivale a vacantes, salario ni predicción individual.

## 2. Valor económico

SALIDA CyL reduce el tiempo necesario para localizar y contrastar información que suele estar repartida entre formación, empleo y estadísticas públicas. Permite comparar rutas formativas antes de invertir tiempo y dirige al centro, oferta o fuente oficial para continuar la decisión.

Las referencias de cotización de EDUCAbase se muestran con su ámbito estadístico. No se convierten en salario esperado, probabilidad de empleo ni promesa individual. La sección «Para centros y administraciones» describe usos posibles sin atribuir acuerdos, ahorros o resultados que no estén medidos.

## 3. Valor público y social

La orientación es pública, gratuita y usable sin registro, también desde un móvil. La aplicación muestra dónde estudiar, los centros agrupados por provincia y localidad, las modalidades y el contexto provincial para que una persona pueda comparar opciones en Castilla y León. Los recuentos y listados se leen directamente de las copias publicadas; las coordenadas técnicas completas quedan como información opcional y no se presentan como un mapa ni como cálculo de desplazamientos. Distingue el lugar del centro, la población municipal y los contratos provinciales de cualquier afirmación sobre la residencia, la demanda de una ocupación o el futuro laboral de una persona.

## 4. Originalidad e innovación

El núcleo es una relación bidireccional FP ↔ ocupación con evidencia trazable, cobertura visible y descargas JSON y CSV bajo licencia abierta. Las relaciones no revisadas permanecen pendientes; el sistema no las completa por similitud ni con texto generado.

La referencia pública localizada de 2022 documenta una aplicación web de oferta de FP. Ese registro no permite concluir que no existieran funcionalidades no documentadas. La comparación se limita a lo que consta públicamente: SALIDA CyL añade el recorrido bidireccional, la revisión por relación, el contexto de fuentes y un grafo derivado verificable.

## 5. Variedad de datasets del Portal de Datos Abiertos de la Junta

Los ocho conjuntos regionales tienen un uso visible en la interfaz y una copia normalizada en el snapshot `20260822085631889-7bbe69380f6d`:

| Dataset                            | Uso visible                                                         |
| ---------------------------------- | ------------------------------------------------------------------- |
| Oferta de estudios de FP           | ciclos, centros y modalidades                                       |
| Ofertas de empleo                  | ofertas relacionadas y requisitos publicados                        |
| Formación del ECYL                 | alternativas formativas                                             |
| Certificados de profesionalidad    | rutas complementarias                                               |
| Convocatorias de Empleo Público    | procesos con plazo abierto                                          |
| Contratos realizados por provincia | contexto laboral agregado                                           |
| Registro de municipios             | población del lugar de estudio                                      |
| Directorio de Centros Docentes     | listados por provincia y localidad; coordenadas técnicas opcionales |

Se combinan con CNO-11, TodoFP, BOE, SEPE y las tablas de inserción de EDUCAbase. Cada fuente conserva su ámbito para impedir conclusiones que los datos no sostienen.

## 6. Facilidad de uso y accesibilidad

La portada pide primero el punto de partida y ofrece un único formulario principal. Los selectores funcionan con teclado, los estados sin resultados explican qué falta y los controles mantienen foco visible. Los recorridos principales comprueban escritorio y móvil, overflow, red, consola y Axe. La declaración de accesibilidad distingue estas comprobaciones de una certificación formal y conserva sus límites.

## 7. Calidad técnica

La ingesta valida esquemas y genera recursos inmutables bajo `/data/v1/`. El manifest del snapshot publica recuentos, fechas, hashes SHA-256 y estado de calidad. El grafo derivado conserva fuente por relación y descargas JSON y CSV. Una actualización inválida no sustituye la copia válida anterior. El freeze queda ligado al commit `94bad9123906efd0d582eb599b8c4d190004c91f`; la muestra independiente vigente registra 15 PASS y 0 FAIL sobre 15 relaciones, mientras que las otras 249 quedan sin muestrear. El resultado no es una auditoría exhaustiva.

## Límites declarados

- Las 264 relaciones cubren 113 cualificaciones y 130 modalidades; no representan todas las relaciones posibles.
- Las 38 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas y forman una unión de IDs; no representan todo el mercado laboral.
- Los contratos provinciales aportan contexto agregado, no demanda por ocupación.
- La población municipal describe el lugar de estudio, no la residencia del alumnado.
- Las bases de cotización no predicen salario, empleo ni residencia.
- La publicación y las capturas de este freeze siguen pendientes. Las capturas anteriores son históricas y no verifican la versión candidata. Cualquier afirmación de adopción o piloto sigue pendiente de evidencia humana.

## Acceso y verificabilidad

- Producto público: <https://salida-cyl.157-90-22-40.sslip.io/>
- Fuentes y metodología: <https://salida-cyl.157-90-22-40.sslip.io/metodologia>
- Accesibilidad: <https://salida-cyl.157-90-22-40.sslip.io/accesibilidad>
- Datos derivados: <https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos>
- Manifiesto: <https://salida-cyl.157-90-22-40.sslip.io/data/v1/manifest.json>
- Evidencia técnica: [technical-evidence.md](technical-evidence.md)
