# Memoria de candidatura: SALIDA CyL

Candidatura al [X Concurso de Datos Abiertos de Castilla y León](https://datosabiertos.jcyl.es/web/es/concurso-datos-abiertos/concurso-datos-abiertos.html), categoría **Productos y Servicios**.

## Resumen

SALIDA CyL convierte datos públicos dispersos en una decisión formativa y laboral. Responde «¿en qué puedo trabajar con mi FP?» y «¿qué FP me lleva a esta ocupación?». La persona puede empezar en un ciclo o en una ocupación, consultar relaciones revisadas, contrastar ofertas de una instantánea y localizar centros, modalidades y contexto territorial. Cuando la evidencia no basta, la aplicación deja la relación pendiente y lo explica en lugar de inventarla.

La referencia pública de esta memoria es el producto `cab7a3b9dbdf8d2922506e9207242d537347d720`, publicado como `v2026.08.25-candidate.2`. Pages y VPS devuelven ese mismo SHA en `version.json`. El paquete visual automatizado está completo: 13/13 capturas recapturadas el 26 de agosto de 2026 desde un contexto anónimo y ligadas a ese commit.

## 1. Utilidad

SALIDA CyL ordena una decisión que normalmente obliga a saltar entre FP, ocupaciones, empleo y centros. Permite consultar 187 ciclos oficiales y 502 grupos primarios CNO-11. La ficha separa salidas oficiales, relaciones FP-ocupación aprobadas, ofertas alcanzadas, centros y fuentes.

Dos recorridos muestran el valor en pocos segundos: [IFC02S, Desarrollo de Aplicaciones Multiplataforma](https://salida-cyl.157-90-22-40.sslip.io/desde-fp/IFC02S), lleva a la ocupación revisada CNO 3820; el recorrido inverso [Programadores informáticos, CNO 3820](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A3820) devuelve la FP relacionada. La cobertura congelada contiene 264 relaciones FP-ocupación, 113 cualificaciones distintas y 130 claves de modalidad. El SEPE aporta 116 de 116 páginas de ocupación consultadas para `2026-07`.

## 2. Valor económico

El valor económico está en reducir el tiempo y la incertidumbre antes de elegir una matrícula, desplazamiento o ruta profesional. La aplicación reúne en una misma decisión la formación disponible, el vínculo ocupacional que ha pasado revisión, la oferta publicada que puede alcanzarse con seguridad y el centro donde continuar. Las referencias de EDUCAbase ayudan a comparar información oficial antes de invertir recursos, pero conservan su ámbito estadístico y no se presentan como resultado individual.

Ese límite protege la decisión: SALIDA CyL no convierte una tabla agregada en una promesa de ingresos ni atribuye ahorros, contratación o impacto que todavía no hayan sido medidos.

## 3. Valor público y social

Es gratuito, no requiere cuenta y funciona en móvil y escritorio. Cualquier persona puede explorar opciones de Castilla y León, comparar centros por provincia y localidad y abrir las fuentes públicas. La aplicación no crea perfiles: no guarda búsquedas, respuestas ni resultados. Distingue el lugar del centro, la población municipal y los contratos provinciales para no convertir contexto territorial en una afirmación sobre la residencia o el futuro de una persona.

## 4. Originalidad e innovación

La unidad de valor es un grafo bidireccional FP ↔ ocupación revisado relación por relación. Cada vínculo conserva fuente, fecha, estado y límites; los vínculos no revisados permanecen fuera de las afirmaciones. El sistema aplica un criterio fail-closed: una coincidencia débil no se publica por similitud ni por texto generado. El resultado se devuelve como datos abiertos derivados en JSON y CSV, con integridad verificable. La innovación está en convertir un catálogo disperso en una relación navegable y auditable, manteniendo visible la incertidumbre.

## 5. Variedad de datasets

Los ocho conjuntos regionales de la Junta tienen un uso visible: oferta de estudios de FP, ofertas de empleo, formación del ECYL, certificados de profesionalidad, convocatorias de empleo público, contratos por provincia, registro de municipios y directorio de centros docentes. Se combinan con CNO-11, TodoFP, BOE, SEPE y EDUCAbase. La metodología conserva el ámbito de cada fuente y la [página de datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos) permite descargar el grafo revisado.

## 6. Facilidad de uso y accesibilidad

La portada ofrece un único punto de partida y mantiene el recorrido principal corto. Los selectores funcionan con teclado, el foco es visible y los estados vacíos explican qué está disponible, qué falta revisar y qué acción puede realizarse. Los recorridos de escritorio y móvil comprobaron overflow, red, consola y Axe. El paquete de evidencia A4 contiene 13/13 capturas actuales, con hashes y provenance del mismo commit. La declaración de accesibilidad diferencia estas comprobaciones de una certificación formal.

## 7. Calidad técnica

La publicación usa un snapshot inmutable: `20260822085631889-7bbe69380f6d`, manifest SHA-256 `92afc80f2b839ed95def95bc90bdd3b6ad3a1363fb12904f7b109fafc92b2f18`, 21 recursos, fechas, recuentos y hashes por recurso. Una actualización inválida no sustituye la copia válida. La revisión independiente registra 15 PASS y 0 FAIL sobre 15 relaciones, sin presentarse como auditoría exhaustiva. La referencia técnica incluye pruebas unitarias, 156 pruebas E2E Chromium, build, lint, licencia, formato y el run de Pages `32896247977`; Pages y VPS sirven el mismo manifest y el mismo commit.

## Recorrido para el jurado

1. Abrir [IFC02S](https://salida-cyl.157-90-22-40.sslip.io/desde-fp/IFC02S) y seguir una salida revisada.
2. Abrir [CNO 3820](https://salida-cyl.157-90-22-40.sslip.io/desde-ocupacion/occupation%3Acno11%3A3820) para ver el recorrido inverso.
3. Abrir [Datos abiertos](https://salida-cyl.157-90-22-40.sslip.io/datos-abiertos) y comprobar la descarga, las fuentes y la trazabilidad.

Las 38 ofertas alcanzadas pertenecen a una copia fechada de 1.058 ofertas y no representan todo el mercado. Los contratos provinciales son contexto agregado; las tablas de ingresos no predicen una situación individual; no se afirma adopción o impacto sin evidencia humana. La identidad, el consentimiento y la autorización de presentación permanecen fuera del repositorio y requieren aprobación humana explícita.
