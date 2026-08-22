# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**. Esta memoria responde por separado a los siete criterios de la categoría.

## Resumen

SALIDA CyL conecta Formación Profesional y ocupaciones en los dos sentidos. Una persona puede partir de un ciclo para consultar salidas y ofertas relacionadas, o partir de una ocupación para localizar la FP que conduce a ella. Cada relación publicada conserva fuente, fecha y límites. La consulta no requiere cuenta y el producto no crea perfiles.

## 1. Utilidad

El producto responde a dos preguntas concretas: «¿en qué puedo trabajar con mi FP?» y «¿qué FP me lleva a esta ocupación?». Permite consultar 187 ciclos oficiales y 502 grupos primarios CNO-11. La ficha reúne salidas oficiales, relaciones revisadas, ofertas de la instantánea, centros, modalidades y contexto territorial, y separa la evidencia formativa de la demanda laboral.

La cobertura congelada contiene 104 cualificaciones distintas, 121 claves de modalidad y 248 relaciones FP-ocupación aprobadas. La cifra describe el conjunto revisado publicado, no el universo de relaciones posibles.

## 2. Valor económico

SALIDA CyL reduce el tiempo necesario para localizar y contrastar información que suele estar repartida entre formación, empleo y estadísticas públicas. Permite comparar rutas formativas antes de invertir tiempo y dirige al centro, oferta o fuente oficial para continuar la decisión.

Las referencias de cotización de EDUCAbase se muestran con su ámbito estadístico. No se convierten en salario esperado, probabilidad de empleo ni promesa individual. La sección «Para centros y administraciones» describe usos posibles sin atribuir acuerdos, ahorros o resultados que no estén medidos.

## 3. Valor público y social

La orientación es pública, gratuita y usable sin registro, también desde un móvil. La aplicación muestra dónde estudiar, la distribución de centros, modalidades y contexto provincial para que una persona pueda comparar opciones en Castilla y León. Distingue el lugar del centro, la población municipal y los contratos provinciales de cualquier afirmación sobre la residencia, la demanda de una ocupación o el futuro laboral de una persona.

## 4. Originalidad e innovación

El núcleo es una relación bidireccional FP ↔ ocupación con evidencia trazable, cobertura visible y descargas JSON y CSV bajo licencia abierta. Las relaciones no revisadas permanecen pendientes; el sistema no las completa por similitud ni con texto generado.

La referencia pública localizada de 2022 documenta una aplicación web de oferta de FP. Ese registro no permite concluir que no existieran funcionalidades no documentadas. La comparación se limita a lo que consta públicamente: SALIDA CyL añade el recorrido bidireccional, la revisión por relación, el contexto de fuentes y un grafo derivado verificable.

## 5. Variedad de datasets del Portal de Datos Abiertos de la Junta

Los ocho conjuntos regionales tienen un uso visible en la interfaz y una copia normalizada en el snapshot `20260822021233066-9d8fa948959b`:

| Dataset                            | Uso visible                                  |
| ---------------------------------- | -------------------------------------------- |
| Oferta de estudios de FP           | ciclos, centros y modalidades                |
| Ofertas de empleo                  | ofertas relacionadas y requisitos publicados |
| Formación del ECYL                 | alternativas formativas                      |
| Certificados de profesionalidad    | rutas complementarias                        |
| Convocatorias de Empleo Público    | procesos con plazo abierto                   |
| Contratos realizados por provincia | contexto laboral agregado                    |
| Registro de municipios             | población del lugar de estudio               |
| Directorio de Centros Docentes     | distribución territorial                     |

Se combinan con CNO-11, TodoFP, BOE, SEPE y las tablas de inserción de EDUCAbase. Cada fuente conserva su ámbito para impedir conclusiones que los datos no sostienen.

## 6. Facilidad de uso y accesibilidad

La portada pide primero el punto de partida y ofrece un único formulario principal. Los selectores funcionan con teclado, los estados sin resultados explican qué falta y los controles mantienen foco visible. Los recorridos principales comprueban escritorio y móvil, overflow, red, consola y Axe. La declaración de accesibilidad distingue estas comprobaciones de una certificación formal y conserva sus límites.

## 7. Calidad técnica

La ingesta valida esquemas y genera recursos inmutables bajo `/data/v1/`. El manifest del snapshot publica recuentos, fechas, hashes SHA-256 y estado de calidad. El grafo derivado conserva fuente por relación y descargas JSON y CSV. Una actualización inválida no sustituye la copia válida anterior. El freeze queda ligado al commit `e41c5394d71c1324fe8a3e5d12a4a6f76793eaa2`; la muestra independiente vigente sigue pendiente de comprobación viva.

## Límites declarados

- Las 248 relaciones cubren 104 cualificaciones y 121 modalidades; no representan todas las relaciones posibles.
- Las 38 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas y forman una unión de IDs; no representan todo el mercado laboral.
- Los contratos provinciales aportan contexto agregado, no demanda por ocupación.
- La población municipal describe el lugar de estudio, no la residencia del alumnado.
- Las bases de cotización no predicen salario, empleo ni residencia.
- El despliegue público, la recaptura de evidencia y cualquier afirmación de adopción o piloto siguen pendientes.

## Acceso y verificabilidad

- Producto público: <https://salida-cyl.157-90-22-40.sslip.io/>
- Fuentes y metodología: <https://salida-cyl.157-90-22-40.sslip.io/metodologia>
- Accesibilidad: <https://salida-cyl.157-90-22-40.sslip.io/accesibilidad>
- Datos derivados: <https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos>
- Manifiesto: <https://salida-cyl.157-90-22-40.sslip.io/data/v1/manifest.json>
- Evidencia técnica: [technical-evidence.md](technical-evidence.md)
